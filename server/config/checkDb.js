import './dotenv.js'
import pool from '../db.js'

// Deploy-time check: connects with the app's own pool and reports whether the
// connection is SSL-encrypted. Exits 1 if the database is unreachable, or if
// DB_REQUIRE_SSL=true and the connection is not using SSL.
const checkDb = async () => {
  try {
    const { rows } = await pool.query(
      'SELECT ssl, version AS tls_version FROM pg_stat_ssl WHERE pid = pg_backend_pid()'
    )
    const { ssl, tls_version: tlsVersion } = rows[0] ?? { ssl: false }

    console.log(`database connection ok, ssl: ${ssl ? `on (${tlsVersion})` : 'off'}`)

    if (!ssl && process.env.DB_REQUIRE_SSL === 'true') {
      throw new Error('DB_REQUIRE_SSL=true but the connection is not using SSL')
    }
  } catch (err) {
    console.error('database check failed:', err.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

checkDb()
