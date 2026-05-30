require('dotenv').config();
const { chromium } = require('playwright');
const dbWriter = require('./db-writer');

// Trades to scrape from hipages directory
const TRADES = [
  'plumber', 'electrician', 'builder', 'painter', 'handyman',
  'carpenter', 'tiler', 'landscaper', 'cleaner', 'pest-control',
  'air-conditioning', 'locksmith', 'removalist', 'gardener',
  'plasterer', 'concreter', 'roofer', 'fencer'
];

const CONFIG = {
  headless: process.env.HEADLESS === 'true' || process.env.NODE_ENV === 'production',
  timeout: 60000,
  baseUrl: 'https://www.hipages.com.au',
  maxPagesPerTrade: parseInt(process.env.MAX_PAGES_PER_TRADE || '3'),
  location: process.env.SCRAPE_LOCATION || 'sydney-nsw',
};

/**
 * Parse a business listing from a hipages directory result card.
 * Handles multiple possible HTML structures hipages uses.
 */
async function parseBusinessCard(card) {
  try {
    const biz = {};

    // Business name
    const nameEl = await card.$('[data-testid="card-title"], h2, .business-name, [class*="title"]');
    if (nameEl) biz.business_name = (await nameEl.innerText()).trim();
    if (!biz.business_name) return null;

    // Rating
    const ratingEl = await card.$('[data-testid="rating-value"], [class*="rating"], [aria-label*="star"]');
    if (ratingEl) {
      const ratingText = await ratingEl.innerText();
      const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
      if (ratingMatch) biz.rating = parseFloat(ratingMatch[1]);
    }

    // Review count
    const reviewEl = await card.$('[data-testid="review-count"], [class*="review"]');
    if (reviewEl) {
      const reviewText = await reviewEl.innerText();
      const countMatch = reviewText.match(/(\d+)/);
      if (countMatch) biz.review_count = parseInt(countMatch[1]);
    }

    // Location
    const locationEl = await card.$('[data-testid="location"], [class*="location"], [class*="suburb"]');
    if (locationEl) {
      const locationText = (await locationEl.innerText()).trim();
      // Parse "Suburb, STATE 1234" format
      const locMatch = locationText.match(/^(.+),\s*([A-Z]{2,3})\s*(\d{4})?$/);
      if (locMatch) {
        biz.suburb = locMatch[1].trim();
        biz.state = locMatch[2].trim();
        biz.postcode = locMatch[3] || null;
      } else {
        biz.suburb = locationText;
      }
    }

    // Profile URL
    const linkEl = await card.$('a[href*="hipages.com.au"]');
    if (!linkEl) {
      const anyLink = await card.$('a');
      if (anyLink) {
        const href = await anyLink.getAttribute('href');
        if (href) biz.profile_url = href.startsWith('http') ? href : CONFIG.baseUrl + href;
      }
    } else {
      biz.profile_url = await linkEl.getAttribute('href');
    }

    // Extract slug from profile URL
    if (biz.profile_url) {
      const slugMatch = biz.profile_url.match(/hipages\.com\.au\/([^?#]+)/);
      if (slugMatch) biz.slug = slugMatch[1].replace(/\/$/, '');
      // Use slug as unique identifier
      biz.hipages_profile_id = biz.slug || biz.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // Verification badge
    const verifiedEl = await card.$('[class*="verified"], [data-testid*="verified"], [aria-label*="erified"]');
    biz.verified = !!verifiedEl;

    // Badge level (Gold, Platinum etc)
    const badgeEl = await card.$('[class*="badge"], [class*="tier"], [data-testid*="badge"]');
    if (badgeEl) {
      const badgeText = (await badgeEl.innerText()).trim();
      if (badgeText) biz.badge_level = badgeText;
    }

    // Job count
    const jobsEl = await card.$('[class*="job"], [data-testid*="job"]');
    if (jobsEl) {
      const jobsText = await jobsEl.innerText();
      const jobMatch = jobsText.match(/(\d+)/);
      if (jobMatch) biz.job_count = parseInt(jobMatch[1]);
    }

    // Years on hipages
    const yearsEl = await card.$('[class*="year"], [data-testid*="year"]');
    if (yearsEl) {
      const yearsText = await yearsEl.innerText();
      const yearsMatch = yearsText.match(/(\d+)/);
      if (yearsMatch) biz.years_on_hipages = parseInt(yearsMatch[1]);
    }

    return biz;
  } catch (err) {
    console.warn('[scraper] Error parsing card:', err.message);
    return null;
  }
}

async function scrapeTradeCategory(page, trade, location) {
  const url = `${CONFIG.baseUrl}/find/${trade}/${location}`;
  const businesses = [];

  console.log(`[scraper] Scraping: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: CONFIG.timeout });

    // Wait for results to load
    await page.waitForTimeout(2000);

    // Try multiple pages
    for (let pageNum = 1; pageNum <= CONFIG.maxPagesPerTrade; pageNum++) {
      if (pageNum > 1) {
        // Try to go to next page
        const nextBtn = await page.$('[aria-label="Next page"], [data-testid="next-page"], button:has-text("Next")');
        if (!nextBtn) break;
        await nextBtn.click();
        await page.waitForTimeout(2000);
      }

      // Find business cards using multiple possible selectors
      const cards = await page.$$([
        '[data-testid="tradesperson-card"]',
        '[class*="TradespersonCard"]',
        '[class*="business-card"]',
        'article[class*="card"]',
        '[data-testid="search-result-card"]',
        '.search-result-item'
      ].join(', '));

      console.log(`[scraper] Found ${cards.length} cards on page ${pageNum} for ${trade}/${location}`);

      if (cards.length === 0) {
        // Try extracting from the full page text as fallback
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log(`[scraper] No cards found, page text length: ${pageText.length}`);
        break;
      }

      for (const card of cards) {
        const biz = await parseBusinessCard(card);
        if (biz && biz.business_name) {
          biz.primary_trade = trade.replace(/-/g, ' ');
          businesses.push(biz);
        }
      }
    }
  } catch (err) {
    console.error(`[scraper] Error scraping ${trade}/${location}:`, err.message);
  }

  return businesses;
}

async function runScrape() {
  console.log('[scraper] Starting hipages business directory scrape');

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const allBusinesses = [];

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    const tradesToScrape = process.argv.includes('--test') ? TRADES.slice(0, 2) : TRADES;

    for (const trade of tradesToScrape) {
      const sessionId = await dbWriter.createSession(trade, CONFIG.location);

      try {
        const businesses = await scrapeTradeCategory(page, trade, CONFIG.location);
        allBusinesses.push(...businesses);

        if (businesses.length > 0) {
          const result = await dbWriter.saveBusinesses(businesses);
          await dbWriter.completeSession(sessionId, {
            found: businesses.length,
            new: result.saved,
            updated: result.updated
          });
        } else {
          await dbWriter.completeSession(sessionId, { found: 0, new: 0, updated: 0 });
        }

        // Polite delay between trades
        await new Promise(r => setTimeout(r, 3000));
      } catch (err) {
        await dbWriter.completeSession(sessionId, {}, err.message);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`[scraper] Complete. Total businesses found: ${allBusinesses.length}`);
  return allBusinesses;
}

module.exports = { runScrape };

if (require.main === module) {
  runScrape().then(() => process.exit(0)).catch(err => {
    console.error('[scraper] Fatal error:', err);
    process.exit(1);
  });
}
