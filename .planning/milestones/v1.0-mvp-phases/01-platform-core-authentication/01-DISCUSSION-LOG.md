# Phase 1: Platform Core & Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 01-platform-core-authentication
**Areas discussed:** Database migration strategy

---

## Database Migration Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 1: Foundation → Phase 2: Migrate | Build multi-tenant foundation first, then migrate all existing data to Twenty CRM in Phase 2. Revive becomes the first tenant. | ✓ |
| Twenty-first approach | Start Twenty CRM integration immediately. Skip separate multi-tenant build — let Twenty handle tenant data from day one. | |
| Parallel systems, defer migration | Keep existing CRM as-is, build new multi-tenant system alongside. Migrate only when new tenant signs up. | |

**User's choice:** Phase 1: Foundation → Phase 2: Migrate
**Notes:** Clear separation of concerns. Build platform foundation first, handle CRM integration in Phase 2.

---

## Multi-tenancy Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Shared DB with tenant_id | Proven pattern, simpler ops, cost-effective. Use tenant_id columns + PostgreSQL Row-Level Security (RLS) for isolation. | ✓ |
| Separate schemas per tenant | Better isolation, easier to scale per tenant. More complex ops, higher infrastructure costs. | |
| Separate databases per tenant | Maximum isolation, can host on different servers. Overkill for v1, significant operational overhead. | |

**User's choice:** Shared DB with tenant_id
**Notes:** Cost-effective and proven pattern. Will add RLS as defense-in-depth.

---

## Tenant Data Preservation

| Option | Description | Selected |
|--------|-------------|----------|
| Leads, appointments, tasks | Leads, appointments, tasks are the core CRM data. Everything else can be rebuilt. | |
| All CRM tables | Include quotes, hipages leads, campaigns, audit logs. Preserve full business history. | |
| Schema only, dummy data | Just the schema structure and relationships. Seed with dummy data for testing. | ✓ |

**User's choice:** Schema only, dummy data
**Notes:** Not concerned with preserving production data. Schema structure + dummy data sufficient for development.

---

## Claude's Discretion

Areas where user deferred to Claude's implementation judgment:
- Multi-tenancy implementation details (RLS policies, migration scripts)
- Module manifest format and loading mechanism
- Team invitation flow and permission system design
- Seed data structure for new tenants

---

## Deferred Ideas

None — discussion stayed within phase scope.
