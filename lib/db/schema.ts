import { boolean, doublePrecision, index, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const drugTest = pgTable(
  'drug_test',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    caseNumber: text('case_number').notNull(),
    subjectId: text('subject_id').notNull(),
    kitType: text('kit_type').notNull(),
    substance: text('substance').notNull(),
    controlIntensity: doublePrecision('control_intensity').notNull(),
    testIntensity: doublePrecision('test_intensity').notNull(),
    ratio: doublePrecision('ratio').notNull(),
    result: text('result').notNull(),
    notes: text('notes'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    imageMime: text('image_mime').notNull(),
    imageBase64: text('image_base64').notNull(),
    imageHash: text('image_hash').notNull(),
    recordJson: text('record_json').notNull(),
    recordHash: text('record_hash').notNull(),
    signature: text('signature').notNull(),
    publicKey: text('public_key').notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('drug_test_user_created_idx').on(t.userId, t.createdAt)],
)

export const auditEvent = pgTable(
  'audit_event',
  {
    id: serial('id').primaryKey(),
    testId: text('test_id')
      .notNull()
      .references(() => drugTest.id, { onDelete: 'cascade' }),
    userId: text('user_id'),
    action: text('action').notNull(),
    detail: jsonb('detail'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_event_test_idx').on(t.testId, t.createdAt)],
)

export type DrugTest = typeof drugTest.$inferSelect
export type AuditEvent = typeof auditEvent.$inferSelect
