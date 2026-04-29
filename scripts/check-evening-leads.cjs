require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkRecentLeads() {
  const result = await pool.query(`
    SELECT
      customer_name,
      suburb,
      posted_date,
      raw_data->>'posted_date' as original_posted_date,
      scraped_at
    FROM hipages_leads
    WHERE scraped_at > NOW() - INTERVAL '1 day'
    ORDER BY posted_date DESC
    LIMIT 15
  `);

  console.log('\n=== RECENT LEADS (last 24 hours) ===\n');
  result.rows.forEach((row, i) => {
    console.log(`${i + 1}. ${row.customer_name} - ${row.suburb}`);
    console.log(`   Posted: ${row.posted_date}`);
    console.log(`   Original: ${row.original_posted_date}`);
    console.log(`   Scraped: ${row.scraped_at}`);
    console.log('');
  });

  // Check for the specific evening leads the user mentioned
  console.log('\n=== CHECKING FOR EVENING LEADS (7-8 PM) ===\n');
  const eveningLeads = [
    { name: 'Leon', time: '8:07 pm' },
    { name: 'Bonny', time: '7:57 pm' },
    { name: 'Gordon', time: '7:55 pm' },
    { name: 'Phillip', time: '7:45 pm' },
    { name: 'Nikki', time: '7:39 pm' },
    { name: 'Matt', time: '7:25 pm' }
  ];

  for (const lead of eveningLeads) {
    const result = await pool.query(`
      SELECT
        customer_name,
        suburb,
        posted_date,
        raw_data->>'posted_date' as original_posted_date,
        raw_data
      FROM hipages_leads
      WHERE customer_name ILIKE $1
      ORDER BY scraped_at DESC
      LIMIT 1
    `, [`%${lead.name}%`]);

    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log(`✓ ${lead.name} - Expected: ${lead.time}`);
      console.log(`  Posted in DB: ${row.posted_date}`);
      console.log(`  Original from hipages: ${row.original_posted_date}`);
      console.log(`  Suburb: ${row.suburb}`);
    } else {
      console.log(`✗ ${lead.name} - Expected: ${lead.time} - NOT FOUND`);
    }
    console.log('');
  }

  await pool.end();
}

checkRecentLeads().catch(console.error);
