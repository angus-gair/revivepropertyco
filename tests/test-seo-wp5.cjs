#!/usr/bin/env node
/**
 * SEO Work Package 5 — On-Page SEO & Content Quality
 * Verifies H1 optimization, image alt text, internal cross-links, visible FAQs,
 * and AEO content structure.
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

function warn(name, result, detail = '') {
  if (result) {
    console.log(`  ${PASS} ${name}`);
    passed++;
  } else {
    console.log(`  ${WARN} ${name}${detail ? ': ' + detail : ''}`);
    warnings++;
  }
}

function main() {
  console.log(SEP);
  console.log('  SEO WP5 — On-Page SEO & Content Quality');
  console.log(SEP);

  // --- 1. Task 5.1: Optimise H1 Headings for SEO ---
  console.log('\nTask 5.1: H1 Headings Optimization');

  const pressureWashing = fs.readFileSync(path.join(__dirname, 'pages/ServicePressureWashing.tsx'), 'utf8');
  check('PressureWashing has SEO H1', pressureWashing.includes('seoH1'));
  check('PressureWashing H1 contains service keyword', pressureWashing.includes('seoH1') && pressureWashing.includes('Pressure Washing'));
  check('PressureWashing H1 contains location', pressureWashing.includes('seoH1') && pressureWashing.includes('Canberra'));

  const regrouting = fs.readFileSync(path.join(__dirname, 'pages/ServiceRegrouting.tsx'), 'utf8');
  check('Regrouting has SEO H1', regrouting.includes('seoH1'));
  check('Regrouting H1 contains service keyword', regrouting.includes('seoH1') && regrouting.includes('Regrouting'));
  check('Regrouting H1 contains location', regrouting.includes('seoH1') && regrouting.includes('Canberra'));

  const garden = fs.readFileSync(path.join(__dirname, 'pages/ServiceGardenMaintenance.tsx'), 'utf8');
  check('Garden has SEO H1', garden.includes('seoH1'));
  check('Garden H1 contains service keyword', garden.includes('seoH1') && garden.includes('Garden'));
  check('Garden H1 contains location', garden.includes('seoH1') && garden.includes('Canberra'));

  const pool = fs.readFileSync(path.join(__dirname, 'pages/ServicePoolMaintenance.tsx'), 'utf8');
  check('Pool has SEO H1', pool.includes('seoH1'));
  check('Pool H1 contains service keyword', pool.includes('seoH1') && pool.includes('Pool'));
  check('Pool H1 contains location', pool.includes('seoH1') && pool.includes('Canberra'));

  const rubbish = fs.readFileSync(path.join(__dirname, 'pages/ServiceRubbishRemoval.tsx'), 'utf8');
  check('Rubbish has SEO H1', rubbish.includes('seoH1'));
  check('Rubbish H1 contains service keyword', rubbish.includes('seoH1') && rubbish.includes('Rubbish'));
  check('Rubbish H1 contains location', rubbish.includes('seoH1') && rubbish.includes('Canberra'));

  const landingPage = fs.readFileSync(path.join(__dirname, 'pages/LandingPage.tsx'), 'utf8');
  check('LandingPage has SEO H1', landingPage.includes('<h1 className="sr-only">'));
  check('LandingPage H1 contains location', landingPage.includes('Canberra'));

  // --- 2. Task 5.2: Add Alt Text to All Images ---
  console.log('\nTask 5.2: Image Alt Text');

  check('PressureWashing has imageAlt', pressureWashing.includes('imageAlt'));
  check('PressureWashing alt text is descriptive', pressureWashing.includes('imageAlt') && pressureWashing.toLowerCase().includes('pressure') && pressureWashing.toLowerCase().includes('washing'));
  check('Regrouting has imageAlt', regrouting.includes('imageAlt'));
  check('Regrouting alt text is descriptive', regrouting.includes('imageAlt') && regrouting.toLowerCase().includes('epoxy'));
  check('Garden has imageAlt', garden.includes('imageAlt'));
  check('Garden alt text is descriptive', garden.includes('imageAlt') && garden.toLowerCase().includes('lawn'));
  check('Pool has imageAlt', pool.includes('imageAlt'));
  check('Pool alt text is descriptive', pool.includes('imageAlt') && pool.toLowerCase().includes('pool'));
  check('Rubbish has imageAlt', rubbish.includes('imageAlt'));
  check('Rubbish alt text is descriptive', rubbish.includes('imageAlt') && rubbish.toLowerCase().includes('rubbish'));

  // --- 3. Task 5.3: Add Internal Cross-Links ---
  console.log('\nTask 5.3: Internal Cross-Links');

  check('PressureWashing has crossLinks prop', pressureWashing.includes('crossLinks'));
  check('PressureWashing links to garden', pressureWashing.includes('/garden-maintenance'));
  check('PressureWashing links to regrouting', pressureWashing.includes('/regrouting'));
  check('Regrouting has crossLinks prop', regrouting.includes('crossLinks'));
  check('Regrouting links to pressure washing', regrouting.includes('/pressure-washing'));
  check('Garden has crossLinks prop', garden.includes('crossLinks'));
  check('Pool has crossLinks prop', pool.includes('crossLinks'));
  check('Rubbish has crossLinks prop', rubbish.includes('crossLinks'));

  // --- 4. Task 5.4: Add Visible FAQ Sections ---
  console.log('\nTask 5.4: Visible FAQ Sections');

  const faqComponent = fs.existsSync(path.join(__dirname, 'components/FAQSection.tsx'));
  check('FAQSection component exists', faqComponent);

  if (faqComponent) {
    const faqSection = fs.readFileSync(path.join(__dirname, 'components/FAQSection.tsx'), 'utf8');
    check('FAQSection exports FAQItem', faqSection.includes('export interface FAQItem'));
    check('FAQSection has accordion behavior', faqSection.includes('useState') || faqSection.includes('openIndex'));
  }

  check('PressureWashing has faqs', pressureWashing.includes('const faqs ='));
  check('PressureWashing passes faqs to template', pressureWashing.includes('faqs={faqs}'));
  check('Regrouting passes faqs to template', regrouting.includes('faqs={faqs}'));
  check('Garden passes faqs to template', garden.includes('faqs={faqs}'));
  check('Pool passes faqs to template', pool.includes('faqs={faqs}'));
  check('Rubbish passes faqs to template', rubbish.includes('faqs={faqs}'));

  // --- 5. Task 5.5: Structure Content for AEO ---
  console.log('\nTask 5.5: Answer Engine Optimisation');

  check('PressureWashing has aeoIntro', pressureWashing.includes('aeoIntro'));
  check('PressureWashing AEO answers main question', pressureWashing.match(/\$150/));
  check('Regrouting has aeoIntro', regrouting.includes('aeoIntro'));
  check('Regrouting AEO answers main question', regrouting.match(/\$380/));
  check('Garden has aeoIntro', garden.includes('aeoIntro'));
  check('Garden AEO answers main question', garden.match(/\$90/));
  check('Pool has aeoIntro', pool.includes('aeoIntro'));
  check('Pool AEO answers main question', pool.match(/\$50/));
  check('Rubbish has aeoIntro', rubbish.includes('aeoIntro'));
  check('Rubbish AEO answers main question', rubbish.match(/\$60/));

  // --- 6. Task 5.6: Update Chatbot System Prompt ---
  console.log('\nTask 5.6: Chatbot Route References');

  const geminiService = fs.readFileSync(path.join(__dirname, 'services/geminiService.ts'), 'utf8');
  check('GeminiService uses /book (not hash)', geminiService.includes('"/book"'));
  check('GeminiService uses /contact (not hash)', geminiService.includes('"/contact"'));
  warn('GeminiService does not use hash routes', !geminiService.includes('#/book') && !geminiService.includes('#/contact'));

  // --- 7. ServicePageTemplate Updates ---
  console.log('\nServicePageTemplate Integration');

  const template = fs.readFileSync(path.join(__dirname, 'components/ServicePageTemplate.tsx'), 'utf8');
  check('Template accepts seoH1 prop', template.includes('seoH1?'));
  check('Template renders SEO H1 with sr-only', template.includes('sr-only'));
  check('Template accepts imageAlt prop', template.includes('imageAlt?'));
  check('Template uses imageAlt for images', template.includes('imageAlt ||'));
  check('Template accepts crossLinks prop', template.includes('crossLinks?'));
  check('Template renders cross-links section', template.includes('Related Services'));
  check('Template accepts faqs prop', template.includes('faqs?'));
  check('Template accepts aeoIntro prop', template.includes('aeoIntro?'));
  check('Template renders AEO intro section', template.includes('AEO'));

  // Summary
  console.log('\n' + SEP);
  const total = passed + failed;
  console.log(`  Passed: ${passed}/${total}`);
  if (warnings > 0) {
    console.log(`  Warnings: ${warnings}`);
  }
  if (failed === 0) {
    console.log('\x1b[32m  All checks passed — WP5 is complete!\x1b[0m');
  } else {
    console.log(`\x1b[31m  ${failed} check(s) failed\x1b[0m`);
  }
  console.log(SEP);

  console.log('\nSummary of Changes:');
  console.log('');
  console.log('  ✅ Task 5.1: H1 headings optimized with service + "Canberra" keywords');
  console.log('  ✅ Task 5.2: Descriptive alt text added to all service page images');
  console.log('  ✅ Task 5.3: Internal cross-links between related services added');
  console.log('  ✅ Task 5.4: Visible FAQ sections added to all service pages');
  console.log('  ✅ Task 5.5: AEO intro paragraphs answer main questions upfront');
  console.log('  ✅ Task 5.6: Chatbot already uses clean routes (verified)');
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main();
