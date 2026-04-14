# Database Migrations

This directory contains SQL migration scripts for the Revive Property Co. database.

## Migrations

### 001_create_customer_portal_tables.sql
**Purpose:** Creates tables for customer portal functionality

**Tables Created:**
- `customers` - Customer account information
- `customer_documents` - Customer-uploaded files
- `quote_approvals` - Audit trail for quote approvals
- `audit_log` - Security audit logging

**Tables Modified:**
- `quotes` - Added customer_id, status, issued_date, expiry_date, approved_at, rejected_at columns

**How to Run:**
```bash
# From project root
psql $DATABASE_URL -f server/migrations/001_create_customer_portal_tables.sql

# Or using docker-compose if database is in container
docker-compose exec -T db psql -U postgres -d revive_db < server/migrations/001_create_customer_portal_tables.sql
```

### 001_rollback_customer_portal_tables.sql
**Purpose:** Reverts migration 001 - removes all customer portal tables and changes

**⚠️ WARNING:** This will DELETE all customer data permanently. Ensure you have a backup before running.

**How to Run:**
```bash
# From project root
psql $DATABASE_URL -f server/migrations/001_rollback_customer_portal_tables.sql

# Or using docker-compose
docker-compose exec -T db psql -U postgres -d revive_db < server/migrations/001_rollback_customer_portal_tables.sql
```

## Migration Best Practices

### Before Running Migrations

1. **Backup your database:**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test in development first:**
   - Always run migrations in local development environment first
   - Verify all expected changes were made correctly
   - Test your application with the new schema

3. **Review the migration script:**
   - Read through the SQL to understand what changes will be made
   - Check for any customizations needed for your environment

### Running Migrations

1. **Choose the right environment:**
   - Make sure you're running migrations against the correct database
   - Check your `DATABASE_URL` environment variable

2. **Run the migration:**
   ```bash
   psql $DATABASE_URL -f server/migrations/XXX_migration_name.sql
   ```

3. **Verify success:**
   - Check the output for any errors
   - Run the verification queries at the end of the migration script
   - Test your application

### After Running Migrations

1. **Test your application:**
   - Verify all features work correctly
   - Check logs for any errors
   - Run your test suite

2. **Monitor in production:**
   - Watch for any unexpected behavior
   - Check database performance
   - Have rollback plan ready

3. **Update documentation:**
   - Document any schema changes
   - Update ER diagrams if you have them
   - Note any breaking changes

## Schema Documentation

### customers table
Stores customer portal user accounts.

| Column | Type | Description |
|--------|------|-------------|
| customer_id | UUID | Primary key |
| first_name | VARCHAR(100) | Customer first name |
| last_name | VARCHAR(100) | Customer last name |
| mobile | VARCHAR(20) | Mobile number (unique, optional) |
| email | VARCHAR(255) | Email address (unique, optional) |
| address | TEXT | Street address |
| suburb | VARCHAR(100) | Suburb |
| postcode | VARCHAR(10) | Postcode |
| state | VARCHAR(50) | State (default: ACT) |
| password_hash | TEXT | Bcrypt hash of password |
| status | VARCHAR(20) | ACTIVE or SUSPENDED |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last update date |
| last_login_at | TIMESTAMP | Last login timestamp |

### customer_documents table
Stores metadata for customer-uploaded files.

| Column | Type | Description |
|--------|------|-------------|
| document_id | UUID | Primary key |
| customer_id | UUID | Foreign key to customers |
| filename | VARCHAR(255) | Sanitized filename |
| original_filename | VARCHAR(255) | Original upload filename |
| file_path | TEXT | Filesystem path |
| file_size | BIGINT | Size in bytes |
| mime_type | VARCHAR(100) | MIME type |
| description | TEXT | Optional description |
| uploaded_at | TIMESTAMP | Upload timestamp |

### quote_approvals table
Audit trail for quote approval actions.

| Column | Type | Description |
|--------|------|-------------|
| approval_id | UUID | Primary key |
| quote_id | UUID | Foreign key to quotes |
| customer_id | UUID | Foreign key to customers |
| action | VARCHAR(20) | APPROVED or REJECTED |
| reason | TEXT | Optional reason |
| actioned_at | TIMESTAMP | Action timestamp |
| actioned_ip | VARCHAR(45) | Client IP address |

### audit_log table
Security and compliance audit log.

| Column | Type | Description |
|--------|------|-------------|
| log_id | UUID | Primary key |
| customer_id | UUID | Foreign key to customers |
| action | VARCHAR(100) | Event type |
| details | JSONB | Event details |
| ip_address | VARCHAR(45) | Client IP |
| user_agent | TEXT | Browser/user agent |
| created_at | TIMESTAMP | Event timestamp |

## Troubleshooting

### Migration fails with "relation already exists"
This means the table was already created. You can either:
- Skip the migration (tables are already there)
- Rollback first, then re-apply the migration

### "permission denied" errors
Make sure your database user has CREATE TABLE permissions:
```sql
GRANT CREATE ON DATABASE revive_db TO revive_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO revive_user;
```

### Foreign key constraint errors
This usually means you're trying to drop a table that other tables reference. Always drop child tables before parent tables, or use `CASCADE`.

### Need to check current schema?
```sql
-- List all tables
\dt

-- Describe a table
\d customers

-- Show all indexes
\di

-- Show table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers';
```

## Rollback Procedures

If you need to rollback a migration:

1. **Stop your application** (prevent new data being created)
2. **Backup the current state** (in case you need to restore)
3. **Run the rollback script**
4. **Verify the rollback was successful**
5. **Restart your application**

If rollback fails:
1. Check the error message carefully
2. You may need to manually drop constraints or tables
3. As a last resort, restore from backup

## Getting Help

- Check the PostgreSQL documentation: https://www.postgresql.org/docs/
- Review the migration script for any custom SQL
- Check application logs for schema-related errors
- Test in development before production

---

**Last Updated:** 2026-04-13
**Maintained by:** Angus James Gair
