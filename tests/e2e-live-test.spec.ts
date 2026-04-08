import { test, expect } from '@playwright/test';

test('End-to-end booking to CRM flow', async ({ page }) => {
  // 1. Visit the live site
  console.log('Navigating to live site...');
  await page.goto('https://revivepropertyco.au');
  
  // 2. Click the booking/CTA (depends on UI, assuming a button with 'Book' or 'Get a Quote')
  // Let's find a link to the booking page
  console.log('Navigating to Booking page...');
  await page.click('text=Book Now'); // Adjust based on actual UI
  await expect(page).toHaveURL(/.*BookingPage/);

  // 3. Fill out the booking form
  console.log('Filling out booking form...');
  await page.fill('input[name="firstName"]', 'Browser');
  await page.fill('input[name="lastName"]', 'Test');
  await page.fill('input[name="email"]', 'angus@gair.com.au');
  await page.fill('input[name="phone"]', '0400000000');
  await page.fill('textarea[name="address"]', '789 Playwright Way, Canberra ACT');
  
  // Select service
  await page.selectOption('select[name="serviceType"]', 'Pressure Washing');
  
  // Select type: QUOTE
  await page.click('text=Quote');
  
  // Pick a date (this might be tricky if it's a calendar picker)
  // Assuming there's a date input or we can click a day
  // Let's try to find an available slot
  // (In the current UI, it might use the CalendarPicker.tsx)
  
  // For simplicity in this test, we'll try to find a date and time slot
  // If it's a complex picker, we might need more specific selectors
  
  // Let's see the page content first if we fail here
  
  // Submit
  console.log('Submitting booking...');
  await page.click('button[type="submit"]');
  
  // 4. Verify Success Page
  console.log('Waiting for success page...');
  await expect(page).toHaveURL(/.*SuccessPage/);
  await expect(page.locator('text=Booking Reference')).toBeVisible();
  const bookingRef = await page.locator('text=Reference:').innerText();
  console.log(`Booking Reference: ${bookingRef}`);

  // 5. Verify Admin Dashboard
  console.log('Navigating to Admin Dashboard...');
  await page.goto('https://revivepropertyco.au/LoginPage');
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', 'testpass');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/.*AdminDashboard/);
  
  // 6. Check if the new lead is in the CRM
  console.log('Verifying lead in CRM...');
  await expect(page.locator('text=Browser Test')).toBeVisible();
  await expect(page.locator('text=789 Playwright Way')).toBeVisible();
  
  console.log('Test passed successfully!');
});
