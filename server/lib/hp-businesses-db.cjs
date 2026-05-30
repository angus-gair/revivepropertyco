'use strict';
const { Pool } = require('pg');

const dbUrl = process.env.HP_BUSINESSES_DB_URL || process.env.DATABASE_URL?.replace('/revivepropertyco', '/hipages_directory');

if (!dbUrl) {
  throw new Error('HP_BUSINESSES_DB_URL environment variable is required');
}

const pool = new Pool({
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function query(text, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

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

module.exports = { pool, query, transaction };
