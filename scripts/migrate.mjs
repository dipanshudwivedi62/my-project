import { readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const file = readFileSync(new URL('./001_init.sql', import.meta.url), 'utf8')
const statements = file
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter(Boolean)

for (const statement of statements) {
  await sql.query(statement)
}

console.log(`Applied ${statements.length} statements`)
