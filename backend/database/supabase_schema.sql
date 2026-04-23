-- ═══════════════════════════════════════════════════════
-- UACS Supabase Schema — COMPLETE SETUP
-- Paste this ENTIRE script in Supabase SQL Editor and click RUN
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ═══════════════════════════════════════════════════════

-- ── Drop existing tables (fresh start) ──────────────────
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS recipients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── TABLE: messages ──────────────────────────────────────
CREATE TABLE messages (
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
CREATE TABLE audit_log (
  id               SERIAL PRIMARY KEY,
  message_id       INTEGER REFERENCES messages(id) ON DELETE CASCADE,
  action           TEXT CHECK(action IN ('created', 'approved', 'dispatched', 'expired', 'edited')),
  performed_by     TEXT,
  channel          TEXT,
  timestamp        TIMESTAMPTZ DEFAULT NOW(),
  notes            TEXT
);

-- ── TABLE: users ─────────────────────────────────────────
CREATE TABLE users (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
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
CREATE TABLE recipients (
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
  status           TEXT CHECK(status IN ('safe', 'assistance')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX idx_messages_status     ON messages(status);
CREATE INDEX idx_messages_expires_at ON messages(expires_at);
CREATE INDEX idx_audit_message_id    ON audit_log(message_id);
CREATE INDEX idx_audit_timestamp     ON audit_log(timestamp);
CREATE INDEX idx_users_email         ON users(email);
CREATE INDEX idx_recipients_zone     ON recipients(zone);
CREATE INDEX idx_recipients_phone    ON recipients(phone);

-- ── Disable Row Level Security on all tables ─────────────
-- (server uses service_role key which bypasses RLS anyway,
--  but this prevents any accidental 404 issues)
ALTER TABLE messages    DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log   DISABLE ROW LEVEL SECURITY;
ALTER TABLE users       DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipients  DISABLE ROW LEVEL SECURITY;

-- ── Seed: Admin user (password = Admin@123) ───────────────
INSERT INTO users (name, email, password, role, department)
VALUES (
  'Admin',
  'admin@uacs.gov',
  '$2b$10$JYVIN2TSVvPymoxantR9se2dWU1rABAh2mZY5sq.x5/Jojv/SvhyK',
  'admin',
  'Central Command'
);

-- ── Seed: Your verified recipient ────────────────────────
INSERT INTO recipients (name, phone, zone, language, active)
VALUES ('Vaibhav Dubey', '+918169825915', 'Mumbai', 'en', TRUE);

-- ── Verify ───────────────────────────────────────────────
SELECT 'users' as tbl, COUNT(*) as rows FROM users
UNION ALL SELECT 'recipients', COUNT(*) FROM recipients
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log;
