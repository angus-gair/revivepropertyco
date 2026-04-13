require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const dbWriter = require('./db-writer.js');

// Configuration
const CONFIG = {
  email: process.env.HIPAGES_USERNAME,
  password: process.env.HIPAGES_PASSWORD,
  leadsUrl: "https://business.hipages.com.au/leads",
  jobsUrl: "https://business.hipages.com.au/jobs",
  loginUrl: "https://business.hipages.com.au/login",
  headless: process.env.HIPAGES_HEADLESS === 'true' || true,
  timeout: 60000,
};

const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '../output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Parse leads from page text content
 * Copied from working POC at /home/ghost/hipages/scrape-leads.js
 */
function parseLeadsFromText(pageText, pageHtml = null) {
  const leads = [];

  // Extract phone numbers from HTML if provided
  let phoneNumbers = [];
  if (pageHtml) {
    // Find all phone numbers (Australian mobile: 04xxxxxxxx, landlines with various formats)
    phoneNumbers = pageHtml.match(/0[45]\d{8}/g) || [];
    // Also try to find phone numbers in the text content
    const textPhones = pageText.match(/0[45]\d{8}/g) || [];
    phoneNumbers = [...new Set([...phoneNumbers, ...textPhones])];
  }

  // Extract image URLs from HTML if provided
  let images = [];
  if (pageHtml) {
    // Find hipages attachment images
    const imgMatches = pageHtml.match(/https:\/\/img\.hipages\.com\.au\/[^\s"<>]+?\.(?:jpg|jpeg|png|webp)/gi) || [];
    // Find attachment URLs
    const attachmentMatches = pageHtml.match(/https:\/\/attachments\.hipagesusercontent\.com\/[^\s"<>]+/gi) || [];
    images = [...new Set([...imgMatches, ...attachmentMatches])];
  }

  // Split by credit indicators (e.g., "21 credits", "8 credits")
  // This is a reliable separator between leads
  const creditPattern = /(\d+)\s+credits/g;
  const leadBlocks = pageText.split(creditPattern);

  // Process each lead block
  for (let i = 0; i < leadBlocks.length - 1; i += 2) {
    const block = leadBlocks[i];
    const credits = leadBlocks[i + 1]; // The credit count

    if (!block || !credits || !block.trim()) continue;

    try {
      // Extract lead information using regex patterns
      const lead = {
        credits: parseInt(credits) || 0,
        raw_block: block.trim().substring(0, 500), // Store raw text for debugging
      };

      // Extract name and initial (e.g., "M\nMerrill" or "A\nAhmed")
      const nameMatch = block.match(/^([A-Z])\n([A-Z][a-z]+)/m);
      if (nameMatch) {
        lead.initial = nameMatch[1];
        lead.customer_name = nameMatch[2];
      }

      // Extract date and time (e.g., "11th Apr 2026 - 9:53 pm")
      const dateMatch = block.match(/(\d{1,2}(?:st|nd|rd|th)\s+\w+\s+\d{4}\s*-\s*\d+:\d+\s*(?:am|pm))/i);
      if (dateMatch) {
        lead.posted_date = dateMatch[1];
      }

      // Extract status (e.g., "Available", "First to accept", "Waitlist")
      const statusMatch = block.match(/(Available|First to accept|Waitlist)/);
      if (statusMatch) {
        lead.status = statusMatch[1];
      }

      // Extract location (e.g., "Wallsend, 2287")
      const locationMatch = block.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*\d{4})/);
      if (locationMatch) {
        lead.location = locationMatch[1];
        const [suburb, postcode] = locationMatch[1].split(",");
        lead.suburb = suburb?.trim();
        lead.postcode = postcode?.trim();
      }

      // Extract job type - more flexible pattern
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip the customer name line (initial or full name)
        if (line === lead.initial || line === lead.customer_name) {
          continue;
        }

        // Skip known fields
        if (line.match(/^(Start By|Contact Details|Contact details|Job Description|Residential or commercial|Type of work|Amount of work|Accept|Decline)/i)) {
          break; // We've gone past the job type line
        }

        // Check if this line looks like a job type
        if (
          line.length > 2 &&
          line.length < 50 &&
          !line.match(/^\d/) && // Not starting with a number
          !line.match(/,?\s*\d{4}/) && // Not a location (postcode)
          !line.match(/(\d{1,2})(th|st|nd|rd)/i) && // Not a date
          !line.match(/:/) && // Not a time
          !line.match(/^(Available|First to accept|Waitlist|Supplied|Not supplied)/i) && // Not a status/contact field
          !line.match(/^(Residential|Commercial)/) && // Not job category
          !line.match(/^(Save on|Explore|Settings|Mobile)/) // Not navigation
        ) {
          // This looks like it could be a job type
          lead.job_type = line;
          break;
        }
      }

      // Fallback: try the old regex for specific patterns
      if (!lead.job_type) {
        const jobTypeMatch = block.match(/(?:Handyman|Garden Maintenance|Gardeners|Plumber|Electrician|Carpenter|Painter|Cleaner|Landscaper|Locksmith|Tiler|Roofer|Builder|Decorator|Flooring|Air Conditioning| Welder|Glazier|Bricklayer|Concreter|Excavator|Demolition|Insulation|Security|Appliance Repair|Door Installer|Furniture Assembly|Lawn Mowing|Odd Jobs|Brick Cleaning|Garden Rubbish Removal|Mirror & Picture Hanging|Garden Clean Up|Rubbish Disposal|Garden Pruning & Trimming|Basic Tiling|Basic Plastering|Basic Carpentry|Basic Concreting|Basic Garden Jobs)(?:\s*-\s*([\w\s]+))?/i);
        if (jobTypeMatch) {
          lead.job_type = jobTypeMatch[1];
          if (jobTypeMatch[2]) {
            lead.job_subtype = jobTypeMatch[2].trim();
          }
        }
      }

      // Extract "Start By" timing
      const startByMatch = block.match(/Start By\s*\n\s*([^\n]+)/);
      if (startByMatch) {
        lead.start_by = startByMatch[1].trim();
      }

      // Extract contact details status
      const contactMatch = block.match(/Contact (?:details?:|Detail:)\s*(Supplied|Not supplied|Phone number verified|Email address verified)/i);
      if (contactMatch) {
        lead.contact_status = contactMatch[1];
      }

      // Extract job description (everything after "Job Description" until "Residential" or end)
      const descMatch = block.match(/Job Description\s*\n\s*([\s\S]*?)(?=\n\s*(?:Residential|Commercial)|$)/);
      if (descMatch) {
        lead.description = descMatch[1].trim();
      }

      // Extract attachment count
      const attachmentMatch = block.match(/(\d+)\s+Attachments?/);
      if (attachmentMatch) {
        lead.attachment_count = parseInt(attachmentMatch[1]);
      }

      // Only add if we have at least a name or valid job type
      const hasValidName = lead.customer_name && lead.customer_name.length > 1;
      const hasValidLocation = lead.location && lead.location.match(/\d{4}/); // Has postcode
      const hasValidJobType = lead.job_type && !lead.job_type.match(/^(Leads|Jobs|All leads|Waitlist|Settings|Explore)/i);

      // Valid leads must have: name OR (job_type + location)
      if (hasValidName || (hasValidJobType && hasValidLocation)) {
        leads.push(lead);
      } else {
        // Skip invalid entries (navigation, headers, etc.)
        if (lead.raw_block) {
          console.log(`⚠️  Skipping invalid lead: ${lead.customer_name || lead.job_type || 'unknown'} | ${lead.location || 'no location'}`);
        }
      }
    } catch (e) {
      console.log(`⚠️  Error parsing lead block: ${e.message}`);
    }
  }

  // Try to match phone numbers to leads by context
  if (phoneNumbers.length > 0 && leads.length > 0) {
    let phoneIndex = 0;
    leads.forEach(lead => {
      if (lead.contact_status && lead.contact_status.includes("verified") && phoneIndex < phoneNumbers.length) {
        lead.phone = phoneNumbers[phoneIndex++];
      }
    });
  }

  return { leads, phoneNumbers, images };
}

/**
 * Main scraping function
 * Authenticates to hipages.com.au, extracts leads from /leads and /jobs pages,
 * and saves to database via db-writer
 */
async function runScrape() {
  console.log('[scraper] Starting hipages scrape...');

  const browser = await chromium.launch({ headless: CONFIG.headless });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigate to login
    console.log('[scraper] Navigating to login page...');
    await page.goto(CONFIG.loginUrl, { waitUntil: "networkidle", timeout: CONFIG.timeout });

    // Step 2: Enter email
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[name="username"]',
      'input[id="email"]',
      'input[placeholder*="email" i]',
    ];

    let emailInput = null;
    for (const sel of emailSelectors) {
      emailInput = await page.$(sel);
      if (emailInput) {
        console.log(`[scraper] Found email input: ${sel}`);
        break;
      }
    }

    if (!emailInput) {
      throw new Error('Could not find email input field');
    }

    await emailInput.fill(CONFIG.email);
    console.log(`[scraper] Entered email: ${CONFIG.email}`);

    // Step 3: Click Next button
    const nextBtnSelectors = [
      'button:has-text("Next")',
      'button[type="submit"]',
    ];
    for (const sel of nextBtnSelectors) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        console.log("[scraper] Clicked Next button");
        break;
      }
    }

    await page.waitForTimeout(5000);

    // Step 4: Click "log in with password" option
    console.log('[scraper] Looking for "log in with password" option...');
    await page.waitForSelector('button', { timeout: 10000 }).catch(() => {});

    const passwordOptionSelectors = [
      'button:has-text("log in with password")',
      'button:has-text("Log in with password")',
      'button:has-text("Password")',
    ];

    let clickedPasswordOption = false;
    for (const sel of passwordOptionSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn) {
          await btn.click();
          console.log(`[scraper] Clicked 'log in with password' option: ${sel}`);
          clickedPasswordOption = true;
          break;
        }
      } catch (e) {
        // Selector didn't work, try next one
      }
    }

    if (!clickedPasswordOption) {
      console.log("[scraper] Could not find 'log in with password' option, might already be on password screen");
    }

    await page.waitForTimeout(3000);

    // Step 5: Enter password
    const pwSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[id="password"]',
    ];
    for (const sel of pwSelectors) {
      const el = await page.$(sel);
      if (el) {
        await el.fill(CONFIG.password);
        console.log("[scraper] Password entered");
        break;
      }
    }

    // Click login/submit button
    const loginBtnSelectors = [
      'button[type="submit"]',
      'button:has-text("Log in")',
      'button:has-text("Sign in")',
      'button:has-text("Continue")',
      'input[type="submit"]',
    ];
    for (const sel of loginBtnSelectors) {
      const btn = await page.$(sel);
      if (btn) {
        await btn.click();
        console.log("[scraper] Clicked login button");
        break;
      }
    }

    // Wait for redirect after login
    console.log('[scraper] Waiting for redirect after login...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    const currentTitle = await page.title();
    console.log(`[scraper] Current URL: ${currentUrl}`);
    console.log(`[scraper] Page title: ${currentTitle}`);

    // Check if login failed
    if (currentUrl.includes("login") || currentTitle.includes("Login")) {
      throw new Error('Login failed - still on login page');
    }

    // Step 6: Scrape /leads and /jobs pages
    const allLeads = [];

    // Helper function to scrape a page
    async function scrapePage(url, pageName) {
      console.log(`[scraper] Scraping ${pageName} page...`);

      if (page.url() !== url) {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: CONFIG.timeout });
      }
      await page.waitForTimeout(3000);

      // Get page data
      const pageData = await page.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          allText: document.body?.innerText || "",
        };
      });

      // Get HTML for phone/image extraction
      const pageHtml = await page.content();

      console.log(`[scraper] ${pageName} page title: ${pageData.title}`);

      // Parse leads with HTML context
      const { leads, phoneNumbers, images } = parseLeadsFromText(pageData.allText, pageHtml);

      console.log(`[scraper] Found ${leads.length} leads on ${pageName}`);
      if (phoneNumbers.length > 0) {
        console.log(`[scraper] Found ${phoneNumbers.length} phone numbers`);
      }
      if (images.length > 0) {
        console.log(`[scraper] Found ${images.length} images/attachments`);
      }

      return { leads, phoneNumbers, images };
    }

    // Scrape /leads page
    const leadsData = await scrapePage("https://business.hipages.com.au/leads", "leads");
    allLeads.push(...leadsData.leads);

    // Scrape /jobs page
    const jobsData = await scrapePage("https://business.hipages.com.au/jobs", "jobs");
    allLeads.push(...jobsData.leads);

    console.log(`[scraper] Total leads extracted: ${allLeads.length}`);

    // Step 7: Save to database
    if (allLeads.length > 0) {
      console.log('[scraper] Saving leads to database...');
      const result = await dbWriter.saveLeads(allLeads);
      console.log(`[scraper] Scrape complete: ${result.saved} leads saved`);
      return { success: true, saved: result.saved, updated: result.updated };
    } else {
      console.log('[scraper] No leads found to save');
      return { success: true, saved: 0, updated: 0 };
    }

  } catch (error) {
    console.error('[scraper] Error during scrape:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = {
  runScrape
};
