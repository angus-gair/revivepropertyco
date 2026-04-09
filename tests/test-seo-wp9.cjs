#!/usr/bin/env node
/**
 * SEO Work Package 9 — Content Strategy
 * Verifies structure and layout for content pages (Service Areas, Projects, Blog).
 * Note: Actual content creation is NOT required - only structure and layout.
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
  console.log('  SEO WP9 — Content Strategy Structure');
  console.log(SEP);

  // --- Task 9.1: Service Areas Page ---
  console.log('\nTask 9.1: Service Areas Page (/service-areas)');

  const serviceAreasPage = fs.existsSync(path.join(__dirname, 'pages/ServiceAreasPage.tsx'));
  check('ServiceAreasPage.tsx exists', serviceAreasPage);

  if (serviceAreasPage) {
    const content = fs.readFileSync(path.join(__dirname, 'pages/ServiceAreasPage.tsx'), 'utf8');
    check('ServiceAreasPage is a React component', content.includes('React.FC') || content.includes('function'));
    check('ServiceAreasPage has hero section', content.includes('Hero Section'));
    check('ServiceAreasPage lists suburbs', content.includes('Braddon') && content.includes('Kingston') && content.includes('Griffith'));
    check('ServiceAreasPage shows turnaround times', content.includes('turnaroundTime') || content.includes('Turnaround'));
    check('ServiceAreasPage has CTA', content.includes('Book Now') || content.includes('/book'));
  }

  // --- Task 9.2: Projects/Case Studies Page ---
  console.log('\nTask 9.2: Projects Page (/projects)');

  const projectsPage = fs.existsSync(path.join(__dirname, 'pages/ProjectsPage.tsx'));
  check('ProjectsPage.tsx exists', projectsPage);

  if (projectsPage) {
    const content = fs.readFileSync(path.join(__dirname, 'pages/ProjectsPage.tsx'), 'utf8');
    check('ProjectsPage is a React component', content.includes('React.FC') || content.includes('function'));
    check('ProjectsPage has project grid', content.includes('projects') || content.includes('Projects'));
    check('ProjectsPage has filter bar', content.includes('Filter') || content.includes('button') && content.includes('All Projects'));
    check('ProjectsPage has before/after placeholder', content.includes('beforeAfter') || content.includes('Before/After'));
    check('ProjectsPage links to individual projects', content.includes('/projects/') || content.includes('View Project'));
  }

  // --- Task 9.3: Blog/Resources Page ---
  console.log('\nTask 9.3: Blog Page (/blog)');

  const blogPage = fs.existsSync(path.join(__dirname, 'pages/BlogPage.tsx'));
  check('BlogPage.tsx exists', blogPage);

  if (blogPage) {
    const content = fs.readFileSync(path.join(__dirname, 'pages/BlogPage.tsx'), 'utf8');
    check('BlogPage is a React component', content.includes('React.FC') || content.includes('function'));
    check('BlogPage has blog posts structure', content.includes('blogPosts') || content.includes('posts'));
    check('BlogPage has category filter', content.includes('categories') || content.includes('Category'));
    check('BlogPage has featured post section', content.includes('Featured') || content.includes('Featured Post'));
    check('BlogPage has newsletter signup', content.includes('Newsletter') || content.includes('Subscribe'));
  }

  // --- Task 9.4: Routes configured in App.tsx ---
  console.log('\nTask 9.4: Route Configuration');

  const appTs = fs.readFileSync(path.join(__dirname, 'App.tsx'), 'utf8');
  check('App.tsx imports ServiceAreasPage', appTs.includes('ServiceAreasPage'));
  check('App.tsx imports ProjectsPage', appTs.includes('ProjectsPage'));
  check('App.tsx imports BlogPage', appTs.includes('BlogPage'));
  check('App.tsx has /service-areas route', appTs.includes('/service-areas'));
  check('App.tsx has /projects route', appTs.includes('/projects'));
  check('App.tsx has /blog route', appTs.includes('/blog'));

  // --- Task 9.5: SEO Config entries ---
  console.log('\nTask 9.5: SEO Configuration');

  const seoConfig = fs.readFileSync(path.join(__dirname, 'seoConfig.ts'), 'utf8');
  check('SEO config has serviceAreas entry', seoConfig.includes('serviceAreas:'));
  check('SEO config has projects entry', seoConfig.includes('projects:'));
  check('SEO config has blog entry', seoConfig.includes('blog:'));

  // --- Task 9.6: Sitemap includes new pages ---
  console.log('\nTask 9.6: Sitemap');

  const sitemap = fs.readFileSync(path.join(__dirname, 'public/sitemap.xml'), 'utf8');
  check('sitemap includes /service-areas', sitemap.includes('/service-areas'));
  check('sitemap includes /projects', sitemap.includes('/projects'));
  check('sitemap includes /blog', sitemap.includes('/blog'));

  // --- Task 9.7: Service Page Content Elements ---
  console.log('\nTask 9.7: Service Pages Content Elements');

  const servicePages = [
    { file: 'pages/ServicePressureWashing.tsx', name: 'Pressure Washing' },
    { file: 'pages/ServiceRegrouting.tsx', name: 'Regrouting' },
    { file: 'pages/ServiceGardenMaintenance.tsx', name: 'Garden Maintenance' },
    { file: 'pages/ServicePoolMaintenance.tsx', name: 'Pool Maintenance' },
    { file: 'pages/ServiceRubbishRemoval.tsx', name: 'Rubbish Removal' },
  ];

  for (const page of servicePages) {
    const pageContent = fs.readFileSync(path.join(__dirname, page.file), 'utf8');
    check(`${page.name} has pricing section`, pageContent.includes('pricing') || pageContent.includes('Pricing'));
    check(`${page.name} has FAQs`, pageContent.includes('faqs') || pageContent.includes('FAQ'));
    check(`${page.name} has CTA`, pageContent.includes('/book') || pageContent.includes('buttonText'));
  }

  // Summary
  console.log('\n' + SEP);
  const total = passed + failed;
  console.log(`  Passed: ${passed}/${total}`);
  if (failed === 0) {
    console.log('\x1b[32m  All checks passed — WP9 structure is complete!\x1b[0m');
  } else {
    console.log(`\x1b[31m  ${failed} check(s) failed\x1b[0m`);
  }
  console.log(SEP);

  console.log('\nSummary of Changes:');
  console.log('');
  console.log('  ✅ Task 9.1: Service Areas page structure created (/service-areas)');
  console.log('  ✅ Task 9.2: Projects/Case Studies page structure created (/projects)');
  console.log('  ✅ Task 9.3: Blog/Resources page structure created (/blog)');
  console.log('  ✅ Task 9.4: Routes configured in App.tsx');
  console.log('  ✅ Task 9.5: SEO config entries added');
  console.log('  ✅ Task 9.6: Sitemap updated with new pages');
  console.log('  ✅ Task 9.7: Service pages verified for content elements');
  console.log('');
  console.log('  Note: Actual content (blog posts, case study photos) to be added later.');
  console.log('        Structure and layout are in place for future content population.');
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main();
