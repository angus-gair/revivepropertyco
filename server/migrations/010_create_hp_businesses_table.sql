-- Migration 010: Create hp_businesses and hp_scrape_sessions in hipages_directory database
-- Description: Hipages business directory module — stores contractor listings for analytics
-- Database: hipages_directory (SEPARATE from revivepropertyco)
-- Run: psql -U homelab -d hipages_directory < this_file.sql

CREATE TABLE IF NOT EXISTS hp_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hipages_profile_id TEXT UNIQUE,
  business_name TEXT NOT NULL,
  slug TEXT,
  suburb TEXT,
  state TEXT,
  postcode TEXT,
  primary_trade TEXT,
  trade_categories TEXT[],
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  job_count INTEGER DEFAULT 0,
  response_rate TEXT,
  years_on_hipages INTEGER,
  profile_url TEXT,
  phone TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT FALSE,
  badge_level TEXT,
  description TEXT,
  service_areas TEXT[],
  images_count INTEGER DEFAULT 0,
  lead_status TEXT DEFAULT 'NEW' CHECK (lead_status IN ('NEW', 'CONTACTED', 'CONVERTED', 'ARCHIVED')),
  scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hp_scrape_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  trade_category TEXT,
  location TEXT,
  businesses_found INTEGER DEFAULT 0,
  businesses_new INTEGER DEFAULT 0,
  businesses_updated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_hp_businesses_scraped ON hp_businesses(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hp_businesses_trade ON hp_businesses(primary_trade);
CREATE INDEX IF NOT EXISTS idx_hp_businesses_suburb ON hp_businesses(suburb);
CREATE INDEX IF NOT EXISTS idx_hp_businesses_state ON hp_businesses(state);
CREATE INDEX IF NOT EXISTS idx_hp_businesses_rating ON hp_businesses(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_hp_businesses_status ON hp_businesses(lead_status);
CREATE INDEX IF NOT EXISTS idx_hp_businesses_profile_id ON hp_businesses(hipages_profile_id);
