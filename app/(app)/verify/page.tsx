import { VerifyForm } from '@/components/verify-form'

export const metadata = { title: 'Verify evidence — FieldTrace' }

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Verify evidence</h1>
        <p className="max-w-2xl text-sm text-muted text-pretty">
          Re-check a record&apos;s hashes and Ed25519 signature, and optionally prove that an image file is the exact
          photo sealed at capture. Any edit to the image or record — even one pixel — fails verification.
        </p>
      </div>
      <VerifyForm defaultId={id ?? ''} />
    </>
  )
}
