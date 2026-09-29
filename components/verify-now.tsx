'use client'

import { useState, useTransition } from 'react'
import { ShieldCheck } from 'lucide-react'
import { verifyFieldTest, type VerificationResult } from '@/app/actions/tests'
import { VerificationResults } from '@/components/verification-results'
import { Button } from '@/components/ui'

export function VerifyNow({ testId }: { testId: string }) {
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [pending, startTransition] = useTransition()
  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await verifyFieldTest(testId)))}
      >
        <ShieldCheck className="size-4" aria-hidden="true" />
        {pending ? 'Verifying…' : 'Run integrity check'}
      </Button>
      {result && <VerificationResults result={result} />}
    </div>
  )
}
