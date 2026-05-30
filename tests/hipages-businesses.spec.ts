import { test, expect } from '@playwright/test';

test.describe('hipages Businesses Page & Scraper Trigger Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inject localStorage authentication to enable modification and trigger buttons
    await page.addInitScript(() => {
      window.localStorage.setItem('revive_admin_token', 'mock-jwt-token-123');
      window.localStorage.setItem(
        'revive_admin_user',
        JSON.stringify({
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
        })
      );
    });

    // Mock API requests to isolate testing environment and avoid real db/cron triggers
    await page.route('**/api/hp-businesses/noauth/businesses*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'test-biz-id-1',
              hipages_profile_id: '1001',
              business_name: 'Test Plumbing Services',
              primary_trade: 'Plumber',
              suburb: 'Sydney',
              postcode: '2000',
              state: 'NSW',
              rating: 4.8,
              review_count: 15,
              job_count: 10,
              years_on_hipages: 3,
              verified: true,
              badge_level: 'Gold',
              lead_status: 'NEW',
              scraped_at: '2026-05-30T00:00:00.000Z',
            },
          ],
        }),
      });
    });

    await page.route('**/api/hp-businesses/sessions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'sess-id-mock-12345',
              trade_category: 'Plumbing',
              location: 'NSW',
              status: 'completed',
              businesses_found: 5,
              businesses_new: 3,
              businesses_updated: 2,
              started_at: '2026-05-30T01:00:00.000Z',
              completed_at: '2026-05-30T01:15:00.000Z',
            },
          ],
        }),
      });
    });

    await page.route('**/api/hp-businesses/scrape/trigger', async (route) => {
      // Return trigger success
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Scrape triggered successfully',
        }),
      });
    });

    await page.route('**/api/hp-businesses/businesses/*/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'test-biz-id-1',
            lead_status: 'CONTACTED',
          },
        }),
      });
    });
  });

  test('should render hipages Businesses layout and elements', async ({ page }) => {
    // Navigate to page using relative path
    await page.goto('/contractors/hp-businesses');

    // Verify Title
    const titleLocator = page.locator('h1:has-text("hipages Businesses")');
    await expect(titleLocator).toBeVisible();

    // Verify Stats Bar values
    await expect(page.locator('text=Total').first()).toBeVisible();
    await expect(page.locator('text=Avg Rating').first()).toBeVisible();
    await expect(page.locator('text=Top Trade').first()).toBeVisible();

    // Verify businesses table rendering
    await expect(page.locator('text=Test Plumbing Services')).toBeVisible();
    await expect(page.locator('text=Sydney • 2000')).toBeVisible();
    await expect(page.locator('text=Plumber').first()).toBeVisible();
  });

  test('should display Scraper Operations & Sessions monitoring panel', async ({ page }) => {
    await page.goto('/contractors/hp-businesses');

    // Verify Panel Title
    await expect(page.locator('h2', { hasText: 'Scraper Operations & Sessions' }).first()).toBeVisible();

    // Verify mock session values in logs grid
    await expect(page.locator('text=sess-id-').first()).toBeVisible();
    await expect(page.locator('text=Plumbing • NSW').first()).toBeVisible();
    await expect(page.locator('text=5 / 3 / 2').first()).toBeVisible();
    await expect(page.locator('span:has-text("completed")').first()).toBeVisible();
  });

  test('should trigger manual scrape and display alert', async ({ page }) => {
    await page.goto('/contractors/hp-businesses');

    // Trigger scrape trigger button
    const triggerBtn = page.getByRole('button', { name: /Trigger Scrape/i });
    await expect(triggerBtn).toBeVisible();
    await expect(triggerBtn).not.toBeDisabled();

    // Setup dialog listener for confirm alert & success alert
    page.on('dialog', async (dialog) => {
      console.log(`[Playwright Dialog] Type: ${dialog.type()}, Message: ${dialog.message()}`);
      if (dialog.message().includes('trigger a manual scrape run')) {
        await dialog.accept();
      } else if (dialog.message().includes('triggered successfully')) {
        await dialog.accept();
      }
    });

    await triggerBtn.click();
  });

  test('should perform status updates when authenticated', async ({ page }) => {
    await page.goto('/contractors/hp-businesses');

    // Find contact button in table
    const contactBtn = page.locator('button[title="Mark as Contacted"]').first();
    await expect(contactBtn).toBeVisible();
    await expect(contactBtn).not.toBeDisabled();

    // Setup dialog listener for confirm status update
    page.on('dialog', async (dialog) => {
      if (dialog.message().includes('Mark "Test Plumbing Services" as CONTACTED')) {
        await dialog.accept();
      }
    });

    await contactBtn.click();
  });});
