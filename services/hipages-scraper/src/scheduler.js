require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const { runScrape } = require('./scraper.js');
const { syncNewLeads } = require('./twenty-sync.js');
const { startActionServer, setTriggerCallback } = require('./action-server.js');
const pool = require('./lib/db.js');

const LOCK_FILE = process.env.LOCK_FILE || '/tmp/hipages-scraper.lock';
let scrapeRunning = false;

function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
      try {
        process.kill(pid, 0);
        throw new Error(`Scraper already running (PID ${pid})`);
      } catch (e) {
        if (e.message.includes('already running')) throw e;
        console.log('[scheduler] Stale lock file found, removing');
        fs.unlinkSync(LOCK_FILE);
      }
    } catch (e) {
      if (e.message.includes('already running')) throw e;
      console.log('[scheduler] Invalid lock file found, removing');
      fs.unlinkSync(LOCK_FILE);
    }
  }
  fs.writeFileSync(LOCK_FILE, process.pid.toString());
  console.log(`[scheduler] Lock acquired (PID ${process.pid})`);
}

function releaseLock() {
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
    console.log('[scheduler] Lock released');
  }
}

/**
 * Full scrape + CRM sync cycle.
 * Sync runs even if scrape finds no new leads (drains existing queue).
 */
async function scrapeJob() {
  if (scrapeRunning) {
    console.log('[scheduler] Scrape already running, skipping');
    return;
  }
  scrapeRunning = true;
  console.log('[scheduler] Starting scheduled scrape');
  console.log(`[scheduler] Time: ${new Date().toISOString()}`);

  try {
    acquireLock();

    // Step 1: Scrape HiPages → save to DB
    let scrapeResult = { saved: 0, updated: 0 };
    try {
      scrapeResult = await runScrape();
      const { saved, updated } = scrapeResult;
      if (saved > 0) {
        console.log(`[scheduler] Scrape complete: ${saved} NEW leads, ${updated} updated`);
      } else {
        console.log(`[scheduler] Scrape complete: no new leads (${updated} status updates)`);
      }
    } catch (scrapeErr) {
      console.error('[scheduler] Scrape failed (will still attempt CRM sync):', scrapeErr.message);
    }

    // Step 2: Sync unsynced leads → Twenty CRM
    // Always run to drain the backlog queue, not just when this scrape found new leads
    try {
      const syncResult = await syncNewLeads();
      if (!syncResult.skipped) {
        console.log(`[scheduler] CRM sync complete: ${syncResult.synced} synced, ${syncResult.failed} failed`);
      }
    } catch (syncErr) {
      console.error('[scheduler] CRM sync failed:', syncErr.message);
    }

  } finally {
    releaseLock();
    scrapeRunning = false;
  }
}

function setupShutdownHandlers() {
  const shutdown = async (signal) => {
    console.log(`[scheduler] Received ${signal}, shutting down gracefully...`);
    releaseLock();
    await pool.end().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('exit', () => {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
        if (pid === process.pid) releaseLock();
      }
    } catch {}
  });
}

async function startScheduler() {
  console.log('[scheduler] Hipages scraper scheduler starting...');

  const schedule = process.env.CRON_SCHEDULE || '0 */6 * * *';
  console.log(`[scheduler] Cron schedule: ${schedule}`);

  // Start action server (health, status, accept/decline, manual trigger)
  setTriggerCallback(scrapeJob);
  startActionServer();

  // Optional startup run
  if (process.env.RUN_ON_STARTUP === 'true') {
    console.log('[scheduler] RUN_ON_STARTUP=true, running initial scrape...');
    await scrapeJob().catch(e => console.error('[scheduler] Startup scrape failed:', e.message));
  }

  cron.schedule(schedule, scrapeJob, { timezone: 'Australia/Sydney', scheduled: true });

  console.log('[scheduler] Scheduler running — next run at top of next 6-hour window');
}

startScheduler().catch(err => {
  console.error('[scheduler] Fatal startup error:', err);
  process.exit(1);
});

setupShutdownHandlers();
