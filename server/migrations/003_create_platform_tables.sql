-- Migration 003: Create Platform Core Tables
-- Description: Creates multi-tenant platform foundation with tenants, users, modules, and invitations
-- Author: Claude (GSD Planner)
-- Date: 2026-04-20
-- Version: 1.0.0

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
-- Multi-tenant platform business accounts
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free_trial' CHECK (plan IN ('free_trial', 'growth', 'enterprise')),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TRIAL_EXPIRED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tenants IS 'Multi-tenant platform business accounts';
COMMENT ON COLUMN tenants.id IS 'Tenant UUID identifier (PCORE-02: UUID v7 via gen_random_uuid for now, v7 in Phase 2)';
COMMENT ON COLUMN tenants.slug IS 'Unique slug for subdomain routing (AUTH-05)';
COMMENT ON COLUMN tenants.plan IS 'Subscription plan: free_trial, growth, or enterprise (billing in Phase 7)';

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ============================================================================
-- TENANT_USERS TABLE
-- ============================================================================
-- Platform user accounts linked to tenants (D-13: role-based permissions)
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'SUSPENDED')),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, email)
);

COMMENT ON TABLE tenant_users IS 'Platform user accounts linked to tenants (D-13: role-based permissions)';
COMMENT ON COLUMN tenant_users.role IS 'User role: owner (full access), admin (manage users), member (limited)';
COMMENT ON COLUMN tenant_users.password_hash IS 'Bcrypt hash with salt rounds: 10 (AUTH-06, D-14)';

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON tenant_users(status);

-- ============================================================================
-- TENANT_MODULES TABLE
-- ============================================================================
-- Module activation per tenant (D-10: enabled/disabled flags)
CREATE TABLE IF NOT EXISTS tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_name VARCHAR(100) NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, module_name)
);

COMMENT ON TABLE tenant_modules IS 'Module activation per tenant (D-10: enabled/disabled flags)';
COMMENT ON COLUMN tenant_modules.module_name IS 'Module identifier: hipages-leads, ai-quotes, etc. (D-09)';

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_active ON tenant_modules(tenant_id, active);

-- ============================================================================
-- TENANT_INVITATIONS TABLE
-- ============================================================================
-- Pending team member invitations (AUTH-04)
CREATE TABLE IF NOT EXISTS tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  accepted_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tenant_invitations IS 'Pending team member invitations (AUTH-04)';
COMMENT ON COLUMN tenant_invitations.token IS 'One-time use token for invitation acceptance';

CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON tenant_invitations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON tenant_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON tenant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_expires ON tenant_invitations(expires_at);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT 'tenants table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'tenants';

SELECT 'tenant_users table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'tenant_users';

SELECT 'tenant_modules table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'tenant_modules';

SELECT 'tenant_invitations table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'tenant_invitations';

SELECT 'tenants indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename = 'tenants';

SELECT 'tenant slug unique constraint' AS check, COUNT(*) AS result
FROM pg_constraint
WHERE conname = 'tenants_slug_key';
