'use strict';
// Lightweight assertion helpers — no external deps required.

let passed = 0;
let failed = 0;
const failures = [];

function ok(value, label) {
  if (value) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}`);
  }
}

function equal(actual, expected, label) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(`${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
    console.log(`  ✗ ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function gt(actual, min, label) {
  if (actual > min) {
    passed++;
    console.log(`  ✓ ${label} (${actual} > ${min})`);
  } else {
    failed++;
    failures.push(`${label} (${actual} not > ${min})`);
    console.log(`  ✗ ${label} — ${actual} not > ${min}`);
  }
}

function suite(name, fn) {
  console.log(`\n── ${name}`);
  return fn();
}

function summary() {
  const total = passed + failed;
  console.log('\n' + '═'.repeat(50));
  console.log(`Results: ${passed}/${total} passed`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  ✗ ${f}`));
  }
  console.log('═'.repeat(50));
  return failed === 0;
}

module.exports = { ok, equal, gt, suite, summary };
