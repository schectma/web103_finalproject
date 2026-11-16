import './dotenv.js'
import pool from '../db.js'
import { readdirSync, readFileSync } from 'node:fs'

// Applies every server/migrations/*.sql file once, in filename order, and records
// each in schema_migrations. Safe to run on every deploy: applied files are skipped.
// Migrations must be additive, so files containing DROP TABLE or TRUNCATE are refused.
const MIGRATIONS_DIR = new URL('../migrations/', import.meta.url)
const LOCK_ID = 103001 // advisory lock so two instances never migrate at once
const DESTRUCTIVE = /\b(DROP\s+TABLE|TRUNCATE)\b/i

const listMigrations = () =>
  readdirSync(MIGRATIONS_DIR)
    .filter(name => name.endsWith('.sql'))
    .sort()

const migrate = async () => {
  const client = await pool.connect()

  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID])
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT NOW()
      )
    `)

    const applied = new Set(
      (await client.query('SELECT filename FROM schema_migrations')).rows
        .map(row => row.filename)
    )

    for (const filename of listMigrations()) {
      if (applied.has(filename)) {
        console.log(`skip    ${filename}`)
        continue
      }

      const sql = readFileSync(new URL(filename, MIGRATIONS_DIR), 'utf8')

      if (DESTRUCTIVE.test(sql)) {
        throw new Error(`${filename} contains DROP TABLE or TRUNCATE; migrations must be additive`)
      }

      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
        await client.query('COMMIT')
        console.log(`applied ${filename}`)
      } catch (err) {
        await client.query('ROLLBACK')
        throw new Error(`${filename} failed: ${err.message}`)
      }
    }
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
