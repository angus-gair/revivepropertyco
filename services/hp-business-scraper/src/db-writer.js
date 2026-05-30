require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.HP_BUSINESSES_DB_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function createSession(tradeCategory, location) {
  const result = await pool.query(
    `INSERT INTO hp_scrape_sessions (trade_category, location)
     VALUES ($1, $2) RETURNING id`,
    [tradeCategory, location]
  );
  return result.rows[0].id;
}

async function completeSession(sessionId, counts, error = null) {
  const status = error ? 'failed' : 'completed';
  await pool.query(
    `UPDATE hp_scrape_sessions SET
      status=$1, completed_at=NOW(),
      businesses_found=$2, businesses_new=$3, businesses_updated=$4,
      error_message=$5
     WHERE id=$6`,
    [status, counts.found || 0, counts.new || 0, counts.updated || 0, error, sessionId]
  );
}

async function saveBusinesses(businesses) {
  const client = await pool.connect();
  let saved = 0, updated = 0;

  try {
    await client.query('BEGIN');

    for (const biz of businesses) {
      const profileId = biz.slug || biz.profile_url || biz.business_name.replace(/\s+/g, '-').toLowerCase();

      const result = await client.query(`
        INSERT INTO hp_businesses (
          hipages_profile_id, business_name, slug, suburb, state, postcode,
          primary_trade, trade_categories, rating, review_count, job_count,
          response_rate, years_on_hipages, profile_url, phone, website,
          verified, badge_level, description, service_areas, images_count,
          scraped_at, raw_data
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW(),$22)
        ON CONFLICT (hipages_profile_id) DO UPDATE SET
          rating = EXCLUDED.rating,
          review_count = EXCLUDED.review_count,
          job_count = EXCLUDED.job_count,
          badge_level = EXCLUDED.badge_level,
          verified = EXCLUDED.verified,
          scraped_at = EXCLUDED.scraped_at,
          last_updated = NOW(),
          raw_data = EXCLUDED.raw_data
        RETURNING id, (xmax = 0) AS is_insert
      `, [
        profileId, biz.business_name, biz.slug, biz.suburb, biz.state, biz.postcode,
        biz.primary_trade, biz.trade_categories || [], biz.rating, biz.review_count || 0,
        biz.job_count || 0, biz.response_rate, biz.years_on_hipages, biz.profile_url,
        biz.phone, biz.website, biz.verified || false, biz.badge_level,
        biz.description, biz.service_areas || [], biz.images_count || 0,
        JSON.stringify(biz)
      ]);

      if (result.rows[0]?.is_insert) saved++;
      else updated++;
    }

    await client.query("SELECT pg_notify('hp_businesses_updated', $1)", [JSON.stringify({ saved, updated })]);
    await client.query('COMMIT');
    console.log(`[db-writer] Saved ${saved} new, updated ${updated} businesses`);
    return { saved, updated };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function testConnection() {
  const result = await pool.query('SELECT NOW()');
  return { success: true, timestamp: result.rows[0].now };
}

module.exports = { createSession, completeSession, saveBusinesses, testConnection, pool };
