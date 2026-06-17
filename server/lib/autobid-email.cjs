'use strict';
/**
 * Auto-bid run notifications via Resend (reuses RESEND_API_KEY / RESEND_FROM / ADMIN_EMAIL_* from .env).
 * Two touchpoints per active run:
 *   - sendAutobidStart : when the pipeline commences (only when there are leads to evaluate)
 *   - sendAutobidComplete : the outcome — auto bids, edge cases (almost bid), and not-bid
 * All failures are swallowed (logged) — email must never break the bidding pipeline.
 */
const { Resend } = require('resend');

function client() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}
function fromAddr() { return process.env.RESEND_FROM || 'onboarding@resend.dev'; }
function admins() {
  return [process.env.ADMIN_EMAIL_1, process.env.ADMIN_EMAIL_2, process.env.ADMIN_EMAIL_3].filter(Boolean);
}
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

async function sendToAdmins(subject, html) {
  const resend = client();
  const to = admins();
  if (!resend || !to.length) { console.warn('[autobid-email] no RESEND_API_KEY or admin emails — skipping'); return { success: false }; }
  let sent = 0;
  for (const email of to) {
    try {
      if (sent > 0) await delay(600); // stay under Resend 2 req/s
      const { error } = await resend.emails.send({ from: fromAddr(), to: email, subject, html });
      if (error) console.error('[autobid-email] send error to', email, error);
      else sent++;
    } catch (e) { console.error('[autobid-email] send threw for', email, e.message); }
  }
  return { success: sent > 0, sent };
}

const shell = (accent, title, inner) => `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px">
    <div style="background:${accent};color:#fff;padding:14px 18px;font-weight:bold;letter-spacing:.04em">${title}</div>
    <div style="padding:18px;background:#f5f6f8;border:1px solid #e3e6ea;border-top:none">${inner}</div>
    <p style="color:#8a94a0;font-size:11px;margin-top:12px">Revive Property Co · HiPages auto-bid pipeline (Riv)</p>
  </div>`;

function leadRows(items, cols) {
  if (!items || !items.length) return '<p style="color:#8a94a0">— none —</p>';
  const head = cols.map(c => `<th style="text-align:left;padding:4px 8px;border-bottom:1px solid #ccc;font-size:12px">${c.label}</th>`).join('');
  const body = items.map(it => '<tr>' + cols.map(c => `<td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:12px">${esc(c.get(it))}</td>`).join('') + '</tr>').join('');
  return `<table style="border-collapse:collapse;width:100%;background:#fff"><tr>${head}</tr>${body}</table>`;
}

/** Start-of-run email. */
async function sendAutobidStart({ count, mode, startedAt }) {
  const subject = `[AUTO-BID] Pipeline started — ${count} new lead${count === 1 ? '' : 's'} (${mode})`;
  const inner = `
    <p>The HiPages auto-bid pipeline has <strong>commenced</strong>.</p>
    <ul>
      <li><strong>New leads to evaluate:</strong> ${count}</li>
      <li><strong>Mode:</strong> ${mode === 'LIVE' ? '🔴 LIVE — real bids may be placed' : '🟡 DRY-RUN — no credits spent'}</li>
      <li><strong>Started:</strong> ${esc(startedAt)}</li>
    </ul>
    <p style="color:#8a94a0">You'll receive an outcome summary when this run finishes.</p>`;
  return sendToAdmins(subject, shell('#1f6feb', 'AUTO-BID RUN STARTED', inner));
}

/** End-of-run outcome email. buckets = {accepted, wouldAccept, edge, notBid:{count,samples}, failed}. */
async function sendAutobidComplete({ mode, startedAt, finishedAt, buckets }) {
  const a = buckets.accepted || [], w = buckets.wouldAccept || [], e = buckets.edge || [], f = buckets.failed || [];
  const nb = buckets.notBid || { count: 0, samples: [] };
  const bidLabel = mode === 'LIVE' ? `${a.length} auto-bid` : `${w.length} would-bid`;
  const subject = `[AUTO-BID] Run complete — ${bidLabel}, ${e.length} almost, ${nb.count} skipped`;

  const svcConf = [
    { label: 'Job', get: x => x.job_type },
    { label: 'Suburb', get: x => x.suburb },
    { label: 'Service', get: x => x.service_line },
    { label: 'Conf', get: x => x.confidence },
    { label: 'Credits', get: x => x.credits },
  ];
  const edgeCols = [
    { label: 'Job', get: x => x.job_type },
    { label: 'Suburb', get: x => x.suburb },
    { label: 'Service', get: x => x.service_line },
    { label: 'Conf', get: x => x.confidence },
    { label: 'Why not bid', get: x => x.reason },
  ];

  const inner = `
    <p><strong>Mode:</strong> ${mode === 'LIVE' ? '🔴 LIVE' : '🟡 DRY-RUN'} · ${esc(startedAt)} → ${esc(finishedAt)}</p>

    <h3 style="color:#1a7f37;margin:16px 0 6px">🟢 ${mode === 'LIVE' ? 'Auto bids placed' : 'Would have bid (dry-run)'} — ${(mode === 'LIVE' ? a : w).length}</h3>
    ${leadRows(mode === 'LIVE' ? a : w, svcConf)}

    <h3 style="color:#9a6700;margin:16px 0 6px">🟡 Edge cases — almost bid (blocked by a guardrail) — ${e.length}</h3>
    ${leadRows(e, edgeCols)}

    <h3 style="color:#57606a;margin:16px 0 6px">⚪ Not auto-bid (not a target service) — ${nb.count}</h3>
    ${nb.count ? leadRows(nb.samples, svcConf) + (nb.count > nb.samples.length ? `<p style="color:#8a94a0;font-size:12px">…and ${nb.count - nb.samples.length} more (your manual-decline queue)</p>` : '') : '<p style="color:#8a94a0">— none —</p>'}

    ${f.length ? `<h3 style="color:#cf222e;margin:16px 0 6px">🔴 Failed (lead expired / button gone) — ${f.length}</h3>${leadRows(f, edgeCols)}` : ''}
  `;
  return sendToAdmins(subject, shell('#1a7f37', 'AUTO-BID RUN COMPLETE', inner));
}

module.exports = { sendAutobidStart, sendAutobidComplete };
