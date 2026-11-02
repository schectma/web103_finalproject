import pool from './db.js'

export async function createStudyPlan({
  course_id,
  topic_id,
  created_by,
  title,
  content
}) {
  const query = `
    INSERT INTO study_plans (
      course_id,
      topic_id,
      created_by,
      title,
      content
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      course_id,
      topic_id,
      created_by,
      title,
      content,
      created_at,
      updated_at
  `

  const values = [
    course_id,
    topic_id ?? null,
    created_by,
    title.trim(),
    content.trim()
  ]

  const result = await pool.query(query, values)

  return result.rows[0]
}
