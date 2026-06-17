#!/usr/bin/env node
/**
 * SEO Work Package 3 — Google Search Console & Indexing
 * Verifies all automatable prerequisites for GSC submission.
 * Manual steps (3.1–3.5) are documented at the end.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://revivepropertyco.au';
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

function fetchUrl(url, followRedirects = true) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', () => resolve({ status: 0, headers: {}, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, headers: {}, body: '' }); });
  });
}

async function main() {
  console.log(SEP);
  console.log('  SEO WP3 — GSC Prerequisites Check');
  console.log(SEP);

  // --- 1. Sitemap.xml ---
  console.log('\nSitemap.xml');
  const sitemap = await fetchUrl(`${BASE_URL}/sitemap.xml`);
  check('sitemap.xml returns 200', sitemap.status === 200);
  check('sitemap.xml is XML content-type', (sitemap.headers['content-type'] || '').includes('xml'));
  check('sitemap.xml has urlset element', sitemap.body.includes('<urlset'));
  check('sitemap.xml has homepage URL', sitemap.body.includes(`${BASE_URL}/`));
  check('sitemap.xml has pressure-washing URL', sitemap.body.includes('/pressure-washing'));
  check('sitemap.xml has regrouting URL', sitemap.body.includes('/regrouting'));
  check('sitemap.xml has garden-maintenance URL', sitemap.body.includes('/garden-maintenance'));
  check('sitemap.xml has pool-maintenance URL', sitemap.body.includes('/pool-maintenance'));
  check('sitemap.xml has rubbish-removal URL', sitemap.body.includes('/rubbish-removal'));
  check('sitemap.xml has contact URL', sitemap.body.includes('/contact'));
  check('sitemap.xml has book URL', sitemap.body.includes('/book'));
  check('sitemap.xml does NOT include admin routes', !sitemap.body.includes('/admin'));
  check('sitemap.xml does NOT include login', !sitemap.body.includes('/login'));
  check('sitemap.xml does NOT include session', !sitemap.body.includes('/session'));

  // --- 2. robots.txt ---
  console.log('\nrobots.txt');
  const robots = await fetchUrl(`${BASE_URL}/robots.txt`);
  check('robots.txt returns 200', robots.status === 200);
  check('robots.txt is text/plain', (robots.headers['content-type'] || '').includes('text/plain'));
  check('robots.txt has Sitemap declaration', robots.body.includes('Sitemap:'));
  check('robots.txt sitemap points to correct URL', robots.body.includes(`${BASE_URL}/sitemap.xml`));
  check('robots.txt disallows /admin', robots.body.includes('Disallow: /admin'));
  check('robots.txt disallows /login', robots.body.includes('Disallow: /login'));
  check('robots.txt allows Googlebot', robots.body.includes('Allow: /'));

  // --- 3. Key pages return 200 ---
  console.log('\nKey pages (all must return 200)');
  const pages = ['/', '/pressure-washing', '/regrouting', '/garden-maintenance',
    '/pool-maintenance', '/rubbish-removal', '/contact', '/book'];
  for (const p of pages) {
    const r = await fetchUrl(`${BASE_URL}${p}`);
    check(`${p} returns 200`, r.status === 200);
  }

  // --- 4. www → apex redirect ---
  console.log('\nwww redirect');
  const wwwRes = await fetchUrl('https://www.revivepropertyco.au/', false);
  check('www. returns 301', wwwRes.status === 301);
  check('www. redirects to apex', (wwwRes.headers['location'] || '').includes('revivepropertyco.au'));

  // --- 5. index.html has canonical ---
  console.log('\nindex.html canonical & OG');
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  check('index.html has canonical link', indexHtml.includes('rel="canonical"'));
  check('index.html has og:url', indexHtml.includes('og:url'));
  check('index.html has og:image', indexHtml.includes('og:image'));
  check('index.html has og:title', indexHtml.includes('og:title'));
  check('index.html has og:description', indexHtml.includes('og:description'));
  check('index.html has LocalBusiness JSON-LD', indexHtml.includes('"LocalBusiness"'));
  check('index.html has geo.region meta', indexHtml.includes('geo.region'));

  // --- 6. BrowserRouter (not HashRouter) ---
  console.log('\nRouting');
  const appTsx = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
  check('App.tsx uses BrowserRouter (not HashRouter)', appTsx.includes('BrowserRouter') && !appTsx.includes('HashRouter'));

  // Summary
  console.log('\n' + SEP);
  const total = passed + failed;
  console.log(`  Passed: ${passed}/${total}`);
  if (failed === 0) {
    console.log('\x1b[32m  All checks passed — site is ready for GSC submission!\x1b[0m');
  } else {
    console.log(`\x1b[31m  ${failed} check(s) failed — fix before submitting to GSC\x1b[0m`);
  }
  console.log(SEP);

  if (failed > 0) {
    console.log('\nManual Steps Required (after all checks pass):');
    console.log('');
    console.log('  Task 3.1: Create GSC property');
    console.log('    → https://search.google.com/search-console');
    console.log('    → Add property: URL prefix → https://revivepropertyco.au');
    console.log('');
    console.log('  Task 3.2: Verify via DNS TXT record');
    console.log('    → GSC will show a TXT record like: google-site-verification=XXXX');
    console.log('    → Add it to Cloudflare DNS for revivepropertyco.au');
    console.log('');
    console.log('  Task 3.3: Submit sitemap');
    console.log('    → GSC → Sitemaps → Add: sitemap.xml');
    console.log('    → Expected status: Success');
    console.log('');
    console.log('  Task 3.4: Request indexing for key pages');
    console.log('    → GSC → URL Inspection → enter each URL → Request Indexing');
    console.log('    → Pages: /, /pressure-washing, /regrouting, /garden-maintenance,');
    console.log('             /pool-maintenance, /rubbish-removal, /contact, /book');
    console.log('');
    console.log('  Task 3.5: Bing Webmaster Tools');
    console.log('    → https://www.bing.com/webmasters');
    console.log('    → Import from Google Search Console');
  } else {
    console.log('\nManual Steps Required (complete these in order):');
    console.log('');
    console.log('  Task 3.1: Create GSC property');
    console.log('    → https://search.google.com/search-console');
    console.log('    → Add property: URL prefix → https://revivepropertyco.au');
    console.log('');
    console.log('  Task 3.2: Verify via DNS TXT record');
    console.log('    → GSC will show: google-site-verification=XXXX');
    console.log('    → Add TXT record to Cloudflare DNS for revivepropertyco.au');
    console.log('    → Click Verify in GSC');
    console.log('');
    console.log('  Task 3.3: Submit sitemap');
    console.log('    → GSC → Sitemaps → enter: sitemap.xml → Submit');
    console.log('');
    console.log('  Task 3.4: Request indexing for key pages');
    console.log('    → GSC → URL Inspection → each URL below → Request Indexing:');
    console.log('       https://revivepropertyco.au/');
    console.log('       https://revivepropertyco.au/pressure-washing');
    console.log('       https://revivepropertyco.au/regrouting');
    console.log('       https://revivepropertyco.au/garden-maintenance');
    console.log('       https://revivepropertyco.au/pool-maintenance');
    console.log('       https://revivepropertyco.au/rubbish-removal');
    console.log('       https://revivepropertyco.au/contact');
    console.log('       https://revivepropertyco.au/book');
    console.log('');
    console.log('  Task 3.5: Bing Webmaster Tools');
    console.log('    → https://www.bing.com/webmasters');
    console.log('    → Sign in → Import from Google Search Console');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
