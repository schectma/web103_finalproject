import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(
  new URL('./migrations/001_create_study_plan_comments.sql', import.meta.url),
  'utf8'
)

test('creates comments table without dropping existing data', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS comments/i)
  assert.doesNotMatch(migration, /\bDROP\s+TABLE\b/i)
  assert.doesNotMatch(migration, /\bTRUNCATE\b/i)
})

test('links comments to study plans and authors', () => {
  assert.match(
    migration,
    /study_plan_id\s+integer\s+NOT NULL\s+REFERENCES study_plans\(id\)/i
  )
  assert.match(
    migration,
    /created_by\s+integer\s+NOT NULL\s+REFERENCES users\(id\)/i
  )
})

test('requires nonempty comment content', () => {
  assert.match(migration, /content\s+text\s+NOT NULL/i)
  assert.match(migration, /CHECK\s*\(length\(btrim\(content\)\)\s*>\s*0\)/i)
})

test('includes creation timestamp and study plan index', () => {
  assert.match(migration, /created_at\s+timestamptz\s+NOT NULL\s+DEFAULT NOW\(\)/i)
  assert.match(
    migration,
    /CREATE INDEX IF NOT EXISTS comments_study_plan_id_idx/i
  )
})
