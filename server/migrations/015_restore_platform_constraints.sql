-- Migration 015: Restore platform-table constraints that migration 003 intended;
-- The prod DB's platform tables (tenants, tenant_users, tenant_modules,;
-- tenant_invitations) were created WITHOUT their primary keys and unique;
-- constraints (003 was only partially applied). Without the unique on;
-- tenant_modules(tenant_id, module_name) the modules activation upsert;
-- (ON CONFLICT) throws, and tenant_users(tenant_id, email) uniqueness that the;
-- invitation/registration race-guards assume is unenforced. Tables are empty in;
-- prod so this is safe and instant. Date: 2026-06-16.;
-- NOTE: this migration uses DO blocks (PKs have no IF NOT EXISTS) so it must be;
-- applied via psql, NOT run-migration.cjs (whose split(';') would fracture them).;
-- All statements are idempotent / re-runnable.;

-- Per-tenant unique indexes (idempotent; ON CONFLICT can target a unique index).;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_users_tenant_email ON tenant_users(tenant_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_modules_tenant_module ON tenant_modules(tenant_id, module_name);

-- Primary keys on id (guarded so re-running is a no-op).;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'tenants'::regclass AND contype = 'p') THEN
    ALTER TABLE tenants ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'tenant_users'::regclass AND contype = 'p') THEN
    ALTER TABLE tenant_users ADD CONSTRAINT tenant_users_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'tenant_modules'::regclass AND contype = 'p') THEN
    ALTER TABLE tenant_modules ADD CONSTRAINT tenant_modules_pkey PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'tenant_invitations'::regclass AND contype = 'p') THEN
    ALTER TABLE tenant_invitations ADD CONSTRAINT tenant_invitations_pkey PRIMARY KEY (id);
  END IF;
END $$;
