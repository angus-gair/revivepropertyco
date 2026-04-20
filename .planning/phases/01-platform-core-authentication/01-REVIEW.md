---
phase: 01-platform-core-authentication
reviewed: 2026-04-20T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - App.tsx
  - contexts/TenantAuthContext.tsx
  - pages/platform/LoginPlatformPage.tsx
  - pages/platform/PlatformDashboard.tsx
  - pages/platform/RegisterPage.tsx
  - server/migrations/003_create_platform_tables.sql
  - server/migrations/004_create_rls_policies.sql
  - server/seeds/default-tenant-seed.sql
  - server/lib/auth-platform.cjs
  - server/lib/tenant-context.cjs
  - server/api/platform.cjs
  - server/api/auth-platform.cjs
  - server/lib/modules.cjs
  - server/modules/core/manifest.json
  - server/modules/core/index.cjs
  - server/api/invitations.cjs
  - server/index.cjs
  - types.ts
findings:
  critical: 3
  warning: 8
  info: 5
  total: 16
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-20T00:00:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

This review analyzed the platform core authentication implementation, including multi-tenant architecture, JWT-based authentication, module registry system, and RLS policies. The implementation demonstrates solid architectural patterns with proper transaction handling and dependency injection.

**Key Concerns:**
- Hardcoded database credentials in source code (CRITICAL security issue)
- Missing Authorization header on protected dashboard route
- Race condition vulnerability in invitation acceptance
- Duplicate enum definitions in TypeScript types
- TODO comment indicates unimplemented RLS session variable setting

## Critical Issues

### CR-01: Hardcoded Database Credentials in Source Code

**File:** `server/lib/database.cjs:4`
**Issue:** Production database credentials are hardcoded in the source code, including a password in the connection string fallback. This is a critical security vulnerability that exposes database credentials to anyone with access to the repository.

```javascript
const dbUrl = process.env.DATABASE_URL || 'postgresql://homelab:BQvsf9MNbLHM0r972mJmpjYphvtUxWyhFwh4xP8v8hg@localhost:5432/revivepropertyco';
```

**Fix:** Remove the hardcoded credentials entirely. Fail fast if DATABASE_URL is not set:

```javascript
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}
```

### CR-02: Protected Platform Dashboard Route Missing Authentication

**File:** `App.tsx:139-146`
**Issue:** The `/platform/dashboard` route uses `ProtectedRoute` which appears to be for the legacy admin auth system (Supabase-based), not the new `TenantAuthContext`. This creates a bypass vulnerability where the route might check the wrong auth context.

```tsx
<Route
  path="/platform/dashboard"
  element={
    <ProtectedRoute>
      <PlatformDashboard />
    </ProtectedRoute>
  }
/>
```

**Fix:** Create a `PlatformProtectedRoute` component that checks `TenantAuthContext`:

```tsx
// Create components/PlatformProtectedRoute.tsx
const PlatformProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useTenantAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/platform/login');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) return <Loader2 className="animate-spin" />;
  return isAuthenticated ? <>{children}</> : null;
};

// Then use it:
<Route
  path="/platform/dashboard"
  element={
    <PlatformProtectedRoute>
      <PlatformDashboard />
    </PlatformProtectedRoute>
  }
/>
```

### CR-03: Race Condition in Invitation Acceptance

**File:** `server/api/invitations.cjs:247-282`
**Issue:** The invitation acceptance flow uses `FOR UPDATE` in the CTE but then performs a separate check for existing users outside the transaction. This creates a race condition where multiple requests could accept the same invitation simultaneously.

```javascript
const result = await query(
  `WITH inv AS (
    SELECT id, tenant_id, email, role, expires_at
    FROM tenant_invitations
    WHERE token = $1 AND accepted_at IS NULL AND expires_at > CURRENT_TIMESTAMP
    FOR UPDATE
  )
  UPDATE tenant_invitations
  SET accepted_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT id FROM inv)
  RETURNING tenant_id, email, role`,
  [token]
);

// ...later, OUTSIDE transaction:
const existingUser = await query(
  'SELECT id FROM tenant_users WHERE email = $1 AND tenant_id = $2',
  [invitation.email, invitation.tenant_id]
);
```

**Fix:** Use the `transaction()` helper and include the duplicate user check within the transaction:

```javascript
const result = await transaction(async (client) => {
  // Lock and validate invitation
  const invResult = await client.query(
    `SELECT id, tenant_id, email, role, expires_at
     FROM tenant_invitations
     WHERE token = $1 AND accepted_at IS NULL AND expires_at > CURRENT_TIMESTAMP
     FOR UPDATE`,
    [token]
  );

  if (invResult.rows.length === 0) {
    throw new Error('INVALID_INVITATION');
  }

  const invitation = invResult.rows[0];

  // Check for existing user within transaction
  const existingUser = await client.query(
    'SELECT id FROM tenant_users WHERE email = $1 AND tenant_id = $2',
    [invitation.email, invitation.tenant_id]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('USER_EXISTS');
  }

  // Mark invitation as accepted
  await client.query(
    'UPDATE tenant_invitations SET accepted_at = CURRENT_TIMESTAMP WHERE id = $1',
    [invitation.id]
  );

  // Create user
  const passwordHash = await hashPassword(password);
  const userResult = await client.query(
    `INSERT INTO tenant_users (tenant_id, email, password_hash, role, first_name, last_name, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
     RETURNING id, email, role, first_name, last_name, created_at`,
    [invitation.tenant_id, invitation.email, passwordHash, invitation.role, firstName || '', lastName || '']
  );

  return userResult.rows[0];
});
```

## Warnings

### WR-01: Multi-Tenant Login Bypass - Email Collision Not Handled

**File:** `server/api/auth-platform.cjs:30-40`
**Issue:** The login query finds users by email only, returning the first match. With multi-tenant architecture, the same email could exist in multiple tenants. The code acknowledges this in a TODO comment but doesn't prevent it.

```javascript
// Find user by email (returns first matching email - TODO: add tenant/subdomain context for multi-tenant login)
const result = await query(
  `SELECT tu.id, tu.tenant_id, tu.email, tu.password_hash, tu.role,
          tu.first_name, tu.last_name, tu.status,
          t.slug as tenant_slug, t.name as tenant_name
   FROM tenant_users tu
   JOIN tenants t ON tu.tenant_id = t.id
   WHERE tu.email = $1 AND tu.status = 'ACTIVE'
   LIMIT 1`,
  [email]
);
```

**Fix:** Either enforce global email uniqueness (current pattern) or require tenant/subdomain context in login:

```javascript
// Option 1: Explicit tenant context via request header
const tenantSlug = req.headers['x-tenant-slug'];
if (!tenantSlug) {
  return res.status(400).json({
    success: false,
    error: 'Tenant context required. Include X-Tenant-Slug header.'
  });
}

const result = await query(
  `SELECT tu.id, tu.tenant_id, tu.email, tu.password_hash, tu.role,
          tu.first_name, tu.last_name, tu.status,
          t.slug as tenant_slug, t.name as tenant_name
   FROM tenant_users tu
   JOIN tenants t ON tu.tenant_id = t.id
   WHERE tu.email = $1 AND t.slug = $2 AND tu.status = 'ACTIVE'`,
  [email, tenantSlug]
);
```

### WR-02: PostgreSQL Session Variable Not Set for RLS

**File:** `server/lib/tenant-context.cjs:40-46`
**Issue:** The middleware stores tenant data in AsyncLocalStorage but never actually sets the PostgreSQL session variable `app.current_tenant` that RLS policies depend on. A TODO comment acknowledges this gap.

```javascript
function tenantMiddleware(req, res, next) {
  const tenantData = {
    tenantId: req.user?.tenantId,
    // ...
  };

  tenantContext.run(tenantData, () => {
    // Set PostgreSQL session variable for RLS policies
    if (tenantData.tenantId) {
      // Store in AsyncLocalStorage for app-layer access
      // PostgreSQL session variable set per-request in database queries
    }
    next();
  });
}
```

**Fix:** Set the session variable via a query at the start of each request:

```javascript
function tenantMiddleware(req, res, next) {
  const tenantData = {
    tenantId: req.user?.tenantId,
    tenantSlug: req.user?.tenantSlug,
    userId: req.user?.userId,
    role: req.user?.role
  };

  tenantContext.run(tenantData, async () => {
    // Set PostgreSQL session variable for RLS policies
    if (tenantData.tenantId) {
      try {
        await query('SELECT set_config($1, $2, true)', ['app.current_tenant', tenantData.tenantId]);
        if (tenantData.role) {
          await query('SELECT set_config($1, $2, true)', ['app.user_role', tenantData.role]);
        }
      } catch (error) {
        console.error('Failed to set tenant context:', error);
      }
    }
    next();
  });
}
```

### WR-03: Default JWT Secret in Production

**File:** `server/lib/auth-platform.cjs:5`
**Issue:** While there's a fallback to a default secret, there's no validation that a custom secret is set in production. Using default secrets makes all tokens vulnerable.

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
```

**Fix:** Add validation for production environments:

```javascript
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  console.warn('WARNING: Using default JWT secret. Set JWT_SECRET environment variable for production.');
}

const JWT_EXPIRY = '7d';
```

### WR-04: RLS Policy with Hardcoded Password in SQL

**File:** `server/migrations/004_create_rls_policies.sql:14`
**Issue:** The `app_user` role is created with a hardcoded password that must be changed manually. This is easy to forget in production.

```sql
CREATE ROLE app_user WITH LOGIN PASSWORD 'change-me-in-production';
```

**Fix:** Use password from environment or mark it as requiring password authentication:

```sql
-- Option 1: No password (use peer/ident authentication locally)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    EXECUTE format('CREATE ROLE app_user WITH LOGIN');
  END IF;
END
$$;

-- Option 2: Document required manual setup in migration comments
-- WARNING: Set app_user password manually in production:
-- ALTER ROLE app_user WITH PASSWORD '<strong-password>';
```

### WR-05: Missing Rate Limiting on Authentication Endpoints

**File:** `server/api/auth-platform.cjs:18-98`
**Issue:** Login and registration endpoints have no rate limiting. This allows brute force attacks on passwords and automated account creation attacks.

**Fix:** Add rate limiting middleware:

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: 'Too many registration attempts, please try again later.',
});

router.post('/login', authLimiter, async (req, res) => { /* ... */ });
```

### WR-06: Password Hash Not Constant-Time Compared

**File:** `server/lib/auth-platform.cjs:94-96`
**Issue:** While bcrypt's `compare()` is used (good), there's no timing attack protection on email comparison. The password error is returned immediately when user is not found, leaking account existence.

```javascript
if (result.rows.length === 0) {
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials'
  });
}

const passwordMatch = await comparePassword(password, user.password_hash);

if (!passwordMatch) {
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials'
  });
}
```

**Fix:** Always perform password comparison to prevent timing attacks (or use a dummy hash):

```javascript
// Use constant-time comparison by always running bcrypt.compare
const passwordMatch = result.rows.length > 0
  ? await comparePassword(password, result.rows[0].password_hash)
  : await comparePassword(password, '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'); // dummy hash

if (!passwordMatch || result.rows.length === 0) {
  return res.status(401).json({
    success: false,
    error: 'Invalid credentials'
  });
}
```

### WR-07: Module Dependency Sort Has In-Degree Calculation Bug

**File:** `server/lib/modules.cjs:78-84`
**Issue:** The topological sort calculates in-degrees incorrectly. It increments the in-degree of dependencies instead of the modules that depend on them. This could cause incorrect sorting order.

```javascript
// Calculate in-degrees
for (const [name, deps] of Object.entries(graph)) {
  for (const dep of deps) {
    if (inDegree[dep] !== undefined) {
      inDegree[dep] = (inDegree[dep] || 0) + 1;  // BUG: increments dep instead of name
    }
  }
}
```

**Fix:** Correct the in-degree calculation:

```javascript
// Calculate in-degrees (how many modules depend on each module)
for (const [name, deps] of Object.entries(graph)) {
  for (const dep of deps) {
    if (inDegree[dep] !== undefined) {
      // Dependent module (name) gets its in-degree incremented
      // because it depends on 'dep'
    }
  }
}

// Actually, for Kahn's algorithm, we want:
// in-degree = number of dependencies each module has
for (const [name, deps] of Object.entries(graph)) {
  inDegree[name] = deps.length;
}
```

### WR-08: Invitation Token Exposure in Development

**File:** `server/api/invitations.cjs:132-134`
**Issue:** The invitation token is exposed in API responses in development mode. While convenient for testing, this could create confusion and security issues if development builds are accidentally deployed.

```javascript
// Only return token in development for testing
...(process.env.NODE_ENV === 'development' && { token })
```

**Fix:** Use a more explicit flag and ensure production builds never expose tokens:

```javascript
// Expose token only when explicitly enabled (never in production)
const exposeToken = process.env.EXPOSE_INVITATION_TOKENS === 'true' && process.env.NODE_ENV !== 'production';

res.status(201).json({
  success: true,
  message: 'Invitation created successfully',
  invitation: {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expires_at,
    token: exposeToken ? token : undefined
  }
});
```

## Info

### IN-01: Duplicate Enum Definition in Types

**File:** `types.ts:242-248` and `types.ts:273-279`
**Issue:** `HipagesLeadStatus` enum is defined twice in the same file. The second definition overrides the first, which could cause confusion.

**Fix:** Remove the duplicate definition at lines 273-279.

### IN-02: HipagesLead Interface Duplicate

**File:** `types.ts:250-268` and `types.ts:281-298`
**Issue:** `HipagesLead` interface is defined twice with minor differences. The second one omits the optional `?` from `postedDate`.

**Fix:** Consolidate into a single interface definition.

### IN-03: Inconsistent Type Naming Conventions

**File:** `types.ts`
**Issue:** Some interfaces use `Id` suffix (e.g., `customerId`, `documentId`) while others use prefix (e.g., `HipagesLead`). Inconsistent naming conventions reduce code readability.

**Fix:** Establish and follow consistent naming convention throughout types.

### IN-04: Import Name Collision in App.tsx

**File:** `App.tsx:39`
**Issue:** `RegisterPage` is imported from `pages/platform/RegisterPage.tsx` but the name collides with a potentially existing `RegisterPage` in another scope. The import is explicitly named but the inconsistency suggests potential refactoring residue.

```tsx
import RegisterPage from './pages/platform/RegisterPage';
```

**Fix:** Use explicit named imports or rename to `PlatformRegisterPage` for clarity.

### IN-05: Console.log Statements in Production Code

**File:** `server/index.cjs:8-9` and multiple locations
**Issue:** Various console.log statements throughout the codebase for debugging. While some are appropriate for server startup, others should use proper logging.

```javascript
console.log('🔧 Environment configuration:');
console.log('  - DATABASE_URL hostname:', process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1]?.split(':')[0] : 'NOT SET');
```

**Fix:** Use proper logging library (winston, pino) for production code with appropriate log levels.

---

_Reviewed: 2026-04-20T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
