import Link from 'next/link'
import { MapPin, Plus, Search } from 'lucide-react'
import { requireSession } from '@/lib/auth'
import { getResultCounts, listTests } from '@/lib/queries'
import { getKit } from '@/lib/kits'
import { formatUtc } from '@/lib/utils'
import { ResultBadge } from '@/components/result-badge'
import { buttonClass, Card, Input, Select } from '@/components/ui'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; result?: string }>
}) {
  const session = await requireSession()
  const filters = await searchParams
  const [tests, counts] = await Promise.all([
    listTests(session.user.id, filters),
    getResultCounts(session.user.id),
  ])
  const filtered = Boolean(filters.q || filters.result)

  const stats = [
    { label: 'Total tests', value: counts.total, className: 'text-foreground' },
    { label: 'Presumptive positive', value: counts.PRESUMPTIVE_POSITIVE, className: 'text-danger' },
    { label: 'Negative', value: counts.NEGATIVE, className: 'text-success' },
    { label: 'Inconclusive', value: counts.INCONCLUSIVE, className: 'text-warning' },
  ]

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Field tests</h1>
          <p className="text-sm text-muted">Signed, tamper-evident records of every test you have captured.</p>
        </div>
        <Link href="/tests/new" className={buttonClass('primary')}>
          <Plus className="size-4" aria-hidden="true" />
          New field test
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex flex-col gap-1 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">{stat.label}</dt>
            <dd className={`font-mono text-3xl font-semibold ${stat.className}`}>{stat.value}</dd>
          </Card>
        ))}
      </dl>

      <Card>
        <form className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row" role="search">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <label htmlFor="q" className="sr-only">
              Search tests
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={filters.q}
              placeholder="Search by test ID, case number or subject"
              className="pl-9"
            />
          </div>
          <label htmlFor="result" className="sr-only">
            Filter by result
          </label>
          <Select id="result" name="result" defaultValue={filters.result ?? ''} className="sm:w-52">
            <option value="">All results</option>
            <option value="PRESUMPTIVE_POSITIVE">Presumptive positive</option>
            <option value="NEGATIVE">Negative</option>
            <option value="INCONCLUSIVE">Inconclusive</option>
          </Select>
          <button type="submit" className={buttonClass('secondary')}>
            Apply
          </button>
        </form>

        {tests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
            <p className="font-medium">{filtered ? 'No tests match these filters' : 'No field tests yet'}</p>
            <p className="max-w-sm text-sm text-muted text-pretty">
              {filtered
                ? 'Try a different search term or clear the result filter.'
                : 'Capture your first test — you can use a built-in demo sample if you do not have a kit on hand.'}
            </p>
            {filtered ? (
              <Link href="/" className={buttonClass('secondary')}>
                Clear filters
              </Link>
            ) : (
              <Link href="/tests/new" className={buttonClass('primary')}>
                Capture first test
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr className="border-b border-border">
                  <th scope="col" className="px-4 py-3 font-medium">Test ID</th>
                  <th scope="col" className="px-4 py-3 font-medium">Case / subject</th>
                  <th scope="col" className="px-4 py-3 font-medium">Kit</th>
                  <th scope="col" className="px-4 py-3 font-medium">Result</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Confidence</th>
                  <th scope="col" className="px-4 py-3 font-medium">Captured</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id} className="border-b border-border last:border-0 hover:bg-surface-2/60">
                    <td className="px-4 py-3">
                      <Link href={`/tests/${test.id}`} className="font-mono text-primary hover:underline">
                        {test.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">{test.caseNumber}</div>
                      <div className="text-xs text-muted">{test.subjectRef}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{getKit(test.kitType)?.name ?? test.kitType}</td>
                    <td className="px-4 py-3">
                      <ResultBadge result={test.result} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{Math.round(test.confidence * 100)}%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      <span className="flex items-center gap-1.5">
                        {formatUtc(test.capturedAt)}
                        {test.latitude !== null && (
                          <MapPin className="size-3.5 text-primary" aria-label="Location attached" />
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
