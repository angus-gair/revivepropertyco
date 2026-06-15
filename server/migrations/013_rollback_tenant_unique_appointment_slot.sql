-- Rollback 013: Restore the global appointment double-booking guard;
-- Reverts the unique slot index to (date, time_slot) across all tenants.;

DROP INDEX IF EXISTS idx_appointments_unique_slot;
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_unique_slot ON appointments(date, time_slot) WHERE status = 'CONFIRMED';
