# Codebase Concerns

**Analysis Date:** 2026-04-12

## Tech Debt

### Stub/Placeholder CRM Functions
- Issue: 7 exported functions in `crmService.ts` are empty stubs returning empty values — no real implementations
- Files: `services/crmService.ts` (lines 177–184)
- Impact: `getCampaigns`, `getSessionById`, `updateTeleQuoteSession`, `getAvailableSlots`, `bookAppointment`, `bulkUpdateLeadStatus`, `updateAppointment`, and `deleteAppointment` silently do nothing. Any code calling them gets empty/mock data back
- Fix approach: Implement each function with real API calls to `server/api/` endpoints. The backend `crm.cjs` already has task CRUD — model other endpoints after it

### Simulated Email Service (Client-Side)
- Issue: `emailService.ts` pretends to send emails by logging to `console.log` with a 1.5s timeout. Never actually delivers
- Files: `services/emailService.ts` (full file)
- Impact: Customer never receives booking confirmation from client-side path. The server-side `server/lib/email.cjs` uses Resend properly — only the client fallback is broken
- Fix approach: Remove `emailService.ts` entirely. All email sending should go through the server API (`server/lib/email.cjs`)

### Client-Side Booking Fallback
- Issue: `bookingApiService.ts` silently simulates a successful booking when the API is unreachable, generating a fake reference number
- Files: `services/bookingApiService.ts` (lines 83–91)
- Impact: User sees "success" with a fake reference (`REV-{random}`). No data is persisted. Booking is lost silently
- Fix approach: Instead of faking success, show a clear error or queue the submission locally with a "pending" indicator until the backend is reachable

### Hardcoded API Key in Source
- Issue: A default Z.AI API key is hardcoded as a fallback in `geminiService.ts` line 3
- Files: `services/geminiService.ts` line 3: `'70f80ec6e2904f14bc93e6bc40f48338.9OZMUYo3ET2EYxRn'`
- Impact: If `VITE_API_KEY` env var is missing, the hardcoded key ships in the production bundle. Anyone inspecting the JS can extract it
- Fix approach: Remove the fallback. Fail loudly if `VITE_API_KEY` is not configured. Consider moving chat API calls through the backend server to keep keys server-side

### `process.env` Used in Client Components
- Issue: `AdminTeleQuote.tsx` and `LandingPage.tsx` use `process.env.API_KEY` and `new GoogleGenAI({ apiKey: process.env.API_KEY })` — `process.env` is undefined in browser. Should be `import.meta.env.VITE_*`
- Files: `pages/AdminTeleQuote.tsx` (lines 138, 146, 174, 206, 218, 250), `pages/LandingPage.tsx` (lines 88, 94)
- Impact: Video generation features silently fail in the browser. The GoogleGenAI SDK will get `undefined` for the API key
- Fix approach: Replace all `process.env.API_KEY` with `import.meta.env.VITE_GOOGLE_API_KEY` or route through the backend

### Supabase Client Uses Wrong Env Access
- Issue: `lib/supabase.ts` uses `process.env.SUPABASE_URL` and `process.env.SUPABASE_KEY` instead of `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_KEY`
- Files: `lib/supabase.ts` (lines 5–6)
- Impact: Supabase client is always `null` in the browser, making `isSupabaseConfigured()` return `false`. Auth features silently disabled
- Fix approach: Change to `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_KEY`

### Excessive `as any` Type Casting
- Issue: 17 instances of `as any` across the codebase, bypassing TypeScript's type safety
- Files: `pages/AdminDashboard.tsx` (lines 207, 244, 251), `pages/AdminTeleQuote.tsx` (lines 162, 235, 282), `pages/LoginPage.tsx` (lines 23, 53), `pages/BookingPage.tsx` (line 365), `pages/LandingPage.tsx` (line 98), `services/crmService.ts` (lines 13, 28, 40, 93, 179–183)
- Impact: Runtime type errors are possible since the compiler cannot catch mismatches
- Fix approach: Create proper type definitions for DB row shapes (e.g., `DbLead`, `DbAppointment`, `DbTask`). Use proper event typing (`React.ChangeEvent<HTMLSelectElement>`)

### No State Management Architecture
- Issue: Each page component manages its own data fetching, loading state, and error handling with `useState` + `useEffect`. No shared state layer
- Files: `pages/AdminDashboard.tsx`, `pages/AdminTeleQuote.tsx`, `pages/BookingPage.tsx` — all follow the same pattern of local fetch + local state
- Impact: Data is refetched on every page navigation. No cache invalidation strategy. `loadData()` is called manually after every mutation in `AdminDashboard.tsx`
- Fix approach: Introduce a lightweight data layer (React Query / TanStack Query or a custom hook pattern) to centralize fetching, caching, and revalidation

## Known Bugs

### Admin Dashboard Refreshes All Data After Every Mutation
- Symptoms: Creating, toggling, or deleting a task calls `getTasks()` again, re-fetching the entire list. Same for `handleUpdateLeadStatus` calling `loadData()`
- Files: `pages/AdminDashboard.tsx` (lines 82, 102–103, 114–115, 126–127)
- Trigger: Any CRUD action in the admin panel
- Workaround: Functional but causes unnecessary network requests and loading flicker

### "Transmit Email Brief" Button Does Nothing
- Symptoms: The "Transmit Email Brief" button in the lead inspector has no `onClick` handler
- Files: `pages/AdminDashboard.tsx` (lines 492–494)
- Trigger: Clicking the button
- Workaround: None — feature is non-functional

### "Purge Entry" Button Disabled With No Implementation
- Symptoms: The "Purge Entry" (archive) button in the lead detail panel is styled as disabled with `cursor-not-allowed`
- Files: `pages/AdminDashboard.tsx` (lines 501–503)
- Trigger: Attempting to click
- Workaround: None

### Stats Tab Shows Hardcoded Values
- Symptoms: "Lead Conversion Rate: 62%", "Booking Efficiency: 88%", "ACT Market Share: 14%" are static strings, not computed from real data
- Files: `pages/AdminDashboard.tsx` (lines 555–558)
- Trigger: Navigating to the Stats tab
- Workaround: None — the data shown is fictional

### `window.aistudio` Is Undefined in Production
- Symptoms: `AdminTeleQuote.tsx` references `window.aistudio?.hasSelectedApiKey` and `window.aistudio?.openSelectKey` — this is a Google AI Studio extension API that only exists in the AI Studio IDE, not in production browsers
- Files: `pages/AdminTeleQuote.tsx` (lines 101–102, 121–122)
- Trigger: Loading the TeleQuote admin page in a normal browser
- Workaround: The optional chaining (`?.`) prevents crashes, but API key management is broken outside AI Studio

## Security Considerations

### Hardcoded Database URL in Source
- Risk: Full PostgreSQL connection string with credentials is hardcoded in `database.cjs` line 4
- Files: `server/lib/database.cjs` (line 4)
- Current mitigation: Uses `process.env.DATABASE_URL` with a fallback containing real credentials
- Recommendations: Remove the hardcoded fallback. Fail if `DATABASE_URL` is not set. The DB password should never be in source code

### `.env` Files Not in `.gitignore`
- Risk: `.env`, `.env.production` are not listed in `.gitignore`, meaning they could be committed to the repository
- Files: `.gitignore` — missing `.env*` entries
- Current mitigation: Unknown if these files are already tracked in git history
- Recommendations: Add `.env`, `.env.*`, `!.env.example`, `!.env.production.example` to `.gitignore`. Audit git history for leaked secrets

### Client-Side Admin Authentication (No Real Auth)
- Risk: `LoginPage.tsx` validates credentials entirely client-side using build-time env vars. The "token" is just `btoa()` (base64) of a JSON object — not cryptographically signed
- Files: `pages/LoginPage.tsx` (lines 10–11, 46–49), `contexts/AuthContext.tsx`
- Current mitigation: `ProtectedRoute` component checks for user existence in context
- Recommendations: The server-side auth in `server/lib/auth.cjs` with JWT + bcrypt is correct. The client should call `POST /api/auth/login` instead of validating locally. The current implementation means anyone can bypass auth by setting `localStorage.setItem('revive_admin_token', '...')` and `localStorage.setItem('revive_admin_user', '...')`

### Default JWT Secret
- Risk: `auth.cjs` line 5 falls back to `'default-secret-change-in-production'` if `JWT_SECRET` env var is missing
- Files: `server/lib/auth.cjs` (line 5)
- Current mitigation: None — if env var is not set, anyone who knows the default can forge tokens
- Recommendations: Fail application startup if `JWT_SECRET` is not configured

### No Rate Limiting on API Endpoints
- Risk: All API routes (`/api/bookings`, `/api/auth/login`, `/api/crm/*`) have no rate limiting. Login endpoint is vulnerable to brute force
- Files: `server/index.cjs` — no rate limiting middleware installed
- Current mitigation: None
- Recommendations: Add `express-rate-limit` to `server/index.cjs`. Apply stricter limits to `/api/auth/login` (e.g., 5 attempts per minute)

### No Security Headers
- Risk: No Helmet middleware, no CSP, no X-Frame-Options, no X-XSS-Protection headers
- Files: `server/index.cjs` — only `cors` middleware is applied
- Current mitigation: None
- Recommendations: Add `helmet` package to Express server for baseline security headers

### Dynamic SQL Construction (SQL Injection Risk)
- Risk: `crm.cjs` constructs SQL UPDATE queries dynamically using `Object.keys(req.body)` for column names. While values are parameterized, column names are NOT sanitized
- Files: `server/api/crm.cjs` (lines 64–68, 113–115)
- Current mitigation: Values use parameterized queries (`$1`, `$2`), preventing classic SQL injection
- Recommendations: Whitelist allowed column names before constructing the SET clause. Example: `const allowedKeys = ['first_name', 'last_name', 'status', 'notes']; const safeKeys = keys.filter(k => allowedKeys.includes(k));`

### Email HTML Injection
- Risk: User-supplied data (firstName, address, message) is interpolated directly into HTML emails without sanitization in `email.cjs`
- Files: `server/lib/email.cjs` (lines 35–43, 83–101, 117)
- Current mitigation: None
- Recommendations: Sanitize all user input before embedding in HTML. Use a template engine or escape HTML entities

## Performance Bottlenecks

### N+1 Touchpoint Association
- Problem: `associateTouchpoints()` sends one HTTP request per pending touchpoint sequentially
- Files: `services/touchpointService.ts` (lines 80–92)
- Cause: Sequential `for...of` loop with `await fetch()` inside
- Improvement path: Batch all touchpoints into a single POST request, or use `Promise.all()` for parallel requests

### Full Data Reload After Every Mutation
- Problem: `AdminDashboard.tsx` calls `loadData()` (fetching leads, appointments, and tasks) or `getTasks()` after every single mutation
- Files: `pages/AdminDashboard.tsx` (lines 82, 102–103, 114–115, 126–127)
- Cause: No local state update — data is re-fetched from server instead of optimistically updating
- Improvement path: Update local state after successful mutations. Only refetch on explicit refresh or polling interval

### Module-Level `chatHistory` Singleton
- Problem: `geminiService.ts` stores chat history in a module-level `let` variable, shared across ALL users in the same browser tab
- Files: `services/geminiService.ts` (line 11)
- Cause: Single mutable array at module scope — not scoped per session or user
- Improvement path: Store history per session (e.g., keyed by a session ID) or move to React state in `ChatWidget.tsx`

### No Lazy Loading for Admin Pages
- Problem: All page components (including heavy ones like `AdminTeleQuote.tsx` at 762 lines and `AdminDashboard.tsx` at 589 lines) are eagerly imported in `App.tsx`
- Files: `App.tsx` (lines 5–27)
- Cause: Static `import` statements bundle everything into the initial chunk
- Improvement path: Use `React.lazy()` + `Suspense` for admin pages and service detail pages to reduce initial bundle size

## Fragile Areas

### CRM Service Data Mapping
- Files: `services/crmService.ts` (lines 13–47)
- Why fragile: `mapLead`, `mapAppointment`, and `mapTask` use `as any` typed params and cast DB column names. If the DB schema changes (column rename, new column), the mapper silently breaks — fields become `undefined` with no TypeScript error
- Safe modification: Create proper `DbLead`, `DbAppointment`, `DbTask` interfaces matching the DB schema. Use explicit field mapping with type checking
- Test coverage: None

### Booking Flow (End-to-End)
- Files: `pages/BookingPage.tsx` → `services/bookingApiService.ts` → `server/api/bookings.cjs` → `server/lib/email.cjs`
- Why fragile: Three different paths: (1) real API succeeds, (2) API returns validation error, (3) API is unreachable → fake success. Path (3) is the default in production (static nginx deployment has no backend)
- Safe modification: Test all three paths explicitly. Ensure the production deployment actually routes `/api/*` to the Express server
- Test coverage: E2E test exists (`tests/e2e-live-test.spec.ts`) but coverage is unclear

### Authentication Flow (Dual System)
- Files: Client-side: `pages/LoginPage.tsx`, `contexts/AuthContext.tsx`, `components/ProtectedRoute.tsx`. Server-side: `server/api/auth.cjs`, `server/lib/auth.cjs`
- Why fragile: Two completely separate auth systems exist. Client-side uses hardcoded env var comparison + base64 "tokens". Server-side uses JWT + bcrypt + PostgreSQL. The client-side system bypasses the server entirely
- Safe modification: Remove client-side auth logic. Route all login through `POST /api/auth/login`
- Test coverage: None

## Scaling Limits

### localStorage for State Persistence
- Current capacity: ~5–10MB per origin (browser-dependent)
- Limit: Multiple localStorage keys store growing data: `revive_pending_touchpoints` (array grows unbounded), `revive_last_detected_service`, `revive_admin_token`, `revive_admin_user`, `revive_auth_token`
- Scaling path: The touchpoints array has no maximum size. Over time, it can approach localStorage limits. Add a max entry count or use IndexedDB for larger data

### No Database Connection Pooling Configuration
- Current capacity: `max: 20` connections in `pg.Pool`
- Limit: No query timeout configured. Long-running queries can exhaust the pool
- Scaling path: Add `statement_timeout` to pool config and query-level timeouts

### Single-Region Deployment
- Current capacity: Single server behind Traefik reverse proxy
- Limit: No horizontal scaling, no load balancing, no CDN for static assets
- Scaling path: Container orchestration (Docker Swarm / Kubernetes) with nginx serving as CDN edge for static assets

## Dependencies at Risk

### `get-shit-done-cc` (GSD)
- Risk: Appears to be a development workflow tool bundled in production dependencies
- Impact: Unnecessary production bundle bloat. If the package has post-install scripts, potential security risk
- Migration plan: Move to `devDependencies` or remove entirely from `package.json`

### `react-router-dom` v7
- Risk: Major version upgrade from v6. May have breaking changes in routing behavior
- Impact: HashRouter behavior may differ. Future upgrades could break existing patterns
- Migration plan: Pin the exact version. Review v7 migration guide for deprecations

### `@google/genai` SDK
- Risk: Relatively new SDK (`^1.31.0`). API surface may change. Used for video generation in `AdminTeleQuote.tsx`
- Impact: Video generation features could break with minor version updates
- Migration plan: Pin exact version. Abstract behind a service interface to isolate SDK changes

## Missing Critical Features

### No Form Validation on Booking Page (Client-Side)
- Problem: Booking form fields have no client-side validation beyond `required` attributes. Email format, phone format, address length are only validated server-side
- Files: `pages/BookingPage.tsx` (input fields at lines 439–475)
- Blocks: Immediate user feedback on invalid input

### No Error Boundary
- Problem: No React error boundary component. Any render error crashes the entire app
- Files: `App.tsx` — no error boundary wrapping
- Blocks: Graceful error recovery, user-friendly error messages

### No Loading Skeletons/Placeholders
- Problem: Admin pages show a spinner or blank screen during data loading. No skeleton UI
- Files: `pages/AdminDashboard.tsx` (lines 169–178), `pages/AdminTeleQuote.tsx`
- Blocks: Perceived performance improvement, better UX during slow connections

### No 404 Page
- Problem: No catch-all route defined in `App.tsx`. Unknown routes show the Layout with empty content
- Files: `App.tsx` (Routes section, lines 35–75)
- Blocks: Proper user experience for mistyped URLs

## Test Coverage Gaps

### Zero Unit/Integration Tests
- What's not tested: All service layer functions, component rendering, state management, auth flow, form validation
- Files: `services/*.ts`, `pages/*.tsx`, `components/*.tsx`, `contexts/AuthContext.tsx`, `server/api/*.cjs`
- Risk: Any refactor could silently break business logic (booking, CRM operations, chat)
- Priority: High

### No Server-Side API Tests
- What's not tested: All Express route handlers (`server/api/*.cjs`), auth middleware, database queries
- Files: `server/api/bookings.cjs`, `server/api/crm.cjs`, `server/api/auth.cjs`, `server/lib/auth.cjs`, `server/lib/database.cjs`
- Risk: SQL query changes, auth logic changes, or validation updates could break without detection
- Priority: High

### E2E Tests Exist but Coverage Unknown
- What's not tested: Test file exists (`tests/e2e-live-test.spec.ts`) but content and coverage are unclear
- Files: `tests/e2e-live-test.spec.ts`, `tests/user-request-test.spec.ts`
- Risk: Tests may only cover happy paths or may be outdated
- Priority: Medium

---

*Concerns audit: 2026-04-12*
