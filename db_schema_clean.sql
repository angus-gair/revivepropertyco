-- Revive Property Co. Database Schema
-- Created: 2026-03-12
-- Database: revivepropertyco
--
-- Note: Run CREATE DATABASE revivepropertyco; separately before this script
-- Then connect: \c revivepropertyco

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  service_interest TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'NEW', -- NEW, CONTACTED, BOOKED, ARCHIVED
  created_at BIGINT NOT NULL,
  status_history JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  type TEXT NOT NULL, -- 'QUOTE' or 'JOB'
  date TEXT NOT NULL, -- 'YYYY-MM-DD'
  time_slot TEXT NOT NULL, -- 'HH:MM'
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'CONFIRMED', -- CONFIRMED, COMPLETED, CANCELLED
  created_at BIGINT NOT NULL
);

-- Partial unique index to prevent double-booking for CONFIRMED appointments
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_unique_slot
ON appointments(date, time_slot)
WHERE status = 'CONFIRMED';

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id);

-- Touchpoint tracking
CREATE TABLE IF NOT EXISTS touchpoints (
  id TEXT PRIMARY KEY,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'PAGE_VIEW', 'CHAT_MESSAGE', 'FORM_VIEW', 'BOOKING', 'EMAIL'
  timestamp BIGINT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_touchpoints_lead ON touchpoints(lead_id, timestamp);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
  valid_until TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_lead ON quotes(lead_id);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
