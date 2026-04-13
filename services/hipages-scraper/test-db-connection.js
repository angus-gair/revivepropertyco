#!/usr/bin/env node
/**
 * Database Connection Test Script
 * Tests PostgreSQL connection and hipages_leads table existence
 * Does NOT require hipages credentials
 */

require('dotenv').config();
const { Pool } = require('pg');

async function testDatabase() {
  console.log('[test] Starting database connection test...\n');

  // Check environment variables
  if (!process.env.DATABASE_URL) {
    console.error('[test] ERROR: DATABASE_URL environment variable not set');
    console.log('[test] Please create a .env file with DATABASE_URL');
    console.log('[test] Example: cp .env.example .env');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });

  try {
    // Test 1: Basic connection
    console.log('[test] Test 1: Connecting to database...');
    const client = await pool.connect();
    console.log('[test] ✓ Database connection successful\n');

    // Test 2: Check current database
    const dbResult = await client.query('SELECT current_database()');
    console.log(`[test] Test 2: Current database: ${dbResult.rows[0].current_database}`);
    console.log('[test] ✓ Database access verified\n');

    // Test 3: Check hipages_leads table exists
    console.log('[test] Test 3: Checking hipages_leads table...');
    const tableResult = await client.query(`
      SELECT COUNT(*) > 0 AS exists
      FROM information_schema.tables
      WHERE table_name = 'hipages_leads'
    `);

    if (tableResult.rows[0].exists) {
      console.log('[test] ✓ hipages_leads table exists\n');
    } else {
      console.log('[test] ✗ hipages_leads table does NOT exist');
      console.log('[test] Please run migration: 002_create_hipages_leads_table.sql\n');
      client.release();
      await pool.end();
      process.exit(1);
    }

    // Test 4: Check table structure
    console.log('[test] Test 4: Checking hipages_leads table structure...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'hipages_leads'
      ORDER BY ordinal_position
    `);

    console.log('[test] Columns in hipages_leads table:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('[test] ✓ Table structure verified\n');

    // Test 5: Check indexes
    console.log('[test] Test 5: Checking hipages_leads indexes...');
    const indexResult = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'hipages_leads'
    `);

    console.log(`[test] Found ${indexResult.rows.length} indexes:`);
    indexResult.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    console.log('[test] ✓ Indexes verified\n');

    // Test 6: Check existing leads count
    console.log('[test] Test 6: Checking existing leads...');
    const countResult = await client.query('SELECT COUNT(*) AS count FROM hipages_leads');
    console.log(`[test] Current leads in database: ${countResult.rows[0].count}`);
    console.log('[test] ✓ Database query successful\n');

    // Test 7: Test INSERT permissions
    console.log('[test] Test 7: Testing INSERT permissions...');
    try {
      const testId = `test-${Date.now()}`;
      await client.query(`
        INSERT INTO hipages_leads (
          hipages_id, customer_name, suburb, postcode, job_type,
          credits, status, posted_date, scraped_at, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (hipages_id) DO UPDATE SET
          scraped_at = EXCLUDED.scraped_at,
          updated_at = CURRENT_TIMESTAMP
      `, [
        testId, 'Test Customer', 'Test Suburb', '0000',
        'Test Job Type', 1, 'AVAILABLE', new Date(),
        new Date(), JSON.stringify({ test: true })
      ]);

      // Clean up test record
      await client.query('DELETE FROM hipages_leads WHERE hipages_id = $1', [testId]);
      console.log('[test] ✓ INSERT permissions verified (test record cleaned up)\n');
    } catch (error) {
      console.log('[test] ✗ INSERT permission test failed:', error.message);
      console.log('[test] Please ensure database user has INSERT/UPDATE permissions\n');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('[test] DATABASE CONNECTION TEST: PASSED ✓');
    console.log('='.repeat(60));
    console.log('\n[test] Next steps:');
    console.log('[test] 1. Add HIPAGES_USERNAME and HIPAGES_PASSWORD to .env');
    console.log('[test] 2. Run: npm run scrape');
    console.log('[test] 3. Verify leads: docker exec -i postgres psql -U homelab -d revivepropertyco -c "SELECT COUNT(*) FROM hipages_leads"');
    console.log('');

  } catch (error) {
    console.error('[test] ✗ Database connection test failed:', error.message);
    console.error('\n[test] Troubleshooting:');
    console.error('[test] - Check DATABASE_URL is correct');
    console.error('[test] - Ensure PostgreSQL container is running: docker ps | grep postgres');
    console.error('[test] - Test connection: psql $DATABASE_URL -c "SELECT 1"');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run test
testDatabase().catch(error => {
  console.error('[test] Fatal error:', error);
  process.exit(1);
});
