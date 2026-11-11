-- Issue #160: Study Plan Comments schema
-- Non-destructive and safe to run more than once.

CREATE TABLE IF NOT EXISTS comments (
  id serial PRIMARY KEY,
  study_plan_id integer NOT NULL
    REFERENCES study_plans(id) ON DELETE CASCADE,
  created_by integer NOT NULL
    REFERENCES users(id),
  content text NOT NULL
    CHECK (length(btrim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_study_plan_id_idx
  ON comments(study_plan_id);
