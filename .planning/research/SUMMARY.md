# Research Summary: Modular AI SaaS Platform

**Synthesized:** 2026-04-20
**Sources:** TWENTY_CRM.md, MODULAR_ARCHITECTURE.md, MULTI_TENANCY.md, BILLING.md

---

## Architecture Decision Summary

### Platform Architecture: Modular Monolith

- **Single Express.js container** with all business modules inside
- **Each module = vertical slice** with its own routes, service, DB queries, migrations
- **Module manifest contract** — `index.cjs` exports `{ name, routePrefix, dependencies, register() }`
- **Module registry** auto-discovers modules at startup, sorts by dependencies, registers routes
- **PostgreSQL schemas** as module namespaces (`hipages_leads.leads`, `ai_quotes.sessions`)
- **Only exception:** hipages scraper stays as separate container (Playwright/Chromium dependency)

### Multi-Tenancy: Shared DB + Dual-Layer Filtering

- **UUID v7** for tenant IDs (time-ordered, no page-split problem)
- **AsyncLocalStorage** for tenant context propagation (< 2% overhead)
- **`set_config('app.current_tenant', id, TRUE)`** — transaction-local, safe with connection pools
- **Dual-layer:** Application `WHERE tenant_id = $1` (primary) + PostgreSQL RLS (backstop)
- **`FORCE ROW LEVEL SECURITY`** on all tenant tables — no silent bypass
- **Non-superuser `app_user`** role for all application queries

### Twenty CRM: API-First Integration

- **Self-hosted 4-service stack** (server, worker, PostgreSQL 16, Redis 7.4)
- **API integration via REST + GraphQL** — never write directly to Twenty's DB
- **One instance per tenant** (recommended for SaaS — workspace isolation not production-validated)
- **Sync Layer module** (`twenty-sync`) handles all Twenty communication
- **Rate limit:** 100 calls/min, batch of 60 records per call
- **Critical:** Set `SERVER_URL` correctly before first boot, hex-only PG passwords

### Billing: Per-Module Stripe Subscriptions

- **Single Stripe subscription per tenant** with one item per active module
- **Flat-rate per module** ($39-$59/mo each), exception: AI content with usage cap
- **Entitlement DB** (`tenant_modules`) is the runtime authority — synced via webhooks
- **Build entitlements first** (manual toggle), layer Stripe on top
- **Proration:** `always_invoice` for additions, `create_prorations` for removals
- **14-day trial** with `missing_payment_method: 'pause'`

---

## Critical Decisions

| Decision | Recommendation | Confidence |
|----------|---------------|------------|
| Module architecture | Modular monolith (single container) | HIGH |
| Multi-tenancy model | Shared DB with tenant_id + RLS | HIGH |
| Twenty integration | API-first, one instance per tenant | MEDIUM-HIGH |
| Module boundaries | Vertical slice, manifest-based self-registration | HIGH |
| Billing system | Stripe subscription items + local entitlement DB | HIGH |
| Data isolation | AsyncLocalStorage + SET LOCAL + RLS | HIGH |
| Containerization | Single app container + scraper container | MEDIUM |

---

## Key Pitfalls to Avoid

1. **SET vs SET LOCAL** — tenant context bleeds across pooled connections without LOCAL
2. **SERVER_URL wrong at first Twenty boot** — requires volume destruction to fix
3. **Direct SQL writes to Twenty** — breaks metadata cache, causes schema corruption
4. **Superuser connections** — silently bypass all RLS policies
5. **UUID v4 for tenant IDs** — 500x more B-tree page splits vs v7
6. **Premature microservices** — net-negative for teams < 15 developers
7. **Stripe as runtime entitlement source** — too slow, use local DB + webhook sync

---

## Recommended Implementation Order

### Phase 1: Foundation (Platform Core)
- `server/core/` directory with module registry, event bus, tenant middleware
- `core.tenants` and `core.tenant_modules` tables
- `requireModule()` middleware for access gating
- AsyncLocalStorage tenant context propagation
- RLS policies on all data tables

### Phase 2: Twenty CRM Deployment
- Deploy self-hosted Twenty (docker-compose alongside platform)
- Create custom objects (ServiceJob, HipagesLead, Quote)
- Build `twenty-sync` module (API client, webhook receiver)
- Migrate existing data: leads → People, appointments → ServiceJob, tasks → Tasks

### Phase 3: First Module (hipages Leads)
- Refactor existing scraper into module structure
- Module manifest, routes, service, migrations
- Sync scraped leads to Twenty via twenty-sync module

### Phase 4: Billing & Subscription
- Stripe products/prices for all modules
- Checkout session for initial subscription
- Webhook handlers for entitlement sync
- Self-service billing UI

### Phase 5: Additional AI Modules
- AI Quotes module
- AI SEO module
- AI Content module
- Competitor Analysis module

---

## Stack Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite + TypeScript + Tailwind v4 | Existing, no change |
| Backend | Express.js (CommonJS) | Modular, manifest-based |
| Database | PostgreSQL 16 | Schema-per-module, RLS |
| CRM | Twenty (self-hosted) | API-first integration |
| Billing | Stripe Subscriptions | Per-module items |
| Auth | JWT + bcrypt | Tenant_id in claims |
| Context | AsyncLocalStorage | Transaction-local tenant scope |
| Cache | In-memory Map (→ Redis later) | 60s TTL for entitlements |
| Queue | EventEmitter (→ BullMQ later) | Inter-module async events |
| Deployment | Docker + Traefik | Single app + scraper + Twenty stack |
