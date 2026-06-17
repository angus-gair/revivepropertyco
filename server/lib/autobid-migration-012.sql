-- Migration 012: Auto-bid audit columns on hipages_leads
-- Description: Adds the decision-ledger columns used by the autonomous HiPages
--              auto-bidder (n8n + AI classification). A NULL auto_bid_status means
--              "not yet evaluated"; once set (ACCEPTED / SKIPPED / FAILED) the lead is
--              excluded from the auto-bid candidate query so it is never re-processed.
-- Author: Riv auto-bid feature
-- Note: migrations/ is not writable by the deploy user, so this file lives in
--       server/lib/. It is applied idempotently via server/lib/apply-autobid-migration.cjs
--       (ADD COLUMN IF NOT EXISTS). Copy it into server/migrations/012_*.sql to track it
--       with the other migrations if desired.

ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_status       TEXT;       -- NULL=unevaluated | ACCEPTED | SKIPPED | FAILED
ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_service_line TEXT;       -- pressure_washing | regrouting | none
ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_confidence   NUMERIC;    -- model confidence 0..1
ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_reason       TEXT;       -- one-line AI rationale (audit)
ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_at           TIMESTAMP;  -- when the decision was recorded

-- Fast lookup of un-evaluated, still-open leads (the auto-bid candidate set)
CREATE INDEX IF NOT EXISTS idx_hipages_autobid_pending
  ON hipages_leads (status)
  WHERE auto_bid_status IS NULL;

-- Count today's autonomous accepts cheaply (daily spend cap)
CREATE INDEX IF NOT EXISTS idx_hipages_autobid_at
  ON hipages_leads (auto_bid_at)
  WHERE auto_bid_status = 'ACCEPTED';

-- Pre-existing bug fix: the action server writes status='DECLINED' on declines, but the
-- original CHECK constraint (migration 002) omits it, so every decline failed at the DB
-- update. Drop + re-add (same auto-generated name) keeps this idempotent.
-- NOT VALID = enforced for new writes without failing if old rows hold unexpected values;
-- the runner (apply-autobid-migration.cjs) attempts VALIDATE CONSTRAINT afterwards.
ALTER TABLE hipages_leads DROP CONSTRAINT IF EXISTS hipages_leads_status_check;
ALTER TABLE hipages_leads ADD CONSTRAINT hipages_leads_status_check
  CHECK (status IN ('AVAILABLE', 'FIRST_TO_ACCEPT', 'WAITLIST', 'ACCEPTED', 'DECLINED', 'EXPIRED'))
  NOT VALID;
