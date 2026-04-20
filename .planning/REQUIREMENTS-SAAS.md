# Requirements: Modular AI SaaS Platform

**Defined:** 2026-04-20
**Core Value:** Trade service businesses can build their own AI-powered operations platform by selecting only the modules they need.

## v1 Requirements

Requirements for initial modular SaaS platform. Each maps to roadmap phases.

### Platform Core

- [ ] **PCORE-01**: System supports multiple tenants (businesses) with isolated data
- [ ] **PCORE-02**: Each tenant has UUID v7 identifier stored in JWT claims
- [ ] **PCORE-03**: Tenant data isolated via dual-layer filtering (application WHERE + PostgreSQL RLS)
- [ ] **PCORE-04**: Platform uses AsyncLocalStorage for tenant context propagation
- [ ] **PCORE-05**: Database connection uses `set_config('app.current_tenant', id, TRUE)` for transaction-local scoping
- [ ] **PCORE-06**: All application queries use non-superuser `app_user` PostgreSQL role
- [ ] **PCORE-07**: System has module registry that auto-discovers modules at startup
- [ ] **PCORE-08**: Each module exports manifest with name, routePrefix, dependencies, and register() function
- [ ] **PCORE-09**: Modules load in dependency order (topological sort)
- [ ] **PCORE-10**: `requireModule()` middleware checks tenant has module active before allowing access

### Authentication & Tenants

- [ ] **AUTH-01**: New tenant owner can sign up with email and password
- [ ] **AUTH-02**: JWT tokens contain tenant_id and tenant_slug claims
- [ ] **AUTH-03**: Tenant login persists across browser refreshes
- [ ] **AUTH-04**: Tenant owner can invite team members with role-based permissions
- [ ] **AUTH-05**: Tenant slug is unique (used for subdomain routing if needed)
- [ ] **AUTH-06**: Password hashed with bcrypt
- [ ] **AUTH-07**: New tenant provisioning creates default seed data (pipeline stages, categories)

### Twenty CRM Integration

- [ ] **CRM-01**: Self-hosted Twenty CRM deployed via docker-compose
- [ ] **CRM-02**: Twenty configured with correct SERVER_URL before first boot
- [ ] **CRM-03**: Twenty PostgreSQL password uses hex-only characters (no special chars)
- [ ] **CRM-04**: Platform has `twenty-sync` module for API integration
- [ ] **CRM-05**: Custom objects created in Twenty: ServiceJob, HipagesLead, Quote
- [ ] **CRM-06**: Existing data migrated to Twenty (leads → People, appointments → ServiceJob, tasks → Tasks)
- [ ] **CRM-07**: Platform writes to Twenty via REST/GraphQL API (never direct SQL)
- [ ] **CRM-08**: Twenty webhooks configured to push events back to platform
- [ ] **CRM-09**: Platform verifies webhook HMAC signatures before processing

### Module: Hipages Leads

- [ ] **HIPLEADS-01**: Module scrapes hipages.com.au for trade service leads
- [ ] **HIPLEADS-02**: Scraper runs as separate container (Playwright/Chromium dependency)
- [ ] **HIPLEADS-03**: Scraped leads synced to Twenty as HipagesLead custom object
- [ ] **HIPLEADS-04**: Linked Person record created in Twenty for each lead
- [ ] **HIPLEADS-05**: Admin UI displays scraped leads with filtering and search
- [ ] **HIPLEADS-06**: Module requires tenant to have hipages credentials configured

### Module: AI Automated Quotes

- [ ] **QUOTES-01**: Module generates instant quotes from lead information
- [ ] **QUOTES-02**: AI pricing model calibrated for Canberra ACT suburb pricing
- [ ] **QUOTES-03**: Quote data synced to Twenty as Quote custom object
- [ ] **QUOTES-04**: Admin UI allows reviewing and editing AI-generated quotes
- [ ] **QUOTES-05**: Quote linked to Opportunity in Twenty for pipeline tracking

### Module: AI SEO Optimization

- [ ] **SEO-01**: Module analyzes business listing and generates SEO recommendations
- [ ] **SEO-02**: AI generates optimized business descriptions and keywords
- [ ] **SEO-03**: SEO scores tracked over time
- [ ] **SEO-04**: Recommendations stored in platform database

### Module: AI Content Generator

- [ ] **CONTENT-01**: Module generates social media content (Facebook/Instagram posts)
- [ ] **CONTENT-02**: AI generates business-specific content based on service offerings
- [ ] **CONTENT-03**: Content calendar UI for scheduling posts
- [ ] **CONTENT-04**: Usage tracking for content generation credits (if metered)
- [ ] **CONTENT-05**: Generated content stored for reuse

### Module: Competitor Analysis

- [ ] **COMP-01**: Module monitors competitor pricing and online presence
- [ ] **COMP-02**: Scrapes competitor websites and listings
- [ ] **COMP-03**: AI generates comparison insights and recommendations
- [ ] **COMP-04**: Analysis results stored and displayed in admin UI

### Billing

- [ ] **BILL-01**: Stripe products created for each module
- [ ] **BILL-02**: Each tenant has single Stripe subscription with one item per active module
- [ ] **BILL-03**: Checkout session allows selecting modules at signup
- [ ] **BILL-04**: 14-day free trial with no credit card required upfront
- [ ] **BILL-05**: Tenant can add modules mid-cycle with immediate proration charge
- [ ] **BILL-06**: Tenant can remove modules mid-cycle with credit on next invoice
- [ ] **BILL-07**: Proration preview shows charges before confirming changes
- [ ] **BILL-08**: `tenant_modules` database table tracks active entitlements
- [ ] **BILL-09**: Stripe webhooks sync subscription state to `tenant_modules` table
- [ ] **BILL-10**: `requireModule()` middleware queries `tenant_modules` table for access control
- [ ] **BILL-11**: Billing dashboard shows active modules and costs
- [ ] **BILL-12**: Stripe Customer Portal link for payment method and invoice management

### Module Management

- [ ] **MMGT-01**: Admin UI displays module catalog with descriptions and pricing
- [ ] **MMGT-02**: Tenant can toggle modules on/off (if billing enabled)
- [ ] **MMGT-03**: Module activation calls module.onTenantActivate() lifecycle hook
- [ ] **MMGT-04**: Module deactivation calls module.onTenantDeactivate() lifecycle hook
- [ ] **MMGT-05**: Active modules list cached per tenant (60s TTL)
- [ ] **MMGT-06**: Cache invalidated on module activation/deactivation

## v2 Requirements

Deferred to future release.

### Advanced Features

- [ ] **BILL-V2-01**: Metered billing for AI content module usage
- [ ] **CRM-V2-01**: Multiple Twenty instances per tenant (advanced isolation)
- [ ] **AUTH-V2-01**: Single sign-on (SSO) via Google/Microsoft
- [ ] **PCORE-V2-01**: Redis caching for multi-instance deployments

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Native mobile apps | Web-first, mobile-responsive design sufficient for v1 |
| White-label branding | Single brand (Revive SaaS Platform) for v1 |
| Stripe native Entitlements API | Build custom entitlement layer for more control |
| Real-time AI streaming | Batch processing sufficient for v1 |
| Per-module separate containers | All modules in single container (except scraper) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PCORE-01 to PCORE-10 | Phase 1 | Pending |
| AUTH-01 to AUTH-07 | Phase 1 | Pending |
| CRM-01 to CRM-09 | Phase 2 | Pending |
| HIPLEADS-01 to HIPLEADS-06 | Phase 3 | Pending |
| QUOTES-01 to QUOTES-05 | Phase 4 | Pending |
| SEO-01 to SEO-04 | Phase 5 | Pending |
| CONTENT-01 to CONTENT-05 | Phase 5 | Pending |
| COMP-01 to COMP-04 | Phase 6 | Pending |
| BILL-01 to BILL-12 | Phase 7 | Pending |
| MMGT-01 to MMGT-06 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 68 total
- Mapped to phases: 68
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after roadmap creation*
