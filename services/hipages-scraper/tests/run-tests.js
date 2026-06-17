#!/usr/bin/env node
'use strict';
/**
 * Revive Property Co — Twenty CRM Integration Test Runner
 *
 * Usage (inside the hipages-scraper container):
 *   node tests/run-tests.js              # all suites
 *   node tests/run-tests.js db           # DB suite only
 *   node tests/run-tests.js twenty       # Twenty CRM suite only
 *   node tests/run-tests.js booking      # Booking sync suite only
 *   node tests/run-tests.js action       # Action server suite only
 *
 * From the host:
 *   docker exec revive-hipages-scraper node /app/src/../tests/run-tests.js
 * Or via npm (from services/hipages-scraper/):
 *   node tests/run-tests.js
 */

const { summary } = require('./lib/assert.js');

const ALL_SUITES = {
  db:      './suite-db.js',
  twenty:  './suite-twenty.js',
  booking: './suite-booking.js',
  action:  './suite-action-server.js',
};

const selected = process.argv.slice(2).filter(a => !a.startsWith('-'));
const toRun = selected.length > 0
  ? selected.filter(s => ALL_SUITES[s])
  : Object.keys(ALL_SUITES);

console.log('╔══════════════════════════════════════════════════╗');
console.log('║  Revive Property Co — CRM Integration Test Suite  ║');
console.log('╚══════════════════════════════════════════════════╝');
console.log(`Running: ${toRun.join(', ')}\n`);

(async () => {
  for (const name of toRun) {
    const path = ALL_SUITES[name];
    if (!path) {
      console.log(`Unknown suite: ${name}. Available: ${Object.keys(ALL_SUITES).join(', ')}`);
      continue;
    }
    try {
      const suite = require(path);
      await suite.run();
    } catch (err) {
      console.error(`\nSuite "${name}" crashed: ${err.message}`);
    }
  }

  const allPassed = summary();
  process.exit(allPassed ? 0 : 1);
})();
