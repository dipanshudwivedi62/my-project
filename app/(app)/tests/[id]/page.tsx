import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Download, FileJson, MapPin } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { getAuditTrail, getTest } from '@/lib/queries'
import { getKit } from '@/lib/kits'
import { keyFingerprint } from '@/lib/evidence'
import type { Analysis, TestResult } from '@/lib/analysis'
import { formatUtc } from '@/lib/utils'
import { AnalysisSummary } from '@/components/analysis-summary'
import { ResultBadge } from '@/components/result-badge'
import { RoiImage } from '@/components/roi-image'
import { VerifyNow } from '@/components/verify-now'
import { buttonClass, Card, CardHeader } from '@/components/ui'

const AUDIT_LABELS: Record<string, string> = {
  CREATED: 'Record created and signed',
  VERIFIED: 'Integrity check run',
  EXPORTED: 'Evidence bundle exported',
}

export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession()
  const { id } = await params
  const test = await getTest(session.user.id, id)
  if (!test) notFound()
  const audit = await getAuditTrail(session.user.id, test.id)

  const kit = getKit(test.kitType)
  const { measurements, ...features } = test.features
  const analysis: Analysis = {
    ...features,
    result: test.result as TestResult,
    confidence: test.confidence,
    quality: test.quality,
  }

  const metadata: [string, React.ReactNode][] = [
    ['Case', test.caseNumber],
    ['Subject', test.subjectRef],
    ['Kit', kit ? `${kit.name} — ${kit.targets}` : test.kitType],
    ['Operator', `${test.operatorName} (${test.operatorEmail})`],
    ['Captured', formatUtc(test.capturedAt)],
    ['Sealed', formatUtc(test.createdAt)],
    [
      'Location',
      test.latitude !== null && test.longitude !== null ? (
        <a
          key="loc"
          href={`https://www.openstreetmap.org/?mlat=${test.latitude}&mlon=${test.longitude}#map=17/${test.latitude}/${test.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-primary hover:underline"
        >
          <MapPin className="size-3.5" aria-hidden="true" />
          {test.latitude.toFixed(5)}, {test.longitude.toFixed(5)}
          {test.locationAccuracy !== null && <span className="text-muted"> ±{test.locationAccuracy} m</span>}
        </a>
      ) : (
        <span key="loc" className="text-muted">Not recorded</span>
      ),
    ],
  ]

  const evidence: [string, string][] = [
    ['Image SHA-256', test.imageHash],
    ['Record SHA-256', test.recordHash],
    ['Ed25519 signature', test.signature],
    ['Key fingerprint', keyFingerprint(test.publicKey)],
    ['Algorithm', test.algorithmVersion],
  ]

  return (
    <>
      <div className="flex flex-col gap-4">
        <Link href="/" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All tests
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{test.id}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
              <ResultBadge result={test.result} />
              <span>
                {test.caseNumber} · {test.subjectRef}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={test.imageData} download={`${test.id}.jpg`} className={buttonClass('secondary')}>
              <Download className="size-4" aria-hidden="true" />
              Evidence image
            </a>
            <a href={`/api/tests/${test.id}/export`} className={buttonClass('secondary')}>
              <FileJson className="size-4" aria-hidden="true" />
              Signed record
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Evidence photo" description="Regions used for calibration and colour reading." />
            <div className="p-5">
              <RoiImage
                src={test.imageData}
                width={measurements.width}
                height={measurements.height}
                whiteRoi={measurements.whiteRoi}
                reactionRoi={measurements.reactionRoi}
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Analysis" description="Presumptive screening — confirm with laboratory testing." />
            <div className="p-5">
              <AnalysisSummary analysis={analysis} measurements={measurements} kitName={kit?.name ?? test.kitType} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Record" />
            <dl className="flex flex-col divide-y divide-border px-5">
              {metadata.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="shrink-0 text-muted">{label}</dt>
                  <dd className="text-right text-foreground">{value}</dd>
                </div>
              ))}
              {test.notes && (
                <div className="flex flex-col gap-1 py-3 text-sm">
                  <dt className="text-muted">Notes</dt>
                  <dd className="text-foreground text-pretty">{test.notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Evidence integrity" description="Hashes and signature sealed at submission." />
            <div className="flex flex-col gap-5 p-5">
              <dl className="flex flex-col gap-3">
                {evidence.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="font-mono text-xs break-all text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
              <VerifyNow testId={test.id} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Chain of custody" description="Every access to this record is logged." />
            <ol className="flex flex-col gap-4 p-5">
              {audit.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span className="text-foreground">
                      {AUDIT_LABELS[event.action] ?? event.action}
                      {event.action === 'VERIFIED' && (
                        <span className={event.detail?.passed ? 'text-success' : 'text-danger'}>
                          {event.detail?.passed ? ' — passed' : ' — failed'}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted">{formatUtc(event.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  )
}
