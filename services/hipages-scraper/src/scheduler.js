require('dotenv').config();
const cron = require('node-cron');
const { runScrape } = require('./scraper.js');
const fs = require('fs');
const path = require('path');

// Lock file to prevent concurrent scraper runs
const LOCK_FILE = process.env.LOCK_FILE || '/tmp/hipages-scraper.lock';

/**
 * Acquire file-based lock to prevent concurrent scraper runs
 * Throws error if scraper is already running
 */
function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    // Lock file exists - check if process is still running
    try {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));

      // Check if process exists (signal 0 doesn't kill process, just checks existence)
      try {
        process.kill(pid, 0);
        // Process is still running
        throw new Error(`Scraper already running (PID ${pid})`);
      } catch (e) {
        // Process doesn't exist, stale lock
        console.log('[scheduler] Stale lock file found, removing');
        fs.unlinkSync(LOCK_FILE);
      }
    } catch (e) {
      // Couldn't read PID or process is running
      if (e.message.includes('already running')) {
        throw e;
      }
      // Invalid lock file, remove it
      console.log('[scheduler] Invalid lock file found, removing');
      fs.unlinkSync(LOCK_FILE);
    }
  }

  // Write current PID to lock file
  fs.writeFileSync(LOCK_FILE, process.pid.toString());
  console.log(`[scheduler] Lock acquired (PID ${process.pid})`);
}

/**
 * Release file-based lock
 */
function releaseLock() {
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
    console.log('[scheduler] Lock released');
  }
}

/**
 * Scheduled scrape job wrapper
 * Acquires lock, runs scrape, releases lock
 */
async function scrapeJob() {
  console.log('[scheduler] Starting scheduled scrape');
  console.log(`[scheduler] Time: ${new Date().toISOString()}`);

  try {
    acquireLock();
    const result = await runScrape();
    console.log(`[scheduler] Scrape completed: ${result.saved} leads saved, ${result.updated} updated`);
  } catch (error) {
    console.error('[scheduler] Scrape failed:', error.message);
  } finally {
    releaseLock();
  }
}

/**
 * Graceful shutdown handler
 * Ensures lock is released on exit
 */
function setupShutdownHandlers() {
  const shutdown = (signal) => {
    console.log(`[scheduler] Received ${signal}, shutting down gracefully...`);
    releaseLock();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('exit', () => {
    // Final cleanup attempt
    try {
      if (fs.existsSync(LOCK_FILE)) {
        const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8'));
        if (pid === process.pid) {
          releaseLock();
        }
      }
    } catch (e) {
      // Ignore errors during exit
    }
  });
}

// Initialize scheduler
async function startScheduler() {
  console.log('[scheduler] Hipages scraper scheduler starting...');
  console.log(`[scheduler] Cron schedule: ${process.env.CRON_SCHEDULE || '0 */6 * * *'} (every 6 hours)`);

  // Run on startup if enabled
  if (process.env.RUN_ON_STARTUP === 'true') {
    console.log('[scheduler] RUN_ON_STARTUP=true, running initial scrape...');
    try {
      await scrapeJob();
    } catch (error) {
      console.error('[scheduler] Initial scrape failed:', error);
    }
  }

  // Schedule recurring scrapes
  // Default: Every 6 hours (0 0,6,12,18 * * *)
  const schedule = process.env.CRON_SCHEDULE || '0 */6 * * *';

  cron.schedule(schedule, scrapeJob, {
    timezone: 'Australia/Sydney',
    scheduled: true
  });

  console.log('[scheduler] Hipages scraper scheduler started');
  console.log('[scheduler] Next scrape will run at the top of the next 6-hour window');
  console.log('[scheduler] Press Ctrl+C to stop');
}

// Start the scheduler
startScheduler().catch((error) => {
  console.error('[scheduler] Failed to start scheduler:', error);
  process.exit(1);
});

// Setup graceful shutdown handlers
setupShutdownHandlers();
