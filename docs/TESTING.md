<!-- generated-by: gsd-doc-writer -->
# Testing Guide

This document describes the testing framework, test execution, and test-writing conventions for the Revive Property Co. application.

## Test Framework and Setup

The project uses **Playwright** (`@playwright/test` v1.59.1) for end-to-end browser testing. Playwright is configured to test against the live production site at `https://revivepropertyco.au`.

### Configuration

- **Config file**: `playwright.config.ts`
- **Test directory**: `tests/`
- **Browser**: Chromium (Desktop Chrome emulation)
- **Base URL**: `https://revivepropertyco.au`
- **Parallel execution**: Enabled locally, disabled in CI
- **Retries**: 2 retries in CI, 0 locally
- **Trace recording**: On first retry (for debugging failures)

### Installing Playwright Browsers

After running `npm install`, install the Playwright browser binaries:

```bash
npx playwright install chromium
```

## Running Tests

### Run All Tests

Execute the full test suite against the live production site:

```bash
npx playwright test
```

### Run Tests in Headed Mode

Run tests with visible browser windows (useful for debugging):

```bash
npx playwright test --headed
```

### Run Specific Test File

Run a single test file:

```bash
npx playwright test tests/user-request-test.spec.ts
```

### Run Tests in Debug Mode

Launch the Playwright Inspector for step-by-step debugging:

```bash
npx playwright test --debug
```

### View Test Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Writing New Tests

### File Naming Convention

Test files use the `.spec.ts` suffix and are located in the `tests/` directory:

- `tests/user-request-test.spec.ts` - User-requested booking flow test
- `tests/e2e-live-test.spec.ts` - End-to-end booking to CRM verification

### Test Structure

Tests follow the standard Playwright pattern using `test()` and `expect()`:

```typescript
import { test, expect } from '@playwright/test';

test('Descriptive test name', async ({ page }) => {
  // 1. Navigate to page
  await page.goto('https://revivepropertyco.au');

  // 2. Perform actions
  await page.click('text=Book Now');
  await page.fill('input[name="email"]', 'test@example.com');

  // 3. Verify results
  await expect(page).toHaveURL(/.*BookingPage/);
  await expect(page.locator('text=Success')).toBeVisible();
});
```

### Page Object Pattern

For complex interactions, extract selectors and actions into reusable objects:

```typescript
class BookingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('https://revivepropertyco.au/BookingPage');
  }

  async fillForm(details: { name: string; email: string; service: string }) {
    await this.page.fill('input[placeholder="First Name"]', details.name);
    await this.page.fill('input[placeholder="Email Address"]', details.email);
    await this.page.selectOption('select', details.service);
  }

  async submit() {
    await this.page.click('button:has-text("Finalize Manifest")');
  }
}
```

### Selectors

Use robust selectors that survive UI changes:

- **Text**: `page.getByText('Book Now')` or `page.click('text=Book Now')`
- **Role**: `page.getByRole('button', { name: /submit/i })`
- **Placeholder**: `page.getByPlaceholder('Email Address')`
- **Label**: `page.getByLabel('Service Type')`
- **Test ID**: `page.getByTestId('submit-btn')` (add `data-testid` attributes to components)

### Test Data

Use realistic test data that matches production patterns:

- **Email**: Use real email addresses you control for verification
- **Phone**: Use valid Australian mobile format: `04XXXXXXXX`
- **Address**: Use real Canberra ACT addresses for geo accuracy
- **Dates**: Use future dates relative to test execution time

### Console Logging

Add console.log statements for test progress visibility:

```typescript
console.log('Navigating to booking page...');
await page.goto('/BookingPage');
console.log('Filling out form...');
```

## Coverage Requirements

**No coverage thresholds are currently configured** for this project. The project relies on manual E2E verification against the live production site rather than automated coverage metrics.

## CI Integration

**No CI/CD pipeline is currently configured** for automated test execution. Tests are run manually during development and before deployments.

### Recommended CI Workflow

When implementing CI, consider:

1. **Trigger**: On pull request creation and push to main branch
2. **Command**: `npx playwright test`
3. **Parallel workers**: Set to 1 for consistent results
4. **Artifacts**: Upload Playwright report and trace files
5. **Notification**: Fail the build if any tests fail

Example GitHub Actions workflow:

```yaml
name: Playwright Tests
on: [pull_request, push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Manual Verification Scripts

The project includes shell scripts for manual testing and production verification:

### Final Booking Test (`archive/scripts/final-booking-test.sh`)

Tests the complete booking flow including email delivery:

```bash
bash archive/scripts/final-booking-test.sh
```

This script:
1. Submits a booking to the backend API (`localhost:8080/api/bookings`)
2. Extracts the booking reference from the response
3. Verifies booking creation in the database
4. Provides checklist for manual email verification (4 email addresses)

### Production Deployment Verification (`verify-production-deployment.sh`)

Verifies the hipages scraper deployment and database connectivity:

```bash
bash verify-production-deployment.sh
```

Checks:
- Container health status for `revive-hipages-scraper`
- Database connectivity from scraper container
- Recent scrapes in database (last 24 hours)
- Scraper logs for successful completions
- Dashboard HTTP accessibility (`/admin/hipages-leads`)
- Real-time sync (NOTIFY mechanism)

### Riv AI Performance Test (`archive/scripts/test-riv-performance.cjs`)

Tests the AI chat concierge response times:

```bash
node archive/scripts/test-riv-performance.cjs
```

Measures response duration for the Z.AI API (model: `glm-4.7`) with `thinking: disabled` for ultra-fast responses.

## Common Test Issues

### Timeout Errors

If tests fail with timeout errors, increase the timeout for specific operations:

```typescript
await expect(page.locator('text=Loading')).toBeVisible({ timeout: 15000 });
```

### Flaky Selectors

If selectors fail intermittently:
1. Use `waitFor()` to ensure elements are ready
2. Prefer `await expect(page.locator()).toBeVisible()` over `page.locator().isVisible()`
3. Use more specific selectors (combine text with role or test ID)

### Authentication Tests

For admin dashboard tests, use a test account with credentials stored in environment variables:

```typescript
const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@test.local';
const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'testpass';
```

**DO NOT** hardcode production credentials in test files.

### Network Dependency

Tests run against the live production site and require:
- Internet connectivity
- DNS resolution for `revivepropertyco.au`
- Backend API availability (`/api/*` endpoints)

For offline development, update `playwright.config.ts` to use a local base URL:

```typescript
use: {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
}
```

## Next Steps

- See [DEVELOPMENT.md](DEVELOPMENT.md) for local development setup
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment procedures
- See [ARCHITECTURE.md](ARCHITECTURE.md) for system architecture details
