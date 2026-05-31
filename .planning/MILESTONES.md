# Milestones

## v1.1-opportunities v1.1-opportunities (Shipped: 2026-05-31)

**Phases completed:** 1 phases, 2 plans, 7 tasks

**Key accomplishments:**

- Promote API endpoint created to verify, match, or create a Person and generate a new Opportunity in Twenty CRM linked to local lead database
- Frontend dashboard actions implemented with Twenty CRM Note attachments and Playwright E2E integration tests passing successfully

---

## v1.1-opportunities v1.1-opportunities (Shipped: 2026-05-31)

**Phases completed:** 1 phases, 2 plans, 7 tasks

**Key accomplishments:**

- Promote API endpoint created to verify, match, or create a Person and generate a new Opportunity in Twenty CRM linked to local lead database
- Frontend dashboard actions implemented with Twenty CRM Note attachments and Playwright E2E integration tests passing successfully

---

## v1.0-mvp v1.0-mvp (Shipped: 2026-05-30)

**Phases completed:** 4 phases, 15 plans, 26 tasks

**Key accomplishments:**

- Multi-tenant platform foundation with PostgreSQL schema (4 tables), Row-Level Security policies for tenant isolation, and seed data functions for tenant provisioning
- Multi-tenant registration with JWT tokens containing tenant_id/tenant_slug claims, bcrypt password hashing, and automatic seed data provisioning
- `server/lib/modules.cjs` (202 lines)
- Team invitation API with one-time crypto tokens, role-based permissions, and user creation workflow
- Tenant authentication UI with registration, login, dashboard, and JWT token management using localStorage persistence
- Self-hosted Twenty CRM deployment via Docker Compose with dedicated PostgreSQL/Redis, Traefik routing for crm.ajinsights.com.au, and platform database tables for tenant-to-workspace mappings.
- TwentyClient API wrapper with GraphQL/REST support, webhook signature verification using HMAC-SHA256, and TypeScript type definitions for Twenty CRM objects
- GraphQL-based custom object creation for ServiceJob, HipagesLead, and Quote with platform API endpoints for workspace registration and schema setup
- AES-256-GCM token encryption at rest with PBKDF2 key derivation and automatic storage service integration
- Idempotent data migration pipeline from PostgreSQL to Twenty CRM with export, transform, import, and progress tracking.
- Webhook receiver at `/api/twenty/webhooks` with HMAC-SHA256 signature verification, event logging, and asynchronous processing.

---
