'use client'

import { useState, useTransition } from 'react'
import { ShieldCheck } from 'lucide-react'
import { verifyFieldTest, type VerificationResult } from '@/app/actions/tests'
import { sha256OfFile } from '@/lib/image-client'
import { VerificationResults } from '@/components/verification-results'
import { Button, Card, CardHeader, Input, Label } from '@/components/ui'

export function VerifyForm({ defaultId }: { defaultId: string }) {
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [fileHash, setFileHash] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Record to check" />
        <form
          className="flex flex-col gap-5 p-5"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            const file = form.get('image')
            startTransition(async () => {
              const hash = file instanceof File && file.size > 0 ? await sha256OfFile(file) : undefined
              setFileHash(hash ?? null)
              setResult(await verifyFieldTest(String(form.get('testId')), hash))
            })
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="testId">Test ID</Label>
            <Input
              id="testId"
              name="testId"
              required
              defaultValue={defaultId}
              placeholder="FT-20260930-XXXXXX"
              className="font-mono uppercase"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="image">
              Image file <span className="font-normal text-muted">(optional)</span>
            </Label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-foreground"
            />
            <p className="text-xs text-muted">
              Upload the downloaded evidence image to confirm it is byte-for-byte identical. The file is hashed in your
              browser and never uploaded.
            </p>
          </div>
          <Button type="submit" disabled={pending}>
            <ShieldCheck className="size-4" aria-hidden="true" />
            {pending ? 'Verifying…' : 'Verify record'}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Result" />
        <div className="flex flex-col gap-4 p-5">
          {result ? (
            <>
              <VerificationResults result={result} />
              {fileHash && (
                <p className="text-xs text-muted">
                  Uploaded file SHA-256: <span className="font-mono break-all">{fileHash}</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">Enter a test ID to run the integrity checks.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
