# Twenty CRM Integration Research

**Project:** Revive SaaS Platform — Trade Services CRM
**Researched:** 2026-04-20
**Twenty Version:** Latest stable ~v1.14+ (active monthly releases; current canary is 1.22.x)
**Overall Confidence:** MEDIUM-HIGH (official docs + community verification; some API specifics LOW)

---

## 1. Installation and Deployment

### Service Architecture

Twenty's Docker Compose stack is four services:

| Service | Image | Role | Port |
|---------|-------|------|------|
| `server` | `twentycrm/twenty:<version>` | NestJS API + frontend | 3000 |
| `worker` | same image | BullMQ job processor | none |
| `db` | `postgres:16` | Primary database | 5432 |
| `redis` | `redis:7.4` | Job queue + cache | 6379 |

The server image bundles both the React frontend and the NestJS backend into a single container. There is no separate frontend container in production. The worker runs the same image but with `yarn worker:prod` as the entrypoint and `DISABLE_DB_MIGRATIONS=true` set so only one container runs migrations.

**Critical startup order:** db must pass `pg_isready` health check, then redis, then server starts and runs migrations, then worker starts only after server is healthy. Get this wrong and migrations race against worker startup.

### Minimum Resource Requirements

- **RAM:** 750 MB idle, 1-2 GB with 5+ active users. Community guides say "allocate at least 8 GB to avoid failures" — this is an overestimate for homelab but reflects bad defaults in early Docker Desktop configs. Realistic floor for a homelab is **2 GB dedicated**.
- **PostgreSQL:** Requires version 16. The old `twentycrm/twenty-postgres` image is deprecated; use `twentycrm/twenty-postgres-spilo` or plain `postgres:16`.
- **Redis:** Required since v0.30. No Redis = application will not start.

### Minimal docker-compose.yml (Traefik-ready)

```yaml
services:
  server:
    image: twentycrm/twenty:latest
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      - APP_SECRET=${APP_SECRET}
      - SERVER_URL=https://crm.revivepropertyco.au
      - NODE_PORT=3000
      - PG_DATABASE_URL=postgres://twenty:${PG_PASSWORD}@db:5432/twenty
      - REDIS_URL=redis://redis:6379
      - STORAGE_TYPE=local
      - STORAGE_LOCAL_PATH=/app/files
    volumes:
      - twenty-files:/app/files
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.twenty.rule=Host(`crm.revivepropertyco.au`)"
      - "traefik.http.routers.twenty.entrypoints=websecure"
      - "traefik.http.routers.twenty.tls.certresolver=letsencrypt"
      - "traefik.http.services.twenty.loadbalancer.server.port=3000"
    networks:
      - traefik
      - twenty-internal

  worker:
    image: twentycrm/twenty:latest
    restart: unless-stopped
    command: ["yarn", "worker:prod"]
    depends_on:
      server:
        condition: service_healthy
    environment:
      - APP_SECRET=${APP_SECRET}
      - SERVER_URL=https://crm.revivepropertyco.au
      - NODE_PORT=3000
      - PG_DATABASE_URL=postgres://twenty:${PG_PASSWORD}@db:5432/twenty
      - REDIS_URL=redis://redis:6379
      - STORAGE_TYPE=local
      - STORAGE_LOCAL_PATH=/app/files
      - DISABLE_DB_MIGRATIONS=true
      - DISABLE_CRON_JOBS_REGISTRATION=true
    volumes:
      - twenty-files:/app/files
    networks:
      - twenty-internal

  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      - POSTGRES_DB=twenty
      - POSTGRES_USER=twenty
      - POSTGRES_PASSWORD=${PG_PASSWORD}
    volumes:
      - twenty-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U twenty -d twenty"]
      interval: 5s
      timeout: 5s
      retries: 10
    networks:
      - twenty-internal

  redis:
    image: redis:7.4
    restart: unless-stopped
    command: ["redis-server", "--maxmemory-policy", "noeviction"]
    networks:
      - twenty-internal

volumes:
  twenty-db:
  twenty-files:

networks:
  traefik:
    external: true
  twenty-internal:
    driver: bridge
```

**Traefik note:** Twenty runs on port 3000. `SERVER_URL` must be set to the public HTTPS URL before first boot or the auth tokens will embed the wrong domain and all login redirects will fail. If you start with the wrong SERVER_URL, delete the db volume and restart — you cannot patch this in a running instance without also clearing the session store.

### Required Environment Variables

| Variable | Purpose | Generation |
|----------|---------|------------|
| `APP_SECRET` | Signs auth tokens | `openssl rand -base64 32` |
| `PG_DATABASE_URL` | PostgreSQL DSN | — |
| `SERVER_URL` | Public-facing URL (MUST match actual access URL) | — |
| `REDIS_URL` | Redis DSN | default: `redis://redis:6379` |
| `NODE_PORT` | Internal port | default: 3000 |

### Optional but Relevant Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `STORAGE_TYPE` | `local` or `s3` | `local` |
| `STORAGE_LOCAL_PATH` | Where files land in container | `.local-storage` |
| `DISABLE_DB_MIGRATIONS` | Skip migrations (worker only) | `false` |
| `DISABLE_CRON_JOBS_REGISTRATION` | Disable background crons (worker only) | `false` |
| `LOGIC_FUNCTION_TYPE` | `LOCAL` or `LAMBDA` — required for workflow execution | unset |
| `OPENAI_API_KEY` | For built-in AI features | optional |
| `IS_CONFIG_VARIABLES_IN_DB_ENABLED` | Allow UI-based config management | `true` |

**Password special characters:** PostgreSQL password must NOT contain special characters. This is a known Twenty limitation — the DSN parser breaks on `@`, `#`, `?`, etc. Use hex strings only: `openssl rand -hex 16`.

---

## 2. Data Model

### Standard Objects

Twenty ships with five built-in object types:

| Twenty Object | Fields | Trade Services Mapping |
|---------------|--------|----------------------|
| **People** | firstName, lastName, email, phone, city, avatarUrl, linkedinLink, jobTitle | Customer contact / Lead person |
| **Companies** | name, domainName, address, employees, linkedinLink, idealCustomerProfile | Customer company (for B2B trades) |
| **Opportunities** | name, amount, closeDate, stage (kanban), probability, company, pointOfContact | Quote / Potential job |
| **Tasks** | title, dueAt, status, assignee, linkedRecords | Follow-up tasks |
| **Notes** | body (rich text), author, linkedRecords | Site notes, job notes |

### Custom Objects for Trade Services

Standard objects cover contacts and potential revenue but not operational concepts. You will need custom objects for:

| Custom Object | Rationale | Key Fields |
|---------------|-----------|-----------|
| **ServiceJob** | A confirmed job distinct from a quote/opportunity | scheduledDate, address, serviceType, assignedTech, status (SCHEDULED/IN_PROGRESS/COMPLETE), linkedOpportunity, linkedPerson |
| **Quote** | Formal quote with line items (if Opportunities isn't granular enough) | lineItems (JSON), total, validUntil, approvedAt, linkedOpportunity |
| **HipagesLead** | Raw hipages lead before qualification | hipagesId, suburb, postcode, jobType, credits, scrapedAt, status, linkedOpportunity |
| **TechnicianDispatch** | Assignment of jobs to technicians (future) | technicianId, jobId, dispatchedAt, arrivedAt, completedAt |

Custom objects are created at runtime via Settings > Data Model or programmatically via the GraphQL Metadata API. They get their own REST and GraphQL endpoints automatically — no code changes to Twenty itself.

### Internal PostgreSQL Architecture (MEDIUM confidence)

Twenty uses multiple schemas in one PostgreSQL database:
- `core` schema — system tables (users, workspaces)
- `metadata` schema — object/field definitions
- Workspace-specific schemas — named like `workspace_<id>`, contain actual CRM records

**Do not write directly to these schemas.** The metadata schema's tables are the source of truth for the dynamic data model. Direct SQL writes will break Twenty's caching layer and cause data inconsistencies. Always use the API.

---

## 3. API Capabilities

### API Structure

Twenty exposes two API families, both available as REST and GraphQL:

| API | Path | Purpose |
|-----|------|---------|
| **Core API** | `/rest/` or `/graphql/` | CRUD on CRM records (People, Companies, custom objects) |
| **Metadata API** | `/rest/metadata/` or `/metadata/` | Schema management (create custom objects, add fields) |

### Authentication

All requests require a bearer token:

```
Authorization: Bearer <API_KEY>
```

API keys are generated in Settings > APIs & Webhooks. You can assign a role to an API key to restrict its permissions (read-only, specific objects, etc.). There is no OAuth client credentials flow for server-to-server at the API key level — API keys are the mechanism for programmatic access.

### REST API

Standard REST conventions:

```
GET    /rest/people              — list (paginated)
POST   /rest/people              — create one
GET    /rest/people/:id          — get one
PATCH  /rest/people/:id          — update one
DELETE /rest/people/:id          — delete one
POST   /rest/batch/people        — batch create (up to 60 records)
PATCH  /rest/batch/people        — batch update (up to 60 records)
DELETE /rest/batch/people        — batch delete (up to 60 records)
```

Custom objects get the same endpoints automatically using their API name (camelCase):
```
GET  /rest/serviceJobs
POST /rest/serviceJobs
```

**Rate limit:** 100 calls per minute. Batch endpoints count as 1 call regardless of record count. For migrations use batch endpoints — 60 records per call, ~100 calls/min = 6,000 records/min maximum throughput.

### GraphQL API

GraphQL endpoint: `POST /graphql`

GraphQL supports everything REST does plus:
- **Batch upserts** — create-or-update by matching on a unique field
- **Relationship traversal** in a single query (e.g., get Person with their linked Opportunities and Notes)
- Filtering, sorting, and pagination in a single query

Example: Create a Person with a linked Company in one mutation:
```graphql
mutation CreatePerson {
  createPerson(data: {
    name: { firstName: "John", lastName: "Smith" },
    email: { primaryEmail: "john@example.com" },
    phone: { primaryPhoneNumber: "0412345678", primaryPhoneCountryCode: "AU" },
    company: { connect: { id: "company-uuid-here" } }
  }) {
    id
    name { firstName lastName }
  }
}
```

### Metadata API (Schema Management)

Create custom objects programmatically via GraphQL (REST metadata endpoints are not fully built yet — **LOW confidence** on current state, verify against your deployed version):

```graphql
mutation CreateCustomObject {
  createOneObject(input: {
    nameSingular: "serviceJob",
    namePlural: "serviceJobs",
    labelSingular: "Service Job",
    labelPlural: "Service Jobs",
    icon: "IconBriefcase",
    description: "A confirmed trade service job"
  }) {
    id
    nameSingular
  }
}
```

Add fields via:
```graphql
mutation AddField {
  createOneField(input: {
    objectMetadataId: "<object-id>",
    name: "serviceType",
    label: "Service Type",
    type: SELECT,
    options: [
      { label: "Pressure Washing", value: "PRESSURE_WASHING", color: "blue" },
      { label: "Garden Maintenance", value: "GARDEN_MAINTENANCE", color: "green" }
    ],
    isNullable: true
  }) {
    id
  }
}
```

### Pagination

REST uses cursor-based pagination:
```
GET /rest/people?filter=...&orderBy=...&limit=60&startingAfter=<cursor>
```

The response includes `pageInfo.hasNextPage` and `pageInfo.endCursor`. Never use offset pagination for large imports — cursors are stable, offsets drift if records are inserted concurrently.

---

## 4. Integration Patterns

### Recommended: Sync Service (Express.js module)

Build a `twenty-sync` Express module that sits between your platform and Twenty. This service:
1. Owns the Twenty API client and API key
2. Exposes internal REST endpoints for other modules to use
3. Receives Twenty webhooks and routes events to the right module handlers
4. Handles retry logic, rate limiting, and error mapping

```
Platform Module (e.g., hipages-scraper)
    ↓ POST /internal/crm/leads
twenty-sync service
    ↓ POST /rest/batch/people  (or serviceJobs custom object)
Twenty CRM
    ↓ Webhook: person.created
twenty-sync service
    ↓ Emits internal event / updates local DB flag
Platform Module
```

### Webhook Configuration

Webhooks are configured in Settings > APIs & Webhooks > Webhooks. Enter your sync service's public URL (must be reachable from Twenty's Docker network — use Traefik hostname or internal Docker network hostname).

Payload format:
```json
{
  "event": "person.created",
  "data": {
    "id": "uuid",
    "name": { "firstName": "John", "lastName": "Smith" },
    "email": { "primaryEmail": "john@example.com" },
    "createdAt": "2025-02-10T15:30:50Z"
  },
  "timestamp": "2025-02-10T15:30:50Z"
}
```

Event naming: `<objectNameSingular>.<created|updated|deleted>`. Custom objects follow the same pattern: `serviceJob.created`, `hipagesLead.updated`.

Webhook security — verify HMAC SHA-256 signature:
```javascript
const crypto = require('crypto');

function verifyTwentyWebhook(req, secret) {
  const signature = req.headers['x-twenty-webhook-signature'];
  const timestamp = req.headers['x-twenty-webhook-timestamp'];
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}:${payload}`)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}
```

Must respond HTTP 2xx within the request timeout or Twenty logs it as a delivery failure. Retry policy is not documented — assume no automatic retries (MEDIUM confidence). Build idempotency into your handler using the webhook `timestamp` or `data.id` as a deduplication key.

### Event-Driven vs Polling

| Approach | When to Use | Notes |
|----------|-------------|-------|
| Webhooks (push) | Real-time sync when a record changes in Twenty UI | Good for: status updates, manual edits by admin in Twenty |
| Polling | Initial data load, backfill, health checks | Use batch endpoints, respect 100 req/min rate limit |
| Direct write | Platform creates a new record | Best pattern: write directly to Twenty via API, no polling needed |

For the hipages scraper module: write directly to Twenty (create a `HipagesLead` custom object record + linked `Person`) when a new lead is scraped. No polling required for the inbound direction.

### Multi-Tenant Architecture

Twenty's workspace model is single-tenant by design — one workspace per installation. For multi-tenant SaaS:

**Option A (Recommended): One Twenty instance per tenant**
- Deploy separate Docker stacks per tenant (separate DB, separate containers)
- Cleaner isolation, easier per-tenant billing, simpler data model
- More infrastructure overhead (2-4 containers per tenant)
- Feasible on homelab with 2 GB RAM floor per tenant

**Option B: Shared Twenty with workspace per tenant**
- Twenty supports multiple workspaces in one install
- Each workspace is isolated at the PostgreSQL schema level
- API keys are workspace-scoped
- Reduces infrastructure but makes data isolation harder to audit
- Risk: a bug in workspace isolation leaks data across tenants (MEDIUM confidence concern)
- Not officially validated for SaaS use — treat as experimental

**Recommendation:** Start with Option A (single instance for your own Revive Property Co. data). When onboarding the first external tenant, provision a dedicated instance. Automate provisioning via a Terraform/Ansible playbook or a simple shell script that `docker compose up` with tenant-specific env vars.

---

## 5. Data Migration

### Current Data Model Mapping

| Current Table/Type | Twenty Target | Notes |
|-------------------|---------------|-------|
| `leads` (Lead) | `People` (standard) | Map lead contact details to Person fields |
| `leads.serviceInterest` | `HipagesLead.jobType` or `Opportunity.name` | Attach to Person via relation |
| `leads.status` | Custom `LeadStatus` field on Person | Add SELECT field to People object |
| `appointments` (Appointment) | `ServiceJob` (custom object) | New custom object required |
| `tasks` (Task) | `Tasks` (standard) | Direct mapping, near 1:1 |
| `hipages_leads` | `HipagesLead` (custom object) | Linked to Person |
| `campaigns` | No direct equivalent | Use Twenty's built-in messaging workflows or defer |
| `quotes` (Quote) | `Opportunities` (standard) + `Quote` custom object | Opportunity for pipeline, custom object for line items |

### Migration Execution Order

Must follow parent-before-child dependency order:

1. **Companies** — create any company records first (likely few for residential trades)
2. **People** — migrate leads as Person records. Required fields: email (must be unique), name
3. **Opportunities** — migrate quotes, link to Person
4. **Custom objects** — provision `ServiceJob`, `HipagesLead` custom objects first, then batch import
5. **Tasks** — link to Person records by ID (must have Person IDs from step 2)
6. **Notes** — migrate lead notes as Note records linked to Person

### Migration Approach: API vs CSV

| Method | Use When | Notes |
|--------|---------|-------|
| CSV import (UI) | < 50,000 records, one-off migration | Supported in Settings > Import. Requires specific column formats |
| API batch (POST /rest/batch) | Programmatic, repeatable, > 1,000 records | 60 records/call, 100 calls/min = good throughput |
| Direct PostgreSQL | NEVER | Bypasses metadata layer, will corrupt workspace |

Recommended: write a Node.js migration script that:
1. Reads from your existing PostgreSQL tables
2. Transforms to Twenty API payload format
3. POSTs to `/rest/batch/people`, `/rest/batch/serviceJobs`, etc.
4. Tracks migration state (which IDs have been migrated, ID mapping table)
5. Stores old_id → new_twenty_id mapping for referential integrity

### CSV Format Requirements (if using UI import)

| Field Type | Required Format |
|------------|----------------|
| Email | `name@domain.com` (must be unique — duplicates cause import failure) |
| Phone | Three columns: Number, CountryCode, CallingCode |
| Date | `YYYY-MM-DD` |
| Boolean | `TRUE` or `FALSE` (uppercase) |
| SELECT fields | Use API names not display labels (e.g., `PRESSURE_WASHING` not `Pressure Washing`) |
| Relations | Use Twenty record ID of the related object |

### Known Migration Limitations

- File attachments (media_attachments on Lead) are NOT migrated via CSV or API — must re-upload manually or use a separate storage migration
- `statusHistory` (StatusChange array) has no native equivalent in Twenty — store as a Note or as a JSON custom field
- `TeleQuoteSession` has no equivalent — model as a custom object or defer
- Campaigns have no direct equivalent — Twenty has workflows/automations but not campaign blasts natively
- After migration, views, workflow automation rules, and role permissions must be recreated manually
- User assignment in tasks/opportunities requires team members to have accepted Twenty workspace invites before migration

---

## 6. Pitfalls

### Critical Pitfalls

**Pitfall 1: SERVER_URL set wrong on first boot**
What goes wrong: All auth tokens embed the wrong domain. Users get redirect loops on login. Google/Microsoft SSO callback URLs don't match.
Root cause: SERVER_URL is baked into the database during workspace initialisation.
Prevention: Set `SERVER_URL=https://your-actual-domain.com` in `.env` BEFORE running `docker compose up` the first time. If you get it wrong, the only fix is `docker compose down --volumes` (destroys all data) and starting fresh.
Detection: Login redirects to wrong URL; 401s on API calls even with valid token.

**Pitfall 2: PostgreSQL password with special characters**
What goes wrong: `password authentication failed for user "postgres"` on startup, even though the password is correct.
Root cause: Twenty uses the password in a DSN string; characters like `@`, `#`, `?`, `/` break the URL parser.
Prevention: Generate with `openssl rand -hex 16` — hex only, no special chars. Never change the password after first boot without destroying the volume.
Detection: Server fails to start; db container healthy but server not.

**Pitfall 3: Skipping upgrade versions**
What goes wrong: Database migrations fail or leave the workspace in a broken state. Blank CRM after upgrade.
Root cause: Each version runs incremental upgrade commands (`yarn command:prod upgrade-0.XX`). Skipping from v0.40 to v0.50 skips intermediate schema patches.
Prevention: Upgrade sequentially. Run `pg_dumpall` before every upgrade. The official upgrade guide lists per-version commands.
Detection: Login succeeds but workspace appears empty or certain objects are missing.

**Pitfall 4: Worker not running**
What goes wrong: Email delivery fails silently. Background syncs (Gmail, Calendar) don't trigger. Cron jobs don't fire. Webhooks aren't dispatched.
Root cause: The worker container is where BullMQ jobs execute. If it's unhealthy or misconfigured, all async operations silently queue up in Redis and never process.
Prevention: Always deploy both `server` AND `worker` containers. Monitor worker container health separately. Set `depends_on: server: condition: service_healthy` in worker config.
Detection: Emails never arrive; webhook deliveries show 0 in Twenty UI; background tasks stuck in queue.

**Pitfall 5: Writing directly to PostgreSQL schemas**
What goes wrong: Twenty's metadata cache becomes inconsistent. Custom objects disappear from the UI. GraphQL schema generation fails.
Root cause: Twenty generates its GraphQL schema dynamically from the metadata tables. Direct SQL writes bypass the cache invalidation logic.
Prevention: ALWAYS use the API. Never `INSERT` or `UPDATE` directly against workspace schemas. For bulk migration, use the batch API endpoints.
Detection: Objects appear in DB but not in UI; GraphQL introspection returns wrong schema.

### Moderate Pitfalls

**Pitfall 6: Image/file upload permission denied**
Root cause: Docker volume mounted as root; Twenty server runs as non-root user.
Prevention: `chown -R 1000:1000 /path/to/twenty-files` on host before first boot, or use named Docker volumes (avoids this entirely).

**Pitfall 7: Redis `maxmemory-policy` not set to `noeviction`**
Root cause: Default Redis policy evicts keys under memory pressure. BullMQ job queue uses Redis — evicted jobs are permanently lost.
Prevention: Always start Redis with `--maxmemory-policy noeviction`. Confirmed in Twenty's own docker-compose.yml.

**Pitfall 8: Webhooks not verified — replay attacks**
Root cause: Webhook endpoint accepts any POST without HMAC verification.
Prevention: Always validate `X-Twenty-Webhook-Signature` before processing. Reject events with timestamps older than 5 minutes.

**Pitfall 9: Metadata REST API incomplete**
Root cause: Twenty's REST metadata endpoints were not fully implemented as of mid-2025. Custom object creation requires GraphQL.
Prevention: Use GraphQL for all Metadata API calls. Don't rely on REST for schema management.
Confidence: MEDIUM — may have improved in recent releases (v1.14+). Verify in your deployed version's API playground.

**Pitfall 10: Rate limit surprise during migration**
Root cause: 100 calls/minute is per API key. A migration script that doesn't throttle will hit 429s after the first minute.
Prevention: Add a `p-limit` or `Bottleneck` throttle in your migration script: max 90 requests/min with batch of 60 = 5,400 records/min sustained.

### Minor Pitfalls

**Pitfall 11: Microsoft 365 personal accounts blocked**
`AADSTS50020` error. Personal Microsoft accounts are not supported — only organizational accounts. SSO needs business M365 licensing.

**Pitfall 12: Admin panel inaccessible**
If the first user doesn't have admin rights, run:
```sql
UPDATE core."user"
SET "canAccessFullAdminPanel" = TRUE
WHERE email = 'your@email.com';
```

**Pitfall 13: Workflow execution disabled by default**
`Logic function execution is disabled` error. Must set `LOGIC_FUNCTION_TYPE=LOCAL` to enable workflow code execution on self-hosted.

### Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Initial deployment | SERVER_URL wrong at first boot | Set correct URL in `.env` before `docker compose up` |
| Data migration | Record import order dependencies | Companies → People → Opportunities → Tasks/Notes |
| Hipages module sync | Writing to Twenty bypassing metadata layer | Use REST batch API, never direct SQL |
| Multi-tenant expansion | Workspace isolation not production-validated | Use separate instances per tenant (Option A) |
| Upgrade | Skipping semver versions | Upgrade one version at a time, backup first |
| Webhook integration | No retry guarantee | Build idempotent webhook handlers |

---

## 7. Traefik Integration Notes

Twenty is a standard single-port HTTP service (port 3000). Traefik integration uses standard Docker labels. Key points:

- Use `websecure` entrypoint with TLS cert resolver (same pattern as your existing Traefik setup for `revivepropertyco.au`)
- Set `SERVER_URL` to match the Traefik-routed domain (with `https://`)
- Traefik must forward `X-Forwarded-Proto: https` header — Twenty uses this to construct redirect URLs. If not forwarded, login redirects to HTTP and breaks.
- Add Twenty to your existing `traefik` external network in docker-compose.yml
- The worker container does NOT need Traefik labels — it has no inbound HTTP traffic

---

## Sources

- [Twenty Docker Compose Documentation](https://docs.twenty.com/developers/self-host/capabilities/docker-compose) — HIGH confidence
- [Twenty APIs Documentation](https://docs.twenty.com/developers/extend/capabilities/apis) — HIGH confidence
- [Twenty Webhooks Documentation](https://docs.twenty.com/developers/extend/capabilities/webhooks) — HIGH confidence
- [Twenty Troubleshooting Documentation](https://docs.twenty.com/developers/self-host/capabilities/troubleshooting) — HIGH confidence
- [Twenty Upgrade Guide](https://docs.twenty.com/developers/self-host/capabilities/upgrade-guide) — HIGH confidence
- [Twenty Data Migration Guide](https://docs.twenty.com/user-guide/data-migration/how-tos/migrating-from-other-crms) — HIGH confidence
- [Twenty Objects Documentation](https://docs.twenty.com/user-guide/data-model/capabilities/objects) — HIGH confidence
- [Twenty Environment Variables — DeepWiki](https://deepwiki.com/twentyhq/twenty/6.3-environment-variables-and-configuration) — MEDIUM confidence
- [Twenty GitHub Repository](https://github.com/twentyhq/twenty) — HIGH confidence (source of truth)
- [Twenty Docker Hub](https://hub.docker.com/r/twentycrm/twenty) — HIGH confidence
- [Self-Hosting Guide — selfhosting.sh](https://selfhosting.sh/apps/twenty-crm/) — MEDIUM confidence (community)
- [Comprehensive Self-Hosting Guide — Substack](https://rajeevdewangan.substack.com/p/comprehensive-guide-to-self-hosting) — MEDIUM confidence (community)
- [Twenty CRM v1.3.0/1.4.0 Release Notes](https://wz-it.com/en/blog/twenty-crm-updates-1-3-0-1-4-0/) — MEDIUM confidence
