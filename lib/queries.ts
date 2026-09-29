import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { auditEvent, fieldTest } from '@/lib/db/schema'
import type { TestResult } from '@/lib/analysis'

const RESULTS: TestResult[] = ['PRESUMPTIVE_POSITIVE', 'NEGATIVE', 'INCONCLUSIVE']

export function isTestResult(value: string | undefined): value is TestResult {
  return !!value && (RESULTS as string[]).includes(value)
}

export async function listTests(userId: string, filters: { q?: string; result?: string }) {
  const conditions = [eq(fieldTest.userId, userId)]
  const q = filters.q?.trim().slice(0, 64)
  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, '\\$&')}%`
    conditions.push(
      or(
        ilike(fieldTest.id, pattern),
        ilike(fieldTest.caseNumber, pattern),
        ilike(fieldTest.subjectRef, pattern),
      )!,
    )
  }
  if (isTestResult(filters.result)) conditions.push(eq(fieldTest.result, filters.result))

  return db
    .select({
      id: fieldTest.id,
      caseNumber: fieldTest.caseNumber,
      subjectRef: fieldTest.subjectRef,
      kitType: fieldTest.kitType,
      result: fieldTest.result,
      confidence: fieldTest.confidence,
      capturedAt: fieldTest.capturedAt,
      latitude: fieldTest.latitude,
    })
    .from(fieldTest)
    .where(and(...conditions))
    .orderBy(desc(fieldTest.createdAt))
    .limit(100)
}

export async function getResultCounts(userId: string) {
  const rows = await db
    .select({ result: fieldTest.result, total: count() })
    .from(fieldTest)
    .where(eq(fieldTest.userId, userId))
    .groupBy(fieldTest.result)
  const counts: Record<TestResult, number> = { PRESUMPTIVE_POSITIVE: 0, NEGATIVE: 0, INCONCLUSIVE: 0 }
  for (const row of rows) if (isTestResult(row.result)) counts[row.result] = row.total
  return { ...counts, total: counts.PRESUMPTIVE_POSITIVE + counts.NEGATIVE + counts.INCONCLUSIVE }
}

export async function getTest(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(fieldTest)
    .where(and(eq(fieldTest.id, id), eq(fieldTest.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function getAuditTrail(userId: string, testId: string) {
  return db
    .select()
    .from(auditEvent)
    .where(and(eq(auditEvent.testId, testId), eq(auditEvent.userId, userId)))
    .orderBy(desc(auditEvent.createdAt))
    .limit(50)
}
