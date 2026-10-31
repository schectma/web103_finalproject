import express from 'express'
import pool from './db.js'

const app = express()
const PORT = process.env.PORT || 3000

// Render's health check hits this to confirm the deploy is live and the database is reachable
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'ok' })
  } catch (err) {
    console.error('Health check failed:', err.message)
    res.status(503).json({ status: 'error', db: 'unreachable' })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
