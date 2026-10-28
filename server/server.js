import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

// Render's health check hits this to confirm the deploy is live
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
