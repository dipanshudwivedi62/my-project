import { requireSession } from '@/lib/auth'
import { NewTestWizard } from '@/components/new-test/new-test-wizard'

export const metadata = { title: 'New field test — FieldTrace' }

export default async function NewTestPage() {
  const session = await requireSession()
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">New field test</h1>
        <p className="text-sm text-muted">
          Record the case, photograph the reacted kit on its reference card, then seal the result.
        </p>
      </div>
      <NewTestWizard operatorName={session.user.name} />
    </>
  )
}
