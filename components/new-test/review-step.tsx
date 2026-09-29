'use client'

import { useState } from 'react'
import { LockKeyhole, MapPin } from 'lucide-react'
import type { Analysis } from '@/lib/analysis'
import type { Kit } from '@/lib/kits'
import { ResultBadge } from '@/components/result-badge'
import { Button, Card, CardHeader } from '@/components/ui'
import { shortHash } from '@/lib/utils'
import type { TestDetails } from './details-step'
import type { CapturedImage } from './capture-step'

export type GeoFix = { latitude: number; longitude: number; accuracy: number }

export function ReviewStep({
  kit,
  details,
  operatorName,
  image,
  analysis,
  location,
  onLocation,
  pending,
  error,
  onBack,
  onSubmit,
}: {
  kit: Kit
  details: TestDetails
  operatorName: string
  image: CapturedImage
  analysis: Analysis
  location: GeoFix | null
  onLocation: (fix: GeoFix | null) => void
  pending: boolean
  error: string | null
  onBack: () => void
  onSubmit: () => void
}) {
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'denied'>('idle')
  const [confirmed, setConfirmed] = useState(false)

  function attachLocation() {
    if (!('geolocation' in navigator)) {
      setGeoStatus('denied')
      return
    }
    setGeoStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        })
        setGeoStatus('idle')
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const rows: [string, React.ReactNode][] = [
    ['Case', details.caseNumber],
    ['Subject', details.subjectRef],
    ['Kit', `${kit.name} — ${kit.targets}`],
    ['Operator', operatorName],
    ['Captured', new Date(image.capturedAt).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'],
    ['Image SHA-256', <span key="hash" className="font-mono text-xs break-all">{shortHash(image.hash, 16)}</span>],
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Summary" description="These values are sealed into the signed record." />
        <dl className="flex flex-col divide-y divide-border px-5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-3 text-sm">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right text-foreground">{value}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-3 text-sm">
            <dt className="text-muted">Result</dt>
            <dd className="flex items-center gap-2">
              <ResultBadge result={analysis.result} />
              <span className="font-mono text-muted">{Math.round(analysis.confidence * 100)}%</span>
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title="Location & seal" />
        <div className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">
                {location ? (
                  <span className="font-mono">
                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}{' '}
                    <span className="text-muted">±{location.accuracy} m</span>
                  </span>
                ) : (
                  <span className="text-muted">No GPS location attached</span>
                )}
              </p>
              <Button type="button" variant="secondary" onClick={attachLocation} disabled={geoStatus === 'locating'}>
                <MapPin className="size-4" aria-hidden="true" />
                {geoStatus === 'locating' ? 'Locating…' : location ? 'Refresh' : 'Attach GPS'}
              </Button>
            </div>
            {geoStatus === 'denied' && (
              <p className="text-xs text-warning">Location unavailable — the record will be saved without GPS.</p>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-md border border-border bg-background p-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span className="text-muted text-pretty">
              I performed this test personally and the photo shows the unaltered reacted kit. I understand this is a
              presumptive screening result that requires laboratory confirmation.
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-between gap-2 border-t border-border pt-5">
            <Button type="button" variant="ghost" onClick={onBack} disabled={pending}>
              Back
            </Button>
            <Button type="button" onClick={onSubmit} disabled={!confirmed || pending}>
              <LockKeyhole className="size-4" aria-hidden="true" />
              {pending ? 'Signing…' : 'Seal & submit record'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
