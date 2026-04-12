# External Integrations

**Analysis Date:** 2026-04-12

## APIs & External Services

**AI Chat (Z.AI / GLM API):**
- Purpose: Powers the "Riv" AI chat concierge widget for instant property service quotes
- SDK/Client: Raw `fetch()` calls (NOT using `@google/genai` SDK despite it being installed)
- Endpoint: `https://api.z.ai/api/coding/paas/v4/chat/completions`
- Model: `glm-4.7` with `thinking: { type: 'disabled' }` for fast responses
- Auth: Bearer token via `VITE_API_KEY` env var (hardcoded fallback in `services/geminiService.ts`)
- Client file: `services/geminiService.ts`
- Context window: 10-message sliding window with system instruction
- Note: Service file is named `geminiService.ts` but connects to Z.AI/GLM, not Google Gemini

**Transactional Email (Resend):**
- Purpose: Send booking confirmations to customers and new-booking/urgent-task notifications to admins
- SDK/Client: `resend` npm package (^3.2.0)
- Client file: `server/lib/email.cjs`
- Auth: `RESEND_API_KEY` env var
- From address: `RESEND_FROM` env var (fallback `onboarding@resend.dev`)
- Rate limiting: 600ms delay between sequential sends to stay under 2 req/s Resend limit
- Notification types: `NEW_BOOKING`, `NEW_CHAT_MESSAGE`, `URGENT_TASK`
- Admin recipients: `ADMIN_EMAIL_1`, `ADMIN_EMAIL_2`, `ADMIN_EMAIL_3` env vars

**Google Fonts:**
- Purpose: Inter font family for UI typography
- Loaded via `<link>` in `index.html` from `https://fonts.googleapis.com/css2`
- Configured as default sans-serif in `tailwind.config.js`

## Data Storage

**Databases:**
- PostgreSQL - Primary data store for all business entities
  - Connection: `DATABASE_URL` env var (format: `postgresql://user:pass@host:5432/revivepropertyco`)
  - Client: `pg` npm package (^8.11.3) with connection pooling
  - Pool config: max 20 connections, 30s idle timeout, 2s connection timeout
  - Client file: `server/lib/database.cjs`
  - Network: `homelab_web` Docker network (service name `postgres`)
  - Tables: `leads`, `appointments`, `tasks`, `admin_users`, `touchpoints`, `quotes`

**Supabase (Configured but Inactive):**
- Purpose: Originally intended for auth/database
- Client file: `lib/supabase.ts`
- Status: Returns `null` when env vars not set — app runs in "demo mode"
- Auth: `SUPABASE_URL`, `SUPABASE_KEY` env vars (currently not set)
- Note: `@supabase/supabase-js` is installed but not actively used

**File Storage:**
- Local filesystem only
- Static assets in `public/` directory (`angus.png`, `family.png`, `favicon.ico`)
- Failed request queue persisted to `tmp/queue.json` via `server/lib/queue.cjs`

**Caching:**
- None — no Redis, Memcached, or in-memory caching layer

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: `server/lib/auth.cjs` (backend) + `contexts/AuthContext.tsx` (frontend)
  - Token: JWT with 7-day expiry, signed with `JWT_SECRET` env var
  - Password hashing: bcryptjs with salt rounds of 10
  - Database table: `admin_users` (columns: `id`, `username`, `password_hash`, `email`)
  - Login endpoint: `POST /api/auth/login` — validates credentials, returns JWT
  - Token verification: `POST /api/auth/verify`
  - Middleware: `authenticateToken()` used on all CRM routes
  - Client-side: Token stored in `localStorage` as `revive_admin_token`
  - User info: Stored in `localStorage` as `revive_admin_user` (JSON: `{id, username, email}`)

**Admin Auth Flow:**
1. User submits username/password to `POST /api/auth/login`
2. Server verifies against `admin_users` table with bcrypt
3. Server returns JWT token + user object
4. Client stores token + user in `localStorage`
5. Subsequent API calls include `Authorization: Bearer <token>` header

**Environment-based Auth (Static Deployment Fallback):**
- `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD` env vars in `docker-compose.yml`
- Used when the API backend is unreachable (static nginx deployment)

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Bugsnag, or similar service

**Logs:**
- Console logging throughout (`console.log`, `console.error`, `console.warn`)
- Express request logging middleware in `server/index.cjs` (timestamp + method + path)
- Queue status logging in `server/lib/queue.cjs`
- Email delivery logging in `server/lib/email.cjs`

**Health Check:**
- `GET /health` endpoint returns `{status, timestamp, uptime, environment}`
- Docker `HEALTHCHECK` on port 80 with 30s interval

## CI/CD & Deployment

**Hosting:**
- Docker container on homelab server
- Nginx Alpine serves static SPA files
- Traefik reverse proxy handles TLS termination and domain routing

**CI Pipeline:**
- None — no GitHub Actions, GitLab CI, or similar

**Container Orchestration:**
- Docker Compose with two external networks:
  - `homelab_web` — internal homelab services (PostgreSQL)
  - `traefik-public` — Traefik reverse proxy

**Deployment Flow:**
1. Multi-stage Docker build (Node 20 Alpine builder → Nginx Alpine production)
2. `npm run build` generates `dist/` with Vite
3. Static files copied to nginx HTML root
4. Traefik routes `revivepropertyco.au` traffic to container port 80
5. Backend API (`server/index.cjs`) is a separate Express server (not containerized in current Dockerfile)

## Environment Configuration

**Required env vars (Production):**
- `DATABASE_URL` — PostgreSQL connection string
- `RESEND_API_KEY` — Resend email API key
- `RESEND_FROM` — Sender email address
- `ADMIN_EMAIL_1`, `ADMIN_EMAIL_2`, `ADMIN_EMAIL_3` — Admin notification recipients
- `JWT_SECRET` — Secret for JWT token signing
- `NODE_ENV` — Environment mode (`production` / `development`)
- `PORT` — Express server port (default 8080)

**Required env vars (Client / Vite):**
- `VITE_API_URL` — Z.AI API base URL
- `VITE_API_KEY` — Z.AI API key
- `VITE_ADMIN_USERNAME` — Admin login username (static fallback)
- `VITE_ADMIN_PASSWORD` — Admin login password (static fallback)

**Optional env vars:**
- `SUPABASE_URL` — Supabase project URL (unused when empty)
- `SUPABASE_KEY` — Supabase anon key (unused when empty)
- `GLM_API_URL` — Alternative GLM API URL (referenced in `.env.production.example`)
- `GLM_API_KEY` — Alternative GLM API key (referenced in `.env.production.example`)

**Secrets location:**
- `.env` — Development secrets (gitignored)
- `.env.production` — Production secrets (gitignored)
- `docker-compose.yml` — Contains inline `API_URL` and `API_KEY` (non-sensitive config)
- Hardcoded fallback in `services/geminiService.ts` (API key as default parameter value)

## Webhooks & Callbacks

**Incoming:**
- None — no webhook receiver endpoints

**Outgoing:**
- Resend email API calls (booking confirmations, admin notifications)
- Z.AI/GLM chat completion API calls (AI chat responses)

## API Surface

**Backend API Routes (Express `server/index.cjs`):**

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/bookings` | POST | No | Create booking + lead + appointment |
| `/api/availability` | GET | No | Check time slot availability |
| `/api/auth/login` | POST | No | Admin login |
| `/api/auth/verify` | POST | No | Verify JWT token |
| `/api/crm/leads` | GET | JWT | List all leads |
| `/api/crm/leads/:id` | PATCH | JWT | Update lead |
| `/api/crm/appointments` | GET | JWT | List all appointments |
| `/api/crm/tasks` | GET, POST | JWT | List/create tasks |
| `/api/crm/tasks/:id` | PATCH, DELETE | JWT | Update/delete task |
| `/api/quotes` | GET, POST | JWT | List/create quotes |
| `/api/quotes/:id` | PUT, DELETE | JWT | Update/delete quote |
| `/api/touchpoints` | POST | JWT | Record customer touchpoint |
| `/api/touchpoints/lead/:leadId` | GET | JWT | Get touchpoints for a lead |
| `/api/notifications/settings` | GET, PUT | JWT | Notification preferences (stub) |
| `/api/queue` | (varies) | — | Failed request queue management |
| `/health` | GET | No | Health check |

---

*Integration audit: 2026-04-12*
