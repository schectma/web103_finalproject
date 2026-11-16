import app from './app.js'
import pool from './db.js'
import { readFileSync } from 'node:fs'

const PORT = process.env.PORT || 3000

// Make sure study_plans exists (same definition as config/reset.js); never touches existing tables
await pool.query(`
  CREATE TABLE IF NOT EXISTS study_plans (
    id serial PRIMARY KEY,
    course_id integer NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    topic_id integer REFERENCES topics(id) ON DELETE SET NULL,
    created_by integer NOT NULL REFERENCES users(id),
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS study_plans_course_id_idx ON study_plans(course_id);
`)

// Make sure comments exists (idempotent migration; never touches existing tables)
await pool.query(
  readFileSync(
    new URL('./migrations/001_create_study_plan_comments.sql', import.meta.url),
    'utf8'
  )
)

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
