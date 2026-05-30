# Phase 2: Twenty CRM Integration - Context

**Gathered:** 2026-04-20
**Updated:** 2026-04-21 (CRM deployed to crm.ajinsights.com.au)
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers Twenty CRM as the central data hub for the multi-tenant SaaS platform. The phase enables:

1. **Twenty CRM Deployment** - Self-hosted Twenty via Docker integrated into existing stack
2. **Custom Objects Schema** - ServiceJob, HipagesLead, Quote objects matching business domain
3. **Data Migration** - Existing leads/appointments/tasks migrated from PostgreSQL to Twenty
4. **API Integration Layer** - Service abstraction for platform ↔ Twenty communication
5. **Webhook System** - Real-time sync from Twenty to platform via verified webhooks

**Critical constraint:** Platform NEVER accesses Twenty database directly — only via API (GraphQL/REST).

</domain>

<decisions>
## Implementation Decisions

### Deployment Strategy
- **D-01:** Twenty CRM deployed at `https://crm.ajinsights.com.au` (already deployed)
- **D-02:** Uses shared `homelab_internal` network for internal communication with backend
- **D-03:** External access via Traefik on subdomain `crm.ajinsights.com.au`
- **D-04:** SERVER_URL configured as `https://crm.ajinsights.com.au`
- **D-05:** Postgres shared with platform (separate database/schema) OR dedicated Twenty database
- **D-06:** Redis for cache/jobs (if required by Twenty) deployed as service

**Rationale:** Keeps stack unified (single docker-compose), simplifies networking and backup. Existing Traefik setup handles SSL/routing.

### Data Migration Approach
- **D-07:** Phased migration with parallel sync:
  1. Deploy Twenty with empty schema
  2. Create custom objects (ServiceJob, HipagesLead, Quote)
  3. Run **one-time bulk migration** of existing data
  4. **Validation period** (1 week): platform writes to BOTH old DB and Twenty
  5. **Cutover:** Switch to Twenty-only, remove old tables
- **D-08:** Migration script idempotent (can re-run if validation fails)
- **D-09:** Tenant isolation via Twenty's workspace/org feature (one workspace per tenant)

**Rationale:** Phased approach minimizes risk. Validation period ensures data integrity before cutover. Idempotent migration supports re-tries.

### API Integration Pattern
- **D-10:** Service layer abstraction (`server/lib/twenty-client.cjs`)
  - Wraps Twenty REST/GraphQL API
  - Handles auth (API tokens per workspace/tenant)
  - Retry logic for failed requests
  - Request/response logging for debugging
- **D-11:** Platform server → Twenty via internal network (faster, more secure)
- **D-12:** Client apps NEVER call Twenty directly (always through platform backend)
- **D-13:** GraphQL preferred for reads, REST for mutations (follow Twenty's strengths)
- **D-14:** Webhook signature verification (HMAC) for incoming Twenty events

**Rationale:** Service layer isolates Twenty-specific logic. Backend proxy maintains security boundary. GraphQL reduces over-fetching for complex queries.

### Custom Objects Design
- **D-15:** Mirror existing domain model where sensible, restructure for Twenty's patterns where beneficial:
  - **ServiceJob:** Maps to existing leads/appointments (customer, service type, status)
  - **HipagesLead:** New object, extends ServiceJob with hipages-specific fields
  - **Quote:** Maps to existing quotes (line items, status, expiry)
- **D-16:** Relationships match business logic:
  - ServiceJob → Person (customer)
  - ServiceJob → Quote (one-to-many)
  - HipagesLead inherits from ServiceJob (or linked)
- **D-17:** Twenty's standard objects (Companies, People) used for customer/contact data

**Rationale:** Reuses existing domain understanding while adapting to Twenty's data model. Standard objects reduce custom work.

### Multi-Tenancy Integration
- **D-18:** Each tenant = Twenty workspace/org (or use Twenty's multi-tenancy if available)
- **D-19:** Tenant users mapped to Twenty users with role sync
- **D-20:** API tokens stored securely per tenant (encrypted at rest)
- **D-21:** Module activation checks against workspace capabilities

**Rationale:** Extends Phase 1's tenant model into Twenty. Workspace-per-tenant provides data isolation.

### Claude's Discretion
- Twenty CRM specific configuration details (env vars, docker image version)
- GraphQL schema details for custom objects (follow Twenty docs)
- Migration script implementation language (Node.js vs Python scripts)
- Exact mapping of existing tables to Twenty objects (optimize during implementation)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Twenty CRM Documentation
- `https://docs.twenty.com` — Official Twenty CRM documentation (primary reference)
- `https://docs.twenty.com/overview/introduction` — Getting started guide
- `https://docs.twenty.com/developing/overview` — Developer docs for custom objects
- `https://docs.twenty.com/developing/graphql-api` — GraphQL API reference
- `https://docs.twenty.com/developing/rest-api` — REST API reference
- `https://docs.twenty.com/self-hosting/overview` — Self-hosting deployment guide
- `https://docs.twenty.com/self-hosting/docker` — Docker deployment specifics
- `https://docs.twenty.com/webhooks/overview` — Webhook configuration and verification

### Roadmap & Requirements
- `.planning/ROADMAP.md` — Phase 2 success criteria and requirements (CRM-01 through CRM-09)
- `.planning/SAAS-PLATFORM.md` — Platform vision and architecture decisions

### Phase 1 Context
- `.planning/phases/01-platform-core-authentication/01-CONTEXT.md` — Multi-tenant foundation, auth patterns, module system

### Existing Schema (for migration planning)
- `server/migrations/001_create_customer_portal_tables.sql` — Customers, customer_documents, quote_approvals
- `server/migrations/002_create_hipages_leads_table.sql` — Hipages leads table structure
- `types.ts` — TypeScript interfaces for Lead, Appointment, Task, Quote, Campaign
- `server/api/crm.cjs` — Existing CRM API endpoints (to understand current data access patterns)
- `server/api/quotes.cjs` — Existing quotes API
- `server/api/bookings.cjs` — Existing appointments API

### Deployment Context
- `docker-compose.yml` — Current stack (app, backend, hipages-scraper) — Twenty service added here
- `.env` — Environment variables pattern (DATABASE_URL, JWT_SECRET, etc.)

No additional external specs — Twenty CRM documentation is authoritative.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Database helpers** (`server/lib/database.cjs`) — PostgreSQL connection pool, used for migration script
- **Auth middleware** (`server/lib/auth-platform.cjs`) — JWT verification, can be adapted for Twenty token management
- **API client patterns** — Existing fetch wrappers in crm.cjs, quotes.cjs
- **TypeScript types** (`types.ts`) — Lead, Appointment, Task, Quote interfaces — map to Twenty custom objects

### Established Patterns
- **Service layer pattern:** `server/lib/` for shared utilities
- **API routing:** Express routes in `server/api/` with auth middleware
- **Error handling:** Consistent JSON responses with success/error structure
- **Multi-tenant context:** `server/lib/tenant-context.cjs` — getTenantId() for request-scoped tenant

### Integration Points
- **docker-compose.yml:** Add twenty-web, twenty-worker, twenty-db (if separate) services
- **Traefik routing:** Add Twenty subdomain or path-based routing
- **Express app:** `/api/twenty/*` routes for webhook receiver, sync proxy
- **Types:** Add Twenty-specific types to `types.ts` (TwentyObject, TwentyWebhook, etc.)

### New Components Needed
- `server/lib/twenty-client.cjs` — Twenty API wrapper (GraphQL query builder, REST client)
- `server/migrations/005_migrate_to_twenty.sql` — Backup old tables before cutover (rollback path)
- `services/twenty-migrate/` — One-time migration script (bulk export from old DB, import to Twenty)
- `server/api/twenty-webhooks.cjs` — Webhook receiver with HMAC verification
- Migration dashboard page (admin only) — Progress tracking, validation results

</code_context>

<specifics>
## Specific Ideas

### Docker Compose Structure (Recommended)
```yaml
services:
  # ... existing services ...

  twenty-db:
    image: postgres:15
    environment:
      POSTGRES_DB: twenty_crms
      POSTGRES_USER: twenty
      POSTGRES_PASSWORD: ${TWENTY_DB_PASSWORD}
    volumes:
      - twenty-data:/var/lib/postgresql/data

  twenty-redis:
    image: redis:7-alpine
    volumes:
      - twenty-redis:/data

  twenty-web:
    image: twentycrm/twenty:latest
    environment:
      SERVER_URL: https://crm.ajinsights.com.au
      PG_DATABASE_URL: postgresql://twenty:${TWENTY_DB_PASSWORD}@twenty-db:5432/twenty_crms
      REDIS_HOST: twenty-redis
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.twenty.rule=Host(`crm.ajinsights.com.au`)"

  twenty-worker:
    image: twentycrm/twenty:latest
    command: worker
    environment:
      # Same as twenty-web
```

### Custom Object Schema Outline
Based on existing types.ts:
- **ServiceJob:** { id, title, description, status (NEW, CONTACTED, BOOKED, ARCHIVED), serviceType, personId (customer), createdAt }
- **HipagesLead:** extends ServiceJob with { sourceUrl, postedDate, scrapedAt, hipagesStatus }
- **Quote:** { id, serviceJobId, status (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED), totalAmount, expiryDate, lineItems }

### Migration Flow
1. Export existing data from PostgreSQL (leads, appointments, tasks, quotes)
2. Transform to Twenty's expected format (map field names, handle relationships)
3. Create Twenty objects via bulk API (GraphQL mutations)
4. Verify: count matches, sample record validation
5. Enable dual-write mode (platform writes to both DBs)
6. Monitor for discrepancies (1 week)
7. Cutover: disable old DB writes, remove old tables after 30-day retention

### Webhook Handling
Platform exposes `/api/twenty/webhooks` endpoint:
- Verify HMAC signature using Twenty signing secret
- Parse event type (object.created, object.updated, object.deleted)
- Update platform cache/state (don't duplicate storage — Twenty is source of truth)
- Return 200 OK quickly (queue processing if heavy)

</specifics>

<deferred>
## Deferred Ideas

### Phase 3+ Considerations
- Hipages Leads Module will write directly to Twenty's HipagesLead object
- AI Quotes Module will generate quotes in Twenty
- Real-time sync performance optimization (eventual consistency vs immediate)

### Future Enhancements
- Two-way sync (Platform → Twenty and Twenty → Platform)
- Advanced Twenty features (workflows, automation rules)
- Multi-language support if Twenty offers it
- Advanced reporting using Twenty's query capabilities

### Technical Debt for Future Phases
- Consider dedicated Twenty database (vs shared) for backup/recovery independence
- Implement retry queue for failed API calls to Twenty
- Add metrics/monitoring for API latency and error rates
- Consider caching layer for frequently accessed Twenty data

</deferred>

---

*Phase: 02-twenty-crm-integration*
*Context gathered: 2026-04-20*
