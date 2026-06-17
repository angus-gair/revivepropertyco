const express = require('express');
const router = express.Router();
const { query, pool } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');
const { resolveTenantId } = require('../lib/tenant-context.cjs');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/hipages/debug - Debug endpoint (no auth required)
 */
router.get('/debug', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM hipages_leads');
    res.json({
      success: true,
      message: 'Hipages API is working',
      database: 'Connected',
      totalLeads: result.rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/hipages/test - Test endpoint (no auth)
 */
router.get('/test', async (req, res) => {
  res.json({ success: true, message: 'Test endpoint works!' });
});

/**
 * GET /api/hipages/image - Proxy hipages images to bypass CORS
 */
router.get('/image', async (req, res) => {
  try {
    console.log('[hipages] Image proxy called with URL:', req.query.url?.substring(0, 50));
    const { url } = req.query;

    // Security: Validate URL is from hipagesusercontent.com
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Allow only hipagesusercontent.com URLs
    if (!url.startsWith('https://attachments.hipagesusercontent.com/') &&
        !url.startsWith('http://attachments.hipagesusercontent.com/')) {
      return res.status(403).json({ error: 'Invalid URL domain' });
    }

    // Fetch image from hipages CDN
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RevivePropertyCo/1.0)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch image: ${response.statusText}`
      });
    }

    // Get content type from response
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    // Set content type and cache headers
    // Note: Do NOT manually set Access-Control-Allow-Origin here.
    // The global cors() middleware in server/index.cjs already sets the correct
    // origin-specific CORS headers. Setting a wildcard here would conflict with
    // the credentials header and cause browsers to reject the image (black rectangle).
    res.setHeader('Content-Type', contentType);

    // Cache for 1 year (images don't change)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Pipe image data to response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

    console.log(`[hipages] Proxied image: ${url} (${contentType})`);
  } catch (error) {
    console.error('[hipages] Error proxying image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

/**
 * GET /api/hipages/noauth/leads - Public hipages leads endpoint (no auth required)
 */
router.get('/noauth/leads', async (req, res) => {
  try {
    const { page = 1, limit = 10000, status, synced_to_crm } = req.query;
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (synced_to_crm !== undefined) {
      whereClause += ` AND synced_to_crm = $${paramIndex}`;
      params.push(synced_to_crm === 'true');
      paramIndex++;
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM hipages_leads ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM hipages_leads
      ${whereClause}
      ORDER BY scraped_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await query(dataQuery, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('[hipages] Error fetching leads (noauth):', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hipages leads' });
  }
});

/**
 * --- OpenRouter AI demo (no auth — public test endpoints) --------------------
 * GET  /api/hipages/ai/demo  → self-contained HTML chat UI
 * POST /api/hipages/ai/chat  → OpenRouter proxy { message } → { content, model }
 */
router.get('/ai/demo', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revive AI — OpenRouter Demo</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0d1117;color:#c9d1d9;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:2rem 1rem}
  h1{color:#58a6ff;font-size:1.4rem;font-weight:600;letter-spacing:.05em;margin-bottom:.25rem}
  .subtitle{color:#6e7681;font-size:.8rem;margin-bottom:1.5rem}
  .card{background:#161b22;border:1px solid #30363d;border-radius:8px;width:100%;max-width:700px;padding:1.25rem;display:flex;flex-direction:column;gap:1rem}
  #response{background:#0d1117;border:1px solid #21262d;border-radius:6px;min-height:120px;padding:.75rem 1rem;font-size:.9rem;line-height:1.6;white-space:pre-wrap;word-break:break-word;color:#e6edf3}
  .model-tag{color:#3fb950;font-size:.75rem;font-family:monospace}
  textarea{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font-size:.9rem;padding:.75rem 1rem;resize:vertical;width:100%;min-height:80px;outline:none;transition:border-color .15s}
  textarea:focus{border-color:#58a6ff}
  .row{display:flex;gap:.75rem;align-items:center}
  button{background:#238636;border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:.875rem;font-weight:600;padding:.5rem 1.25rem;transition:background .15s}
  button:hover{background:#2ea043}
  button:disabled{background:#21262d;color:#6e7681;cursor:not-allowed}
  .spinner{display:none;color:#58a6ff;font-size:.8rem}
  .error{color:#f85149}
  .usage{color:#6e7681;font-size:.75rem;font-family:monospace}
</style>
</head>
<body>
<h1>Revive AI — OpenRouter Demo</h1>
<p class="subtitle">Model: <span class="model-tag">openrouter/free</span> &nbsp;·&nbsp; Swap to any model in <code style="color:#58a6ff">.env OPENROUTER_MODEL</code></p>
<div class="card">
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem">
      <span style="font-size:.8rem;color:#6e7681">Response</span>
      <span class="model-tag" id="modelLabel"></span>
    </div>
    <div id="response" style="color:#6e7681;font-style:italic">Response will appear here…</div>
    <div class="usage" id="usage" style="margin-top:.4rem"></div>
  </div>
  <div>
    <textarea id="msg" placeholder="Ask anything… e.g. 'Write a quote intro for a pressure washing job in Canberra'" rows="3"></textarea>
    <div class="row" style="margin-top:.5rem">
      <button id="btn" onclick="send()">Send</button>
      <span class="spinner" id="spin">thinking…</span>
    </div>
  </div>
</div>
<script>
async function send(){
  const msg=document.getElementById('msg').value.trim();
  if(!msg)return;
  const btn=document.getElementById('btn'),spin=document.getElementById('spin'),resp=document.getElementById('response'),mdl=document.getElementById('modelLabel'),usg=document.getElementById('usage');
  btn.disabled=true;spin.style.display='inline';resp.className='';resp.textContent='';mdl.textContent='';usg.textContent='';
  try{
    const r=await fetch('/api/hipages/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
    const d=await r.json();
    if(!d.success)throw new Error(d.error||'Unknown error');
    resp.textContent=d.content;
    mdl.textContent=d.model;
    if(d.usage)usg.textContent='tokens: prompt='+d.usage.prompt_tokens+' completion='+d.usage.completion_tokens;
  }catch(e){resp.className='error';resp.textContent='Error: '+e.message;}
  finally{btn.disabled=false;spin.style.display='none';}
}
document.getElementById('msg').addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')send();});
</script>
</body>
</html>`);
});

router.post('/ai/chat', async (req, res) => {
  try {
    const { message, system } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }
    const { callOpenRouter } = require('../lib/openrouter.cjs');
    const messages = [{ role: 'user', content: message.trim() }];
    const result = await callOpenRouter(messages, system ? { systemPrompt: system } : {});
    res.json({ success: true, content: result.content, model: result.model, usage: result.usage });
  } catch (error) {
    console.error('[hipages] OpenRouter chat error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * --- HiPages auto-bid (Riv autonomous bidding) -------------------------------
 * These two routes are defined BEFORE router.use(authenticateToken) so the external
 * n8n workflow can reach them with a shared X-Action-Secret header (no admin JWT).
 * This is the only decision-layer surface: all HiPages/Twenty writes and the financial
 * guardrails live here, server-side, so an n8n bug can't bypass them.
 */
function checkActionSecret(req, res) {
  const secret = process.env.ACTION_SECRET;
  if (secret && req.headers['x-action-secret'] !== secret) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

function boolEnv(name, def) {
  const v = process.env[name];
  if (v === undefined) return def;
  return String(v).toLowerCase() === 'true';
}

async function recordDecision(opportunityId, { status, service_line = null, confidence = null, reason = null }) {
  await query(
    `UPDATE hipages_leads
        SET auto_bid_status = $1, auto_bid_service_line = $2, auto_bid_confidence = $3,
            auto_bid_reason = $4, auto_bid_at = NOW(), updated_at = NOW()
      WHERE crm_opportunity_id = $5`,
    [status, service_line, confidence, reason, opportunityId]
  );
}

// Best-effort: record the AI rationale as a Twenty Note on the Opportunity, and
// optionally advance its pipeline stage. Never throws — the auto_bid_* columns are
// the authoritative ledger; Twenty writes are for human visibility only.
async function applyTwentyAudit(opportunityId, { status, decision, service_line, confidence, reason }) {
  const apiToken = process.env.TWENTY_API_TOKEN;
  const serverUrl = process.env.TWENTY_SERVER_URL || 'http://twenty:3000';
  if (!apiToken || apiToken === 'generate-after-twenty-setup') return;
  try {
    const { TwentyClient } = require('../lib/twenty-client.cjs');
    const tc = new TwentyClient(apiToken, serverUrl);
    const body = `### Riv auto-bid decision: ${status}
- **Decision:** ${decision}
- **Service line:** ${service_line || 'n/a'}
- **Confidence:** ${confidence != null ? confidence : 'n/a'}
- **Reason:** ${reason || 'n/a'}
- **At:** ${new Date().toISOString()}`;
    await tc.createNote({ body, noteTargets: { create: [{ opportunityId }] } });

    const stage = status === 'ACCEPTED'
      ? process.env.AUTOBID_ACCEPT_STAGE
      : (decision === 'skip' ? process.env.AUTOBID_SKIP_STAGE : null);
    if (stage) {
      const m = `mutation U($id: UUID!, $data: OpportunityUpdateInput!) { updateOneOpportunity(id: $id, data: $data) { id stage } }`;
      await tc.graphql(m, { id: opportunityId, data: { stage } });
    }
  } catch (err) {
    console.warn('[hipages] auto-bid Twenty audit (non-fatal):', err.message);
  }
}

/**
 * GET /api/hipages/auto-bid/candidates  (X-Action-Secret)
 * Synced, still-open, not-yet-evaluated leads for the n8n classifier.
 */
router.get('/auto-bid/candidates', async (req, res) => {
  if (!checkActionSecret(req, res)) return;
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const result = await query(
      `SELECT lead_id, crm_opportunity_id, customer_name, job_type, job_subtype,
              description, suburb, postcode, credits, contact_status, posted_date, status
         FROM hipages_leads
        WHERE synced_to_crm = TRUE
          AND crm_opportunity_id IS NOT NULL
          AND status IN ('AVAILABLE', 'FIRST_TO_ACCEPT')
          AND auto_bid_status IS NULL
        ORDER BY posted_date DESC NULLS LAST, scraped_at DESC
        LIMIT $1`,
      [limit]
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('[hipages] auto-bid candidates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/hipages/auto-bid/summary  (X-Action-Secret)
 * Monitoring view: how the AI has triaged leads, and the manual-decline queue.
 *  - pending           : not yet analyzed (delta — will be processed next runs)
 *  - accepted          : AI placed a real bid (live mode)
 *  - would_accept      : AI matched, held by dry-run (becomes a real bid when live)
 *  - skipped_nonmatch  : AI judged NOT a target service → YOUR manual-decline queue
 *  - failed            : accept attempted but lead expired / button gone
 */
router.get('/auto-bid/summary', async (req, res) => {
  if (!checkActionSecret(req, res)) return;
  try {
    const c = await query(`
      SELECT
        COUNT(*) FILTER (WHERE auto_bid_status IS NULL AND status IN ('AVAILABLE','FIRST_TO_ACCEPT') AND synced_to_crm = TRUE)::int AS pending,
        COUNT(*) FILTER (WHERE auto_bid_status = 'ACCEPTED')::int AS accepted,
        COUNT(*) FILTER (WHERE auto_bid_status = 'SKIPPED' AND auto_bid_reason LIKE 'dry-run%')::int AS would_accept,
        COUNT(*) FILTER (WHERE auto_bid_status = 'SKIPPED' AND (auto_bid_reason IS NULL OR auto_bid_reason NOT LIKE 'dry-run%'))::int AS skipped_nonmatch,
        COUNT(*) FILTER (WHERE auto_bid_status = 'FAILED')::int AS failed,
        MAX(auto_bid_at) AS last_decision_at
      FROM hipages_leads`);
    res.json({ success: true, dry_run: boolEnv('AUTOBID_DRY_RUN', true), enabled: boolEnv('AUTOBID_ENABLED', false), ...c.rows[0] });
  } catch (error) {
    console.error('[hipages] auto-bid summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hipages/auto-bid/run/start  (X-Action-Secret)
 * n8n calls this at the start of a run. Emails "pipeline commenced" when count>0.
 * Returns started_at (ISO), used as the window-start for the completion summary.
 */
router.post('/auto-bid/run/start', async (req, res) => {
  if (!checkActionSecret(req, res)) return;
  const startedAt = new Date().toISOString();
  const count = parseInt((req.body && req.body.count) || 0, 10) || 0;
  const mode = boolEnv('AUTOBID_DRY_RUN', true) ? 'DRY-RUN' : 'LIVE';
  if (count > 0) {
    const { sendAutobidStart } = require('../lib/autobid-email.cjs');
    sendAutobidStart({ count, mode, startedAt }).catch(e => console.warn('[hipages] start email:', e.message));
  }
  res.json({ success: true, started_at: startedAt, count, mode });
});

/**
 * POST /api/hipages/auto-bid/run/complete  (X-Action-Secret)
 * n8n calls this at the end of a run with the started_at from run/start. Buckets all
 * decisions recorded in the window and emails the outcome: auto bids, edge cases
 * (almost bid — guardrail-blocked), and not-bid (non-matches / manual-decline queue).
 */
router.post('/auto-bid/run/complete', async (req, res) => {
  if (!checkActionSecret(req, res)) return;
  const startedAt = req.body && req.body.started_at;
  if (!startedAt) return res.status(400).json({ success: false, error: 'started_at required' });
  try {
    const { rows } = await query(
      `SELECT job_type, suburb, auto_bid_status, auto_bid_service_line AS service_line,
              auto_bid_confidence AS confidence, credits, auto_bid_reason AS reason
         FROM hipages_leads
        WHERE auto_bid_at >= $1
        ORDER BY auto_bid_at ASC`,
      [startedAt]
    );
    const isEdge = r => /^(low_confidence|over_ceiling|daily_cap)/.test(r.reason || '');
    const isDry  = r => /^dry-run/.test(r.reason || '');
    const accepted    = rows.filter(r => r.auto_bid_status === 'ACCEPTED');
    const wouldAccept = rows.filter(r => r.auto_bid_status === 'SKIPPED' && isDry(r));
    const edge        = rows.filter(r => r.auto_bid_status === 'SKIPPED' && isEdge(r));
    const failed      = rows.filter(r => r.auto_bid_status === 'FAILED');
    const notBidAll   = rows.filter(r => r.auto_bid_status === 'SKIPPED' && !isDry(r) && !isEdge(r));
    const buckets = { accepted, wouldAccept, edge, failed, notBid: { count: notBidAll.length, samples: notBidAll.slice(0, 10) } };
    const mode = boolEnv('AUTOBID_DRY_RUN', true) ? 'DRY-RUN' : 'LIVE';
    const total = accepted.length + wouldAccept.length + edge.length + failed.length + notBidAll.length;
    if (total > 0) {
      const { sendAutobidComplete } = require('../lib/autobid-email.cjs');
      sendAutobidComplete({ mode, startedAt, finishedAt: new Date().toISOString(), buckets })
        .catch(e => console.warn('[hipages] complete email:', e.message));
    }
    res.json({ success: true, mode, processed: total, accepted: accepted.length,
      would_accept: wouldAccept.length, edge: edge.length, not_bid: notBidAll.length, failed: failed.length });
  } catch (error) {
    console.error('[hipages] auto-bid run/complete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hipages/auto-bid/decision  (X-Action-Secret)
 * Body: { opportunityId, decision: "accept"|"skip", service_line?, confidence?, reason? }
 * Guardrails: AUTOBID_ENABLED, AUTOBID_DRY_RUN, AUTOBID_MIN_CONFIDENCE,
 * AUTOBID_MAX_CREDITS, AUTOBID_DAILY_CAP. "accept" -> scraper /action (Playwright).
 */
router.post('/auto-bid/decision', async (req, res) => {
  if (!checkActionSecret(req, res)) return;
  const { opportunityId, decision, service_line = null, confidence = null, reason = null } = req.body || {};
  if (!opportunityId || !['accept', 'skip'].includes(decision)) {
    return res.status(400).json({ success: false, error: 'Required: opportunityId, decision ("accept"|"skip")' });
  }
  try {
    const { rows } = await query('SELECT * FROM hipages_leads WHERE crm_opportunity_id = $1 LIMIT 1', [opportunityId]);
    if (!rows.length) return res.status(404).json({ success: false, error: `No lead for opportunity ${opportunityId}` });
    const lead = rows[0];

    // Idempotent: never act twice on the same lead
    if (lead.auto_bid_status) {
      return res.json({ success: true, skipped: 'already_evaluated', auto_bid_status: lead.auto_bid_status });
    }

    if (!boolEnv('AUTOBID_ENABLED', false)) {
      return res.json({ success: true, skipped: 'disabled' });
    }

    const finish = async (status, why) => {
      await recordDecision(opportunityId, { status, service_line, confidence, reason: why || reason });
      // Only annotate Twenty when the classifier wanted to bid (accept-intent), to avoid
      // spamming Notes / hitting Twenty's rate limit on routine non-matching skips.
      if (decision === 'accept') {
        await applyTwentyAudit(opportunityId, { status, decision, service_line, confidence, reason: why || reason });
      }
    };

    // SKIP path — AI judged this NOT a target service (or prefilter rejected it).
    // Record SKIPPED so it is never re-analyzed (delta), but take ZERO action on HiPages:
    // the lead stays live for the user to review and DECLINE MANUALLY. The auto-bid flow
    // never declines — "skip" is an internal bookkeeping mark only.
    if (decision === 'skip') {
      await finish('SKIPPED', reason);
      return res.json({ success: true, decision: 'skip', recorded: 'SKIPPED', hipagesAction: 'none' });
    }

    // ACCEPT path — guardrails first
    const minConf = parseFloat(process.env.AUTOBID_MIN_CONFIDENCE || '0');
    if (minConf > 0 && confidence != null && Number(confidence) < minConf) {
      await finish('SKIPPED', `low_confidence ${confidence} < ${minConf}`);
      return res.json({ success: true, skipped: 'low_confidence', confidence });
    }
    const maxCredits = parseInt(process.env.AUTOBID_MAX_CREDITS || '0', 10); // 0 = no ceiling
    if (maxCredits > 0 && parseInt(lead.credits || 0, 10) > maxCredits) {
      await finish('SKIPPED', `over_ceiling ${lead.credits} > ${maxCredits}`);
      return res.json({ success: true, skipped: 'over_ceiling', credits: lead.credits });
    }
    const dailyCap = parseInt(process.env.AUTOBID_DAILY_CAP || '0', 10); // 0 = no cap
    if (dailyCap > 0) {
      const c = await query(`SELECT COUNT(*)::int AS n FROM hipages_leads WHERE auto_bid_status = 'ACCEPTED' AND auto_bid_at::date = CURRENT_DATE`);
      if (c.rows[0].n >= dailyCap) {
        await finish('SKIPPED', `daily_cap ${c.rows[0].n} >= ${dailyCap}`);
        return res.json({ success: true, skipped: 'daily_cap', accepted_today: c.rows[0].n });
      }
    }

    // Dry-run — record the would-be accept, never spends credits
    if (boolEnv('AUTOBID_DRY_RUN', true)) {
      await finish('SKIPPED', `dry-run: would accept (${service_line || '?'} conf=${confidence != null ? confidence : '?'})`);
      return res.json({ success: true, dryRun: true, recorded: 'SKIPPED', would: 'accept' });
    }

    // LIVE accept — fire the Playwright "Accept" on HiPages via the scraper.
    // HARD GUARANTEE: the auto-bid flow ONLY ever sends action:'accept'. It NEVER declines.
    // Declining is exclusively a manual/human action via the separate /lead-action route.
    const scraperUrl = process.env.HIPAGES_SCRAPER_URL || 'http://hipages-scraper:3001';
    let resp, data;
    try {
      resp = await fetch(`${scraperUrl}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, action: 'accept' }), // accept-only by design
      });
      data = await resp.json();
    } catch (err) {
      // Scraper unreachable — leave lead un-evaluated so n8n can retry later
      console.error('[hipages] auto-bid scraper unreachable:', err.message);
      return res.status(503).json({ success: false, error: 'Scraper unreachable', retry: true });
    }
    if (resp.status === 429) {
      // Action server busy — retryable, do not record
      return res.status(429).json({ success: false, error: data.error || 'busy', retry: true });
    }
    if (!resp.ok || !data.success) {
      // Definitive failure (e.g. lead expired / button gone) — record FAILED so we stop retrying
      await finish('FAILED', `scraper: ${data.error || resp.status}`);
      return res.status(502).json({ success: false, error: data.error || 'scraper accept failed' });
    }

    // Success — the scraper already set hipages_leads.status='ACCEPTED'
    await finish('ACCEPTED', `accepted (${service_line || '?'} conf=${confidence != null ? confidence : '?'})`);
    return res.json({ success: true, decision: 'accept', recorded: 'ACCEPTED', scraper: data });
  } catch (error) {
    console.error('[hipages] auto-bid decision error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/hipages/lead-action - Accept or decline a HiPages lead via Playwright
 * Called by Twenty CRM workflow automation (no JWT — uses ACTION_SECRET header instead).
 * Moved above the authenticateToken middleware: it previously sat below it, so the
 * Twenty workflow's secret-only calls were rejected with 401 before reaching this handler.
 */
router.post('/lead-action', async (req, res) => {
  if (!checkActionSecret(req, res)) return;
  try {
    const { opportunityId, action } = req.body;
    if (!opportunityId || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Required: opportunityId, action (accept|decline)' });
    }

    const scraperUrl = process.env.HIPAGES_SCRAPER_URL || 'http://hipages-scraper:3001';
    const response = await fetch(`${scraperUrl}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opportunityId, action }),
    });
    const data = await response.json();
    res.status(response.status).json({ success: response.ok, ...data });
  } catch (error) {
    console.error('[hipages] Error performing lead action:', error);
    res.status(503).json({ success: false, error: 'Scraper service unreachable' });
  }
});

// Apply authentication to all other hipages routes
router.use(authenticateToken);

/**
 * GET /api/hipages/leads - List hipages leads with pagination and filtering
 */
router.get('/leads', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, synced_to_crm } = req.query;
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (synced_to_crm !== undefined) {
      whereClause += ` AND synced_to_crm = $${paramIndex}`;
      params.push(synced_to_crm === 'true');
      paramIndex++;
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM hipages_leads ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM hipages_leads
      ${whereClause}
      ORDER BY scraped_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await query(dataQuery, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('[hipages] Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hipages leads' });
  }
});

/**
 * GET /api/hipages/leads/:id - Get single hipages lead
 */
router.get('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM hipages_leads WHERE lead_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[hipages] Error fetching lead:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hipages lead' });
  }
});

/**
 * POST /api/hipages/leads/:id/accept - Convert hipages lead to CRM lead
 */
router.post('/leads/:id/accept', async (req, res) => {
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

    // Parse customer name into first and last name
    const nameParts = hipagesLead.customer_name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build notes with hipages information
    const notes = `Hipages lead: ${hipagesLead.description || 'No description'}
Credits: ${hipagesLead.credits}
Job Type: ${hipagesLead.job_type}${hipagesLead.job_subtype ? ` (${hipagesLead.job_subtype})` : ''}
Posted: ${hipagesLead.posted_date ? new Date(hipagesLead.posted_date).toLocaleDateString() : 'Unknown'}
Suburb: ${hipagesLead.suburb}${hipagesLead.postcode ? ` ${hipagesLead.postcode}` : ''}`;

    // Create CRM lead
    const leadResult = await client.query(`
      INSERT INTO leads (
        id, first_name, last_name, email, phone, address,
        service_interest, notes, status, created_at, tenant_id
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING id
    `, [
      firstName,
      lastName,
      '', // Email not provided by hipages
      '', // Phone not provided by hipages
      hipagesLead.suburb,
      hipagesLead.job_type,
      notes,
      'NEW',
      Date.now(),
      resolveTenantId(req) // scraped leads belong to the Revive (default) tenant
    ]);

    const crmLeadId = leadResult.rows[0].id;

    // Update hipages lead
    await client.query(
      'UPDATE hipages_leads SET crm_lead_id = $1, synced_to_crm = TRUE WHERE lead_id = $2',
      [crmLeadId, req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        hipagesLeadId: req.params.id,
        crmLeadId
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[hipages] Error accepting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to accept hipages lead' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/hipages/leads/:id/promote-opportunity - Promote hipages lead to Twenty CRM Opportunity
 */
router.post('/leads/:id/promote-opportunity', async (req, res) => {
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

    if (hipagesLead.synced_to_crm) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Lead has already been promoted' });
    }

    // Try to get dynamic workspace/token for tenant if authenticated
    let apiToken = process.env.TWENTY_API_TOKEN;
    let serverUrl = process.env.TWENTY_SERVER_URL || 'http://twenty:3000';

    if (req.user && req.user.tenantId) {
      const workspaceResult = await client.query(
        'SELECT * FROM twenty_workspaces WHERE tenant_id = $1',
        [req.user.tenantId]
      );
      if (workspaceResult.rows.length > 0) {
        const workspace = workspaceResult.rows[0];
        serverUrl = workspace.server_url;
        // get decrypted token
        const { getToken } = require('../lib/twenty-token-storage.cjs');
        const tokenData = await getToken(req.user.tenantId, workspace.workspace_id, 'API');
        if (tokenData) {
          apiToken = tokenData.token;
        }
      }
    }

    // If no apiToken is configured, return error
    if (!apiToken || apiToken === 'generate-after-twenty-setup') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Twenty CRM integration is not configured. Please set TWENTY_API_TOKEN.'
      });
    }

    // Parse customer name into first and last name
    const nameParts = hipagesLead.customer_name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Initialize Twenty client
    const { TwentyClient } = require('../lib/twenty-client.cjs');
    const twentyClient = new TwentyClient(apiToken, serverUrl);

    // 1. Search or create Person in Twenty
    let personId;
    try {
      const existingPerson = await twentyClient.findPersonByName(firstName, lastName);
      if (existingPerson) {
        personId = existingPerson.id;
      } else {
        const newPerson = await twentyClient.createPerson({
          firstName,
          lastName,
          email: undefined,
          phone: undefined
        });
        personId = newPerson.id;
      }
    } catch (err) {
      console.error('[hipages] Error checking/creating Person in Twenty:', err);
      throw new Error(`Twenty CRM Person matching failed: ${err.message}`);
    }

    // 2. Create Opportunity in Twenty linked to Person
    const optName = `${hipagesLead.job_type} - ${hipagesLead.customer_name} - ${hipagesLead.suburb}`;
    const creditsCost = parseInt(hipagesLead.credits) || 0;
    const amountVal = creditsCost * 20;
    const amountAmountMicros = amountVal * 1000000;

    let opportunityId;
    try {
      const newOpt = await twentyClient.createOpportunity({
        name: optName,
        amountAmountMicros,
        amountCurrencyCode: 'AUD',
        stage: 'NEW',
        pointOfContactId: personId
      });
      opportunityId = newOpt.id;
    } catch (err) {
      console.error('[hipages] Error creating Opportunity in Twenty:', err);
      throw new Error(`Twenty CRM Opportunity creation failed: ${err.message}`);
    }

    // 3. Create Note in Twenty linked to Opportunity
    const postedStr = hipagesLead.posted_date ? new Date(hipagesLead.posted_date).toISOString() : 'Unknown';
    const noteMarkdown = `### Hipages Lead Details
- **Lead ID:** ${hipagesLead.lead_id}
- **Job Type:** ${hipagesLead.job_type}${hipagesLead.job_subtype ? ` (${hipagesLead.job_subtype})` : ''}
- **Description:** ${hipagesLead.description || 'No description'}
- **Location:** ${hipagesLead.suburb}${hipagesLead.postcode ? ` ${hipagesLead.postcode}` : ''}
- **Credits:** ${hipagesLead.credits}
- **Status:** ${hipagesLead.status}
- **Contact Status:** ${hipagesLead.contact_status || 'Unknown'}
- **Posted Date:** ${postedStr}`;

    try {
      await twentyClient.createNote({
        body: noteMarkdown,
        noteTargets: {
          create: [
            {
              opportunityId
            }
          ]
        }
      });
    } catch (err) {
      console.warn('[hipages] Warning: Failed to create note in Twenty for Opportunity:', err.message);
    }

    // Update local database hipages_leads
    await client.query(
      'UPDATE hipages_leads SET synced_to_crm = TRUE, crm_opportunity_id = $1 WHERE lead_id = $2',
      [opportunityId, req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        hipagesLeadId: req.params.id,
        crmOpportunityId: opportunityId,
        personId
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[hipages] Error promoting lead to CRM Opportunity:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to promote lead' });
  } finally {
    client.release();
  }
});


/**
 * POST /api/hipages/scrape/trigger - Manually trigger a hipages scrape
 */
router.post('/scrape/trigger', async (req, res) => {
  try {
    const scraperUrl = process.env.HIPAGES_SCRAPER_URL || 'http://hipages-scraper:3001';
    const response = await fetch(`${scraperUrl}/trigger`, { method: 'POST' });
    const data = await response.json();
    res.status(response.status).json({ success: response.ok, ...data });
  } catch (error) {
    console.error('[hipages] Error triggering scrape:', error);
    res.status(503).json({ success: false, error: 'Scraper service unreachable' });
  }
});

module.exports = router;
