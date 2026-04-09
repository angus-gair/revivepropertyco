#!/usr/bin/env node
/**
 * SEO Work Package 4 — Google Business Profile
 * Verifies GBP-aligned schema and review collection infrastructure.
 * Manual tasks (4.1–4.3, 4.5) are documented at the end.
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
  console.log('  SEO WP4 — Google Business Profile Prerequisites');
  console.log(SEP);

  // --- 1. Review Page ---
  console.log('\nReview Collection Page');
  const reviewPage = fs.readFileSync(path.join(__dirname, 'pages/ReviewPage.tsx'), 'utf8');
  check('ReviewPage.tsx exists', true);
  check('ReviewPage imports usePageSEO', reviewPage.includes('usePageSEO'));
  check('ReviewPage uses usePageSEO hook', reviewPage.includes('usePageSEO('));
  check('ReviewPage has review-optimized title', reviewPage.includes('Leave a Review'));
  check('ReviewPage has Google review link', reviewPage.includes('search.google.com/local/writereview'));
  check('ReviewPage has Facebook review link', reviewPage.includes('facebook.com/review'));
  check('ReviewPage has True Local review link', reviewPage.includes('truelocal.com.au'));
  check('ReviewPage has review tips section', reviewPage.includes('Helpful Tips'));

  // --- 2. Route Configuration ---
  console.log('\nRoute Configuration');
  const appTsx = fs.readFileSync(path.join(__dirname, 'App.tsx'), 'utf8');
  check('App.tsx imports ReviewPage', appTsx.includes("import ReviewPage"));
  check('App.tsx has /review route', appTsx.includes('path="/review"'));
  check('App.tsx ReviewPage element', appTsx.includes('<ReviewPage'));

  // --- 3. SEO Config ---
  console.log('\nSEO Configuration');
  const seoConfig = fs.readFileSync(path.join(__dirname, 'seoConfig.ts'), 'utf8');
  check('seoConfig has review entry', seoConfig.includes('review:'));
  check('review config has title', seoConfig.match(/review:\s*{[\s\S]*?title:/));
  check('review config has description', seoConfig.match(/review:\s*{[\s\S]*?description:/));
  check('review config has path', seoConfig.match(/review:\s*{[\s\S]*?path:/));

  // --- 4. Sitemap ---
  console.log('\nSitemap.xml');
  const sitemap = fs.readFileSync(path.join(__dirname, 'public/sitemap.xml'), 'utf8');
  check('sitemap includes /review', sitemap.includes('/review'));
  check('sitemap excludes /admin', !sitemap.includes('/admin'));
  check('sitemap excludes /login', !sitemap.includes('/login'));
  check('sitemap excludes /success', !sitemap.includes('/success'));
  check('sitemap excludes /session', !sitemap.includes('/session'));

  // --- 5. LocalBusiness Schema (GBP-aligned) ---
  console.log('\nLocalBusiness Schema (GBP Requirements)');
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  check('has LocalBusiness type', indexHtml.includes('"LocalBusiness"'));
  check('has business name', indexHtml.includes('"name": "Revive Property Co."'));
  check('has URL', indexHtml.includes('"url": "https://revivepropertyco.au"'));
  check('has telephone', indexHtml.includes('"telephone":'));
  check('has email', indexHtml.includes('"email":'));
  check('has address.streetAddress', indexHtml.includes('"streetAddress"'));
  check('has address.addressLocality', indexHtml.includes('"addressLocality": "Canberra"'));
  check('has address.addressRegion', indexHtml.includes('"addressRegion": "ACT"'));
  check('has address.postalCode', indexHtml.includes('"postalCode": "2601"'));
  check('has address.country', indexHtml.includes('"addressCountry": "AU"'));
  check('has geo.latitude', indexHtml.includes('"latitude"'));
  check('has geo.longitude', indexHtml.includes('"longitude"'));
  check('has areaServed (Canberra)', indexHtml.includes('"name": "Canberra"'));
  check('has areaServed (Braddon)', indexHtml.includes('"name": "Braddon"'));
  check('has areaServed (Kingston)', indexHtml.includes('"name": "Kingston"'));
  check('has openingHoursSpecification', indexHtml.includes('"openingHoursSpecification"'));
  check('has opens (07:00)', indexHtml.includes('"opens": "07:00"'));
  check('has closes (17:00)', indexHtml.includes('"closes": "17:00"'));
  check('has priceRange', indexHtml.includes('"priceRange"'));
  check('has hasOfferCatalog (services)', indexHtml.includes('"hasOfferCatalog"'));

  // --- 6. Service Catalog ---
  console.log('\nService Catalog (hasOfferCatalog)');
  check('has Pressure Washing service', indexHtml.includes('"name": "Pressure Washing"'));
  check('has Epoxy Regrouting service', indexHtml.includes('"name": "Epoxy Regrouting"'));
  check('has Garden Maintenance service', indexHtml.includes('"name": "Garden Maintenance"'));
  check('has Pool Maintenance service', indexHtml.includes('"name": "Pool Maintenance"'));
  check('has Rubbish Removal service', indexHtml.includes('"name": "Rubbish Removal"'));

  // Summary
  console.log('\n' + SEP);
  const total = passed + failed;
  console.log(`  Passed: ${passed}/${total}`);
  if (failed === 0) {
    console.log('\x1b[32m  All checks passed — site is ready for GBP setup!\x1b[0m');
  } else {
    console.log(`\x1b[31m  ${failed} check(s) failed\x1b[0m`);
  }
  console.log(SEP);

  console.log('\nManual Steps Required (complete these in order):');
  console.log('');
  console.log('  Task 4.1: Create Google Business Profile');
  console.log('    → https://business.google.com');
  console.log('    → Name: Revive Property Co.');
  console.log('    → Category: Property Maintenance (primary)');
  console.log('    → Additional: Pressure Washing Service, Pool Cleaning Service, Gardener');
  console.log('    → Address: 802/2 Marcus Clarke Street, Canberra ACT 2601');
  console.log('    → Service areas: Canberra, Braddon, Kingston, Griffith, Deakin, Hughes, Woden Valley, Yarralumla, O\'Connor');
  console.log('    → Phone: 02 8201 3710');
  console.log('    → Website: https://revivepropertyco.au');
  console.log('    → Hours: Mon–Fri 7:00am–5:00pm');
  console.log('');
  console.log('  Task 4.2: Verify Business');
  console.log('    → Complete Google\'s verification (postcard, phone, or email)');
  console.log('    → May take 1–2 weeks for postcard');
  console.log('');
  console.log('  Task 4.3: Optimise Profile');
  console.log('    → Upload 10+ high-quality photos (before/after, team, equipment)');
  console.log('    → Write keyword-rich description (750 chars max)');
  console.log('    → Add all services with descriptions');
  console.log('    → Enable messaging');
  console.log('');
  console.log('  Task 4.4: Set Up Review Collection Workflow ✓');
  console.log('    → Review page created at: https://revivepropertyco.au/review');
  console.log('    → Share link with customers after job completion');
  console.log('    → Target: 5+ reviews first month, 2+ per month ongoing');
  console.log('');
  console.log('  Task 4.5: Begin Google Posts');
  console.log('    → Post weekly updates (recent jobs, before/after, seasonal tips)');
  console.log('    → Use location tags and local hashtags');

  process.exit(failed > 0 ? 1 : 0);
}

main();
