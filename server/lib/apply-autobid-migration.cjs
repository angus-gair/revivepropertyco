#!/usr/bin/env node
/**
 * Idempotent applier for migration 012 (auto-bid audit columns).
 *
 * The deploy user cannot write into server/migrations/ and the homelab Postgres
 * (DATABASE_URL host "postgres") is only reachable from inside the Docker network,
 * so this runs from within the backend container against the existing pool:
 *
 *   docker exec revivepropertyco-backend node server/lib/apply-autobid-migration.cjs
 *
 * Safe to run repeatedly (ADD COLUMN IF NOT EXISTS / CREATE INDEX IF NOT EXISTS).
 */
const { query } = require('./database.cjs');

const STATEMENTS = [
  `ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_status       TEXT`,
  `ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_service_line TEXT`,
  `ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_confidence   NUMERIC`,
  `ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_reason       TEXT`,
  `ALTER TABLE hipages_leads ADD COLUMN IF NOT EXISTS auto_bid_at           TIMESTAMP`,
  `CREATE INDEX IF NOT EXISTS idx_hipages_autobid_pending ON hipages_leads (status) WHERE auto_bid_status IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_hipages_autobid_at ON hipages_leads (auto_bid_at) WHERE auto_bid_status = 'ACCEPTED'`,
  // Pre-existing bug fix: action server writes status='DECLINED' but the original CHECK
  // constraint omits it (every decline failed). Drop + re-add same name = idempotent.
  // NOT VALID: enforce for new writes immediately without failing the migration if old
  // rows contain unexpected values; validation is attempted best-effort below.
  `ALTER TABLE hipages_leads DROP CONSTRAINT IF EXISTS hipages_leads_status_check`,
  `ALTER TABLE hipages_leads ADD CONSTRAINT hipages_leads_status_check
     CHECK (status IN ('AVAILABLE', 'FIRST_TO_ACCEPT', 'WAITLIST', 'ACCEPTED', 'DECLINED', 'EXPIRED'))
     NOT VALID`,
];

(async () => {
  try {
    for (const sql of STATEMENTS) {
      await query(sql);
      console.log('  ok:', sql.replace(/\s+/g, ' ').slice(0, 80));
    }

    // Best-effort: validate the rebuilt status constraint against existing rows.
    try {
      await query(`ALTER TABLE hipages_leads VALIDATE CONSTRAINT hipages_leads_status_check`);
      console.log('  ok: VALIDATE CONSTRAINT hipages_leads_status_check');
    } catch (e) {
      const bad = await query(
        `SELECT status, COUNT(*)::int AS n FROM hipages_leads
          WHERE status NOT IN ('AVAILABLE','FIRST_TO_ACCEPT','WAITLIST','ACCEPTED','DECLINED','EXPIRED')
          GROUP BY status`
      );
      console.warn('  WARN: constraint left NOT VALID (enforced for new rows only).');
      console.warn('  Unexpected existing status values:', JSON.stringify(bad.rows));
    }
    const { rows } = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'hipages_leads' AND column_name LIKE 'auto_bid%'
      ORDER BY column_name
    `);
    console.log('\n[migration 012] auto_bid columns present:', rows.map(r => r.column_name).join(', '));
    console.log('[migration 012] done.');
    process.exit(0);
  } catch (e) {
    console.error('[migration 012] FAILED:', e.message);
    process.exit(1);
  }
})();
