#!/usr/bin/env node
/**
 * Work Package 2 — SEO Metadata & Structured Data Test
 * Validates that the built index.html contains all required meta tags and JSON-LD.
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

// Read built index.html
const distIndex = path.join(__dirname, 'dist', 'index.html');
if (!fs.existsSync(distIndex)) {
  console.error('dist/index.html not found — run npm run build first');
  process.exit(1);
}
const html = fs.readFileSync(distIndex, 'utf-8');

console.log(`\n${HEAD}═══════════════════════════════════════════${RST}`);
console.log(`${HEAD}  Work Package 2 — Metadata & Structured Data${RST}`);
console.log(`${HEAD}═══════════════════════════════════════════${RST}\n`);

// --- Task 2.1 / 2.2: Title & Meta Description ---
console.log('Task 2.1/2.2 — Title & Meta Description');
check('Has <title> tag',                             html.includes('<title>'));
check('Title contains "Canberra"',                   html.includes('Canberra'));
check('Has meta[name="description"]',               html.includes('name="description"'));
check('Description mentions property maintenance',  html.includes('property maintenance'));

// --- Task 2.3: Canonical tag ---
console.log('\nTask 2.3 — Canonical URL');
check('Has <link rel="canonical">',                 html.includes('rel="canonical"'));
check('Canonical points to revivepropertyco.au',    html.includes('https://revivepropertyco.au'));

// --- Task 2.4: Open Graph + Twitter ---
console.log('\nTask 2.4 — Open Graph & Twitter Card');
check('Has og:title',     html.includes('property="og:title"'));
check('Has og:description', html.includes('property="og:description"'));
check('Has og:url',       html.includes('property="og:url"'));
check('Has og:image',     html.includes('property="og:image"'));
check('Has og:locale (en_AU)', html.includes('en_AU'));
check('Has og:site_name', html.includes('Revive Property Co.'));
check('Has twitter:card', html.includes('twitter:card'));
check('Has twitter:title', html.includes('twitter:title'));

// --- Task 2.6: JSON-LD LocalBusiness ---
console.log('\nTask 2.6 — JSON-LD LocalBusiness Schema');
check('Has application/ld+json script',             html.includes('application/ld+json'));
check('LocalBusiness type present',                 html.includes('"LocalBusiness"'));
check('Organization type present',                  html.includes('"Organization"'));
check('Business name in schema',                    html.includes('"Revive Property Co."'));
check('Phone number in schema',                     html.includes('+61282013710'));
check('Address in schema',                          html.includes('Marcus Clarke Street'));
check('areaServed in schema',                       html.includes('areaServed'));
check('Opening hours in schema',                    html.includes('OpeningHoursSpecification'));

// --- Task 2.9: Geo meta tags ---
console.log('\nTask 2.9 — Geo Meta Tags');
check('Has geo.region (AU-ACT)',   html.includes('AU-ACT'));
check('Has geo.placename',        html.includes('geo.placename'));
check('Has geo.position',         html.includes('geo.position'));
check('Has ICBM',                 html.includes('ICBM'));
check('Coordinates present',      html.includes('-35.2802'));

// --- Source files: hooks exist ---
console.log('\nSource file checks');
const usePageSEO = path.join(__dirname, 'hooks', 'usePageSEO.ts');
const seoConfig  = path.join(__dirname, 'seoConfig.ts');
const seoSchemas = path.join(__dirname, 'components', 'SEOSchemas.tsx');
check('hooks/usePageSEO.ts exists',      fs.existsSync(usePageSEO));
check('seoConfig.ts exists',            fs.existsSync(seoConfig));
check('components/SEOSchemas.tsx exists', fs.existsSync(seoSchemas));

// --- Page files use usePageSEO ---
console.log('\nPage integration checks');
const pages = [
  ['pages/LandingPage.tsx',            'SEO.home'],
  ['pages/ServicePressureWashing.tsx', 'SEO.pressureWashing'],
  ['pages/ServiceRegrouting.tsx',      'SEO.regrouting'],
  ['pages/ServiceGardenMaintenance.tsx', 'SEO.gardenMaintenance'],
  ['pages/ServicePoolMaintenance.tsx', 'SEO.poolMaintenance'],
  ['pages/ServiceRubbishRemoval.tsx',  'SEO.rubbishRemoval'],
  ['pages/BookingPage.tsx',            'SEO.book'],
  ['pages/ContactPage.tsx',            'SEO.contact'],
  ['pages/SuccessPage.tsx',            'SEO.success'],
];
for (const [file, seoKey] of pages) {
  const fp = path.join(__dirname, file);
  if (!fs.existsSync(fp)) { check(`${file} exists`, false); continue; }
  const content = fs.readFileSync(fp, 'utf-8');
  check(`${file} uses ${seoKey}`, content.includes(seoKey));
}

// --- Service pages have schemas ---
console.log('\nService page schema checks');
const servicePages = [
  'pages/ServicePressureWashing.tsx',
  'pages/ServiceRegrouting.tsx',
  'pages/ServiceGardenMaintenance.tsx',
  'pages/ServicePoolMaintenance.tsx',
  'pages/ServiceRubbishRemoval.tsx',
];
for (const file of servicePages) {
  const fp = path.join(__dirname, file);
  const content = fs.readFileSync(fp, 'utf-8');
  check(`${file} has FAQSchema`,     content.includes('FAQSchema'));
  check(`${file} has ServiceSchema`, content.includes('ServiceSchema'));
}

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
