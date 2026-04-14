require('dotenv').config();
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

/**
 * Generate a composite hipages_id from lead fields
 * Uses customer_name-suburb-posted_date as unique identifier
 */
function generateHipagesId(lead) {
  if (lead.hipages_id) {
    return lead.hipages_id;
  }

  // Create composite key from name, suburb, and posted date
  const namePart = (lead.customer_name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const suburbPart = (lead.suburb || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const datePart = lead.posted_date ? new Date(lead.posted_date).getTime() : Date.now();

  return `${namePart}-${suburbPart}-${datePart}`;
}

/**
 * Normalize hipages status to database enum values
 */
function normalizeStatus(status) {
  if (!status) {
    return 'AVAILABLE';
  }

  const statusMap = {
    'Available': 'AVAILABLE',
    'First to accept': 'FIRST_TO_ACCEPT',
    'Waitlist': 'WAITLIST',
    'Accepted': 'ACCEPTED',
    'Expired': 'EXPIRED'
  };

  return statusMap[status] || status.toUpperCase();
}

/**
 * Parse hipages date format to TIMESTAMP
 * Handles formats like "11th Apr 2026 - 9:53 pm"
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  try {
    // Parse "11th Apr 2026 - 9:53 pm" format
    const cleaned = dateStr
      .replace(/(\d+)(st|nd|rd|th)/, '$1') // Remove ordinal suffixes
      .replace(/-\s*\d+:\d+\s*(am|pm)/i, '') // Remove time part for now
      .trim();

    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Fallback: try parsing as-is
    const fallback = new Date(dateStr);
    if (!isNaN(fallback.getTime())) {
      return fallback;
    }

    console.warn(`Failed to parse date: ${dateStr}`);
    return null;
  } catch (error) {
    console.warn(`Error parsing date ${dateStr}:`, error.message);
    return null;
  }
}

/**
 * Save leads to hipages_leads table
 * Uses transaction with ON CONFLICT DO UPDATE for upsert
 * Emits PostgreSQL NOTIFY for real-time updates
 */
async function saveLeads(leads) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let saved = 0;
    let updated = 0;

    const insertStmt = `
      INSERT INTO hipages_leads (
        hipages_id,
        customer_name,
        suburb,
        postcode,
        job_type,
        job_subtype,
        description,
        credits,
        status,
        contact_status,
        posted_date,
        scraped_at,
        raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (hipages_id) DO UPDATE SET
        status = EXCLUDED.status,
        contact_status = EXCLUDED.contact_status,
        scraped_at = EXCLUDED.scraped_at,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING lead_id
    `;

    for (const lead of leads) {
      const hipagesId = generateHipagesId(lead);
      const postedDate = parseDate(lead.posted_date);
      const status = normalizeStatus(lead.status);

      const values = [
        hipagesId,
        lead.customer_name || '',
        lead.suburb || '',
        lead.postcode || null,
        lead.job_type || '',
        lead.job_subtype || null,
        lead.description || null,
        lead.credits || 0,
        status,
        lead.contact_status || null,
        postedDate,
        new Date(), // scraped_at
        JSON.stringify(lead) // raw_data
      ];

      const result = await client.query(insertStmt, values);

      // Check if this was an insert or update
      if (result.rows[0]) {
        saved++;
      }
    }

    // Emit PostgreSQL NOTIFY for real-time dashboard updates
    await client.query(`NOTIFY hipages_leads_updated, '{"count": ${saved}}'`);

    await client.query('COMMIT');

    console.log(`[db-writer] Saved ${saved} leads to database`);
    return { saved, updated };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[db-writer] Error saving leads:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('[db-writer] Database connection successful:', result.rows[0].now);
    return { success: true, timestamp: result.rows[0].now };
  } catch (error) {
    console.error('[db-writer] Database connection failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  saveLeads,
  testConnection,
  pool
};
