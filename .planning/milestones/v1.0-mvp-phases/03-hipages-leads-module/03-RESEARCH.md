---
phase: 03-hipages-leads-module
research_date: 2026-04-21
researcher: Claude (GSD Planner)
---

# Phase 3: Hipages Leads Module - Research

## Existing Codebase Analysis

### Hipages Scraper Architecture

The existing scraper (`services/hipages-scraper/`) uses:

1. **Playwright** (`chromium.launch()`) for browser automation
2. **Cron scheduler** (`node-cron`) for recurring runs (every 6 hours)
3. **File-based lock** (`/tmp/hipages-scraper.lock`) to prevent concurrent runs
4. **PostgreSQL** connection pool for writing leads
5. **PostgreSQL NOTIFY** for real-time dashboard updates

**Key Patterns:**

```javascript
// Lock acquisition pattern (scheduler.js lines 14-44)
function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
    try {
      process.kill(pid, 0); // Check if process exists
      throw new Error(`Scraper already running (PID ${pid})`);
    } catch (e) {
      fs.unlinkSync(LOCK_FILE); // Stale lock, remove
    }
  }
  fs.writeFileSync(LOCK_FILE, process.pid.toString());
}
```

```javascript
// Lead parsing pattern (scraper.js lines 27-185)
function parseLeadsFromText(pageText, pageHtml = null) {
  // Split by credit indicators ("21 credits", "8 credits")
  const creditPattern = /(\d+)\s+credits/g;
  const leadBlocks = pageText.split(creditPattern);

  // Extract: name, location, job_type, status, description, contact_status
  // Match phone numbers from HTML
  // Extract images from DOM
}
```

```javascript
// Database upsert pattern (db-writer.js lines 113-190)
async function saveLeads(leads) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertStmt = `
      INSERT INTO hipages_leads (...) VALUES (...)
      ON CONFLICT (hipages_id) DO UPDATE SET
        status = EXCLUDED.status,
        scraped_at = EXCLUDED.scraped_at
      RETURNING lead_id
    `;
    for (const lead of leads) {
      await client.query(insertStmt, values);
    }
    await client.query(`NOTIFY hipages_leads_updated, '{"count": ${saved}}'`);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Platform API Routes

The hipages API (`server/api/hipages.cjs`) provides:

1. **Image proxy** - Bypass CORS for hipages CDN images
2. **Leads listing** - Paginated, filtered by status/synced_to_crm
3. **Lead acceptance** - Convert hipages lead to CRM lead
4. **Manual trigger** - Stub for on-demand scraping

**Key Patterns:**

```javascript
// Image proxy pattern (lines 39-88)
router.get('/image', async (req, res) => {
  const { url } = req.query;
  // Validate URL is from hipagesusercontent.com
  if (!url.startsWith('https://attachments.hipagesusercontent.com/')) {
    return res.status(403).json({ error: 'Invalid URL domain' });
  }
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RevivePropertyCo/1.0)' }
  });
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  const buffer = await response.arrayBuffer();
  res.send(Buffer.from(buffer));
});
```

## Twenty CRM Integration Patterns

From Phase 2, we have these patterns for Twenty integration:

### Custom Object Creation

Twenty supports custom objects via GraphQL:

```graphql
mutation createOneObject($name: String!, $description: String) {
  createOneObject(name: $name, description: $description) {
    id
    name
    label
    labelPlural
  }
}

mutation createOneField($objectId: String!, $name: String!, $type: String!) {
  createOneField(objectId: $objectId, name: $name, type: $type) {
    id
    name
    type
  }
}
```

### Person + Custom Object Pattern

Creating a Person with linked custom object:

```graphql
mutation createPersonWithHipagesLead {
  # First, create Person
  createOnePerson(data: {
    firstName: "John"
    lastName: "Smith"
    email: "john@example.com"
    phone: "0412345678"
  }) {
    id
  }

  # Then, create HipagesLead linked to Person
  createOneHipagesLead(data: {
    name: "Garden Maintenance - Dickson"
    description: "Lawn mowing and garden cleanup"
    status: "NEW"
    person: { connect: { id: "<person_id_from_above>" } }
  }) {
    id
    name
    status
  }
}
```

## Hipages.com.au Structure

Based on scraper analysis, hipages leads contain:

| Field | Description | Example |
|-------|-------------|---------|
| customer_name | Customer name | "Merrill", "Ahmed" |
| suburb | Location suburb | "Wallsend" |
| postcode | Postcode | "2287" |
| job_type | Job category | "Handyman", "Garden Maintenance" |
| job_subtype | Specific job type | "Furniture Assembly" |
| description | Job description | Full text description |
| credits | Credit cost to accept | 21, 8 |
| status | Lead status | "Available", "First to accept", "Waitlist" |
| contact_status | Contact details | "Supplied", "Not supplied" |
| posted_date | When posted | "11th Apr 2026 - 9:53 pm" |
| images | Attachment URLs | Array of hipages CDN URLs |

## Multi-Tenant Module Pattern

From Phase 1 (Platform Core), modules:

1. Have a manifest file (`<module>-module.json`)
2. Register with platform at startup via `server/lib/modules.cjs`
3. Are checked via `requireModule('<module-name>')` middleware
4. Can be enabled/disabled per tenant via `tenant_modules` table

**Module Manifest Pattern:**

```json
{
  "name": "hipages",
  "version": "1.0.0",
  "displayName": "Hipages Leads",
  "description": "Scrape hipages.com.au for trade service leads",
  "permissions": ["leads:read", "leads:write"],
  "settings": {
    "enabled": true,
    "autoScrape": true,
    "scrapeInterval": "0 */6 * * *"
  }
}
```

## Known Pitfalls

### Pitfall 1: Scraper Reliability

Hipages page structure changes frequently. The scraper uses:
- Multiple selector fallbacks (email, password, button selectors)
- Regex patterns for data extraction
- DOM scraping + text parsing

**Mitigation:** Extensive logging, debug HTML output, error handling

### Pitfall 2: Rate Limiting

Hipages may rate limit aggressive scraping. Current scheduler:
- Runs every 6 hours (configurable via CRON_SCHEDULE)
- Uses file-based lock (single instance only)

**Mitigation for multi-tenant:** Coordinate scraping across tenants to avoid limits

### Pitfall 3: Data Deduplication

Composite hipages_id is generated from:
- customer_name (normalized)
- suburb (normalized)
- job_type (normalized)
- description hash (first 50 chars)

This prevents duplicates when same lead is scraped multiple times.

### Pitfall 4: Credential Security

Hipages credentials (username, password) are currently in:
- `.env` file (HIPAGES_USERNAME, HIPAGES_PASSWORD)
- Passed to scraper container via environment

**For multi-tenant:** Need per-tenant credential storage (encrypted like Twenty tokens)

## Implementation Options

### Option A: Single Scraper with Credential Switching

**Pros:**
- Single container, simpler deployment
- Easier rate limit coordination
- Shared lock file still works

**Cons:**
- Credentials stored in database (security risk)
- Sequential scraping (slower for many tenants)
- Single point of failure

### Option B: Per-Tenant Scraper Containers

**Pros:**
- True isolation between tenants
- Parallel scraping
- Credentials stay in environment variables

**Cons:**
- Multiple containers to manage
- Harder to coordinate rate limits
- More complex deployment

### Option C: Hybrid - Scheduled Job Queue

**Pros:**
- Flexible scaling
- Better error handling
- Can prioritize tenants

**Cons:**
- Requires job queue infrastructure (Redis/Bull)
- More complex architecture

**Recommendation:** Start with Option A (single scraper, credential switching) for MVP. Can evolve to Option C if needed.

## Technical Decisions Needed

1. **Credential Storage:** Encrypted per-tenant in `tenant_hipages_credentials` table?
2. **Scraper Scheduling:** Keep cron or switch to database-driven job queue?
3. **Data Storage:** Keep `hipages_leads` table or rely entirely on Twenty?
4. **Module Activation:** How to detect if tenant has hipages credentials configured?
5. **Real-time Updates:** Keep PostgreSQL NOTIFY or switch to Socket.IO from Twenty webhooks?
