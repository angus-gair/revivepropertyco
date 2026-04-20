---
phase: 1
slug: mvp-core-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-13
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual testing + shell scripts (no automated test framework configured) |
| **Config file** | None — testing is manual via test-customer-api.sh and browser testing |
| **Quick run command** | `./test-customer-api.sh` (API smoke tests) |
| **Full suite command** | Manual checklist (see TESTING_GUIDE.md) |
| **Estimated runtime** | ~30-60 minutes (manual functional testing) |

---

## Sampling Rate

- **After every task commit:** `./test-customer-api.sh` (API smoke tests)
- **After every plan wave:** Manual testing checklist (login, profile, documents, quotes workflows)
- **Before `/gsd-verify-work`:** Full manual testing + security checklist + UAT sign-off
- **Max feedback latency:** 24 hours (manual testing time)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1.10-01-01 | 10 | 1 | FR-1 to FR-8, SR-1 to SR-3 | T-1-01 / T-1-02 | Registration and login workflows functional | manual | Browser + API smoke tests | ✅ test-customer-api.sh | ⬜ pending |
| 1.10-01-02 | 10 | 1 | NFR-1 | T-1-03 | Page load under 2 seconds | manual | Lighthouse audit | ❌ Need to run | ⬜ pending |
| 1.10-01-03 | 10 | 1 | SR-2 | T-1-04 | Customer data isolation enforced | security | Test accessing other customers' data | ❌ Need security tests | ⬜ pending |
| 1.10-01-04 | 10 | 1 | SR-3 | T-1-05 | File upload security validation | security | Upload malicious files | ❌ Need security tests | ⬜ pending |
| 1.11-01-01 | 11 | 1 | All FR, NFR | T-1-06 | Production deployment healthy | manual | `verify-production-deployment.sh` | ❌ Need to create | ⬜ pending |
| 1.12-01-01 | 12 | 1 | All FR | T-1-07 | Real customers can complete workflows | manual | UAT scenario completion | ❌ Need to create | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `./test-customer-api.sh` — API smoke test stubs for authentication and CRUD operations
- [ ] `verify-production-deployment.sh` — Production health check script (deployment verification)
- [ ] `uat-scenarios.md` — UAT scenario definitions for customer workflows

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Customer registration flow | FR-1 | UI/UX validation requires human judgment | Navigate to /customer/register, fill form, verify email/mobile validation, test error cases |
| Customer login with mobile | FR-2 | Mobile format validation, localStorage persistence | Login with 04xxxxxxxx, verify token stored, refresh page and verify session persists |
| Document upload drag-and-drop | FR-5 | UI interaction testing requires browser | Upload file via drag-and-drop, verify progress bar shows, confirm file appears in list |
| Quote approval workflow | FR-6 | Multi-step business process | Navigate to quotes, view details, click approve, confirm dialog, verify status changes |
| Profile update with validation | FR-4 | Form validation, error messaging | Edit profile with invalid mobile/email, verify error messages, test with valid data |
| Mobile responsiveness | NFR-4 | Layout testing on actual devices | Test on iPhone Safari, Android Chrome, tablet viewport, verify hamburger menu works |
| Cross-browser compatibility | NFR-4 | Browser-specific issues | Test workflows in Chrome, Firefox, Safari, Edge, verify consistent behavior |
| File upload security | SR-3 | Attack simulation requires manual testing | Attempt upload with fake extension (.jpg.exe), oversized file (11MB), invalid MIME type |
| SQL injection prevention | SR-2 | Security testing requires malicious payloads | Attempt login with `identifier' OR '1'='1`, verify 400 error returned |
| Customer data isolation | SR-2 | Authorization testing | Login as customer A, try to access customer B's documents via API or URL manipulation |
| Production deployment health | All | Infrastructure verification | Run verify-production-deployment.sh, verify all health checks pass |

---

## Validation Sign-Off

- [ ] All tasks have manual verification or automated API smoke tests
- [ ] Sampling continuity: no 3 consecutive tasks without verification check
- [ ] Wave 0 covers all MISSING references (test scripts, UAT scenarios)
- [ ] No watch-mode flags
- [ ] Feedback latency < 24 hours (manual testing time)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
