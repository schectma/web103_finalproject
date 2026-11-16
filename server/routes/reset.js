import express from 'express'

// POST /api/reset rebuilds the database to its seeded default state.
// It wipes every table, so it only runs when ALLOW_WEB_RESET=true is set.
export const createResetRouter = (resetDatabase) => {
  const router = express.Router()
  let running = false

  router.post('/', async (req, res) => {
    if (process.env.ALLOW_WEB_RESET !== 'true') {
      return res.status(403).json({ error: 'Database reset is disabled' })
    }

    if (running) {
      return res.status(409).json({ error: 'A reset is already in progress' })
    }

    running = true

    try {
      await resetDatabase()
      res.status(200).json({ message: 'Database reset to default state' })
    } catch (err) {
      console.error('Database reset failed:', err.message)
      res.status(500).json({ error: 'Could not reset database' })
    } finally {
      running = false
    }
  })

  return router
}
