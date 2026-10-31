import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

// Render's health check hits this to confirm the deploy is live
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
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

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
