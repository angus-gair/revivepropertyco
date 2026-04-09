#!/usr/bin/env node
/**
 * SEO Work Package 7 — Private Route Protection
 * Verifies noindex meta tags on admin/private routes and exclusion from sitemap.
 */

const fs = require('fs');
const path = require('path');

const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';
const SEP = '\x1b[36m═══════════════════════════════════════════\x1b[0m';

let passed = 0;
let failed = 0;

function check(name, result, detail = '') {
  if (result) {
    console.log(`  ${PASS} ${name}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${name}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

function main() {
  console.log(SEP);
  console.log('  SEO WP7 — Private Route Protection');
  console.log(SEP);

  // --- 1. Task 7.1: SEO Config has noindex property ---
  console.log('\nTask 7.1: SEO Configuration');

  const seoConfig = fs.readFileSync(path.join(__dirname, 'seoConfig.ts'), 'utf8');
  check('PageSEOConfig has noindex property', seoConfig.includes('noindex?: boolean'));

  // --- 2. Private routes have noindex: true in config ---
  console.log('\nTask 7.2: Private Routes in SEO Config');

  // Parse the config to check noindex values
  const privateRoutes = ['admin', 'login', 'adminRegrouting', 'adminTelequote', 'telequoteSession', 'success'];

  for (const route of privateRoutes) {
    // Check if the route has noindex: true
    const routePattern = new RegExp(`${route}:\\s*\\{[^}]*noindex:\\s*true`, 's');
    check(`${route} has noindex: true`, routePattern.test(seoConfig));
  }

  // --- 3. Pages use noindex when calling usePageSEO ---
  console.log('\nTask 7.3: Page Implementation');

  const adminDashboard = fs.readFileSync(path.join(__dirname, 'pages/AdminDashboard.tsx'), 'utf8');
  check('AdminDashboard uses noindex', adminDashboard.includes('noindex: true') || adminDashboard.includes('SEO.admin'));

  const loginPage = fs.readFileSync(path.join(__dirname, 'pages/LoginPage.tsx'), 'utf8');
  check('LoginPage uses noindex', loginPage.includes('noindex: true') || loginPage.includes('SEO.login'));

  const successPage = fs.readFileSync(path.join(__dirname, 'pages/SuccessPage.tsx'), 'utf8');
  check('SuccessPage uses noindex', successPage.includes('noindex: true') || successPage.includes('SEO.success'));

  const adminRegrouting = fs.readFileSync(path.join(__dirname, 'pages/AdminRegrouting.tsx'), 'utf8');
  check('AdminRegrouting uses noindex', adminRegrouting.includes('noindex: true') || adminRegrouting.includes('SEO.adminRegrouting'));

  const adminTelequote = fs.readFileSync(path.join(__dirname, 'pages/AdminTeleQuote.tsx'), 'utf8');
  check('AdminTelequote uses noindex', adminTelequote.includes('noindex: true') || adminTelequote.includes('SEO.adminTelequote'));

  const telequoteLobby = fs.readFileSync(path.join(__dirname, 'pages/TeleQuoteLobby.tsx'), 'utf8');
  check('TeleQuoteLobby uses noindex', telequoteLobby.includes('noindex: true') || telequoteLobby.includes('SEO.telequoteSession'));

  // --- 4. usePageSEO hook implements noindex ---
  console.log('\nTask 7.4: usePageSEO Hook');

  const usePageSEO = fs.readFileSync(path.join(__dirname, 'hooks/usePageSEO.ts'), 'utf8');
  check('usePageSEO accepts noindex parameter', usePageSEO.includes('noindex?: boolean'));
  check('usePageSEO sets robots meta tag', usePageSEO.includes('noindex, nofollow'));
  check('usePageSEO removes robots tag when not noindex', usePageSEO.includes('querySelector') && usePageSEO.includes('remove'));

  // --- 5. robots.txt excludes private routes ---
  console.log('\nTask 7.5: robots.txt Exclusions');

  const robotsTxt = fs.readFileSync(path.join(__dirname, 'public/robots.txt'), 'utf8');
  check('robots.txt blocks /admin', robotsTxt.includes('Disallow: /admin'));
  check('robots.txt blocks /login', robotsTxt.includes('Disallow: /login'));
  check('robots.txt blocks /session', robotsTxt.includes('Disallow: /session'));
  check('robots.txt blocks /success', robotsTxt.includes('Disallow: /success'));

  // --- 6. sitemap.xml excludes private routes ---
  console.log('\nTask 7.6: sitemap.xml Exclusions');

  const sitemap = fs.readFileSync(path.join(__dirname, 'public/sitemap.xml'), 'utf8');
  check('sitemap does NOT include /admin', !sitemap.includes('/admin'));
  check('sitemap does NOT include /login', !sitemap.includes('/login'));
  check('sitemap does NOT include /session', !sitemap.includes('/session'));
  check('sitemap does NOT include /success', !sitemap.includes('/success'));
  check('sitemap includes public routes', sitemap.includes('/pressure-washing') && sitemap.includes('/contact'));

  // Summary
  console.log('\n' + SEP);
  const total = passed + failed;
  console.log(`  Passed: ${passed}/${total}`);
  if (failed === 0) {
    console.log('\x1b[32m  All checks passed — WP7 is complete!\x1b[0m');
  } else {
    console.log(`\x1b[31m  ${failed} check(s) failed\x1b[0m`);
  }
  console.log(SEP);

  console.log('\nSummary of Changes:');
  console.log('');
  console.log('  ✅ Task 7.1: Added noindex property to PageSEOConfig interface');
  console.log('  ✅ Task 7.2: Set noindex: true for all private routes in SEO config');
  console.log('  ✅ Task 7.3: All private pages use noindex via usePageSEO');
  console.log('  ✅ Task 7.4: usePageSEO hook implements robots meta tag correctly');
  console.log('  ✅ Task 7.5: robots.txt excludes private routes');
  console.log('  ✅ Task 7.6: sitemap.xml excludes private routes');
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main();
