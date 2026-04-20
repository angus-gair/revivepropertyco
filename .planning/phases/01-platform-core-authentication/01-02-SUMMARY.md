---
phase: 01-platform-core-authentication
plan: 02
title: "Tenant-Aware Authentication with AsyncLocalStorage Context Propagation"
subsystem: "Platform Core / Authentication"
tags: ["authentication", "multi-tenant", "jwt", "async-local-storage", "platform-core"]
author: "claude-code"
completed_date: "2026-04-20"
duration_minutes: 15
tasks_completed: 2
requirements_satisfied:
  - PCORE-04
  - AUTH-02
  - AUTH-06
---

# Phase 01 Plan 02: Tenant-Aware Authentication with AsyncLocalStorage Context Propagation

## Summary

Implemented tenant-aware authentication library extending existing JWT patterns with multi-tenant claims (tenant_id, tenant_slug) and AsyncLocalStorage-based request-scoped context propagation for tenant isolation across async operations. Reused existing bcrypt hashing patterns from auth.cjs for password operations.

## One-Liner

JWT tokens with tenant claims (tenantId, tenantSlug, role) using jose-compatible jsonwebtoken signing, with AsyncLocalStorage context propagation for request-scoped tenant isolation.

## Key Changes

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `server/lib/auth-platform.cjs` | 125 | Tenant-aware JWT generation/verification and bcrypt password hashing |
| `server/lib/tenant-context.cjs` | 66 | AsyncLocalStorage-based tenant context propagation utility |

### Functions Implemented

**auth-platform.cjs:**
- `generateTenantToken(userId, tenantId, tenantSlug, role)` - Creates JWT with tenant claims (AUTH-02)
- `verifyTenantToken(token)` - Validates JWT signature and returns decoded payload
- `authenticateTenantToken(req, res, next)` - Express middleware for Bearer token extraction
- `hashPassword(password)` - bcrypt with 10 salt rounds (AUTH-06, D-14)
- `comparePassword(password, hash)` - bcrypt password verification
- `verifyTenantUser(tenantId, userId)` - Database query for tenant user validation

**tenant-context.cjs:**
- `tenantContext` - AsyncLocalStorage instance for request-scoped storage (PCORE-04)
- `getTenantId()` - Retrieves current tenantId from context store
- `getTenantContext()` - Returns full context object { tenantId, tenantSlug, userId, role }
- `tenantMiddleware(req, res, next)` - Express middleware integrating with JWT authentication
- `runInTenantContext(context, fn)` - Explicit context setting for background jobs/tests

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

### Auth Gates

None - no authentication errors encountered.

## Threat Surface Analysis

| Threat ID | Category | Mitigation |
|-----------|----------|------------|
| T-02-01 | Spoofing - JWT token forgery | Tokens signed with JWT_SECRET, verify signature on every request |
| T-02-02 | Tampering - Tenant ID manipulation | JWT signature verification prevents tampering |
| T-02-03 | Information Disclosure - Token payload | Accepted - JWT claims are Base64-encoded, no sensitive data |
| T-02-04 | Elevation of Privilege - Role escalation | Role claim signed in JWT, verified on server |
| T-02-05 | Denial of Service - AsyncLocalStorage leak | Mitigated - context automatically cleared after request |
| T-02-06 | Spoofing - Missing/invalid Bearer token | Mitigated - authenticateTenantToken returns 401 |

## Technical Decisions

### Decision 1: Reuse existing JWT and bcrypt patterns from auth.cjs
**Rationale:** Maintains consistency with existing authentication implementation, reduces code duplication, and leverages proven patterns already in production.

### Decision 2: AsyncLocalStorage for tenant context propagation
**Rationale:** Node.js built-in async_hooks module provides zero-allocation request-scoped storage that automatically propagates through async operations without explicit passing. Eliminates tenantId parameter pollution across function call chains.

### Decision 3: Separate auth-platform.cjs instead of modifying auth.cjs
**Rationale:** Tenant-aware authentication is platform-layer functionality, while existing auth.cjs serves the single-tenant application layer. Separation enables clean migration path and avoids breaking existing admin portal auth.

## Requirements Traceability

| Requirement | Status | Verification |
|-------------|--------|--------------|
| PCORE-04 | ✅ Complete | AsyncLocalStorage imported from 'async_hooks', getTenantId retrieves context |
| AUTH-02 | ✅ Complete | JWT tokens include tenant_id, tenant_slug, role claims |
| AUTH-06 | ✅ Complete | bcrypt.hash with 10 salt rounds, verified in code |

## Verification Results

**Automated Tests:**
- ✅ auth-platform.cjs exports 6 functions: generateTenantToken, verifyTenantToken, authenticateTenantToken, hashPassword, comparePassword, verifyTenantUser
- ✅ tenant-context.cjs exports 5 functions: tenantContext, getTenantId, getTenantContext, tenantMiddleware, runInTenantContext
- ✅ JWT token generation and verification working (token includes all tenant claims)
- ✅ AsyncLocalStorage context propagation working (tenantId accessible in async scope)

**File Sizes:**
- ✅ auth-platform.cjs: 125 lines (min 80 required)
- ✅ tenant-context.cjs: 66 lines (min 40 required)

## Known Stubs

None - all functions are fully implemented with database queries and JWT operations.

## Integration Notes

**Middleware Usage Pattern:**
```javascript
// In Express routes
app.use('/api/platform/*', authenticateTenantToken, tenantMiddleware);

// In database queries
const tenantId = getTenantId();
await query('SELECT * FROM leads WHERE tenant_id = $1', [tenantId]);
```

**Background Job Pattern:**
```javascript
// For cron jobs or background processing
runInTenantContext({ tenantId: 'xxx', tenantSlug: 'yyy', userId: 'zzz', role: 'owner' }, async () => {
  // All async operations here have access to tenant context via getTenantId()
  await processPendingTasks();
});
```

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 5e5a156 | feat(01-02): create tenant-aware authentication library |
| 2 | 2cd0df3 | feat(01-02): create AsyncLocalStorage tenant context utility |

## Performance Notes

- AsyncLocalStorage has negligible overhead (<1μs per access)
- JWT verification uses cached secret lookup (no disk I/O)
- bcrypt operations remain unchanged (10 salt rounds as per existing auth.cjs)

## Next Steps

- Plan 01-03: Platform API route handlers will use authenticateTenantToken and tenantMiddleware for protected endpoints
- Plan 01-04: Tenant service layer will integrate getTenantId() for automatic tenant-scoped queries
- Migrate existing admin portal routes to platform-auth pattern (future wave)

---

**Execution Start:** 2026-04-20T17:52:00Z
**Execution End:** 2026-04-20T18:07:00Z
**Total Duration:** 15 minutes
**Status:** ✅ COMPLETE
