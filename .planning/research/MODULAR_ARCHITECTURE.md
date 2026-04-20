# Modular Monolith Architecture Research

**Project:** Revive Property Co SaaS Platform
**Domain:** Multi-tenant SaaS, trade services, AI-powered modules
**Researched:** 2026-04-20
**Overall confidence:** HIGH (patterns verified across multiple authoritative sources)

---

## 1. Module Boundary Patterns

### Recommended: Vertical Slice by Business Capability

Organize modules by **business capability**, not technical layer. Each module owns its own controllers, services, data access, and migrations. This mirrors Conway's Law intentionally — code structure matches the domain.

**Avoid this (technical layering):**
```
/server
  /controllers/  ← hipages, quotes, crm all mixed together
  /services/
  /models/
```

**Use this (vertical slice per capability):**
```
/modules
  /hipages-leads/
    index.cjs           ← module manifest & registration
    routes.cjs          ← Express router
    service.cjs         ← business logic
    db.cjs              ← DB queries (scoped to this module's tables)
    migrations/
  /ai-quotes/
    index.cjs
    routes.cjs
    service.cjs
    db.cjs
    migrations/
  /ai-seo/
    ...
```

### Boundary Enforcement Rules

1. **No cross-module imports of internal files.** `require('../ai-quotes/service')` from within `/hipages-leads/` is forbidden.
2. **Cross-module communication happens only through:**
   - The shared event bus (async, fire-and-forget)
   - A module's exported public API (`index.cjs` exports only)
   - The shared kernel for truly shared utilities
3. **Each module's `index.cjs` is its contract.** Anything not exported from `index.cjs` is private.

### Bounded Context Mapping for This Project

| Module | Business Capability | Owns |
|--------|---------------------|------|
| `hipages-leads` | Scrape + manage leads from hipages.com.au | leads table, scraper worker |
| `ai-quotes` | AI-generated instant quotes via chat | quote sessions, pricing logic |
| `ai-seo` | AI-generated SEO content | page content, keyword tracking |
| `ai-content` | Blog/social content generation | content pieces, schedules |
| `competitor-analysis` | Monitor competitor pricing/presence | competitor snapshots |
| `tenant-core` | Tenant accounts, billing, module activation | tenants, subscriptions, module_activations |
| `auth` | Login, sessions, JWT | auth tables (or delegates to Supabase) |
| `notifications` | Email/SMS dispatch | notification_logs |

---

## 2. Code Organization — Recommended Directory Structure

```
/opt/homelab/apps/revivepropertyco/
├── server/
│   ├── core/                         ← Platform core (NOT a business module)
│   │   ├── app.cjs                   ← Express app factory
│   │   ├── module-registry.cjs       ← Module loader & router registrar
│   │   ├── event-bus.cjs             ← In-process EventEmitter bus
│   │   ├── db.cjs                    ← Shared pg pool
│   │   ├── middleware/
│   │   │   ├── auth.cjs
│   │   │   ├── tenant-context.cjs    ← Extracts tenant_id, checks module access
│   │   │   └── error-handler.cjs
│   │   └── shared-kernel/
│   │       ├── logger.cjs
│   │       ├── pagination.cjs
│   │       └── validation.cjs
│   │
│   ├── modules/
│   │   ├── tenant-core/
│   │   │   ├── index.cjs             ← exports: { manifest, register }
│   │   │   ├── routes.cjs
│   │   │   ├── service.cjs
│   │   │   ├── db.cjs
│   │   │   └── migrations/
│   │   │       └── 001_tenant_core.sql
│   │   │
│   │   ├── hipages-leads/
│   │   │   ├── index.cjs
│   │   │   ├── routes.cjs
│   │   │   ├── service.cjs
│   │   │   ├── db.cjs
│   │   │   ├── scraper-worker.cjs    ← Optional: background job
│   │   │   └── migrations/
│   │   │       └── 001_hipages_leads.sql
│   │   │
│   │   ├── ai-quotes/
│   │   │   ├── index.cjs
│   │   │   ├── routes.cjs
│   │   │   ├── service.cjs           ← calls Z.AI / Gemini
│   │   │   ├── db.cjs
│   │   │   └── migrations/
│   │   │
│   │   ├── ai-seo/
│   │   ├── ai-content/
│   │   └── competitor-analysis/
│   │
│   └── index.cjs                     ← Entry point: loads modules, starts server
│
├── src/                              ← React frontend (unchanged structure)
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── modules/              ← Per-module admin UI components
│   │   │   │   ├── HipagesLeadsPage.tsx
│   │   │   │   ├── AiQuotesPage.tsx
│   │   │   │   └── AiSeoPage.tsx
│   │   └── ...
│   └── ...
│
└── docker-compose.yml                ← Single service (monolith)
```

**Key principle:** `server/core/` never imports from `server/modules/`. Modules import from core. Never the reverse.

---

## 3. Module Interface Design

### Module Manifest Contract

Every module exports a manifest object. This is the **only public surface** the platform core interacts with.

```javascript
// server/modules/hipages-leads/index.cjs

'use strict';

const routes = require('./routes.cjs');
const { startScraper } = require('./scraper-worker.cjs');

/** @type {ModuleManifest} */
const manifest = {
  name: 'hipages-leads',
  version: '1.0.0',
  displayName: 'HiPages Lead Sync',
  description: 'Scrapes and syncs leads from hipages.com.au',

  // Route mounting: all routes prefixed with this
  routePrefix: '/api/modules/hipages-leads',

  // Dependencies: other module names this module needs
  // Platform will ensure these are loaded first
  dependencies: ['tenant-core'],

  // Background workers to start when module activates
  workers: [startScraper],

  // Called by module-registry during startup
  register(app, { db, eventBus, logger }) {
    app.use(this.routePrefix, routes({ db, eventBus, logger }));
    logger.info(`[hipages-leads] registered at ${this.routePrefix}`);
  },

  // Called when a specific tenant activates this module
  async onTenantActivate(tenantId, { db }) {
    // e.g., seed default config for this tenant
    await db.query(
      `INSERT INTO hipages_leads_config (tenant_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [tenantId]
    );
  },

  // Called when a tenant deactivates this module
  async onTenantDeactivate(tenantId, { db }) {
    // optional cleanup
  },
};

module.exports = manifest;
```

### Module Registry (Core)

```javascript
// server/core/module-registry.cjs

'use strict';

const ALL_MODULES = [
  require('../modules/tenant-core'),
  require('../modules/hipages-leads'),
  require('../modules/ai-quotes'),
  require('../modules/ai-seo'),
  require('../modules/ai-content'),
  require('../modules/competitor-analysis'),
];

function loadModules(app, deps) {
  // Topological sort by dependencies
  const sorted = topoSort(ALL_MODULES);

  for (const mod of sorted) {
    mod.register(app, deps);
  }
}

module.exports = { loadModules, ALL_MODULES };
```

### Route Registration Pattern (Express)

```javascript
// server/modules/hipages-leads/routes.cjs

'use strict';

const express = require('express');
const { requireAuth } = require('../../core/middleware/auth.cjs');
const { requireModule } = require('../../core/middleware/tenant-context.cjs');
const service = require('./service.cjs');

module.exports = function createRouter({ db, eventBus, logger }) {
  const router = express.Router();

  // requireModule('hipages-leads') checks that the calling tenant has this module active
  router.use(requireAuth, requireModule('hipages-leads'));

  router.get('/leads', async (req, res, next) => {
    try {
      const leads = await service.getLeads(req.tenant.id, db);
      res.json(leads);
    } catch (err) {
      next(err);
    }
  });

  return router;
};
```

### Inter-Module Communication

**Synchronous (direct call through exported API):**
```javascript
// ai-quotes/service.cjs needs tenant info from tenant-core
const tenantCore = require('../tenant-core');  // ONLY index.cjs export
const tenant = await tenantCore.getTenantById(tenantId);
```

**Asynchronous (event bus — preferred for loose coupling):**
```javascript
// hipages-leads emits an event
eventBus.emit('hipages-leads:lead.created', { tenantId, leadId });

// ai-quotes subscribes (registered during module.register())
eventBus.on('hipages-leads:lead.created', async ({ tenantId, leadId }) => {
  await autoGenerateQuote(tenantId, leadId);
});
```

Use events for: notifications, side effects, analytics. Use direct calls for: data lookups needed synchronously.

---

## 4. Database Design

### Schema Ownership Strategy

Use **PostgreSQL schemas as module namespaces** within a single database. Each module owns its schema.

```sql
-- Platform schemas
CREATE SCHEMA IF NOT EXISTS core;           -- tenant_core module
CREATE SCHEMA IF NOT EXISTS hipages_leads;
CREATE SCHEMA IF NOT EXISTS ai_quotes;
CREATE SCHEMA IF NOT EXISTS ai_seo;
CREATE SCHEMA IF NOT EXISTS ai_content;
CREATE SCHEMA IF NOT EXISTS competitor;
```

### Multi-Tenant Row-Level Security

The recommended modern approach for shared-infrastructure SaaS: **shared tables + RLS + tenant_id column** on every tenant-scoped table.

```sql
-- hipages_leads schema
CREATE TABLE hipages_leads.leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES core.tenants(id),
  hipages_id  TEXT,
  name        TEXT,
  phone       TEXT,
  job_type    TEXT,
  status      TEXT DEFAULT 'new',
  scraped_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: tenants only see their own rows
ALTER TABLE hipages_leads.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON hipages_leads.leads
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
```

Set `app.tenant_id` per-request in the tenant-context middleware:
```javascript
// server/core/middleware/tenant-context.cjs
await db.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
```

### Module-Specific Migrations

Each module manages its own migration files. A central migration runner applies them in order.

```
server/modules/hipages-leads/migrations/
  001_create_leads_table.sql
  002_add_job_category_column.sql

server/modules/ai-quotes/migrations/
  001_create_quote_sessions.sql
```

Central runner (called at startup or via CLI):
```javascript
// server/core/run-migrations.cjs
for (const mod of ALL_MODULES) {
  const migDir = path.join(__dirname, '../modules', mod.name, 'migrations');
  await applyMigrations(db, migDir, mod.name);  // tracks in schema_migrations table
}
```

### Core Tenant Tables

```sql
CREATE SCHEMA IF NOT EXISTS core;

CREATE TABLE core.tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,     -- e.g., 'acme-plumbing'
  name         TEXT NOT NULL,
  plan         TEXT NOT NULL DEFAULT 'starter',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Which modules each tenant has active
CREATE TABLE core.tenant_modules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES core.tenants(id),
  module_name  TEXT NOT NULL,            -- 'hipages-leads', 'ai-quotes', etc.
  enabled      BOOLEAN NOT NULL DEFAULT false,
  config       JSONB DEFAULT '{}',       -- module-specific tenant config
  activated_at TIMESTAMPTZ,
  UNIQUE(tenant_id, module_name)
);
```

---

## 5. Feature Flags & Module Activation

### Two Distinct Levels

| Level | What | Mechanism |
|-------|------|-----------|
| **Module enabled** | Tenant has purchased/activated a module | `core.tenant_modules.enabled` |
| **Feature flag** | Specific sub-feature within a module | JSONB in `tenant_modules.config` |

### Tenant-Context Middleware (enforces both)

```javascript
// server/core/middleware/tenant-context.cjs

async function tenantContext(req, res, next) {
  const tenantId = req.user?.tenant_id;
  if (!tenantId) return res.status(401).json({ error: 'No tenant context' });

  // Cache in Redis (or in-process LRU) — this fires on every request
  const modules = await getTenantModules(tenantId);  // returns Set of active module names

  req.tenant = { id: tenantId, modules };
  next();
}

function requireModule(moduleName) {
  return (req, res, next) => {
    if (!req.tenant.modules.has(moduleName)) {
      return res.status(403).json({
        error: 'MODULE_NOT_ACTIVATED',
        module: moduleName,
      });
    }
    next();
  };
}
```

### Activation Flow

```
Admin UI → POST /api/tenant-core/modules/hipages-leads/activate
  → tenant-core service validates plan includes module
  → INSERT INTO core.tenant_modules (enabled=true)
  → Emit 'tenant-core:module.activated' event
  → hipages-leads.onTenantActivate() handler fires (seeds defaults)
  → Return success
```

### Module Activation Cache

Cache the set of active modules per tenant to avoid a DB round-trip on every API request:

```javascript
// In-process cache (acceptable for single-instance deployment)
const moduleCache = new Map();  // tenantId → { modules: Set, expiresAt: Date }

// Or Redis for multi-instance:
// await redis.setex(`tenant:${tenantId}:modules`, 300, JSON.stringify([...activeModules]));
```

Invalidate cache on `tenant-core:module.activated` and `tenant-core:module.deactivated` events.

---

## 6. Plugin/Module Registry

### Self-Registration Pattern

The module registry scans a known directory at startup — no manual list maintenance needed.

```javascript
// server/core/module-registry.cjs

const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '../modules');

function discoverModules() {
  const dirs = fs.readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  return dirs.map(name => {
    const indexPath = path.join(MODULES_DIR, name, 'index.cjs');
    if (!fs.existsSync(indexPath)) return null;
    return require(indexPath);
  }).filter(Boolean);
}

function validateManifest(mod) {
  const required = ['name', 'version', 'routePrefix', 'register'];
  for (const field of required) {
    if (!mod[field]) throw new Error(`Module missing required field: ${field}`);
  }
}

async function loadModules(app, deps) {
  const modules = discoverModules();
  modules.forEach(validateManifest);

  // Sort: dependencies before dependents
  const sorted = topoSort(modules, m => m.dependencies || []);

  for (const mod of sorted) {
    deps.logger.info(`Loading module: ${mod.name} v${mod.version}`);
    await mod.register(app, deps);
  }

  return sorted;
}
```

### Module Capability Declaration

Modules can declare capabilities that the frontend uses to render the admin UI:

```javascript
// In module manifest
capabilities: {
  adminPage: true,                    // has an admin UI page
  workerProcess: true,                // runs a background job
  webhooks: false,                    // does not expose webhooks
  configurable: true,                 // has per-tenant config options
  plans: ['pro', 'enterprise'],       // which subscription plans include this
},
```

This enables a "Module Marketplace" UI: `GET /api/tenant-core/module-catalog` returns all registered modules with their capabilities and the current tenant's activation status.

---

## 7. When to Split a Module into a Microservice

### Keep it in the Monolith Until These Thresholds Are Met

**Extract to microservice when ALL of the following are true:**

| Signal | Threshold | Current State |
|--------|-----------|---------------|
| Independent deploy frequency | Module deploys >10x/week independently | Homelab: irrelevant |
| Team boundary | Dedicated team owns module, blocked by other teams | Solo/small team: irrelevant |
| Resource profile | Module needs 10x+ more CPU/RAM than the rest | hipages scraper is candidate |
| Tech stack mismatch | Module needs Python/Go/different runtime | ai-seo could use Python eventually |
| Compliance isolation | Module must be in a different network zone | Not currently needed |
| Scale independently | Module gets 100x more traffic than others | Not currently relevant |

### Realistic Extraction Candidates for This Project

**hipages-scraper** is the only near-term extraction candidate because:
- Already runs as a separate Node.js process with its own `package.json`
- Uses Playwright (heavy dependency, different lifecycle)
- Has independent deployment concerns (chromium, credentials)
- Already containerized separately in `docker-compose.yml`

**Keep everything else as a module in the monolith** — the team is small, the traffic is low, and the coordination overhead of microservices far exceeds the benefits at this scale.

### Warning: Premature Extraction Signs

If you're extracting a module because:
- "It feels cleaner" — don't
- "We might need to scale it later" — don't, you can extract then
- "Each module should be independent" — the monolith already provides logical independence

Studies (preprints.org, 2025) consistently show teams at <15 developers experience net-negative outcomes from microservices adoption due to coordination overhead exceeding architectural benefits.

---

## 8. Containerization

### Recommended: Single Container (Current + Near-term)

```yaml
# docker-compose.yml (simplified target state)
services:
  app:
    build: .
    ports: ["8080:8080"]
    environment:
      DATABASE_URL: postgres://...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`revivepropertyco.au`)"

  scraper:
    build: ./services/hipages-scraper
    depends_on: [app, db]
    environment:
      HIPAGES_USERNAME: ${HIPAGES_USERNAME}
      HIPAGES_PASSWORD: ${HIPAGES_PASSWORD}
    # Separate container ONLY because of Playwright/Chromium weight

  db:
    image: postgres:16-alpine
    volumes: [postgres_data:/var/lib/postgresql/data]

  traefik:
    image: traefik:v3
```

**Keep the Express app and all business modules in one container.** The benefits of splitting them don't exist at homelab scale. Single container means:
- One deployment unit
- Shared memory (no network serialization for inter-module calls)
- Simple debugging (`docker logs app`)
- Zero service discovery overhead

### When to Add a Container

Add a container only when a component needs:
- A fundamentally different base image (Python, Go, Chromium)
- Different resource limits (scraper needs more CPU/RAM)
- Different restart policies (scraper can fail; app cannot)
- Secrets isolation (scraper needs hipages credentials; app does not)

The hipages scraper already meets criteria 2, 3, and 4 — keeping it separate is correct.

### Build Optimization for Monolith Container

```dockerfile
# Dockerfile (multi-stage, single app container)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build              # Vite builds React to dist/

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY package.json .
EXPOSE 8080
CMD ["node", "server/index.cjs"]
```

---

## 9. Migration Path from Current Structure

Current state has flat `/server/api/*.cjs` files — good enough to ship, but will become unmaintainable as modules grow.

### Incremental Migration (No Big Bang Rewrite)

**Phase 1 (now):** Add `server/core/` and `server/modules/` directories. Move `hipages.cjs` to `server/modules/hipages-leads/`. Leave other APIs in place.

**Phase 2:** Extract `server/modules/tenant-core/` from the customer/auth tables. This is the foundation everything else depends on.

**Phase 3:** Migrate remaining APIs one-by-one: `quotes.cjs` → `ai-quotes`, `crm.cjs` → `crm-module`, etc.

**Phase 4:** Add module manifest + registry. Modules self-register at startup.

**Phase 5:** Add `core.tenant_modules` table. Wire up `requireModule()` middleware.

Do **not** try to do this all at once. Each step is independently deployable and improvable.

---

## 10. Confidence Assessment

| Area | Confidence | Sources |
|------|------------|---------|
| Module boundary patterns | HIGH | Verified across milanjovanovic.tech, thetshaped.dev, GitHub mgce/modular-monolith-nodejs |
| Directory structure | HIGH | Multiple Node.js-specific sources agree on vertical slice by capability |
| Module interface design | HIGH | Derived from NestJS module system + Node.js plugin manager patterns |
| PostgreSQL schema-per-module | HIGH | milanjovanovic.tech (authoritative .NET/PG source) + crunchydata.com |
| RLS for multi-tenancy | HIGH | crunchydata.com Crunchy Data (PostgreSQL authority) |
| Feature flags per tenant | HIGH | Multiple SaaS sources + NestJS feature flags implementation |
| Module extraction criteria | HIGH | coreline.agency (10x/week threshold), preprints.org empirical study |
| Single container recommendation | MEDIUM | Docker official docs + AWS re:Post discussion; homelab-specific experience is anecdotal |

---

## Key Sources

- [Milan Jovanovic: Data Boundaries in Modular Monolith](https://www.milanjovanovic.tech/blog/how-to-keep-your-data-boundaries-intact-in-a-modular-monolith)
- [Crunchy Data: Designing Postgres for Multi-Tenancy](https://www.crunchydata.com/blog/designing-your-postgres-database-for-multi-tenancy)
- [GitHub: mgce/modular-monolith-nodejs](https://github.com/mgce/modular-monolith-nodejs)
- [The T-Shaped Dev: Better Node.js Project Structure](https://thetshaped.dev/p/how-to-better-structure-your-nodejs-project-modular-monolith)
- [DEV Community: How to Structure a Modular Monolith](https://dev.to/shieldstring/how-to-structure-a-modular-monolith-110o)
- [CoreLine: Modular Monolith for Product Scale](https://coreline.agency/blog/modular-monolith-architecture-for-product-scale)
- [NestJS: Dynamic Modules](https://docs.nestjs.com/fundamentals/dynamic-modules)
- [Theodo: Feature Flags in NestJS](https://blog.theodo.com/2023/10/feature-flags-nestjs/)
- [V. Checha: Node.js Plugin Manager Pattern](https://v-checha.medium.com/node-js-advanced-patterns-plugin-manager-44adb72aa6bb)
- [Preprints.org: Empirical Comparison Microservice vs Monolith (2025)](https://www.preprints.org/manuscript/202511.1267)
- [Data Management in Modular Monoliths: 4 Isolation Strategies](https://mehmetozkaya.medium.com/data-management-in-modular-monoliths-4-data-isolation-strategies-1042667a099c)
