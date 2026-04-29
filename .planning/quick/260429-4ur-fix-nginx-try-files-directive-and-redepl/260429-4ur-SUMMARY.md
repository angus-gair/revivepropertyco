# Quick Task 260429-4ur: Summary

**Task:** fix nginx try_files directive and redeploy to fix SPA deep link redirects
**Date:** 2026-04-29
**Status:** Complete

## What Was Done

### Task 1: Fix Dockerfile and commit to main repo
- Confirmed `/opt/homelab/apps/revivepropertyco/Dockerfile` already had the correct `try_files $uri $uri/ /index.html;` as an unstaged change
- Committed the fix: `73f9730` — "fix: correct nginx try_files directive and disable caching for SPA routing"
- Also fixed a duplicate `hipages-scraper` service in docker-compose.yml that was blocking `docker compose` parsing: `3782564`

### Task 2: Rebuild and redeploy container
- Built image with `docker build`
- Stopped/removed old container and recreated with Traefik labels and network connections
- Container became healthy

### Task 3: Verify live site
- `curl -sI https://revivepropertyco.au/contractors/hp-leads` → **HTTP 200** ✓
- `curl -sI https://revivepropertyco.au/booking` → **HTTP 200** ✓
- `curl -sI https://revivepropertyco.au/` → **HTTP 200** ✓

## Root Cause

The nginx `try_files` directive had a bare `/` between `$uri/` and `/index.html`:
```
try_files $uri $uri/ / /index.html;  # broken
```
When nginx couldn't find a file for a path like `/contractors/hp-leads`, it hit the bare `/` and internally redirected to root instead of serving `index.html` as the SPA fallback.

## Fix

```
try_files $uri $uri/ /index.html;  # fixed
```

## Commits (main repo)
- `73f9730`: fix: correct nginx try_files directive and disable caching for SPA routing
- `3782564`: fix: remove duplicate hipages-scraper service definition in docker-compose.yml
