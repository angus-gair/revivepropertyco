# Revive Property Co. - Customer Portal

**Project Type:** Brownfield Feature Addition
**Init Date:** 2026-04-13
**Status:** Active Development

## Overview

Revive Property Co. is a property services company serving Canberra ACT, offering services like pressure washing, garden maintenance, rubbish removal, and more. The existing website includes public booking pages, an AI chat concierge ("Riv"), and an admin CRM portal.

**New Initiative:** Build a Customer Portal to enable self-service account management, document handling, and quote approval workflows.

## Business Context

**Target Audience:** Residential and commercial property customers in Canberra ACT who have booked or inquired about services.

**Problem Being Solved:** Currently, customers have no direct access to their booking information, quotes, or project documents. All communication flows through email/phone, creating friction for both customers and staff.

**Success Metrics:**
- Customer adoption rate (portal registrations vs total bookings)
- Reduction in phone/email inquiries for status updates
- Quote approval turnaround time
- Customer satisfaction scores (NPS)

## Technical Context

**Existing Stack:**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Express.js (CommonJS) + PostgreSQL (pg library)
- **Auth:** JWT tokens with bcrypt (server-side), localStorage (client-side)
- **Deployment:** Docker multi-stage build (Node builder → nginx alpine), Traefik reverse proxy
- **Infrastructure:** Homelab environment (Ubuntu server), Cloudflare DNS

**Current Limitations:**
- Static nginx deployment in production (no Express server accessible)
- All API endpoints currently return HTML instead of JSON in production
- Admin portal uses client-side auth fallback for static deployment

**Deployment Strategy:**
- Build and test locally with full Express server
- Production will need routing updates to proxy `/api/*` to Express backend
- Alternatively, run Express server as separate container behind Traefik

## Architecture Principles

**Consistency:** Customer portal should match existing admin portal patterns:
- JWT auth with localStorage persistence
- Protected routes with `ProtectedRoute` component
- Service layer pattern (`crmService.ts`, `bookingApiService.ts`)
- CamelCase ↔ snake_case mapping for DB rows
- Tailwind CSS "Blueprint" aesthetic

**Security:**
- Customer accounts must be isolated (can only access their own data)
- File upload validation (type, size limits)
- Proper authentication on all customer endpoints
- Password hashing with bcrypt
- SQL injection prevention (whitelist column names)

**Scalability Considerations:**
- Local filesystem storage for v1 (simple implementation)
- Plan migration path to Cloudflare R2 for future scalability
- Database indexes on customer_id for fast queries
- Consider CDN for static document assets

## Project Goals

### Phase 1 (MVP) - Core Features
1. **Authentication System**
   - Customer login/registration
   - Mobile number as primary identifier
   - Email as fallback identifier
   - JWT token management (matching admin portal pattern)

2. **Customer Profile Management**
   - View and edit personal details
   - Update contact information (mobile, email, address)
   - Change password

3. **Document Management**
   - Upload files/images related to projects
   - View and download documents
   - File type validation (images, PDFs, common document formats)
   - Local filesystem storage (`uploads/customers/{customer_id}/`)

4. **Quote Approval Workflow**
   - View pending quotes
   - Review quote details (line items, pricing, terms)
   - Approve or reject quotes
   - View quote history

### Phase 2 (Future Enhancements)
- Communication hub (message history with support team)
- Video consultation scheduling/joining (Google Meet integration)
- Real-time notifications
- Project timeline tracking
- Payment processing

## Key Constraints

**Development Environment:**
- Must work locally with full Express server
- No breaking changes to existing public pages or admin portal
- Test thoroughly before deployment

**Deployment Environment:**
- Production currently static-only (nginx)
- Will require infrastructure changes to enable Express API
- Plan for smooth migration path

**Timeline:**
- Build and test locally first
- Deploy to production after QA
- User testing on live site before signoff

## Stakeholders

**Primary:**
- Angus (Owner/Developer) - Technical decision-maker
- Customers (End users) - Feature beneficiaries

**Secondary:**
- Admin staff - Will manage customer accounts and handle escalations

## Related Documentation

- **Architecture:** `.planning/codebase/ARCHITECTURE.md`
- **Concerns:** `.planning/codebase/CONCERNS.md`
- **Existing Types:** `types.ts` (Lead, Appointment, Quote, etc.)
- **Auth Implementation:** `contexts/AuthContext.tsx`, `pages/LoginPage.tsx`, `server/lib/auth.cjs`

## Success Criteria

**Functional:**
- Customers can register with mobile number or email
- Login works consistently across sessions
- File uploads complete successfully and are retrievable
- Quote approval workflow is intuitive and reliable

**Non-Functional:**
- Page load times < 2 seconds
- Mobile-responsive design works on all devices
- No security vulnerabilities (SQL injection, XSS, file upload exploits)
- Error messages are clear and actionable

**Deployment:**
- Local development environment stable
- Production deployment successful
- User testing confirms all features work as expected

## Current Milestone: v1.1-opportunities CRM Opportunity Integration

**Goal:** Enable promoting scraped Hipages leads directly to Twenty CRM Opportunities from the admin dashboard, preserving all relevant data.

**Target features:**
- Lead promote API endpoint to create standard CRM Opportunity linked to Person.
- Complete data mapping from Hipages lead details (posted date, location, description, value/credits, category) to Opportunity fields.
- UI Promote action in the contractors leads page indicating sync status and direct link.
- E2E testing using Playwright to verify the flow.

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

*Project initialized: 2026-04-13*
*Last updated: 2026-05-30*

