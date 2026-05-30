---
phase: 02-twenty-crm-integration
plan: 06
subsystem: twenty-webhooks
tags: [webhooks, hmac-verification, event-processing, audit-log]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [webhook-receiver, event-logging]
  affects: [platform-database, twenty-crm]
tech_stack:
  added:
    - Express.js webhook endpoint
    - HMAC-SHA256 signature verification
    - PostgreSQL event logging
  patterns:
    - Webhook signature verification with timestamp validation
    - Asynchronous event processing with setImmediate()
    - Duplicate detection via UNIQUE constraint
key_files:
  created:
    - server/api/twenty-webhooks.cjs
    - server/migrations/009_webhook_event_log.sql
  modified:
    - server/index.cjs
decisions:
  - key: "webhook-url"
    summary: "Webhook endpoint at /api/twenty/webhooks accessible via Traefik"
    rationale: "Platform server exposes webhook endpoint; Twenty CRM configured to POST events"
  - key: "async-processing"
    summary: "Webhook events processed asynchronously after 200 OK response"
    rationale: "Prevents Twenty from retrying webhooks due to slow processing"
  - key: "duplicate-detection"
    summary: "Event ID deduplication prevents duplicate processing"
    rationale: "Twenty may retry webhooks; UNIQUE constraint on event_id ensures idempotency"
metrics:
  duration_seconds: 60
  completed_date: "2026-04-21"
  tasks_completed: 3
  files_created: 2
  files_modified: 1
---

# Phase 02 Plan 06: Webhook Receiver Summary

**One-liner:** Webhook receiver at `/api/twenty/webhooks` with HMAC-SHA256 signature verification, event logging, and asynchronous processing.

## Objective Completed

Implemented webhook receiver for Twenty CRM events with signature verification, duplicate detection, event logging to database, and asynchronous processing.

## Deviations from Plan

### Auto-fixed Issues

None - plan executed as written.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ----- | ------ | ----- |
| 1 | Create webhook receiver endpoint | - | server/api/twenty-webhooks.cjs |
| 2 | Create webhook event logging table migration | - | server/migrations/009_webhook_event_log.sql |
| 3 | Register webhook router in server | - | server/index.cjs |

## Key Changes Made

### 1. Webhook Receiver Endpoint (server/api/twenty-webhooks.cjs)

Implements three endpoints:

**POST /api/twenty/webhooks**
- HMAC-SHA256 signature verification using `webhookMiddleware`
- Timestamp validation (5 minute max age)
- Duplicate detection via `isDuplicateEvent()`
- Event logging to `twenty_webhook_events` table
- Asynchronous processing with `setImmediate()`
- Event handlers for:
  - person.created/updated/deleted
  - serviceJob.created/updated/deleted
  - hipagesLead.created/updated
  - quote.created/updated

**GET /api/twenty/webhooks/status**
- Health check showing processed/failed counts (24 hours)
- Returns: `{ success, status, stats }`

**GET /api/twenty/webhooks/events**
- List recent events (default: 50)
- Returns: `{ success, events }`

### 2. Event Logging Table (server/migrations/009_webhook_event_log.sql)

Creates `twenty_webhook_events` table:
- `id` - Primary key (BIGSERIAL)
- `event_id` (TEXT, UNIQUE) - Unique event identifier for deduplication
- `event_type` (TEXT) - Event type (e.g., person.created)
- `payload` (JSONB) - Full webhook payload
- `received_at` (TIMESTAMP) - When webhook was received
- `processed` (BOOLEAN) - Whether successfully processed
- `processed_at` (TIMESTAMP) - When processing completed
- `error_message` (TEXT) - Error if processing failed

Indexes on:
- `event_type` - For querying by event type
- `received_at DESC` - For time-based queries
- `processed` (partial, where FALSE) - For retrying failed events
- `event_id` - For duplicate checking

### 3. Server Registration (server/index.cjs)

Updated server/index.cjs:
- Added import: `const twentyWebhooksRouter = require('./api/twenty-webhooks.cjs');`
- Added raw body parser before express.json(): `app.use('/api/twenty/webhooks', express.raw({ type: 'application/json' }));`
- Registered router: `app.use('/api/twenty', twentyWebhooksRouter);`

## Known Stubs

Event handlers are stubs that log to console. Future work:
- Sync updates to platform cache
- Trigger workflows (e.g., quote accepted → notification)
- Update related records

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: spoofing | server/api/twenty-webhooks.cjs | Webhook endpoint protected by HMAC-SHA256 signature verification |
| threat_flag: replay_attack | server/api/twenty-webhooks.cjs | Timestamp validation rejects events older than 5 minutes |
| threat_flag: information_disclosure | server/migrations/009_webhook_event_log.sql | Payloads stored in JSONB may contain PII |

## Verification Steps (Post-Deployment)

1. **Webhook router compiles:**
   ```bash
   node -c server/api/twenty-webhooks.cjs
   ```
   Should exit with code 0

2. **Server compiles with new router:**
   ```bash
   node -c server/index.cjs
   ```
   Should exit with code 0

3. **Apply migration 009:**
   ```bash
   psql $DATABASE_URL -f server/migrations/009_webhook_event_log.sql
   ```

4. **Webhook status endpoint works:**
   ```bash
   curl http://localhost:8080/api/twenty/webhooks/status
   ```
   Should return JSON with success: true, stats

5. **Register webhook in Twenty CRM:**
   - Navigate to Twenty Settings > Webhooks > Add webhook
   - URL: `https://crm.ajinsights.com.au/api/twenty/webhooks` (via Traefik routing)
   - Select events: person.created, person.updated, serviceJob.created, serviceJob.updated

## Self-Check: PASSED

- [x] POST /api/twenty/webhooks endpoint exists with signature verification
- [x] GET /api/twenty/webhooks/status endpoint exists
- [x] GET /api/twenty/webhooks/events endpoint exists
- [x] Webhook signature verified using HMAC-SHA256 from twenty-webhooks.cjs
- [x] Timestamp validation prevents replay attacks (5 minute max age)
- [x] Duplicate detection via UNIQUE constraint on event_id
- [x] Events logged to twenty_webhook_events table
- [x] Asynchronous processing with setImmediate()
- [x] Raw body parser configured for /api/twenty/webhooks
- [x] Migration 009 creates twenty_webhook_events table
- [x] All files compile without errors

## Phase 2 Complete

All 6 plans for Phase 02 (Twenty CRM Integration) are now complete:
- 02-01: Deploy Twenty CRM Infrastructure ✓
- 02-02: Configure Twenty CRM first-run setup ✓
- 02-03: Create Twenty client wrapper ✓
- 02-04: Create token storage service ✓
- 02-05: Data migration pipeline ✓
- 02-06: Webhook receiver ✓
