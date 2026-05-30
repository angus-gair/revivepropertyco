---
phase: 02-twenty-crm-integration
plan: 01
subsystem: twenty-crm
tags: [infrastructure, docker, database, crm]
dependency_graph:
  requires: []
  provides: [twenty-crm-deployment, twenty-integration-tables]
  affects: [platform-database, traefik-routing]
tech_stack:
  added:
    - Twenty CRM v1.22.6 (Docker)
    - PostgreSQL 15-alpine (Twenty database)
    - Redis 7-alpine (Twenty queue/caching)
  patterns:
    - Multi-service Docker Compose with healthchecks
    - Traefik reverse proxy routing
    - Internal network isolation (homelab_internal)
    - Foreign key cascading deletes for tenant isolation
key_files:
  created:
    - server/migrations/005_create_twenty_integration_tables.sql
  modified:
    - docker-compose.yml
    - .env
decisions:
  - key: "twenty-version"
    summary: "Pinned Twenty CRM to v1.22.6 for stability"
    rationale: "Specific version prevents unexpected breaking changes during deployment"
    alternatives: ["Using latest tag (risk of breaking changes)", "Maintaining version range"]
  - key: "dedicated-twenty-db"
    summary: "Twenty CRM uses dedicated PostgreSQL instance"
    rationale: "Separate database isolates Twenty data from platform database, following multi-tenant SaaS pattern"
    alternatives: ["Shared platform database (complex multi-tenancy)", "Managed cloud PostgreSQL"]
  - key: "internal-network-only"
    summary: "Twenty API accessible only on internal network"
    rationale: "Platform server communicates with Twenty via homelab_internal network; external access via Traefik only"
    alternatives: ["Public API exposure (security risk)", "VPN-only access"]
metrics:
  duration_seconds: 47
  completed_date: "2026-04-20"
  tasks_completed: 3
  files_created: 1
  files_modified: 2
---

# Phase 02 Plan 01: Deploy Twenty CRM Infrastructure Summary

**One-liner:** Self-hosted Twenty CRM deployment via Docker Compose with dedicated PostgreSQL/Redis, Traefik routing for crm.ajinsights.com.au, and platform database tables for tenant-to-workspace mappings.

## Objective Completed

Deployed Twenty CRM as a self-hosted Docker service integrated into the existing stack, with database tables for storing workspace mappings and API tokens per tenant. Twenty CRM will serve as the central data hub for the multi-tenant SaaS platform, replacing direct PostgreSQL access for CRM data.

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ----- | ------ | ----- |
| 1 | Add Twenty CRM services to docker-compose.yml | 55f4de1 | docker-compose.yml |
| 2 | Add Twenty environment variables to .env | f84d9c0 | .env |
| 3 | Create platform database tables for Twenty integration (migration 005) | 388fc69 | server/migrations/005_create_twenty_integration_tables.sql |

## Key Changes Made

### 1. Docker Compose Services (docker-compose.yml)

Added four Twenty CRM services:

- **twenty-db**: PostgreSQL 15-alpine with healthcheck, dedicated volume
- **twenty-redis**: Redis 7-alpine for queue/caching, healthcheck enabled
- **twenty-server**: Twenty CRM v1.22.6 with Traefik routing for crm.ajinsights.com.au
- **twenty-worker**: Background queue worker for async jobs

All services use `homelab_internal` network for internal communication. Twenty-server also uses `traefik-public` for external access via HTTPS.

**Traefik Configuration:**
- Router: `twenty-crm`
- Rule: `Host(crm.ajinsights.com.au)`
- TLS: Cloudflare certificate resolver
- Port: 3000 (internal)

### 2. Environment Variables (.env)

Added 5 Twenty environment variables:

- `TWENTY_DB_PASSWORD`: Database password (placeholder for user to replace)
- `TWENTY_APP_SECRET`: JWT signing secret (placeholder)
- `TWENTY_SERVER_URL`: Public URL (https://crm.ajinsights.com.au)
- `TWENTY_API_TOKEN`: API token placeholder (to be generated after Twenty setup)
- `TWENTY_WEBHOOK_SECRET`: Webhook signing secret (placeholder)

**Note:** All placeholder values marked with `CHANGE_THIS` must be replaced with secure generated values before production deployment.

### 3. Database Migration 005 (server/migrations/005_create_twenty_integration_tables.sql)

Created two tables for platform-to-Twenty integration:

**twenty_workspaces table:**
- `workspace_id` (UUID, primary key)
- `tenant_id` (UUID, foreign key to tenants table, ON DELETE CASCADE)
- `twenty_workspace_id` (TEXT, Twenty's internal workspace ID)
- `twenty_workspace_name` (TEXT)
- `twenty_workspace_slug` (TEXT)
- `server_url` (TEXT)
- Unique constraint on (tenant_id, twenty_workspace_id)
- Indexes on tenant_id and twenty_workspace_slug

**tenant_twenty_tokens table:**
- `token_id` (UUID, primary key)
- `tenant_id` (UUID, foreign key to tenants table, ON DELETE CASCADE)
- `workspace_id` (UUID, foreign key to twenty_workspaces table, ON DELETE CASCADE)
- `token_type` (TEXT, CHECK constraint: 'API' or 'WEBHOOK')
- `encrypted_token` (TEXT, for encrypted storage)
- `token_label` (TEXT, human-readable label)
- `last_used_at` (TIMESTAMP)
- `expires_at` (TIMESTAMP)
- Unique constraint on (tenant_id, workspace_id, token_type)
- Indexes on tenant_id and workspace_id

## Known Stubs

None - all tables and services are fully configured. Placeholder values in .env are intentional and marked for user replacement.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information_disclosure | .env | TWENTY_DB_PASSWORD, TWENTY_APP_SECRET, TWENTY_WEBHOOK_SECRET contain placeholder values that must be replaced with secure values before deployment |
| threat_flag: token_storage | server/migrations/005_create_twenty_integration_tables.sql | encrypted_token column stores tokens at rest - application-level encryption must be implemented (mitigated in threat model T-02-02) |

## Verification Steps (Post-Deployment)

Before deploying, replace placeholder values in .env:

```bash
# Generate secure values
TWENTY_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
TWENTY_APP_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
TWENTY_WEBHOOK_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
```

After deployment, verify:

1. **Docker services running:**
   ```bash
   docker ps | grep twenty
   ```
   Should show: twenty-postgres, twenty-redis, twenty-server, twenty-worker (all healthy)

2. **External access via Traefik:**
   ```bash
   curl -I https://crm.ajinsights.com.au
   ```
   Should return 200 or redirect to Twenty setup page

3. **Migration applied:**
   ```bash
   psql $DATABASE_URL -c "\dt twenty_workspaces tenant_twenty_tokens"
   ```
   Should show both tables

## Next Steps

See plan 02-02: "Configure Twenty CRM first-run setup and create initial workspace"

## Self-Check: PASSED

- [x] docker-compose.yml contains all four Twenty services with correct configuration
- [x] .env contains all 5 Twenty environment variables
- [x] Migration 005 creates two tables with proper foreign keys and indexes
- [x] All 3 tasks committed individually
- [x] Commits verified: 55f4de1, f84d9c0, 388fc69
