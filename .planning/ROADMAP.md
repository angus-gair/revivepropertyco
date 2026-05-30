# Roadmap: Revive Property Co. - MVP Launch

## Overview

Transform the existing Revive Property Co. website into a production-ready MVP with CRM integration and lead scraping capabilities. This milestone focuses on delivering core business value: managing leads through Twenty CRM and automatically scraping hipages.com.au for new trade service opportunities.

**Future Project:** AI-powered modules (SEO, content, competitor analysis) and billing are deferred to a separate future project.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Platform Core & Authentication** - Build multi-tenant foundation with module system
- [x] **Phase 2: Twenty CRM Integration** - Deploy Twenty and migrate existing data
- [x] **Phase 3: Hipages Leads Module** - Transform existing scraper into first module
- [ ] **Phase 4: Real-time Lead Sync** - Production scraper with live data sync to Twenty

**Deferred to Future Project:**
- Phase 5: AI Quotes Module
- Phase 6: AI SEO & Content Modules
- Phase 7: Competitor Analysis Module
- Phase 8: Billing & Module Management

## Phase Details

### Phase 1: Platform Core & Authentication ✅
**Goal**: Trade service businesses can sign up and access a multi-tenant platform with modular architecture
**Depends on**: Nothing (first phase)
**Requirements**: PCORE-01, PCORE-02, PCORE-03, PCORE-04, PCORE-05, PCORE-06, PCORE-07, PCORE-08, PCORE-09, PCORE-10, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. New tenant owner can sign up with email/password and receive JWT with tenant_id claims
  2. Tenant data is isolated via dual-layer filtering (application WHERE + PostgreSQL RLS)
  3. Platform discovers and registers modules automatically at startup via manifest system
  4. Tenant owner can invite team members with role-based permissions
  5. New tenant provisioning creates default seed data (pipeline stages, categories)
**Plans**: 6 plans in 3 waves

**Plan Breakdown:**
- Wave 1 (parallel):
  - [x] 01-01-PLAN.md — Create database schema with platform tables and RLS policies
  - [x] 01-02-PLAN.md — Create tenant-aware authentication library with AsyncLocalStorage context
- Wave 2 (parallel):
  - [x] 01-03-PLAN.md — Create tenant registration and authentication API endpoints
  - [x] 01-04-PLAN.md — Create module discovery and registration system
- Wave 3 (parallel):
  - [x] 01-05-PLAN.md — Create team member invitation API
  - [x] 01-06-PLAN.md — Create tenant authentication UI with registration, login, dashboard

### Phase 2: Twenty CRM Integration ✅
**Goal**: Platform uses self-hosted Twenty CRM as central data hub with all existing data migrated
**Depends on**: Phase 1
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, CRM-07, CRM-08, CRM-09
**Success Criteria** (what must be TRUE):
  1. Twenty CRM stack deployed via docker-compose with correct SERVER_URL configuration
  2. Custom objects created in Twenty (ServiceJob, HipagesLead, Quote)
  3. All existing leads, appointments, and tasks migrated to Twenty via API
  4. Platform can read/write Twenty data via REST/GraphQL API (never direct SQL)
  5. Webhooks from Twenty are received and verified with HMAC signatures
**Plans**: 6 plans in 3 waves

**Plan Breakdown:**
- Wave 1 (parallel):
  - [x] 02-01-PLAN.md — Deploy Twenty CRM Docker services with Traefik routing
  - [x] 02-02-PLAN.md — Create Twenty API client, webhook utilities, and TypeScript types
- Wave 2 (parallel):
  - [x] 02-03-PLAN.md — Create custom objects in Twenty and platform schema management API
  - [x] 02-04-PLAN.md — Implement encrypted token storage for Twenty API tokens per tenant
- Wave 3:
  - [x] 02-05-PLAN.md — Create and execute data migration pipeline (export, transform, import)
  - [x] 02-06-PLAN.md — Implement webhook receiver with signature verification

### Phase 3: Hipages Leads Module
**Goal**: Tenants can scrape hipages.com.au for trade service leads and sync them to Twenty
**Depends on**: Phase 2
**Requirements**: HIPLEADS-01, HIPLEADS-02, HIPLEADS-03, HIPLEADS-04, HIPLEADS-05, HIPLEADS-06
**Success Criteria** (what must be TRUE):
  1. Scraper runs as separate container and scrapes hipages.com.au for trade service leads
  2. Scraped leads sync to Twenty as HipagesLead custom object with linked Person records
  3. Admin UI displays scraped leads with filtering and search capabilities
  4. Module only activates for tenants with configured hipages credentials
  5. Scraper respects hipages rate limits and handles errors gracefully
**Plans**: 1 plan in 1 wave

### Phase 4: Real-time Lead Sync
**Goal**: Production scraper with live data sync and admin monitoring
**Depends on**: Phase 3
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05
**Success Criteria** (what must be TRUE):
  1. Scraper runs in production via cron on 6-hour interval
  2. New leads are detected via PostgreSQL NOTIFY and pushed to admin UI in real-time
  3. Admin dashboard shows scraper status, last run, and lead counts
  4. Failed scrapes are logged and retried with exponential backoff
  5. Rate limiting prevents hipages blocking
**Plans**: 2 plans in 2 waves

**Plan Breakdown:**
- Wave 1:
  - [x] 04-01-PLAN.md — Production scraper cron, retries, PG notifies, and Socket.IO broadcaster
- Wave 2:
  - [ ] 04-02-PLAN.md — Real-time UI integration, scraper operations panel, and Playwright E2E tests

### Future Project: AI SaaS Platform
**Planned Phases:**
- Phase 5: AI Quotes Module - Generate instant quotes with AI pricing models
- Phase 6: AI SEO & Content Modules - Optimize listings and generate social content
- Phase 7: Competitor Analysis Module - Monitor competitors and generate insights
- Phase 8: Billing & Module Management - Stripe subscriptions and self-service module management

These will be planned after MVP is live and tested in production.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Platform Core & Authentication | 6/6 | Complete | 2026-04-20 |
| 2. Twenty CRM Integration | 6/6 | Complete | 2026-04-21 |
| 3. Hipages Leads Module | 1/1 | Complete | 2026-05-30 |
| 4. Real-time Lead Sync | 1/2 | In progress | - |
