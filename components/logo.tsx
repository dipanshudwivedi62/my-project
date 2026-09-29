import { ScanLine } from 'lucide-react'

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ScanLine className="size-5" aria-hidden="true" />
      </span>
      <span className="text-base font-semibold tracking-tight text-foreground">FieldTrace</span>
    </span>
  )
}
