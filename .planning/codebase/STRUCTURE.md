# Codebase Structure

**Analysis Date:** 2026-04-12

## Directory Layout

```
revivepropertyco/
├── components/         # Reusable UI components (12 files + TeleQuote/ subdir)
├── contexts/           # React Context providers (AuthContext only)
├── desgin-guides/      # Design documentation (typo in directory name is intentional/existing)
├── docs/               # Project documentation (design, SEO, NAP)
├── hooks/              # Custom React hooks (usePageSEO)
├── lib/                # Client-side library initialization (Supabase)
├── pages/              # Route-level React components (18 pages)
├── public/             # Static assets served as-is (images, favicons, SEO files)
├── server/             # Express API backend (CJS modules)
│   ├── api/            # Route handlers (8 modules)
│   └── lib/            # Server-side libraries (4 modules)
├── services/           # Client-side API abstraction layer (6 services)
├── tests/              # E2E and SEO test scripts (10 files)
├── archive/            # Historical artifacts (screenshots, scripts, seo-docs)
├── dist/               # Build output (Vite, gitignored)
├── node_modules/       # Dependencies (gitignored)
├── .claude/            # Claude Code config (skills, agents, commands)
├── .planning/          # GSD planning artifacts
│   └── codebase/       # Codebase analysis documents (this file)
├── App.tsx             # Root React component with route definitions
├── Layout.tsx          # Nav + footer layout wrapper
├── index.tsx           # React DOM entry point
├── index.html          # HTML shell with SEO meta tags + structured data
├── index.css           # Tailwind CSS entry (@import "tailwindcss")
├── types.ts            # Shared TypeScript type definitions
├── seoConfig.ts        # Per-page SEO metadata configuration
├── server.js           # Production static file server (Express, serves dist/)
├── Dockerfile          # Multi-stage Docker build (Node build → Nginx serve)
├── docker-compose.yml  # Docker Compose with Traefik labels
├── vite.config.ts      # Vite build configuration
├── tsconfig.json       # TypeScript configuration
├── postcss.config.js   # PostCSS with Tailwind v4 + Autoprefixer
├── tailwind.config.js  # Tailwind config (may be minimal with v4)
├── playwright.config.ts # Playwright E2E test configuration
├── package.json        # Dependencies and scripts
├── metadata.json       # Additional metadata
├── quote-template.html # Standalone HTML quote template
├── CLAUDE.md           # Claude Code instructions
├── README.md           # Project readme
└── TODO.md             # Outstanding tasks
```

## Directory Purposes

**`components/`:**
- Purpose: Reusable UI building blocks shared across pages
- Contains: Layout components, ChatWidget, service page template, SEO schema injectors, utility components
- Key files: `ChatWidget.tsx` (AI concierge), `ServicePageTemplate.tsx` (shared service page layout), `ProtectedRoute.tsx` (auth guard), `SEOSchemas.tsx` (JSON-LD), `FAQSection.tsx` (collapsible FAQs)

**`components/TeleQuote/`:**
- Purpose: Video consultation sub-components
- Contains: `MediaUpload.tsx`, `PlatformSelector.tsx`

**`pages/`:**
- Purpose: Route-level components — each file maps to a route defined in `App.tsx`
- Contains: 18 page components
- Key files: `LandingPage.tsx`, `BookingPage.tsx`, `AdminDashboard.tsx`, `LoginPage.tsx`, 5 service pages (`Service*.tsx`)

**`services/`:**
- Purpose: Client-side API abstraction layer — all backend communication flows through here
- Contains: 6 service modules
- Key files: `crmService.ts` (leads/appointments/tasks CRUD), `geminiService.ts` (AI chat), `bookingApiService.ts` (booking submission), `emailService.ts` (simulated emails), `quoteService.ts` (quote CRUD), `touchpointService.ts` (analytics events)

**`server/`:**
- Purpose: Express.js API backend for database operations, auth, and email
- Contains: `index.cjs` (app entry) + `api/` (route handlers) + `lib/` (shared libraries)

**`server/api/`:**
- Purpose: REST API route handlers
- Contains: 8 route modules
- Key files: `bookings.cjs` (booking creation with transaction), `crm.cjs` (leads/tasks CRUD, auth-protected), `auth.cjs` (login/token verification), `quotes.cjs` (quote CRUD), `touchpoints.cjs` (analytics events)

**`server/lib/`:**
- Purpose: Shared server-side infrastructure
- Contains: `database.cjs` (pg connection pool + transactions), `auth.cjs` (JWT/bcrypt), `email.cjs` (Resend integration), `queue.cjs` (failed request retry queue)

**`contexts/`:**
- Purpose: React Context providers for global state
- Contains: `AuthContext.tsx` only — manages user auth state with localStorage persistence

**`hooks/`:**
- Purpose: Custom React hooks
- Contains: `usePageSEO.ts` — injects per-page meta tags, canonical URLs, and OG data via DOM manipulation

**`lib/`:**
- Purpose: Client-side library initialization
- Contains: `supabase.ts` — creates Supabase client (nullable, app runs in demo mode without credentials)

**`public/`:**
- Purpose: Static assets copied as-is to build output
- Contains: Images (`angus.jpg`, `angus.webp`, `family.jpg`, `family.webp`), favicons, OG images, `robots.txt`, `sitemap.xml`

**`tests/`:**
- Purpose: E2E and SEO validation tests
- Contains: Playwright specs (`e2e-live-test.spec.ts`, `user-request-test.spec.ts`) and SEO test scripts (`test-seo-wp*.cjs`)

**`docs/`:**
- Purpose: Project documentation
- Contains: `design.md`, `completion-plan.md`, `NAP_STANDARD.md`, `SEO_ASSESSMENT_CHECKLIST.md`

**`desgin-guides/`:**
- Purpose: Design reference materials
- Contains: `design.md`, `statement-of-work.html`
- Note: Directory name has intentional typo ("desgin" not "design")

**`archive/`:**
- Purpose: Historical artifacts, not active code
- Contains: `screenshots/`, `scripts/`, `seo-docs/`

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell, loads `index.tsx` via Vite module script
- `index.tsx`: React DOM mount point, wraps App in StrictMode
- `App.tsx`: Route definitions, AuthProvider wrapper, global widgets (ChatWidget, FloatingBackButton)
- `server/index.cjs`: Express API server entry (loads env, middleware, routes, starts listening)

**Configuration:**
- `vite.config.ts`: Vite build config (React plugin, port 3000, host 0.0.0.0)
- `tsconfig.json`: TypeScript config (ES2022 target, bundler resolution, `@/*` path alias)
- `postcss.config.js`: PostCSS config (Tailwind v4 + Autoprefixer)
- `Dockerfile`: Multi-stage build (Node 20 Alpine → Nginx Alpine)
- `docker-compose.yml`: Docker Compose with Traefik reverse proxy labels
- `playwright.config.ts`: Playwright E2E test configuration

**Domain Models:**
- `types.ts`: All TypeScript interfaces and enums (Lead, Appointment, Task, Campaign, ChatMessage, TeleQuoteSession, Quote, ServiceType, LeadStatus, QuoteStatus)

**SEO Configuration:**
- `seoConfig.ts`: Per-page SEO metadata (title, description, path, noindex flags)
- `hooks/usePageSEO.ts`: Runtime meta tag injection hook
- `components/SEOSchemas.tsx`: JSON-LD structured data components (FAQ, Service schemas)
- `index.html`: Static structured data (LocalBusiness, Organization)
- `public/sitemap.xml`: XML sitemap
- `public/robots.txt`: Crawler directives

**Core Logic:**
- `services/crmService.ts`: CRM API abstraction with snake_case ↔ camelCase mappers
- `services/geminiService.ts`: AI chat service (Z.AI API integration, pricing prompt)
- `server/api/bookings.cjs`: Booking creation with atomic DB transaction + email + queue fallback
- `server/lib/database.cjs`: PostgreSQL connection pool with query/transaction helpers

**Testing:**
- `tests/e2e-live-test.spec.ts`: Live E2E test suite
- `tests/user-request-test.spec.ts`: User request scenario tests
- `tests/test-seo-wp*.cjs`: SEO validation scripts for each waypoint

## Naming Conventions

**Files:**
- React components: PascalCase (`ChatWidget.tsx`, `ServicePageTemplate.tsx`)
- Page components: PascalCase with descriptive suffix (`ServicePressureWashing.tsx`, `AdminDashboard.tsx`)
- Service modules: camelCase (`crmService.ts`, `geminiService.ts`)
- Server modules: camelCase with `.cjs` extension (`bookings.cjs`, `database.cjs`)
- Hooks: camelCase prefixed with `use` (`usePageSEO.ts`)
- Config files: camelCase at root (`seoConfig.ts`, `vite.config.ts`)

**Directories:**
- Flat structure: most directories are single-level (no nesting beyond `components/TeleQuote/`, `server/api/`, `server/lib/`)
- Plural names: `pages/`, `components/`, `services/`, `contexts/`, `hooks/`
- Server directories: `server/api/` (routes), `server/lib/` (infrastructure)

## Where to Add New Code

**New Public Page:**
- Page component: `pages/NewPage.tsx` (PascalCase)
- Add route in `App.tsx` inside `<Routes>` block
- Add SEO entry in `seoConfig.ts`
- Add `usePageSEO()` call in the page component

**New Service Page (e.g., new service offering):**
- Copy pattern from existing `pages/ServicePressureWashing.tsx`
- Use `components/ServicePageTemplate.tsx` with props for hero, benefits, pricing, addOns, faqs, crossLinks
- Add route in `App.tsx`
- Add nav link in `Layout.tsx` navLinks array
- Add SEO entry in `seoConfig.ts`
- Update `types.ts` ServiceType enum if new service category

**New Admin Page:**
- Page component: `pages/AdminNewFeature.tsx`
- Wrap with `<ProtectedRoute>` in `App.tsx` route definition
- Add SEO entry in `seoConfig.ts` with `noindex: true`
- API endpoints: New route file in `server/api/newFeature.cjs`, mount in `server/index.cjs`
- Client service: New file in `services/newFeatureService.ts` following existing service pattern

**New API Endpoint:**
- Route file: `server/api/newResource.cjs` (CommonJS, Express Router)
- Mount in `server/index.cjs`: `app.use('/api/newResource', newResourceRouter)`
- Add auth middleware if protected: `router.use(authenticateToken)`
- Client service: Add corresponding functions in `services/`

**New Reusable Component:**
- Component file: `components/ComponentName.tsx`
- Follow existing patterns: React.FC type, named default export
- Import icons from `lucide-react`

**New Shared Type:**
- Add to `types.ts` at root level
- Export as `interface` or `enum`
- Import in pages/services as needed

**New Hook:**
- File: `hooks/useHookName.ts`
- Export as named export and default export (follow `usePageSEO.ts` pattern)

**New Server Library:**
- File: `server/lib/libraryName.cjs` (CommonJS)
- Export via `module.exports = { ... }`
- Import in route files via `require('../lib/libraryName.cjs')`

## Special Directories

**`dist/`:**
- Purpose: Vite build output (static assets for production)
- Generated: Yes (by `npm run build`)
- Committed: No (gitignored)

**`public/`:**
- Purpose: Static assets copied verbatim to build output
- Generated: No
- Committed: Yes
- Note: Images must be manually optimized (WebP variants exist alongside JPGs)

**`archive/`:**
- Purpose: Historical artifacts from earlier development phases
- Generated: No
- Committed: Yes
- Note: Contains screenshots, old scripts, and SEO docs — not active code

**`.claude/`:**
- Purpose: Claude Code configuration (skills, agents, commands)
- Generated: Partially (skills are installed)
- Committed: Yes

**`.planning/`:**
- Purpose: GSD (Get Shit Done) workflow planning artifacts
- Generated: Yes (by GSD commands)
- Committed: Yes

---

*Structure analysis: 2026-04-12*
