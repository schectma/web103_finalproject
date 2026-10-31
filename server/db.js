import pg from 'pg'

// Uses DATABASE_URL when set (Render), otherwise falls back to PG* vars (local .env)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

export default pool
