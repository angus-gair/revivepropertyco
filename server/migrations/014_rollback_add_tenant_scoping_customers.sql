-- Rollback 014: Restore global customer uniqueness and drop tenant scoping;
-- Reverts the per-tenant partial unique indexes back to global UNIQUE;
-- constraints on mobile/email, and drops the tenant_id column.;
-- WARNING: if two tenants share a customer email/mobile this will fail;
-- (the global UNIQUE can no longer be satisfied). Resolve duplicates first.;

DROP INDEX IF EXISTS idx_customers_tenant_mobile;
DROP INDEX IF EXISTS idx_customers_tenant_email;

ALTER TABLE customers ADD CONSTRAINT customers_mobile_key UNIQUE (mobile);
ALTER TABLE customers ADD CONSTRAINT customers_email_key UNIQUE (email);

DROP INDEX IF EXISTS idx_customers_tenant;
ALTER TABLE customers DROP COLUMN IF EXISTS tenant_id;
