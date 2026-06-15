-- Rollback 012: Remove tenant scoping from CRM business tables;
-- Reverses 012_add_tenant_scoping_crm.sql. Leaves the default tenant row in;
-- place (harmless) since other tenant tables may reference it.;
-- Comment lines end with ';' so run-migration.cjs's split keeps every statement.;

DROP INDEX IF EXISTS idx_leads_tenant;
DROP INDEX IF EXISTS idx_appointments_tenant;
DROP INDEX IF EXISTS idx_quotes_tenant;
DROP INDEX IF EXISTS idx_touchpoints_tenant;

ALTER TABLE leads DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE appointments DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE quotes DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE touchpoints DROP COLUMN IF EXISTS tenant_id;
