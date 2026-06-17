#!/usr/bin/env node
'use strict';
/**
 * Import + activate the HiPages auto-bid workflow into the live n8n via its public REST API.
 *
 * Usage:
 *   N8N_API_KEY=eyJ... node server/lib/n8n-import.cjs            # import + activate
 *   N8N_API_KEY=eyJ... node server/lib/n8n-import.cjs --list     # just list workflows (access test)
 *   N8N_API_KEY=eyJ... node server/lib/n8n-import.cjs --no-activate
 *
 * Secrets (ACTION_SECRET, OPENROUTER_API_KEY) are read from .env and injected into the
 * workflow's Config node automatically — no manual editing in the n8n UI required.
 *
 * Create the API key in n8n: Settings -> n8n API -> Create an API key.
 */
const fs = require('fs');
const path = require('path');

const N8N_BASE = process.env.N8N_BASE || 'https://n8n.ajinsights.com.au';
const API_KEY = process.env.N8N_API_KEY;
const WF_PATH = path.join(__dirname, 'hipages-autobid.n8n.json');
const ENV_PATH = path.join(__dirname, '..', '..', '.env');

function readEnv(name) {
  try {
    const line = fs.readFileSync(ENV_PATH, 'utf8').split('\n').find(l => l.startsWith(name + '='));
    return line ? line.slice(name.length + 1).trim() : null;
  } catch { return null; }
}

async function api(method, endpoint, body) {
  const res = await fetch(`${N8N_BASE}/api/v1${endpoint}`, {
    method,
    headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`n8n API ${method} ${endpoint} -> HTTP ${res.status}: ${typeof json === 'string' ? json.slice(0, 300) : JSON.stringify(json).slice(0, 300)}`);
  return json;
}

function injectSecrets(wf) {
  const actionSecret = readEnv('ACTION_SECRET');
  const openrouterKey = readEnv('OPENROUTER_API_KEY');
  if (!actionSecret) throw new Error('ACTION_SECRET not found in .env');
  if (!openrouterKey || openrouterKey.startsWith('sk-or-v1-REPLACE')) throw new Error('OPENROUTER_API_KEY not set in .env');
  const cfg = wf.nodes.find(n => n.name === 'Config');
  if (!cfg) throw new Error('Config node not found in workflow');
  cfg.parameters.jsCode = cfg.parameters.jsCode
    .replace('REPLACE_WITH_ACTION_SECRET', actionSecret)
    .replace('REPLACE_WITH_OPENROUTER_API_KEY', openrouterKey);
  return wf;
}

(async () => {
  // --emit <path>: write a secrets-injected workflow JSON for the n8n CLI import path
  // (no API key required). Used by go-live.sh's docker-exec route.
  const emitIdx = process.argv.indexOf('--emit');
  if (emitIdx !== -1) {
    const out = process.argv[emitIdx + 1];
    if (!out) throw new Error('--emit requires a target path');
    const wf = injectSecrets(JSON.parse(fs.readFileSync(WF_PATH, 'utf8')));
    fs.writeFileSync(out, JSON.stringify(wf, null, 2));
    console.log(`[n8n] Wrote secrets-injected workflow to ${out}`);
    process.exit(0);
  }

  if (!API_KEY) { console.error('ERROR: set N8N_API_KEY env var (n8n: Settings -> n8n API -> Create an API key).'); process.exit(1); }

  // Access test — list workflows
  const list = await api('GET', '/workflows?limit=100');
  const existing = (list.data || []).map(w => ({ id: w.id, name: w.name, active: w.active }));
  console.log(`[n8n] ACCESS OK — ${existing.length} workflow(s) visible.`);
  existing.forEach(w => console.log(`        - ${w.active ? '●' : '○'} ${w.name} (id=${w.id})`));

  if (process.argv.includes('--list')) { process.exit(0); }

  // Load workflow + inject secrets
  const wf = injectSecrets(JSON.parse(fs.readFileSync(WF_PATH, 'utf8')));

  // Build a clean payload accepted by the public API (name, nodes, connections, settings only)
  const payload = {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || { executionOrder: 'v1' },
  };

  // Replace if a workflow with the same name already exists (idempotent re-import)
  const prior = existing.find(w => w.name === wf.name);
  let saved;
  if (prior) {
    saved = await api('PUT', `/workflows/${prior.id}`, payload);
    console.log(`[n8n] Updated existing workflow "${wf.name}" (id=${prior.id}).`);
  } else {
    saved = await api('POST', '/workflows', payload);
    console.log(`[n8n] Created workflow "${wf.name}" (id=${saved.id}).`);
  }

  const id = saved.id || (prior && prior.id);
  if (!process.argv.includes('--no-activate')) {
    await api('POST', `/workflows/${id}/activate`);
    console.log(`[n8n] ACTIVATED workflow id=${id}.`);
  }
  console.log(`[n8n] Open: ${N8N_BASE}/workflow/${id}`);
  console.log('[n8n] Done. Secrets were injected from .env — no manual UI editing needed.');
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
