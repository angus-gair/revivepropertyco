---
phase: 04-realtime-lead-sync
research_date: 2026-05-30
researcher: Antigravity AI
---

# Phase 4: Real-time Lead Sync - Research

## 1. Real-time Notification Pipeline

To push new scraped businesses to the admin panel instantly without page reloads, we will establish a PostgreSQL `NOTIFY` and Socket.IO broadcast chain.

### Scraper DB Writer (`db-writer.js`)
Currently, `saveBusinesses` in `services/hp-business-scraper/src/db-writer.js` commits to the database but does not notify listeners. We will add a `NOTIFY` call inside the transaction:

```javascript
await client.query(`NOTIFY hp_businesses_updated, '${JSON.stringify({ saved, updated })}'`);
```

### Backend Listener & Socket.IO Broadcaster
We need a corresponding listener in the backend server. We will create `server/lib/hp-businesses-sync.cjs` (following the pattern of `hipages-sync.cjs`):

```javascript
const { pool } = require('./hp-businesses-db.cjs');

async function subscribeToHpBusinessUpdates(io) {
  const client = await pool.connect();

  client.on('notification', async (msg) => {
    if (msg.channel === 'hp_businesses_updated') {
      try {
        const payload = JSON.parse(msg.payload);
        console.log('[sync] Broadcasted hp-businesses:updated:', payload);
        io.emit('hp-businesses:updated', payload);
      } catch (error) {
        console.error('[sync] Notification error:', error);
      }
    }
  });

  await client.query('LISTEN hp_businesses_updated');
  return client;
}
```

This will be imported in `server/index.cjs` and initialized at server startup.

### Frontend Integration
In [HipagesBusinessesPage.tsx](file:///opt/homelab/apps/revivepropertyco/pages/admin/HipagesBusinessesPage.tsx), we will import `socket.io-client` and configure a listener:

```typescript
import { io } from 'socket.io-client';

// Inside component:
useEffect(() => {
  const socket = io('https://revivepropertyco.au', {
    path: '/socket.io',
    transports: ['websocket']
  });

  socket.on('hp-businesses:updated', (payload) => {
    console.log('[Socket] Received live scraper update:', payload);
    loadBusinesses(); // Fetch fresh list on change
  });

  return () => {
    socket.disconnect();
  };
}, []);
```

---

## 2. Manual Scraper Trigger via IPC

Rather than attempting to execute shell commands like `docker exec` from the Node.js API container (which violates network boundary design), we will use PG `LISTEN/NOTIFY` as an inter-process communication (IPC) channel.

1. **Dashboard UI** calls `POST /api/hp-businesses/scrape/trigger` (authenticated).
2. **API Endpoint** executes:
   ```javascript
   await query("NOTIFY hp_scrape_trigger, '{\"location\":\"sydney-nsw\"}'");
   ```
3. **Scraper Daemon (`scheduler.js`)** maintains a persistent PG client:
   ```javascript
   const { Client } = require('pg');
   const client = new Client({ connectionString: process.env.HP_BUSINESSES_DB_URL });
   await client.connect();
   await client.query('LISTEN hp_scrape_trigger');
   client.on('notification', async (msg) => {
     if (msg.channel === 'hp_scrape_trigger') {
       console.log('[scheduler] Received manual trigger notify, running scrape...');
       runScrape().catch(err => console.error(err));
     }
   });
   ```

---

## 3. Resilient Error Handling & Backoff

To prevent scrape failures on temporary connection loss or DNS drops, we will build a retry loop with exponential backoff inside `scraper.js` / `scheduler.js`.

```javascript
async function runWithRetry(fn, retries = 3, delay = 300000) { // Default 5m delay
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      const backoff = delay * Math.pow(3, i); // 5m, 15m, 45m
      console.warn(`[scraper] Attempt failed: ${err.message}. Retrying in ${backoff / 60000}m...`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
}
```

This will be integrated into the scheduled task loops.

---

## 4. Rate Limiting Coordination

To mimic human behavior and bypass bot protections:
- Playwright page transitions must randomize wait times (`await page.waitForTimeout(3000 + Math.random() * 4000)`).
- Loops over `TRADES` categories should pause for 10 seconds between trade directories.
