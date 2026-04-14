# Phase 4: Integrate hipages lead scraper with real-time data sync - Pattern Map

**Mapped:** 2026-04-13
**Files analyzed:** 14
**Analogs found:** 12 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `services/hipages-scraper/src/scraper.js` | service | event-driven | `/home/ghost/hipages/scrape-leads.js` | exact |
| `services/hipages-scraper/src/db-writer.js` | service | CRUD | `server/lib/database.cjs` | role-match |
| `services/hipages-scraper/src/scheduler.js` | service | event-driven | `server/lib/queue.cjs` | role-match |
| `services/hipages-scraper/Dockerfile` | config | build-time | `/home/ghost/hipages/Dockerfile.scraper` | exact |
| `services/hipages-scraper/package.json` | config | build-time | `/home/ghost/hipages/package.json` | exact |
| `server/api/hipages.cjs` | controller | request-response | `server/api/crm.cjs` | exact |
| `server/lib/hipages-sync.cjs` | middleware | event-driven | `server/lib/queue.cjs` | role-match |
| `server/migrations/002_create_hipages_leads_table.sql` | migration | batch | `server/migrations/001_create_customer_portal_tables.sql` | exact |
| `pages/admin/HipagesLeadsPage.tsx` | component | request-response | `pages/AdminDashboard.tsx` | exact |
| `services/hipagesService.ts` | service | request-response | `services/crmService.ts` | exact |
| `docker-compose.yml` | config | orchestration | `docker-compose.yml` (existing) | exact |
| `types.ts` (modifications) | model | type-check | `types.ts` (existing) | exact |
| `server/index.cjs` (modifications) | route | request-response | `server/index.cjs` (existing) | exact |
| `.env` (modifications) | config | build-time | `.env` (existing) | exact |

## Pattern Assignments

### `services/hipages-scraper/src/scraper.js` (service, event-driven)

**Analog:** `/home/ghost/hipages/scrape-leads.js`

**Imports pattern** (lines 1-21):
```javascript
require("dotenv").config();
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
```

**Core scraping pattern** (lines 30-39):
```javascript
const CONFIG = {
  email: process.env.USERNAME,
  password: process.env.PASSWORD,
  leadsUrl: "https://business.hipages.com.au/leads",
  loginUrl: "https://business.hipages.com.au/login",
  outputFile: path.join(OUTPUT_DIR, "leads_data.json"),
  outputCsv: path.join(OUTPUT_DIR, "leads_data.csv"),
  headless: process.env.HEADLESS === 'true' || false,
  timeout: 60000,
};
```

**Browser automation pattern** (lines 55-100):
```javascript
// Parse leads from page text content
function parseLeadsFromText(pageText, pageHtml = null) {
  const leads = [];

  // Extract phone numbers from HTML if provided
  let phoneNumbers = [];
  if (pageHtml) {
    phoneNumbers = pageHtml.match(/0[45]\d{8}/g) || [];
  }

  // Extract image URLs from HTML if provided
  let images = [];
  if (pageHtml) {
    const imgMatches = pageHtml.match(/https:\/\/img\.hipages\.com\.au\/[^\s"<>]+?\.(?:jpg|jpeg|png|webp)/gi) || [];
    images = [...new Set([...imgMatches, ...attachmentMatches])];
  }

  // Split by credit indicators (e.g., "21 credits", "8 credits")
  const creditPattern = /(\d+)\s+credits/g;
  const leadBlocks = pageText.split(creditPattern);

  // Process each lead block
  for (let i = 0; i < leadBlocks.length - 1; i += 2) {
    const block = leadBlocks[i];
    const credits = leadBlocks[i + 1];

    if (!block || !credits || !block.trim()) continue;

    const lead = {
      credits: parseInt(credits) || 0,
      raw_block: block.trim().substring(0, 500),
    };
    // ... extraction logic
  }
}
```

**Modification required:** Replace file output with `db-writer.js` integration (call `dbWriter.saveLeads(leads)` instead of `fs.writeFileSync`)

---

### `services/hipages-scraper/src/db-writer.js` (service, CRUD)

**Analog:** `server/lib/database.cjs`

**Imports pattern** (lines 1-3):
```javascript
const { Pool } = require('pg');
const { query } = require('../lib/database.cjs'); // Or direct Pool for scraper
```

**Connection pool pattern** (lines 6-11):
```javascript
const pool = new Pool({
  connectionString: dbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

**Transaction pattern** (lines 29-42):
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

**Upsert pattern with NOTIFY** (from RESEARCH.md Example 2):
```javascript
async function saveLeads(leads) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertStmt = `
      INSERT INTO hipages_leads (
        hipages_id, customer_name, suburb, postcode, job_type, job_subtype,
        description, credits, status, contact_status, posted_date,
        scraped_at, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (hipages_id) DO UPDATE SET
        status = EXCLUDED.status,
        scraped_at = EXCLUDED.scraped_at,
        raw_data = EXCLUDED.raw_data
      RETURNING lead_id
    `;

    let saved = 0;
    for (const lead of leads) {
      await client.query(insertStmt, [/* params */]);
      saved++;
    }

    // Emit notification for real-time dashboard updates
    await client.query("NOTIFY hipages_leads_updated, '{"count": " + saved + "}'");

    await client.query('COMMIT');
    return { saved };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

### `services/hipages-scraper/src/scheduler.js` (service, event-driven)

**Analog:** `server/lib/queue.cjs`

**Cron job pattern** (from RESEARCH.md Example 3):
```javascript
require('dotenv').config();
const cron = require('node-cron');
const { runScrape } = require('./scraper');

const LOCK_FILE = '/tmp/hipages-scraper.lock';
const fs = require('fs');

function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
    try {
      process.kill(pid, 0);  // Check if process exists
      throw new Error('Scraper already running');
    } catch (e) {
      console.log('[scheduler] Stale lock found, removing');
      fs.unlinkSync(LOCK_FILE);
    }
  }
  fs.writeFileSync(LOCK_FILE, process.pid.toString());
}

function releaseLock() {
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
  }
}

async function scrapeJob() {
  console.log('[scheduler] Starting scheduled scrape');
  try {
    acquireLock();
    const result = await runScrape();
    console.log(`[scheduler] Scrape completed: ${result.saved} leads saved`);
  } catch (error) {
    console.error('[scheduler] Scrape failed:', error);
  } finally {
    releaseLock();
  }
}

// Schedule: Every 6 hours (0 6,12,18 * * *)
cron.schedule('0 */6 * * *', scrapeJob, {
  timezone: 'Australia/Sydney'
});

console.log('[scheduler] Hipages scraper scheduler started (every 6 hours)');
```

---

### `services/hipages-scraper/Dockerfile` (config, build-time)

**Analog:** `/home/ghost/hipages/Dockerfile.scraper`

**Base image pattern** (lines 1-31):
```dockerfile
FROM node:20-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    xvfb \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*
```

**User permissions pattern** (lines 35-61):
```dockerfile
# Create non-root user first
RUN useradd -m scraper && \
    mkdir -p /app/output

# Copy files before changing owner
COPY package*.json ./
COPY src/ ./src/

# Install dependencies as root but change ownership
RUN npm install --production && \
    chown -R scraper:scraper /app

# Switch to scraper user for Playwright install
USER scraper

# Install Playwright Chromium as scraper user
RUN npx playwright install chromium

# Switch back to root for final setup
USER root

# Ensure proper permissions
RUN chown -R scraper:scraper /app

# Final user
USER scraper

VOLUME ["/app/output"]

ENV HEADLESS=true
ENV NODE_ENV=production

CMD ["node", "src/scheduler.js"]
```

---

### `server/api/hipages.cjs` (controller, request-response)

**Analog:** `server/api/crm.cjs`

**Imports and auth pattern** (lines 1-8):
```javascript
const express = require('express');
const router = express.Router();
const { query } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');
const { v4: uuidv4 } = require('uuid');

// Apply authentication to all hipages routes
router.use(authenticateToken);
```

**GET endpoint pattern** (lines 13-23):
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

**POST endpoint with transaction pattern** (lines 86-103):
```javascript
router.post('/tasks', async (req, res) => {
  try {
    const { title, leadId, dueDate, completed } = req.body;
    const id = uuidv4();
    const createdAt = Date.now();
    
    const result = await query(
      `INSERT INTO tasks (id, lead_id, title, due_date, completed, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, leadId || null, title, dueDate || null, !!completed, createdAt]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});
```

**Error handling pattern** (consistent across all endpoints):
```javascript
try {
  // ... logic
} catch (error) {
  console.error('Error description:', error);
  res.status(500).json({ success: false, error: 'Human-readable error message' });
}
```

**For hipages-specific accept endpoint** (from RESEARCH.md Example 4):
```javascript
router.post('/leads/:id/accept', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get hipages lead
      const hipagesResult = await client.query(
        'SELECT * FROM hipages_leads WHERE lead_id = $1',
        [req.params.id]
      );

      if (hipagesResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'Lead not found' });
      }

      const hipagesLead = hipagesResult.rows[0];

      // Create CRM lead
      const leadResult = await client.query(`
        INSERT INTO leads (
          id, first_name, last_name, email, phone, address,
          service_interest, notes, status, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) RETURNING id
      `, [
        hipagesLead.customer_name.split(' ')[0],
        hipagesLead.customer_name.split(' ').slice(1).join(' ') || '',
        '',  // Email not provided by hipages
        '',  // Phone not provided by hipages
        hipagesLead.suburb,
        hipagesLead.job_type,
        `Hipages lead: ${hipagesLead.description}\nCredits: ${hipagesLead.credits}`,
        'NEW',
        Date.now()
      ]);

      // Update hipages lead
      await client.query(
        'UPDATE hipages_leads SET crm_lead_id = $1, synced_to_crm = TRUE WHERE lead_id = $2',
        [leadResult.rows[0].id, req.params.id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          hipagesLeadId: req.params.id,
          crmLeadId: leadResult.rows[0].id
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[hipages] Error accepting lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

### `server/lib/hipages-sync.cjs` (middleware, event-driven)

**Analog:** `server/lib/queue.cjs`

**LISTEN/NOTIFY pattern** (from RESEARCH.md Example 3):
```javascript
const { pool } = require('./database');

function subscribeToHipagesUpdates(io) {
  const client = await pool.connect();

  client.on('notification', (msg) => {
    if (msg.channel === 'hipages_leads_updated') {
      const payload = JSON.parse(msg.payload);
      console.log(`[sync] Received hipages update: ${payload.count} leads`);

      // Broadcast to all connected admin clients
      io.emit('hipages:leadsUpdated', payload);
    }
  });

  await client.query('LISTEN hipages_leads_updated');
  console.log('[sync] Subscribed to hipages_leads_updated channel');

  return client;
}

module.exports = { subscribeToHipagesUpdates };
```

---

### `server/migrations/002_create_hipages_leads_table.sql` (migration, batch)

**Analog:** `server/migrations/001_create_customer_portal_tables.sql`

**Table creation pattern** (lines 11-26):
```sql
CREATE TABLE IF NOT EXISTS hipages_leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hipages_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  suburb TEXT NOT NULL,
  postcode TEXT,
  job_type TEXT NOT NULL,
  job_subtype TEXT,
  description TEXT,
  credits INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'FIRST_TO_ACCEPT', 'WAITLIST', 'ACCEPTED', 'EXPIRED')),
  contact_status TEXT,
  posted_date TIMESTAMP,
  scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  synced_to_crm BOOLEAN DEFAULT FALSE,
  crm_lead_id TEXT REFERENCES leads(id),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Comments for documentation pattern** (lines 28-34):
```sql
COMMENT ON TABLE hipages_leads IS 'Leads scraped from hipages.com.au';
COMMENT ON COLUMN hipages_leads.lead_id IS 'Unique lead identifier (UUID)';
COMMENT ON COLUMN hipages_leads.hipages_id IS 'Unique ID from hipages or composite key';
COMMENT ON COLUMN hipages_leads.credits IS 'Credit cost to accept lead on hipages';
COMMENT ON COLUMN hipages_leads.status IS 'Lead status: AVAILABLE, FIRST_TO_ACCEPT, WAITLIST, ACCEPTED, EXPIRED';
```

**Index creation pattern** (lines 36-40):
```sql
CREATE INDEX IF NOT EXISTS idx_hipages_scraped ON hipages_leads(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hipages_status ON hipages_leads(status);
CREATE INDEX IF NOT EXISTS idx_hipages_synced ON hipages_leads(synced_to_crm) WHERE synced_to_crm = FALSE;
```

**Verification queries pattern** (lines 212-234):
```sql
-- Check hipages_leads table exists
SELECT 'hipages_leads table exists' AS check, COUNT(*) > 0 AS result
FROM information_schema.tables
WHERE table_name = 'hipages_leads';

-- Check indexes
SELECT 'hipages_leads indexes created' AS check, COUNT(*) AS result
FROM pg_indexes
WHERE tablename = 'hipages_leads';
```

---

### `pages/admin/HipagesLeadsPage.tsx` (component, request-response)

**Analog:** `pages/AdminDashboard.tsx`

**Imports and hooks pattern** (lines 1-36):
```typescript
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { usePageSEO } from '../hooks/usePageSEO';
import { getLeads, getAppointments, updateLead } from '../services/crmService';
import { Lead, LeadStatus, ServiceType } from '../types';
import { 
  User, Calendar as CalendarIcon, RefreshCw, CheckCircle2, 
  AlertCircle, Trash2, Filter, Search 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const HipagesLeadsPage: React.FC = () => {
  usePageSEO({ title: 'hipages Leads', noindex: true });
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
```

**Data fetching pattern** (lines 58-74):
```typescript
useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await getHipagesLeads();
    setLeads(data);
  } catch (e) {
    console.error("Failed to load hipages leads", e);
  } finally {
    setLoading(false);
  }
};
```

**Filter pattern** (lines 137-139):
```typescript
const filteredLeads = leads
  .filter((lead) => statusFilter === 'ALL' || lead.status === statusFilter)
  .filter((lead) => serviceFilter === 'ALL' || lead.serviceInterest === serviceFilter);
```

**Real-time WebSocket pattern** (from UI-SPEC.md lines 332-345):
```typescript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8080');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'hipages:leadsUpdated') {
      setNewLeadsCount(data.payload.count);
      // Show toast, update badge
      loadData(); // Refresh data
    }
  };
  return () => ws.close();
}, []);
```

**Loading state pattern** (lines 44-45):
```typescript
const [loading, setLoading] = useState(true);
const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
```

**Error handling pattern** (lines 69-73):
```typescript
try {
  const data = await getHipagesLeads();
  setLeads(data);
} catch (e) {
  console.error("Failed to load hipages leads", e);
} finally {
  setLoading(false);
}
```

**Tailwind styling pattern** (from UI-SPEC.md):
- Use `bg-slate-50` for page background
- Use `bg-white` for cards
- Use `text-orange-600` for hipages-specific accent color
- Use `bg-green-100 text-green-800` for "Available" status badge
- Use `bg-orange-100 text-orange-800` for "First to accept" status badge
- Use `bg-pink-100 text-pink-800` for "Waitlist" status badge

---

### `services/hipagesService.ts` (service, request-response)

**Analog:** `services/crmService.ts`

**API base configuration pattern** (lines 4-11):
```typescript
const API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:3001';

const getAuthHeader = () => {
  const token = localStorage.getItem('revive_admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
```

**Data mapping pattern** (lines 13-26):
```typescript
const mapHipagesLead = (dbLead: any): HipagesLead => ({
  id: dbLead.lead_id,
  hipagesId: dbLead.hipages_id,
  customerName: dbLead.customer_name,
  suburb: dbLead.suburb,
  postcode: dbLead.postcode,
  jobType: dbLead.job_type,
  jobSubtype: dbLead.job_subtype,
  description: dbLead.description,
  credits: dbLead.credits,
  status: dbLead.status,
  contactStatus: dbLead.contact_status,
  postedDate: dbLead.posted_date,
  scrapedAt: Number(dbLead.scraped_at),
  syncedToCrm: dbLead.synced_to_crm,
  crmLeadId: dbLead.crm_lead_id,
  rawData: dbLead.raw_data
});
```

**GET request pattern** (lines 49-61):
```typescript
export const getHipagesLeads = async (): Promise<HipagesLead[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/hipages/leads`, {
      headers: getAuthHeader()
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) return [];
    const data = await response.json();
    return data.map(mapHipagesLead);
  } catch {
    return [];
  }
};
```

**POST request pattern** (lines 117-139):
```typescript
export const acceptHipagesLead = async (id: string): Promise<Lead> => {
  try {
    const response = await fetch(`${API_BASE}/api/hipages/leads/${id}/accept`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) throw new Error('API unavailable');
    const data = await response.json();
    return mapLead(data);
  } catch (e) {
    throw new Error('Failed to accept lead');
  }
};
```

---

### `docker-compose.yml` (config, orchestration)

**Analog:** `docker-compose.yml` (existing)

**Service definition pattern** (lines 2-50):
```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: revivepropertyco
    restart: unless-stopped
    environment:
      - API_URL=https://api.z.ai/api/coding/paas/v4
      - API_KEY=...
      - VITE_ADMIN_USERNAME=admin
      - VITE_ADMIN_PASSWORD=revive-admin-2026

    networks:
      - homelab_web
      - traefik-public

    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik-public"
      # ... Traefik routing labels
```

**Backend service pattern** (lines 51-84):
```yaml
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: revivepropertyco-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=8080
      - DATABASE_URL=postgresql://homelab:password@postgres:5432/revivepropertyco
      - JWT_SECRET=...
      - RESEND_API_KEY=...

    networks:
      - homelab_web
      - traefik-public
      - homelab_internal

    volumes:
      - customer-uploads:/app/uploads/customers

    labels:
      - "traefik.enable=true"
      # ... Traefik routing labels
```

**For hipages-scraper service** (from RESEARCH.md lines 391-419):
```yaml
  hipages-scraper:
    build:
      context: ./services/hipages-scraper
      dockerfile: Dockerfile
    container_name: revive-hipages-scraper
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}  # Shared with backend
      - HIPAGES_USERNAME=${HIPAGES_USERNAME}
      - HIPAGES_PASSWORD=${HIPAGES_PASSWORD}
      - HIPAGES_HEADLESS=true
      - CRON_SCHEDULE=0 */6 * * *  # Every 6 hours
    networks:
      - homelab_internal
    volumes:
      - hipages-output:/app/output  # Debug logs, screenshots
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G  # Playwright + Chromium needs ~500-800MB
```

**For hipages-dashboard service** (from RESEARCH.md lines 420-438):
```yaml
  hipages-dashboard:
    build:
      context: ./services/hipages-scraper/dashboard
      dockerfile: Dockerfile
    container_name: revive-hipages-dashboard
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - API_URL=http://backend:8080/api/hipages  # Connect to backend API
    networks:
      - traefik-public
      - homelab_internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.hipages.rule=Host(`hp.revivepropertyco.au`)"
      - "traefik.http.routers.hipages.entrypoints=websecure"
      - "traefik.http.routers.hipages.tls.certresolver=cloudflare"
      - "traefik.http.services.hipages.loadbalancer.server.port=3578"
```

**Volumes and networks pattern** (lines 85-94):
```yaml
volumes:
  customer-uploads:
  hipages-output:

networks:
  homelab_web:
    external: true
  traefik-public:
    external: true
  homelab_internal:
    external: true
```

---

### `types.ts` (modifications) (model, type-check)

**Analog:** `types.ts` (existing)

**Type definition pattern** (from existing types.ts):
```typescript
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  serviceInterest: ServiceType;
  notes: string;
  status: LeadStatus;
  createdAt: number;
  statusHistory?: string[];
  platform_preference?: string;
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  BOOKED = 'BOOKED',
  ARCHIVED = 'ARCHIVED'
}
```

**Add HipagesLead type**:
```typescript
export interface HipagesLead {
  id: string; // lead_id (UUID)
  hipagesId: string; // hipages_id (unique identifier from hipages)
  customerName: string;
  suburb: string;
  postcode?: string;
  jobType: string;
  jobSubtype?: string;
  description?: string;
  credits: number;
  status: HipagesLeadStatus;
  contactStatus?: string;
  postedDate?: Date;
  scrapedAt: number;
  syncedToCrm: boolean;
  crmLeadId?: string; // Link to main leads table
  rawData?: any; // Full hipages response for audit
}

export enum HipagesLeadStatus {
  AVAILABLE = 'AVAILABLE',
  FIRST_TO_ACCEPT = 'FIRST_TO_ACCEPT',
  WAITLIST = 'WAITLIST',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED'
}
```

---

### `server/index.cjs` (modifications) (route, request-response)

**Analog:** `server/index.cjs` (existing)

**Route mounting pattern** (find existing router mounts in server/index.cjs):
```javascript
const hipagesRouter = require('./api/hipages.cjs');
app.use('/api/hipages', hipagesRouter);
```

**WebSocket initialization pattern** (for real-time sync):
```javascript
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const { subscribeToHipagesUpdates } = require('./lib/hipages-sync.cjs');

// Subscribe to hipages updates after server starts
subscribeToHipagesUpdates(io);

// Make io available to routes
app.set('io', io);
```

---

### `.env` (modifications) (config, build-time)

**Analog:** `.env` (existing)

**Environment variable pattern** (add to existing .env):
```bash
# hipages Scraper Configuration
HIPAGES_USERNAME=your_email@example.com
HIPAGES_PASSWORD=your_hipages_password
HIPAGES_HEADLESS=true
CRON_SCHEDULE=0 */6 * * *
```

---

## Shared Patterns

### Authentication
**Source:** `server/lib/auth.cjs`
**Apply to:** All controller files (`server/api/hipages.cjs`)
```javascript
const { authenticateToken } = require('../lib/auth.cjs');

// Apply to all routes
router.use(authenticateToken);

// Or per-route
router.get('/leads', authenticateToken, async (req, res) => {
  // req.user.userId available here
});
```

### Error Handling
**Source:** `server/api/crm.cjs`, `server/api/customer.cjs`
**Apply to:** All service and controller files
```javascript
try {
  // ... logic
} catch (error) {
  console.error('Error description:', error);
  res.status(500).json({ success: false, error: 'Human-readable error message' });
}
```

### Database Connection Pool
**Source:** `server/lib/database.cjs`
**Apply to:** `services/hipages-scraper/src/db-writer.js`
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Transaction Pattern
**Source:** `server/lib/database.cjs`
**Apply to:** `services/hipages-scraper/src/db-writer.js`, `server/api/hipages.cjs` (accept endpoint)
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

### Validation Pattern
**Source:** `server/api/customer.cjs`
**Apply to:** `server/api/hipages.cjs` (if adding validation)
```javascript
// Validation
if (!firstName || !lastName) {
  return res.status(400).json({
    success: false,
    error: 'First name and last name are required'
  });
}

// Validate mobile format (if provided)
if (mobile) {
  const mobileRegex = /^(\+61|04)[0-9]{8}$/;
  if (!mobileRegex.test(mobile.replace(/[\s]/g, ''))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid mobile number format'
    });
  }
}
```

### React State Management
**Source:** `pages/AdminDashboard.tsx`
**Apply to:** `pages/admin/HipagesLeadsPage.tsx`
```typescript
const [leads, setLeads] = useState<Lead[]>([]);
const [loading, setLoading] = useState(true);
const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await getLeads();
    setLeads(data);
  } catch (e) {
    console.error("Failed to load data", e);
  } finally {
    setLoading(false);
  }
};
```

### Service Layer Pattern
**Source:** `services/crmService.ts`
**Apply to:** `services/hipagesService.ts`
```typescript
const getAuthHeader = () => {
  const token = localStorage.getItem('revive_admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const getHipagesLeads = async (): Promise<HipagesLead[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/hipages/leads`, {
      headers: getAuthHeader()
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) return [];
    const data = await response.json();
    return data.map(mapHipagesLead);
  } catch {
    return [];
  }
};
```

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `services/hipages-scraper/src/scheduler.js` | service | event-driven | No existing cron jobs in codebase (use RESEARCH.md Example 3 pattern) |
| `server/lib/hipages-sync.cjs` | middleware | event-driven | No existing LISTEN/NOTIFY consumers (use RESEARCH.md Example 3 pattern) |
| `services/hipages-scraper/package.json` | config | build-time | No standalone service package.json (use `/home/ghost/hipages/package.json` as reference) |

## Metadata

**Analog search scope:**
- `server/api/*.cjs` (Express API routes)
- `pages/admin/*.tsx` (React admin pages)
- `services/*.ts` (TypeScript service layers)
- `server/migrations/*.sql` (Database migrations)
- `server/lib/*.cjs` (Backend utilities)
- `/home/ghost/hipages/*` (Existing hipages scraper POC)
- `docker-compose.yml`, `Dockerfile`, `Dockerfile.backend` (Docker configs)

**Files scanned:** 18
**Pattern extraction date:** 2026-04-13

**Key architectural decisions captured:**
1. Microservice isolation for scraper (separate container, independent scaling)
2. Direct database writes with transactional integrity
3. PostgreSQL LISTEN/NOTIFY for real-time sync (no Redis dependency)
4. File-based lock to prevent concurrent scraper runs
5. Consistent error handling across all endpoints
6. JWT authentication for all hipages API routes
7. React state management pattern for real-time updates
8. Docker multi-stage build for Playwright dependencies
9. Migration pattern with verification queries
10. TypeScript type definitions for hipages-specific data model
