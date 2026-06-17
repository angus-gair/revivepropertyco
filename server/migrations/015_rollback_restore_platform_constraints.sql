-- Rollback 015: Drop the restored platform-table constraints;
-- Reverts migration 015. Note: dropping these re-opens the integrity gaps;
-- (duplicate tenant_modules rows, unenforced per-tenant email uniqueness) and;
-- will break the modules ON CONFLICT upsert again. Apply via psql.;

DROP INDEX IF EXISTS uq_tenant_users_tenant_email;
DROP INDEX IF EXISTS uq_tenant_modules_tenant_module;

ALTER TABLE tenant_invitations DROP CONSTRAINT IF EXISTS tenant_invitations_pkey;
ALTER TABLE tenant_modules DROP CONSTRAINT IF EXISTS tenant_modules_pkey;
ALTER TABLE tenant_users DROP CONSTRAINT IF EXISTS tenant_users_pkey;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
