# Phase 2: Twenty CRM Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 2 - Twenty CRM Integration
**Mode:** Auto-decisions (user delegated to Claude)

---

## Deployment Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Separate Docker service in docker-compose.yml | Integrated into existing stack, shared networks | ✓ |
| External cloud deployment (Twenty Cloud) | Managed service, separate infrastructure | |
| Standalone docker-compose file | Separate orchestration, more isolation | |

**User's choice:** Delegated to Claude's recommendation
**Recommendation selected:** Separate Docker service in docker-compose.yml
**Rationale:** Keeps stack unified (single docker-compose), simplifies networking and backup. Existing Traefik setup handles SSL/routing.

---

## Data Migration Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Phased migration with parallel sync | Bulk migrate + validation period + dual-write | ✓ |
| One-time big bang cutover | Single migration event, immediate cutover | |
| Gradual record-by-record sync | Migrate on access, slower but lower risk | |

**User's choice:** Delegated to Claude's recommendation
**Recommendation selected:** Phased migration with parallel sync
**Rationale:** Phased approach minimizes risk. Validation period ensures data integrity before cutover. Idempotent migration supports re-tries.

---

## API Integration Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Service layer abstraction (twenty-client.cjs) | Wrapper around Twenty API, auth, retry logic | ✓ |
| Direct API calls from routes | Simpler, but scattered Twenty-specific code | |
| Queue-based sync worker | Async, better for high volume | |

**User's choice:** Delegated to Claude's recommendation
**Recommendation selected:** Service layer abstraction
**Rationale:** Service layer isolates Twenty-specific logic. Backend proxy maintains security boundary. GraphQL reduces over-fetching for complex queries.

---

## Custom Objects Design

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror existing with sensible restructuring | Match domain model, adapt to Twenty patterns | ✓ |
| Exact replica of existing schema | Minimal mapping, but may not fit Twenty | |
| Complete redesign for Twenty's philosophy | Optimal for Twenty, but breaks existing patterns | |

**User's choice:** Delegated to Claude's recommendation
**Recommendation selected:** Mirror existing with sensible restructuring
**Rationale:** Reuses existing domain understanding while adapting to Twenty's data model. Standard objects (Companies, People) reduce custom work.

---

## Claude's Discretion

Areas where user delegated to Claude's expertise:
- Twenty CRM specific configuration details (env vars, docker image version)
- GraphQL schema details for custom objects (follow Twenty docs)
- Migration script implementation language (Node.js vs Python scripts)
- Exact mapping of existing tables to Twenty objects (optimize during implementation)

---

## Deferred Ideas

None — discussion stayed within phase scope.
