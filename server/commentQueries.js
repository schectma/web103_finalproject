import pool from './db.js'

// Retrieve comments for a study plan, oldest first.
export async function getStudyPlanComments(studyPlanId) {
  const result = await pool.query(
    `SELECT
       c.id,
       c.study_plan_id,
       c.created_by,
       c.content,
       c.created_at,
       u.first_name || ' ' || u.last_name AS creator_name
     FROM comments c
     JOIN users u ON u.id = c.created_by
     WHERE c.study_plan_id = $1
     ORDER BY c.created_at ASC, c.id ASC`,
    [studyPlanId]
  )

  return result.rows
}

// Create a comment belonging to a study plan.
export async function createStudyPlanComment({
  studyPlanId,
  created_by,
  content
}) {
  const result = await pool.query(
    `WITH inserted AS (
       INSERT INTO comments (
         study_plan_id,
         created_by,
         content
       )
       VALUES ($1, $2, $3)
       RETURNING
         id,
         study_plan_id,
         created_by,
         content,
         created_at
     )
     SELECT
       inserted.*,
       u.first_name || ' ' || u.last_name AS creator_name
     FROM inserted
     JOIN users u ON u.id = inserted.created_by`,
    [studyPlanId, created_by, content.trim()]
  )

  return result.rows[0]
}
