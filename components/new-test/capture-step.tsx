'use client'

import { useRef, useState } from 'react'
import { Camera, FlaskConical } from 'lucide-react'
import type { Analysis, Measurements, Roi } from '@/lib/analysis'
import type { Kit } from '@/lib/kits'
import {
  DEMO_ROIS,
  fileToEvidenceImage,
  generateDemoSample,
  sha256OfDataUrl,
  type DecodedImage,
} from '@/lib/image-client'
import { AnalysisSummary } from '@/components/analysis-summary'
import { RoiImage, type MarkerId } from '@/components/roi-image'
import { Button, Card, CardHeader } from '@/components/ui'
import { cn } from '@/lib/utils'

export type CapturedImage = { decoded: DecodedImage; hash: string; capturedAt: string }

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function CaptureStep({
  kit,
  image,
  whiteRoi,
  reactionRoi,
  onWhiteRoi,
  onReactionRoi,
  onImage,
  analysis,
  measurements,
  onBack,
  onNext,
}: {
  kit: Kit
  image: CapturedImage | null
  whiteRoi: Roi
  reactionRoi: Roi
  onWhiteRoi: (roi: Roi) => void
  onReactionRoi: (roi: Roi) => void
  onImage: (decoded: DecodedImage, hash: string, rois?: { white: Roi; reaction: Roi }) => void
  analysis: Analysis | null
  measurements: Measurements | null
  onBack: () => void
  onNext: () => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [marker, setMarker] = useState<MarkerId>('reaction')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load(task: () => Promise<DecodedImage>, rois?: { white: Roi; reaction: Roi }) {
    setLoading(true)
    setError(null)
    try {
      const decoded = await task()
      onImage(decoded, await sha256OfDataUrl(decoded.dataUrl), rois)
    } catch {
      setError('That image could not be processed. Try another photo.')
    } finally {
      setLoading(false)
    }
  }

  function loadDemo(positive: boolean) {
    const size = DEMO_ROIS.size
    load(() => generateDemoSample(kit, positive), {
      white: { ...DEMO_ROIS.white, size },
      reaction: { ...DEMO_ROIS.reaction, size },
    })
  }

  const activeRoi = marker === 'white' ? whiteRoi : reactionRoi
  const setActiveRoi = marker === 'white' ? onWhiteRoi : onReactionRoi

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader
          title="Evidence photo"
          description="Photograph the reacted kit next to the white reference patch, in even light."
        />
        <div className="flex flex-col gap-4 p-5">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            aria-label="Capture or upload a photo"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) load(() => fileToEvidenceImage(file))
              event.target.value = ''
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => fileInput.current?.click()} disabled={loading}>
              <Camera className="size-4" aria-hidden="true" />
              {image ? 'Retake photo' : 'Take or upload photo'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => loadDemo(true)} disabled={loading}>
              <FlaskConical className="size-4" aria-hidden="true" />
              Demo: positive
            </Button>
            <Button type="button" variant="secondary" onClick={() => loadDemo(false)} disabled={loading}>
              <FlaskConical className="size-4" aria-hidden="true" />
              Demo: negative
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          {image ? (
            <>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium">Region to place</legend>
                <div className="flex flex-wrap items-center gap-2">
                  {(['white', 'reaction'] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={marker === id}
                      onClick={() => setMarker(id)}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-sm transition-colors',
                        marker === id
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border text-muted hover:text-foreground',
                      )}
                    >
                      {id === 'white' ? 'White reference' : 'Reaction well'}
                    </button>
                  ))}
                  <label className="ml-auto flex items-center gap-2 text-sm text-muted">
                    Size
                    <input
                      type="range"
                      min={0.02}
                      max={0.2}
                      step={0.005}
                      value={activeRoi.size}
                      onChange={(e) => setActiveRoi({ ...activeRoi, size: Number(e.target.value) })}
                      className="w-28 accent-primary"
                    />
                  </label>
                </div>
              </fieldset>
              <RoiImage
                src={image.decoded.dataUrl}
                width={image.decoded.width}
                height={image.decoded.height}
                whiteRoi={whiteRoi}
                reactionRoi={reactionRoi}
                activeMarker={marker}
                onPlace={(point) => setActiveRoi({ ...activeRoi, ...point })}
                onNudge={(dx, dy) =>
                  setActiveRoi({ ...activeRoi, x: clamp01(activeRoi.x + dx), y: clamp01(activeRoi.y + dy) })
                }
              />
              <p className="text-xs text-muted">
                Click the image to position the selected region. Arrow keys nudge it (hold Shift for larger steps).
              </p>
            </>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 text-center">
              <Camera className="size-8 text-muted" aria-hidden="true" />
              <p className="text-sm text-foreground">No photo yet</p>
              <p className="max-w-xs text-xs text-muted text-pretty">
                On a phone this opens the rear camera. No kit on hand? Load a demo sample to see the pipeline.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Live analysis" description="White-balanced colour matched against kit references." />
        <div className="flex flex-col gap-5 p-5">
          {analysis && measurements ? (
            <AnalysisSummary analysis={analysis} measurements={measurements} kitName={kit.name} />
          ) : (
            <p className="text-sm text-muted">Capture a photo to run the analysis.</p>
          )}
          <div className="flex justify-between gap-2 border-t border-border pt-5">
            <Button type="button" variant="ghost" onClick={onBack}>
              Back
            </Button>
            <Button type="button" onClick={onNext} disabled={!analysis}>
              Review result
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
