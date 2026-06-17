'use strict';
// Action server suite: health, status endpoint, scheduler cron interval.
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const { ok, equal, suite } = require('./lib/assert.js');
const http = require('http');

const ACTION_PORT = parseInt(process.env.ACTION_PORT || '3001');
// When run inside the container the server is on localhost;
// from host it's accessible as hipages-scraper:3001 (Docker network)
const ACTION_HOST = process.env.ACTION_HOST || 'localhost';

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: ACTION_HOST, port: ACTION_PORT, path }, res => {
      let body = '';
      res.on('data', d => (body += d));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(new Error('timeout')); });
  });
}

async function run() {
  await suite('Action server: /health', async () => {
    let res;
    try {
      res = await get('/health');
    } catch (e) {
      ok(false, `GET /health reachable — ${e.message}`);
      return;
    }
    equal(res.status, 200, 'HTTP 200');
    equal(res.data.status, 'ok', 'status = ok');
    ok('actionBusy' in res.data, 'actionBusy field present');
  });

  await suite('Action server: /status', async () => {
    let res;
    try {
      res = await get('/status');
    } catch (e) {
      ok(false, `GET /status reachable — ${e.message}`);
      return;
    }
    equal(res.status, 200, 'HTTP 200');
    ok(typeof res.data.total === 'number' || typeof res.data.total === 'string',
       'total field present');
    console.log(`  ℹ Status: total=${res.data.total}, unsynced=${res.data.unsynced}, last_scraped=${res.data.last_scraped}`);
  });

  await suite('Scheduler: cron interval is 10 min', async () => {
    const schedule = process.env.CRON_SCHEDULE || '0 */6 * * *';
    equal(schedule, '*/10 * * * *', `CRON_SCHEDULE = ${schedule}`);
  });
}

module.exports = { run };
