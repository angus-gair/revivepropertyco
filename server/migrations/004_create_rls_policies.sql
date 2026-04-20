-- Migration 004: Create Row-Level Security Policies
-- Description: Enables RLS on tenant tables for defense-in-depth tenant isolation
-- Author: Claude (GSD Planner)
-- Date: 2026-04-20
-- Version: 1.0.0

-- ============================================================================
-- CREATE APP_USER ROLE (PCORE-06)
-- ============================================================================
-- Non-superuser role for application queries (RLS requires non-superuser)
-- WR-04 fix: Remove hardcoded password - use password authentication from environment
-- The app_user password should be set via environment or manually in production:
-- ALTER ROLE app_user WITH PASSWORD '<strong-password>';
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    EXECUTE format('CREATE ROLE app_user WITH LOGIN');
  END IF;
END
$$;

COMMENT ON ROLE app_user IS 'Non-superuser role for application queries (PCORE-06: RLS requires non-superuser)';

-- ============================================================================
-- GRANT PERMISSIONS ON PLATFORM TABLES
-- ============================================================================
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenants TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenant_users TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenant_modules TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenant_invitations TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ============================================================================
-- ENABLE RLS ON TENANT-SPECIFIC TABLES (PCORE-03)
-- ============================================================================
-- Note: tenants table does NOT get RLS (platform admin needs to see all tenants)
ALTER TABLE tenant_users SET ROW LEVEL SECURITY;
ALTER TABLE tenant_modules SET ROW LEVEL SECURITY;
ALTER TABLE tenant_invitations SET ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES USING SESSION VARIABLE
-- ============================================================================

-- Policy: tenant_users isolation
-- Users can only access rows from their tenant
CREATE POLICY tenant_users_isolation ON tenant_users
  FOR ALL
  TO app_user
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

-- Policy: tenant_users full access for owners and admins
-- Owners and admins have full access to all tenant users
CREATE POLICY tenant_users_full_access_owner ON tenant_users
  FOR ALL
  TO app_user
  USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    AND current_setting('app.user_role', TRUE) IN ('owner', 'admin')
  );

-- Policy: tenant_modules isolation
-- Users can only access modules from their tenant
CREATE POLICY tenant_modules_isolation ON tenant_modules
  FOR ALL
  TO app_user
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

-- Policy: tenant_invitations isolation
-- Users can only access invitations from their tenant
CREATE POLICY tenant_invitations_isolation ON tenant_invitations
  FOR ALL
  TO app_user
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT 'app_user role exists' AS check, COUNT(*) > 0 AS result
FROM pg_roles
WHERE rolname = 'app_user';

SELECT 'tenant_users RLS enabled' AS check, relrowsecurity AS result
FROM pg_class
WHERE relname = 'tenant_users';

SELECT 'tenant_modules RLS enabled' AS check, relrowsecurity AS result
FROM pg_class
WHERE relname = 'tenant_modules';

SELECT 'tenant_invitations RLS enabled' AS check, relrowsecurity AS result
FROM pg_class
WHERE relname = 'tenant_invitations';

SELECT 'RLS policies created' AS check, COUNT(*) AS result
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('tenant_users', 'tenant_modules', 'tenant_invitations');
