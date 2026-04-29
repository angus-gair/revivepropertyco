---
phase: 4
slug: integrate-hipages-lead-scraper-with-real-time-data-sync
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual testing (no automated test infrastructure detected) |
| **Config file** | None (manual testing per STATE.md: "testing: { framework: 'manual' }") |
| **Quick run command** | `cd services/hipages-scraper && npm run scrape` |
| **Full suite command** | Manual test checklist (see below) |
| **Estimated runtime** | ~30-60 minutes (manual functional testing) + 24-hour soak test |

---

## Sampling Rate

- **After every task commit:** Run scraper once, verify database write, check dashboard
- **After every plan wave:** Full end-to-end test: scrape → database → API → dashboard → accept lead
- **Before `/gsd-verify-work`:** Full suite must pass + 24-hour soak test completed
- **Max feedback latency:** 24 hours (for soak test)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4.01-01-01 | 01 | 1 | HIP-001 | T-4-01 | Scraper extracts leads from hipages.com.au without credential exposure | integration | `node services/hipages-scraper/src/scraper.js && psql -c "SELECT COUNT(*) FROM hipages_leads WHERE scraped_at > NOW() - INTERVAL '1 minute'"` | ❌ Wave 0 | ⬜ pending |
| 4.01-01-02 | 01 | 1 | HIP-002 | T-4-02 | Scraper writes leads to PostgreSQL with parameterized queries | integration | `psql -c "SELECT COUNT(*) FROM hipages_leads WHERE scraped_at > NOW() - INTERVAL '1 hour'"` | ❌ Wave 0 | ⬜ pending |
| 4.02-01-01 | 02 | 1 | HIP-003 | — | Dashboard displays hipages leads without XSS | manual | Open https://hp.revivepropertyco.au, verify leads load | ❌ Wave 0 | ⬜ pending |
| 4.03-01-01 | 03 | 1 | HIP-004 | T-4-04 | Admin can accept hipages lead (convert to CRM lead) with auth check | integration | `curl -X POST http://localhost:8080/api/hipages/leads/{id}/accept -H "Authorization: Bearer {token}" && psql -c "SELECT * FROM leads WHERE id = '{crm_lead_id}'"` | ❌ Wave 0 | ⬜ pending |
| 4.03-01-02 | 03 | 1 | HIP-005 | — | Real-time updates work (NOTIFY → dashboard) | manual | Trigger scrape, watch dashboard for auto-refresh (< 5s) | ❌ Wave 0 | ⬜ pending |
| 4.04-01-01 | 04 | 1 | HIP-006 | T-4-06 | Scraper runs on schedule (6-hour cron) without DoS | manual | `docker compose logs -f hipages-scraper` (wait for cron trigger) | ❌ Wave 0 | ⬜ pending |
| 4.05-01-01 | 05 | 1 | All | T-4-07 | Production deployment healthy, all services running | manual | `verify-production-deployment.sh` | ❌ Need to create | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `services/hipages-scraper/src/scraper.js` — scraper entry point with database integration
- [ ] `server/api/hipages.cjs` — admin API endpoints for hipages leads
- [ ] `server/lib/hipages-sync.cjs` — PostgreSQL LISTEN/NOTIFY consumer
- [ ] `server/migrations/002_create_hipages_leads_table.sql` — hipages-specific table
- [ ] `verify-production-deployment.sh` — Production health check script

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard displays hipages leads | HIP-003 | UI validation requires human judgment | Navigate to https://hp.revivepropertyco.au, verify leads load with correct data (names, suburbs, job types), test filters and search |
| Real-time sync (NOTIFY → dashboard) | HIP-005 | Visual confirmation of auto-refresh | Open dashboard in browser, trigger manual scrape via API, watch for auto-refresh within 5 seconds without page reload |
| Scraper runs on schedule (cron) | HIP-006 | Time-based observation required | `docker compose logs -f hipages-scraper` and wait for cron trigger (6-hour intervals), verify scrape runs automatically |
| Error recovery (PostgreSQL restart) | All | Infrastructure failure simulation | Stop PostgreSQL with `docker compose stop postgres`, run scraper (should fail gracefully), start PostgreSQL, run scraper again (should succeed) |
| Dashboard XSS prevention | HIP-003 | Security testing requires manual HTML injection | Add HTML tags to hipages lead data (if test data allows), verify dashboard escapes HTML and doesn't execute scripts |
| CSRF protection (accept lead endpoint) | HIP-004 | Security testing for CSRF tokens | Try POST request without auth header, verify 401 Unauthorized, try with valid JWT token, verify success |
| Long-running soak test (24 hours) | All | Verify cron stability and resource usage | Deploy to production, monitor logs for 24 hours, verify cron runs 4x, check `SELECT COUNT(*) FROM hipages_leads` increases, verify dashboard updates after each scrape |

---

## Validation Sign-Off

- [ ] All tasks have manual verification or integration test commands
- [ ] Sampling continuity: no 3 consecutive tasks without verification check
- [ ] Wave 0 covers all MISSING references (scraper, API, sync, migration, database, deployment scripts)
- [ ] No watch-mode flags
- [ ] Feedback latency < 24 hours (24-hour soak test for cron verification)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
