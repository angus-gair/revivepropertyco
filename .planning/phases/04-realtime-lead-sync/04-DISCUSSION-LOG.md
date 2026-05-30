# Phase 4: Real-time Lead Sync - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 04-realtime-lead-sync
**Areas discussed:** Real-time UI Integration, Scraper Control & Triggering, Error Handling and Backoff, Scraping Pace & Rate Limiting

---

## Real-time UI Integration

| Option | Description | Selected |
|--------|-------------|----------|
| Option 1A | Integrate Socket.IO client inside HipagesBusinessesPage.tsx to listen for the hipages:leadsUpdated event and automatically merge new records live without a page refresh. | ✓ |
| Option 1B | Keep current 30-minute polling loop and add a manual "Scrape Status" indicator. | |

**User's choice:** Option 1A (Recommended)
**Notes:** Preferred for seamless user experience without manual refreshing.

---

## Scraper Control & Triggering

| Option | Description | Selected |
|--------|-------------|----------|
| Option 2A | Hybrid trigger system. Container runs on production cron schedule but listens to API-based requests for manual trigger. | ✓ |
| Option 2B | Pure cron schedule only. Remove dashboard trigger capability. | |

**User's choice:** Option 2A (Recommended)
**Notes:** Allows forcing immediate scrape on demand.

---

## Error Handling and Backoff

| Option | Description | Selected |
|--------|-------------|----------|
| Option 3A | Retries handled inside the scraper daemon using exponential backoff up to 3 times before updating status to failed. | ✓ |
| Option 3B | Immediate fail. Update state to failed on first error and wait for next cron cycle. | |

**User's choice:** Option 3A (Recommended)
**Notes:** Higher reliability against temporary network drops.

---

## Scraping Pace & Rate Limiting

| Option | Description | Selected |
|--------|-------------|----------|
| Option 4A | Polite scraping mode. Spacing queries with random 3-7s delay per page and 10s delay between categories. | ✓ |
| Option 4B | Parallel scraping to speed up execution. | |

**User's choice:** Option 4A (Recommended)
**Notes:** Minimizes the risk of getting blocked by Hipages' protection.

---

## the agent's Discretion

- Visual styling of logs and metrics panels.
- Specific intervals for backoff retries.

## Deferred Ideas

- SMS/Email notifications on scraper failures.

---

*Phase: 04-realtime-lead-sync*
*Discussion log generated: 2026-05-30*
