-- =============================================================================
-- TaskHub – Vercel Postgres initialization script
-- Run this once to create all tables.
-- =============================================================================

-- Enable the pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- users
-- Merges the old Supabase auth.users + profiles tables into one.
-- Password authentication is now handled entirely by our app using bcryptjs.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- families
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS families (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  created_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- family_members  (join table)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_members (
  family_id  UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       TEXT        NOT NULL DEFAULT 'child'
                         CHECK (role IN ('admin', 'parent', 'child')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (family_id, user_id)
);

-- -----------------------------------------------------------------------------
-- tasks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT        NOT NULL,
  description    TEXT,
  status         TEXT        NOT NULL DEFAULT 'todo'
                             CHECK (status IN ('todo', 'in_progress', 'done', 'pending')),
  priority       TEXT        NOT NULL DEFAULT 'medium'
                             CHECK (priority IN ('low', 'medium', 'high')),
  due_date       TIMESTAMPTZ NOT NULL,
  created_by     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to    UUID        REFERENCES users(id) ON DELETE SET NULL,
  family_id      UUID        REFERENCES families(id) ON DELETE CASCADE,
  is_family_task BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- task_logs  (audit trail – currently unused in the UI but kept for future use)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID        NOT NULL REFERENCES tasks(id)    ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  action     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Indexes for common query patterns
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_created_by   ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to  ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_family_id    ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date     ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id   ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id  ON task_logs(task_id);
