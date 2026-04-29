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
 * Uses customer_name-suburb-job_type-description_hash as unique identifier
 * Excludes timestamp to prevent duplicates when same lead is scraped multiple times
 */
function generateHipagesId(lead) {
  if (lead.hipages_id) {
    return lead.hipages_id;
  }

  // Normalize customer name: use placeholder if empty
  let namePart = (lead.customer_name || '').trim();
  if (!namePart) {
    // Use job_type as fallback, or 'unknown' if both are empty
    namePart = (lead.job_type || 'unknown').trim();
  }
  namePart = namePart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Normalize suburb: remove newlines and extra whitespace
  let suburbPart = (lead.suburb || '').trim();
  suburbPart = suburbPart.replace(/\s+/g, ' ').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Add job type to distinguish different jobs from same customer
  const jobPart = (lead.job_type || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Create a hash from description to distinguish similar jobs with different details
  const descPart = (lead.description || '').trim().substring(0, 50);
  const descHash = descPart.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  const descHashStr = Math.abs(descHash).toString(16);

  // Composite key without timestamp - stable across multiple scrapes
  return `${namePart}-${suburbPart}-${jobPart}-${descHashStr}`;
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
 * IMPORTANT: Hipages displays times that users interpret as AEST, but they're actually UTC
 * We store as-is (UTC) and the frontend converts to AEST for display
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  try {
    // Parse "15th Apr 2026 - 6:24 pm" format
    // Remove ordinal suffixes (15th -> 15)
    const withoutOrdinal = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1');

    // Split into date and time parts
    const parts = withoutOrdinal.split(' - ');
    if (parts.length >= 2) {
      const datePart = parts[0].trim(); // "15th Apr 2026" -> "15 Apr 2026"
      const timePart = parts[1].trim(); // "6:24 pm"

      // Parse the date/time string (stores as UTC)
      const dateObj = new Date(datePart + ' ' + timePart);
      if (!isNaN(dateObj.getTime())) {
        return dateObj;
      }
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
