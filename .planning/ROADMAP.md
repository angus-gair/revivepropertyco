# Roadmap: Modular AI SaaS Platform

## Overview

Transform the existing Revive Property Co. website into a multi-tenant SaaS platform where trade service businesses can select and activate AI-powered modules à la carte. The journey begins with building the platform core (multi-tenancy, module system), integrating Twenty CRM as the central data hub, then delivering AI-powered modules one by one, and finally adding the billing system that makes everything commercially viable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Platform Core & Authentication** - Build multi-tenant foundation with module system
- [ ] **Phase 2: Twenty CRM Integration** - Deploy Twenty and migrate existing data
- [ ] **Phase 3: Hipages Leads Module** - Transform existing scraper into first module
- [ ] **Phase 4: AI Quotes Module** - Generate instant quotes with AI pricing
- [ ] **Phase 5: AI SEO & Content Modules** - Optimize listings and generate social content
- [ ] **Phase 6: Competitor Analysis Module** - Monitor competitors and generate insights
- [ ] **Phase 7: Billing & Module Management** - Stripe subscriptions and self-service module management

## Phase Details

### Phase 1: Platform Core & Authentication
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
  - [ ] 01-01-PLAN.md — Create database schema with platform tables and RLS policies
  - [ ] 01-02-PLAN.md — Create tenant-aware authentication library with AsyncLocalStorage context
- Wave 2 (parallel):
  - [ ] 01-03-PLAN.md — Create tenant registration and authentication API endpoints
  - [ ] 01-04-PLAN.md — Create module discovery and registration system
- Wave 3 (parallel):
  - [ ] 01-05-PLAN.md — Create team member invitation API
  - [ ] 01-06-PLAN.md — Create tenant authentication UI with registration, login, dashboard

### Phase 2: Twenty CRM Integration
**Goal**: Platform uses self-hosted Twenty CRM as central data hub with all existing data migrated
**Depends on**: Phase 1
**Requirements**: CRM-01, CRM-02, CRM-03, CRM-04, CRM-05, CRM-06, CRM-07, CRM-08, CRM-09
**Success Criteria** (what must be TRUE):
  1. Twenty CRM stack deployed via docker-compose with correct SERVER_URL configuration
  2. Custom objects created in Twenty (ServiceJob, HipagesLead, Quote)
  3. All existing leads, appointments, and tasks migrated to Twenty via API
  4. Platform can read/write Twenty data via REST/GraphQL API (never direct SQL)
  5. Webhooks from Twenty are received and verified with HMAC signatures
**Plans**: TBD

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
**Plans**: TBD

### Phase 4: AI Quotes Module
**Goal**: Tenants can generate instant quotes from lead information using AI pricing models
**Depends on**: Phase 2
**Requirements**: QUOTES-01, QUOTES-02, QUOTES-03, QUOTES-04, QUOTES-05
**Success Criteria** (what must be TRUE):
  1. Module generates instant quotes from lead information using AI
  2. AI pricing model is calibrated for Canberra ACT suburb pricing
  3. Quote data syncs to Twenty as Quote custom object linked to Opportunity
  4. Admin UI allows reviewing and editing AI-generated quotes before sending
  5. Quotes include line items, terms, and expiry dates
**Plans**: TBD

### Phase 5: AI SEO & Content Modules
**Goal**: Tenants can optimize their online presence and generate social media content with AI
**Depends on**: Phase 2
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, CONTENT-05
**Success Criteria** (what must be TRUE):
  1. SEO module analyzes business listing and generates AI-powered recommendations
  2. SEO module tracks scores over time and stores recommendations in database
  3. Content module generates social media posts (Facebook/Instagram) based on service offerings
  4. Content calendar UI allows scheduling posts and viewing upcoming content
  5. Generated content is stored for reuse and displays usage credits (if metered)
**Plans**: TBD

### Phase 6: Competitor Analysis Module
**Goal**: Tenants can monitor competitor pricing and online presence with AI-generated insights
**Depends on**: Phase 2
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. Module scrapes competitor websites and listings for pricing and services
  2. AI generates comparison insights and recommendations based on competitor data
  3. Analysis results are stored in database and displayed in admin UI
  4. Module can handle multiple competitors per tenant and track changes over time
**Plans**: TBD

### Phase 7: Billing & Module Management
**Goal**: Tenants can manage subscriptions and modules via Stripe integration with self-service billing
**Depends on**: Phase 1
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07, BILL-08, BILL-09, BILL-10, BILL-11, BILL-12, MMGT-01, MMGT-02, MMGT-03, MMGT-04, MMGT-05, MMGT-06
**Success Criteria** (what must be TRUE):
  1. New tenant can start 14-day free trial without credit card
  2. Tenant can add/remove modules mid-cycle with proration preview
  3. Stripe webhooks sync subscription state to tenant_modules table for runtime enforcement
  4. requireModule() middleware checks tenant_modules table before allowing module access
  5. Billing dashboard shows active modules, costs, and links to Stripe Customer Portal
  6. Module catalog displays all available modules with descriptions and pricing
**Plans**: TBD

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Platform Core & Authentication | 0/6 | Ready to execute | - |
| 2. Twenty CRM Integration | 0/0 | Not started | - |
| 3. Hipages Leads Module | 0/0 | Not started | - |
| 4. AI Quotes Module | 0/0 | Not started | - |
| 5. AI SEO & Content Modules | 0/0 | Not started | - |
| 6. Competitor Analysis Module | 0/0 | Not started | - |
| 7. Billing & Module Management | 0/0 | Not started | - |
