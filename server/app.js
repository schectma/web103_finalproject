import express from 'express'
import pool from './db.js'
import { validateStudyPlan } from './studyPlanValidation.js'
import { createStudyPlan } from './studyPlanQueries.js'

// Builds the app without starting it, so tests can import it directly.
// server.js is what starts listening on a port.
const app = express()

// Parse JSON request bodies for API endpoints
app.use(express.json())

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

// Study Plan Creation: validate incoming study plan data
app.post('/api/study-plans', async (req, res) => {
  const result = validateStudyPlan(req.body)

  if (!result.valid) {
    return res.status(400).json({
      errors: result.errors
    })
  }

  try {
    const { course_id, topic_id, created_by, title, content } = req.body

    const studyPlan = await createStudyPlan({
      course_id,
      topic_id,
      created_by,
      title,
      content
    })

    return res.status(201).json(studyPlan)
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Referenced course, topic, or user does not exist'
      })
    }

    console.error('Error creating study plan:', error)

    return res.status(500).json({
      error: 'Failed to create study plan'
    })
  }
})

export default app
