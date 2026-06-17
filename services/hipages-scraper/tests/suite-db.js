'use strict';
// DB suite: connectivity, schema, upsert, delta detection, duplicate guard.
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { ok, equal, gt, suite } = require('./lib/assert.js');
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  const client = await pool.connect();

  try {
    await suite('DB connectivity', async () => {
      const { rows } = await client.query('SELECT 1 AS ping');
      equal(rows[0].ping, 1, 'Postgres responds');
    });

    await suite('Schema: hipages_leads', async () => {
      const { rows } = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'hipages_leads'
      `);
      const cols = rows.map(r => r.column_name);
      ok(cols.includes('hipages_id'),     'hipages_id column exists');
      ok(cols.includes('synced_to_crm'),  'synced_to_crm column exists');
      ok(cols.includes('crm_opportunity_id'), 'crm_opportunity_id column exists');

      const { rows: idx } = await client.query(`
        SELECT indexname FROM pg_indexes WHERE tablename = 'hipages_leads'
      `);
      ok(idx.some(i => i.indexname.includes('hipages_id')), 'UNIQUE index on hipages_id');
    });

    await suite('Stats: current state', async () => {
      const { rows: [s] } = await client.query(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE synced_to_crm = false) as unsynced,
          COUNT(*) FILTER (WHERE synced_to_crm = true)  as synced
        FROM hipages_leads
      `);
      gt(parseInt(s.total), 0, `Total leads > 0 (${s.total})`);
      console.log(`  ℹ Unsynced backlog: ${s.unsynced}`);
      console.log(`  ℹ Synced to CRM:   ${s.synced}`);
    });

    await suite('Delta detection: xmax trick', async () => {
      const testId = `delta-test-${Date.now()}`;
      // INSERT — xmax should be 0
      const { rows: [ins] } = await client.query(`
        INSERT INTO hipages_leads (hipages_id, customer_name, suburb, job_type, credits, status, scraped_at, raw_data)
        VALUES ($1, 'Delta Test', 'TestSuburb', 'Pressure Washing', 1, 'AVAILABLE', NOW(), '{}')
        ON CONFLICT (hipages_id) DO UPDATE SET scraped_at = EXCLUDED.scraped_at
        RETURNING lead_id, (xmax = 0) AS is_new
      `, [testId]);
      equal(ins.is_new, true, 'Fresh insert → is_new = true');

      // UPDATE — xmax should be non-zero
      const { rows: [upd] } = await client.query(`
        INSERT INTO hipages_leads (hipages_id, customer_name, suburb, job_type, credits, status, scraped_at, raw_data)
        VALUES ($1, 'Delta Test', 'TestSuburb', 'Pressure Washing', 1, 'ACCEPTED', NOW(), '{}')
        ON CONFLICT (hipages_id) DO UPDATE SET status = EXCLUDED.status, scraped_at = EXCLUDED.scraped_at
        RETURNING lead_id, (xmax = 0) AS is_new
      `, [testId]);
      equal(upd.is_new, false, 'Conflict update → is_new = false');

      // Cleanup
      await client.query('DELETE FROM hipages_leads WHERE hipages_id = $1', [testId]);
    });

    await suite('Duplicate guard: no same-run dupes', async () => {
      const { rows: [{ cnt }] } = await client.query(`
        SELECT COUNT(*) as cnt FROM (
          SELECT customer_name, suburb, job_type
          FROM hipages_leads
          GROUP BY customer_name, suburb, job_type
          HAVING COUNT(*) > 1
            AND MAX(scraped_at) - MIN(scraped_at) < INTERVAL '2 hours'
        ) sub
      `);
      equal(parseInt(cnt), 0, `No same-run duplicate groups (found ${cnt})`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { run };
