-- Migration 014: Tenant-scope the customer portal;
-- The customers table had GLOBALLY-unique mobile/email, so a second tenant;
-- could never register a customer whose email/mobile already existed under;
-- another tenant. Add tenant_id, backfill to the default "revive" tenant, and;
-- replace the global UNIQUE constraints with per-tenant partial unique indexes.;
-- Requires migration 012 (which seeds the default tenant row). Date: 2026-06-16.;
-- NOTE: comment lines end with ';' so run-migration.cjs's naive split(';') keeps;
-- every statement; under psql the trailing ';' is just part of the comment.;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
UPDATE customers SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);

ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_mobile_key;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_tenant_mobile ON customers(tenant_id, mobile) WHERE mobile IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_tenant_email ON customers(tenant_id, email) WHERE email IS NOT NULL;
