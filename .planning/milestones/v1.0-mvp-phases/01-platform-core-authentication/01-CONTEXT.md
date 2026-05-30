# Phase 1: Platform Core & Authentication - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers a multi-tenant SaaS platform foundation with four core capabilities:
1. **Multi-tenant Architecture** - Shared PostgreSQL database with tenant_id isolation
2. **Tenant Registration** - Sign-up flow for new trade service businesses
3. **Authentication System** - JWT-based auth with tenant awareness
4. **Module System Foundation** - Enable/disable modules per tenant

**Implementation approach:**
- Build platform core first (Phase 1)
- Migrate existing data in Phase 2 (Twenty CRM integration)
- Revive Property Co. becomes the first tenant after migration

</domain>

<decisions>
## Implementation Decisions

### Multi-tenancy Strategy
- **D-01:** Shared PostgreSQL database with tenant_id column pattern
- **D-02:** Dual-layer isolation: application-level WHERE clauses + PostgreSQL Row-Level Security (RLS)
- **D-03:** tenant_id included in all tenant-specific tables as first column
- **D-04:** Tenant provisioning creates default seed data (pipeline stages, categories)

### Data Migration Approach
- **D-05:** Phase 1 builds foundation WITHOUT migrating existing data
- **D-06:** Phase 2 handles Twenty CRM integration and data migration
- **D-07:** Schema-only migration with dummy data for Revive tenant (not production data)
- **D-08:** Existing Revive CRM remains operational until Phase 2 cutover

### Module System
- **D-09:** Module discovery via manifest system at startup
- **D-10:** Module activation per tenant (enabled/disabled flags in tenant_modules table)
- **D-11:** Billing integration deferred to Phase 7

### Authentication
- **D-12:** JWT tokens include tenant_id claim
- **D-13:** Tenant owners can invite team members with role-based permissions
- **D-14:** Existing auth patterns reused (JWT with bcrypt, localStorage tokens)

### Claude's Discretion
- Multi-tenancy implementation details (RLS policies, migration scripts)
- Module manifest format and loading mechanism
- Team invitation flow and permission system design
- Seed data structure for new tenants

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` — Full 7-phase roadmap with dependencies
- `.planning/SAAS-PLATFORM.md` — Platform vision and key decisions
- `.planning/REQUIREMENTS.md` — Original customer portal requirements (deprecated, for reference only)

### Architecture
- `.planning/codebase/ARCHITECTURE.md` — Existing system architecture
- `App.tsx` — Current routing and application structure
- `types.ts` — Existing TypeScript type definitions

### Existing Auth (for reference)
- `contexts/AuthContext.tsx` — Admin portal auth pattern
- `pages/LoginPage.tsx` — Current login implementation
- `server/lib/auth.cjs` — JWT token generation and validation

### Database
- Existing tables to reference for schema design: leads, appointments, tasks, quotes
- `server/lib/database.cjs` — PostgreSQL connection pool pattern

### Twenty CRM (for Phase 2 prep)
- Twenty CRM documentation: https://docs.twenty.com
- Twenty REST API reference
- Twenty GraphQL API reference

No external specs specific to Phase 1 — requirements captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **AuthContext pattern** (`contexts/AuthContext.tsx`) — JWT auth with localStorage, can be adapted for tenant awareness
- **ProtectedRoute component** (`components/ProtectedRoute.tsx`) — Route guarding pattern
- **JWT middleware** (`server/lib/auth.cjs`) — Token generation/validation with bcrypt
- **Database helpers** (`server/lib/database.cjs`) — Connection pooling, query functions
- **Tailwind CSS v4** — Same styling system for consistency

### Established Patterns
- **State management:** React useState exclusively, no external state library
- **API client:** Fetch with auth header from localStorage
- **DB mapping:** snake_case ↔ camelCase mapper functions
- **Routing:** HashRouter for SPA compatibility with nginx reverse proxy
- **Form handling:** Object-based state with spread updates

### Integration Points
- **Express app:** `server/index.cjs` — Platform routes will be mounted here
- **App.tsx routing:** New platform routes alongside existing admin/customer routes
- **Database:** Shared PostgreSQL connection (will add tenant_id columns)
- **Types:** Platform types added to `types.ts` (Tenant, Module, UserRole, etc.)

### New Components Needed
- Tenant registration pages
- Platform admin dashboard (for tenant management)
- Module activation interface
- Team invitation flow

</code_context>

<specifics>
## Specific Ideas

### Migration Sequence
1. Phase 1: Build platform with fresh schema (tenants, users, tenant_modules, etc.)
2. Phase 2: Deploy Twenty CRM, migrate schema + dummy data for Revive tenant
3. Phase 2: Build API sync layer between platform and Twenty
4. After validation: Migrate actual production data and cutover

### Tenant Isolation Strategy
- All tenant-specific queries include: `WHERE tenant_id = ?`
- RLS policies enforce at database level (defense in depth)
- Application middleware validates tenant_id from JWT token

### Module Registration
- Each module has a manifest.json at startup
- Platform reads manifests and registers available modules
- Tenants can enable/disable modules through billing/admin UI

</specifics>

<deferred>
## Deferred Ideas

### Phase 2 Considerations
- Twenty CRM integration and deployment
- Data migration from existing CRM to Twenty
- API sync layer between platform and Twenty

### Phase 3+ Considerations
- Hipages Leads Module (first module implementation)
- AI Quotes Module
- AI SEO & Content Modules
- Competitor Analysis Module
- Billing & Module Management (Phase 7)

### Technical Debt for Future Phases
- Consider migrating from localStorage to httpOnly cookies for enhanced XSS protection
- Implement token refresh mechanism
- Add comprehensive automated testing
- Implement proper logging framework
- Consider CDN for static assets

</deferred>

---

*Phase: 01-platform-core-authentication*
*Context gathered: 2026-04-20*
