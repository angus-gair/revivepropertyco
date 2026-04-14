# Database Migration Quick Start

## Setup Complete ✅

The database migration system is ready to use. Migration scripts have been created for the customer portal feature.

## What Was Created

**Migration Files:**
- `server/migrations/001_create_customer_portal_tables.sql` - Creates all customer portal tables
- `server/migrations/001_rollback_customer_portal_tables.sql` - Rolls back migration 001
- `server/migrations/run-migration.cjs` - Node.js migration runner script
- `server/migrations/README.md` - Detailed migration documentation
- `server/migrations/QUICKSTART.md` - This file

**Database Tables Created:**
1. **customers** - Customer portal accounts
2. **customer_documents** - File uploads metadata
3. **quote_approvals** - Quote approval audit trail
4. **audit_log** - Security audit logging

**Tables Modified:**
- **quotes** - Added customer_id, status, dates for customer portal

## Quick Usage

### Using npm scripts (recommended):

```bash
# List all available migrations
npm run migrate

# Run migration 001
npm run migrate:up 001

# Rollback migration 001
npm run migrate:down 001

# Check migration status
npm run migrate:status
```

### Using the migration runner directly:

```bash
# List all migrations
node server/migrations/run-migration.cjs

# Run migration 001
node server/migrations/run-migration.cjs up 001

# Rollback migration 001
node server/migrations/run-migration.cjs down 001

# Check status
node server/migrations/run-migration.cjs status
```

### Using psql directly:

```bash
# Run migration
psql $DATABASE_URL -f server/migrations/001_create_customer_portal_tables.sql

# Rollback
psql $DATABASE_URL -f server/migrations/001_rollback_customer_portal_tables.sql
```

## Step-by-Step Guide

### 1. Set DATABASE_URL

```bash
# Example for local development
export DATABASE_URL="postgresql://postgres:password@localhost:5432/revive_db"

# Example for production
export DATABASE_URL="postgresql://user:pass@host:port/database"
```

Or add to `.env` file:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/revive_db
```

### 2. Check Migration Status

```bash
npm run migrate:status
```

You should see:
```
=== Migration Status ===

○ Pending  001  create_customer_portal_tables
```

### 3. Run the Migration

```bash
npm run migrate:up 001
```

Expected output:
```
Running migration 001: create_customer_portal_tables
File: 001_create_customer_portal_tables.sql

Executing: pql "..." -f "server/migrations/001_create_customer_portal_tables.sql"

[SQL output and verification queries]
✓ Migration 001 completed successfully
✓ Migration 001 recorded
```

### 4. Verify Success

```bash
npm run migrate:status
```

You should now see:
```
=== Migration Status ===

✓ Applied  001  create_customer_portal_tables
```

Or check the database directly:
```bash
psql $DATABASE_URL -c "\dt"

# You should see: customers, customer_documents, quote_approvals, audit_log
```

### 5. Test Your Application

After migration, test that your application works with the new schema:
- Start your development server: `npm run dev`
- Check for any errors in logs
- Verify customer portal features work

## Verification Queries

Run these to verify the migration was successful:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('customers', 'customer_documents', 'quote_approvals', 'audit_log')
ORDER BY table_name;

-- Check indexes were created
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN ('customers', 'customer_documents', 'quote_approvals', 'audit_log')
ORDER BY tablename, indexname;

-- Check quotes table has new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quotes'
  AND column_name IN ('customer_id', 'status', 'expiry_date', 'approved_at', 'rejected_at')
ORDER BY column_name;
```

## Rollback (If Needed)

If you need to undo the migration:

**⚠️ WARNING:** This will delete all customer data!

```bash
npm run migrate:down 001
```

Or with direct psql:
```bash
psql $DATABASE_URL -f server/migrations/001_rollback_customer_portal_tables.sql
```

## Troubleshooting

### "DATABASE_URL not set" Error

Make sure you've set the DATABASE_URL environment variable:
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

Or add to `.env` file (recommended for development).

### "relation already exists" Error

This means the migration was already run. You can either:
- Continue (the tables are already there)
- Rollback first, then re-run

### Permission Errors

Ensure your database user has CREATE TABLE permissions:
```sql
GRANT CREATE ON DATABASE revive_db TO revive_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO revive_user;
```

### Check What's Been Migrated

```bash
# Using npm script
npm run migrate:status

# Or directly in psql
psql $DATABASE_URL -c "SELECT * FROM migrations ORDER BY migration_number;"
```

## What's Next?

Now that the database schema is ready, you can proceed with:

1. **Backend Authentication API** (Task 1.2)
   - Create `server/api/customer.cjs`
   - Implement register, login, profile endpoints
   - Use existing `server/lib/auth.cjs` infrastructure

2. **Backend Documents API** (Task 1.3)
   - Implement file upload endpoints
   - Create `uploads/customers/` directory
   - Add security validation

3. **Frontend Authentication Pages** (Task 1.5)
   - Create login and registration pages
   - Set up customer auth context
   - Implement protected routes

## Development Workflow

**Before starting development:**
1. Ensure DATABASE_URL is set
2. Run migrations: `npm run migrate:up 001`
3. Verify with: `npm run migrate:status`

**During development:**
- The migration runner tracks which migrations have been run
- You can check status anytime with `npm run migrate:status`
- If you need to reset, rollback and re-run

**Before committing:**
- Verify migrations are idempotent (can be run multiple times safely)
- Test rollback procedure works
- Update README.md if you add new migrations

## Production Deployment

**⚠️ Important:** When deploying to production:

1. **Backup first!**
   ```bash
   pg_dump $DATABASE_URL > pre-migration-backup.sql
   ```

2. **Test in staging first**
   - Run migrations in staging environment
   - Verify application works correctly
   - Check for performance issues

3. **Deploy during low-traffic period**
   - Migrations may cause temporary locks
   - Plan for potential rollback

4. **Run migration in production**
   ```bash
   npm run migrate:up 001
   ```

5. **Verify everything works**
   - Check migration status
   - Test customer portal features
   - Monitor logs for errors

## Additional Resources

- **Detailed Documentation:** See `server/migrations/README.md`
- **Migration Scripts:** `server/migrations/*.sql`
- **Runner Script:** `server/migrations/run-migration.cjs`

---

**Created:** 2026-04-13
**Migration Version:** 001
**Status:** Ready to run ✅
