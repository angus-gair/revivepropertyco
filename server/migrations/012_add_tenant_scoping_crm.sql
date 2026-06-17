-- Migration 012: Tenant-scope CRM business tables;
-- Adds tenant_id to leads, appointments, quotes, touchpoints so the DB-backed;
-- CRM is isolated per platform tenant. Seeds a default "revive" tenant and;
-- backfills existing rows to it so admin + public booking behaviour is preserved.;
-- Author: Claude (direct implementation). Date: 2026-06-15.;
-- NOTE: comment lines end with ';' so run-migration.cjs's naive split(';') keeps;
-- every statement; under psql the trailing ';' is just part of the comment.;
-- If a `tasks` table exists in your DB, also run (it has no schema in repo):;
--   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
--   UPDATE tasks SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
--   CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);

INSERT INTO tenants (id, name, slug, plan, status) VALUES ('00000000-0000-0000-0000-000000000001', 'Revive Property Co.', 'revive', 'enterprise', 'ACTIVE') ON CONFLICT (id) DO NOTHING;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE touchpoints ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

UPDATE leads SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE appointments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE quotes SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE touchpoints SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_tenant ON touchpoints(tenant_id);
