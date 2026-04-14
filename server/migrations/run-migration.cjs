#!/usr/bin/env node

/**
 * Migration Runner (Node.js version - uses pg library)
 *
 * Usage:
 *   node server/migrations/run-migration.cjs              # List available migrations
 *   node server/migrations/run-migration.cjs up 001       # Run migration 001
 *   node server/migrations/run-migration.cjs down 001     # Rollback migration 001
 *   node server/migrations/run-migration.cjs status       # Show migration status
 *
 * Environment Variables:
 *   DATABASE_URL - PostgreSQL connection string
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`ERROR: ${message}`, 'red');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Get database URL from environment
function getDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    // Try to use the same default as database.cjs
    return 'postgresql://homelab:BQvsf9MNbLHM0r972mJmpjYphvtUxWyhFwh4xP8v8hg@localhost:5432/revivepropertyco';
  }
  return dbUrl;
}

// Create database connection
async function createConnection() {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  // Test connection
  try {
    const client = await pool.connect();
    client.release();
    return pool;
  } catch (err) {
    error(`Failed to connect to database: ${err.message}`);
    throw err;
  }
}

// Read and execute SQL file
async function executeSqlFile(pool, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');

  const client = await pool.connect();
  try {
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      await client.query(statement);
    }
  } finally {
    client.release();
  }
}

// Get all migration files
function getMigrations() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && !f.includes('rollback'))
    .sort();

  return files.map(file => {
    const match = file.match(/^(\d+)_/);
    const number = match ? match[1] : null;
    const name = file.replace(/^\d+_/, '').replace('.sql', '');

    return {
      file,
      number,
      name,
      path: path.join(MIGRATIONS_DIR, file),
      rollbackPath: path.join(MIGRATIONS_DIR, `${number}_rollback_${name}.sql`),
    };
  }).filter(m => m.number);
}

// Ensure migrations table exists
async function ensureMigrationsTable(pool) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        migration_number VARCHAR(20) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    client.release();
  }
}

// Check if a migration has been run
async function isMigrationRun(pool, migrationNumber) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT EXISTS (SELECT 1 FROM migrations WHERE migration_number = $1)',
      [migrationNumber]
    );
    return result.rows[0].exists;
  } catch (err) {
    // Table doesn't exist yet
    return false;
  } finally {
    client.release();
  }
}

// Record migration as run
async function recordMigration(pool, migrationNumber) {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO migrations (migration_number) VALUES ($1)',
      [migrationNumber]
    );
    success(`Migration ${migrationNumber} recorded`);
  } catch (err) {
    warn(`Could not record migration: ${err.message}`);
  } finally {
    client.release();
  }
}

// Remove migration record
async function unrecordMigration(pool, migrationNumber) {
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM migrations WHERE migration_number = $1',
      [migrationNumber]
    );
    success(`Migration ${migrationNumber} unrecorded`);
  } catch (err) {
    warn(`Could not unrecord migration: ${err.message}`);
  } finally {
    client.release();
  }
}

// Run a migration
async function runMigration(pool, migration) {
  log(`\nRunning migration ${migration.number}: ${migration.name}`, 'cyan');
  log(`File: ${migration.file}`, 'bright');

  try {
    // Check if already run
    const alreadyRun = await isMigrationRun(pool, migration.number);
    if (alreadyRun) {
      warn(`Migration ${migration.number} has already been run`);
      return false;
    }

    // Read and execute the migration SQL
    const sql = fs.readFileSync(migration.path, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Split SQL by semicolons and execute each statement
      // Skip verification queries (SELECT statements that start with specific patterns)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith("SELECT '"))
        .filter(s => !s.match(/^SELECT\s+/i)) // Skip SELECT statements
        .filter(s => s.match(/^(CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|GRANT|COMMENT|DO|BEGIN|COMMIT)/i)); // Only execute DML/DLL

      for (const statement of statements) {
        if (statement.trim().length > 0) {
          try {
            await client.query(statement);
          } catch (err) {
            // Ignore "already exists" errors
            if (!err.message.includes('already exists')) {
              throw err;
            }
          }
        }
      }

      await client.query('COMMIT');

      // Record the migration
      await recordMigration(pool, migration.number);

      success(`Migration ${migration.number} completed successfully`);
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    error(`Migration ${migration.number} failed`);
    error(err.message);
    return false;
  }
}

// Rollback a migration
async function rollbackMigration(pool, migration) {
  log(`\nRolling back migration ${migration.number}: ${migration.name}`, 'cyan');

  try {
    // Check if rollback file exists
    if (!fs.existsSync(migration.rollbackPath)) {
      error(`Rollback file not found: ${migration.rollbackPath}`);
      return false;
    }

    // Warn about destructive operation
    warn(`⚠ WARNING: This will DELETE data!`);
    log(`Rollback file: ${path.basename(migration.rollbackPath)}`, 'yellow');

    // Read and execute the rollback SQL
    const sql = fs.readFileSync(migration.rollbackPath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Split SQL by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
        .filter(s => !s.match(/^SELECT\s+/i));

      for (const statement of statements) {
        if (statement.trim().length > 0) {
          try {
            await client.query(statement);
          } catch (err) {
            // Ignore "does not exist" errors during rollback
            if (!err.message.includes('does not exist')) {
              throw err;
            }
          }
        }
      }

      await client.query('COMMIT');

      // Unrecord the migration
      await unrecordMigration(pool, migration.number);

      success(`Migration ${migration.number} rolled back successfully`);
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    error(`Rollback failed`);
    error(err.message);
    return false;
  }
}

// Show migration status
async function showStatus(pool) {
  log('\n=== Migration Status ===\n', 'bright');

  await ensureMigrationsTable(pool);

  const migrations = getMigrations();

  if (migrations.length === 0) {
    log('No migrations found.', 'yellow');
    return;
  }

  for (const migration of migrations) {
    const isRun = await isMigrationRun(pool, migration.number);
    const status = isRun ? '✓ Applied' : '○ Pending';
    const color = isRun ? 'green' : 'yellow';

    log(`${status}  ${migration.number}  ${migration.name}`, color);
  }

  log('');
}

// List available migrations
function listMigrations() {
  log('\n=== Available Migrations ===\n', 'bright');

  const migrations = getMigrations();

  if (migrations.length === 0) {
    log('No migrations found.', 'yellow');
    return;
  }

  migrations.forEach(migration => {
    log(`  ${migration.number}  ${migration.name}`, 'cyan');
  });

  log('');
  log('Usage:', 'yellow');
  log('  node run-migration.cjs up <number>     # Run migration');
  log('  node run-migration.cjs down <number>   # Rollback migration');
  log('  node run-migration.cjs status          # Show status');
  log('');
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);

  let pool;
  try {
    pool = await createConnection();
    await ensureMigrationsTable(pool);

    if (args.length === 0) {
      listMigrations();
      return;
    }

    const command = args[0];
    const migrations = getMigrations();

    switch (command) {
      case 'up':
        if (args.length < 2) {
          error('Please specify migration number');
          log('Usage: node run-migration.cjs up <number>', 'yellow');
          process.exit(1);
        }

        const number = args[1];
        const migration = migrations.find(m => m.number === number);

        if (!migration) {
          error(`Migration ${number} not found`);
          process.exit(1);
        }

        await runMigration(pool, migration);
        break;

      case 'down':
        if (args.length < 2) {
          error('Please specify migration number');
          log('Usage: node run-migration.cjs down <number>', 'yellow');
          process.exit(1);
        }

        const downNumber = args[1];
        const downMigration = migrations.find(m => m.number === downNumber);

        if (!downMigration) {
          error(`Migration ${downNumber} not found`);
          process.exit(1);
        }

        await rollbackMigration(pool, downMigration);
        break;

      case 'status':
        await showStatus(pool);
        break;

      default:
        error(`Unknown command: ${command}`);
        log('Available commands: up, down, status', 'yellow');
        process.exit(1);
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    error(err.message);
    process.exit(1);
  });
}

module.exports = { getMigrations, runMigration, rollbackMigration, showStatus };
