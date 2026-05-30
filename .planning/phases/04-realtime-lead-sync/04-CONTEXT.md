# Phase 4: Real-time Lead Sync - Context

**Gathered:** 2026-05-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the production scraper execution environment with a 6-hour automated cron interval, real-time Socket.IO data pushing to the admin UI, dashboard operations monitoring (scraper status, last run, logs), and exponential backoff retry logic.

</domain>

<decisions>
## Implementation Decisions

### Real-time UI Integration
- **D-01:** Integrate Socket.IO client inside `HipagesBusinessesPage.tsx` to listen for the `hipages:leadsUpdated` event.
- **D-02:** When an event is received, merge new directory records live into the active table state without requiring a full page refresh.

### Scraper Control & Triggering
- **D-03:** Run the automated scraper container on a production cron schedule (every 6 hours).
- **D-04:** Expose a manual dashboard trigger button calling `/api/hp-businesses/sessions` or a trigger endpoint to force a manual scrape run.

### Error Handling & Backoff
- **D-05:** Implement exponential backoff retries within the scraper container (e.g., retry after 5m, 15m, 45m) up to 3 times before updating session status to `failed` and logging the traceback.

### Scrape Pace & Rate Limiting
- **D-06:** Apply polite scraping conventions: space page requests with a random 3–7 second delay and pause for 10 seconds between trade categories.

### the agent's Discretion
- Visual styling of the logs panel and retry counters.
- Setup parameters for exponential backoff calculations.

</decisions>

<canonical_refs>
## Canonical References

### Real-time Sync & Websockets
- `server/lib/hipages-sync.cjs` — Broadcasts PG notify events to Socket.IO clients
- `server/index.cjs` — Server initialization, Socket.IO binding, and static route mounting

### Scraper Daemon & Data Persistence
- `services/hp-business-scraper/src/scraper.js` — Main Playwright scraper execution script
- `services/hp-business-scraper/src/db-writer.js` — Session logging and database upsert statements

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `subscribeToHipagesUpdates` in `server/lib/hipages-sync.cjs`: Listens to `hipages_leads_updated` PG notify events and broadcasts `hipages:leadsUpdated` using `io.emit`.

### Established Patterns
- Socket.IO connection routing maps through the Traefik proxy as defined in `docker-compose.yml` (`PathPrefix(/socket.io)`).

</code_context>

<deferred>
## Deferred Ideas

- Direct SMS/Email alerts on failed scrape runs (out of scope for MVP).

</deferred>

---

*Phase: 04-realtime-lead-sync*
*Context gathered: 2026-05-30*
