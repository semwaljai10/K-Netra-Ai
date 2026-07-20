-- ============================================================
-- K-NETRA User Accounts Table Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_accounts (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,                  -- Encrypted password string (XOR + base64)
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  level INTEGER DEFAULT 1,                 -- 1: L1 Admin, 2: L2 Admin
  phone TEXT,
  email TEXT,
  department TEXT,
  badge_number TEXT,
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance index for username searches
CREATE INDEX IF NOT EXISTS idx_user_username ON user_accounts(username);

-- Enable Row-Level Security
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Enable public select, insert, update, and delete access
CREATE POLICY "Allow public read on user_accounts" ON user_accounts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on user_accounts" ON user_accounts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on user_accounts" ON user_accounts
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on user_accounts" ON user_accounts
  FOR DELETE USING (true);

-- Trigger to auto-update the updated_at column
CREATE TRIGGER set_updated_at_user_accounts
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
