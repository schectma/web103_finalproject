import './dotenv.js'
import pool from '../db.js'
import { readFileSync } from 'node:fs'

const data = JSON.parse(
  readFileSync(new URL('./data/demo.json', import.meta.url), 'utf8')
)

const apply = process.argv.includes('--apply')

const requiredKeys = ['courses', 'topics', 'assignments', 'study_plans']

for (const key of requiredKeys) {
  if (!Array.isArray(data[key])) {
    throw new Error(`Invalid demo data: ${key} must be an array`)
  }
}

const counts = {
  courses: 0,
  topics: 0,
  assignments: 0,
  study_plans: 0
}


// Preview uses SELECT statements only. No inserts or sequence changes.
if (!apply) {
  try {
    const existing = {
      courses: await pool.query('SELECT course_name FROM courses'),
      topics: await pool.query(
        `SELECT c.course_name, t.name
         FROM topics t JOIN courses c ON c.id = t.course_id`
      ),
      assignments: await pool.query(
        `SELECT c.course_name, a.title
         FROM assignments a JOIN courses c ON c.id = a.course_id`
      ),
      study_plans: await pool.query(
        `SELECT c.course_name, s.title
         FROM study_plans s JOIN courses c ON c.id = s.course_id`
      )
    }

    const key = (course, title) => JSON.stringify([course, title])
    const courseNames = new Set(existing.courses.rows.map(r => r.course_name))
    const existingKeys = table => new Set(
      existing[table].rows.map(r => key(r.course_name, r.name ?? r.title))
    )

    const counts = {
      courses: data.courses.filter(c => !courseNames.has(c.course_name)).length,
      topics: data.topics.filter(t =>
        !existingKeys('topics').has(key(t.course_name, t.name))
      ).length,
      assignments: data.assignments.filter(a =>
        !existingKeys('assignments').has(key(a.course_name, a.title))
      ).length,
      study_plans: data.study_plans.filter(p =>
        !existingKeys('study_plans').has(key(p.course_name, p.title))
      ).length
    }

    console.log('READ-ONLY PREVIEW — proposed new records:')
    console.table(counts)
    console.log('No database records were changed.')
  } catch (error) {
    console.error('Preview failed:', error.message)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
} else {

const client = await pool.connect()
let transactionOpen = false

const findExisting = async (table, conditions, values) => {
  const result = await client.query(
    `SELECT id FROM ${table} WHERE ${conditions} ORDER BY id LIMIT 1`,
    values
  )
  return result.rows[0]?.id ?? null
}

try {
  await client.query('BEGIN')
  transactionOpen = true

  // Prevent concurrent demo-seeding runs from creating duplicates.
  await client.query(
    'SELECT pg_advisory_xact_lock($1)',
    [20261109]
  )

  const users = await client.query(
    'SELECT id, role FROM users'
  )
  const userRoles = new Map(
    users.rows.map(user => [user.id, user.role])
  )

  const courseIds = new Map()

  for (const course of data.courses) {
    if (userRoles.get(course.ta_id) !== 'ta') {
      throw new Error(`Invalid TA for ${course.course_name}`)
    }

    let id = await findExisting(
      'courses',
      'course_name = $1',
      [course.course_name]
    )

    if (!id) {
      const result = await client.query(
        `INSERT INTO courses (course_name, ta_id)
         VALUES ($1, $2) RETURNING id`,
        [course.course_name, course.ta_id]
      )
      id = result.rows[0].id
      counts.courses++
    }

    courseIds.set(course.course_name, id)
  }

  const topicIds = new Map()

  for (const topic of data.topics) {
    const courseId = courseIds.get(topic.course_name)

    if (!courseId) {
      throw new Error(`Unknown course for topic: ${topic.name}`)
    }

    let id = await findExisting(
      'topics',
      'course_id = $1 AND name = $2',
      [courseId, topic.name]
    )

    if (!id) {
      const result = await client.query(
        `INSERT INTO topics (course_id, name)
         VALUES ($1, $2) RETURNING id`,
        [courseId, topic.name]
      )
      id = result.rows[0].id
      counts.topics++
    }

    topicIds.set(`${topic.course_name}::${topic.name}`, id)
  }

  for (const assignment of data.assignments) {
    const courseId = courseIds.get(assignment.course_name)
    const topicId = topicIds.get(
      `${assignment.course_name}::${assignment.topic_name}`
    )

    if (!courseId || !topicId) {
      throw new Error(`Invalid assignment reference: ${assignment.title}`)
    }

    if (userRoles.get(assignment.created_by) !== 'ta') {
      throw new Error(`Invalid assignment creator: ${assignment.title}`)
    }

    const existing = await findExisting(
      'assignments',
      'course_id = $1 AND title = $2',
      [courseId, assignment.title]
    )

    if (!existing) {
      await client.query(
        `INSERT INTO assignments
          (course_id, topic_id, created_by, priority,
           title, description, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          courseId,
          topicId,
          assignment.created_by,
          assignment.priority,
          assignment.title,
          assignment.description,
          assignment.due_date
        ]
      )
      counts.assignments++
    }
  }

  for (const plan of data.study_plans) {
    const courseId = courseIds.get(plan.course_name)
    const topicId = topicIds.get(
      `${plan.course_name}::${plan.topic_name}`
    )

    if (!courseId || !topicId) {
      throw new Error(`Invalid study plan reference: ${plan.title}`)
    }

    if (userRoles.get(plan.created_by) !== 'ta') {
      throw new Error(`Invalid study plan creator: ${plan.title}`)
    }

    const existing = await findExisting(
      'study_plans',
      'course_id = $1 AND title = $2',
      [courseId, plan.title]
    )

    if (!existing) {
      await client.query(
        `INSERT INTO study_plans
          (course_id, topic_id, created_by, title, content)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          courseId,
          topicId,
          plan.created_by,
          plan.title,
          plan.content
        ]
      )
      counts.study_plans++
    }
  }

  console.log('\nStudySync demo-data summary:')
  console.table(counts)

  if (apply) {
    await client.query('COMMIT')
    transactionOpen = false
    console.log('Demo data committed successfully.')
  } else {
    await client.query('ROLLBACK')
    transactionOpen = false
    console.log('DRY RUN ONLY — all proposed inserts rolled back.')
    console.log('Run with --apply only after reviewing these counts.')
  }
} catch (error) {
  if (transactionOpen) {
    await client.query('ROLLBACK')
  }
  console.error('Demo seed failed:', error.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}

}
