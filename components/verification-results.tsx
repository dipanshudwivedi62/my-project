import { CheckCircle2, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react'
import type { VerificationResult } from '@/app/actions/tests'
import { cn, formatUtc } from '@/lib/utils'

export function VerificationResults({ result }: { result: VerificationResult }) {
  if (!result.found) {
    return (
      <div role="status" className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
        No record with ID <span className="font-mono">{result.testId}</span> exists in your account.
      </div>
    )
  }
  return (
    <div role="status" className="flex flex-col gap-4">
      <div
        className={cn(
          'flex items-center gap-3 rounded-md border p-4',
          result.passed ? 'border-success/40 bg-success/10' : 'border-danger/40 bg-danger/10',
        )}
      >
        {result.passed ? (
          <ShieldCheck className="size-6 shrink-0 text-success" aria-hidden="true" />
        ) : (
          <ShieldAlert className="size-6 shrink-0 text-danger" aria-hidden="true" />
        )}
        <div className="flex flex-col">
          <p className={cn('font-medium', result.passed ? 'text-success' : 'text-danger')}>
            {result.passed ? 'Evidence verified — no tampering detected' : 'Integrity check failed'}
          </p>
          <p className="text-xs text-muted">
            <span className="font-mono">{result.testId}</span> · checked {formatUtc(result.verifiedAt)}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {result.checks.map((check) => (
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
  )
}
