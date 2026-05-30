# Phase 2: Twenty CRM Integration - Pattern Map

**Mapped:** 2026-04-20
**Files analyzed:** 11
**Analogs found:** 11 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `server/lib/twenty-client.cjs` | service | request-response | `server/lib/hipages-sync.cjs` | role-match |
| `server/lib/twenty-webhooks.cjs` | utility | request-response | `server/lib/auth-platform.cjs` | role-match |
| `server/api/twenty-webhooks.cjs` | route | request-response | `server/api/crm.cjs` | exact |
| `server/migrations/005_backup_old_tables.sql` | migration | batch | `server/migrations/002_rollback_hipages_leads_table.sql` | exact |
| `server/migrations/006_drop_old_tables.sql` | migration | batch | `server/migrations/002_rollback_hipages_leads_table.sql` | exact |
| `services/twenty-migrate/export-existing.cjs` | utility | batch | `services/hipages-scraper/src/db-writer.js` | data-flow-match |
| `services/twenty-migrate/transform-data.cjs` | utility | transform | `services/hipages-scraper/src/db-writer.js` | data-flow-match |
| `services/twenty-migrate/import-to-twenty.cjs` | utility | batch | `services/hipages-scraper/src/db-writer.js` | data-flow-match |
| `docker-compose.yml` (modified) | config | - | `docker-compose.yml` | exact (same file) |
| `types.ts` (modified) | type | - | `types.ts` | exact (same file) |
| `.env` (modified) | config | - | `.env` | exact (same file) |

## Pattern Assignments

### `server/lib/twenty-client.cjs` (service, request-response)

**Analog:** `server/lib/hipages-sync.cjs`

**Rationale:** Both are service utilities that handle external API communication and connection management.

**Imports pattern** (lines 1-2):
```javascript
// Source: server/lib/hipages-sync.cjs
const { pool } = require('./database.cjs');
// For twenty-client: Use node-fetch or fetch for HTTP requests
const fetch = require('node-fetch');
```

**Client initialization pattern** (adapted from `server/lib/database.cjs` lines 10-15):
```javascript
// Source: server/lib/database.cjs
// Connection pool configuration - DATABASE_URL is required for security
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}
const pool = new Pool({
  connectionString: dbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Apply to twenty-client.cjs:
const TWENTY_BASE_URL = process.env.TWENTY_SERVER_URL || 'http://twenty:3000';
if (!process.env.TWENTY_API_TOKEN) {
  throw new Error('TWENTY_API_TOKEN environment variable is required');
}
```

**Class-based API wrapper pattern** (from RESEARCH.md Pattern 1):
```javascript
// Source: Twenty CRM docs via RESEARCH.md
class TwentyClient {
  constructor(apiToken, baseUrl = TWENTY_BASE_URL) {
    this.apiToken = apiToken;
    this.baseUrl = baseUrl;
  }

  async graphql(query, variables = {}) {
    const response = await fetch(`${this.baseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`Twenty GraphQL error: ${response.statusText}`);
    }

    const { data, errors } = await response.json();
    if (errors) {
      throw new Error(`Twenty GraphQL errors: ${JSON.stringify(errors)}`);
    }

    return data;
  }

  async rest(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}/rest/${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Twenty REST error: ${response.statusText}`);
    }

    return response.json();
  }
}

module.exports = { TwentyClient };
```

---

### `server/lib/twenty-webhooks.cjs` (utility, request-response)

**Analog:** `server/lib/auth-platform.cjs`

**Rationale:** Both handle authentication/verification logic with crypto operations.

**Imports pattern** (lines 1-2 from `server/lib/auth-platform.cjs`):
```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// For twenty-webhooks: use crypto instead
const crypto = require('crypto');
```

**Function pattern for verification** (lines 45-51 from `server/lib/auth-platform.cjs`):
```javascript
// Source: server/lib/auth-platform.cjs
function verifyTenantToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Apply to webhook signature verification:
function verifyWebhookSignature(rawPayload, timestampHeader, signatureHeader, secret) {
  const stringToSign = `${timestampHeader}:${rawPayload}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign);
  const computedSignature = hmac.digest('hex');
  return computedSignature === signatureHeader;
}
```

**Middleware pattern** (lines 57-86 from `server/lib/auth-platform.cjs`):
```javascript
// Source: server/lib/auth-platform.cjs
function authenticateTenantToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Token required.'
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyTenantToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }

  req.user = {
    userId: decoded.userId,
    tenantId: decoded.tenantId,
    tenantSlug: decoded.tenantSlug,
    role: decoded.role
  };

  next();
}

// Apply to webhook middleware:
function webhookMiddleware(secret) {
  return (req, res, next) => {
    const timestamp = req.headers['x-twenty-webhook-timestamp'] || req.headers['twenty-timestamp'];
    const signature = req.headers['x-twenty-webhook-signature'] || req.headers['twenty-signature'];

    if (!timestamp || !signature) {
      return res.status(401).json({ error: 'Missing webhook headers' });
    }

    const rawPayload = req.body.toString();

    if (verifyWebhookSignature(rawPayload, timestamp, signature, secret)) {
      req.webhookPayload = JSON.parse(rawPayload);
      next();
    } else {
      console.error('Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
    }
  };
}
```

---

### `server/api/twenty-webhooks.cjs` (route, request-response)

**Analog:** `server/api/crm.cjs`

**Rationale:** Both are Express routers that handle API endpoints with authentication.

**Router setup pattern** (lines 1-8):
```javascript
// Source: server/api/crm.cjs
const express = require('express');
const router = express.Router();
const { query } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');

// Apply authentication to all CRM routes
router.use(authenticateToken);

// Apply to twenty-webhooks:
const express = require('express');
const router = express.Router();
const { webhookMiddleware } = require('../lib/twenty-webhooks.cjs');
```

**POST handler pattern** (lines 86-103 from `server/api/crm.cjs`):
```javascript
// Source: server/api/crm.cjs
router.post('/tasks', async (req, res) => {
  try {
    const { title, leadId, dueDate, completed } = req.body;
    // ... processing logic

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

// Apply to webhook receiver:
router.post('/webhooks',
  webhookMiddleware(process.env.TWENTY_WEBHOOK_SECRET),
  async (req, res) => {
    const { event, data, timestamp } = req.webhookPayload;

    try {
      switch (event) {
        case 'person.created':
          await handlePersonCreated(data);
          break;
        case 'serviceJob.created':
          await handleServiceJobCreated(data);
          break;
        default:
          console.log(`Unhandled event type: ${event}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
  }
);
```

**Error handling pattern** (lines 19-22):
```javascript
// Source: server/api/crm.cjs
} catch (error) {
  console.error('Error fetching leads:', error);
  res.status(500).json({ success: false, error: 'Failed to fetch leads' });
}
```

---

### `server/migrations/005_backup_old_tables.sql` (migration, batch)

**Analog:** `server/migrations/002_rollback_hipages_leads_table.sql`

**Rationale:** Both are SQL scripts that handle table operations with transaction safety.

**Migration header pattern** (lines 1-11):
```sql
-- Source: server/migrations/002_create_hipages_leads_table.sql
-- Migration 002: Create hipages_leads Table
-- Description: Creates table for storing hipages.com.au scraped leads with metadata
-- Author: Angus James Gair
-- Date: 2026-04-13
-- Version: 1.0.0

-- Apply to 005_backup_old_tables.sql:
-- Migration 005: Backup Old Tables Before Twenty Cutover
-- Description: Creates backups of existing leads, appointments, tasks, quotes tables
-- Author: Claude (GSD Planner)
-- Date: 2026-04-20
-- Version: 1.0.0
```

**Transaction pattern** (lines 18-37 from `server/migrations/002_rollback_hipages_leads_table.sql`):
```sql
-- Source: server/migrations/002_rollback_hipages_leads_table.sql
BEGIN;

-- ============================================================================
-- WARNING: DESTRUCTIVE OPERATION
-- ============================================================================
-- This rollback will permanently delete:
-- - All hipages scraped leads
-- - All hipages metadata (credits, status, raw data)
--
-- Ensure you have a database backup before proceeding!
-- ============================================================================

-- Apply to backup migration:
BEGIN;

-- ============================================================================
-- BACKUP OPERATION
-- ============================================================================
-- This migration creates backup copies of existing tables before Twenty cutover.
-- These backups serve as rollback path if Twenty integration fails.
-- ============================================================================

-- Create backup tables
CREATE TABLE IF NOT EXISTS leads_backup AS SELECT * FROM leads;
CREATE TABLE IF NOT EXISTS appointments_backup AS SELECT * FROM appointments;
CREATE TABLE IF NOT EXISTS tasks_backup AS SELECT * FROM tasks;
CREATE TABLE IF NOT EXISTS quotes_backup AS SELECT * FROM quotes;

COMMIT;
```

**Verification pattern** (lines 61-72 from `server/migrations/002_rollback_hipages_leads_table.sql`):
```sql
-- Source: server/migrations/002_rollback_hipages_leads_table.sql
-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these to verify the rollback was successful

-- Verify table is gone
SELECT 'hipages_leads table dropped' AS check, COUNT(*) = 0 AS result
FROM information_schema.tables
WHERE table_name = 'hipages_leads';

-- Apply to backup verification:
SELECT 'leads_backup table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'leads_backup';

SELECT 'backup record count matches source' AS check,
  (SELECT COUNT(*) FROM leads_backup) = (SELECT COUNT(*) FROM leads) AS result;
```

---

### `server/migrations/006_drop_old_tables.sql` (migration, batch)

**Analog:** `server/migrations/002_rollback_hipages_leads_table.sql`

**Rationale:** Both handle table removal operations.

**Drop pattern** (lines 24-35 from `server/migrations/002_rollback_hipages_leads_table.sql`):
```sql
-- Source: server/migrations/002_rollback_hipages_leads_table.sql
-- ============================================================================
-- REMOVE INDEXES FIRST (in reverse order of creation)
-- ============================================================================

-- Drop hipages_leads indexes
DROP INDEX IF EXISTS idx_hipages_hipages_id;
DROP INDEX IF EXISTS idx_hipages_synced;
DROP INDEX IF EXISTS idx_hipages_status;
DROP INDEX IF EXISTS idx_hipages_scraped;

-- ============================================================================
-- REMOVE TABLE
-- ============================================================================

-- Drop hipages_leads table (CASCADE will remove foreign key constraints)
DROP TABLE IF EXISTS hipages_leads CASCADE;

-- Apply to 006_drop_old_tables.sql:
BEGIN;

-- Drop indexes first
DROP INDEX IF EXISTS idx_leads_created_at;
DROP INDEX IF EXISTS idx_appointments_lead_id;
-- ... (all other indexes)

-- Drop tables in correct order (respect foreign keys)
DROP TABLE IF EXISTS touchpoints CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

COMMIT;
```

---

### `services/twenty-migrate/export-existing.cjs` (utility, batch)

**Analog:** `services/hipages-scraper/src/db-writer.js`

**Rationale:** Both handle bulk data export/import operations with PostgreSQL connections.

**Database connection pattern** (lines 4-10):
```javascript
// Source: services/hipages-scraper/src/db-writer.js
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Apply to export-existing.cjs:
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20
});
```

**Transaction pattern for bulk operations** (lines 113-120 from `services/hipages-scraper/src/db-writer.js`):
```javascript
// Source: services/hipages-scraper/src/db-writer.js
async function saveLeads(leads) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let saved = 0;
    let updated = 0;

    // ... processing logic ...

    await client.query('COMMIT');
    return { saved, updated };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[db-writer] Error saving leads:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Apply to export-existing.cjs:
async function exportAllData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Export leads
    const leadsResult = await client.query('SELECT * FROM leads ORDER BY created_at');
    const leads = leadsResult.rows;

    // Export appointments
    const appointmentsResult = await client.query('SELECT * FROM appointments ORDER BY date');
    const appointments = appointmentsResult.rows;

    // Export tasks
    const tasksResult = await client.query('SELECT * FROM tasks ORDER BY created_at');
    const tasks = tasksResult.rows;

    // Export quotes
    const quotesResult = await client.query('SELECT * FROM quotes ORDER BY created_at');
    const quotes = quotesResult.rows;

    await client.query('COMMIT');

    return {
      leads,
      appointments,
      tasks,
      quotes,
      exportedAt: new Date().toISOString()
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[export] Error exporting data:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { exportAllData };
```

---

### `services/twenty-migrate/transform-data.cjs` (utility, transform)

**Analog:** `services/hipages-scraper/src/db-writer.js` (normalization functions)

**Rationale:** Both transform data between formats with normalization logic.

**Normalization pattern** (lines 48-66 from `services/hipages-scraper/src/db-writer.js`):
```javascript
// Source: services/hipages-scraper/src/db-writer.js
/**
 * Normalize hipages status to database enum values
 */
function normalizeStatus(status) {
  if (!status) {
    return 'AVAILABLE';
  }

  const statusMap = {
    'Available': 'AVAILABLE',
    'First to accept': 'FIRST_TO_ACCEPT',
    'Waitlist': 'WAITLIST',
    'Accepted': 'ACCEPTED',
    'Expired': 'EXPIRED'
  };

  return statusMap[status] || status.toUpperCase();
}

// Apply to transform-data.cjs:
/**
 * Transform existing leads to Twenty ServiceJob format
 */
function transformLeadToServiceJob(lead) {
  return {
    name: `${lead.service_interest} - ${lead.first_name} ${lead.last_name}`,
    description: lead.notes || '',
    status: mapLeadStatus(lead.status), // NEW, CONTACTED, BOOKED, ARCHIVED
    // Twenty's standard Person object will be created separately
    person: {
      firstName: lead.first_name,
      lastName: lead.last_name,
      email: lead.email,
      phone: lead.phone
    },
    metadata: {
      originalLeadId: lead.id,
      address: lead.address,
      serviceInterest: lead.service_interest,
      createdAt: lead.created_at
    }
  };
}

/**
 * Map platform lead status to Twenty status
 */
function mapLeadStatus(status) {
  const statusMap = {
    'NEW': 'NEW',
    'CONTACTED': 'CONTACTED',
    'BOOKED': 'BOOKED',
    'ARCHIVED': 'ARCHIVED'
  };
  return statusMap[status] || 'NEW';
}

/**
 * Transform appointment to Twenty format
 */
function transformAppointment(appointment) {
  return {
    name: `${appointment.service_type} - ${appointment.type}`,
    date: appointment.date,
    timeSlot: appointment.time_slot,
    type: appointment.type, // QUOTE or JOB
    status: appointment.status, // CONFIRMED, COMPLETED, CANCELLED
    metadata: {
      originalAppointmentId: appointment.id,
      leadId: appointment.lead_id
    }
  };
}

module.exports = {
  transformLeadToServiceJob,
  transformAppointment,
  mapLeadStatus
};
```

---

### `services/twenty-migrate/import-to-twenty.cjs` (utility, batch)

**Analog:** `services/hipages-scraper/src/db-writer.js`

**Rationale:** Both perform bulk data writes with error handling and progress tracking.

**Bulk write pattern** (lines 121-175 from `services/hipages-scraper/src/db-writer.js`):
```javascript
// Source: services/hipages-scraper/src/db-writer.js
const insertStmt = `
  INSERT INTO hipages_leads (
    hipages_id, customer_name, suburb, postcode,
    job_type, job_subtype, description, credits,
    status, contact_status, posted_date, scraped_at, raw_data
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
  ON CONFLICT (hipages_id) DO UPDATE SET
    status = EXCLUDED.status,
    contact_status = EXCLUDED.contact_status,
    scraped_at = EXCLUDED.scraped_at,
    raw_data = EXCLUDED.raw_data,
    updated_at = CURRENT_TIMESTAMP
  RETURNING lead_id
`;

for (const lead of leads) {
  const hipagesId = generateHipagesId(lead);
  const postedDate = parseDate(lead.posted_date);
  const status = normalizeStatus(lead.status);

  const values = [hipagesId, lead.customer_name || '', /* ... */];
  const result = await client.query(insertStmt, values);

  if (result.rows[0]) {
    saved++;
  }
}

// Apply to import-to-twenty.cjs:
const { TwentyClient } = require('../../server/lib/twenty-client.cjs');
const { transformLeadToServiceJob, transformAppointment } = require('./transform-data.cjs');

async function importToTwenty(transformedData, options = {}) {
  const { batchSize = 50, delay = 500 } = options;
  const twentyClient = new TwentyClient(process.env.TWENTY_API_TOKEN);

  let imported = 0;
  let failed = 0;
  const errors = [];

  // Import in batches with delays to avoid rate limits
  for (let i = 0; i < transformedData.leads.length; i += batchSize) {
    const batch = transformedData.leads.slice(i, i + batchSize);

    try {
      // First, ensure Person exists
      const people = await createPeople(batch, twentyClient);

      // Then create ServiceJobs linked to People
      for (const [index, lead] of batch.entries()) {
        const personId = people[index]?.id;
        if (!personId) continue;

        const mutation = `
          mutation CreateServiceJob($data: ServiceJobCreateInput!) {
            createServiceJob(data: $data) {
              id
              name
              status
            }
          }
        `;

        const variables = {
          data: {
            ...transformLeadToServiceJob(lead),
            person: { connect: { id: personId } }
          }
        };

        await twentyClient.graphql(mutation, variables);
        imported++;
      }

      // Delay between batches
      if (i + batchSize < transformedData.leads.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      console.error(`[import] Batch ${i / batchSize} failed:`, error.message);
      failed += batch.length;
      errors.push({ batch: i / batchSize, error: error.message });
    }
  }

  return { imported, failed, errors };
}

module.exports = { importToTwenty };
```

---

### `docker-compose.yml` (modified) (config)

**Analog:** `docker-compose.yml` (same file)

**Rationale:** Extending existing Docker Compose configuration with new services.

**Service definition pattern** (lines 98-124):
```yaml
# Source: docker-compose.yml (hipages-scraper service)
hipages-scraper:
  build:
    context: ./services/hipages-scraper
    dockerfile: Dockerfile
  container_name: revive-hipages-scraper
  restart: unless-stopped
  environment:
    - NODE_ENV=production
    - DATABASE_URL=${DATABASE_URL}
    - HIPAGES_USERNAME=${HIPAGES_USERNAME}
    - HIPAGES_PASSWORD=${HIPAGES_PASSWORD}
    - HIPAGES_HEADLESS=true
    - CRON_SCHEDULE=0 */6 * * *
  networks:
    - homelab_internal
  volumes:
    - hipages-output:/app/output
  healthcheck:
    test: ["CMD", "node", "-e", "new (require('pg').Client)(process.env.DATABASE_URL).connect().then(() => process.exit(0)).catch(() => process.exit(1))"]
    interval: 30s
    timeout: 10s
    retries: 3

# Apply to twenty services (from RESEARCH.md):
twenty-db:
  image: postgres:15-alpine
  container_name: twenty-postgres
  environment:
    POSTGRES_USER: twenty
    POSTGRES_PASSWORD: ${TWENTY_DB_PASSWORD}
    POSTGRES_DB: twenty_crms
  volumes:
    - twenty-data:/var/lib/postgresql/data
  networks:
    - homelab_internal
  healthcheck:
    test: ['CMD-SHELL', 'pg_isready -U twenty']
    interval: 10s
    timeout: 5s
    retries: 5

twenty-redis:
  image: redis:7-alpine
  container_name: twenty-redis
  volumes:
    - twenty-redis:/data
  networks:
    - homelab_internal
  healthcheck:
    test: ['CMD', 'redis-cli', 'ping']
    interval: 10s
    timeout: 3s
    retries: 5

twenty-server:
  image: twentycrm/twenty:v1.22.6
  container_name: twenty-server
  environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://twenty:${TWENTY_DB_PASSWORD}@twenty-db:5432/twenty_crms
    REDIS_URL: redis://twenty-redis:6379
    SERVER_URL: https://crm.ajinsights.com.au
    FRONT_BASE_URL: https://crm.ajinsights.com.au
    APP_SECRET: ${TWENTY_APP_SECRET}
  depends_on:
    twenty-db:
      condition: service_healthy
    twenty-redis:
      condition: service_healthy
  networks:
    - homelab_internal
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.twenty.rule=Host(`crm.ajinsights.com.au`)"
    - "traefik.http.routers.twenty.entrypoints=websecure"
    - "traefik.http.routers.twenty.tls.certresolver=cloudflare"

twenty-worker:
  image: twentycrm/twenty:v1.22.6
  container_name: twenty-worker
  command: ['node', 'dist/src/queue-worker/queue-worker']
  environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://twenty:${TWENTY_DB_PASSWORD}@twenty-db:5432/twenty_crms
    REDIS_URL: redis://twenty-redis:6379
    APP_SECRET: ${TWENTY_APP_SECRET}
  depends_on:
    - twenty-db
    - twenty-redis
    - twenty-server
  networks:
    - homelab_internal

# Add to volumes section:
volumes:
  twenty-data:
  twenty-redis:
```

---

### `types.ts` (modified) (type)

**Analog:** `types.ts` (same file)

**Rationale:** Extending existing TypeScript type definitions.

**Type definition pattern** (lines 186-219):
```typescript
// Source: types.ts
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free_trial' | 'growth' | 'enterprise';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL_EXPIRED';
  createdAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  firstName?: string;
  lastName?: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  lastLoginAt?: string;
  createdAt: string;
}

// Add to types.ts for Twenty CRM integration:
/**
 * Twenty CRM Integration Types
 */

export interface TwentyWorkspace {
  id: string;
  tenantId: string; // Link to platform tenant
  name: string;
  slug: string;
  apiToken: string; // Encrypted at rest
  createdAt: string;
}

export interface TwentyServiceJob {
  id: string;
  name: string;
  description?: string;
  status: 'NEW' | 'CONTACTED' | 'BOOKED' | 'ARCHIVED';
  personId: string; // Link to Twenty Person
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TwentyPerson {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  workspaceId: string;
}

export interface TwentyQuote {
  id: string;
  serviceJobId: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  totalAmount: number;
  expiryDate?: string;
  lineItems?: TwentyQuoteLineItem[];
}

export interface TwentyQuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TwentyWebhookEvent {
  event: string;
  data: any;
  timestamp: string;
  workspaceId: string;
}
```

---

### `.env` (modified) (config)

**Analog:** `.env` (same file)

**Rationale:** Extending existing environment variable configuration.

**Environment variable pattern** (from existing .env and CONTEXT.md D-01 to D-06):
```bash
# Existing pattern from .env:
DATABASE_URL=postgresql://homelab:PASSWORD@postgres:5432/revivepropertyco
JWT_SECRET=revive-property-jwt-secret-2026-production-secure

# Add for Twenty CRM integration:
# Twenty CRM Database
TWENTY_DB_PASSWORD=secure-password-change-me

# Twenty CRM Application
TWENTY_APP_SECRET=another-secure-secret-change-me
TWENTY_SERVER_URL=https://crm.ajinsights.com.au

# Twenty API (for platform integration)
TWENTY_API_TOKEN=your-twenty-api-token-here
TWENTY_WEBHOOK_SECRET=your-webhook-signing-secret-here

# Twenty Email (optional for Phase 2)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your-resend-api-key
```

---

## Shared Patterns

### Authentication/Token Management
**Source:** `server/lib/auth-platform.cjs`
**Apply to:** `server/lib/twenty-client.cjs`, `server/lib/twenty-webhooks.cjs`
```javascript
// Pattern: Environment variable validation with production checks
const isProduction = process.env.NODE_ENV === 'production';
const SECRET = process.env.SECRET_NAME || (isProduction ? null : 'dev-secret');

if (!process.env.SECRET_NAME) {
  if (isProduction) {
    throw new Error('SECRET_NAME environment variable must be set in production');
  }
  console.warn('WARNING: Using default secret for development only.');
}
```

### Error Handling Wrapper
**Source:** `server/api/crm.cjs` (lines 19-22, 27, 37, 52, 79, 101, 125, 140)
**Apply to:** All API route files
```javascript
// Pattern: Consistent error response structure
try {
  // ... operation ...
  res.json(result.rows[0]);
} catch (error) {
  console.error('Error description:', error);
  res.status(500).json({ success: false, error: 'Human-readable error message' });
}
```

### Database Transaction Pattern
**Source:** `server/lib/database.cjs` (lines 33-46)
**Apply to:** `services/twenty-migrate/*.cjs`
```javascript
// Pattern: Transaction wrapper with automatic rollback
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

### Express Route Definition
**Source:** `server/api/crm.cjs` (lines 1-8)
**Apply to:** `server/api/twenty-webhooks.cjs`
```javascript
// Pattern: Router with middleware
const express = require('express');
const router = express.Router();
const { middlewareFunction } = require('../lib/middleware.cjs');

router.use(middlewareFunction);

router.get('/path', async (req, res) => { /* handler */ });
router.post('/path', async (req, res) => { /* handler */ });

module.exports = router;
```

### UUID Generation
**Source:** `server/api/quotes.cjs` (lines 2, 48), `server/api/bookings.cjs` (lines 5, 73-76)
**Apply to:** All files that create new records
```javascript
// Pattern: UUID v4 for ID generation
const { v4: uuidv4 } = require('uuid');
const newId = uuidv4();
```

### Data Transformation with Mapping
**Source:** `services/hipagesService.ts` (lines 15-32)
**Apply to:** `services/twenty-migrate/transform-data.cjs`
```typescript
// Pattern: Snake_case to camelCase mapping
const mapDbRowToInterface = (dbRow: any): Interface => ({
  camelCase: dbRow.snake_case,
  nested: dbRow.nested_field
});
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| None | - | - | All files have analogs in the codebase |

**Note:** The Twenty-specific GraphQL mutations and REST API patterns come from RESEARCH.md (Twenty documentation) rather than existing code, as this is a new integration.

## Metadata

**Analog search scope:**
- `server/lib/` - Utility and service libraries
- `server/api/` - Express route handlers
- `server/migrations/` - SQL migration scripts
- `services/hipages-scraper/` - Batch processing and database operations
- `docker-compose.yml` - Docker service definitions
- `types.ts` - TypeScript type definitions

**Files scanned:** 20+
**Pattern extraction date:** 2026-04-20

**Key insight:** The existing hipages-scraper service provides excellent patterns for bulk data migration (export, transform, import flow). The CRM API routes demonstrate the platform's established patterns for authenticated endpoints and error handling. The migration scripts show how to safely handle schema changes with transaction safety and verification queries.
