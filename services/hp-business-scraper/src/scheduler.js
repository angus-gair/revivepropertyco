require('dotenv').config();
const cron = require('node-cron');
const { runScrape } = require('./scraper');
const dbWriter = require('./db-writer');
const { Client } = require('pg');

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 2 * * *'; // Daily at 2am

console.log('[scheduler] hp-business-scraper starting...');
console.log('[scheduler] Cron schedule:', CRON_SCHEDULE);

let isRunning = false;

async function executeScrape() {
  if (isRunning) {
    console.log('[scheduler] Scrape already in progress, skipping.');
    return;
  }
  isRunning = true;
  try {
    await runScrape();
    console.log('[scheduler] Scrape complete');
  } catch (err) {
    console.error('[scheduler] Scrape error:', err);
  } finally {
    isRunning = false;
  }
}

// Test DB connection on startup
dbWriter.testConnection()
  .then(result => {
    console.log('[scheduler] DB connected:', result.timestamp);
    startNotificationListener();
  })
  .catch(err => {
    console.error('[scheduler] DB connection failed:', err.message);
    startNotificationListener();
  });

// Run immediately on first start
executeScrape().catch(err => console.error('[scheduler] Initial scrape error:', err));

// Schedule recurring scrapes
cron.schedule(CRON_SCHEDULE, async () => {
  console.log('[scheduler] Running scheduled scrape...');
  await executeScrape();
});

async function startNotificationListener() {
  let client = null;
  let reconnectTimer = null;

  async function connectAndListen() {
    console.log('[scheduler] Connecting database listener...');
    client = new Client({
      connectionString: process.env.HP_BUSINESSES_DB_URL,
    });

    client.on('error', (err) => {
      console.error('[scheduler] Database listener error:', err.message);
      reconnect();
    });

    client.on('notification', async (msg) => {
      if (msg.channel === 'hp_scrape_trigger') {
        console.log('[scheduler] Received hp_scrape_trigger notification:', msg.payload);
        executeScrape().catch(err => console.error('[scheduler] Async trigger run error:', err));
      }
    });

    try {
      await client.connect();
      await client.query('LISTEN hp_scrape_trigger');
      console.log('[scheduler] Successfully listening to hp_scrape_trigger channel');
    } catch (err) {
      console.error('[scheduler] Failed to connect/listen:', err.message);
      reconnect();
    }
  }

  function reconnect() {
    if (reconnectTimer) return;
    if (client) {
      client.end().catch(() => {});
      client = null;
    }
    console.log('[scheduler] Reconnecting listener in 5 seconds...');
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectAndListen();
    }, 5000);
  }

  await connectAndListen();
}
