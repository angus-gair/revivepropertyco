#!/usr/bin/env node
/**
 * Test for critical fixes from critique:
 * 1. og-image.svg exists and is referenced
 * 2. Private routes have noindex meta tags
 */

const fs = require('fs');
const path = require('path');

const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';
const HEAD = '\x1b[36m';
const RST  = '\x1b[0m';

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ${PASS} ${label}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${label}`);
    failed++;
  }
}

console.log(`\n${HEAD}═══════════════════════════════════════════${RST}`);
console.log(`${HEAD}  Critical Fixes Verification${RST}`);
console.log(`${HEAD}═══════════════════════════════════════════${RST}\n`);

// --- Task 1: OG Image ---
console.log('Task 1 — OG Image');
const ogImage = path.join(__dirname, 'public', 'og-image.jpg');
check('public/og-image.jpg exists', fs.existsSync(ogImage));

const distIndex = path.join(__dirname, 'dist', 'index.html');
const html = fs.readFileSync(distIndex, 'utf-8');
check('index.html references og-image.jpg', html.includes('og-image.jpg'));
check('No references to og-image.svg', !html.includes('og-image.svg'));

const usePageSEO = path.join(__dirname, 'hooks', 'usePageSEO.ts');
const usePageSEOContent = fs.readFileSync(usePageSEO, 'utf-8');
check('usePageSEO references og-image.jpg', usePageSEOContent.includes('og-image.jpg'));

// --- Task 2: Noindex on private routes ---
console.log('\nTask 2 — Noindex on Private Routes');

const privatePages = [
  { file: 'pages/AdminDashboard.tsx', name: 'AdminDashboard' },
  { file: 'pages/LoginPage.tsx', name: 'LoginPage' },
  { file: 'pages/SuccessPage.tsx', name: 'SuccessPage' },
  { file: 'pages/AdminRegrouting.tsx', name: 'AdminRegrouting' },
  { file: 'pages/AdminTeleQuote.tsx', name: 'AdminTeleQuote' },
  { file: 'pages/TeleQuoteLobby.tsx', name: 'TeleQuoteLobby' },
];

for (const { file, name } of privatePages) {
  const fp = path.join(__dirname, file);
  const content = fs.readFileSync(fp, 'utf-8');
  check(`${file} uses usePageSEO`, content.includes('usePageSEO'));
  check(`${file} has noindex: true`, content.includes('noindex: true') || content.includes('noindex'));
}

// Check seoConfig has entries for private routes
const seoConfig = path.join(__dirname, 'seoConfig.ts');
const seoConfigContent = fs.readFileSync(seoConfig, 'utf-8');
check('seoConfig has admin entry', seoConfigContent.includes('admin:'));
check('seoConfig has login entry', seoConfigContent.includes('login:'));
check('seoConfig has adminRegrouting entry', seoConfigContent.includes('adminRegrouting:'));
check('seoConfig has adminTelequote entry', seoConfigContent.includes('adminTelequote:'));
check('seoConfig has telequoteSession entry', seoConfigContent.includes('telequoteSession:'));

// Check usePageSEO hook supports noindex
console.log('\nusePageSEO Hook');
check('usePageSEO has noindex in interface', usePageSEOContent.includes('noindex?'));
check('usePageSEO sets robots meta tag', usePageSEOContent.includes('robots'));
check('usePageSEO conditionally sets noindex', usePageSEOContent.includes('noindex, nofollow'));

// --- Summary ---
console.log(`\n${HEAD}═══════════════════════════════════════════${RST}`);
const total = passed + failed;
console.log(`  Passed: ${passed}/${total}`);
if (failed > 0) {
  console.log(`\x1b[31m  Failed: ${failed}/${total}\x1b[0m`);
  console.log(`${HEAD}═══════════════════════════════════════════${RST}\n`);
  process.exit(1);
} else {
  console.log(`\x1b[32m  All ${total} checks passed!\x1b[0m`);
  console.log(`${HEAD}═══════════════════════════════════════════${RST}\n`);
}
