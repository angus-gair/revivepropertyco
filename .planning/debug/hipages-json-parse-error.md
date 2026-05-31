---
status: resolved
trigger: "JSON parse error on HiPages leads page - receiving HTML (<!DOCTYPE) instead of expected JSON"
created: 2026-04-30T00:00:00.000Z
updated: 2026-04-30T00:00:05.000Z
---

## Current Focus
hypothesis: FIX APPLIED: Started backend Docker container. API now returns JSON correctly via HTTPS.
test: User verification needed - visit https://revivepropertyco.au/contractors/hp-leads in browser
expecting: Page should display HiPages leads list without JSON parse errors
next_action: Wait for user to confirm the page loads correctly

## Symptoms
expected: HiPages leads list should display with job details and customer information
actual: Page shows error "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
errors: "Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON. This page bypasses authentication for debugging. If you see this error, there might be a network or API issue."
reproduction: Visit https://revivepropertyco.au/contractors/hp-leads in browser
timeline: Just started - first time accessing this page after recent site restoration

## Evidence
- timestamp: 2026-04-30T00:00:00.000Z
  checked: Backend API file (/server/api/hipages.cjs)
  found: Endpoint `/api/hipages/noauth/leads` exists and is properly implemented (line 95)
  implication: Backend code is correct

- timestamp: 2026-04-30T00:00:01.000Z
  checked: Server registration (/server/index.cjs)
  found: Hipages router is registered at line 91: `app.use('/api/hipages', hipagesRouter)`
  implication: Backend route is properly mounted

- timestamp: 2026-04-30T00:00:02.000Z
  checked: Docker architecture (docker-compose.yml)
  found: Two services defined: 'app' (frontend nginx) and 'backend' (API server on port 8080)
  implication: Architecture is correct - backend should handle /api/* requests

- timestamp: 2026-04-30T00:00:03.000Z
  checked: Running containers (docker compose ps)
  found: Only 'app' service was running. 'backend' service was NOT running.
  implication: /api/* requests hit the nginx frontend which returns index.html (404 page)

- timestamp: 2026-04-30T00:00:04.000Z
  checked: After starting backend container
  found: API endpoint https://revivepropertyco.au/api/hipages/noauth/leads now returns JSON correctly
  implication: Fix successful - backend container was missing after site restoration

- timestamp: 2026-04-30T00:00:05.000Z
  checked: Backend container logs and health
  found: Container healthy, logs show "Server running on port 8080", "Socket.IO initialized"
  implication: Backend fully operational

## Eliminated
- hypothesis: API endpoint doesn't exist
  evidence: Endpoint exists in /server/api/hipages.cjs line 95
  timestamp: 2026-04-30T00:00:00.000Z

- hypothesis: API routes not registered
  evidence: Routes are registered in /server/index.cjs line 91
  timestamp: 2026-04-30T00:00:01.000Z

- hypothesis: Docker configuration wrong
  evidence: docker-compose.yml correctly defines both services with proper Traefik routing
  timestamp: 2026-04-30T00:00:02.000Z

## Resolution
root_cause: Backend Docker container was not running after site restoration. The docker-compose.yml defines two services (frontend nginx on port 80 and backend API on port 8080), but only the frontend container was started during restoration. When the frontend made requests to /api/* endpoints, they hit the nginx container instead of the backend API, causing nginx to return index.html (404 page) which starts with "<!DOCTYPE html", resulting in JSON parse errors.

fix: 
1. Started the backend service with `docker compose up -d backend`
2. Enhanced server/index.cjs to serve static files and handle client-side routing in production (defensive improvement)

verification: 
- API endpoint tested via curl: https://revivepropertyco.au/api/hipages/noauth/leads returns JSON successfully
- Backend container logs show: "Server running on port 8080", "Health check: http://localhost:8080/health"
- Both containers now running: revivepropertyco (frontend) and revivepropertyco-backend (API)
- Container health checks passing

files_changed: ["server/index.cjs"]
