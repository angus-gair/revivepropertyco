-- Migration 013: Tenant-scope the appointment double-booking guard;
-- The unique index that prevents two CONFIRMED appointments in the same slot;
-- was global (date, time_slot), so different tenants could not book the same;
-- slot. Re-create it as (tenant_id, date, time_slot). Requires migration 012.;
-- Comment lines end with a semicolon so run-migration.cjs keeps both statements;

DROP INDEX IF EXISTS idx_appointments_unique_slot;
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_unique_slot ON appointments(tenant_id, date, time_slot) WHERE status = 'CONFIRMED';
