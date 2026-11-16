import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'

const dir = new URL('./migrations/', import.meta.url)
const files = readdirSync(dir).filter(name => name.endsWith('.sql')).sort()

test('migration files are numbered in order', () => {
  assert.ok(files.length > 0)
  files.forEach((name, i) => {
    assert.match(name, new RegExp(`^${String(i + 1).padStart(3, '0')}_.+\.sql$`))
  })
})

test('migrations are additive and idempotent', () => {
  for (const name of files) {
    const sql = readFileSync(new URL(name, dir), 'utf8')
    assert.doesNotMatch(sql, /\b(DROP\s+TABLE|TRUNCATE)\b/i, `${name} is destructive`)

    for (const match of sql.matchAll(/CREATE\s+(TABLE|INDEX)\s+(?!IF NOT EXISTS)/gi)) {
      assert.fail(`${name}: ${match[0].trim()} needs IF NOT EXISTS`)
    }
  }
})
