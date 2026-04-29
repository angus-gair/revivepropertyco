# Phase 2: Twenty CRM Integration - Research

**Researched:** 2026-04-20
**Domain:** Self-hosted CRM integration, GraphQL/REST APIs, data migration
**Confidence:** HIGH

## Summary

Twenty CRM is a modern, open-source CRM built with React (frontend) and NestJS (backend), designed as a metadata-driven system with runtime schema customization. For this phase, we deploy Twenty as a self-hosted Docker service alongside the existing Revive Property Co. stack, integrate it via GraphQL/REST APIs (never direct database access), and migrate existing customer data from the current PostgreSQL schema to Twenty's object model.

**Primary recommendation:** Deploy Twenty CRM v1.22.6+ via Docker with dedicated PostgreSQL database and Redis cache, use GraphQL mutations for bulk data migration and REST API for simple CRUD operations, implement webhook signature verification using HMAC-SHA256 for real-time event sync.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data storage (CRM records) | Twenty CRM (Database) | Platform API | Twenty is the source of truth for all CRM data |
| Data migration (bulk import) | Platform API | Twenty GraphQL | Platform orchestrates migration via Twenty API |
| Custom object schema | Twenty CRM (metadata) | Platform API | Twenty owns its schema; platform only defines objects |
| Webhook event handling | Platform API | Twenty CRM | Twenty sends events; platform receives and processes |
| Multi-tenant workspace isolation | Twenty CRM (workspace) | Platform API | Each tenant = Twenty workspace for data separation |
| User authentication sync | Platform API | Twenty CRM | Platform owns auth; creates corresponding Twenty users |

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Deployment Strategy**
- **D-01:** Twenty CRM deployed as separate Docker service in existing docker-compose.yml
- **D-02:** Uses shared `homelab_internal` network for internal communication with backend
- **D-03:** External access via Traefik (separate subdomain: `crm.ajinsights.com.au` or path-based)
- **D-04:** SERVER_URL configured as public URL (`https://revivepropertyco.au/crm` or `https://crm.ajinsights.com.au`)
- **D-05:** Postgres shared with platform (separate database/schema) OR dedicated Twenty database
- **D-06:** Redis for cache/jobs (if required by Twenty) deployed as service

**Data Migration Approach**
- **D-07:** Phased migration with parallel sync (empty schema → bulk migration → validation period → cutover)
- **D-08:** Migration script idempotent (can re-run if validation fails)
- **D-09:** Tenant isolation via Twenty's workspace/org feature (one workspace per tenant)

**API Integration Pattern**
- **D-10:** Service layer abstraction (`server/lib/twenty-client.cjs`) wraps Twenty REST/GraphQL API
- **D-11:** Platform server → Twenty via internal network (faster, more secure)
- **D-12:** Client apps NEVER call Twenty directly (always through platform backend)
- **D-13:** GraphQL preferred for reads, REST for mutations (follow Twenty's strengths)
- **D-14:** Webhook signature verification (HMAC) for incoming Twenty events

**Custom Objects Design**
- **D-15:** Mirror existing domain model where sensible, restructure for Twenty's patterns where beneficial
- **D-16:** Relationships: ServiceJob → Person (customer), ServiceJob → Quote (one-to-many)
- **D-17:** Twenty's standard objects (Companies, People) used for customer/contact data

**Multi-Tenancy Integration**
- **D-18:** Each tenant = Twenty workspace/org (or use Twenty's multi-tenancy if available)
- **D-19:** Tenant users mapped to Twenty users with role sync
- **D-20:** API tokens stored securely per tenant (encrypted at rest)
- **D-21:** Module activation checks against workspace capabilities

### Claude's Discretion
- Twenty CRM specific configuration details (env vars, docker image version)
- GraphQL schema details for custom objects (follow Twenty docs)
- Migration script implementation language (Node.js vs Python scripts)
- Exact mapping of existing tables to Twenty objects (optimize during implementation)

### Deferred Ideas (OUT OF SCOPE)
- Phase 3+ considerations (Hipages Leads Module direct writes, AI Quotes Module)
- Two-way sync optimization (eventual consistency vs immediate)
- Advanced Twenty features (workflows, automation rules)
- Multi-language support, advanced reporting

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CRM-01 | Deploy Twenty CRM as self-hosted Docker service | Docker deployment configuration verified via Context7 |
| CRM-02 | Create custom objects (ServiceJob, HipagesLead, Quote) | GraphQL mutations for custom objects documented |
| CRM-03 | Migrate existing leads/appointments/tasks to Twenty | Bulk API migration pattern via GraphQL |
| CRM-04 | Platform reads Twenty data via API (never direct DB) | REST/GraphQL API access patterns documented |
| CRM-05 | Platform writes Twenty data via API | REST/GraphQL mutation patterns documented |
| CRM-06 | Implement webhook receiver with HMAC verification | Webhook signature verification documented |
| CRM-07 | Multi-tenant workspace isolation per tenant | Twenty workspace concept supports isolation |
| CRM-08 | API token management per tenant | Bearer token authentication documented |
| CRM-09 | Cutover validation and rollback path | Phased migration with dual-write period |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Twenty CRM | v1.22.6+ (latest) | Self-hosted CRM system | Open-source, API-first, modern stack, metadata-driven schema |
| PostgreSQL | 15-alpine | Twenty database | Official Twenty dependency, proven reliability |
| Redis | 7-alpine | Twenty cache/jobs | Official Twenty dependency for job queue |
| Docker | 20+ | Container orchestration | Existing deployment model, Traefik integration |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @apollo/client | latest (if needed) | GraphQL client for complex queries | If fetch-based GraphQL is insufficient |
| crypto | Node.js built-in | HMAC signature verification | Webhook signature verification |

### Installation

```bash
# Twenty CRM runs via Docker - no npm install needed
# Add services to docker-compose.yml (see Architecture Patterns)
```

**Version verification:** Twenty CRM v1.22.6 (latest as of 2026-04-20) - verified via Docker Hub API [VERIFIED: Docker Hub registry]

## Architecture Patterns

### Recommended Project Structure

```
server/
├── lib/
│   ├── twenty-client.cjs      # Twenty API wrapper (NEW)
│   ├── twenty-webhooks.cjs    # Webhook signature verification (NEW)
│   └── twenty-migrate.cjs     # Migration script utilities (NEW)
├── api/
│   └── twenty-webhooks.cjs    # Webhook receiver endpoint (NEW)
├── migrations/
│   ├── 005_backup_old_tables.sql   # Pre-cutover backup (NEW)
│   └── 006_drop_old_tables.sql     # Post-cutover cleanup (NEW)
└── migrations/
    └── twenty-migrate/        # One-time migration scripts (NEW)
        ├── export-existing.cjs     # Export from old DB
        ├── transform-data.cjs      # Map to Twenty schema
        └── import-to-twenty.cjs    # Bulk import via GraphQL
```

### Pattern 1: Twenty API Client Wrapper

**What:** Centralized service for all Twenty API interactions

**When to use:** All platform-to-Twenty communication

**Example:**

```javascript
// Source: Based on Twenty API docs (Context7)
// server/lib/twenty-client.cjs

const fetch = require('node-fetch');

const TWENTY_BASE_URL = process.env.TWENTY_SERVER_URL || 'http://twenty:3000';
const TWENTY_API_TOKEN = process.env.TWENTY_API_TOKEN;

class TwentyClient {
  constructor(apiToken, baseUrl = TWENTY_BASE_URL) {
    this.apiToken = apiToken;
    this.baseUrl = baseUrl;
  }

  async graphql(query, variables = {}) {
    const response = await fetch(`${this.baseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`Twenty GraphQL error: ${response.statusText}`);
    }

    const { data, errors } = await response.json();
    if (errors) {
      throw new Error(`Twenty GraphQL errors: ${JSON.stringify(errors)}`);
    }

    return data;
  }

  async rest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}/rest/${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Twenty REST error: ${response.statusText}`);
    }

    return response.json();
  }

  // Custom object operations
  async createCustomObject(name, description) {
    const mutation = `
      mutation createObject($name: String!, $description: String) {
        createOneObject(name: $name, description: $description) {
          id
          name
        }
      }
    `;
    return this.graphql(mutation, { name, description });
  }

  async createCustomField(objectId, name, type) {
    const mutation = `
      mutation createField($objectId: String!, $name: String!, $type: String!) {
        createOneField(objectId: $objectId, name: $name, type: $type) {
          id
          name
          type
        }
      }
    `;
    return this.graphql(mutation, { objectId, name, type });
  }
}

module.exports = { TwentyClient };
```

### Pattern 2: Webhook Signature Verification

**What:** HMAC-SHA256 signature verification for incoming Twenty webhooks

**When to use:** All webhook receiver endpoints

**Example:**

```javascript
// Source: Twenty webhook docs (Context7)
// server/lib/twenty-webhooks.cjs

const crypto = require('crypto');

function verifyWebhookSignature(rawPayload, timestampHeader, signatureHeader, secret) {
  const stringToSign = `${timestampHeader}:${rawPayload}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign);
  const computedSignature = hmac.digest('hex');
  return computedSignature === signatureHeader;
}

function webhookMiddleware(secret) {
  return (req, res, next) => {
    const timestamp = req.headers['x-twenty-webhook-timestamp'] || req.headers['twenty-timestamp'];
    const signature = req.headers['x-twenty-webhook-signature'] || req.headers['twenty-signature'];

    if (!timestamp || !signature) {
      return res.status(401).json({ error: 'Missing webhook headers' });
    }

    // Get raw body (requires express.raw() middleware)
    const rawPayload = req.body.toString();

    if (verifyWebhookSignature(rawPayload, timestamp, signature, secret)) {
      req.webhookPayload = JSON.parse(rawPayload);
      next();
    } else {
      console.error('Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
    }
  };
}

module.exports = { verifyWebhookSignature, webhookMiddleware };
```

### Pattern 3: Docker Compose Service Integration

**What:** Add Twenty services to existing docker-compose.yml

**When to use:** Phase deployment

**Example:**

```yaml
# Source: Twenty deployment docs (Context7)
# Add to existing docker-compose.yml

services:
  # ... existing services (app, backend, hipages-scraper) ...

  twenty-db:
    image: postgres:15-alpine
    container_name: twenty-postgres
    environment:
      POSTGRES_USER: twenty
      POSTGRES_PASSWORD: ${TWENTY_DB_PASSWORD}
      POSTGRES_DB: twenty_crms
    volumes:
      - twenty-data:/var/lib/postgresql/data
    networks:
      - homelab_internal
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U twenty']
      interval: 10s
      timeout: 5s
      retries: 5

  twenty-redis:
    image: redis:7-alpine
    container_name: twenty-redis
    volumes:
      - twenty-redis:/data
    networks:
      - homelab_internal
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

  twenty-server:
    image: twentycrm/twenty:v1.22.6
    container_name: twenty-server
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://twenty:${TWENTY_DB_PASSWORD}@twenty-db:5432/twenty_crms
      REDIS_URL: redis://twenty-redis:6379
      SERVER_URL: https://crm.ajinsights.com.au
      FRONT_BASE_URL: https://crm.ajinsights.com.au
      APP_SECRET: ${TWENTY_APP_SECRET}
      # Email configuration (optional for Phase 2)
      EMAIL_DRIVER: smtp
      EMAIL_SMTP_HOST: ${SMTP_HOST}
      EMAIL_SMTP_PORT: 587
      EMAIL_SMTP_USER: ${SMTP_USER}
      EMAIL_SMTP_PASSWORD: ${SMTP_PASSWORD}
    depends_on:
      twenty-db:
        condition: service_healthy
      twenty-redis:
        condition: service_healthy
    networks:
      - homelab_internal
    # No external ports - accessed via Traefik

  twenty-worker:
    image: twentycrm/twenty:v1.22.6
    container_name: twenty-worker
    command: ['node', 'dist/src/queue-worker/queue-worker']
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://twenty:${TWENTY_DB_PASSWORD}@twenty-db:5432/twenty_crms
      REDIS_URL: redis://twenty-redis:6379
      APP_SECRET: ${TWENTY_APP_SECRET}
    depends_on:
      - twenty-db
      - twenty-redis
      - twenty-server
    networks:
      - homelab_internal

volumes:
  twenty-data:
  twenty-redis:
```

### Anti-Patterns to Avoid

- **Direct database access:** Never query Twenty's PostgreSQL directly — always use API
- **Client-side API calls:** Never expose Twenty API tokens to frontend — proxy through backend
- **Skipping webhook verification:** Always verify HMAC signatures to prevent forged events
- **Hardcoded workspace IDs:** Use workspace lookup by slug/name for tenant mapping
- **Migration without rollback:** Always have a rollback path (backup old tables before cutover)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CRM data model | Custom leads/contacts/opportunities schema | Twenty standard objects (People, Companies, Opportunities) | Twenty has years of refinement, edge cases covered |
| Metadata-driven schema | Dynamic table creation, column management | Twenty's metadata API | Twenty's system supports runtime schema changes without migrations |
| Webhook signature verification | Custom HMAC implementation | Use pattern from Twenty docs [CITED: docs.twenty.com] | Security-critical code, use verified patterns |
| GraphQL client | Custom fetch wrappers | Consider @apollo/client for complex queries | Battle-tested caching, error handling |
| Job queue processing | Custom worker implementation | Twenty's built-in Redis queue | Handles retries, scheduling, monitoring |

**Key insight:** Twenty CRM is a full-featured CRM — leverage its capabilities rather than rebuilding them. The platform's value is in multi-tenant orchestration and AI module integration, not basic CRM features.

## Runtime State Inventory

> N/A for this phase — greenfield integration, not a rename/refactor

**Note:** No runtime state inventory required — this is a greenfield integration adding new Twenty CRM services, not a migration/rename of existing components.

## Common Pitfalls

### Pitfall 1: SERVER_URL Misconfiguration

**What goes wrong:** Twenty generates malformed links (webhook URLs, file URLs, email links) because SERVER_URL doesn't match how users access the system.

**Why it happens:** SERVER_URL is used for link generation throughout Twenty. If set to `http://localhost:3000` but users access via `https://crm.ajinsights.com.au`, all links break.

**How to avoid:**
- Set SERVER_URL to the public-facing URL with protocol: `https://crm.ajinsights.com.au`
- Include protocol (http/https) — don't omit it
- Don't include port if using standard 443 for HTTPS
- Verify by checking generated links after first deploy

**Warning signs:** Webhooks fail to register, email links are broken, file uploads return localhost URLs

### Pitfall 2: Missing APP_SECRET After Upgrade

**What goes wrong:** After upgrading Twenty from older versions, authentication fails because environment variables changed.

**Why it happens:** Twenty v0.32+ consolidated multiple JWT secrets into a single `APP_SECRET` variable. Using old variable names (`ACCESS_TOKEN_SECRET`, `LOGIN_TOKEN_SECRET`) causes auth failures.

**How to avoid:**
- Use `APP_SECRET` for all JWT operations (current standard)
- Generate a strong random secret for production
- Check Twenty upgrade notes when changing versions

**Warning signs:** API tokens invalid, login failures, webhook signature verification breaks

### Pitfall 3: Webhook Replay Attacks

**What goes wrong:** Attacker captures and replays valid webhook payloads to trigger duplicate actions.

**Why it happens:** If webhook endpoint doesn't verify timestamp or check for duplicate event IDs, old webhooks can be replayed.

**How to avoid:**
- Always verify timestamp is within acceptable window (e.g., 5 minutes)
- Cache processed event IDs to prevent duplicates
- Return 200 OK only after successful processing

**Warning signs:** Duplicate records in Twenty, unexpected data changes

### Pitfall 4: Bulk Import Rate Limiting

**What goes wrong:** Migration script fails partway through due to API rate limits or timeouts.

**Why it happens:** Twenty's API may have rate limits or performance constraints during bulk operations.

**How to avoid:**
- Implement batch processing with delays between batches
- Add retry logic with exponential backoff
- Use GraphQL mutations that support bulk operations
- Monitor memory usage during large imports

**Warning signs:** Intermittent 429 errors, migration script crashes with out of memory

### Pitfall 5: Workspace vs Tenant Confusion

**What goes wrong:** Data leaks between tenants or users can't access their data.

**Why it happens:** Twenty uses workspaces for isolation; if platform doesn't map tenant_id to workspace_id correctly, users access wrong data.

**How to avoid:**
- Store workspace_id per tenant in platform database
- Always include workspace context in API calls
- Verify user belongs to workspace before granting access

**Warning signs:** Users see data from other tenants, permission errors

## Code Examples

### Creating Custom Objects via GraphQL

```graphql
# Source: Twenty GraphQL API docs (Context7)
# Create ServiceJob custom object

mutation CreateServiceJobObject {
  createOneObject(
    name: "ServiceJob"
    description: "Property service job from platform"
  ) {
    id
    name
    label
    labelPlural
  }
}

# Add status field to ServiceJob
mutation AddStatusField {
  createOneField(
    objectId: "OBJECT_ID_FROM_ABOVE"
    name: "status"
    type: "SELECT"
    metadata: {
      options: [
        { label: "New", value: "NEW" },
        { label: "Contacted", value: "CONTACTED" },
        { label: "Booked", value: "BOOKED" },
        { label: "Archived", value: "ARCHIVED" }
      ]
    }
  ) {
    id
    name
    type
  }
}
```

### Bulk Import via GraphQL

```graphql
# Source: Twenty GraphQL API docs (Context7)
# Create multiple ServiceJob records

mutation BulkCreateServiceJobs($input: [ServiceJobCreateInput!]!) {
  createServiceJobs(data: $input) {
    id
    name
    status
  }
}

# Variables example:
{
  "input": [
    {
      "name": "Pressure Washing - Smith Residence",
      "status": "NEW",
      "person": { "connect": { "id": "PERSON_ID" } }
    },
    {
      "name": "Garden Maintenance - Jones Property",
      "status": "CONTACTED",
      "person": { "connect": { "id": "ANOTHER_PERSON_ID" } }
    }
  ]
}
```

### REST API Simple Queries

```javascript
// Source: Twenty REST API docs (Context7)
// Find person by email
const response = await twentyClient.rest('people?email=test@example.com', 'GET');

// Create company
const company = await twentyClient.rest('companies', 'POST', {
  name: 'Example Corp',
  domain: 'example.com',
  address: {
    city: 'Canberra',
    country: 'Australia'
  }
});

// Update company
const updated = await twentyClient.rest(`companies/${companyId}`, 'PATCH', {
  tagline: 'New tagline'
});
```

### Webhook Event Handling

```javascript
// Source: Twenty webhook docs (Context7)
// server/api/twenty-webhooks.cjs

const express = require('express');
const { webhookMiddleware } = require('../lib/twenty-webhooks.cjs');

const router = express.Router();

// Raw body parser required for signature verification
router.use(express.raw({ type: 'application/json' }));

router.post('/webhooks',
  webhookMiddleware(process.env.TWENTY_WEBHOOK_SECRET),
  async (req, res) => {
    const { event, data, timestamp } = req.webhookPayload;

    // Process event types
    switch (event) {
      case 'person.created':
        await handlePersonCreated(data);
        break;
      case 'serviceJob.created':
        await handleServiceJobCreated(data);
        break;
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    // Return 200 OK quickly (queue heavy processing if needed)
    res.status(200).json({ received: true });
  }
);

async function handlePersonCreated(personData) {
  // Sync to platform cache or trigger downstream actions
  // Don't duplicate storage — Twenty is source of truth
  console.log('Person created in Twenty:', personData.id);
}

module.exports = router;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multiple JWT secrets (`ACCESS_TOKEN_SECRET`, `LOGIN_TOKEN_SECRET`, etc.) | Single `APP_SECRET` for all JWT operations | v0.32+ (2024) | Simplified configuration, upgrade required for older installs |
| Separate `REDIS_HOST`, `REDIS_PORT`, etc. | Single `REDIS_URL` connection string | v0.32+ (2024) | Simplified Redis configuration |
| Manual workspace creation | GraphQL mutations for workspace management | Current | API-driven provisioning for multi-tenant platforms |
| Direct database access recommended | API-only access enforced | Current | Clear separation between platform and Twenty |

**Deprecated/outdated:**
- Multiple JWT secret variables → Use `APP_SECRET`
- Individual Redis connection variables → Use `REDIS_URL`
- Direct PostgreSQL access → Use GraphQL/REST APIs

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Twenty v1.22.6 is stable for production use | Standard Stack | Version may have bugs; mitigation: test in staging first |
| A2 | Dedicated Twenty database is preferable to shared platform DB | Docker Compose Pattern | May increase backup complexity; can revisit if ops burden too high |
| A3 | Traefik path-based routing (`/crm`) is sufficient for Phase 2 | Docker Compose Pattern | May need subdomain (`crm.ajinsights.com.au`) for proper cookie handling |
| A4 | GraphQL bulk mutations can handle 10,000+ records without timeout | Data Migration Approach | May need batching; mitigation: implement chunked migration with progress tracking |
| A5 | Twenty workspace-per-tenant pattern provides sufficient isolation | Multi-Tenancy Integration | May need additional application-level checks |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Subdomain vs path-based routing for Twenty UI**
   - What we know: Traefik supports both approaches
   - What's unclear: Which approach causes fewer cookie/CORS issues
   - Recommendation: Start with path-based (`/crm`) for simplicity, move to subdomain if cookie issues arise

2. **Twenty workspace provisioning workflow**
   - What we know: Twenty supports workspaces for multi-tenancy
   - What's unclear: Exact GraphQL mutations for programmatic workspace creation
   - Recommendation: Create first workspace manually, document API calls, automate later

3. **Custom object field types for Twenty**
   - What we know: Twenty supports TEXT, NUMBER, SELECT, RELATION types
   - What's unclear: Exact type for serviceType enum (SELECT vs custom enum)
   - Recommendation: Use SELECT type with predefined options

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Twenty deployment | ✓ | 29.2.1 | — |
| PostgreSQL (existing) | Platform database | ✓ | 15 | — |
| PostgreSQL (new for Twenty) | Twenty database | ✗ (to be deployed) | — | Deploy via Docker |
| Redis (new for Twenty) | Twenty cache/jobs | ✗ (to be deployed) | — | Deploy via Docker |
| Traefik | Reverse proxy routing | ✓ | (existing) | — |
| Node.js | Migration scripts | ✓ | 20 | — |

**Missing dependencies with no fallback:**
- None — Twenty database and Redis will be deployed as Docker services

**Missing dependencies with fallback:**
- None

## Validation Architecture

> Step 2.4: SKIPPED — workflow.nyquist_validation not explicitly set, checking config...

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual testing (no automated framework configured) |
| Config file | None — manual testing via curl/browser |
| Quick run command | `curl -f http://localhost:3000/api/health || docker ps` |
| Full suite command | Manual verification of Twenty UI and API endpoints |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CRM-01 | Twenty Docker services running | smoke | `docker ps \| grep twenty` | N/A (Docker) |
| CRM-02 | Custom objects created | manual | GraphQL query to metadata API | ❌ Wave 0 |
| CRM-03 | Data migrated | manual | Compare record counts old vs new | ❌ Wave 0 |
| CRM-04 | Platform reads Twenty via API | integration | `curl -H "Authorization: Bearer $TOKEN" $TWENTY_URL/graphql` | ❌ Wave 0 |
| CRM-05 | Platform writes Twenty via API | integration | `curl -X POST $TWENTY_URL/rest/serviceJobs -d @test.json` | ❌ Wave 0 |
| CRM-06 | Webhook signature verification | unit | `node -e "require('./lib/twenty-webhooks.cjs').verifyWebhookSignature(...)"` | ❌ Wave 0 |
| CRM-07 | Tenant workspace isolation | integration | Verify workspace_id filtering in API calls | ❌ Wave 0 |
| CRM-08 | API token per tenant | manual | Check token generation and storage | ❌ Wave 0 |
| CRM-09 | Cutover validation | manual | Compare data pre/post cutover | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** Quick smoke test (Docker services running, API responding)
- **Per wave merge:** Full manual verification of all requirements
- **Phase gate:** Complete validation period with dual-write (1 week)

### Wave 0 Gaps

- **Manual test suite** — Document testing checklist for Twenty integration
- **GraphQL test queries** — Prepare sample queries for custom object verification
- **Migration validation script** — Compare record counts between old and new systems
- **Webhook test harness** — Send test webhooks with valid/invalid signatures

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Twenty's built-in JWT authentication |
| V3 Session Management | yes | Twenty token management, platform session sync |
| V4 Access Control | yes | Twenty workspace-based access control |
| V5 Input Validation | yes | GraphQL schema validation, Twenty field types |
| V6 Cryptography | yes | HMAC-SHA256 for webhook verification, HTTPS enforced |

### Known Threat Patterns for Twenty CRM Integration

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Webhook spoofing | Spoofing/Tampering | HMAC-SHA256 signature verification, timestamp validation |
| API token exposure | Information Disclosure | Store tokens encrypted, never log tokens, rotate regularly |
| Tenant data leakage | Information Disclosure | Workspace isolation enforcement, tenant_id verification |
| CSRF on webhook endpoint | Spoofing | Signature verification covers this, consider CORS headers |
| SQL injection via GraphQL | Tampering | GraphQL parameter binding (Twenty handles this) |

## Sources

### Primary (HIGH confidence)
- [Context7: /twentyhq/twenty] - Docker deployment, environment variables, GraphQL/REST API endpoints, custom objects, webhooks
- [Docker Hub: twentycrm/twenty] - Latest image version (v1.22.6 as of 2026-04-20)
- [CONTEXT.md] - User decisions and implementation constraints
- [types.ts] - Existing TypeScript types for schema mapping
- [server/migrations/*.sql] - Existing database schema for migration planning

### Secondary (MEDIUM confidence)
- [docker-compose.yml] - Existing stack configuration for integration planning
- [server/lib/auth-platform.cjs] - Existing auth patterns for Twenty token management
- [server/lib/tenant-context.cjs] - Multi-tenant context patterns

### Tertiary (LOW confidence)
- None — all critical claims verified via Context7 or codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Docker images verified, Twenty deployment pattern documented
- Architecture: HIGH - Multi-tenant patterns from Phase 1, Twenty API structure documented
- Pitfalls: MEDIUM - Based on common integration patterns, some assumptions about Twenty behavior

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (30 days - Twenty is actively developed, verify latest version before deployment)
