-- Migration 001: Create Customer Portal Tables
-- Description: Creates tables for customer authentication, document management, quote approvals, and audit logging
-- Author: Angus James Gair
-- Date: 2026-04-13
-- Version: 1.0.0

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
-- Stores customer account information for portal login
CREATE TABLE IF NOT EXISTS customers (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  address TEXT,
  suburb VARCHAR(100),
  postcode VARCHAR(10),
  state VARCHAR(50) DEFAULT 'ACT',
  password_hash TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE customers IS 'Customer portal user accounts';
COMMENT ON COLUMN customers.customer_id IS 'Unique customer identifier (UUID)';
COMMENT ON COLUMN customers.mobile IS 'Mobile number (Australian format: +61 or 04xxxxxxxx), unique if provided';
COMMENT ON COLUMN customers.email IS 'Email address, unique if provided';
COMMENT ON COLUMN customers.password_hash IS 'Bcrypt hash of customer password';
COMMENT ON COLUMN customers.status IS 'Account status: ACTIVE or SUSPENDED';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile) WHERE mobile IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);

-- ============================================================================
-- CUSTOMER_DOCUMENTS TABLE
-- ============================================================================
-- Stores metadata for customer-uploaded documents
CREATE TABLE IF NOT EXISTS customer_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE customer_documents IS 'Customer-uploaded documents and files';
COMMENT ON COLUMN customer_documents.customer_id IS 'Foreign key to customers table, cascades on delete';
COMMENT ON COLUMN customer_documents.filename IS 'Sanitized filename stored on disk';
COMMENT ON COLUMN customer_documents.original_filename IS 'Original filename as uploaded by customer';
COMMENT ON COLUMN customer_documents.file_path IS 'Relative path to file on filesystem';
COMMENT ON COLUMN customer_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN customer_documents.mime_type IS 'MIME type for Content-Type header';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_customer ON customer_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON customer_documents(uploaded_at DESC);

-- ============================================================================
-- QUOTE_APPROVALS TABLE
-- ============================================================================
-- Audit trail for quote approval/rejection actions
CREATE TABLE IF NOT EXISTS quote_approvals (
  approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(quote_id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('APPROVED', 'REJECTED')),
  reason TEXT,
  actioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actioned_ip VARCHAR(45) -- IPv4 or IPv6
);

-- Add comments for documentation
COMMENT ON TABLE quote_approvals IS 'Audit trail for customer quote actions';
COMMENT ON COLUMN quote_approvals.quote_id IS 'Foreign key to quotes table';
COMMENT ON COLUMN quote_approvals.customer_id IS 'Foreign key to customers table';
COMMENT ON COLUMN quote_approvals.action IS 'Action taken: APPROVED or REJECTED';
COMMENT ON COLUMN quote_approvals.reason IS 'Optional reason for rejection (or approval notes)';
COMMENT ON COLUMN quote_approvals.actioned_ip IS 'IP address of customer for audit';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_approvals_quote ON quote_approvals(quote_id);
CREATE INDEX IF NOT EXISTS idx_approvals_customer ON quote_approvals(customer_id);
CREATE INDEX IF NOT EXISTS idx_approvals_actioned ON quote_approvals(actioned_at DESC);

-- ============================================================================
-- AUDIT_LOG TABLE
-- ============================================================================
-- Comprehensive audit logging for security and compliance
CREATE TABLE IF NOT EXISTS audit_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(customer_id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- LOGIN, LOGOUT, PASSWORD_CHANGE, PROFILE_UPDATE, DOCUMENT_UPLOAD, etc.
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE audit_log IS 'Security audit log for customer portal events';
COMMENT ON COLUMN audit_log.customer_id IS 'Foreign key to customers, set to NULL if customer deleted';
COMMENT ON COLUMN audit_log.action IS 'Event action type (e.g., LOGIN, LOGOUT, PASSWORD_CHANGE)';
COMMENT ON COLUMN audit_log.details IS 'Additional event details in JSON format';
COMMENT ON COLUMN audit_log.ip_address IS 'Client IP address for security tracking';
COMMENT ON COLUMN audit_log.user_agent IS 'Browser/user agent string';

-- Indexes for performance and querying
CREATE INDEX IF NOT EXISTS idx_audit_customer ON audit_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_details ON audit_log USING GIN(details);

-- ============================================================================
-- MODIFY EXISTING QUOTES TABLE
-- ============================================================================
-- Add customer portal support to existing quotes table

-- Add customer_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_id UUID REFERENCES customers(customer_id);
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'status'
  ) THEN
    ALTER TABLE quotes ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'));
  END IF;
END $$;

-- Add issued_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'issued_date'
  ) THEN
    ALTER TABLE quotes ADD COLUMN issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add expiry_date column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'expiry_date'
  ) THEN
    ALTER TABLE quotes ADD COLUMN expiry_date TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');
  END IF;
END $$;

-- Add approved_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE quotes ADD COLUMN approved_at TIMESTAMP;
  END IF;
END $$;

-- Add rejected_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE quotes ADD COLUMN rejected_at TIMESTAMP;
  END IF;
END $$;

-- Add comments for new columns
COMMENT ON COLUMN quotes.customer_id IS 'Customer who can view and approve this quote';
COMMENT ON COLUMN quotes.status IS 'Quote status: PENDING, APPROVED, REJECTED, or EXPIRED';
COMMENT ON COLUMN quotes.issued_date IS 'Date quote was issued/sent to customer';
COMMENT ON COLUMN quotes.expiry_date IS 'Quote expiration date (default 30 days from issue)';
COMMENT ON COLUMN quotes.approved_at IS 'Timestamp when customer approved quote';
COMMENT ON COLUMN quotes.rejected_at IS 'Timestamp when customer rejected quote';

-- Create index for customer lookups
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_expiry ON quotes(expiry_date);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration was successful

-- Check customers table
SELECT 'customers table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'customers';

-- Check customer_documents table
SELECT 'customer_documents table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'customer_documents';

-- Check quote_approvals table
SELECT 'quote_approvals table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'quote_approvals';

-- Check audit_log table
SELECT 'audit_log table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'audit_log';

-- Check indexes
SELECT 'customers indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename = 'customers';

SELECT 'customer_documents indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename = 'customer_documents';

SELECT 'quote_approvals indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename = 'quote_approvals';

SELECT 'audit_log indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename = 'audit_log';

-- Check quotes table modifications
SELECT 'quotes.customer_id column exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'customer_id';

SELECT 'quotes.status column exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'status';

SELECT 'quotes.expiry_date column exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.columns
WHERE table_name = 'quotes' AND column_name = 'expiry_date';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All customer portal tables and indexes have been created successfully.
-- Run the rollback script (001_rollback_customer_portal_tables.sql) to undo these changes.
