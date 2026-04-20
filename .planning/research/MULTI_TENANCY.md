# Multi-Tenancy Research: PostgreSQL + Node.js Shared-Database Pattern

**Project:** Revive Property Co. SaaS Platform  
**Domain:** Multi-tenant trade services SaaS  
**Researched:** 2026-04-20  
**Overall confidence:** HIGH (multiple authoritative sources cross-verified)

---

## 1. Tenant ID Design

### UUID vs Integer — Recommendation: UUID v7

**Use UUID v7 for `tenant_id`.** Do not use UUID v4 or plain integers.

| Type | Insert Perf | Index Locality | Distributed Gen | Size |
|------|-------------|----------------|-----------------|------|
| `BIGSERIAL` | Best | Best | Requires central counter | 8 bytes |
| `UUID v4` | Poor | Poor (random, 500x more page splits) | Yes | 16 bytes |
| `UUID v7` | Near-BIGSERIAL | Good (time-ordered) | Yes | 16 bytes |

UUID v7 encodes a Unix timestamp in the first 48 bits, producing time-ordered values that preserve B-tree locality — eliminating the catastrophic page-split problem of UUID v4. PostgreSQL 18 adds native `gen_random_uuid_v7()`. For PostgreSQL 14–17, use the `pg_uuidv7` extension or generate in Node.js with the `uuidv7` npm package.

**Schema:**
```sql
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- upgrade to v7 when PG18
  slug        TEXT UNIQUE NOT NULL,   -- e.g. "acme-plumbing" for subdomain routing
  name        TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'starter',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  suspended   BOOLEAN NOT NULL DEFAULT false
);
```

Every tenant data table gets a non-nullable `tenant_id` column:
```sql
ALTER TABLE leads ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id);
ALTER TABLE appointments ADD COLUMN tenant_id UUID NOT NULL REFERENCES tenants(id);
-- etc. for every table containing tenant data
```

### Where to Store Tenant Context

**Store in JWT claims + AsyncLocalStorage. Do not use request headers as the sole source.**

The extraction priority (most to least trusted):
1. **JWT claim `tenant_id`** — signed and tamper-proof, primary source
2. **Subdomain routing** — `acme.revivepropertyco.au` → slug lookup → verified `tenant_id`
3. **`X-Tenant-ID` header** — only acceptable if combined with JWT verification (never trust raw header alone)

Never accept a `tenant_id` directly from an untrusted client. The JWT or subdomain lookup must be the authoritative source.

### Propagating Tenant Context Through the Stack

Use **Node.js `AsyncLocalStorage`** to carry tenant context through async call chains without parameter drilling. This is the current standard pattern (2025+) with Node.js 22 LTS overhead measured at less than 1–2% for I/O-bound workloads.

```typescript
// lib/tenantContext.ts
import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantStore {
  tenantId: string;
  tenantSlug: string;
}

export const tenantStorage = new AsyncLocalStorage<TenantStore>();

export function getTenantId(): string {
  const store = tenantStorage.getStore();
  if (!store) throw new Error('No tenant context — request not scoped');
  return store.tenantId;
}
```

```typescript
// middleware/tenantMiddleware.ts
import { tenantStorage } from '../lib/tenantContext';
import { verifyJwt } from '../lib/auth';

export function tenantMiddleware(req, res, next) {
  const payload = verifyJwt(req.headers.authorization);
  if (!payload?.tenant_id) return res.status(401).json({ error: 'No tenant context' });

  tenantStorage.run(
    { tenantId: payload.tenant_id, tenantSlug: payload.tenant_slug },
    () => next()
  );
}
```

---

## 2. Row-Level Security (RLS)

### Recommendation: Use RLS as a defence-in-depth layer, not as the only control

RLS enforces isolation at the database engine level — even if application code has a bug that omits a WHERE clause, the database will not return cross-tenant rows. This is the primary value: it turns data leaks from application bugs into empty result sets, not data breaches.

**However:** RLS is not a silver bullet. Use application-level filtering as the primary layer and RLS as the backstop.

### Policy Setup

```sql
-- Use a non-superuser role — superusers bypass RLS unconditionally
CREATE ROLE app_user LOGIN PASSWORD 'strong-password-here';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Enable and FORCE RLS on every tenant data table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;  -- FORCE prevents table owner bypass

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;

-- Policy: tenant sees only their rows
-- NULLIF handles the case where the setting is not yet initialized
CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid);

CREATE POLICY tenant_isolation ON appointments
  USING (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid);
```

The `TRUE` second argument to `current_setting` suppresses the error if the variable is unset, returning NULL instead — which causes the policy to reject all rows. This is safe-by-default behaviour.

### Setting Context from Node.js (Critical: SET LOCAL, not SET)

```typescript
// lib/db.ts
import { Pool } from 'pg';
import { getTenantId } from './tenantContext';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: 'app_user',          // non-superuser — RLS is enforced
  max: 20,
  idleTimeoutMillis: 30_000,
});

// Single query with tenant context
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const tenantId = getTenantId();
  const client = await pool.connect();
  try {
    // SET LOCAL scopes to current transaction only
    // This is safe with pgBouncer in transaction mode
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant', tenantId]);
    const result = await client.query(sql, params);
    await client.query('COMMIT');
    return result.rows;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Multi-statement transaction
export async function withTransaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const tenantId = getTenantId();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config($1, $2, TRUE)', ['app.current_tenant', tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

**Critical:** Use `set_config('app.current_tenant', value, TRUE)` — the third argument `TRUE` means transaction-local. This is equivalent to `SET LOCAL` and is safe with pgBouncer in transaction mode. Using `SET` (session-scoped) will cause tenant context to leak across connection pool reuse.

### RLS vs Application-Level WHERE Clauses

| Concern | RLS | App-level WHERE |
|---------|-----|-----------------|
| Defense against app bugs | Automatic | Relies on developer discipline |
| Performance overhead | Moderate (policy evaluated per row) | None if indexed correctly |
| Debuggability | Hard (silent failures) | Easy to trace |
| pgBouncer compatibility | Requires transaction mode + SET LOCAL | Always compatible |
| Column-level filtering | No | Yes |
| Complexity for joins | Higher | Lower |
| Code readability | Simpler app queries | WHERE clauses everywhere |

**Decision:** Use both. Keep `WHERE tenant_id = $tenantId` in queries (primary), and RLS as backstop. The dual-layer approach means a forgotten WHERE clause becomes an empty result rather than a breach.

### RLS Performance

Without proper indexes, RLS adds catastrophic overhead. With composite indexes (tenant_id first), measured overhead at 50M rows / 10K tenants is approximately 0.3ms per query. Without indexes, the same query at 1M rows runs at 120ms (sequential scan) vs 1.2ms with a `(tenant_id, id)` composite index.

---

## 3. Application-Level Filtering

### Middleware Pattern (Full Implementation)

```typescript
// middleware/tenantMiddleware.ts
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (!payload.tenant_id) return res.status(401).json({ error: 'No tenant in token' });

    // Validate tenant is active (cache this lookup — 60s TTL is fine)
    tenantStorage.run(
      { tenantId: payload.tenant_id, tenantSlug: payload.tenant_slug },
      () => next()
    );
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Apply before all authenticated routes
app.use('/api', authenticateToken, tenantMiddleware);
```

### Query Wrapper for the `pg` Library

Rather than using an ORM, the project uses the `pg` library directly. Wrap it with a tenant-aware query function:

```typescript
// services/db.ts
export const db = {
  // For simple queries — adds tenant context automatically
  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    return query<T>(sql, params);
  },

  // For explicit transactions — consumer writes application logic, not plumbing
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    return withTransaction(fn);
  },
};

// Usage in a service — no manual tenant_id needed if RLS is in place
// With RLS as backstop: clean query
export async function getLeads() {
  return db.query<Lead>('SELECT * FROM leads ORDER BY created_at DESC');
}

// With application-level defence (belt-and-suspenders — recommended):
export async function getLeads() {
  const tenantId = getTenantId();
  return db.query<Lead>(
    'SELECT * FROM leads WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
}
```

### Injecting tenant_id on INSERT

Never trust the client to send `tenant_id`. Always pull from context:

```typescript
export async function createLead(data: CreateLeadInput) {
  const tenantId = getTenantId();
  return db.query<Lead>(
    `INSERT INTO leads (tenant_id, name, email, service_type, status, created_at)
     VALUES ($1, $2, $3, $4, 'NEW', now())
     RETURNING *`,
    [tenantId, data.name, data.email, data.serviceType]
  );
}
```

---

## 4. Database Migrations

### Strategy for Adding `tenant_id` to Existing Tables

For a project starting fresh, add `tenant_id` as NOT NULL from day one. For tables that already have data, use a three-phase migration:

**Phase 1 — Add nullable, backfill, constrain (zero-downtime):**

```sql
-- Step 1: Add as nullable (no lock, instant)
ALTER TABLE leads ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Step 2: Backfill in batches (avoids locking entire table)
-- Run this in pg_cron or a migration script with loops
UPDATE leads
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'initial-tenant' LIMIT 1)
WHERE tenant_id IS NULL
AND id IN (
  SELECT id FROM leads WHERE tenant_id IS NULL ORDER BY id LIMIT 1000
);
-- Repeat until count = 0

-- Step 3: Add NOT NULL constraint after all rows backfilled
ALTER TABLE leads ALTER COLUMN tenant_id SET NOT NULL;
```

**Why batching matters:** Running a single UPDATE on a large table acquires a long-lived lock and generates a huge WAL write, disrupting production traffic. Batch updates of 500–1000 rows stay under 50ms each.

**Phase 2 — Add the index concurrently (no table lock):**

```sql
-- CONCURRENTLY avoids locking reads/writes during index build
CREATE INDEX CONCURRENTLY idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX CONCURRENTLY idx_leads_tenant_created ON leads(tenant_id, created_at DESC);
```

**Phase 3 — Enable RLS:**

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.current_tenant', TRUE), '')::uuid);
```

### Migration Tool Recommendation

Use **`node-pg-migrate`** or **`db-migrate`** for Node.js projects using the raw `pg` library. These tools manage migration versioning without requiring an ORM.

```bash
npm install node-pg-migrate
```

Store migrations as numbered SQL files. Never edit a migration that has already run in production — always add a new migration forward.

---

## 5. Performance

### Indexing Strategy — tenant_id Must Always Lead

Every query in a multi-tenant system filters by `tenant_id` first. Put it first in every composite index.

```sql
-- Primary key — already scoped
-- Lookup by ID within a tenant (most common pattern)
CREATE UNIQUE INDEX idx_leads_tenant_pk ON leads(tenant_id, id);

-- List queries with ordering
CREATE INDEX idx_leads_tenant_created ON leads(tenant_id, created_at DESC);
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status, created_at DESC);

-- Appointment lookups
CREATE INDEX idx_appointments_tenant_date ON appointments(tenant_id, appointment_date);
CREATE INDEX idx_appointments_tenant_status ON appointments(tenant_id, status);

-- Covering index for index-only scans on list views
CREATE INDEX idx_leads_tenant_list ON leads(tenant_id, created_at DESC)
  INCLUDE (id, name, email, status, service_type);
```

**Rule:** `tenant_id` is the first column in every index. Without this, PostgreSQL falls back to sequential scans across all tenants' data.

### Connection Pool Configuration

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: 'app_user',           // NEVER use superuser — breaks RLS
  max: 20,                    // Tune based on PG max_connections / num instances
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
```

**pgBouncer configuration (if used):**
- Mode: `transaction` (required for SET LOCAL to work correctly)
- Session mode with SET will cause tenant context to bleed between requests sharing a session

### Query Optimization

- Use `EXPLAIN ANALYZE` to verify `tenant_id` index is being used (look for "Index Scan" not "Seq Scan")
- Avoid `SELECT *` on large tables — select only needed columns to enable index-only scans
- For dashboards aggregating across a tenant's full dataset, consider materialized views refreshed on a schedule
- Partition large tables by `tenant_id` when individual tenants exceed ~10M rows

---

## 6. Security and Compliance

### Data Isolation Guarantees

The shared-database model provides **logical** isolation only, not physical. This is acceptable for B2B trade services SaaS but has implications:

- A PostgreSQL superuser can see all data — restrict superuser access to DBA operations only, never in application paths
- A compromised `app_user` credential exposes all tenants — rotate credentials, use secrets management (Vault, AWS Secrets Manager, or environment secrets in Docker)
- Cross-tenant leaks can happen via: forgotten WHERE clauses, SECURITY DEFINER functions, materialized views, function side-effects

### Audit Logging Per Tenant

Implement an audit table and trigger:

```sql
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   UUID NOT NULL,
  table_name  TEXT NOT NULL,
  operation   TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  changed_by  UUID,   -- user_id from app context
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_tenant_time ON audit_log(tenant_id, changed_at DESC);

CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log(tenant_id, table_name, operation, record_id, old_data, new_data)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_leads
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
```

**Note:** `audit_log` itself should also have RLS enabled so tenants can only query their own audit trail.

### Preventing Cross-Tenant Leaks — Checklist

- [ ] All INSERT operations read `tenant_id` from server-side context, never from request body
- [ ] All SELECT/UPDATE/DELETE use explicit `WHERE tenant_id = $1` (belt) + RLS (suspenders)
- [ ] `app_user` database role is not a superuser and does not have BYPASSRLS
- [ ] FORCE ROW LEVEL SECURITY on all tables (not just ENABLE — owner still bypasses without FORCE)
- [ ] Views that expose tenant data use `SECURITY INVOKER` (Postgres 15+), not SECURITY DEFINER
- [ ] Materialized views: ensure refresh logic is tenant-scoped or RLS is applied separately
- [ ] Unique constraints: scope to `(tenant_id, field)` not just `(field)` alone — global uniqueness leaks existence information across tenants
- [ ] Foreign keys: if a FK references a table with RLS, the FK check will fail if the referenced row is filtered by RLS — add SECURITY DEFINER lookup functions for FK validation or use application-level validation

### Common Vulnerabilities

**Unique constraint leakage:** `UNIQUE(email)` reveals whether an email is registered by any tenant. Use `UNIQUE(tenant_id, email)` instead.

**SECURITY DEFINER function bypass:** A function created by a privileged user runs with that user's permissions, bypassing RLS. Audit all functions. In PG15+, explicitly set `SECURITY INVOKER`.

**Superuser testing:** RLS policies will silently not apply when testing with a superuser. Always test with `app_user` credentials.

**Silent policy failures:** RLS violations return empty result sets, not errors. A misconfigured policy that is too restrictive will look like "no data" not "access denied" — add monitoring for unexpectedly empty responses.

---

## 7. Tenant Provisioning

### Creating New Tenants

Provisioning in a shared-DB model is fast — it is just a database row plus seed data. Target under 500ms for the full onboarding flow.

```typescript
// services/tenantService.ts
export async function provisionTenant(input: {
  name: string;
  slug: string;
  ownerEmail: string;
  plan: 'starter' | 'professional' | 'enterprise';
}): Promise<{ tenant: Tenant; owner: User }> {
  return withSystemTransaction(async (client) => {
    // 1. Create tenant record
    const { rows: [tenant] } = await client.query(
      `INSERT INTO tenants (name, slug, plan) VALUES ($1, $2, $3) RETURNING *`,
      [input.name, input.slug, input.plan]
    );

    // 2. Create owner user
    const passwordHash = await bcrypt.hash(generateTemporaryPassword(), 12);
    const { rows: [owner] } = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, role)
       VALUES ($1, $2, $3, 'OWNER') RETURNING *`,
      [tenant.id, input.ownerEmail, passwordHash]
    );

    // 3. Seed default data (service categories, default pipeline stages, etc.)
    await seedTenantDefaults(client, tenant.id);

    return { tenant, owner };
  });
}

async function seedTenantDefaults(client: PoolClient, tenantId: string) {
  await client.query(
    `INSERT INTO pipeline_stages (tenant_id, name, sort_order) VALUES
     ($1, 'New Lead', 1),
     ($1, 'Contacted', 2),
     ($1, 'Quote Sent', 3),
     ($1, 'Booked', 4),
     ($1, 'Completed', 5),
     ($1, 'Archived', 6)`,
    [tenantId]
  );
  // Add default campaign templates, service type config, etc.
}
```

**`withSystemTransaction`** is a variant of `withTransaction` that does NOT set `app.current_tenant` — it runs as a system/admin operation not scoped to a single tenant. This is used only for provisioning and admin operations.

### Tenant Onboarding Flow

1. Operator/signup form POSTs to `/api/tenants/provision`
2. `provisionTenant()` runs in a transaction — all-or-nothing
3. Owner receives email with temporary password + login URL
4. First login triggers password reset flow
5. Onboarding checklist created from `seedTenantDefaults`

### Tenant Suspension / Deletion

```sql
-- Soft-suspend (blocks login at app layer)
UPDATE tenants SET suspended = true WHERE id = $1;

-- Hard delete (cascade must be configured on all tenant_id FKs)
-- Consider anonymisation instead of deletion for compliance
DELETE FROM tenants WHERE id = $1;
```

Ensure all `tenant_id` foreign keys have `ON DELETE CASCADE` so deleting a tenant row cascades to all their data.

---

## 8. Testing

### Strategy: Test Two Separate Tenants per Test Suite

The most important multi-tenant test is the isolation test: **create data for tenant A, confirm tenant B cannot see it.**

```typescript
// test/helpers/tenantFixtures.ts
import { tenantStorage } from '../../lib/tenantContext';

export function withTenant(tenantId: string, fn: () => Promise<void>) {
  return () => tenantStorage.run({ tenantId }, fn);
}

export async function createTestTenant(name = 'Test Co'): Promise<string> {
  const { rows: [tenant] } = await systemQuery(
    `INSERT INTO tenants (name, slug, plan) VALUES ($1, $2, 'starter') RETURNING id`,
    [name, `test-${Date.now()}`]
  );
  return tenant.id;
}

export async function cleanupTenant(tenantId: string) {
  await systemQuery('DELETE FROM tenants WHERE id = $1', [tenantId]);
}
```

```typescript
// test/leads.test.ts
describe('Lead isolation', () => {
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    tenantA = await createTestTenant('Tenant A');
    tenantB = await createTestTenant('Tenant B');
  });

  afterAll(async () => {
    await cleanupTenant(tenantA);
    await cleanupTenant(tenantB);
  });

  it('tenant A cannot see tenant B leads', async () => {
    // Create lead as tenant B
    await tenantStorage.run({ tenantId: tenantB }, async () => {
      await createLead({ name: 'B Lead', email: 'b@example.com', serviceType: 'CLEANING' });
    });

    // Tenant A query returns nothing
    const leads = await tenantStorage.run({ tenantId: tenantA }, () => getLeads());
    expect(leads).toHaveLength(0);
    expect(leads.find(l => l.name === 'B Lead')).toBeUndefined();
  });

  it('tenant A cannot update tenant B leads', async () => {
    let leadId: string;

    await tenantStorage.run({ tenantId: tenantB }, async () => {
      const [lead] = await createLead({ name: 'Protected', email: 'x@b.com', serviceType: 'CLEANING' });
      leadId = lead.id;
    });

    // Attempt update as tenant A — should affect 0 rows
    const updated = await tenantStorage.run({ tenantId: tenantA }, () =>
      updateLead(leadId, { name: 'Hacked' })
    );
    expect(updated).toBeNull(); // or expect rowCount to be 0
  });
});
```

### Test Database Setup

Use a dedicated test database (separate from development). Run a full schema migration before tests, clean up tenant rows in `afterAll`.

For CI: use `docker-compose` to spin up a PostgreSQL instance, run migrations, run tests, teardown. This avoids test state bleeding between CI runs.

```typescript
// jest.setup.ts
import { pool } from '../lib/db';

afterAll(async () => {
  await pool.end(); // close connections so Jest exits cleanly
});
```

### What to Test

| Test type | What it verifies |
|-----------|-----------------|
| Isolation tests | Tenant A cannot read/write tenant B data |
| Provisioning tests | New tenant gets correct seed data, no data from other tenants |
| RLS bypass test | Verify `app_user` (not superuser) is used — RLS actually enforces |
| Context leakage test | Missing tenant context throws, not silently returns wrong data |
| Audit trail test | Mutations create audit_log rows with correct tenant_id |
| Unique constraint tests | Duplicate email within tenant fails, same email across tenants succeeds |

### Verifying RLS is Actually Active

```typescript
it('RLS is enforced — not silently bypassed', async () => {
  // Connect with app_user credentials (same as production)
  const testPool = new Pool({ ...config, user: 'app_user' });
  const client = await testPool.connect();

  // Do NOT set app.current_tenant — should return 0 rows
  const result = await client.query('SELECT * FROM leads');
  expect(result.rows).toHaveLength(0); // RLS blocks all rows when no context

  client.release();
  await testPool.end();
});
```

---

## Key Pitfalls Summary

| Pitfall | Consequence | Prevention |
|---------|-------------|------------|
| `SET` instead of `SET LOCAL` | Tenant context bleeds across connection pool reuse | Always use `set_config(..., TRUE)` in transactions |
| Superuser connection | RLS silently disabled for all queries | Use `app_user` non-superuser in all application paths |
| ENABLE without FORCE | Table owners bypass RLS | Always `FORCE ROW LEVEL SECURITY` |
| Non-LEAKPROOF functions in policies | Index scans disabled, catastrophic performance | Keep policy expressions simple and direct |
| SECURITY DEFINER views | RLS bypassed through the view | Use `SECURITY INVOKER` (PG15+) |
| `UNIQUE(email)` across tenants | Cross-tenant existence leak | Use `UNIQUE(tenant_id, email)` |
| Missing composite indexes | Sequential scan across all tenant data | tenant_id first in all composite indexes |
| tenant_id from request body | Client controls their own tenant scope | Always inject tenant_id server-side from JWT/context |
| No WITH CHECK on policy | Users can INSERT rows they cannot see | Include `WITH CHECK` on all policies, not just `USING` |
| pgBouncer session mode | SET LOCAL lost when connection is recycled | pgBouncer must be in transaction mode |

---

## Sources

- [Row Level Security for Tenants in Postgres — Crunchy Data](https://www.crunchydata.com/blog/row-level-security-for-tenants-in-postgres)
- [Multi-tenant data isolation with PostgreSQL RLS — AWS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [Postgres RLS Implementation Guide: Best Practices and Common Pitfalls — Permit.io](https://www.permit.io/blog/postgres-rls-implementation-guide)
- [Common Postgres RLS Footguns — Bytebase](https://www.bytebase.com/blog/postgres-row-level-security-footguns/)
- [Multi-Tenancy with Node.js AsyncLocalStorage — Medium](https://medium.com/@jfelipevalr/multi-tenancy-with-node-js-asynclocalstorage-4c771a3d06ed)
- [Single schema multi-tenancy in Node.js with Postgres — Traveling Coderman](https://traveling-coderman.net/code/node-architecture/multi-tenancy/)
- [How to Build a Multi-Tenant API in Node.js with PostgreSQL RLS (2026 Guide) — DEV Community](https://dev.to/1xapi/how-to-build-a-multi-tenant-api-in-nodejs-with-postgresql-row-level-security-2026-guide-3ane)
- [Designing Your Postgres Database for Multi-tenancy — Crunchy Data](https://www.crunchydata.com/blog/designing-your-postgres-database-for-multi-tenancy)
- [Citus Multi-tenant Applications Documentation](https://docs.citusdata.com/en/stable/use_cases/multi_tenant.html)
- [AsyncLocalStorage in Node.js (2025) — Medium](https://medium.com/@asierr/asynclocalstorage-in-node-js-2025-your-secret-weapon-for-context-propagation-%EF%B8%8F-a0e8ca9deef6)
- [UUID v7 in PostgreSQL 18 — The Nile](https://www.thenile.dev/blog/uuidv7)
- [PostgreSQL UUID Performance: v4 vs v7 — DEV Community](https://dev.to/umangsinha12/postgresql-uuid-performance-benchmarking-random-v4-and-time-based-v7-uuids-n9b)
- [Shipping multi-tenant SaaS using Postgres RLS — The Nile](https://www.thenile.dev/blog/multi-tenant-rls)
- [pganalyze: RLS, BYPASSRLS, security invoker views](https://pganalyze.com/blog/5mins-postgres-row-level-security-bypassrls-security-invoker-views-leakproof-functions)
