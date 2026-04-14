-- Rollback Migration 001: Customer Portal Tables
-- Description: Removes customer portal tables and reverts quotes table changes
-- WARNING: This will DELETE all customer data, documents, and audit logs
-- Author: Angus James Gair
-- Date: 2026-04-13
-- Version: 1.0.0

-- ============================================================================
-- WARNING: DESTRUCTIVE OPERATION
-- ============================================================================
-- This rollback will permanently delete:
-- - All customer accounts
-- - All customer documents
-- - All quote approval history
-- - All audit logs
--
-- Ensure you have a database backup before proceeding!
-- ============================================================================

BEGIN;

-- ============================================================================
-- REMOVE INDEXES FIRST
-- ============================================================================

-- Drop customer_documents indexes
DROP INDEX IF EXISTS idx_documents_customer;
DROP INDEX IF EXISTS idx_documents_uploaded;

-- Drop quote_approvals indexes
DROP INDEX IF EXISTS idx_approvals_quote;
DROP INDEX IF EXISTS idx_approvals_customer;
DROP INDEX IF EXISTS idx_approvals_actioned;

-- Drop audit_log indexes
DROP INDEX IF EXISTS idx_audit_customer;
DROP INDEX IF EXISTS idx_audit_action;
DROP INDEX IF EXISTS idx_audit_created;
DROP INDEX IF EXISTS idx_audit_details;

-- Drop customers indexes
DROP INDEX IF EXISTS idx_customers_mobile;
DROP INDEX IF EXISTS idx_customers_email;
DROP INDEX IF EXISTS idx_customers_status;
DROP INDEX IF EXISTS idx_customers_created;

-- Drop quotes indexes (new ones added)
DROP INDEX IF EXISTS idx_quotes_customer;
DROP INDEX IF EXISTS idx_quotes_status;
DROP INDEX IF EXISTS idx_quotes_expiry;

-- ============================================================================
-- REMOVE TABLES (in correct order due to foreign keys)
-- ============================================================================

-- Drop child tables first (they reference customers)
DROP TABLE IF EXISTS customer_documents CASCADE;
DROP TABLE IF EXISTS quote_approvals CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;

-- Drop customers table last
DROP TABLE IF EXISTS customers CASCADE;

-- ============================================================================
-- REVERT QUOTES TABLE MODIFICATIONS
-- ============================================================================

-- Remove columns from quotes table (if they exist)
DO $$
BEGIN
  -- Remove in reverse order of creation
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE quotes DROP COLUMN rejected_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE quotes DROP COLUMN approved_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'expiry_date'
  ) THEN
    ALTER TABLE quotes DROP COLUMN expiry_date;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'issued_date'
  ) THEN
    ALTER TABLE quotes DROP COLUMN issued_date;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'status'
  ) THEN
    ALTER TABLE quotes DROP COLUMN status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE quotes DROP COLUMN customer_id;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the rollback was successful

-- Verify tables are dropped
SELECT 'customers table dropped' AS check, COUNT(*) = 0 AS result
FROM information_schema.tables
WHERE table_name = 'customers';

SELECT 'customer_documents table dropped' AS check, COUNT(*) = 0 AS result
FROM information_schema.tables
WHERE table_name = 'customer_documents';

SELECT 'quote_approvals table dropped' AS check, COUNT(*) = 0 AS result
FROM information_schema.tables
WHERE table_name = 'quote_approvals';

SELECT 'audit_log table dropped' AS check, COUNT(*) = 0 AS result
FROM information_schema.tables
WHERE table_name = 'audit_log';

-- Verify quotes table columns are removed
SELECT 'quotes.customer_id column removed' AS check, COUNT(*) = 0 AS result
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'customer_id';

SELECT 'quotes.status column removed' AS check, COUNT(*) = 0 AS result
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'status';

SELECT 'quotes.issued_date column removed' AS check, COUNT(*) = 0 AS result
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'issued_date';

SELECT 'quotes.expiry_date column removed' AS check, COUNT(*) = 0 AS result
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'expiry_date';

SELECT 'quotes.approved_at column removed' AS check, COUNT(*) = 0 AS result
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'approved_at';

SELECT 'quotes.rejected_at column removed' AS check, COUNT(*) = 0 AS result
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'rejected_at';

COMMIT;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================
-- All customer portal tables and quotes modifications have been removed.
-- The database is now in its previous state.
