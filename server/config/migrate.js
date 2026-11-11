import './dotenv.js'
import pool from '../db.js'
import { readFileSync } from 'node:fs'

const assertSafeTarget = () => {
  const url = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL)
    : null

  const host = url ? url.hostname : process.env.PGHOST
  const database = url
    ? decodeURIComponent(url.pathname.slice(1))
    : process.env.PGDATABASE

  if (!host || !database) {
    throw new Error('No database target configured')
  }

  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error('Refusing migration: only local databases are allowed')
  }

  if (!database.endsWith('_test')) {
    throw new Error('Migration requires a local *_test database')
  }

  if (process.env.ALLOW_DB_MIGRATION !== 'true') {
    throw new Error('Set ALLOW_DB_MIGRATION=true to confirm migration')
  }
}

const migrate = async () => {
  try {
    assertSafeTarget()

    const sql = readFileSync(
      new URL('../migrations/001_create_study_plan_comments.sql', import.meta.url),
      'utf8'
    )

    await pool.query(sql)
    console.log('Study plan comments migration completed')
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

migrate()
