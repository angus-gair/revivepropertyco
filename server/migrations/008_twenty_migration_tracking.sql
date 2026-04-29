-- Migration 008: Create Twenty Migration Tracking Table
-- Description: Creates table for tracking data migration to Twenty CRM
-- Author: Claude (GSD Executor)
-- Date: 2026-04-21
-- Version: 1.0.0

BEGIN;

-- ============================================================================
-- TWENTY_MIGRATIONS TABLE
-- ============================================================================
-- Tracks migration runs to Twenty CRM with status and results
CREATE TABLE IF NOT EXISTS twenty_migrations (
  migration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  records_exported INTEGER DEFAULT 0,
  records_transformed INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  artifact_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments
COMMENT ON TABLE twenty_migrations IS 'Tracks data migration runs to Twenty CRM';
COMMENT ON COLUMN twenty_migrations.migration_id IS 'Primary key (UUID)';
COMMENT ON COLUMN twenty_migrations.migration_name IS 'Human-readable migration name';
COMMENT ON COLUMN twenty_migrations.status IS 'Migration status: PENDING, RUNNING, COMPLETED, FAILED, ROLLED_BACK';
COMMENT ON COLUMN twenty_migrations.started_at IS 'Migration start timestamp';
COMMENT ON COLUMN twenty_migrations.completed_at IS 'Migration completion timestamp (null if running)';
COMMENT ON COLUMN twenty_migrations.records_exported IS 'Number of records exported from source';
COMMENT ON COLUMN twenty_migrations.records_transformed IS 'Number of records transformed';
COMMENT ON COLUMN twenty_migrations.records_imported IS 'Number of records imported to Twenty';
COMMENT ON COLUMN twenty_migrations.records_failed IS 'Number of records that failed to import';
COMMENT ON COLUMN twenty_migrations.error_message IS 'Error message if migration failed';
COMMENT ON COLUMN twenty_migrations.artifact_path IS 'Path to exported/transformed data artifacts';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_twenty_migrations_status ON twenty_migrations(status);
CREATE INDEX IF NOT EXISTS idx_twenty_migrations_started ON twenty_migrations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_twenty_migrations_name ON twenty_migrations(migration_name);

-- ============================================================================
-- TWENTY_MIGRATION_RECORDS TABLE
-- ============================================================================
-- Tracks individual record mappings for rollback and reference
CREATE TABLE IF NOT EXISTS twenty_migration_records (
  record_id BIGSERIAL PRIMARY KEY,
  migration_id UUID NOT NULL REFERENCES twenty_migrations(migration_id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  twenty_object_type TEXT NOT NULL,
  twenty_object_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'CREATED', 'FAILED')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments
COMMENT ON TABLE twenty_migration_records IS 'Individual record mappings for Twenty migrations';
COMMENT ON COLUMN twenty_migration_records.record_id IS 'Primary key (auto-increment)';
COMMENT ON COLUMN twenty_migration_records.migration_id IS 'Foreign key to twenty_migrations';
COMMENT ON COLUMN twenty_migration_records.source_table IS 'Source table name (e.g., leads, appointments)';
COMMENT ON COLUMN twenty_migration_records.source_id IS 'Source record ID';
COMMENT ON COLUMN twenty_migration_records.twenty_object_type IS 'Twenty object type (e.g., Person, ServiceJob)';
COMMENT ON COLUMN twenty_migration_records.twenty_object_id IS 'Twenty object ID after creation';
COMMENT ON COLUMN twenty_migration_records.status IS 'Record migration status';
COMMENT ON COLUMN twenty_migration_records.error_message IS 'Error message if record failed to migrate';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_twenty_migration_records_migration ON twenty_migration_records(migration_id);
CREATE INDEX IF NOT EXISTS idx_twenty_migration_records_source ON twenty_migration_records(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_twenty_migration_records_twenty ON twenty_migration_records(twenty_object_type, twenty_object_id);
CREATE INDEX IF NOT EXISTS idx_twenty_migration_records_status ON twenty_migration_records(status) WHERE status = 'FAILED';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check twenty_migrations table
SELECT 'twenty_migrations table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'twenty_migrations';

-- Check twenty_migration_records table
SELECT 'twenty_migration_records table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'twenty_migration_records';

-- Check indexes
SELECT 'twenty migration indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename IN ('twenty_migrations', 'twenty_migration_records');

-- Check foreign key constraint
SELECT 'twenty_migration_records.migration_id foreign key exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.table_constraints
WHERE constraint_name = 'twenty_migration_records_migration_id_fkey';

-- Check CHECK constraints
SELECT 'twenty_migrations.status check constraint exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%twenty_migrations_status_check%';

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
