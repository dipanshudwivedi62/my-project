import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditEvent } from '@/lib/db/schema'
import { keyFingerprint } from '@/lib/evidence'
import { getTest } from '@/lib/queries'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  const row = await getTest(session.user.id, id)
  if (!row) return new Response('Not found', { status: 404 })

  await db.insert(auditEvent).values({
    testId: row.id,
    userId: session.user.id,
    action: 'EXPORTED',
    detail: { format: 'evidence-json' },
  })

  const bundle = {
    record: JSON.parse(row.recordJson),
    canonicalRecord: row.recordJson,
    recordHash: { algorithm: 'SHA-256', value: row.recordHash },
    signature: {
      algorithm: 'Ed25519',
      value: row.signature,
      publicKey: row.publicKey,
      publicKeyFormat: 'SPKI DER, base64',
      fingerprint: keyFingerprint(row.publicKey),
    },
  }

  return new Response(JSON.stringify(bundle, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${row.id}.evidence.json"`,
      'Cache-Control': 'no-store',
    },
  })
}
