---
phase: 03-hipages-leads-module
created: 2026-04-21
updated: 2026-04-21
status: planning
---

# Phase 3: Hipages Leads Module - Context

## Objective

Transform the existing hipages.com.au scraper into a modular, multi-tenant module that:
1. Runs as a separate Docker container
2. Scrapes hipages.com.au for trade service leads
3. Syncs scraped leads to Twenty CRM as HipagesLead custom objects
4. Only activates for tenants with configured hipages credentials
5. Provides admin UI for viewing and managing scraped leads

## Current State

### Existing Hipages Scraper

The project has a working hipages scraper at `services/hipages-scraper/`:

- **scraper.js** - Playwright-based scraper that:
  - Logs into hipages.com.au with credentials
  - Scrapes /leads and /jobs pages
  - Parses lead data (customer name, suburb, job type, description, credits, status)
  - Saves to platform `hipages_leads` table

- **db-writer.js** - Database writer that:
  - Generates composite hipages_id for deduplication
  - Normalizes status (Available, First to accept, Waitlist)
  - Parses posted_date to TIMESTAMP
  - Upserts to hipages_leads table
  - Emits PostgreSQL NOTIFY for real-time updates

- **scheduler.js** - Cron scheduler that:
  - Runs every 6 hours (configurable)
  - Acquires file-based lock to prevent concurrent runs
  - Calls runScrape() on schedule
  - Handles graceful shutdown

- **Dockerfile** - Alpine-based container with Node.js and Playwright

### Existing Platform Integration

The platform has API endpoints at `server/api/hipages.cjs`:

- GET `/api/hipages/debug` - Debug endpoint (no auth)
- GET `/api/hipages/test` - Test endpoint (no auth)
- GET `/api/hipages/image` - Proxy hipages images to bypass CORS
- GET `/api/hipages/noauth/leads` - Public leads endpoint (no auth)
- GET `/api/hipages/leads` - Authenticated leads with pagination
- GET `/api/hipages/leads/:id` - Get single lead
- POST `/api/hipages/leads/:id/accept` - Convert hipages lead to CRM lead
- POST `/api/hipages/scrape/trigger` - Manual scrape trigger (stub)

### Database Schema

The `hipages_leads` table (migration 002):

```sql
CREATE TABLE hipages_leads (
  lead_id UUID PRIMARY KEY,
  hipages_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  suburb TEXT NOT NULL,
  postcode TEXT,
  job_type TEXT NOT NULL,
  job_subtype TEXT,
  description TEXT,
  credits INTEGER NOT NULL,
  status TEXT CHECK (status IN ('AVAILABLE', 'FIRST_TO_ACCEPT', 'WAITLIST', 'ACCEPTED', 'EXPIRED')),
  contact_status TEXT,
  posted_date TIMESTAMP,
  scraped_at TIMESTAMP NOT NULL,
  synced_to_crm BOOLEAN DEFAULT FALSE,
  crm_lead_id TEXT REFERENCES leads(id),
  raw_data JSONB
);
```

## Phase 2 Deliverables Available

From Phase 2 (Twenty CRM Integration), we have:

1. **Twenty Client** (`server/lib/twenty-client.cjs`)
   - GraphQL and REST API wrapper
   - Retry with exponential backoff
   - Person and ServiceJob creation

2. **Webhook Receiver** (`server/api/twenty-webhooks.cjs`)
   - HMAC-SHA256 signature verification
   - Event logging to twenty_webhook_events table
   - Handlers for person, ServiceJob events

3. **Token Storage** (`server/lib/twenty-token-storage.cjs`)
   - Encrypted token storage per tenant
   - AES-256-GCM encryption

4. **Migration Scripts** (`services/twenty-migrate/`)
   - Export, transform, import pipeline
   - Batching with rate limiting

## Key Decisions from Phase 2

- **D-01**: Dedicated Twenty database (not shared)
- **D-04**: Twenty API accessible on internal network only
- **D-09**: One workspace per tenant
- **D-14**: Webhook signature verification (HMAC)
- **D-15**: Mirror existing domain model where sensible
- **D-20**: API tokens stored per tenant with encryption

## Design Goals for Phase 3

### Multi-Tenancy

1. Each tenant has their own hipages credentials
2. Scraper runs per-tenant (or shared with tenant context switching)
3. Leads are synced to tenant's Twenty workspace
4. Module only visible/enabled for tenants with hipages credentials

### Modular Architecture

1. Hipages module has manifest (`hipages-module.json`)
2. Module registers with platform at startup
3. requireModule('hipages') middleware checks tenant access
4. Module can be enabled/disabled per tenant

### Twenty Integration

1. Scraper creates Person + HipagesLead in Twenty
2. Webhook updates from Twenty reflect back to platform
3. Dual-write phase: both platform DB and Twenty (for validation)
4. Eventually: Twenty as source of truth, platform as cache

## Open Questions

1. **Scraper Architecture**: Should we run one scraper per tenant, or a shared scraper with credential switching?
2. **Credential Storage**: Where to store per-tenant hipages credentials? (Encrypted like Twenty tokens?)
3. **Rate Limiting**: Hipages may have API limits. How to coordinate scraping across tenants?
4. **Data Sync**: Should we keep hipages_leads table, or rely entirely on Twenty?
5. **Module UI**: What should the hipages module admin UI look like?

## Requirements Traceability

| Requirement | Description | Source |
|-------------|-------------|--------|
| HIPLEADS-01 | Module scrapes hipages.com.au for leads | ROADMAP.md |
| HIPLEADS-02 | Scraped leads sync to Twenty as HipagesLead | ROADMAP.md |
| HIPLEADS-03 | Admin UI displays scraped leads | ROADMAP.md |
| HIPLEADS-04 | Module only activates for tenants with credentials | ROADMAP.md |
| HIPLEADS-05 | Scraper respects rate limits | ROADMAP.md |
| HIPLEADS-06 | Error handling and graceful degradation | ROADMAP.md |

## Success Criteria

1. Scraper runs as separate container and scrapes hipages.com.au for trade service leads
2. Scraped leads sync to Twenty as HipagesLead custom object with linked Person records
3. Admin UI displays scraped leads with filtering and search capabilities
4. Module only activates for tenants with configured hipages credentials
5. Scraper respects hipages rate limits and handles errors gracefully
