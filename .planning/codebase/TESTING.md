# Testing Patterns

**Analysis Date:** 2026-04-12

## Test Framework

**Runner:**
- Playwright `^1.59.1` — E2E browser testing only
- Config: `playwright.config.ts`

**Assertion Library:**
- Playwright built-in assertions (`expect` from `@playwright/test`)

**No Unit Test Framework:**
- No Jest, Vitest, or any unit testing framework installed
- No `jest.config.*` or `vitest.config.*` present
- Zero `.test.ts` / `.test.tsx` files exist

**Run Commands:**
```bash
npx playwright test              # Run all E2E tests
npx playwright test --ui         # Interactive UI mode
npx playwright test --debug      # Debug mode
```

**Note:** No `test` script defined in `package.json`. Tests must be run via `npx playwright test` directly.

## Test File Organization

**Location:**
- Tests are in a separate `tests/` directory at project root
- No co-located test files (no `.test.tsx` next to source files)

**Naming:**
- E2E specs: kebab-case with `.spec.ts` — `e2e-live-test.spec.ts`, `user-request-test.spec.ts`
- SEO verification scripts: `test-seo-wp{N}.cjs` — numbered by work package (wp2 through wp9)
- Archive scripts: Various `.cjs` and `.sh` files in `archive/scripts/`

**Structure:**
```
tests/
├── e2e-live-test.spec.ts       # Full booking-to-CRM E2E flow
├── user-request-test.spec.ts   # User-facing E2E booking test
├── test-seo-wp2.cjs            # SEO verification: technical SEO
├── test-seo-wp3.cjs            # SEO verification: schema markup
├── test-seo-wp4.cjs            # SEO verification: ...
├── test-seo-wp5.cjs            # ...
├── test-seo-wp6.cjs            # ...
├── test-seo-wp7.cjs            # ...
├── test-seo-wp8.cjs            # ...
└── test-seo-wp9.cjs            # SEO verification: content strategy

archive/scripts/
├── test-riv-performance.cjs    # Chat/Riv performance test
├── test-zai-coding.cjs         # Z.AI API test
├── test-zai-api.cjs            # Z.AI API connectivity test
├── test-email.cjs              # Email service test
├── final-booking-test.sh       # Shell-based booking test
├── complete-booking-test.cjs   # Comprehensive booking test
└── quick-booking-test.sh       # Fast booking smoke test
```

## Test Structure

**Suite Organization:**

Playwright E2E tests use flat `test()` blocks — no `describe()` grouping:
```typescript
import { test, expect } from '@playwright/test';

test('End-to-end booking to CRM flow', async ({ page }) => {
  console.log('Navigating to live site...');
  await page.goto('https://revivepropertyco.au');
  // ...
});
```

**SEO verification scripts** use a custom assertion pattern:
```javascript
const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';
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

// Usage:
check('ServiceAreasPage.tsx exists', fs.existsSync('pages/ServiceAreasPage.tsx'));
```

**Patterns:**
- Setup: Navigate to production URL (`https://revivepropertyco.au`) — tests target live site
- Teardown: None — Playwright handles browser cleanup
- Assertion: Playwright's `expect()` API — `await expect(page).toHaveURL(/.*BookingPage/)`, `await expect(locator).toBeVisible()`

## Playwright Configuration

**Config file:** `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'https://revivepropertyco.au',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

**Key decisions:**
- Targets live production site (`baseURL: 'https://revivepropertyco.au'`)
- Chromium only — no Firefox or WebKit
- Traces captured only on retry for debugging
- CI mode: retries=2, single worker, no `.only` tests

## Mocking

**Framework:** No mocking framework or patterns in use.

**Current approach:**
- E2E tests run against the live production site — no mocking
- No API mocking (no MSW, no Playwright route interception)
- Services already contain graceful fallback logic (e.g., `bookingApiService.ts` simulates success when backend unavailable)

**What to Mock (guidance for future tests):**
- External API calls (Z.AI chat API in `services/geminiService.ts`)
- Database connections (server-side `lib/database.cjs`)
- Email service (`lib/email.cjs` via Resend)
- Time-dependent logic (date validation, calendar rendering)

**What NOT to Mock:**
- React component rendering (test real output)
- Tailwind CSS styling (no need to mock)
- Route navigation (Playwright handles this)

## Fixtures and Factories

**Test Data:**
No fixture files or factory functions. Test data is hardcoded inline in tests:
```typescript
// From user-request-test.spec.ts
await page.fill('input[placeholder="First Name"]', 'Browser');
await page.fill('input[placeholder="Last Name"]', 'Test');
await page.fill('input[placeholder="Email Address"]', 'angus@gair.com.au');
```

**Location:**
- No `tests/fixtures/` directory
- No shared test utilities

## Coverage

**Requirements:** None enforced. No coverage tooling configured.

**Current coverage:**
- E2E: 2 spec files covering booking flow and CRM verification
- SEO: 8 verification scripts checking file existence and content patterns
- Unit: 0% — no unit tests exist
- Integration: 0% — no API integration tests
- Server: 0% — no tests for `server/` directory

**View Coverage:**
```bash
# Not applicable — no coverage tooling
```

## Test Types

**Unit Tests:**
- Not used. No framework configured for unit testing.
- Recommendation: Add Vitest for service-level unit tests targeting `services/*.ts` and `server/api/*.cjs`.

**Integration Tests:**
- Not used. Server API routes (`server/api/*.cjs`) are untested.
- Recommendation: Add supertest-based integration tests for Express routes.

**E2E Tests:**
- Framework: Playwright targeting live production site
- Scope: Full user flow from landing → booking → success page → admin CRM verification
- Limitations: Tests hardcode production URL, making them unsuitable for CI without deployed environment
- Two test files:
  - `e2e-live-test.spec.ts`: Simpler flow, clicks "Book Now" then fills form
  - `user-request-test.spec.ts`: More detailed flow through multi-step booking wizard

**SEO Verification Scripts:**
- Pattern: Node.js CommonJS scripts that read source files from disk and check for content patterns
- Not automated — must be run manually: `node tests/test-seo-wp9.cjs`
- Check file existence, React component structure, presence of suburb names, SEO tags, etc.

## Common Patterns

**Async Testing:**
```typescript
// Playwright handles async natively
test('flow', async ({ page }) => {
  await page.goto('https://revivepropertyco.au');
  await page.click('text=Book Now');
  await expect(page).toHaveURL(/.*BookingPage/);
});
```

**Error Testing:**
No explicit error testing patterns exist. The E2E tests verify happy-path only.

**Wait Strategies:**
```typescript
// Explicit timeout for slow-loading elements
await expect(firstSlot).toBeVisible({ timeout: 10000 });
await expect(page).toHaveURL(/.*SuccessPage/, { timeout: 15000 });

// Conditional navigation with fallback
const bookNowBtn = page.getByRole('link', { name: /BOOK NOW|GET A QUOTE/i }).first();
if (await bookNowBtn.isVisible()) {
  await bookNowBtn.click();
} else {
  await page.goto('https://revivepropertyco.au/BookingPage');
}
```

**Console Logging in Tests:**
Tests include extensive `console.log()` statements for debugging progress:
```typescript
console.log('Navigating to live site...');
console.log('Filling out booking form...');
console.log('Submitting booking...');
console.log('Test passed successfully!');
```

## Adding New Tests

**New E2E test:**
1. Create `tests/your-feature.spec.ts`
2. Follow Playwright pattern: `import { test, expect } from '@playwright/test'`
3. Target `baseURL` via `page.goto('/')` (relative) instead of hardcoded production URL
4. Run: `npx playwright test your-feature`

**New unit test (when Vitest is added):**
1. Install: `npm install -D vitest @testing-library/react @testing-library/jest-dom`
2. Create co-located test: `services/crmService.test.ts`
3. Run: `npx vitest`

**New SEO verification script:**
1. Create `tests/test-seo-wp{N}.cjs`
2. Follow existing pattern with `check()` helper and `passed`/`failed` counters
3. Run: `node tests/test-seo-wp{N}.cjs`

## Known Test Gaps

**Untested areas:**
- All service files (`services/*.ts`) — no unit tests for API client logic
- All server API routes (`server/api/*.cjs`) — no integration tests
- Auth flow (`contexts/AuthContext.tsx`) — login/logout untested
- Chat widget (`components/ChatWidget.tsx`) — AI interaction untested
- Form validation (`BookingPage.tsx`) — field validation untested
- Calendar picker (`components/CalendarPicker.tsx`) — date selection logic untested
- Error handling paths — no negative test cases

**Priority improvements:**
1. Add Vitest for unit testing service layer
2. Add API integration tests for server routes
3. Fix E2E tests to use relative URLs instead of hardcoded production URLs
4. Add component tests for complex UI components (BookingPage, AdminDashboard)

---

*Testing analysis: 2026-04-12*
