-- Migration 002: Create hipages_leads Table
-- Description: Creates table for storing hipages.com.au scraped leads with metadata
-- Author: Angus James Gair
-- Date: 2026-04-13
-- Version: 1.0.0

-- ============================================================================
-- HIPAGES_LEADS TABLE
-- ============================================================================
-- Stores leads scraped from hipages.com.au for Revive Property Co.
CREATE TABLE IF NOT EXISTS hipages_leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hipages_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  suburb TEXT NOT NULL,
  postcode TEXT,
  job_type TEXT NOT NULL,
  job_subtype TEXT,
  description TEXT,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'FIRST_TO_ACCEPT', 'WAITLIST', 'ACCEPTED', 'EXPIRED')),
  contact_status TEXT,
  posted_date TIMESTAMP,
  scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_to_crm BOOLEAN DEFAULT FALSE,
  crm_lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE hipages_leads IS 'Leads scraped from hipages.com.au with metadata and CRM integration';
COMMENT ON COLUMN hipages_leads.lead_id IS 'Unique lead identifier (UUID)';
COMMENT ON COLUMN hipages_leads.hipages_id IS 'Unique ID from hipages or composite key (customer_name-suburb-posted_date)';
COMMENT ON COLUMN hipages_leads.customer_name IS 'Customer name from hipages lead';
COMMENT ON COLUMN hipages_leads.suburb IS 'Suburb where job is located';
COMMENT ON COLUMN hipages_leads.postcode IS 'Postcode of job location';
COMMENT ON COLUMN hipages_leads.job_type IS 'Primary job category (e.g., Handyman, Garden Maintenance)';
COMMENT ON COLUMN hipages_leads.job_subtype IS 'Job subtype (e.g., Furniture Assembly, Basic Tiling)';
COMMENT ON COLUMN hipages_leads.description IS 'Full job description from hipages';
COMMENT ON COLUMN hipages_leads.credits IS 'Credit cost to accept lead on hipages platform';
COMMENT ON COLUMN hipages_leads.status IS 'Lead status: AVAILABLE, FIRST_TO_ACCEPT, WAITLIST, ACCEPTED, EXPIRED';
COMMENT ON COLUMN hipages_leads.contact_status IS 'Contact details status: Supplied, Verified, Not supplied';
COMMENT ON COLUMN hipages_leads.posted_date IS 'Timestamp when lead was posted on hipages';
COMMENT ON COLUMN hipages_leads.scraped_at IS 'Timestamp when lead was scraped from hipages';
COMMENT ON COLUMN hipages_leads.synced_to_crm IS 'Whether lead has been synced to main CRM leads table';
COMMENT ON COLUMN hipages_leads.crm_lead_id IS 'Foreign key to leads table when synced';
COMMENT ON COLUMN hipages_leads.raw_data IS 'Full hipages response JSON for audit and debugging';
COMMENT ON COLUMN hipages_leads.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN hipages_leads.updated_at IS 'Record last update timestamp';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_hipages_scraped ON hipages_leads(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hipages_status ON hipages_leads(status);
CREATE INDEX IF NOT EXISTS idx_hipages_synced ON hipages_leads(synced_to_crm) WHERE synced_to_crm = FALSE;
CREATE INDEX IF NOT EXISTS idx_hipages_hipages_id ON hipages_leads(hipages_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration was successful

-- Check hipages_leads table
SELECT 'hipages_leads table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'hipages_leads';

-- Check indexes
SELECT 'hipages_leads indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename = 'hipages_leads';

-- Check foreign key constraint
SELECT 'hipages_leads.crm_lead_id foreign key exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.table_constraints
WHERE constraint_name = 'hipages_leads_crm_lead_id_fkey';

-- Check unique constraint
SELECT 'hipages_leads.hipages_id unique constraint exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.table_constraints
WHERE constraint_name = 'hipages_leads_hipages_id_key';

-- Check CHECK constraint on status
SELECT 'hipages_leads.status check constraint exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%hipages_leads_status_check%';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All hipages_leads table and indexes have been created successfully.
-- Run the rollback script (002_rollback_hipages_leads_table.sql) to undo these changes.
