'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditEvent, fieldTest } from '@/lib/db/schema'
import { ALGORITHM_VERSION, analyze, type TestResult } from '@/lib/analysis'
import { getKit, KIT_IDS } from '@/lib/kits'
import {
  canonicalize,
  createTestId,
  getSigningKeys,
  parseImageDataUrl,
  sha256Hex,
  signRecord,
  verifyRecordSignature,
} from '@/lib/evidence'
import { getTest } from '@/lib/queries'

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

const channel = z.number().min(0).max(255)
const rgb = z.tuple([channel, channel, channel])
const region = z.object({ mean: rgb, std: z.number().min(0).max(255), clipped: z.number().min(0).max(1) })
const roi = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  size: z.number().min(0.005).max(0.5),
})
const measurementsSchema = z.object({
  width: z.number().int().min(64).max(4096),
  height: z.number().int().min(64).max(4096),
  whiteRoi: roi,
  reactionRoi: roi,
  white: region,
  reaction: region,
  sharpness: z.number().min(0).max(1_000_000),
  luminance: z.number().min(0).max(255),
})

const createSchema = z.object({
  kitType: z.enum(KIT_IDS),
  caseNumber: z.string().trim().min(1).max(64),
  subjectRef: z.string().trim().min(1).max(64),
  notes: z.string().trim().max(1000).optional(),
  imageDataUrl: z.string().max(4_000_000),
  capturedAt: z.iso.datetime(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().min(0).max(100_000),
    })
    .nullable(),
  measurements: measurementsSchema,
})

export type CreateTestInput = z.infer<typeof createSchema>

export async function createFieldTest(
  input: CreateTestInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await getUser()
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Some test details are missing or invalid.' }
  const data = parsed.data

  const image = parseImageDataUrl(data.imageDataUrl)
  if (!image) return { ok: false, error: 'The evidence image could not be read.' }
  const kit = getKit(data.kitType)!

  // The server re-derives the classification from the submitted measurements
  // instead of trusting a client-reported result.
  const analysis = analyze(kit, data.measurements)
  const id = createTestId()
  const imageHash = sha256Hex(image.bytes)
  const { publicKey } = getSigningKeys()

  const record = {
    schema: 'fieldtrace.evidence/1',
    id,
    algorithmVersion: ALGORITHM_VERSION,
    operator: { id: user.id, name: user.name, email: user.email },
    caseNumber: data.caseNumber,
    subjectRef: data.subjectRef,
    kitType: kit.id,
    notes: data.notes || null,
    capturedAt: data.capturedAt,
    submittedAt: new Date().toISOString(),
    location: data.location,
    image: { mime: image.mime, sha256: imageHash, bytes: image.bytes.length },
    measurements: data.measurements,
    analysis: {
      result: analysis.result,
      confidence: analysis.confidence,
      bestMatch: analysis.bestMatch,
      calibrated: analysis.calibrated,
      matches: analysis.matches,
      quality: analysis.quality.map((q) => ({ id: q.id, passed: q.passed, value: q.value })),
    },
  }
  const recordJson = canonicalize(record)
  const recordHash = sha256Hex(recordJson)
  const signature = signRecord(recordJson)

  await db.insert(fieldTest).values({
    id,
    userId: user.id,
    operatorName: user.name,
    operatorEmail: user.email,
    caseNumber: data.caseNumber,
    subjectRef: data.subjectRef,
    kitType: kit.id,
    result: analysis.result,
    confidence: analysis.confidence,
    quality: analysis.quality,
    features: {
      measurements: data.measurements,
      calibrated: analysis.calibrated,
      lab: analysis.lab,
      matches: analysis.matches,
      bestMatch: analysis.bestMatch,
      reasons: analysis.reasons,
    },
    notes: data.notes || null,
    latitude: data.location?.latitude ?? null,
    longitude: data.location?.longitude ?? null,
    locationAccuracy: data.location?.accuracy ?? null,
    imageMime: image.mime,
    imageData: data.imageDataUrl,
    imageHash,
    recordJson,
    recordHash,
    signature,
    publicKey,
    algorithmVersion: ALGORITHM_VERSION,
    capturedAt: new Date(data.capturedAt),
  })
  await db.insert(auditEvent).values({
    testId: id,
    userId: user.id,
    action: 'CREATED',
    detail: { result: analysis.result, recordHash },
  })

  revalidatePath('/')
  return { ok: true, id }
}

export type IntegrityCheck = { id: string; label: string; passed: boolean; detail: string }
export type VerificationResult =
  | { found: false; testId: string }
  | {
      found: true
      testId: string
      passed: boolean
      checks: IntegrityCheck[]
      verifiedAt: string
      result: TestResult
    }

export async function verifyFieldTest(
  testId: string,
  uploadedImageHash?: string,
): Promise<VerificationResult> {
  const user = await getUser()
  const id = z.string().trim().toUpperCase().max(40).parse(testId)
  const row = await getTest(user.id, id)
  if (!row) return { found: false, testId: id }

  const checks: IntegrityCheck[] = []
  const image = parseImageDataUrl(row.imageData)
  const storedImageHash = image ? sha256Hex(image.bytes) : ''
  checks.push({
    id: 'image',
    label: 'Evidence image unchanged',
    passed: storedImageHash === row.imageHash,
    detail: 'SHA-256 of the stored image matches the hash sealed at capture.',
  })

  checks.push({
    id: 'record',
    label: 'Record hash matches',
    passed: sha256Hex(row.recordJson) === row.recordHash,
    detail: 'SHA-256 of the canonical record matches the stored record hash.',
  })

  checks.push({
    id: 'signature',
    label: 'Ed25519 signature valid',
    passed: verifyRecordSignature(row.recordJson, row.signature, row.publicKey),
    detail: 'The record was signed by the embedded public key and has not been altered.',
  })

  checks.push({
    id: 'key',
    label: 'Signed by trusted FieldTrace key',
    passed: row.publicKey === getSigningKeys().publicKey,
    detail: 'The signing key matches this deployment’s current evidence key.',
  })

  let record: {
    image?: { sha256?: string }
    caseNumber?: string
    subjectRef?: string
    kitType?: string
    measurements?: z.infer<typeof measurementsSchema>
    analysis?: { result?: string }
  } = {}
  try {
    record = JSON.parse(row.recordJson)
  } catch {}

  checks.push({
    id: 'consistency',
    label: 'Database fields match signed record',
    passed:
      record.image?.sha256 === row.imageHash &&
      record.analysis?.result === row.result &&
      record.caseNumber === row.caseNumber &&
      record.subjectRef === row.subjectRef &&
      record.kitType === row.kitType,
    detail: 'Result, case, subject, kit and image hash in the database equal the signed values.',
  })

  const kit = getKit(row.kitType)
  const measurements = measurementsSchema.safeParse(record.measurements)
  checks.push({
    id: 'reproducible',
    label: 'Classification reproducible',
    passed: !!kit && measurements.success && analyze(kit, measurements.data).result === row.result,
    detail: `Re-running ${row.algorithmVersion} on the sealed measurements yields the same result.`,
  })

  if (uploadedImageHash) {
    checks.push({
      id: 'upload',
      label: 'Uploaded file matches evidence',
      passed: uploadedImageHash.toLowerCase() === row.imageHash,
      detail: 'SHA-256 of the file you provided equals the sealed evidence image hash.',
    })
  }

  const passed = checks.every((c) => c.passed)
  await db.insert(auditEvent).values({
    testId: row.id,
    userId: user.id,
    action: 'VERIFIED',
    detail: { passed, failed: checks.filter((c) => !c.passed).map((c) => c.id) },
  })
  revalidatePath(`/tests/${row.id}`)

  return {
    found: true,
    testId: row.id,
    passed,
    checks,
    verifiedAt: new Date().toISOString(),
    result: row.result as TestResult,
  }
}
