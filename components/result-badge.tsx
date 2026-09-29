import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'
import { RESULT_LABELS, type TestResult } from '@/lib/analysis'
import { cn } from '@/lib/utils'

const styles: Record<TestResult, { className: string; Icon: typeof AlertTriangle }> = {
  PRESUMPTIVE_POSITIVE: { className: 'border-danger/40 bg-danger/10 text-danger', Icon: AlertTriangle },
  NEGATIVE: { className: 'border-success/40 bg-success/10 text-success', Icon: CheckCircle2 },
  INCONCLUSIVE: { className: 'border-warning/40 bg-warning/10 text-warning', Icon: HelpCircle },
}

export function ResultBadge({ result, size = 'sm' }: { result: string; size?: 'sm' | 'lg' }) {
  const key = (result in styles ? result : 'INCONCLUSIVE') as TestResult
  const { className, Icon } = styles[key]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        size === 'lg' ? 'px-3 py-1.5 text-base' : 'px-2 py-0.5 text-xs',
        className,
      )}
    >
      <Icon className={size === 'lg' ? 'size-5' : 'size-3.5'} aria-hidden="true" />
      {RESULT_LABELS[key]}
    </span>
  )
}
