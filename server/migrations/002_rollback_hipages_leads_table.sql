-- Rollback Migration 002: hipages_leads Table
-- Description: Removes hipages_leads table and indexes
-- WARNING: This will DELETE all hipages scraped leads
-- Author: Angus James Gair
-- Date: 2026-04-13
-- Version: 1.0.0

-- ============================================================================
-- WARNING: DESTRUCTIVE OPERATION
-- ============================================================================
-- This rollback will permanently delete:
-- - All hipages scraped leads
-- - All hipages metadata (credits, status, raw data)
--
-- Ensure you have a database backup before proceeding!
-- ============================================================================

BEGIN;

-- ============================================================================
-- REMOVE INDEXES FIRST (in reverse order of creation)
-- ============================================================================

-- Drop hipages_leads indexes
DROP INDEX IF EXISTS idx_hipages_hipages_id;
DROP INDEX IF EXISTS idx_hipages_synced;
DROP INDEX IF EXISTS idx_hipages_status;
DROP INDEX IF EXISTS idx_hipages_scraped;

-- ============================================================================
-- REMOVE TABLE
-- ============================================================================

-- Drop hipages_leads table (CASCADE will remove foreign key constraints)
DROP TABLE IF EXISTS hipages_leads CASCADE;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these to verify the rollback was successful

-- Verify table is gone
SELECT 'hipages_leads table dropped' AS check, COUNT(*) = 0 AS result
FROM information_schema.tables
WHERE table_name = 'hipages_leads';

-- Verify indexes are gone
SELECT 'hipages_leads indexes dropped' AS check, COUNT(*) = 0 AS result
FROM pg_indexes
WHERE tablename = 'hipages_leads';

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
-- All hipages_leads objects have been removed successfully.
-- Re-run migration 002_create_hipages_leads_table.sql to recreate.
