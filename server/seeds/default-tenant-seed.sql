-- Default Tenant Seed Data
-- Description: Functions to create default pipeline stages, categories, and settings for new tenants
-- Author: Claude (GSD Planner)
-- Date: 2026-04-20
-- Version: 1.0.0

-- ============================================================================
-- FUNCTION: SEED_DEFAULT_PIPELINE_STAGES
-- ============================================================================
-- Creates default pipeline stages for new tenant (AUTH-07, D-04)
CREATE OR REPLACE FUNCTION seed_default_pipeline_stages(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO pipeline_stages (tenant_id, name, "order", color, created_at)
  VALUES
    (p_tenant_id, 'New', 1, '#3B82F6', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Contacted', 2, '#F59E0B', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Qualified', 3, '#10B981', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Quote Sent', 4, '#8B5CF6', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Booked', 5, '#EC4899', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Completed', 6, '#6366F1', CURRENT_TIMESTAMP)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_default_pipeline_stages IS 'Create default pipeline stages for new tenant (AUTH-07, D-04)';

-- ============================================================================
-- FUNCTION: SEED_DEFAULT_CATEGORIES
-- ============================================================================
-- Creates default service categories for new tenant (AUTH-07, D-04)
CREATE OR REPLACE FUNCTION seed_default_categories(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (tenant_id, name, icon, created_at)
  VALUES
    (p_tenant_id, 'Pressure Washing', 'water-drop', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Garden Maintenance', 'leaf', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Rubbish Removal', 'trash', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Lawn Mowing', 'scissors', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Pool Maintenance', 'waves', CURRENT_TIMESTAMP),
    (p_tenant_id, 'Re-grouting', 'grid', CURRENT_TIMESTAMP)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_default_categories IS 'Create default service categories for new tenant (AUTH-07, D-04)';

-- ============================================================================
-- FUNCTION: SEED_TENANT_DEFAULTS (WRAPPER)
-- ============================================================================
-- Seed all default data for new tenant - call this after tenant creation
CREATE OR REPLACE FUNCTION seed_tenant_defaults(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM seed_default_pipeline_stages(p_tenant_id);
  PERFORM seed_default_categories(p_tenant_id);
  RAISE NOTICE 'Default seed data created for tenant %', p_tenant_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_tenant_defaults IS 'Seed all default data for new tenant - call this after tenant creation';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'seed_default_pipeline_stages function exists' AS check, COUNT(*) > 0 AS result
FROM pg_proc
WHERE proname = 'seed_default_pipeline_stages';

SELECT 'seed_default_categories function exists' AS check, COUNT(*) > 0 AS result
FROM pg_proc
WHERE proname = 'seed_default_categories';

SELECT 'seed_tenant_defaults function exists' AS check, COUNT(*) > 0 AS result
FROM pg_proc
WHERE proname = 'seed_tenant_defaults';
