# Technology Stack

**Analysis Date:** 2026-04-12

## Languages

**Primary:**
- TypeScript 5.3+ - Client-side React app, type definitions (`types.ts`), service layer, config files
- JavaScript (ES Modules) - Client entry (`index.tsx` compiles to JS), Vite config, PostCSS config, Tailwind config
- JavaScript (CommonJS) - Server-side Express API (`server/index.cjs`, `server/api/*.cjs`, `server/lib/*.cjs`)

**Secondary:**
- CSS - Tailwind-driven styles (`index.css`), inline styles in email templates
- HTML - Entry point (`index.html`) with structured data (JSON-LD), email templates (`quote-template.html`)
- Shell - Validation scripts (`final-booking-test.sh`, `test-riv-performance.cjs`)

## Runtime

**Environment:**
- Node.js 20 (Alpine) - Used in Docker builder stage
- Browser - Client-side SPA served as static files

**Package Manager:**
- npm - `package.json` + `package-lock.json`
- Lockfile: Present (`package-lock.json`)

## Frameworks

**Core:**
- React 19.0.0 - UI framework for the SPA client
- React DOM 19.0.0 - DOM rendering
- React Router DOM 7.0.0 - Client-side routing (HashRouter)
- Express 4.18.2 - Backend REST API server (`server/index.cjs`)

**Styling:**
- Tailwind CSS 4.2.2 - Utility-first CSS framework (v4 with new `@import "tailwindcss"` syntax)
- @tailwindcss/postcss 4.2.2 - PostCSS integration for Tailwind v4
- PostCSS 8.5.9 - CSS processing pipeline
- Autoprefixer 10.4.27 - Vendor prefix generation

**Build/Dev:**
- Vite 8.0.8 - Build tool and dev server
- @vitejs/plugin-react 4.2.1 - React Fast Refresh support for Vite
- sharp 0.34.5 - Image processing (dev dependency)

**Testing:**
- Playwright 1.59.1 - E2E testing framework

**Icons:**
- lucide-react 0.456.0 - Icon library

## Key Dependencies

**Critical:**
- `@google/genai` ^1.31.0 - Google Generative AI SDK (imported but NOT used; actual AI calls use raw `fetch` to Z.AI)
- `@supabase/supabase-js` ^2.39.3 - Supabase client SDK (configured but currently returns `null` in demo mode)
- `react-router-dom` ^7.0.0 - SPA routing with `HashRouter`
- `pg` ^8.11.3 - PostgreSQL client for server-side database access
- `resend` ^3.2.0 - Transactional email service (Resend API)
- `express` ^4.18.2 - HTTP server for backend API

**Infrastructure:**
- `jsonwebtoken` ^9.0.2 - JWT token generation and verification for admin auth
- `bcryptjs` ^2.4.3 - Password hashing for admin authentication
- `cors` ^2.8.5 - CORS middleware for Express
- `dotenv` ^16.4.5 - Environment variable loading (`.env.production`)
- `uuid` ^9.0.1 - UUID v4 generation for entity IDs
- `get-shit-done-cc` ^1.34.2 - GSD tooling integration

## Configuration

**Environment:**
- `.env` - Development environment variables
- `.env.production` - Production environment variables (secrets)
- `.env.production.example` - Template for production env vars
- `docker-compose.yml` - Container environment variables and Traefik routing labels

**Build:**
- `vite.config.ts` - Vite build config (port 3000, host 0.0.0.0, outDir `dist/`)
- `tsconfig.json` - TypeScript config (ES2022 target, bundler module resolution, `@/*` path alias)
- `postcss.config.js` - PostCSS with `@tailwindcss/postcss` and `autoprefixer`
- `tailwind.config.js` - Tailwind content paths and Inter font family
- `playwright.config.ts` - Playwright E2E test config

**Key TypeScript Settings:**
- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx
- Path alias: `@/*` → `./*` (root-relative imports)
- `noEmit: true` (Vite handles compilation)
- `allowJs: true`
- `allowImportingTsExtensions: true`

## Platform Requirements

**Development:**
- Node.js 20+ (implied by Dockerfile base image)
- npm for package management
- PostgreSQL database accessible (local or Docker network)

**Production:**
- Docker + Docker Compose for containerized deployment
- Traefik reverse proxy for HTTPS termination and routing
- Cloudflare TLS certificate resolver (Traefik `cloudflare` certresolver)
- PostgreSQL database on homelab Docker network (`homelab_web`)
- Domain: `revivepropertyco.au` with `www` redirect to apex

---

*Stack analysis: 2026-04-12*
