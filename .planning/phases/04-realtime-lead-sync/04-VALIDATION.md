---
phase: 04
slug: realtime-lead-sync
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-30
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Python unittest + Playwright |
| **Config file** | services/e2e-tester/test_suite.py |
| **Quick run command** | `PROJECT_ROOT=/opt/homelab/apps/revivepropertyco python3 services/e2e-tester/test_suite.py --db postgresql://homelab:BQvsf9MNbLHM0r972mJmpjYphvtUxWyhFwh4xP8v8hg@10.0.3.3:5432/hipages_directory` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run the quick run command
- **After every plan wave:** Run the full suite command
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | SYNC-01 | — | Run scraper via cron | integration | `docker exec revive-hp-business-scraper cat /etc/cron.d/scraper` | ✅ | ⬜ pending |
| 04-01-02 | 01 | 1 | SYNC-02 | — | Real-time push using socket.io | integration | `node -e "const io = require('socket.io-client'); const socket = io('http://localhost:8080'); socket.on('hp-businesses:updated', () => process.exit(0)); setTimeout(() => process.exit(1), 5000)"` | ✅ | ⬜ pending |
| 04-01-03 | 01 | 1 | SYNC-03 | — | Admin UI shows log entries | E2E | `npx playwright test tests/e2e-live-test.spec.ts` | ✅ | ⬜ pending |
| 04-01-04 | 01 | 1 | SYNC-04 | — | Retries with backoff | unit | `npm run test` | ✅ | ⬜ pending |

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-30
