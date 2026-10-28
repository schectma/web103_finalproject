import fs from 'node:fs/promises'
import pool from './pool.js'

const schema = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8')

try {
  await pool.query(schema)
  console.log('Database reset complete')
} finally {
  await pool.end()
}
