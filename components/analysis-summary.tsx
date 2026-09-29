import { CheckCircle2, XCircle } from 'lucide-react'
import type { Analysis, Measurements } from '@/lib/analysis'
import type { Rgb } from '@/lib/kits'
import { ResultBadge } from '@/components/result-badge'
import { cn } from '@/lib/utils'

const rgbCss = (rgb: Rgb) => `rgb(${rgb.map((c) => Math.round(c)).join(' ')})`

function Swatch({ rgb, label }: { rgb: Rgb; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-12 rounded-md border border-border" style={{ backgroundColor: rgbCss(rgb) }} />
      <p className="text-xs text-muted">{label}</p>
      <p className="font-mono text-[11px] text-muted">{rgb.map((c) => Math.round(c)).join(', ')}</p>
    </div>
  )
}

export function AnalysisSummary({
  analysis,
  measurements,
  kitName,
}: {
  analysis: Analysis
  measurements: Measurements
  kitName: string
}) {
  const best = analysis.matches[0]
  const confidencePct = Math.round(analysis.confidence * 100)
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ResultBadge result={analysis.result} size="lg" />
        <div className="flex min-w-40 flex-1 flex-col gap-1.5 sm:max-w-56">
          <div className="flex justify-between text-xs text-muted">
            <span>Confidence</span>
            <span className="font-mono text-foreground">{confidencePct}%</span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-surface-2"
            role="meter"
            aria-label="Classification confidence"
            aria-valuenow={confidencePct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${confidencePct}%` }} />
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-1 text-sm text-muted">
        {analysis.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-3">
        <Swatch rgb={measurements.reaction.mean} label="As captured" />
        <Swatch rgb={analysis.calibrated} label="Calibrated" />
        <Swatch rgb={best.rgb} label="Closest reference" />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">{kitName} references (ΔE*ab)</h3>
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {analysis.matches.map((match) => (
            <li key={match.label} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="size-4 shrink-0 rounded-sm border border-border" style={{ backgroundColor: rgbCss(match.rgb) }} />
              <span className="flex-1 text-foreground">{match.label}</span>
              <span className={cn('text-xs', match.kind === 'positive' ? 'text-danger' : 'text-success')}>
                {match.kind}
              </span>
              <span className="w-14 text-right font-mono text-muted">{match.deltaE.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Quality gates</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {analysis.quality.map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-sm">
              {check.passed ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Passed" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-label="Failed" />
              )}
              <span className="flex flex-col">
                <span className="text-foreground">{check.label}</span>
                <span className="text-xs text-muted">{check.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
