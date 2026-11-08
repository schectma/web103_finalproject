import pool from '../db.js'

// Mock auth: the client says who is acting with an X-User-Id header.
// Loads that user and attaches it to the request as req.user.
export const currentUser = async (req, res, next) => {
  const id = Number(req.get('X-User-Id'))

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(401).json({ error: 'Missing or invalid X-User-Id header' })
  }

  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, role FROM users WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Unknown user' })
    }

    req.user = result.rows[0]
    next()
  } catch (err) {
    console.error('Load current user failed:', err.message)
    res.status(500).json({ error: 'Could not load current user' })
  }
}

// Use after currentUser: only TAs may continue.
export const requireTA = (req, res, next) => {
  if (req.user.role !== 'ta') {
    return res.status(403).json({ error: 'Only TAs can do this' })
  }

  next()
}
