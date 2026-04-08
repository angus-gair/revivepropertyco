const { Pool } = require('pg');

// Connection pool configuration - use localhost for local development
const dbUrl = process.env.DATABASE_URL || 'postgresql://homelab:BQvsf9MNbLHM0r972mJmpjYphvtUxWyhFwh4xP8v8hg@localhost:5432/revivepropertyco';

const pool = new Pool({
  connectionString: dbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

/**
 * Execute a query with retry logic
 */
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction atomically
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get pool statistics for monitoring
 */
function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW()');
    return { success: true, timestamp: result.rows[0].now };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  pool,
  query,
  transaction,
  getPoolStats,
  testConnection
};
