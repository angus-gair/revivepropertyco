# Modular AI SaaS Platform for Trade Services

## What This Is

A multi-tenant SaaS platform that enables trade service businesses (plumbers, landscapers, cleaners, etc.) to select and activate AI-powered modules à la carte. The platform integrates with Twenty CRM as the central data hub, with each AI module connecting via API to enrich customer data.

## Core Value

Trade service businesses can build their own AI-powered operations platform by selecting only the modules they need — pay for what you use, nothing more.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Twenty CRM Integration** — Self-hosted Twenty as central CRM with API-based sync layer
- [ ] **Data Migration** — Migrate all existing leads, appointments, tasks from current CRM to Twenty
- [ ] **Multi-Tenant Architecture** — Shared database with tenant_id isolation for multiple businesses
- [ ] **Module System** — Enable/disable modules per tenant with billing integration
- [ ] **Hipages Leads Module** — First module: scrape hipages leads, sync to Twenty
- [ ] **AI Quotes Module** — Generate quotes from lead data using AI
- [ ] **AI SEO Module** — Optimize business listings and content for search
- [ ] **AI Content Module** — Generate social media content (Facebook/Instagram)
- [ ] **Competitor Analysis Module** — Analyze competitors and suggest improvements
- [ ] **Billing System** — Per-module pricing with subscription management

### Out of Scope

- **Native mobile apps** — web-first, mobile-responsive (defer to v2)
- **White-labeling** — single brand initially (Revive SaaS Platform)
- **Custom module development** — customers select from catalog only
- **Real-time AI streaming** — batch processing sufficient for v1

## Context

**Current State:**
- Revive Property Co. website with built-in simple CRM
- PostgreSQL database with leads, appointments, tasks
- Working hipages lead scraper (standalone, not integrated)
- Express.js backend, React frontend, Tailwind CSS v4

**Planned Changes:**
1. Remove built-in CRM, replace with self-hosted Twenty CRM
2. Migrate all existing data to Twenty
3. Build modular platform architecture around Twenty
4. Transform hipages scraper into first module
5. Add AI-powered modules as additional products

**Target Customer:**
- Trade service businesses in Australia (starting with Canberra ACT)
- 1-20 employees
- Currently using manual processes or basic tools
- Want AI automation but can't afford enterprise solutions

## Constraints

- **Tech Stack**: Must work with existing PostgreSQL, Express.js, React, Docker
- **Deployment**: Homelab environment (Ubuntu), Traefik reverse proxy, Cloudflare DNS
- **Budget**: Bootstrapped, minimal infrastructure costs initially
- **Timeline**: Twenty integration first, then modular platform build-out
- **Data Migration**: Must preserve all existing data without data loss

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Twenty CRM vs build vs buy | Open source, self-hostable, API-first, modern stack | — Pending evaluation |
| Shared DB multi-tenancy | Proven pattern, simpler ops, cost-effective | — Pending verification |
| Modular monolith architecture | Clear boundaries, simple deployment, can split to microservices later | — Pending implementation |
| Per-module pricing | Customers pay for what they use, flexible for different business sizes | — Pending validation |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

*Last updated: 2026-04-20 after initialization*
