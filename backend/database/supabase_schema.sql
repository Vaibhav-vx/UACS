-- ══════════════════════════════════════════════════════════
-- UACS — Supabase PostgreSQL Schema (Unified & Robust)
-- ══════════════════════════════════════════════════════════

-- ── TABLE: messages ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  master_content   TEXT NOT NULL,
  urgency          TEXT NOT NULL CHECK(urgency IN ('low', 'medium', 'high', 'critical')),
  target_zone      TEXT,
  channels         TEXT,
  languages        TEXT,
  translations     TEXT,
  status           TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'active', 'expired')),
  sent_by          TEXT,
  approved_by      TEXT,
  sent_at          TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  expiry_action    TEXT DEFAULT 'flag' CHECK(expiry_action IN ('delete', 'replace', 'flag')),
  expiry_message   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE: audit_log ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id               SERIAL PRIMARY KEY,
  message_id       INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  action           TEXT CHECK(action IN ('created', 'approved', 'dispatched', 'expired', 'edited')),
  performed_by     TEXT,
  details          TEXT,
  timestamp        TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE: users ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL, -- Actually stores mobile number
  password         TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'admin',
  department       TEXT,
  zone             TEXT DEFAULT 'General',
  lat              DECIMAL(10, 8),
  lng              DECIMAL(11, 8),
  last_login       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE: recipients ────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipients (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  phone            TEXT NOT NULL,
  zone             TEXT,
  lat              DECIMAL(10, 8),
  lng              DECIMAL(11, 8),
  language         TEXT DEFAULT 'en',
  active           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE: safety_reports ────────────────────────────────
CREATE TABLE IF NOT EXISTS safety_reports (
  id               SERIAL PRIMARY KEY,
  message_id       INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user_name        TEXT,
  zone             TEXT,
  status           TEXT NOT NULL CHECK(status IN ('safe', 'assistance')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Column Backfills (In case tables already existed) ────
DO $$ 
BEGIN 
  -- Users table columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='zone') THEN
    ALTER TABLE users ADD COLUMN zone TEXT DEFAULT 'General';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lat') THEN
    ALTER TABLE users ADD COLUMN lat DECIMAL(10, 8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='lng') THEN
    ALTER TABLE users ADD COLUMN lng DECIMAL(11, 8);
  END IF;

  -- Recipients table columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipients' AND column_name='lat') THEN
    ALTER TABLE recipients ADD COLUMN lat DECIMAL(10, 8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipients' AND column_name='lng') THEN
    ALTER TABLE recipients ADD COLUMN lng DECIMAL(11, 8);
  END IF;
END $$;

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_status     ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_message_id    ON audit_log(message_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp     ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
CREATE INDEX IF NOT EXISTS idx_recipients_zone     ON recipients(zone);
CREATE INDEX IF NOT EXISTS idx_recipients_phone    ON recipients(phone);

-- ── Disable Row Level Security (Universal Access) ─────────
ALTER TABLE messages       DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log      DISABLE ROW LEVEL SECURITY;
ALTER TABLE users          DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipients     DISABLE ROW LEVEL SECURITY;
ALTER TABLE safety_reports DISABLE ROW LEVEL SECURITY;

-- ── Seed Data ────────────────────────────────────────────
-- (Using ON CONFLICT to avoid duplicate seed errors)
INSERT INTO users (name, email, password, role, department)
VALUES ('Admin', 'admin@uacs.gov', '$2b$10$JYVIN2TSVvPymoxantR9se2dWU1rABAh2mZY5sq.x5/Jojv/SvhyK', 'admin', 'Central Command')
ON CONFLICT (email) DO NOTHING;

-- ── Verify ───────────────────────────────────────────────
SELECT 'users' as tbl, COUNT(*) as rows FROM users
UNION ALL SELECT 'recipients', COUNT(*) FROM recipients
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log
UNION ALL SELECT 'safety_reports', COUNT(*) FROM safety_reports;
