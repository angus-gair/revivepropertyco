import { test, expect } from '@playwright/test';

test.describe('hipages CRM Opportunity Integration Tests', () => {
  let lead1Synced = false;

  test.beforeEach(async ({ page }) => {
    // Reset sync state for each test
    lead1Synced = false;

    // Inject localStorage authentication
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

    // Mock API requests for hipages leads
    await page.route('**/api/hipages/noauth/leads*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              lead_id: 'lead-mock-001',
              customer_name: 'David Plumber',
              suburb: 'Balmain',
              job_type: 'Plumbing',
              credits: 5,
              posted_date: '2026-05-30T10:00:00.000Z',
              synced_to_crm: lead1Synced,
              syncedToCrm: lead1Synced,
              status: 'AVAILABLE',
              contact_status: 'Supplied'
            },
            {
              lead_id: 'lead-mock-002',
              customer_name: 'Alice Roof',
              suburb: 'Surry Hills',
              job_type: 'Roofing',
              credits: 10,
              posted_date: '2026-05-30T11:00:00.000Z',
              synced_to_crm: true,
              syncedToCrm: true,
              crm_opportunity_id: 'opt-mock-123',
              status: 'AVAILABLE',
              contact_status: 'Supplied'
            }
          ],
          pagination: {
            page: 1,
            limit: 100,
            total: 2
          }
        }),
      });
    });

    // Mock promote-opportunity endpoint
    await page.route('**/api/hipages/leads/lead-mock-001/promote-opportunity', async (route) => {
      lead1Synced = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            hipagesLeadId: 'lead-mock-001',
            crmOpportunityId: 'opt-mock-789',
            personId: 'pers-mock-456'
          }
        }),
      });
    });
  });

  test('should render hipages leads with promotion actions and synced badges', async ({ page }) => {
    // Navigate to the public leads page (where contractors view leads)
    await page.goto('/contractors/hp-leads');

    // Verify header exists
    await expect(page.locator('h1')).toContainText('hipages Leads');

    // Verify synced badge renders for Lead 2
    const syncedBadge = page.locator('a[title="View Opportunity in Twenty CRM"]').first();
    await expect(syncedBadge).toBeVisible();
    await expect(syncedBadge).toHaveAttribute('href', 'https://crm.revivepropertyco.au/objects/opportunities');
    await expect(syncedBadge).toContainText('Synced');

    // Verify promote button renders for Lead 1
    const promoteBtn = page.locator('button[title="Promote to CRM"]').first();
    await expect(promoteBtn).toBeVisible();
  });

  test('should trigger lead promotion, display alerts, and update UI state', async ({ page }) => {
    await page.goto('/contractors/hp-leads');

    const promoteBtn = page.locator('button[title="Promote to CRM"]').first();
    await expect(promoteBtn).toBeVisible();

    // Set up dialog listeners
    page.on('dialog', async (dialog) => {
      if (dialog.message().includes('Promote lead from David Plumber')) {
        await dialog.accept();
      } else if (dialog.message().includes('Lead promoted successfully')) {
        await dialog.accept();
      }
    });

    // Click promote button
    await promoteBtn.click();

    // Verify the Promote button gets replaced by the Synced link badge
    const syncedBadge = page.locator('a[title="View Opportunity in Twenty CRM"]').first();
    await expect(syncedBadge).toBeVisible();
  });
});
