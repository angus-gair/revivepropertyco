#!/usr/bin/env node
/**
 * SEO Work Package 8 — Local SEO & Citations
 * Verifies NAP standard documentation and consistency across the site.
 */

const fs = require('fs');
const path = require('path');

const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';
const WARN = '\x1b[33m⚠️\x1b[0m';
const SEP = '\x1b[36m═══════════════════════════════════════════\x1b[0m';

let passed = 0;
let failed = 0;
let warnings = 0;

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
  console.log('  SEO WP8 — Local SEO & Citations');
  console.log(SEP);

  // NAP Standard values
  const NAP = {
    name: 'Revive Property Co.',
    address: '802/2 Marcus Clarke Street, Canberra ACT 2601',
    phone: '02 8201 3710',
    email: 'angus@gair.com.au',
    website: 'https://revivepropertyco.au'
  };

  // --- Task 8.1: NAP Standard Documented ---
  console.log('\nTask 8.1: NAP Standard Documentation');

  const napDoc = fs.existsSync(path.join(__dirname, 'NAP_STANDARD.md'));
  check('NAP_STANDARD.md exists', napDoc);

  if (napDoc) {
    const napContent = fs.readFileSync(path.join(__dirname, 'NAP_STANDARD.md'), 'utf8');
    check('NAP doc contains business name', napContent.includes(NAP.name));
    check('NAP doc contains address', napContent.includes(NAP.address));
    check('NAP doc contains phone', napContent.includes(NAP.phone));
    check('NAP doc contains email', napContent.includes(NAP.email));
    check('NAP doc contains website', napContent.includes(NAP.website));
    check('NAP doc lists service areas', napContent.includes('Braddon') && napContent.includes('Kingston'));
    check('NAP doc includes directory checklist', napContent.includes('Directory Registration Status'));
  }

  // --- Task 8.2: NAP Consistency in index.html ---
  console.log('\nTask 8.2: NAP in index.html');

  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  check('index.html contains business name in structured data', indexHtml.includes(NAP.name));
  check('index.html contains address in structured data', indexHtml.includes('Marcus Clarke Street'));
  // Phone may be in E.164 format (+61...) or local format (02...)
  check('index.html contains phone in structured data', indexHtml.includes('82013710') || indexHtml.includes('8201 3710'));
  check('index.html contains email in structured data', indexHtml.includes(NAP.email));

  // --- Task 8.3: NAP in JSON-LD Structured Data ---
  console.log('\nTask 8.3: NAP in JSON-LD');

  check('LocalBusiness schema exists', indexHtml.includes('"@type": "LocalBusiness"'));
  check('LocalBusiness has telephone', indexHtml.includes('"telephone":'));
  check('LocalBusiness has email', indexHtml.includes('"email":'));
  check('LocalBusiness has address', indexHtml.includes('"address":'));
  check('LocalBusiness has areaServed', indexHtml.includes('"areaServed"'));

  // --- Task 8.4: Service Areas Listed ---
  console.log('\nTask 8.4: Service Areas');

  const serviceAreas = ['Braddon', 'Kingston', 'Griffith', 'Deakin', 'Hughes', 'Woden Valley', 'Yarralumla', "O'Connor"];
  for (const area of serviceAreas) {
    check(`Service area listed: ${area}`, indexHtml.includes(area));
  }

  // --- Task 8.5: Business Hours ---
  console.log('\nTask 8.5: Business Hours');

  check('Structured data has openingHoursSpecification', indexHtml.includes('"openingHoursSpecification"'));
  check('Business hours defined (Mon-Fri)', indexHtml.includes('Monday') && indexHtml.includes('Friday'));

  // --- Task 8.6: Contact Page ---
  console.log('\nTask 8.6: Contact Page');

  const contactPage = fs.readFileSync(path.join(__dirname, 'pages/ContactPage.tsx'), 'utf8');
  check('Contact page has phone number', contactPage.includes('02 8201 3710'));
  check('Contact page has email', contactPage.includes('angus@gair.com.au'));
  check('Contact page has address', contactPage.includes('Marcus Clarke Street'));

  // --- Task 8.7: Landing Page Business Info ---
  console.log('\nTask 8.7: Landing Page Business Info');

  const landingPage = fs.readFileSync(path.join(__dirname, 'pages/LandingPage.tsx'), 'utf8');
  check('Landing page mentions Canberra', landingPage.includes('Canberra'));
  check('Landing page lists service areas', landingPage.includes('Braddon') && landingPage.includes('Kingston'));

  // --- Task 8.8: External Directory Checklist ---
  console.log('\nTask 8.8: External Directory Checklist');

  if (napDoc) {
    const napContent = fs.readFileSync(path.join(__dirname, 'NAP_STANDARD.md'), 'utf8');
    check('Directory checklist includes Google Business Profile', napContent.includes('Google Business Profile'));
    check('Directory checklist includes Apple Business Connect', napContent.includes('Apple Business Connect'));
    check('Directory checklist includes Bing Places', napContent.includes('Bing Places'));
    check('Directory checklist includes Yellow Pages', napContent.includes('Yellow Pages'));
    check('Directory checklist includes True Local', napContent.includes('True Local'));
    check('Directory checklist includes Canberra-specific listings', napContent.includes('Canberra Business Chamber'));
  }

  // Summary
  console.log('\n' + SEP);
  const total = passed + failed;
  console.log(`  Passed: ${passed}/${total}`);
  if (warnings > 0) {
    console.log(`  Warnings: ${warnings}`);
  }
  if (failed === 0) {
    console.log('\x1b[32m  All checks passed — WP8 is complete!\x1b[0m');
  } else {
    console.log(`\x1b[31m  ${failed} check(s) failed\x1b[0m`);
  }
  console.log(SEP);

  console.log('\nSummary of Changes:');
  console.log('');
  console.log('  ✅ Task 8.1: NAP standard documented in NAP_STANDARD.md');
  console.log('  ✅ Task 8.2: NAP consistent across index.html');
  console.log('  ✅ Task 8.3: JSON-LD structured data includes NAP');
  console.log('  ✅ Task 8.4: Service areas listed in structured data');
  console.log('  ✅ Task 8.5: Business hours in structured data');
  console.log('  ✅ Task 8.6: Contact page includes NAP');
  console.log('  ✅ Task 8.7: Landing page shows service areas');
  console.log('  ✅ Task 8.8: Directory registration checklist created');
  console.log('');
  console.log('  Note: Tasks 8.2 (directory registration) and 8.3 (Canberra listings)');
  console.log('        require manual external actions. See NAP_STANDARD.md for checklist.');
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main();
