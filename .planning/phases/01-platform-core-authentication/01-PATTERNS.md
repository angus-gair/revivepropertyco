# Phase 1: Platform Core & Authentication - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 13
**Analogs found:** 13 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `server/lib/auth-platform.cjs` | middleware | request-response | `server/lib/auth.cjs` | exact |
| `server/lib/tenant-context.cjs` | utility | request-response | `server/lib/auth.cjs` (authenticateToken pattern) | role-match |
| `server/lib/modules.cjs` | utility | event-driven | `server/lib/hipages-sync.cjs` | partial (new pattern) |
| `server/api/platform.cjs` | controller | CRUD | `server/api/customer.cjs` | exact |
| `server/api/auth-platform.cjs` | controller | request-response | `server/api/auth.cjs` | exact |
| `server/api/invitations.cjs` | controller | CRUD | `server/api/customer.cjs` | role-match |
| `server/api/modules.cjs` | controller | CRUD | `server/api/crm.cjs` | role-match |
| `server/migrations/003_create_platform_tables.sql` | migration | batch | `server/migrations/001_create_customer_portal_tables.sql` | exact |
| `server/migrations/004_create_rls_policies.sql` | migration | batch | `server/migrations/002_create_hipages_leads_table.sql` | exact |
| `server/seeds/default-tenant-seed.sql` | migration | batch | `server/migrations/001_create_customer_portal_tables.sql` (verification queries) | role-match |
| `pages/platform/RegisterPage.tsx` | component | request-response | `pages/LoginPage.tsx` | role-match |
| `pages/platform/LoginPlatformPage.tsx` | component | request-response | `pages/LoginPage.tsx` | exact |
| `contexts/TenantAuthContext.tsx` | context | state | `contexts/CustomerAuthContext.tsx` | exact |

## Pattern Assignments

### `server/lib/auth-platform.cjs` (middleware, request-response)

**Analog:** `server/lib/auth.cjs`

**Imports pattern** (lines 1-3):
```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./database.cjs');
```

**Constants pattern** (lines 5-6):
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRY = '7d'; // Token expires in 7 days
```

**JWT token generation pattern** (lines 8-13):
```javascript
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}
```

**Token verification pattern** (lines 15-24):
```javascript
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
```

**Authentication middleware pattern** (lines 26-51):
```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Token required.'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }

  req.user = decoded;
  next();
}
```

**Password hashing pattern** (lines 53-59):
```javascript
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}
```

**Password comparison pattern** (lines 61-66):
```javascript
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
```

---

### `server/lib/tenant-context.cjs` (utility, request-response)

**Analog:** `server/lib/auth.cjs` (middleware pattern for extracting context from JWT)

**AsyncLocalStorage pattern** (from RESEARCH.md lines 159-175):
```javascript
const { AsyncLocalStorage } = require('async_hooks');
const tenantContext = new AsyncLocalStorage();

// Middleware to extract tenant_id from JWT and store in context
function tenantMiddleware(req, res, next) {
  const tenantId = req.user?.tenantId;
  tenantContext.run({ tenantId }, () => next());
}

// Usage anywhere in async call chain
function getTenantId() {
  return tenantContext.getStore()?.tenantId;
}
```

---

### `server/lib/modules.cjs` (utility, event-driven)

**Analog:** `server/lib/hipages-sync.cjs` (subscription/initiation pattern)

**Module registry class pattern** (from RESEARCH.md lines 219-295):
```javascript
const fs = require('fs');
const path = require('path');

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  async discoverModules(modulePath) {
    const entries = fs.readdirSync(modulePath, { withFileTypes: true });
    const moduleDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

    for (const dir of moduleDirs) {
      const manifestPath = path.join(modulePath, dir.name, 'manifest.json');
      const indexPath = path.join(modulePath, dir.name, 'index.cjs');

      if (fs.existsSync(manifestPath) && fs.existsSync(indexPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const moduleExports = require(indexPath);

        this.modules.set(manifest.name, { manifest, exports: moduleExports, path });
      }
    }
    return this.sortModulesByDependency();
  }

  sortModulesByDependency() {
    // Topological sort implementation
  }

  async registerAll(app, db) {
    const order = this.sortModulesByDependency();
    for (const moduleName of order) {
      const module = this.modules.get(moduleName);
      if (module?.exports.register) {
        await module.exports.register(app, db);
      }
    }
  }
}
```

**requireModule middleware pattern** (from RESEARCH.md lines 344-370):
```javascript
function requireModule(moduleName) {
  return async (req, res, next) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT active FROM tenant_modules WHERE tenant_id = $1 AND module_name = $2`,
      [tenantId, moduleName]
    );

    if (result.rows.length === 0 || !result.rows[0].active) {
      return res.status(403).json({
        error: `Module '${moduleName}' is not active for your tenant.`
      });
    }
    next();
  };
}
```

---

### `server/api/platform.cjs` (controller, CRUD)

**Analog:** `server/api/customer.cjs`

**Imports pattern** (lines 6-14):
```javascript
const express = require('express');
const { query } = require('../lib/database.cjs');
const { generateToken, verifyToken, authenticateToken, hashPassword, comparePassword } = require('../lib/auth.cjs');
const router = express.Router();
```

**Router setup pattern** (line 16):
```javascript
const router = express.Router();
```

**POST handler with validation pattern** (lines 22-57):
```javascript
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, mobile, email, password } = req.body;

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    // Check existing
    const existingCustomer = await query(
      'SELECT customer_id FROM customers WHERE mobile = $1 OR email = $2',
      [mobile || null, email || null]
    );

    if (existingCustomer.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this mobile number or email already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create record
    const result = await query(
      `INSERT INTO customers (...) VALUES (...) RETURNING ...`,
      [...]
    );

    const customer = result.rows[0];
    const token = generateToken(customer.customer_id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      customer: { ... }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating your account.'
    });
  }
});
```

**Authenticated GET handler pattern** (lines 228-271):
```javascript
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;

    const result = await query(
      `SELECT ... FROM customers WHERE customer_id = $1`,
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      customer: { ... }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching your profile'
    });
  }
});
```

---

### `server/api/auth-platform.cjs` (controller, request-response)

**Analog:** `server/api/auth.cjs`

**Login endpoint pattern** (lines 10-68):
```javascript
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.'
      });
    }

    // Find user
    const result = await query(
      `SELECT id, username, password_hash, email FROM admin_users WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.'
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: { ... }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

---

### `server/api/invitations.cjs` (controller, CRUD)

**Analog:** `server/api/customer.cjs`

**POST create with authentication pattern** (lines 22-135):
```javascript
router.post('/invite', authenticateToken, async (req, res) => {
  try {
    const { email, role } = req.body;
    const tenantId = req.user.tenantId;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check existing
    const existingUser = await query(
      'SELECT id FROM tenant_users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create invitation
    const result = await query(
      `INSERT INTO tenant_invitations (...) VALUES (...) RETURNING ...`,
      [...]
    );

    res.status(201).json({
      success: true,
      invitation: result.rows[0]
    });
  } catch (error) {
    console.error('Invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invitation'
    });
  }
});
```

---

### `server/api/modules.cjs` (controller, CRUD)

**Analog:** `server/api/crm.cjs`

**Router with global authentication pattern** (lines 1-8):
```javascript
const express = require('express');
const router = express.Router();
const { query } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');

// Apply authentication to all routes
router.use(authenticateToken);
```

**GET all with authentication pattern** (lines 13-23):
```javascript
router.get('/leads', async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM leads ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});
```

---

### `server/migrations/003_create_platform_tables.sql` (migration, batch)

**Analog:** `server/migrations/001_create_customer_portal_tables.sql`

**Migration header pattern** (lines 1-5):
```sql
-- Migration 001: Create Customer Portal Tables
-- Description: Creates tables for customer authentication, document management, quote approvals, and audit logging
-- Author: Angus James Gair
-- Date: 2026-04-13
-- Version: 1.0.0
```

**Table creation pattern** (lines 11-26):
```sql
CREATE TABLE IF NOT EXISTS customers (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Comments pattern** (lines 28-34):
```sql
-- Add comments for documentation
COMMENT ON TABLE customers IS 'Customer portal user accounts';
COMMENT ON COLUMN customers.customer_id IS 'Unique customer identifier (UUID)';
COMMENT ON COLUMN customers.mobile IS 'Mobile number (Australian format: +61 or 04xxxxxxxx), unique if provided';
```

**Indexes pattern** (lines 36-40):
```sql
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile) WHERE mobile IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);
```

**Foreign key with cascade pattern** (lines 46-56):
```sql
CREATE TABLE IF NOT EXISTS customer_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  -- ...
);
```

**Verification queries pattern** (lines 214-253):
```sql
-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check customers table
SELECT 'customers table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'customers';

-- Check indexes
SELECT 'customers indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename = 'customers';
```

---

### `server/migrations/004_create_rls_policies.sql` (migration, batch)

**Analog:** `server/migrations/002_create_hipages_leads_table.sql`

**RLS enable pattern** (from RESEARCH.md lines 195-196):
```sql
-- Enable RLS on table
ALTER TABLE leads SET ROW LEVEL SECURITY;
```

**RLS policy pattern** (from RESEARCH.md lines 198-201):
```sql
-- Create policy that filters by session variable
CREATE POLICY tenant_isolation_policy ON leads
  USING (tenant_id = current_setting('app.current_tenant', TRUE)::uuid);
```

**Verification pattern** (lines 64-73 from analog):
```sql
-- Check table exists
SELECT 'hipages_leads table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'hipages_leads';

-- Check foreign key constraint
SELECT 'hipages_leads.crm_lead_id foreign key exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.table_constraints
WHERE constraint_name = 'hipages_leads_crm_lead_id_fkey';
```

---

### `server/seeds/default-tenant-seed.sql` (migration, batch)

**Analog:** `server/migrations/001_create_customer_portal_tables.sql` (INSERT pattern within migrations)

**Insert seed data pattern** (from RESEARCH.md lines 497-520):
```sql
-- Create default pipeline stages for a new tenant
INSERT INTO pipeline_stages (tenant_id, name, order, color) VALUES
  ($1, 'New', 1, '#3B82F6'),
  ($1, 'Contacted', 2, '#F59E0B'),
  ($1, 'Qualified', 3, '#10B981'),
  ($1, 'Quote Sent', 4, '#8B5CF6'),
  ($1, 'Booked', 5, '#EC4899'),
  ($1, 'Completed', 6, '#6366F1');

-- Create default categories
INSERT INTO categories (tenant_id, name, icon) VALUES
  ($1, 'Pressure Washing', 'water-drop'),
  ($1, 'Garden Maintenance', 'leaf'),
  ($1, 'Rubbish Removal', 'trash');
```

---

### `pages/platform/RegisterPage.tsx` (component, request-response)

**Analog:** `pages/LoginPage.tsx`

**Imports pattern** (lines 1-6):
```typescript
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageSEO } from '../hooks/usePageSEO';
```

**Component state pattern** (lines 13-18):
```typescript
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const { signIn } = useAuth();
const navigate = useNavigate();
```

**Form submission handler pattern** (lines 25-58):
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  // Simulate API delay for UX
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Client-side credential validation
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      throw new Error('Invalid username or password');
    }

    // Create mock user and token
    const mockUser = { id: '1', username: ADMIN_USERNAME, email: 'admin@revivepropertyco.au' };
    const mockToken = btoa(JSON.stringify({ user: mockUser, exp: Date.now() + (24 * 60 * 60 * 1000) }));

    signIn(mockToken, mockUser);
    navigate(from, { replace: true });
  } catch (err: any) {
    setError(err.message || "Failed to login");
  } finally {
    setLoading(false);
  }
};
```

**Form layout pattern** (lines 61-74):
```typescript
return (
  <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex justify-center">
        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
          <Lock className="h-6 w-6 text-white" />
        </div>
      </div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
        Sign in to CRM
      </h2>
    </div>
```

**Input field pattern** (lines 76-91):
```typescript
<div>
  <label htmlFor="username" className="block text-sm font-medium text-slate-700">
    Username
  </label>
  <div className="mt-1">
    <input
      id="username"
      name="username"
      type="text"
      autoComplete="username"
      required
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    />
  </div>
</div>
```

**Loading button pattern** (lines 118-134):
```typescript
<button
  type="submit"
  disabled={loading}
  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all active:scale-[0.98]"
>
  {loading ? (
    <>
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Signing in...
    </>
  ) : 'Sign in'}
</button>
```

---

### `pages/platform/LoginPlatformPage.tsx` (component, request-response)

**Analog:** `pages/LoginPage.tsx`

**Same exact patterns as RegisterPage.tsx** - follows the same form layout, state management, and submission pattern.

---

### `contexts/TenantAuthContext.tsx` (context, state)

**Analog:** `contexts/CustomerAuthContext.tsx`

**Imports pattern** (lines 1-8):
```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, loginCustomer, logoutCustomer, getStoredCustomer, getStoredToken, isAuthenticated as checkAuth } from '../services/customerService';
```

**Context interface pattern** (lines 9-19):
```typescript
interface CustomerAuthContextType {
  customer: Customer | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}
```

**Context creation pattern** (line 20):
```typescript
const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);
```

**Provider component pattern** (lines 22-48):
```typescript
export const CustomerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedCustomer = getStoredCustomer();
        const storedToken = getStoredToken();

        if (storedCustomer && storedToken) {
          setCustomer(storedCustomer);
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        logoutCustomer();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);
```

**Login function pattern** (lines 50-72):
```typescript
const login = async (identifier: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
  setLoading(true);
  try {
    const response = await loginCustomer({ identifier, password });

    if (response.success && response.token && response.customer) {
      setCustomer(response.customer);
      setToken(response.token);
      return { success: true };
    }

    return { success: false, error: response.error || 'Login failed' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  } finally {
    setLoading(false);
  }
};
```

**Provider value pattern** (lines 134-149):
```typescript
const value: CustomerAuthContextType = {
  customer,
  token,
  loading,
  isAuthenticated: !!(customer && token),
  login,
  register,
  logout,
  refreshCustomer
};

return (
  <CustomerAuthContext.Provider value={value}>
    {children}
  </CustomerAuthContext.Provider>
);
```

**Custom hook pattern** (lines 152-158):
```typescript
export const useCustomerAuth = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
```

---

## Shared Patterns

### Authentication Middleware
**Source:** `server/lib/auth.cjs` (lines 26-51)
**Apply to:** All protected API routes

```javascript
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Token required.'
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }

  req.user = decoded;
  next();
}
```

### Error Handling
**Source:** `server/api/customer.cjs` (lines 128-134)
**Apply to:** All service and controller files

```javascript
} catch (error) {
  console.error('Registration error:', error);
  res.status(500).json({
    success: false,
    error: 'An error occurred while creating your account. Please try again.'
  });
}
```

### Validation Pattern
**Source:** `server/api/customer.cjs` (lines 36-56)
**Apply to:** All controller POST/PUT handlers

```javascript
// Validation
if (!firstName || !lastName) {
  return res.status(400).json({
    success: false,
    error: 'First name and last name are required'
  });
}

if (!mobile && !email) {
  return res.status(400).json({
    success: false,
    error: 'Either mobile number or email address is required'
  });
}

if (!password || password.length < 8) {
  return res.status(400).json({
    success: false,
    error: 'Password must be at least 8 characters long'
  });
}
```

### Response Format
**Source:** `server/api/customer.cjs` (lines 116-127)
**Apply to:** All API endpoints

```javascript
res.status(201).json({
  success: true,
  message: 'Account created successfully',
  token,
  customer: {
    customerId: customer.customer_id,
    firstName: customer.first_name,
    lastName: customer.last_name,
    mobile: customer.mobile,
    email: customer.email
  }
});
```

### Database Query Pattern
**Source:** `server/lib/database.cjs` (lines 16-24)
**Apply to:** All database operations

```javascript
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
```

### Transaction Pattern
**Source:** `server/lib/database.cjs` (lines 29-42)
**Apply to:** Multi-step database operations

```javascript
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### LocalStorage Auth Persistence
**Source:** `contexts/AuthContext.tsx` (lines 29-55)
**Apply to:** All auth contexts

```typescript
useEffect(() => {
  const token = localStorage.getItem('revive_admin_token');
  const savedUser = localStorage.getItem('revive_admin_user');

  if (token && savedUser) {
    try {
      setUser(JSON.parse(savedUser));
    } catch (e) {
      localStorage.removeItem('revive_admin_token');
      localStorage.removeItem('revive_admin_user');
    }
  }
  setLoading(false);
}, []);

const signIn = (token: string, user: User) => {
  localStorage.setItem('revive_admin_token', token);
  localStorage.setItem('revive_admin_user', JSON.stringify(user));
  setUser(user);
};
```

### Route Mounting Pattern
**Source:** `server/index.cjs` (lines 72-84)
**Apply to:** All new API routes in server/index.cjs

```javascript
// Import routes
const platformRouter = require('./api/platform.cjs');
const authPlatformRouter = require('./api/auth-platform.cjs');
const invitationsRouter = require('./api/invitations.cjs');
const modulesRouter = require('./api/modules.cjs');

// Mount routes
app.use('/api/platform', platformRouter);
app.use('/api/auth/platform', authPlatformRouter);
app.use('/api/invitations', invitationsRouter);
app.use('/api/modules', modulesRouter);
```

---

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `server/lib/tenant-context.cjs` | utility | request-response | AsyncLocalStorage is new to Phase 1, not used elsewhere in codebase |
| `server/lib/modules.cjs` | utility | event-driven | Module registry pattern is new, use RESEARCH.md lines 219-295 |
| `server/migrations/004_create_rls_policies.sql` | migration | batch | RLS policies not used elsewhere, use RESEARCH.md lines 188-210 |

---

## Metadata

**Analog search scope:** server/lib, server/api, server/migrations, contexts, pages
**Files scanned:** 25
**Pattern extraction date:** 2026-04-20

---

*Phase: 01-platform-core-authentication*
*Pattern mapping complete: 2026-04-20*
