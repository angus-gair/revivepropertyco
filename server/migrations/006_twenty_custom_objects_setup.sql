-- Migration 006: Twenty CRM Custom Objects Reference
-- Description: Reference SQL for Twenty custom objects (created via GraphQL API, not in PostgreSQL)
-- Author: Claude (GSD Planner)
-- Date: 2026-04-20
-- Version: 1.0.0
--
-- NOTE: This migration is for documentation purposes only.
-- Twenty CRM custom objects are created via GraphQL API, not in the platform database.
-- See server/lib/twenty-schema.cjs for the actual object creation logic.
--
-- The following shows the schema that will be created in Twenty CRM:

-- ============================================================================
-- TWENTY CRM: ServiceJob CUSTOM OBJECT (created via GraphQL)
-- ============================================================================
-- Maps to platform's Lead/Appointment domain
--
-- GraphQL mutation:
-- mutation {
--   createOneObject(name: "ServiceJob", description: "Property service job from platform") {
--     id, name, label
--   }
-- }
--
-- Fields:
-- - name: TEXT (standard)
-- - status: SELECT (NEW, CONTACTED, BOOKED, ARCHIVED)
-- - serviceType: SELECT (PRESSURE_WASHING, GARDEN_MAINTENANCE, LAWN_MOWING, POOL_MAINTENANCE, RUBBISH_REMOVAL, RE_GROUTING)
-- - address: TEXT
-- - originalLeadId: TEXT
-- - notes: TEXT
-- - person: RELATION to Person (Twenty standard object)
--
-- Platform equivalent: leads, appointments tables

-- ============================================================================
-- TWENTY CRM: HipagesLead CUSTOM OBJECT (created via GraphQL)
-- ============================================================================
-- Extends ServiceJob with hipages-specific fields
--
-- GraphQL mutation:
-- mutation {
--   createOneObject(name: "HipagesLead", description: "Lead scraped from hipages.com.au") {
--     id, name, label
--   }
-- }
--
-- Fields:
-- - name: TEXT (standard)
-- - sourceUrl: TEXT
-- - postedDate: DATE
-- - scrapedAt: DATE
-- - hipagesStatus: SELECT (AVAILABLE, FIRST_TO_ACCEPT, WAITLIST, ACCEPTED, EXPIRED)
-- - credits: NUMBER
-- - person: RELATION to Person (Twenty standard object)
--
-- Platform equivalent: hipages_leads table

-- ============================================================================
-- TWENTY CRM: Quote CUSTOM OBJECT (created via GraphQL)
-- ============================================================================
-- Maps to platform's Quote domain
--
-- GraphQL mutation:
-- mutation {
--   createOneObject(name: "Quote", description: "Service quote for customer") {
--     id, name, label
--   }
-- }
--
-- Fields:
-- - name: TEXT (standard)
-- - status: SELECT (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED)
-- - totalAmount: CURRENCY
-- - expiryDate: DATE
-- - approvedAt: DATE
-- - rejectedAt: DATE
-- - lineItems: JSON
-- - serviceJob: RELATION to ServiceJob
--
-- Platform equivalent: quotes table

-- ============================================================================
-- PLATFORM: Verification Query
-- ============================================================================
-- Verify that Twenty integration tables exist (from migration 005)

SELECT 'twenty_workspaces table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'twenty_workspaces';

SELECT 'tenant_twenty_tokens table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'tenant_twenty_tokens';

-- ============================================================================
-- MIGRATION COMPLETE (Reference Only)
-- ============================================================================
-- To create custom objects in Twenty CRM, use the platform API:
-- POST /api/twenty/setup-objects
-- or call setupWorkspaceSchema() from server/lib/twenty-schema.cjs
