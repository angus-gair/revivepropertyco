-- Migration 009: Create Webhook Event Log Table
-- Description: Creates table for logging Twenty CRM webhook events
-- Author: Claude (GSD Executor)
-- Date: 2026-04-21
-- Version: 1.0.0

BEGIN;

-- ============================================================================
-- TWENTY_WEBHOOK_EVENTS TABLE
-- ============================================================================
-- Stores all incoming webhook events from Twenty CRM for audit and debugging
CREATE TABLE IF NOT EXISTS twenty_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comments
COMMENT ON TABLE twenty_webhook_events IS 'Log of all webhook events received from Twenty CRM';
COMMENT ON COLUMN twenty_webhook_events.id IS 'Primary key (auto-increment)';
COMMENT ON COLUMN twenty_webhook_events.event_id IS 'Unique event identifier for deduplication';
COMMENT ON COLUMN twenty_webhook_events.event_type IS 'Event type (e.g., person.created, serviceJob.updated)';
COMMENT ON COLUMN twenty_webhook_events.payload IS 'Full webhook payload as JSONB';
COMMENT ON COLUMN twenty_webhook_events.received_at IS 'Timestamp when webhook was received';
COMMENT ON COLUMN twenty_webhook_events.processed IS 'Whether event was successfully processed';
COMMENT ON COLUMN twenty_webhook_events.processed_at IS 'Timestamp when processing completed';
COMMENT ON COLUMN twenty_webhook_events.error_message IS 'Error message if processing failed';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON twenty_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON twenty_webhook_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON twenty_webhook_events(processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON twenty_webhook_events(event_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table exists
SELECT 'twenty_webhook_events table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'twenty_webhook_events';

-- Check indexes
SELECT 'twenty_webhook_events indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename = 'twenty_webhook_events';

-- Check unique constraint on event_id
SELECT 'twenty_webhook_events.event_id unique constraint exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.table_constraints
WHERE constraint_name = 'twenty_webhook_events_event_id_key';

-- Sample query for recent events
-- SELECT event_type, processed, received_at FROM twenty_webhook_events ORDER BY received_at DESC LIMIT 10;

COMMIT;

-- ============================================================================
-- CLEANUP (OPTIONAL)
-- ============================================================================
-- To clean up old webhook events (older than 30 days):
-- DELETE FROM twenty_webhook_events WHERE received_at < NOW() - INTERVAL '30 days';
--
-- To clean up successfully processed events (older than 7 days):
-- DELETE FROM twenty_webhook_events WHERE processed = true AND received_at < NOW() - INTERVAL '7 days';
-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
