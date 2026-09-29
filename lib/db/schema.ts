import { boolean, doublePrecision, index, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import type { QualityCheck, StoredFeatures } from '@/lib/analysis'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow(),
})

export const fieldTest = pgTable(
  'field_test',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    operatorName: text('operatorName').notNull(),
    operatorEmail: text('operatorEmail').notNull(),
    caseNumber: text('caseNumber').notNull(),
    subjectRef: text('subjectRef').notNull(),
    kitType: text('kitType').notNull(),
    result: text('result').notNull(),
    confidence: doublePrecision('confidence').notNull(),
    quality: jsonb('quality').$type<QualityCheck[]>().notNull(),
    features: jsonb('features').$type<StoredFeatures>().notNull(),
    notes: text('notes'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    locationAccuracy: doublePrecision('locationAccuracy'),
    imageMime: text('imageMime').notNull(),
    imageData: text('imageData').notNull(),
    imageHash: text('imageHash').notNull(),
    recordJson: text('recordJson').notNull(),
    recordHash: text('recordHash').notNull(),
    signature: text('signature').notNull(),
    publicKey: text('publicKey').notNull(),
    algorithmVersion: text('algorithmVersion').notNull(),
    capturedAt: timestamp('capturedAt', { withTimezone: true }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('field_test_user_created_idx').on(t.userId, t.createdAt)],
)

export const auditEvent = pgTable('audit_event', {
  id: serial('id').primaryKey(),
  testId: text('testId').notNull(),
  userId: text('userId').notNull(),
  action: text('action').notNull(),
  detail: jsonb('detail').$type<Record<string, unknown>>(),
  createdAt: timestamp('createdAt', { withTimezone: true }).notNull().defaultNow(),
})

export type FieldTest = typeof fieldTest.$inferSelect
export type AuditEvent = typeof auditEvent.$inferSelect
