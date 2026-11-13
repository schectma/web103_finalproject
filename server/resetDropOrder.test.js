import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('database reset drops comments before referenced tables', () => {
  const source = readFileSync(
    new URL('./config/reset.js', import.meta.url),
    'utf8'
  )

  const dropBlock = source.match(
    /const dropAllTables = async \(\) => \{[\s\S]*?await pool\.query\(`([\s\S]*?)`\)/
  )

  assert.ok(dropBlock, 'reset script should contain a table-drop query')

  const statements = [...dropBlock[1].matchAll(
    /DROP TABLE IF EXISTS (\w+);/g
  )].map(match => match[1])

  assert.ok(statements.includes('comments'), 'comments table must be dropped')
  assert.ok(statements.includes('study_plans'), 'study_plans table must be dropped')
  assert.ok(statements.includes('users'), 'users table must be dropped')

  assert.ok(
    statements.indexOf('comments') < statements.indexOf('study_plans'),
    'comments must be dropped before study_plans'
  )

  assert.ok(
    statements.indexOf('comments') < statements.indexOf('users'),
    'comments must be dropped before users'
  )
})
