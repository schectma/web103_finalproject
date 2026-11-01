import express from 'express'
import pool from './db.js'

// Builds the app without starting it, so tests can import it directly.
// server.js is what starts listening on a port.
const app = express()

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

// Course Tracking: retrieve all courses
// Temporary placeholder until the database is connected
app.get('/api/courses', (req, res) => {
  res.json([])
})

// Course Tracking: retrieve a single course by ID
// Temporary placeholder until the database is connected
app.get('/api/courses/:id', (req, res) => {
  res.status(404).json({ error: 'Course not found' })
})

export default app
