import pool from '../db.js'

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, role FROM users ORDER BY id ASC'
    )

    res.status(200).json(result.rows)
  } catch (err) {
    console.error('Get users failed:', err.message)
    res.status(500).json({ error: 'Could not fetch users' })
  }
}

export default { getUsers }
