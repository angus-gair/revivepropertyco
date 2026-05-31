# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1-opportunities — CRM Opportunity Integration

**Shipped:** 2026-05-31
**Phases:** 1 | **Plans:** 2 | **Sessions:** 2

### What Was Built
- Lead promote API endpoint `POST /api/hipages/leads/:id/promote-opportunity` to look up, verify sync status, match/create Person, and create/link Opportunity in Twenty CRM.
- Attachment of scraped lead metadata as a formatted Markdown Note inside the Twenty CRM Opportunity.
- Frontend list/details action button ("Promote to CRM"), synced status badges, and direct links pointing to Twenty CRM.
- Playwright integration tests mocking Twenty CRM GraphQL API and local routes.

### What Worked
- Mocking the external Twenty CRM GraphQL API in local E2E Playwright tests allowed fast, hermetic runs without relying on live external networks.
- Modifying files and checking changes locally before staging kept git commits clean.

### What Was Inefficient
- Executing database migrations or status checks directly inside local host shell fails due to isolated docker networks; commands must run in the backend container context.

### Patterns Established
- Multi-stage mock patterns for Twenty CRM client inside the `tests/` directory.

### Key Lessons
1. Always verify whether a database connection needs to route through the Docker backend container network before running migration/status commands.

### Cost Observations
- Model mix: 100% Gemini 3.5 Flash (High)
- Sessions: 2 sessions
- Notable: Compacted workspace state summary allowed resumption with zero cognitive loss.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.1-opportunities | 2 | 1 | Transitioned to automated mocking for external CRM interfaces in tests |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.1-opportunities | 2 | 100% | 0 |

### Top Lessons (Verified Across Milestones)

1. External integrations should have a standardized local mock harness to allow regression testing without live API keys.
