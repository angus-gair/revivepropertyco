---
phase: 04-realtime-lead-sync
plan: 01
subsystem: hp-business-scraper
tags: [scraper, backend, sync, realtime, pg-notify, socket-io]
dependency_graph:
  requires: [hipages-business-module]
  provides: [realtime-lead-sync]
  affects: [backend, scheduler, scraper-daemon]
tech_stack:
  added:
    - PostgreSQL pg_notify/LISTEN IPC
    - Socket.IO Real-time Events
  patterns:
    - Dedicated PG clients for long-lived LISTEN connections
    - Double-trigger protection via single-concurrency scraping locks
    - Exponential backoff retry loops for scraping robustness
    - Polite crawler delays (random page waits, category pauses)
key_files:
  created:
    - server/lib/hp-businesses-sync.cjs
  modified:
    - docker-compose.yml
    - services/hp-business-scraper/src/db-writer.js
    - services/hp-business-scraper/src/scheduler.js
    - services/hp-business-scraper/src/scraper.js
    - server/index.cjs
    - server/api/hp-businesses.cjs
decisions:
  - key: "single-concurrency-lock"
    summary: "Prevent concurrent manual/cron scrapes using a single-concurrency state lock"
    rationale: "Prevents CPU/network saturation and redundant requests to hipages"
    alternatives: ["Scraper queue", "Permitting concurrent scrapes"]
  - key: "exponential-backoff"
    summary: "Exponential backoff for scrape retries"
    rationale: "Ensures resilience against temporary connection failures while avoiding hammering when target site is rate-limiting"
    alternatives: ["Fixed-interval retries"]
metrics:
  duration_seconds: 400
  completed_date: "2026-05-30"
  tasks_completed: 4
  files_created: 1
  files_modified: 6
---

# Phase 04 Plan 01 Summary

Configured the production scraper container environment to run on a 6-hour cron schedule, implemented exponential backoff retries and polite rate limiting inside the Playwright scraper, established the real-time update pipeline utilizing PostgreSQL notify events combined with Socket.IO broadcasting, and exposed an authenticated manual scraper trigger endpoint.

## Objective Completed

Developed the full real-time lead synchronization mechanism. Verified that all components (scheduler, scraper, API endpoint, and Socket.IO listener) are functioning properly and communicate seamlessly.

## Tasks Completed

1. **Task 1: Production Cron Schedule & Database NOTIFY Integration** - Updated the container cron schedule to a 6-hour interval in `docker-compose.yml` and added a `pg_notify` event inside `db-writer.js` to broadcast updates on `hp_businesses_updated` channel.
2. **Task 2: Manual Scraper Trigger Endpoint & Pg LISTEN IPC Receiver** - Created an authenticated `POST /scrape/trigger` route in `server/api/hp-businesses.cjs` that notifies `hp_scrape_trigger` channel. Added a database `LISTEN` client in `scheduler.js` with 5-second automatic reconnection to run the scraper asynchronously, protected by a single-concurrency state lock.
3. **Task 3: Scraper Resilient Retries (Backoff) & Polite Rate Limiting** - Implemented a 3-attempt exponential backoff retry loop using `RETRY_DELAY_MS` (default: 300000ms), error traceback reporting on final failure, random page transition delays (3–7s), and category pauses (10s) in `scraper.js`.
4. **Task 4: Create Backend Socket.IO Broadcaster** - Created `server/lib/hp-businesses-sync.cjs` to listen on `hp_businesses_updated` database notifications and broadcast `hp-businesses:updated` and `hipages:leadsUpdated` events. Registered it in `server/index.cjs`.

## Self-Check: PASSED
- [x] Scraper runs on 6-hour interval
- [x] PG notify fired after saving businesses
- [x] Scheduler listens to trigger IPC & executes single-concurrency scrapes safely
- [x] Polite delays (3-7s, 10s) and exponential backoff loops active
- [x] Socket.IO broadcaster instantiated and registered
- [x] Automated test checks pass
