---
phase: 01-platform-core-authentication
plan: 04
type: execute
wave: 2
title: "Module Discovery and Registration System"
oneLiner: "Module registry with filesystem discovery, topological sort, and runtime activation checking"
subsystem: "platform-core"
tags: ["module-system", "registry", "middleware", "authentication"]
dependencyGraph:
  provides:
    - id: "PCORE-07"
      description: "Module discovery via manifest files"
      artifact: "server/lib/modules.cjs"
    - id: "PCORE-08"
      description: "Core module implementation"
      artifact: "server/modules/core"
    - id: "PCORE-09"
      description: "Dependency-ordered module loading"
      artifact: "server/lib/modules.cjs"
    - id: "PCORE-10"
      description: "Runtime module activation checking"
      artifact: "server/lib/modules.cjs"
  requires:
    - id: "tenant-context"
      description: "AsyncLocalStorage for tenant context"
      from: "01-02"
    - id: "database"
      description: "PostgreSQL connection pool"
      from: "existing"
  affects:
    - "server/index.cjs (module registration integration point)"
techStack:
  added:
    - "Node.js fs module - filesystem scanning"
    - "Kahn's algorithm - topological sort"
  patterns:
    - "Module Registry Pattern - centralized module discovery"
    - "Manifest Pattern - declarative module metadata"
    - "Middleware Factory Pattern - requireModule() returns middleware"
keyFiles:
  created:
    - path: "server/lib/modules.cjs"
      lines: 202
      purpose: "Module registry with discovery, sorting, and registration"
      exports: ["ModuleRegistry", "registry", "requireModule"]
    - path: "server/modules/core/manifest.json"
      lines: 9
      purpose: "Core module metadata (name, version, dependencies)"
    - path: "server/modules/core/index.cjs"
      lines: 113
      purpose: "Core module registration and routes"
      exports: ["register"]
  modified: []
decisions: []
metrics:
  duration: "1.5 minutes"
  completedDate: "2026-04-20"
  tasksCompleted: 2
  filesCreated: 3
  filesModified: 0
---

# Phase 1 Plan 04: Module Discovery and Registration System Summary

## Objective

Create module discovery and registration system with runtime activation checking. Enable automatic module discovery via manifest files (PCORE-07), dependency-ordered loading (PCORE-09), and runtime module activation checking via requireModule() middleware (PCORE-10). Create core module as first module implementation (PCORE-08).

## Implementation

### Task 1: Create Module Registry Library

**File:** `server/lib/modules.cjs` (202 lines)

Implemented `ModuleRegistry` class with the following capabilities:

- **Filesystem Discovery (PCORE-07)**: `discoverModules(modulePath)` scans `server/modules` directory for subdirectories containing both `manifest.json` and `index.cjs` files. Each discovered module is loaded and stored in a Map with its manifest, exports, and path.

- **Topological Sort (PCORE-09)**: `sortModulesByDependency()` implements Kahn's algorithm to order modules by their dependencies. The algorithm:
  - Builds a dependency graph from module manifests
  - Calculates in-degrees for each module
  - Processes modules with zero in-degrees first
  - Detects circular dependencies and throws an error

- **Module Registration**: `registerAll(app, db)` calls each module's `register(app, db)` function in dependency order. Includes error handling to prevent one module's failure from breaking the entire registration process.

- **Runtime Activation Checking (PCORE-10)**: `requireModule(moduleName)` function returns Express middleware that:
  - Retrieves tenant ID from AsyncLocalStorage context
  - Queries `tenant_modules` table for module activation status
  - Returns 401 if no tenant context exists
  - Returns 403 if module is not active for tenant
  - Calls `next()` if module is active

**Exports:**
- `registry` - Singleton instance of ModuleRegistry
- `requireModule` - Middleware factory function

### Task 2: Create Core Module with Manifest and Registration

**Files:**
- `server/modules/core/manifest.json` (9 lines)
- `server/modules/core/index.cjs` (113 lines)

**Manifest (PCORE-08):**
```json
{
  "name": "core",
  "version": "1.0.0",
  "routePrefix": "/api/core",
  "dependencies": [],
  "description": "Core platform module with tenant settings and basic APIs",
  "entitlementRequired": false
}
```

**Registration:**
- Implements `register(app, db)` function that:
  - Creates Express router for `/api/core` routes
  - Applies `authenticateTenantToken` and `tenantMiddleware` to all routes
  - Mounts router at `/api/core` prefix

**Endpoints:**
- `GET /api/core/settings` - Returns tenant information (id, name, slug, plan, status, created_at) from `tenants` table
- `GET /api/core/modules` - Lists all registered modules with their activation status for the current tenant

## Deviations from Plan

None - plan executed exactly as written.

## Threat Model Compliance

| Threat ID | Category | Component | Mitigation Status |
|-----------|----------|-----------|-------------------|
| T-04-01 | Tampering | Module manifest tampering | ✅ Mitigated - Manifests loaded from trusted filesystem path, JSON.parse catches malformed files |
| T-04-02 | Tampering | Malicious module code | ✅ Accepted - Modules run on same server (trusted developers). Future: add manifest signature verification |
| T-04-03 | Denial of Service | Circular dependency in modules | ✅ Mitigated - `sortModulesByDependency` detects cycles and throws error before registration |
| T-04-04 | Elevation of Privilege | Module activation bypass | ✅ Mitigated - `requireModule()` middleware checks `tenant_modules` table on every request, not cached |
| T-04-05 | Tampering | Route prefix collision | ✅ Accepted - Express allows multiple routes on same path (last wins). Documented in module docs |
| T-04-06 | Information Disclosure | Module list exposes internal structure | ✅ Accepted - Module list shows public metadata only (name, description, routePrefix). No sensitive data |

## Verification Results

All verification steps passed:

1. ✅ Module registry loads correctly - Discovered `core v1.0.0`
2. ✅ Topological sort works - Module order: `['core']`
3. ✅ Core module manifest is valid JSON - All fields present
4. ✅ Core module can be loaded - Exports `register` function
5. ✅ requireModule middleware - Function returns middleware function

## Integration Points

The module registry will be integrated into `server/index.cjs` in a future plan:

```javascript
const { registry } = require('./lib/modules.cjs');

// At startup
registry.discoverModules('./server/modules');
await registry.registerAll(app, pool);
```

## Success Criteria

- ✅ `server/lib/modules.cjs` exists with ModuleRegistry class
- ✅ `discoverModules` scans `server/modules` for `manifest.json` and `index.cjs` (PCORE-07)
- ✅ `sortModulesByDependency` implements topological sort (Kahn's algorithm, PCORE-09)
- ✅ `sortModulesByDependency` throws error on circular dependencies
- ✅ `registerAll` calls `register(app, db)` on each module in dependency order
- ✅ `requireModule` function returns Express middleware (PCORE-10)
- ✅ `requireModule` queries `tenant_modules` table for active flag
- ✅ `requireModule` returns 401 if no tenant context
- ✅ `requireModule` returns 403 if module not active
- ✅ `server/modules/core/manifest.json` exists with valid JSON (PCORE-08)
- ✅ manifest contains name, version, routePrefix, dependencies, description
- ✅ `server/modules/core/index.cjs` exists
- ✅ core module exports `register(app, db)` function
- ✅ core module registers GET `/settings` and GET `/modules` endpoints
- ✅ Core module routes use `authenticateTenantToken` and `tenantMiddleware`

## Known Stubs

None - all implemented functionality is complete and operational.

## Next Steps

Future plans should:
1. Integrate module registry into `server/index.cjs` startup sequence
2. Add additional modules (hipages-leads, etc.) with dependencies on core
3. Create module activation/deactivation API endpoints
4. Add module health check endpoint
5. Consider adding module signature verification for production

---

**Commits:**
- `ead707e`: feat(01-04): create module registry library
- `d4abac3`: feat(01-04): create core module with manifest and registration

**Duration:** ~1.5 minutes
**Status:** ✅ Complete
