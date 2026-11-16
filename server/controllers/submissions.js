import pool from '../db.js'
import {
  validateSubmission,
  validateSubmissionUpdate
} from '../submissionValidation.js'

const parseId = (value) => {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const getSubmissions = async (req, res) => {
  const assignmentId = parseId(req.params.assignmentId)

  if (!assignmentId) {
    return res.status(400).json({ errors: ['Invalid assignment ID'] })
  }

  try {
    const assignment = await pool.query(
      'SELECT 1 FROM assignments WHERE id = $1',
      [assignmentId]
    )

    if (assignment.rowCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    const result = await pool.query(
      `SELECT s.assignment_id, s.user_id, s.status, s.notes,
              s.submitted_at, s.updated_at,
              u.first_name || ' ' || u.last_name AS student_name
       FROM submissions s
       JOIN users u ON u.id = s.user_id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at ASC, s.user_id ASC`,
      [assignmentId]
    )

    res.status(200).json(result.rows)
  } catch (err) {
    console.error('Get submissions failed:', err.message)
    res.status(500).json({ error: 'Could not fetch submissions' })
  }
}

const createSubmission = async (req, res) => {
  const assignmentId = parseId(req.params.assignmentId)

  if (!assignmentId) {
    return res.status(400).json({ errors: ['Invalid assignment ID'] })
  }

  const { valid, errors } = validateSubmission(req.body)

  if (!valid) {
    return res.status(400).json({ errors })
  }

  const { user_id, status, notes } = req.body

  try {
    const assignment = await pool.query(
      'SELECT 1 FROM assignments WHERE id = $1',
      [assignmentId]
    )

    if (assignment.rowCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' })
    }

    const user = await pool.query('SELECT role FROM users WHERE id = $1', [user_id])

    if (user.rowCount === 0) {
      return res.status(400).json({ errors: ['User does not exist'] })
    }

    if (user.rows[0].role !== 'student') {
      return res.status(400).json({ errors: ['Only students can submit assignments'] })
    }

    const result = await pool.query(
      `INSERT INTO submissions (assignment_id, user_id, status, notes)
       VALUES ($1, $2, COALESCE($3, 'in_progress'), $4)
       RETURNING assignment_id, user_id, status, notes, submitted_at, updated_at`,
      [assignmentId, user_id, status ?? null, notes?.trim() || null]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    // 23505 = unique violation: this student already has a submission
    if (err.code === '23505') {
      return res.status(409).json({ errors: ['Submission already exists for this student'] })
    }

    console.error('Create submission failed:', err.message)
    res.status(500).json({ error: 'Could not create submission' })
  }
}

const updateSubmission = async (req, res) => {
  const assignmentId = parseId(req.params.assignmentId)
  const userId = parseId(req.params.userId)

  if (!assignmentId || !userId) {
    return res.status(400).json({ errors: ['Invalid assignment or user ID'] })
  }

  const { valid, errors } = validateSubmissionUpdate(req.body)

  if (!valid) {
    return res.status(400).json({ errors })
  }

  const { status, notes } = req.body

  try {
    // Only the fields that were sent change; notes: null clears the notes
    const result = await pool.query(
      `UPDATE submissions
       SET status = COALESCE($3, status),
           notes = CASE WHEN $4::boolean THEN $5 ELSE notes END,
           updated_at = NOW()
       WHERE assignment_id = $1 AND user_id = $2
       RETURNING assignment_id, user_id, status, notes, submitted_at, updated_at`,
      [
        assignmentId,
        userId,
        status ?? null,
        notes !== undefined,
        typeof notes === 'string' ? notes.trim() || null : null
      ]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    res.status(200).json(result.rows[0])
  } catch (err) {
    console.error('Update submission failed:', err.message)
    res.status(500).json({ error: 'Could not update submission' })
  }
}

const deleteSubmission = async (req, res) => {
  const assignmentId = parseId(req.params.assignmentId)
  const userId = parseId(req.params.userId)

  if (!assignmentId || !userId) {
    return res.status(400).json({ errors: ['Invalid assignment or user ID'] })
  }

  try {
    const result = await pool.query(
      'DELETE FROM submissions WHERE assignment_id = $1 AND user_id = $2',
      [assignmentId, userId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Submission not found' })
    }

    res.status(204).end()
  } catch (err) {
    console.error('Delete submission failed:', err.message)
    res.status(500).json({ error: 'Could not delete submission' })
  }
}

export default {
  getSubmissions,
  createSubmission,
  updateSubmission,
  deleteSubmission
}
