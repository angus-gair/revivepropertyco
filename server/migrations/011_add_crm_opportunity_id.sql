-- Migration 011: Add crm_opportunity_id to hipages_leads
-- Description: Adds a column to store the ID of the promoted Twenty CRM Opportunity

BEGIN;

ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS crm_opportunity_id TEXT;

COMMENT ON COLUMN hipages_leads.crm_opportunity_id IS 'ID of the promoted Twenty CRM Opportunity';

COMMIT;
