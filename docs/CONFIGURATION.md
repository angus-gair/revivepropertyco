<!-- generated-by: gsd-doc-writer -->
# Configuration

This document describes all configuration options for the Revive Property Co. application, including environment variables, config files, and per-environment settings.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Optional | `postgresql://homelab:BQvsf9MNbLHM0r972mJmpjYphvtUxWyhFwh4xP8v8hg@localhost:5432/revivepropertyco` | PostgreSQL connection string for the main CRM database |
| `JWT_SECRET` | Optional | `default-secret-change-in-production` | Secret key for JWT token signing. **Should be changed in production.** |
| `PORT` | Optional | `8080` | Port for the Express server to listen on |
| `NODE_ENV` | Optional | `development` | Environment mode (`development`, `production`, or `test`) |
| `SUPABASE_URL` | Optional | (empty) | Supabase project URL for authentication service |
| `SUPABASE_KEY` | Optional | (empty) | Supabase anonymous/key for client-side auth |
| `RESEND_API_KEY` | Required | (none) | Resend API key for sending emails |
| `RESEND_FROM` | Optional | `onboarding@resend.dev` | From email address for automated emails |
| `ADMIN_EMAIL_1` | Optional | (none) | First admin email address for business notifications |
| `ADMIN_EMAIL_2` | Optional | (none) | Second admin email address for business notifications |
| `ADMIN_EMAIL_3` | Optional | (none) | Third admin email address for business notifications |
| `API_KEY` | Required | (none) | Google AI API key for the "Riv" chat concierge service |
| `API_URL` | Optional | (inferred) | Z.AI API endpoint URL for chat service |
| `HIPAGES_USERNAME` | Required | (none) | Hipages login username for lead scraper |
| `HIPAGES_PASSWORD` | Required | (none) | Hipages login password for lead scraper |
| `HIPAGES_HEADLESS` | Optional | `true` | Run Hipages scraper in headless mode (no GUI) |
| `OUTPUT_DIR` | Optional | `../output` | Directory for Hipages scraper output files |
| `LOCK_FILE` | Optional | `/tmp/hipages-scraper.lock` | Lock file path to prevent concurrent scraper runs |
| `CRON_SCHEDULE` | Optional | `0 */6 * * *` | Cron schedule for Hipages scraper (default: every 6 hours) |
| `RUN_ON_STARTUP` | Optional | `false` | Run Hipages scraper immediately on startup |

## Config File Format

### Vite Configuration (`vite.config.ts`)

The Vite build tool is configured with the following settings:

```typescript
{
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
}
```

### Tailwind CSS Configuration

Tailwind CSS v4 is configured via PostCSS:

- **Build integration**: `@tailwindcss/postcss` plugin
- **Global entry**: `index.css` with `@import "tailwindcss";`
- **Design system**: High-density architectural "Blueprint" aesthetic

### Playwright Configuration (`playwright.config.ts`)

End-to-end testing framework configuration:

```typescript
{
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined
}
```

## Required vs Optional Settings

### Required for Startup

The following environment variables will cause the application to fail or function incorrectly if missing:

- `RESEND_API_KEY` - Email notifications will fail without this key
- `API_KEY` - The AI chat service "Riv" will not function
- `HIPAGES_USERNAME` and `HIPAGES_PASSWORD` - Hipages scraper cannot authenticate

### Optional with Defaults

These variables have sensible defaults defined in the source code:

- `DATABASE_URL` - Falls back to local PostgreSQL connection string
- `JWT_SECRET` - Has a default value but **should be overridden in production**
- `PORT` - Defaults to 8080
- `NODE_ENV` - Defaults to development
- `SUPABASE_URL` and `SUPABASE_KEY` - App runs in demo mode if not configured
- `RESEND_FROM` - Defaults to Resend's test domain
- `HIPAGES_HEADLESS` - Defaults to `true`
- `CRON_SCHEDULE` - Defaults to every 6 hours

## Defaults

### Database Connection

**Location**: `server/lib/database.cjs`

```javascript
const dbUrl = process.env.DATABASE_URL ||
  'postgresql://homelab:BQvsf9MNbLHM0r972mJmpjYphvtUxWyhFwh4xP8v8hg@localhost:5432/revivepropertyco';
```

**Default connection pool settings**:
- `max`: 20 connections
- `idleTimeoutMillis`: 30000ms (30 seconds)
- `connectionTimeoutMillis`: 2000ms (2 seconds)

### JWT Authentication

**Location**: `server/lib/auth.cjs`

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRY = '7d'; // Token expires in 7 days
```

### Email Service

**Location**: `server/lib/email.cjs`

```javascript
const FROM_EMAIL = process.env.RESEND_FROM || 'onboarding@resend.dev';
```

Admin emails are loaded from three optional environment variables:
```javascript
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL_1,
  process.env.ADMIN_EMAIL_2,
  process.env.ADMIN_EMAIL_3
].filter(Boolean); // Removes any undefined values
```

### Hipages Scraper

**Location**: `services/hipages-scraper/src/scraper.js`

```javascript
const CONFIG = {
  headless: process.env.HIPAGES_HEADLESS === 'true' || true,
  timeout: 60000, // 60 seconds
};
```

**Scheduler defaults** (`services/hipages-scraper/src/scheduler.js`):
```javascript
const LOCK_FILE = process.env.LOCK_FILE || '/tmp/hipages-scraper.lock';
const schedule = process.env.CRON_SCHEDULE || '0 */6 * * *'; // Every 6 hours
```

### Supabase Client

**Location**: `lib/supabase.ts`

```typescript
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
```

If neither variable is set, the app runs in "demo mode" and `supabase` export is `null`.

## Per-Environment Overrides

### Development

- **NODE_ENV**: `development`
- **Vite dev server**: Runs on port 3000, accessible on all interfaces (`0.0.0.0`)
- **Hot reload**: Enabled by default
- **Error details**: Full error messages exposed in API responses
- **CORS**: Allows requests from any origin in development mode

### Production

- **NODE_ENV**: `production`
- **Server**: Nginx Alpine serving static files from `/usr/share/nginx/html`
- **Port**: 80 (configured in Dockerfile)
- **Error details**: Suppressed for security
- **CORS**: Restricted to production origin
- **Cache headers**: Disabled (no-cache, no-store, must-revalidate) for SPA routing

### Test

- **NODE_ENV**: `test`
- **Playwright**: 
  - `forbidOnly`: `!!process.env.CI` (fails if `test.only` is left in code)
  - `retries`: 2 in CI, 0 locally
  - `workers`: 1 in CI, unlimited locally

### Hipages Scraper Environments

The Hipages scraper uses the following environment-specific behavior:

- **Timezone**: `Australia/Sydney` for cron scheduling
- **RUN_ON_STARTUP**: Set to `'true'` to run an immediate scrape when scheduler starts
- **CRON_SCHEDULE**: Customize the cron expression (default: `0 */6 * * *` for every 6 hours)
- **OUTPUT_DIR**: Can be customized for different deployment environments

## Production Deployment Configuration

### Docker Configuration

The production deployment uses a multi-stage Docker build:

1. **Builder stage** (`node:20-alpine`):
   - Installs dependencies with `--legacy-peer-deps`
   - Runs `npm run build` to create production assets

2. **Production stage** (`nginx:alpine`):
   - Copies built assets from builder
   - Configures nginx for SPA routing with no caching
   - Health check on port 80 every 30 seconds

### Infrastructure Configuration

- **Domain**: `<!-- VERIFY: revivepropertyco.au -->` (configured via Traefik labels)
- **SSL/TLS**: Managed by Traefik (<!-- VERIFY: automatic HTTPS certificate generation -->)
- **Health check endpoint**: `http://127.0.0.1:80/` (wget request every 30s)
- **Deployment validation**: `final-booking-test.sh` and `test-riv-performance.cjs` scripts

### External Service URLs

- **Supabase**: `<!-- VERIFY: Supabase project URL -->` (from `SUPABASE_URL`)
- **Resend API**: `https://api.resend.com/emails` (inferred from Resend SDK)
- **Z.AI API**: `https://api.z.ai/api/coding/paas/v4/chat/completions` (hardcoded in chat widget)
- **Hipages**: 
  - Login: `https://business.hipages.com.au/login`
  - Leads: `https://business.hipages.com.au/leads`
  - Jobs: `https://business.hipages.com.au/jobs`

For deployment-specific configuration values (database cluster names, CDN endpoints, monitoring URLs), see DEPLOYMENT.md.
