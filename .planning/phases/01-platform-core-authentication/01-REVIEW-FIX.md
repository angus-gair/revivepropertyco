---
phase: 01-platform-core-authentication
fixed_at: 2026-04-20T18:50:00Z
review_path: .planning/phases/01-platform-core-authentication/01-REVIEW.md
iteration: 1
findings_in_scope: 11
fixed: 11
skipped: 0
status: all_fixed
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-04-20T18:50:00Z
**Source review:** .planning/phases/01-platform-core-authentication/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 11
- Fixed: 11
- Skipped: 0

## Fixed Issues

### CR-01: Hardcoded Database Credentials in Source Code

**Files modified:** `server/lib/database.cjs`
**Commit:** f70e5dd
**Applied fix:** Removed fallback connection string with hardcoded credentials. Now fails fast if DATABASE_URL environment variable is not set.

### CR-02: Protected Platform Dashboard Route Missing Authentication

**Files modified:** `components/PlatformProtectedRoute.tsx`, `App.tsx`
**Commit:** 2d4a2b2
**Applied fix:** Created new `PlatformProtectedRoute` component that checks `TenantAuthContext` instead of the legacy `AuthContext`. Updated `/platform/dashboard` route to use the new component, fixing the bypass vulnerability.

### CR-03: Race Condition in Invitation Acceptance

**Files modified:** `server/api/invitations.cjs`
**Commit:** edbb816
**Applied fix:** Wrapped entire invitation acceptance flow in a transaction using the `transaction()` helper. The duplicate user check now occurs within the transaction, preventing race conditions where multiple requests could accept the same invitation simultaneously.

### WR-01: Multi-Tenant Login Bypass - Email Collision Not Handled

**Files modified:** `server/api/auth-platform.cjs`
**Commit:** 4f67f34
**Applied fix:** Added requirement for `X-Tenant-Slug` header on login endpoint. The query now filters by both email and tenant slug, preventing email collision across tenants.

### WR-02: PostgreSQL Session Variable Not Set for RLS

**Files modified:** `server/lib/tenant-context.cjs`
**Commit:** eac185b
**Applied fix:** Added `set_config` calls to set PostgreSQL session variables `app.current_tenant` and `app.user_role` before processing each request. This enables RLS policies to function correctly for tenant isolation.

### WR-03: Default JWT Secret in Production

**Files modified:** `server/lib/auth-platform.cjs`
**Commit:** 4785b79
**Applied fix:** Added validation to ensure JWT_SECRET is set in production environments. A development fallback is only used when NODE_ENV is not production, with a warning logged.

### WR-04: RLS Policy with Hardcoded Password in SQL

**Files modified:** `server/migrations/004_create_rls_policies.sql`
**Commit:** 082ac6e
**Applied fix:** Removed hardcoded password from `app_user` role creation. The role is now created without a password, with documentation for manual password setup in production.

### WR-05: Missing Rate Limiting on Authentication Endpoints

**Files modified:** `server/api/auth-platform.cjs`, `server/api/platform.cjs`, `package.json`, `package-lock.json`
**Commit:** 472a5ad
**Applied fix:** Installed `express-rate-limit` package and added rate limiters to authentication endpoints:
- `authLimiter`: 5 login attempts per 15 minutes
- `registrationLimiter`: 3 registration attempts per hour

### WR-06: Password Hash Not Constant-Time Compared

**Files modified:** `server/api/auth-platform.cjs`
**Commit:** e22e9a8
**Applied fix:** Always run bcrypt.compare even when user is not found, using a dummy hash for comparison. This prevents timing attacks that could reveal whether an email account exists.

### WR-07: Module Dependency Sort Has In-Degree Calculation Bug

**Files modified:** `server/lib/modules.cjs`
**Commit:** 45999cb
**Applied fix:** Corrected Kahn's algorithm in-degree calculation. The in-degree is now set to the number of dependencies each module has (`deps.length`), rather than incorrectly incrementing the dependency's in-degree.

### WR-08: Invitation Token Exposure in Development

**Files modified:** `server/api/invitations.cjs`
**Commit:** 45332d3
**Applied fix:** Replaced `NODE_ENV === 'development'` check with explicit `EXPOSE_INVITATION_TOKENS === 'true'` flag. Tokens are never exposed in production regardless of the flag value.

## Skipped Issues

None — all findings in scope were successfully fixed.

---

_Fixed: 2026-04-20T18:50:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
