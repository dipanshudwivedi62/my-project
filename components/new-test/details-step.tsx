'use client'

import { KITS, type KitId } from '@/lib/kits'
import { Button, Card, CardHeader, Input, Label, Select, Textarea } from '@/components/ui'

export type TestDetails = { kitType: KitId; caseNumber: string; subjectRef: string; notes: string }

export function DetailsStep({
  value,
  onChange,
  operatorName,
  onNext,
}: {
  value: TestDetails
  onChange: (value: TestDetails) => void
  operatorName: string
  onNext: () => void
}) {
  const kit = KITS.find((k) => k.id === value.kitType)!
  return (
    <Card>
      <CardHeader title="Case details" description={`Operator: ${operatorName}`} />
      <form
        className="flex flex-col gap-5 p-5"
        onSubmit={(event) => {
          event.preventDefault()
          onNext()
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="caseNumber">Case / FIR number</Label>
            <Input
              id="caseNumber"
              required
              maxLength={64}
              value={value.caseNumber}
              onChange={(e) => onChange({ ...value, caseNumber: e.target.value })}
              placeholder="FIR-0421/2026"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="subjectRef">Subject / sample reference</Label>
            <Input
              id="subjectRef"
              required
              maxLength={64}
              value={value.subjectRef}
              onChange={(e) => onChange({ ...value, subjectRef: e.target.value })}
              placeholder="Seizure bag S-03"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="kitType">Test kit</Label>
          <Select
            id="kitType"
            value={value.kitType}
            onChange={(e) => onChange({ ...value, kitType: e.target.value as KitId })}
          >
            {KITS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name} — {k.targets}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted">{kit.instructions}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">
            Notes <span className="font-normal text-muted">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            maxLength={1000}
            value={value.notes}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            placeholder="Conditions, witnesses, observations"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Continue to capture</Button>
        </div>
      </form>
    </Card>
  )
}
