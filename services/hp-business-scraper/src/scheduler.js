require('dotenv').config();
const cron = require('node-cron');
const { runScrape } = require('./scraper');
const dbWriter = require('./db-writer');

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 2 * * *'; // Daily at 2am

console.log('[scheduler] hp-business-scraper starting...');
console.log('[scheduler] Cron schedule:', CRON_SCHEDULE);

// Test DB connection on startup
dbWriter.testConnection()
  .then(result => console.log('[scheduler] DB connected:', result.timestamp))
  .catch(err => {
    console.error('[scheduler] DB connection failed:', err.message);
    // Don't exit — may connect later
  });

// Run immediately on first start
runScrape().catch(err => console.error('[scheduler] Initial scrape error:', err));

// Schedule recurring scrapes
cron.schedule(CRON_SCHEDULE, async () => {
  console.log('[scheduler] Running scheduled scrape...');
  try {
    await runScrape();
    console.log('[scheduler] Scheduled scrape complete');
  } catch (err) {
    console.error('[scheduler] Scheduled scrape error:', err);
  }
});
