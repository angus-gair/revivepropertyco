# Phase 1: MVP Core Features - Context

**Gathered:** 2026-04-13
**Status:** Implementation Complete, Ready for Testing and Deployment

<domain>
## Phase Boundary

This phase delivers a functional Customer Portal with four core capabilities:
1. **Customer Authentication** - Registration and login using JWT tokens
2. **Profile Management** - View/edit personal details and change password
3. **Document Management** - Upload, download, and delete project files
4. **Quote Approval Workflow** - View, approve, and reject service quotes

**Implementation Status:**
- Database schema: ✅ Complete (migration scripts created)
- Backend APIs: ✅ Complete and deployed (auth, documents, quotes)
- Frontend pages: ✅ Complete (login, register, dashboard, profile, documents, quotes)
- Testing & Deployment: ⏸️ Pending (Tasks 1.10-1.12)

The customer portal is currently live in production at `https://revivepropertyco.au/customer/*`.

</domain>

<decisions>
## Implementation Decisions

### Authentication
- **D-01:** JWT token-based authentication (7-day expiry, 30-day with "Remember me")
- **D-02:** Mobile number as primary identifier, email as fallback (Australian context)
- **D-03:** Password hashing with bcrypt (10 salt rounds)
- **D-04:** Token storage in localStorage (`revive_customer_token`, `revive_customer_user`)
- **D-05:** Separate auth context from admin portal (`CustomerAuthContext` vs `AuthContext`)

### File Storage
- **D-06:** Local filesystem storage in `uploads/customers/{customer_id}/` (v1 approach)
- **D-07:** File size limit: 10 MB per file
- **D-08:** Allowed file types: PDF, images (JPG, PNG, GIF, WebP), documents (DOC, DOCX)
- **D-09:** Server-side file validation (type, size) and client-side validation
- **D-10:** Filename sanitization with timestamp prefix to prevent conflicts

### Quote Management
- **D-11:** Quote expiry: 30 days from issue date
- **D-12:** Quote statuses: PENDING, APPROVED, REJECTED, EXPIRED
- **D-13:** Approval/rejection requires confirmation dialog
- **D-14:** Rejection includes optional reason textarea
- **D-15:** PDF export via `/api/customer/quotes/:id/pdf` endpoint

### UI/UX
- **D-16:** Reused existing "Blueprint" aesthetic from admin portal
- **D-17:** Responsive design: mobile-first with hamburger menu
- **D-18:** Loading states: spinner during data fetching, progress bars for uploads
- **D-19:** Empty states: friendly messages with call-to-action buttons
- **D-20:** Error messages: dismissible alerts with specific guidance

### Code Organization
- **D-21:** Backend routes in `server/api/` with `.cjs` extension (CommonJS)
- **D-22:** Frontend pages in `pages/customer/` directory
- **D-23:** Service layer: `services/customerService.ts` for API abstraction
- **D-24:** Context provider: `contexts/CustomerAuthContext.tsx` for auth state
- **D-25:** Protected routes: `components/CustomerProtectedRoute.tsx` wrapper
- **D-26:** Layout components: `CustomerLayout.tsx` (header/footer), `CustomerNav.tsx` (navigation)

### Security
- **D-27:** Customer isolation: All queries include `WHERE customer_id = ?` 
- **D-28:** File uploads served through API with auth check (not direct file access)
- **D-29:** Input validation: parameterized SQL queries, whitelist file types
- **D-30:** Audit logging: all auth events and quote actions logged to `audit_log` table

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `.planning/codebase/ARCHITECTURE.md` — Overall system architecture and data flow
- `server/migrations/001_create_customer_portal_tables.sql` — Customer portal tables definition
- `server/migrations/README.md` — Migration documentation and procedures

### API Endpoints
- `server/api/customer.cjs` — Customer authentication and profile endpoints
- `server/api/customerDocuments.cjs` — Document upload/download/delete endpoints
- `server/api/customerQuotes.cjs` — Quote listing, details, approval, rejection endpoints
- `server/lib/auth.cjs` — JWT token generation and validation (reused from admin portal)

### Frontend Components
- `pages/customer/LoginPage.tsx` — Customer login form with mobile/email support
- `pages/customer/RegisterPage.tsx` — Customer registration with validation
- `pages/customer/DashboardPage.tsx` — Customer dashboard with stats and activity
- `pages/customer/DocumentsPage.tsx` — File upload with drag-and-drop and filtering
- `pages/customer/ProfilePage.tsx` — Profile editing and password change
- `pages/customer/QuotesPage.tsx` — Quote viewing, approval, rejection workflow
- `components/CustomerLayout.tsx` — Header, navigation, and footer wrapper
- `components/CustomerProtectedRoute.tsx` — Authentication guard component
- `contexts/CustomerAuthContext.tsx` — Auth state management for customers

### Service Layer
- `services/customerService.ts` — Customer API service layer (auth, profile, documents, quotes)
- `types.ts` — TypeScript interfaces for Customer, CustomerDocument, CustomerQuote

### Design Reference
- `revive-client-portal-main/src/App.tsx` — Template design for UI/UX patterns (referenced in ROADMAP.md tasks 1.6-1.9)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **AuthContext pattern** (`contexts/AuthContext.tsx`) — Reused for customer auth with separate keys
- **ProtectedRoute component** (`components/ProtectedRoute.tsx`) — Adapted for customer portal
- **Service layer pattern** (`services/crmService.ts`) — Followed for `customerService.ts`
- **JWT middleware** (`server/lib/auth.cjs`) — Reused `authenticateToken` function
- **Database helpers** (`server/lib/database.cjs`) — Reused query/transaction functions
- **Tailwind CSS patterns** — Same utility classes, color palette, spacing as admin portal

### Established Patterns
- **State management:** React `useState` exclusively, no external state library
- **Form handling:** Object-based state with spread updates: `setFormData({...formData, field: value})`
- **Error handling:** Try/catch in services, user-friendly error messages in UI
- **API client:** Fetch with auth header from localStorage, content-type validation
- **DB mapping:** snake_case ↔ camelCase mapper functions (e.g., `mapCustomer`)
- **File uploads:** Multer middleware with validation, serving through authenticated endpoints
- **Routing:** HashRouter for SPA routing (compatibility with nginx reverse proxy)

### Integration Points
- **Express app:** `server/index.cjs` — Customer routes mounted at `/api/customer/*`
- **App.tsx routing:** Customer routes wrapped in `CustomerProtectedRoute` and `CustomerLayout`
- **Database:** Shared PostgreSQL connection pool via `server/lib/database.cjs`
- **Types:** Customer interfaces added to `types.ts` alongside existing Lead, Appointment, Quote types
- **SEO:** Customer portal routes use `noindex: true` (private authenticated area)

</code_context>

<specifics>
## Specific Ideas

### Template-Based Design (Tasks 1.6-1.9)
The ROADMAP.md explicitly references `revive-client-portal-main/src/App.tsx` as the visual template for the customer portal UI. This template demonstrates:
- Modern card-based layout with motion animations (framer-motion style)
- Monochrome status badges and high-contrast "blueprint" aesthetic
- Document filtering and sorting controls
- Drag-and-drop file upload with progress tracking
- Line item tables for quote details
- Floating back button for navigation

**Note:** The implementation follows this template's visual patterns while using Tailwind CSS v4 (the template may use a different styling approach).

</specifics>

<deferred>
## Deferred Ideas

### Phase 2 Considerations
The following features were explicitly deferred from Phase 1 (per PROJECT.md and ROADMAP.md):
- Communication hub (message history with support team)
- Video consultation scheduling (Google Meet integration)
- Real-time notifications
- Project timeline tracking
- Payment processing (Stripe integration)
- Cloud object storage migration (Cloudflare R2)

### Technical Debt for Future Phases
- Consider migration from localStorage to httpOnly cookies for enhanced XSS protection
- Implement token refresh mechanism to avoid frequent re-authentication
- Add comprehensive automated testing (unit tests, integration tests)
- Implement proper logging framework (currently using console methods)
- Consider CDN for document assets in Phase 2 when scaling

</deferred>

---

*Phase: 01-mvp-core-features*
*Context gathered: 2026-04-13*
