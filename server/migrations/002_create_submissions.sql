-- Many-to-many join table between assignments and users (students).
-- Each row also carries its own data: status, notes and submitted_at.
-- Non-destructive and safe to run more than once.

CREATE TABLE IF NOT EXISTS submissions (
  assignment_id integer NOT NULL
    REFERENCES assignments(id) ON DELETE CASCADE,
  user_id integer NOT NULL
    REFERENCES users(id),
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),
  notes text,
  submitted_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (assignment_id, user_id)
);

CREATE INDEX IF NOT EXISTS submissions_user_id_idx ON submissions(user_id);
