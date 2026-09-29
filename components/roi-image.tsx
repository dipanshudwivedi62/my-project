'use client'

import type { Roi } from '@/lib/analysis'
import { cn } from '@/lib/utils'

export type MarkerId = 'white' | 'reaction'

type Props = {
  src: string
  width: number
  height: number
  whiteRoi: Roi
  reactionRoi: Roi
  activeMarker?: MarkerId
  onPlace?: (point: { x: number; y: number }) => void
  onNudge?: (dx: number, dy: number) => void
}

function Marker({ roi, aspect, label, tone, active }: { roi: Roi; aspect: number; label: string; tone: string; active?: boolean }) {
  const w = roi.size
  const h = roi.size * aspect
  return (
    <div
      className={cn('pointer-events-none absolute border-2', tone, active && 'ring-2 ring-offset-0 ring-foreground/60')}
      style={{
        left: `${(roi.x - w / 2) * 100}%`,
        top: `${(roi.y - h / 2) * 100}%`,
        width: `${w * 100}%`,
        height: `${h * 100}%`,
      }}
    >
      <span className="absolute -top-6 left-0 rounded bg-background/85 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-foreground">
        {label}
      </span>
    </div>
  )
}

export function RoiImage({ src, width, height, whiteRoi, reactionRoi, activeMarker, onPlace, onNudge }: Props) {
  const aspect = width / height
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-background"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL evidence image */}
      <img src={src} alt="Captured field test" className="absolute inset-0 size-full object-fill" />
      {onPlace && (
        <button
          type="button"
          aria-label={`Place the ${activeMarker === 'white' ? 'white reference' : 'reaction'} region. Click the image or use arrow keys.`}
          className="absolute inset-0 cursor-crosshair focus-visible:outline-2 focus-visible:outline-primary"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            onPlace({
              x: (event.clientX - rect.left) / rect.width,
              y: (event.clientY - rect.top) / rect.height,
            })
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 0.05 : 0.01
            const moves: Record<string, [number, number]> = {
              ArrowLeft: [-step, 0],
              ArrowRight: [step, 0],
              ArrowUp: [0, -step],
              ArrowDown: [0, step],
            }
            const move = moves[event.key]
            if (move && onNudge) {
              event.preventDefault()
              onNudge(move[0], move[1])
            }
          }}
        />
      )}
      <Marker roi={whiteRoi} aspect={aspect} label="White ref" tone="border-foreground" active={activeMarker === 'white'} />
      <Marker roi={reactionRoi} aspect={aspect} label="Reaction" tone="border-primary" active={activeMarker === 'reaction'} />
    </div>
  )
}
