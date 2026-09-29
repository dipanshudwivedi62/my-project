'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { analyze, collectMeasurements, type Roi } from '@/lib/analysis'
import { getKit, KITS, type KitId } from '@/lib/kits'
import type { DecodedImage } from '@/lib/image-client'
import { createFieldTest } from '@/app/actions/tests'
import { cn } from '@/lib/utils'
import { DetailsStep, type TestDetails } from './details-step'
import { CaptureStep, type CapturedImage } from './capture-step'
import { ReviewStep, type GeoFix } from './review-step'

const STEPS = ['Case details', 'Capture & analyse', 'Review & seal'] as const

export function NewTestWizard({ operatorName }: { operatorName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [details, setDetails] = useState<TestDetails>({
    kitType: KITS[0].id,
    caseNumber: '',
    subjectRef: '',
    notes: '',
  })
  const [image, setImage] = useState<CapturedImage | null>(null)
  const [whiteRoi, setWhiteRoi] = useState<Roi>({ x: 0.3, y: 0.5, size: 0.06 })
  const [reactionRoi, setReactionRoi] = useState<Roi>({ x: 0.7, y: 0.5, size: 0.06 })
  const [location, setLocation] = useState<GeoFix | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const kit = getKit(details.kitType)!

  const measurements = useMemo(
    () =>
      image
        ? collectMeasurements(image.decoded.pixels, image.decoded.width, image.decoded.height, whiteRoi, reactionRoi)
        : null,
    [image, whiteRoi, reactionRoi],
  )
  const analysis = useMemo(() => (measurements ? analyze(kit, measurements) : null), [kit, measurements])

  function onImage(decoded: DecodedImage, hash: string, rois?: { white: Roi; reaction: Roi }) {
    setImage({ decoded, hash, capturedAt: new Date().toISOString() })
    if (rois) {
      setWhiteRoi(rois.white)
      setReactionRoi(rois.reaction)
    }
  }

  function submit() {
    if (!image || !measurements) return
    setError(null)
    startTransition(async () => {
      const response = await createFieldTest({
        kitType: details.kitType as KitId,
        caseNumber: details.caseNumber,
        subjectRef: details.subjectRef,
        notes: details.notes || undefined,
        imageDataUrl: image.decoded.dataUrl,
        capturedAt: image.capturedAt,
        location,
        measurements,
      })
      if (response.ok) {
        router.push(`/tests/${response.id}`)
      } else {
        setError(response.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="grid grid-cols-3 gap-2" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li key={label} aria-current={index === step ? 'step' : undefined} className="flex flex-col gap-2">
            <span className={cn('h-1 rounded-full', index <= step ? 'bg-primary' : 'bg-surface-2')} />
            <span className={cn('text-xs sm:text-sm', index === step ? 'text-foreground' : 'text-muted')}>
              <span className="font-mono">{index + 1}.</span> {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <DetailsStep
          value={details}
          onChange={setDetails}
          operatorName={operatorName}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <CaptureStep
          kit={kit}
          image={image}
          whiteRoi={whiteRoi}
          reactionRoi={reactionRoi}
          onWhiteRoi={setWhiteRoi}
          onReactionRoi={setReactionRoi}
          onImage={onImage}
          analysis={analysis}
          measurements={measurements}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && image && analysis && (
        <ReviewStep
          kit={kit}
          details={details}
          operatorName={operatorName}
          image={image}
          analysis={analysis}
          location={location}
          onLocation={setLocation}
          pending={pending}
          error={error}
          onBack={() => setStep(1)}
          onSubmit={submit}
        />
      )}
    </div>
  )
}
