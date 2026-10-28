import 'dotenv/config'
import pg from 'pg'

// Set DATABASE_SSL=true when connecting from outside Render (External Database URL)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

export default pool
