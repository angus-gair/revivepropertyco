# Phase 1: Platform Core & Authentication - Research

**Researched:** 2026-04-20
**Domain:** Multi-tenant SaaS platform with PostgreSQL RLS, JWT authentication, module discovery system
**Confidence:** HIGH

## Summary

Phase 1 builds the foundational multi-tenant SaaS platform with tenant isolation, JWT-based authentication with tenant awareness, and a module discovery system. The architecture leverages shared PostgreSQL with tenant_id columns (decision D-01), dual-layer isolation via application WHERE clauses + PostgreSQL Row-Level Security (D-02), and JWT tokens containing tenant_id claims (D-12). This phase does NOT migrate existing data (D-05) — that happens in Phase 2 with Twenty CRM integration.

**Primary recommendation:** Use shared PostgreSQL database with tenant_id as first column on all tenant-specific tables, implement RLS policies for defense-in-depth, and build a simple filesystem-based module registry with dependency ordering. Reuse existing auth patterns (JWT + bcrypt + localStorage) but extend tokens to include tenant_id and tenant_slug claims.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tenant registration/signup | Frontend Server (SSR) | API / Backend | Form validation and UI in React, tenant creation via Express API |
| JWT token generation | API / Backend | — | Server-side secret required for signing tokens |
| Tenant data filtering (WHERE clauses) | API / Backend | — | Application-layer isolation before queries execute |
| PostgreSQL RLS policies | Database / Storage | — | Database-layer enforcement for defense-in-depth |
| Module discovery/registry | API / Backend | — | Server-side filesystem scanning at startup |
| Module activation control | API / Backend | — | Runtime checks against tenant_modules table |
| Team invitation flow | Frontend Server (SSR) | API / Backend | UI for invitations, API for email sending and role assignment |
| Auth persistence | Browser / Client | — | localStorage stores JWT tokens (reused pattern) |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Shared PostgreSQL database with tenant_id column pattern
- **D-02:** Dual-layer isolation: application-level WHERE clauses + PostgreSQL Row-Level Security (RLS)
- **D-03:** tenant_id included in all tenant-specific tables as first column
- **D-04:** Tenant provisioning creates default seed data (pipeline stages, categories)
- **D-05:** Phase 1 builds foundation WITHOUT migrating existing data
- **D-06:** Phase 2 handles Twenty CRM integration and data migration
- **D-07:** Schema-only migration with dummy data for Revive tenant (not production data)
- **D-08:** Existing Revive CRM remains operational until Phase 2 cutover
- **D-09:** Module discovery via manifest system at startup
- **D-10:** Module activation per tenant (enabled/disabled flags in tenant_modules table)
- **D-11:** Billing integration deferred to Phase 7
- **D-12:** JWT tokens include tenant_id claim
- **D-13:** Tenant owners can invite team members with role-based permissions
- **D-14:** Existing auth patterns reused (JWT with bcrypt, localStorage tokens)

### Claude's Discretion
- Multi-tenancy implementation details (RLS policies, migration scripts)
- Module manifest format and loading mechanism
- Team invitation flow and permission system design
- Seed data structure for new tenants

### Deferred Ideas (OUT OF SCOPE)
- Twenty CRM integration and deployment (Phase 2)
- Data migration from existing CRM to Twenty (Phase 2)
- API sync layer between platform and Twenty (Phase 2)
- Hipages Leads Module (Phase 3)
- AI Quotes Module (Phase 4)
- AI SEO & Content Modules (Phase 5)
- Competitor Analysis Module (Phase 6)
- Billing & Module Management (Phase 7)
- Migrating from localStorage to httpOnly cookies
- Token refresh mechanism

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PCORE-01 | System supports multiple tenants (businesses) with isolated data | Standard Stack: PostgreSQL with tenant_id column pattern, RLS policies |
| PCORE-02 | Each tenant has UUID v7 identifier stored in JWT claims | Standard Stack: uuid v9.0.1 package, JWT custom claims |
| PCORE-03 | Tenant data isolated via dual-layer filtering (app WHERE + RLS) | Architecture Patterns: Dual-layer isolation, RLS policy examples |
| PCORE-04 | Platform uses AsyncLocalStorage for tenant context propagation | Don't Hand-Roll: Built-in Node.js AsyncLocalStorage for request-scoped context |
| PCORE-05 | Database connection uses `set_config('app.current_tenant', id, TRUE)` | Code Examples: PostgreSQL session variables for tenant context |
| PCORE-06 | All application queries use non-superuser app_user PostgreSQL role | Architecture Patterns: RLS requires non-superuser for policy enforcement |
| PCORE-07 | System has module registry that auto-discovers modules at startup | Architecture Patterns: Filesystem-based module discovery with manifest loading |
| PCORE-08 | Each module exports manifest with name, routePrefix, dependencies, register() | Code Examples: Module manifest interface and registration pattern |
| PCORE-09 | Modules load in dependency order (topological sort) | Code Examples: Topological sort algorithm for dependency resolution |
| PCORE-10 | requireModule() middleware checks tenant has module active before allowing access | Code Examples: Express middleware for module access control |
| AUTH-01 | New tenant owner can sign up with email and password | Existing Pattern: Reuse customer registration flow (server/api/customer.cjs) |
| AUTH-02 | JWT tokens contain tenant_id and tenant_slug claims | Code Examples: JWT custom claims with tenant data |
| AUTH-03 | Tenant login persists across browser refreshes | Existing Pattern: Reuse AuthContext with localStorage persistence |
| AUTH-04 | Tenant owner can invite team members with role-based permissions | Architecture Patterns: Role-based access control (RBAC) table design |
| AUTH-05 | Tenant slug is unique (used for subdomain routing if needed) | Code Examples: Unique constraint on tenant_slug column |
| AUTH-06 | Password hashed with bcrypt | Existing Pattern: Reuse bcryptjs 2.4.3 with salt rounds: 10 |
| AUTH-07 | New tenant provisioning creates default seed data (pipeline stages, categories) | Code Examples: Seed data insertion with tenant_id |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pg` | 8.11.3 [VERIFIED: npm registry] | PostgreSQL client with connection pooling | Existing project dependency, proven for multi-tenancy |
| `jsonwebtoken` | 9.0.2 [VERIFIED: npm registry] | JWT generation and verification with custom claims | Existing project dependency, supports tenant_id claims |
| `bcryptjs` | 2.4.3 [VERIFIED: npm registry] | Password hashing (salt rounds: 10) | Existing project dependency, matches customer portal pattern |
| `uuid` | 9.0.1 [VERIFIED: npm registry] | UUID v7 generation for tenant identifiers | Existing project dependency, v4() available, v7 via custom or ulid |
| `express` | 5.2.1 [VERIFIED: npm registry] | API server and middleware framework | Existing project dependency, familiar patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `express` | 5.2.1 | Middleware for requireModule() and tenant context | All platform API routes |
| Built-in `AsyncLocalStorage` | Node.js 15+ | Tenant context propagation across async calls | Request-scoped tenant_id throughout middleware chain |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `uuid` v7 | `ulid` or UUID v4 | ULID provides sortable IDs but adds dependency; UUID v4 lacks time-sorting. Use UUID v4 for Phase 1 with v7 migration path. |
| Filesystem module discovery | Dynamic require() with glob | Filesystem scanning is simpler for v1; glob could speed up discovery but adds complexity. |
| Application-layer WHERE only | PostgreSQL RLS only | Dual-layer (D-02) provides defense-in-depth. RLS alone is insufficient if app_user is compromised. |

**Installation:**
```bash
# All dependencies already installed in project
npm install pg@8.11.3 jsonwebtoken@9.0.2 bcryptjs@2.4.3 uuid@9.0.1 express@5.2.1
```

## Architecture Patterns

### Recommended Project Structure
```
server/
├── lib/
│   ├── auth.cjs              # Existing: JWT + bcrypt (reuse)
│   ├── database.cjs          # Existing: Connection pool (reuse)
│   ├── tenant-context.cjs    # NEW: AsyncLocalStorage for tenant_id
│   └── modules.cjs           # NEW: Module registry and discovery
├── api/
│   ├── platform.cjs          # NEW: Tenant registration, management
│   ├── auth-platform.cjs     # NEW: Tenant-aware auth endpoints
│   ├── invitations.cjs       # NEW: Team member invitations
│   └── modules.cjs           # NEW: Module activation endpoints
├── modules/                  # NEW: Module discovery directory
│   ├── core/                 # Core platform module (always active)
│   ├── hipages-leads/        # Hipages module (Phase 3)
│   │   ├── manifest.json     # Module metadata
│   │   └── index.cjs         # Module exports (register, routes, etc.)
│   └── ...
├── migrations/
│   ├── 003_create_platform_tables.sql    # NEW: Platform tables
│   └── 004_create_rls_policies.sql       # NEW: RLS policies
└── seeds/
    └── default-tenant-seed.sql           # NEW: Default seed data

pages/
├── platform/                 # NEW: Platform UI pages
│   ├── RegisterPage.tsx      # Tenant registration
│   ├── LoginPlatformPage.tsx # Tenant login
│   ├── TenantDashboard.tsx   # Tenant management
│   ├── TeamPage.tsx          # Team member management
│   └── ModulesPage.tsx       # Module activation (Phase 7)
└── ...

contexts/
├── AuthContext.tsx           # Existing: Admin auth (reuse for platform)
└── TenantAuthContext.tsx     # NEW: Tenant-aware auth context (or extend existing)
```

### Pattern 1: Tenant Context Propagation with AsyncLocalStorage
**What:** Use Node.js built-in AsyncLocalStorage to propagate tenant_id across async operations without explicit passing.
**When to use:** All API routes that need tenant context for database queries or module checks.
**Example:**
```javascript
// Source: Node.js AsyncLocalStorage API [CITED: https://nodejs.org/api/async_context.html]
const { AsyncLocalStorage } = require('async_hooks');
const tenantContext = new AsyncLocalStorage();

// Middleware to extract tenant_id from JWT and store in context
function tenantMiddleware(req, res, next) {
  const tenantId = req.user?.tenantId; // From JWT decoded in authenticateToken
  tenantContext.run({ tenantId }, () => {
    next();
  });
}

// Usage anywhere in async call chain
function getTenantId() {
  return tenantContext.getStore()?.tenantId;
}

// In database queries
async function queryWithTenant(text, params) {
  const tenantId = getTenantId();
  const tenantFilter = ' WHERE tenant_id = $1';
  const tenantParams = [tenantId, ...params];
  // Append position indexes to existing placeholders
  const adjustedText = text.replace(/\$(\d+)/g, (_, i) => `$${parseInt(i) + 1}`);
  return query(adjustedText + tenantFilter, tenantParams);
}
```

### Pattern 2: PostgreSQL Row-Level Security (RLS) with Session Variables
**What:** Use PostgreSQL RLS policies that reference session variable `app.current_tenant` for automatic filtering.
**When to use:** All tenant-specific tables as defense-in-depth alongside application WHERE clauses.
**Example:**
```sql
-- Source: PostgreSQL RLS Documentation [CITED: https://www.postgresql.org/docs/current/ddl-rowsecurity.html]

-- 1. Enable RLS on table
ALTER TABLE leads SET ROW LEVEL SECURITY;

-- 2. Create policy that filters by session variable
CREATE POLICY tenant_isolation_policy ON leads
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

-- 3. Set session variable on connection (in application code)
-- Run once per request after authentication
await query("SELECT set_config('app.current_tenant', $1, TRUE)", [tenantId]);

-- 4. All subsequent queries automatically filtered
-- No need for WHERE tenant_id = ? in application code
SELECT * FROM leads; -- Automatically filtered by RLS
```

**Note:** RLS policies only enforce when connected user is NOT superuser. Create `app_user` role with limited privileges (PCORE-06).

### Pattern 3: Module Discovery with Manifest System
**What:** Each module exports a `manifest.json` with metadata and an `index.cjs` with registration function. Registry scans filesystem at startup.
**When to use:** All platform modules (Hipages, AI Quotes, etc.) for dynamic registration.
**Example:**
```javascript
// Source: [ASSUMED] Based on common plugin architecture patterns
// server/lib/modules.cjs

const fs = require('fs');
const path = require('path');

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.modulesByDependency = new Map();
  }

  // Discover and load all modules from filesystem
  async discoverModules(modulePath) {
    const entries = fs.readdirSync(modulePath, { withFileTypes: true });
    const moduleDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

    for (const dir of moduleDirs) {
      const manifestPath = path.join(modulePath, dir.name, 'manifest.json');
      const indexPath = path.join(modulePath, dir.name, 'index.cjs');

      if (fs.existsSync(manifestPath) && fs.existsSync(indexPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const moduleExports = require(indexPath);

        this.modules.set(manifest.name, {
          manifest,
          exports: moduleExports,
          path: path.join(modulePath, dir.name)
        });
      }
    }

    return this.sortModulesByDependency();
  }

  // Topological sort for dependency ordering
  sortModulesByDependency() {
    const sorted = [];
    const visited = new Set();

    const visit = (moduleName) => {
      if (visited.has(moduleName)) return;
      visited.add(moduleName);

      const module = this.modules.get(moduleName);
      if (module?.manifest.dependencies) {
        for (const dep of module.manifest.dependencies) {
          visit(dep);
        }
      }

      sorted.push(moduleName);
    };

    for (const name of this.modules.keys()) {
      visit(name);
    }

    return sorted;
  }

  // Register all modules in dependency order
  async registerAll(app, db) {
    const order = this.sortModulesByDependency();

    for (const moduleName of order) {
      const module = this.modules.get(moduleName);
      if (module?.exports.register) {
        await module.exports.register(app, db);
        console.log(`[modules] Registered: ${moduleName}`);
      }
    }
  }
}

module.exports = new ModuleRegistry();
```

**Manifest format:**
```json
// server/modules/hipages-leads/manifest.json
{
  "name": "hipages-leads",
  "version": "1.0.0",
  "routePrefix": "/api/hipages-leads",
  "dependencies": ["core"],
  "description": "Scrapes hipages.com.au for trade service leads",
  "entitlementRequired": true
}
```

### Pattern 4: JWT with Tenant Claims
**What:** Extend existing JWT token generation to include tenant_id and tenant_slug claims.
**When to use:** All tenant authentication flows (registration, login, token refresh).
**Example:**
```javascript
// Source: [VERIFIED: npm registry] jsonwebtoken 9.0.2 documentation
// server/lib/auth-platform.cjs

function generateTenantToken(userId, tenantId, tenantSlug) {
  return jwt.sign(
    {
      userId,
      tenantId,    // NEW: Tenant UUID
      tenantSlug   // NEW: Tenant slug for routing
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyTenantToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // decoded.userId, decoded.tenantId, decoded.tenantSlug available
    return decoded;
  } catch (error) {
    return null;
  }
}
```

### Pattern 5: requireModule() Middleware
**What:** Express middleware that checks if tenant has active module before allowing route access.
**When to use:** All module-specific API routes (e.g., `/api/hipages-leads/*`).
**Example:**
```javascript
// server/lib/modules.cjs

function requireModule(moduleName) {
  return async (req, res, next) => {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if tenant has module active
    const result = await query(
      `SELECT active FROM tenant_modules WHERE tenant_id = $1 AND module_name = $2`,
      [tenantId, moduleName]
    );

    if (result.rows.length === 0 || !result.rows[0].active) {
      return res.status(403).json({
        error: `Module '${moduleName}' is not active for your tenant. Please enable it in your account settings.`
      });
    }

    next();
  };
}

// Usage in routes
router.get('/scraper/run', requireModule('hipages-leads'), async (req, res) => {
  // Only accessible if hipages-leads module is active for tenant
});
```

### Anti-Patterns to Avoid
- **Storing tenant_id in global variable:** Breaks with concurrent requests. Use AsyncLocalStorage instead.
- **RLS as sole isolation layer:** Application-layer WHERE clauses provide defense-in-depth. RLS alone is insufficient if connection pooling causes session variable leaks.
- **Dynamic require() without manifest validation:** Arbitrary code execution risk. All modules must have valid manifest.json before loading.
- **Direct table access without tenant filtering:** Always include WHERE tenant_id = ? in application code, even with RLS enabled.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Async context propagation | Custom middleware passing tenant_id through all function calls | Built-in `AsyncLocalStorage` (Node.js 15+) | Eliminates callback hell, request-scoped automatic propagation |
| Password hashing | Custom SHA256 or MD5 | `bcryptjs` with salt rounds: 10 | Battle-tested, resistant to rainbow table attacks |
| JWT signing/verification | Custom token implementation | `jsonwebtoken` 9.0.2 | Standard library, handles expiration, claims, verification |
| UUID generation | Custom random string generation | `uuid` v9.0.1 (or v4) | RFC 4122 compliant, collision-resistant, widely supported |
| Topological sort | Custom dependency resolution algorithm | Kahn's algorithm implementation | Proven algorithm, handles circular dependency detection |
| Route guards | Inline checks in each handler | Express middleware pattern | DRY, composable, testable |

**Key insight:** Multi-tenancy is a solved problem. The industry standard is shared database with tenant_id columns + application-layer filtering. RLS provides defense-in-depth but is not a substitute for application logic.

## Runtime State Inventory

> Not applicable — Phase 1 is greenfield development (no rename/refactor/migration).

**Phase 1 builds NEW platform alongside EXISTING CRM:**
- Existing tables (leads, appointments, tasks, etc.) remain untouched until Phase 2
- New platform tables (tenants, tenant_users, tenant_modules) created in same database
- No runtime state migration required

## Common Pitfalls

### Pitfall 1: Session Variable Leakage in Connection Pooling
**What goes wrong:** PostgreSQL `set_config()` sets session variables for the entire connection lifecycle. In pooled environments, one tenant's context may leak to another tenant if the connection is reused without resetting.
**Why it happens:** Connection pools reuse client connections. If tenant A sets `app.current_tenant` and releases the connection, tenant B may acquire the same connection and inherit A's session variable.
**How to avoid:**
1. Reset session variable before returning connection to pool: `SELECT set_config('app.current_tenant', '', TRUE)`
2. Use `set_config()` with third parameter `TRUE` (local to transaction) where possible
3. Always set tenant context at the start of each request in middleware
**Warning signs:** Seeing data from other tenants, intermittent permission errors, test failures that pass on re-run

### Pitfall 2: RLS Policies Not Enforcing for Superuser
**What goes wrong:** RLS policies are silently bypassed when connected as PostgreSQL superuser.
**Why it happens:** By default, superuser bypasses RLS. This is a PostgreSQL security feature (not a bug) to prevent lockout.
**How to avoid:**
1. Create `app_user` role with limited privileges (not superuser)
2. Use `app_user` for all application queries
3. Only use superuser for migrations and administrative tasks
**Warning signs:** RLS policies appear to work in dev but fail in production, tenants seeing each other's data

### Pitfall 3: Module Loading Race Conditions
**What goes wrong:** Modules register routes or dependencies before core platform initializes.
**Why it happens:** Filesystem discovery is synchronous; module registration may be async. Dependency order not enforced.
**How to avoid:**
1. Use topological sort based on manifest dependencies
2. Await all module registration before starting Express server
3. Validate dependency graph (detect cycles before loading)
**Warning signs:** "Cannot find module" errors, routes returning 404, inconsistent startup behavior

### Pitfall 4: JWT Token Size Exceeding Browser Limits
**What goes wrong:** JWT tokens with many claims (tenant_id, tenant_slug, permissions, etc.) exceed 4KB cookie limit or browser storage limits.
**Why it happens:** Each claim adds to Base64-encoded payload. Overly granular permissions bloat token.
**How to avoid:**
1. Keep JWT claims minimal: userId, tenantId, tenantSlug, exp, iat
2. Fetch permissions from database on each request (cached per tenant)
3. Consider storing permissions in separate localStorage key (refresh on login)
**Warning signs:** 413 Payload Too Large errors, localStorage quota exceeded, slow page loads

### Pitfall 5: Tenant Context Not Propagated to Async Operations
**What goes wrong:** Tenant context lost in setTimeout, Promise, or async/await chains.
**Why it happens:** Without AsyncLocalStorage, tenant_id must be explicitly passed through all async calls.
**How to avoid:**
1. Use AsyncLocalStorage for request-scoped tenant context
2. Never store tenant_id in global/module-level variables
3. Always retrieve tenant_id from context or JWT in each request
**Warning signs:** Intermittent "tenant_id is null" errors, data appearing in wrong tenant, inconsistent query results

## Code Examples

Verified patterns from official sources:

### Generating JWT with Custom Claims (Tenant-Aware)
```javascript
// Source: [VERIFIED: npm registry] jsonwebtoken 9.0.2
const jwt = require('jsonwebtoken');

function generateTenantToken(userId, tenantId, tenantSlug) {
  return jwt.sign(
    {
      userId,      // User's UUID
      tenantId,    // Tenant's UUID (NEW)
      tenantSlug   // Tenant's unique slug (NEW)
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}
```

### Verifying JWT and Extracting Tenant Context
```javascript
// Source: [VERIFIED: npm registry] jsonwebtoken 9.0.2
function verifyTenantToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug
    };
  } catch (error) {
    return null; // Invalid or expired token
  }
}
```

### PostgreSQL Transaction with Tenant Isolation
```javascript
// Source: [VERIFIED: Context7] node-postgres transactions
const { transaction } = require('./lib/database.cjs');

async function createTenantWithOwner(tenantData, ownerData) {
  return transaction(async (client) => {
    // Create tenant
    const tenantResult = await client.query(
      'INSERT INTO tenants (name, slug, plan) VALUES ($1, $2, $3) RETURNING id',
      [tenantData.name, tenantData.slug, 'free_trial']
    );
    const tenantId = tenantResult.rows[0].id;

    // Create owner user linked to tenant
    const userResult = await client.query(
      `INSERT INTO tenant_users (tenant_id, email, password_hash, role)
       VALUES ($1, $2, $3, 'owner') RETURNING id`,
      [tenantId, ownerData.email, ownerData.passwordHash]
    );
    const userId = userResult.rows[0].id;

    // Create default seed data for tenant
    await seedDefaultPipelineStages(client, tenantId);

    return { tenantId, userId };
  });
}
```

### Hashing Password with bcryptjs
```javascript
// Source: [VERIFIED: npm registry] bcryptjs 2.4.3
const bcrypt = require('bcryptjs');

async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10); // 10 salt rounds per project convention
  return bcrypt.hash(plainPassword, salt);
}

async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}
```

### AsyncLocalStorage for Tenant Context
```javascript
// Source: [CITED: https://nodejs.org/api/async_context.html]
const { AsyncLocalStorage } = require('async_hooks');
const tenantContext = new AsyncLocalStorage();

// Middleware: Extract tenant from JWT and store in context
function tenantMiddleware(req, res, next) {
  const tenantId = req.user?.tenantId;
  tenantContext.run({ tenantId }, () => next());
}

// Usage: Access tenant context anywhere in async call chain
function getCurrentTenantId() {
  return tenantContext.getStore()?.tenantId;
}

// Example in database query
async function findLeadsForTenant() {
  const tenantId = getCurrentTenantId();
  return query('SELECT * FROM leads WHERE tenant_id = $1', [tenantId]);
}
```

### RLS Policy Creation SQL
```sql
-- Source: [CITED: https://www.postgresql.org/docs/current/ddl-rowsecurity.html]

-- Enable RLS on table
ALTER TABLE tenant_users SET ROW LEVEL SECURITY;

-- Create policy: Users can only see rows from their tenant
CREATE POLICY tenant_isolation_policy ON tenant_users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);

-- Create policy: Owners can do everything, members read-only
CREATE POLICY role_based_policy ON tenant_users
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant', TRUE)::uuid
    AND (
      current_setting('app.user_role', TRUE) = 'owner'
      OR current_setting('app.user_role', TRUE) = 'admin'
    )
  );
```

### Module Topological Sort (Kahn's Algorithm)
```javascript
// Source: [ASSUMED] Standard algorithm for dependency resolution
function topologicalSort(modules) {
  const graph = {};
  const inDegree = {};

  // Build graph and in-degree map
  for (const [name, module] of Object.entries(modules)) {
    graph[name] = module.manifest.dependencies || [];
    inDegree[name] = (inDegree[name] || 0) + 0;

    for (const dep of graph[name]) {
      inDegree[dep] = (inDegree[dep] || 0) + 1;
    }
  }

  // Queue of nodes with no incoming edges
  const queue = Object.keys(inDegree).filter(n => inDegree[n] === 0);
  const sorted = [];

  while (queue.length > 0) {
    const node = queue.shift();
    sorted.push(node);

    for (const dep of (graph[node] || [])) {
      inDegree[dep]--;
      if (inDegree[dep] === 0) {
        queue.push(dep);
      }
    }
  }

  // Check for cycles
  if (sorted.length !== Object.keys(modules).length) {
    throw new Error('Circular dependency detected in modules');
  }

  return sorted;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate databases per tenant | Shared database with tenant_id columns | Industry standard since ~2015 | Cost-effective, simpler ops, proven pattern |
| Application-layer filtering only | Dual-layer (app WHERE + PostgreSQL RLS) | ~2018 with PostgreSQL 10+ RLS maturity | Defense-in-depth, prevents app-level bugs from leaking data |
| Per-tenant connection pools | Single pool with AsyncLocalStorage context | Node.js 15+ (2020) | Eliminates pool exhaustion, scales to thousands of tenants |
| Hardcoded module lists | Dynamic module discovery with manifests | ~2017 plugin architecture pattern | Extensible without code changes, third-party modules possible |
| JWT tokens with user claims only | JWT tokens with tenant_id + custom claims | ~2016 multi-tenant SaaS patterns | Enables tenant-aware routing, single endpoint multi-tenancy |

**Deprecated/outdated:**
- **Per-tenant databases:** Operational overhead, complex migrations. Use shared DB with tenant_id.
- **Superuser DB connections for app:** Bypasses RLS. Use non-superuser `app_user` role.
- **Global variables for tenant context:** Breaks with concurrent requests. Use AsyncLocalStorage.
- **Monolithic module registration:** Requires code changes for new modules. Use filesystem discovery.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | UUID v7 is available in uuid package or requires alternative implementation | Standard Stack | If v7 not available, fall back to v4 (non-time-sorted).不影响功能，失去可排序性。 |
| A2 | AsyncLocalStorage works with Express middleware and pg connection pooling | Architecture Patterns | If context propagation fails, tenant isolation breaks.需验证连接池重用时的行为。 |
| A3 | Existing `admin_users` table can be extended for tenant users or separate `tenant_users` table created | Architecture Patterns | If using wrong table, auth may break.需确认现有admin schema与平台auth的关系。 |
| A4 | Module manifests can be simple JSON files without strict schema validation | Architecture Patterns | If malformed manifests crash server,需添加验证。Low risk: 文件系统扫描在启动时失败会阻止服务器启动。 |
| A5 | RLS policies work with connection pooling when `set_config()` called per-request | Common Pitfalls | If session variables leak，租户数据隔离失效。Critical: 需在中间件中设置租户上下文。 |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (5 assumptions flagged for validation)

## Open Questions

1. **Should tenant_users extend existing admin_users or create separate table?**
   - What we know: Existing `admin_users` table exists for Revive admin portal.
   - What's unclear: Whether platform tenants are same as Revive admins or separate user type.
   - Recommendation: Create separate `tenant_users` table to avoid coupling Revive admin auth to platform tenant auth. Phase 1 keeps them separate; Phase 2 may converge.

2. **How to handle tenant slug uniqueness across system?**
   - What we know: AUTH-05 requires unique tenant_slug for subdomain routing.
   - What's unclear: Whether to enforce at DB level (unique constraint) or application level.
   - Recommendation: Add UNIQUE constraint on `tenants.slug` column. On registration conflict, suggest alternative slugs (e.g., "acme-corp-2").

3. **Should seed data be tenant-specific or global templates?**
   - What we know: AUTH-07 requires default seed data (pipeline stages, categories).
   - What's unclear: Whether all tenants get same seed or customizable per business type.
   - Recommendation: Start with global seed data (all tenants get same pipeline). Phase 3+ can add business-type-specific templates.

4. **How to handle module dependencies during activation?**
   - What we know: PCORE-09 requires modules load in dependency order.
   - What's unclear: Whether activating a module should auto-activate its dependencies or block until dependencies enabled.
   - Recommendation: Block activation if dependencies not met. Show UI message: "Enable [dependency] module first."

## Environment Availability

### External Dependencies Check

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL (server) | Database layer, RLS policies | ✓ | 15.4 | — |
| Node.js AsyncLocalStorage | Tenant context propagation | ✓ | 20.x | — |
| pg library | Database client | ✓ | 8.11.3 | — |
| jsonwebtoken | JWT signing/verification | ✓ | 9.0.2 | — |
| bcryptjs | Password hashing | ✓ | 2.4.3 | — |
| uuid library | UUID generation | ✓ | 9.0.1 | — |
| express | API server | ✓ | 5.2.1 | — |
| Playwright | E2E testing | ✓ | 1.59.1 | — |

**Missing dependencies with no fallback:**
- None. All required dependencies are available.

**Missing dependencies with fallback:**
- None. Phase 1 has no external service dependencies (no external APIs, no third-party services).

**Validation Infrastructure:**
- Playwright 1.59.1 installed for E2E testing
- Test files exist in `tests/` directory
- Manual testing approach per config (testing.framework: "manual")

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.59.1 (E2E) |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test tests/user-request-test.spec.ts` |
| Full suite command | `npx playwright test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PCORE-01 | System supports multiple tenants with isolated data | e2e | `npx playwright test tests/tenant-isolation.spec.ts` | ❌ Wave 0 |
| PCORE-02 | JWT contains tenant_id UUID v7 | unit | Write test in tests/auth.test.ts | ❌ Wave 0 |
| PCORE-03 | Dual-layer filtering (WHERE + RLS) | integration | Write test in tests/rls.test.sql | ❌ Wave 0 |
| AUTH-01 | New tenant can sign up | e2e | `npx playwright test tests/tenant-signup.spec.ts` | ❌ Wave 0 |
| AUTH-02 | JWT tokens include tenant_id and tenant_slug | unit | Write test in tests/jwt-claims.test.ts | ❌ Wave 0 |
| AUTH-03 | Tenant login persists across refreshes | e2e | `npx playwright test tests/tenant-login-persistence.spec.ts` | ❌ Wave 0 |
| AUTH-04 | Owner can invite team members | e2e | `npx playwright test tests/team-invitation.spec.ts` | ❌ Wave 0 |
| AUTH-06 | Password hashed with bcrypt | unit | Write test in tests/password-hash.test.ts | ❌ Wave 0 |
| AUTH-07 | New tenant gets default seed data | integration | Write test in tests/seed-data.test.ts | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test tests/user-request-test.spec.ts --grep @platform` (after creating tagged tests)
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/tenant-signup.spec.ts` — E2E test for tenant registration
- [ ] `tests/tenant-login-persistence.spec.ts` — E2E test for auth persistence
- [ ] `tests/team-invitation.spec.ts` — E2E test for team invitation flow
- [ ] `tests/auth-claims.test.ts` — Unit tests for JWT tenant claims
- [ ] `tests/tenant-isolation.spec.ts` — E2E test for data isolation between tenants
- [ ] `tests/rls-policy-check.test.sql` — SQL script to verify RLS policies enforce
- [ ] `tests/module-registry.test.ts` — Unit tests for module discovery and loading

**Framework status:** Playwright installed and configured. Project uses manual testing per config.json (`testing.framework: "manual"`), but automation infrastructure exists for validation.

## Security Domain

> Phase 1 implements multi-tenant authentication and data isolation. Security is critical.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT tokens with tenant_id claims, bcrypt password hashing (10 rounds) |
| V3 Session Management | yes | JWT stored in localStorage, 7-day expiry, per-request validation |
| V4 Access Control | yes | Dual-layer tenant isolation (app WHERE + PostgreSQL RLS), RBAC for team roles |
| V5 Input Validation | yes | Parameterized queries (pg library), server-side validation on all inputs |
| V6 Cryptography | yes | bcryptjs for passwords (don't hand-roll), jsonwebtoken for JWT (HS256) |

### Known Threat Patterns for Multi-Tenant SaaS

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tenant data leakage (seeing other tenants' data) | Information Disclosure | Dual-layer isolation: app WHERE tenant_id + PostgreSQL RLS policies |
| Cross-tenant token forgery | Spoofing | JWT signed with server secret, includes tenant_id claim, verified on every request |
| SQL injection to bypass tenant filtering | Tampering | Parameterized queries ($1, $2) via pg library, never concatenate user input |
| Session hijacking via JWT theft | Spoofing | Short-lived tokens (7 days), consider refresh tokens (deferred), HTTPS in production |
| Module privilege escalation | Elevation of Privilege | requireModule() middleware checks tenant_modules table before access |
| RLS bypass via superuser connection | Tampering | Use non-superuser app_user role for all application queries |
| Slug collision leading to account takeover | Spoofing | UNIQUE constraint on tenants.slug, validate on registration, suggest alternatives |

**Additional security considerations:**
- **Password storage:** bcryptjs with 10 salt rounds (matching existing customer portal)
- **JWT secret:** Must be set via JWT_SECRET env variable, never use default
- **Tenant context propagation:** AsyncLocalStorage prevents cross-tenant request pollution
- **RLS policy verification:** Test policies with app_user role (not superuser)
- **Module code execution:** Only load modules with valid manifest.json, validate before require()

## Sources

### Primary (HIGH confidence)
- [Context7: node-postgres] - Transactions, connection pooling, multi-tenancy patterns
- [Context7: jsonwebtoken] - Custom claims, sign/verify API, expiration handling
- [npm registry] - Verified current versions: pg@8.11.3, jsonwebtoken@9.0.2, bcryptjs@2.4.3, uuid@9.0.1
- [PostgreSQL Documentation] - Row-Level Security (RLS), CREATE POLICY syntax, set_config() function
- [Node.js Documentation] - AsyncLocalStorage API for request-scoped context

### Secondary (MEDIUM confidence)
- [Existing codebase analysis] - Reusable patterns: AuthContext, ProtectedRoute, database.cjs, auth.cjs
- [Project CLAUDE.md] - Deployment architecture, existing auth patterns, tech stack constraints

### Tertiary (LOW confidence)
- [ASSUMED] Module discovery pattern - Standard plugin architecture, needs validation during implementation
- [ASSUMED] Topological sort for module dependencies - Kahn's algorithm is standard, needs testing with circular dependencies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified in npm registry, existing project dependencies
- Architecture: HIGH - Dual-layer isolation and RLS patterns documented in PostgreSQL docs
- Pitfalls: HIGH - Connection pooling session variable leak is known issue with documented mitigations
- Module system: MEDIUM - Plugin architecture is standard pattern, but implementation details need validation

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (30 days - PostgreSQL and Node.js APIs stable)

---

*Phase: 01-platform-core-authentication*
*Research complete: 2026-04-20*
