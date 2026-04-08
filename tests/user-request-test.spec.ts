import { test, expect } from '@playwright/test';

test('End-to-end user flow: Booking to CRM', async ({ page }) => {
  // 1. Navigate to the landing page
  console.log('Navigating to landing page...');
  await page.goto('https://revivepropertyco.au');
  await expect(page).toHaveTitle(/Revive Property Co/);

  // 2. Go to the booking page
  console.log('Navigating to booking page...');
  // Find "Book Now" or similar button. Based on LandingPage structure (not read yet, but common)
  // Or just go directly to /BookingPage if CTA is hard to find
  const bookNowBtn = page.getByRole('link', { name: /BOOK NOW|GET A QUOTE/i }).first();
  if (await bookNowBtn.isVisible()) {
    await bookNowBtn.click();
  } else {
    await page.goto('https://revivepropertyco.au/BookingPage');
  }
  await expect(page).toHaveURL(/.*BookingPage/);

  // Step 1: Engagement Protocol & Scheduling
  console.log('Step 1: Selecting Engagement Protocol and Slot...');
  
  // Type: QUOTE (should be default, but let's be explicit)
  await page.click('text=Remote TeleQuote');
  
  // Date is selected by default (tomorrow).
  // Pick a time slot
  console.log('Picking a time slot...');
  const firstSlot = page.locator('button:has-text("AM") , button:has-text("PM")').first();
  await expect(firstSlot).toBeVisible({ timeout: 10000 });
  await firstSlot.click();

  // Go to Step 2
  console.log('Moving to Step 2...');
  await page.click('button:has-text("Configure Identification")');

  // Step 2: Identification & Site Specification
  console.log('Step 2: Filling out form...');
  await page.fill('input[placeholder="First Name"]', 'Browser');
  await page.fill('input[placeholder="Last Name"]', 'Test');
  await page.fill('input[placeholder="Email Address"]', 'angus@gair.com.au');
  await page.fill('input[placeholder="Mobile Number"]', '0400000000');
  await page.fill('input[placeholder="Full Property Address"]', '123 Playwright St, Canberra ACT');
  
  // Select Service: Pressure Washing
  console.log('Selecting service...');
  await page.selectOption('select', 'Pressure Washing');

  // Submit booking
  console.log('Submitting booking...');
  await page.click('button:has-text("Finalize Manifest & Dispatch")');

  // 4. Verify the success page/booking reference
  console.log('Verifying success page...');
  await expect(page).toHaveURL(/.*SuccessPage/, { timeout: 15000 });
  await expect(page.locator('text=Booking Reference')).toBeVisible();
  const bookingRef = await page.locator('p:has-text("REV-")').textContent();
  console.log(`Booking Reference found: ${bookingRef}`);

  // 5. Log in to the admin dashboard
  console.log('Navigating to Login Page...');
  await page.goto('https://revivepropertyco.au/LoginPage');
  
  console.log('Logging in...');
  await page.fill('input[name="email"]', 'admin'); // User said username 'admin'
  await page.fill('input[name="password"]', 'testpass');
  await page.click('button[type="submit"]');

  // Verify dashboard
  console.log('Verifying Admin Dashboard...');
  await expect(page).toHaveURL(/.*AdminDashboard/, { timeout: 15000 });
  
  // 6. Verify that the 'Browser Test' lead appears in the CRM
  console.log('Verifying lead in CRM...');
  // The lead should appear in the table
  const leadRow = page.locator('tr', { hasText: 'Browser Test' });
  await expect(leadRow).toBeVisible({ timeout: 15000 });
  
  // Verify service
  await expect(leadRow).toContainText('Pressure Washing');
  
  console.log('E2E Test Completed Successfully!');
});
