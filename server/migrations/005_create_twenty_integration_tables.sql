-- Migration 005: Create Twenty Integration Tables
-- Description: Creates tables for linking tenants to Twenty workspaces and storing API tokens
-- Author: Claude (GSD Planner)
-- Date: 2026-04-20
-- Version: 1.0.0

BEGIN;

-- ============================================================================
-- TWENTY_WORKSPACES TABLE
-- ============================================================================
-- Stores mapping between platform tenants and Twenty CRM workspaces
CREATE TABLE IF NOT EXISTS twenty_workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  twenty_workspace_id TEXT NOT NULL, -- Twenty's internal workspace ID
  twenty_workspace_name TEXT NOT NULL,
  twenty_workspace_slug TEXT,
  server_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, twenty_workspace_id)
);

-- Add comments
COMMENT ON TABLE twenty_workspaces IS 'Mapping between platform tenants and Twenty CRM workspaces';
COMMENT ON COLUMN twenty_workspaces.workspace_id IS 'Primary key (UUID)';
COMMENT ON COLUMN twenty_workspaces.tenant_id IS 'Foreign key to tenants table';
COMMENT ON COLUMN twenty_workspaces.twenty_workspace_id IS 'Twenty CRM internal workspace ID';
COMMENT ON COLUMN twenty_workspaces.twenty_workspace_name IS 'Human-readable workspace name';
COMMENT ON COLUMN twenty_workspaces.twenty_workspace_slug IS 'URL-friendly workspace identifier';
COMMENT ON COLUMN twenty_workspaces.server_url IS 'Twenty server URL for this workspace';

-- ============================================================================
-- TENANT_TWENTY_TOKENS TABLE
-- ============================================================================
-- Stores encrypted API tokens for platform-to-Twenty communication per tenant
CREATE TABLE IF NOT EXISTS tenant_twenty_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES twenty_workspaces(workspace_id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('API', 'WEBHOOK')),
  encrypted_token TEXT NOT NULL, -- API token encrypted at rest
  token_label TEXT, -- Human-readable label (e.g., "Production token")
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, workspace_id, token_type)
);

-- Add comments
COMMENT ON TABLE tenant_twenty_tokens IS 'Encrypted API tokens for platform-to-Twenty communication';
COMMENT ON COLUMN tenant_twenty_tokens.token_id IS 'Primary key (UUID)';
COMMENT ON COLUMN tenant_twenty_tokens.tenant_id IS 'Foreign key to tenants table';
COMMENT ON COLUMN tenant_twenty_tokens.workspace_id IS 'Foreign key to twenty_workspaces table';
COMMENT ON COLUMN tenant_twenty_tokens.token_type IS 'Type of token: API or WEBHOOK';
COMMENT ON COLUMN tenant_twenty_tokens.encrypted_token IS 'API token encrypted at rest';
COMMENT ON COLUMN tenant_twenty_tokens.token_label IS 'Human-readable label for the token';
COMMENT ON COLUMN tenant_twenty_tokens.last_used_at IS 'Timestamp when token was last used';
COMMENT ON COLUMN tenant_twenty_tokens.expires_at IS 'Token expiration timestamp (nullable)';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_twenty_workspaces_tenant ON twenty_workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_twenty_workspaces_slug ON twenty_workspaces(twenty_workspace_slug);
CREATE INDEX IF NOT EXISTS idx_tenant_tokens_tenant ON tenant_twenty_tokens(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_tokens_workspace ON tenant_twenty_tokens(workspace_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration was successful

-- Check twenty_workspaces table
SELECT 'twenty_workspaces table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'twenty_workspaces';

-- Check tenant_twenty_tokens table
SELECT 'tenant_twenty_tokens table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'tenant_twenty_tokens';

-- Check indexes
SELECT 'twenty integration indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename IN ('twenty_workspaces', 'tenant_twenty_tokens');

-- Check foreign key to tenants
SELECT 'twenty_workspaces.tenant_id foreign key exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.table_constraints
WHERE constraint_name = 'twenty_workspaces_tenant_id_fkey';

-- Check CHECK constraint on token_type
SELECT 'tenant_twenty_tokens.token_type check constraint exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%tenant_twenty_tokens_token_type_check%';

COMMIT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
