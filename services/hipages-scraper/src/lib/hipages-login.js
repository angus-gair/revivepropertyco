require('dotenv').config();
const fs = require('fs');

const SESSION_FILE = process.env.SESSION_FILE || '/app/output/hipages-session.json';

async function saveCookies(context) {
  try {
    const cookies = await context.cookies();
    fs.writeFileSync(SESSION_FILE, JSON.stringify(cookies, null, 2));
    console.log(`[hipages-login] Saved ${cookies.length} session cookies`);
  } catch (e) {
    console.warn('[hipages-login] Could not save session:', e.message);
  }
}

async function loadCookies(context) {
  try {
    if (!fs.existsSync(SESSION_FILE)) return false;
    const cookies = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    if (!cookies.length) return false;
    await context.addCookies(cookies);
    console.log(`[hipages-login] Loaded ${cookies.length} session cookies`);
    return true;
  } catch (e) {
    console.warn('[hipages-login] Could not load session:', e.message);
    return false;
  }
}

async function performFullLogin(page) {
  const email = process.env.HIPAGES_USERNAME;
  const password = process.env.HIPAGES_PASSWORD;
  if (!email || !password) throw new Error('HIPAGES_USERNAME or HIPAGES_PASSWORD not configured');

  console.log('[hipages-login] Performing full login...');
  await page.goto('https://business.hipages.com.au/login', { waitUntil: 'networkidle', timeout: 60000 });

  const emailSelectors = ['input[name="email"]', 'input[type="email"]', 'input[id="email"]'];
  let emailInput = null;
  for (const sel of emailSelectors) {
    emailInput = await page.$(sel);
    if (emailInput) { console.log(`[hipages-login] Found email input: ${sel}`); break; }
  }
  if (!emailInput) throw new Error('Email input not found on login page');

  await emailInput.fill(email);
  console.log(`[hipages-login] Entered email: ${email}`);

  await Promise.all([
    page.waitForSelector('button:has-text("log in with password"), button:has-text("Log in with password")', { timeout: 15000 }),
    emailInput.press('Enter'),
  ]);
  console.log('[hipages-login] Email submitted');

  const pwOptBtn = await page.$('button:has-text("log in with password")') ||
    await page.$('button:has-text("Log in with password")');
  if (pwOptBtn) await pwOptBtn.click();

  await page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
  await page.click('input[type="password"]');
  await page.waitForTimeout(200);
  await page.fill('input[type="password"]', password);

  // Fallback for React-controlled inputs that clear on fill()
  const pwVal = await page.$eval('input[type="password"]', el => el.value);
  if (pwVal !== password) {
    console.log('[hipages-login] fill() did not stick, using native setter...');
    await page.evaluate((pw) => {
      const el = document.querySelector('input[type="password"]');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, pw);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, password);
  }

  const finalLen = await page.$eval('input[type="password"]', el => el.value.length);
  console.log(`[hipages-login] Password entered (length: ${finalLen})`);

  const submitBtn = await page.$('button:has-text("Continue")') ||
    await page.$('button:has-text("Log in")') ||
    await page.$('button[type="submit"]');
  if (submitBtn) { console.log('[hipages-login] Clicking submit'); await submitBtn.click(); }
  else { console.log('[hipages-login] No submit button, pressing Enter'); await page.keyboard.press('Enter'); }

  console.log('[hipages-login] Waiting for post-login redirect...');
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log(`[hipages-login] URL [${i + 1}/20]: ${url}`);
    if (!url.includes('auth.hipages.com.au') && !url.includes('/login')) {
      console.log('[hipages-login] Login successful');
      return;
    }
  }
  throw new Error(`Login failed after 60s: still at ${page.url()}`);
}

/**
 * Ensure the browser context is authenticated.
 * Tries saved session cookies first; falls back to full login if expired.
 */
async function ensureAuthenticated(page, context) {
  const hadCookies = await loadCookies(context);

  if (hadCookies) {
    await page.goto('https://business.hipages.com.au/leads', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const url = page.url();
    if (!url.includes('auth.hipages.com.au') && !url.includes('/login')) {
      console.log('[hipages-login] Reused existing session');
      return;
    }
    console.log('[hipages-login] Session expired, performing fresh login...');
    await context.clearCookies();
  }

  await performFullLogin(page);
  await saveCookies(context);
}

module.exports = { ensureAuthenticated };
