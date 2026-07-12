-- ============================================================
-- K-NETRA Crime Analytics — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Main FIR records table
CREATE TABLE IF NOT EXISTS fir_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fir_number TEXT UNIQUE NOT NULL,
  case_status TEXT NOT NULL DEFAULT 'Open',
  district TEXT,
  crime_type TEXT,
  severity TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  date_time_of_filing TIMESTAMPTZ,
  data JSONB NOT NULL,
  status_modification JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_fir_district ON fir_records(district);
CREATE INDEX IF NOT EXISTS idx_fir_crime_type ON fir_records(crime_type);
CREATE INDEX IF NOT EXISTS idx_fir_case_status ON fir_records(case_status);
CREATE INDEX IF NOT EXISTS idx_fir_severity ON fir_records(severity);
CREATE INDEX IF NOT EXISTS idx_fir_date ON fir_records(date_time_of_filing);
CREATE INDEX IF NOT EXISTS idx_fir_number ON fir_records(fir_number);

-- Row-Level Security: Allow public read/write via anon key
-- (For production, replace with proper auth policies)
ALTER TABLE fir_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON fir_records
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON fir_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON fir_records
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete" ON fir_records
  FOR DELETE USING (true);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON fir_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Session store table for tracking operator sessions and system parameters
CREATE TABLE IF NOT EXISTS session_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for session store
ALTER TABLE session_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on session_store" ON session_store
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on session_store" ON session_store
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on session_store" ON session_store
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on session_store" ON session_store
  FOR DELETE USING (true);

-- Enable Realtime replication for fir_records
ALTER PUBLICATION supabase_realtime ADD TABLE fir_records;


