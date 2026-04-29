require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixTimestamps() {
  console.log('Fixing timestamps for hipages leads...\n');

  // Update leads that have old timestamps (before the fix)
  const result = await pool.query(`
    UPDATE hipages_leads
    SET
      posted_date = (raw_data->>'posted_date')::timestamp - INTERVAL '10 hours',
      updated_at = CURRENT_TIMESTAMP
    WHERE
      raw_data ? 'posted_date'
      AND posted_date != (raw_data->>'posted_date')::timestamp - INTERVAL '10 hours'
    RETURNING
      customer_name,
      suburb,
      posted_date,
      raw_data->>'posted_date' as original_posted_date
  `);

  console.log(`Updated ${result.rowCount} leads:\n`);
  result.rows.forEach(row => {
    console.log(`${row.customer_name} (${row.suburb})`);
    console.log(`  Old: ${row.posted_date}`);
    console.log(`  New: (corrected)`);
    console.log(`  Original from hipages: ${row.original_posted_date}`);
    console.log('');
  });

  await pool.end();
  console.log('Timestamp correction complete!');
}

fixTimestamps().catch(console.error);
