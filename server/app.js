import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pool from './db/pool.js'

const app = express()
app.use(express.json())

// Confirms the app is up and can reach Postgres
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'ok' })
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message })
  }
})

// In production, Express serves the built React app
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client/dist')
  app.use(express.static(clientDist))
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

export default app
