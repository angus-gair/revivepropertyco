require('dotenv').config();
const http = require('http');
const { chromium } = require('playwright');
const pool = require('./lib/db.js');
const { ensureAuthenticated } = require('./lib/hipages-login.js');

const PORT = process.env.ACTION_SERVER_PORT || 3001;

let actionBusy = false;
let triggerCallback = null;

function setTriggerCallback(fn) {
  triggerCallback = fn;
}

async function handleLeadAction(opportunityId, action) {
  if (actionBusy) throw new Error('Action already in progress, retry in a moment');
  actionBusy = true;

  const client = await pool.connect();
  let lead;
  try {
    const { rows } = await client.query(
      'SELECT * FROM hipages_leads WHERE crm_opportunity_id = $1 LIMIT 1',
      [opportunityId]
    );
    if (!rows.length) throw new Error(`No lead found for opportunity ${opportunityId}`);
    lead = rows[0];
  } finally {
    client.release();
  }

  console.log(`[action-server] ${action.toUpperCase()}: ${lead.customer_name} (${lead.suburb})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    await ensureAuthenticated(page, context);

    if (!page.url().includes('/leads')) {
      await page.goto('https://business.hipages.com.au/leads', { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForTimeout(3000);

    const buttonText = action === 'accept' ? 'Accept' : 'Decline';
    const customerName = (lead.customer_name || '').trim();
    const suburb = (lead.suburb || '').trim();

    let clicked = false;

    // Search lead cards for the matching customer+suburb, click the action button within it
    const cardSelectors = ['[class*="LeadCard"], [class*="lead-card"]', 'article', '[class*="Card"]'];
    for (const selector of cardSelectors) {
      const cards = await page.locator(selector).all();
      if (!cards.length) continue;
      console.log(`[action-server] Checking ${cards.length} cards (selector: ${selector})`);

      for (const card of cards) {
        const text = await card.textContent().catch(() => '');
        const nameMatch = customerName && text.toLowerCase().includes(customerName.toLowerCase());
        const suburbMatch = !suburb || text.toLowerCase().includes(suburb.split(' ')[0].toLowerCase());
        if (nameMatch && suburbMatch) {
          const btn = card.locator(`button:has-text("${buttonText}")`).first();
          if (await btn.isVisible().catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: '/app/output/action-result.png' }).catch(() => {});
            console.log(`[action-server] Clicked ${buttonText} for "${customerName}"`);
            clicked = true;
            break;
          }
        }
      }
      if (clicked) break;
    }

    if (!clicked) {
      await page.screenshot({ path: '/app/output/action-not-found.png' }).catch(() => {});
      throw new Error(`${buttonText} button not found for "${customerName}" in "${suburb}" — lead may have expired or already been actioned`);
    }

    await pool.query(
      'UPDATE hipages_leads SET status = $1, updated_at = NOW() WHERE crm_opportunity_id = $2',
      [action === 'accept' ? 'ACCEPTED' : 'DECLINED', opportunityId]
    );

    return { success: true, action, customerName, suburb };
  } finally {
    await browser.close();
    actionBusy = false;
  }
}

async function getStatus() {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int                                          AS total,
        COUNT(*) FILTER (WHERE synced_to_crm = false)::int   AS unsynced,
        COUNT(*) FILTER (WHERE synced_to_crm = true)::int    AS synced,
        COUNT(*) FILTER (WHERE status = 'ACCEPTED')::int     AS accepted,
        COUNT(*) FILTER (WHERE status = 'DECLINED')::int     AS declined,
        MAX(scraped_at)                                       AS last_scraped
      FROM hipages_leads
    `);
    return { ok: true, actionBusy, ...rows[0] };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function startActionServer() {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    try {
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', actionBusy }));
        return;
      }

      if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200);
        res.end(JSON.stringify(await getStatus()));
        return;
      }

      if (req.method === 'POST' && req.url === '/action') {
        const { opportunityId, action } = await parseBody(req);
        if (!opportunityId || !['accept', 'decline'].includes(action)) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Required: opportunityId (string), action ("accept"|"decline")' }));
          return;
        }
        const result = await handleLeadAction(opportunityId, action);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      if (req.method === 'POST' && req.url === '/trigger') {
        if (!triggerCallback) {
          res.writeHead(503);
          res.end(JSON.stringify({ error: 'Scraper not ready' }));
          return;
        }
        if (actionBusy) {
          res.writeHead(429);
          res.end(JSON.stringify({ error: 'Action already in progress' }));
          return;
        }
        // Fire and forget — respond immediately
        res.writeHead(202);
        res.end(JSON.stringify({ ok: true, message: 'Scrape triggered' }));
        triggerCallback().catch(e => console.error('[action-server] Triggered scrape failed:', e.message));
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (e) {
      console.error('[action-server] Request error:', e.message);
      const code = e.message.includes('retry') ? 429 : 500;
      res.writeHead(code);
      res.end(JSON.stringify({ error: e.message }));
    }
  });

  server.listen(PORT, () => {
    console.log(`[action-server] Listening on port ${PORT}`);
  });

  server.on('error', err => console.error('[action-server] Server error:', err.message));

  return server;
}

module.exports = { startActionServer, setTriggerCallback };
