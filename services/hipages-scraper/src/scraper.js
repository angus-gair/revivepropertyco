require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const dbWriter = require('./db-writer.js');
const { ensureAuthenticated } = require('./lib/hipages-login.js');

const CONFIG = {
  leadsUrl: 'https://business.hipages.com.au/leads',
  jobsUrl:  'https://business.hipages.com.au/jobs',
  headless: process.env.HIPAGES_HEADLESS !== 'false',
  timeout:  60000,
};

const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '../output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Keep only the N most recent debug HTML files to prevent disk fill
function pruneDebugFiles(dir, prefix, keep = 3) {
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.html'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    files.slice(keep).forEach(f => {
      try { fs.unlinkSync(path.join(dir, f.name)); } catch {}
    });
  } catch {}
}

// Remove login poll screenshots (they're only useful during active debugging)
function cleanLoginScreenshots(dir) {
  try {
    fs.readdirSync(dir)
      .filter(f => f.startsWith('login-poll-'))
      .forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch {} });
  } catch {}
}

/**
 * Parse leads from page text content.
 */
function parseLeadsFromText(pageText, pageHtml = null) {
  const leads = [];

  let phoneNumbers = [];
  if (pageHtml) {
    phoneNumbers = pageHtml.match(/0[45]\d{8}/g) || [];
    const textPhones = pageText.match(/0[45]\d{8}/g) || [];
    phoneNumbers = [...new Set([...phoneNumbers, ...textPhones])];
  }

  const creditPattern = /(\d+)\s+credits/g;
  const leadBlocks = pageText.split(creditPattern);

  for (let i = 0; i < leadBlocks.length - 1; i += 2) {
    const block = leadBlocks[i];
    const credits = leadBlocks[i + 1];

    if (!block || !credits || !block.trim()) continue;

    try {
      const lead = {
        credits: parseInt(credits) || 0,
        raw_block: block.trim().substring(0, 500),
      };

      const nameMatch = block.match(/^([A-Z])\n([A-Z][a-z]+)/m);
      if (nameMatch) {
        lead.initial = nameMatch[1];
        lead.customer_name = nameMatch[2];
      }

      const dateMatch = block.match(/(\d{1,2}(?:st|nd|rd|th)\s+\w+\s+\d{4}\s*-\s*\d+:\d+\s*(?:am|pm))/i);
      if (dateMatch) lead.posted_date = dateMatch[1];

      const statusMatch = block.match(/(Available|First to accept|Waitlist)/);
      if (statusMatch) lead.status = statusMatch[1];

      const locationMatch = block.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*\d{4})/);
      if (locationMatch) {
        lead.location = locationMatch[1];
        const [suburb, postcode] = locationMatch[1].split(',');
        lead.suburb = suburb?.trim();
        lead.postcode = postcode?.trim();
      }

      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      for (const line of lines) {
        if (line === lead.initial || line === lead.customer_name) continue;
        if (line.match(/^(Start By|Contact Details|Contact details|Job Description|Residential or commercial|Type of work|Amount of work|Accept|Decline)/i)) break;
        if (
          line.length > 2 && line.length < 50 &&
          !line.match(/^\d/) &&
          !line.match(/,?\s*\d{4}/) &&
          !line.match(/(\d{1,2})(th|st|nd|rd)/i) &&
          !line.match(/:/) &&
          !line.match(/^(Available|First to accept|Waitlist|Supplied|Not supplied)/i) &&
          !line.match(/^(Residential|Commercial)/) &&
          !line.match(/^(Save on|Explore|Settings|Mobile)/)
        ) {
          lead.job_type = line;
          break;
        }
      }

      if (!lead.job_type) {
        const jobTypeMatch = block.match(/(?:Handyman|Garden Maintenance|Gardeners|Plumber|Electrician|Carpenter|Painter|Cleaner|Landscaper|Locksmith|Tiler|Roofer|Builder|Decorator|Flooring|Air Conditioning|Welder|Glazier|Bricklayer|Concreter|Excavator|Demolition|Insulation|Security|Appliance Repair|Door Installer|Furniture Assembly|Lawn Mowing|Odd Jobs|Brick Cleaning|Garden Rubbish Removal|Mirror & Picture Hanging|Garden Clean Up|Rubbish Disposal|Garden Pruning & Trimming|Basic Tiling|Basic Plastering|Basic Carpentry|Basic Concreting|Basic Garden Jobs)(?:\s*-\s*([\w\s]+))?/i);
        if (jobTypeMatch) {
          lead.job_type = jobTypeMatch[1];
          if (jobTypeMatch[2]) lead.job_subtype = jobTypeMatch[2].trim();
        }
      }

      const startByMatch = block.match(/Start By\s*\n\s*([^\n]+)/);
      if (startByMatch) lead.start_by = startByMatch[1].trim();

      const contactMatch = block.match(/Contact (?:details?:|Detail:)\s*(Supplied|Not supplied|Phone number verified|Email address verified)/i);
      if (contactMatch) lead.contact_status = contactMatch[1];

      const descMatch = block.match(/Job Description\s*\n\s*([\s\S]*?)(?=\n\s*(?:Residential|Commercial)|$)/);
      if (descMatch) lead.description = descMatch[1].trim();

      const attachmentMatch = block.match(/(\d+)\s+Attachments?/);
      if (attachmentMatch) lead.attachment_count = parseInt(attachmentMatch[1]);

      const hasValidName     = lead.customer_name && lead.customer_name.length > 1;
      const hasValidLocation = lead.location && lead.location.match(/\d{4}/);
      const hasValidJobType  = lead.job_type && !lead.job_type.match(/^(Leads|Jobs|All leads|Waitlist|Settings|Explore)/i);

      if (hasValidName || (hasValidJobType && hasValidLocation)) {
        leads.push(lead);
      } else if (lead.raw_block) {
        console.log(`⚠️  Skipping invalid lead: ${lead.customer_name || lead.job_type || 'unknown'} | ${lead.location || 'no location'}`);
      }
    } catch (e) {
      console.log(`⚠️  Error parsing lead block: ${e.message}`);
    }
  }

  if (phoneNumbers.length > 0) {
    let phoneIndex = 0;
    leads.forEach(lead => {
      if (lead.contact_status && lead.contact_status.includes('verified') && phoneIndex < phoneNumbers.length) {
        lead.phone = phoneNumbers[phoneIndex++];
      }
    });
  }

  return { leads, phoneNumbers };
}

/**
 * Scrape hipages leads and jobs pages.
 * Returns saved/updated counts. Does NOT trigger CRM sync (scheduler handles that).
 */
async function runScrape() {
  console.log('[scraper] Starting hipages scrape...');

  const browser = await chromium.launch({ headless: CONFIG.headless });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    await ensureAuthenticated(page, context);

    // Clean up login screenshots after successful auth
    cleanLoginScreenshots(OUTPUT_DIR);

    const allLeads = [];

    async function scrapePage(url, pageName) {
      console.log(`[scraper] Scraping ${pageName} page...`);

      if (page.url() !== url) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
      }
      await page.waitForTimeout(3000);

      const pageData = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        allText: document.body?.innerText || '',
      }));

      const pageHtml = await page.content();

      if (pageName === 'leads') {
        const debugFile = path.join(OUTPUT_DIR, `debug-${Date.now()}.html`);
        fs.writeFileSync(debugFile, pageHtml);
        console.log('[scraper] Saved HTML for debugging');
        pruneDebugFiles(OUTPUT_DIR, 'debug-', 3);
      }

      // Extract images from DOM (best-effort; falls back to HTML scan below)
      const leadsWithImages = await page.evaluate(() => {
        const leads = [];
        const leadContainers = document.querySelectorAll('[data-testid*="lead"], .lead-card, [class*="lead"], [class*="Lead"]');
        console.log(`Found ${leadContainers.length} lead containers`);
        leadContainers.forEach(container => {
          try {
            const nameEl = container.querySelector('[class*="name"], [class*="customer"], [class*="Name"]');
            const name = nameEl?.textContent?.trim() || '';
            const images = [];
            container.querySelectorAll('img[src*="hipages"], img[src*="attachment"]').forEach(img => {
              const src = img.getAttribute('src');
              if (src && (src.includes('hipages.com.au') || src.includes('hipagesusercontent.com'))) images.push(src);
            });
            container.querySelectorAll('*[style*="background-image"]').forEach(el => {
              const urlMatch = el.getAttribute('style')?.match(/url\(['"]?([^'")\s]+)['"]?\)/);
              if (urlMatch?.[1]) {
                const url = urlMatch[1];
                if (url.includes('hipages.com.au') || url.includes('hipagesusercontent.com')) images.push(url);
              }
            });
            if (name && images.length > 0) leads.push({ name, images: [...new Set(images)] });
          } catch {}
        });
        return { leads, totalContainers: leadContainers.length };
      });

      console.log(`[scraper] ${pageName} page title: ${pageData.title}`);
      console.log(`[scraper] Extracted ${leadsWithImages.leads.length} leads with images from DOM (out of ${leadsWithImages.totalContainers} containers)`);

      const { leads, phoneNumbers } = parseLeadsFromText(pageData.allText, pageHtml);

      const allPageImages = [
        ...(pageHtml.match(/https:\/\/attachments\.hipagesusercontent\.com\/[a-zA-Z0-9\/_-]+/gi) || []),
        ...(pageHtml.match(/https:\/\/img\.hipages\.com\.au\/[^"<>]+/gi) || []),
      ];
      const uniqueImages = [...new Set(allPageImages)];
      console.log(`[scraper] Found ${uniqueImages.length} hipages image URLs in page HTML`);

      let imageIndex = 0;
      leads.forEach(lead => {
        const matchingLead = leadsWithImages.leads.find(d =>
          d.name === lead.customer_name ||
          d.name.includes(lead.customer_name || '') ||
          (lead.customer_name || '').includes(d.name)
        );
        if (matchingLead && matchingLead.images.length > 0) {
          lead.images = matchingLead.images;
          console.log(`[scraper] Attached ${matchingLead.images.length} images to lead: ${lead.customer_name}`);
        } else if (lead.attachment_count > 0 && uniqueImages.length > 0) {
          lead.images = uniqueImages.slice(imageIndex, imageIndex + lead.attachment_count);
          imageIndex += lead.attachment_count;
          console.log(`[scraper] Attached ${lead.images.length} page-level images to lead: ${lead.customer_name} (fallback)`);
        } else {
          lead.images = [];
        }
      });

      console.log(`[scraper] Found ${leads.length} leads on ${pageName}`);
      return { leads, phoneNumbers };
    }

    const leadsData = await scrapePage(CONFIG.leadsUrl, 'leads');
    allLeads.push(...leadsData.leads);

    const jobsData = await scrapePage(CONFIG.jobsUrl, 'jobs');
    allLeads.push(...jobsData.leads);

    console.log(`[scraper] Total leads extracted: ${allLeads.length}`);

    if (allLeads.length > 0) {
      console.log('[scraper] Cleaning and normalizing lead data...');
      allLeads.forEach(lead => {
        if (lead.suburb) {
          lead.suburb = lead.suburb
            .replace(/^Waitlist\s*/i, '')
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
        if (lead.customer_name) lead.customer_name = lead.customer_name.trim();
        if (lead.job_type)      lead.job_type      = lead.job_type.trim();
        if (lead.description)   lead.description   = lead.description.replace(/\s+/g, ' ').trim();
      });

      console.log('[scraper] Saving leads to database...');
      const result = await dbWriter.saveLeads(allLeads);
      console.log(`[scraper] Saved ${result.saved} leads to database`);
      return { success: true, saved: result.saved, updated: result.updated || 0 };
    }

    console.log('[scraper] No leads found to save');
    return { success: true, saved: 0, updated: 0 };

  } catch (error) {
    console.error('[scraper] Error during scrape:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = { runScrape };
