# Architecture

**Analysis Date:** 2026-04-12

## Pattern Overview

**Overall:** Single-Page Application with separate API server — client-side rendered React frontend with a backend-for-frontend (BFF) Express API server. Production deploys as static assets via Nginx (frontend) with the Express server running independently for API endpoints.

**Key Characteristics:**
- React SPA with client-side routing (BrowserRouter in production, legacy HashRouter redirect in `index.html`)
- Flat component/service architecture (no nested domain folders)
- Dual runtime: ESM frontend (TypeScript/Vite) + CJS backend (CommonJS/Node)
- Graceful degradation: frontend works without backend (simulated booking, demo-mode Supabase)
- Service layer abstracts API calls with snake_case ↔ camelCase mappers
- Auth via JWT stored in localStorage, validated server-side with bcrypt

## Layers

### Presentation Layer (React Frontend)
- Purpose: UI rendering, routing, user interaction, SEO metadata injection
- Location: `pages/`, `components/`
- Contains: Route components, reusable UI components, layout, chat widget
- Depends on: `services/` (API calls), `contexts/` (auth state), `hooks/` (SEO)
- Used by: End users via browser

### Service Layer (Client-Side API Abstraction)
- Purpose: Abstract backend API calls, handle camelCase ↔ snake_case mapping, provide fallback behavior
- Location: `services/`
- Contains: `crmService.ts`, `bookingApiService.ts`, `emailService.ts`, `geminiService.ts`, `quoteService.ts`, `touchpointService.ts`
- Depends on: `types.ts` (domain models), localStorage (auth tokens)
- Used by: `pages/` components

### API Layer (Express Backend)
- Purpose: REST API endpoints, database operations, email sending, authentication
- Location: `server/api/`
- Contains: Route modules (`bookings.cjs`, `crm.cjs`, `auth.cjs`, `quotes.cjs`, `touchpoints.cjs`, `availability.cjs`, `queue.cjs`, `notifications.cjs`)
- Depends on: `server/lib/` (database, auth, email, queue)
- Used by: `services/` layer via fetch calls

### Infrastructure Layer (Server Libraries)
- Purpose: Database connection pooling, JWT auth, email delivery, retry queue
- Location: `server/lib/`
- Contains: `database.cjs`, `auth.cjs`, `email.cjs`, `queue.cjs`
- Depends on: `pg` (PostgreSQL), `bcryptjs`, `jsonwebtoken`, `resend`
- Used by: `server/api/` route modules

### State Layer (React Context)
- Purpose: Global auth state management
- Location: `contexts/AuthContext.tsx`
- Contains: AuthProvider, useAuth hook
- Depends on: localStorage (token persistence)
- Used by: `App.tsx` (wraps entire app), `components/ProtectedRoute.tsx`, `pages/LoginPage.tsx`, admin pages

### Shared Types Layer
- Purpose: Domain model definitions shared across frontend
- Location: `types.ts` (root level)
- Contains: Enums (`ServiceType`, `LeadStatus`, `QuoteStatus`), interfaces (`Lead`, `Appointment`, `Task`, `Campaign`, `ChatMessage`, `TeleQuoteSession`, `Quote`)
- Depends on: Nothing
- Used by: All layers (frontend only — server uses raw DB rows)

## Data Flow

### Booking Flow:
1. User fills form on `pages/BookingPage.tsx`
2. `services/bookingApiService.ts` → `submitBooking()` POSTs to `/api/bookings`
3. `server/api/bookings.cjs` validates input, creates lead + appointment + touchpoint in atomic transaction
4. `server/lib/email.cjs` sends confirmation email (Resend) + admin notification (non-blocking)
5. If DB fails, booking queued via `server/lib/queue.cjs` for retry
6. If API unavailable (static deployment), client simulates success with generated reference
7. User redirected to `/success` page

### Chat Flow (Riv AI Concierge):
1. User opens `components/ChatWidget.tsx` (floating button, bottom-right)
2. Message sent to `services/geminiService.ts` → `sendMessageToGemini()`
3. Direct fetch to Z.AI API (`https://api.z.ai/api/coding/paas/v4/chat/completions`)
4. System prompt includes Canberra ACT pricing matrix and service details
5. 10-message sliding window for context management
6. Response displayed in chat UI; service type detected and stored in localStorage

### Admin CRM Flow:
1. Admin logs in via `pages/LoginPage.tsx` → `server/api/auth.cjs` → JWT issued
2. Token stored in localStorage by `contexts/AuthContext.tsx`
3. Admin pages wrapped in `components/ProtectedRoute.tsx` (redirects to `/login` if no auth)
4. `services/crmService.ts` fetches leads/appointments/tasks from `/api/crm/*` with Bearer token
5. `server/api/crm.cjs` applies `authenticateToken` middleware to all routes
6. Data mapped from snake_case DB rows to camelCase TypeScript interfaces

### SEO Flow:
1. `seoConfig.ts` defines per-page SEO metadata (title, description, path, noindex)
2. `hooks/usePageSEO.ts` injects `<meta>` tags and canonical URL via DOM manipulation on mount
3. `components/SEOSchemas.tsx` injects JSON-LD structured data (FAQ, Service schemas)
4. `index.html` contains static LocalBusiness and Organization structured data
5. `public/sitemap.xml` and `public/robots.txt` for crawler guidance
6. `index.html` includes legacy hash-route redirect script (`#/page` → `/page`)

**State Management:**
- Auth state: React Context (`contexts/AuthContext.tsx`) with localStorage persistence
- Chat history: Module-level variable in `services/geminiService.ts` (not persisted)
- Booking form state: Local component state in pages
- Detected service: localStorage key `revive_last_detected_service`
- Pending touchpoints: localStorage key `revive_pending_touchpoints`

## Key Abstractions

**Service Page Template:**
- Purpose: Reusable template for all service pages, ensuring consistent layout and SEO structure
- Examples: `components/ServicePageTemplate.tsx`
- Pattern: Props-driven component accepting `hero`, `benefits`, `pricing`, `addOns`, `faqs`, `crossLinks`, `aeoIntro` config objects. Used by all `Service*.tsx` pages.

**API Service Pattern:**
- Purpose: Centralize HTTP calls with consistent error handling and response mapping
- Examples: `services/crmService.ts`, `services/quoteService.ts`, `services/touchpointService.ts`
- Pattern: Each service exports async functions that fetch from `API_BASE`, include auth headers from localStorage, map snake_case responses to camelCase, and return empty arrays/null on failure (graceful degradation).

**Protected Route:**
- Purpose: Guard admin routes, redirect unauthenticated users
- Examples: `components/ProtectedRoute.tsx`
- Pattern: Wrapper component that reads `AuthContext`, shows spinner while loading, redirects to `/login` with saved location state.

**Module-level Chat History:**
- Purpose: Maintain conversation context for AI chat without external state management
- Examples: `services/geminiService.ts` (`chatHistory` variable)
- Pattern: Module-scoped array truncated to 10 messages. Reset on `initializeChat()`.

## Entry Points

**Frontend Entry (Dev + Build):**
- Location: `index.html` → `index.tsx` → `App.tsx`
- Triggers: Browser loads page, Vite dev server or production Nginx serves `index.html`
- Responsibilities: Mount React app with StrictMode, wrap in AuthProvider, define routes, render Layout + ChatWidget

**Backend API Entry:**
- Location: `server/index.cjs`
- Triggers: `node server/index.cjs` (or via separate process)
- Responsibilities: Load env, configure Express middleware (CORS, JSON), mount 8 route modules, health check endpoint, 404/error handlers, listen on PORT

**Production Static Server (Alternative):**
- Location: `server.js`
- Triggers: `npm start` (or `node server.js`)
- Responsibilities: Serves `dist/` static files with SPA fallback (all routes → `index.html`). Used for Cloud Run or simple deployments.

**Docker Build:**
- Location: `Dockerfile`
- Triggers: `docker build`
- Responsibilities: Multi-stage build — Node 20 Alpine builds Vite app, Nginx Alpine serves static files with SPA routing config. Does NOT include the Express API server.

## Error Handling

**Strategy:** Graceful degradation with fallback behaviors at every layer.

**Patterns:**
- Frontend services return empty arrays/null on API failure (e.g., `crmService.ts` line 58: `catch { return []; }`)
- Client-side booking simulation when API is unavailable (`bookingApiService.ts` generates a reference)
- Server-side retry queue for failed DB writes (`server/lib/queue.cjs` with exponential backoff, max 5 retries, file persistence)
- Supabase client nullable — app works in "demo mode" when credentials missing (`lib/supabase.ts`)
- Content-type checking on every API response to handle Nginx returning HTML for SPA routes
- Chat widget catches errors and returns friendly fallback messages

## Cross-Cutting Concerns

**Logging:** Console.log/error throughout. Server-side request logging middleware in `server/index.cjs` logs method + path + timestamp. No structured logging framework.

**Validation:** Server-side input validation in `server/api/bookings.cjs` (regex for email, date format, min lengths). No shared validation library. Client-side relies on HTML form validation.

**Authentication:** JWT-based. Server: `bcryptjs` for password hashing, `jsonwebtoken` for token generation/verification, `authenticateToken` middleware. Client: localStorage token storage, `AuthContext` for global state, `ProtectedRoute` for route guards.

**SEO:** Per-page metadata via `hooks/usePageSEO.ts`, structured data via `components/SEOSchemas.tsx` and static JSON-LD in `index.html`, sitemap at `public/sitemap.xml`, robots.txt at `public/robots.txt`. Legacy hash-route redirect script in `index.html`.

**Email:** Resend API for transactional emails (`server/lib/email.cjs`). Customer confirmations + admin notifications. Rate-limit aware (600ms delay between sends).

---

*Architecture analysis: 2026-04-12*
