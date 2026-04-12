# Coding Conventions

**Analysis Date:** 2026-04-12

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension — `ChatWidget.tsx`, `CalendarPicker.tsx`, `ProtectedRoute.tsx`
- Pages: PascalCase with `Page` suffix in `.tsx` — `LandingPage.tsx`, `BookingPage.tsx`, `AdminDashboard.tsx`
- Services: camelCase with `Service` suffix in `.ts` — `crmService.ts`, `emailService.ts`, `geminiService.ts`
- Server API routes: kebab-case with `.cjs` extension — `bookings.cjs`, `availability.cjs`, `touchpoints.cjs`
- Server lib modules: camelCase with `.cjs` — `database.cjs`, `email.cjs`, `queue.cjs`
- Custom hooks: camelCase with `use` prefix — `usePageSEO.ts`
- Config files: camelCase `.ts` — `seoConfig.ts`, `vite.config.ts`
- Test files: kebab-case with descriptive names — `e2e-live-test.spec.ts`, `test-seo-wp9.cjs`

**Functions:**
- Exported service functions: camelCase — `getLeads()`, `updateLead()`, `sendMessageToGemini()`
- Event handlers: camelCase with `handle` prefix — `handleBook()`, `handleCreateTask()`, `handleSignOut()`
- Utility/internal: camelCase — `mapLead()`, `detectAndSaveService()`, `scrollToBottom()`
- React components: PascalCase — `const ChatWidget: React.FC = () => { ... }`
- Custom hooks: camelCase with `use` prefix — `usePageSEO()`, `useAuth()`

**Variables:**
- State: camelCase via `useState` — `isMobileMenuOpen`, `selectedLead`, `formData`
- Constants: UPPER_SNAKE_CASE for env-derived values — `API_URL`, `API_KEY`, `API_BASE`
- Enums: PascalCase names, UPPER_SNAKE_CASE values — `LeadStatus.NEW`, `ServiceType.PRESSURE_WASHING`
- Records/mappings: camelCase — `priceGuides`, `serviceCodes`, `navLinks`

**Types:**
- Interfaces: PascalCase — `Lead`, `Appointment`, `ChatMessage`, `TeleQuoteSession`
- Type aliases: PascalCase — `AppointmentType`, `TouchpointType`
- Enums: PascalCase — `LeadStatus`, `ServiceType`, `QuoteStatus`
- Props interfaces: ComponentName + `Props` suffix — `ServicePageTemplateProps`, `CalendarPickerProps`, `FAQSectionProps`

## Code Style

**Formatting:**
- No formal formatter configured (no `.prettierrc`, no `biome.json`)
- Indentation: 2 spaces (consistent across codebase)
- Semicolons: Used consistently
- Trailing commas: Not used
- Quote style: Single quotes for imports and strings
- JSX: Double quotes for HTML attributes in JSX

**Linting:**
- No linter configured (no `.eslintrc`, no `eslint.config.*`)
- TypeScript strictness: Limited — no `strict: true` in tsconfig; uses `skipLibCheck: true`

**Component Declaration:**
Use `React.FC` with explicit return type annotation:
```typescript
const BookingPage: React.FC = () => {
  // ...
};
export default BookingPage;
```

For components accepting children, use inline type annotation:
```typescript
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
```

## Import Organization

**Order:**
1. React imports — `import * as React from 'react'` or `import React, { useState, useEffect } from 'react'`
2. Third-party libraries — `import { Link, useLocation } from 'react-router-dom'`
3. Local components — `import ChatWidget from '../components/ChatWidget'`
4. Local services — `import { getLeads, getAppointments } from '../services/crmService'`
5. Types — `import { Lead, Appointment, LeadStatus } from '../types'`
6. Hooks — `import { usePageSEO } from '../hooks/usePageSEO'`
7. Config — `import { SEO } from '../seoConfig'`

**Import Style:**
- Default imports: `import App from './App'`
- Named imports: `import { useState, useEffect } from 'react'`
- Mixed: `import React, { createContext, useContext } from 'react'`
- Two styles of React import coexist: `import * as React from 'react'` (older files) and `import React from 'react'` (newer files)

**Path Aliases:**
- `@/*` maps to `./*` in tsconfig.json
- **Note:** This alias is defined but NOT actually used in the codebase — all imports use relative paths like `'../services/crmService'`, `'../types'`, `'../hooks/usePageSEO'`

**No barrel files/index files** — imports target specific modules directly.

## Error Handling

**Patterns:**

Services use try/catch with fallback returns — errors are swallowed and empty/default values returned:
```typescript
export const getLeads = async (): Promise<Lead[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/crm/leads`, { headers: getAuthHeader() });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) return [];
    const data = await response.json();
    return data.map(mapLead);
  } catch {
    return [];
  }
};
```

Write operations throw errors for caller to handle:
```typescript
export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead> => {
  try {
    // ... fetch
    if (!response.ok || !contentType.includes('application/json')) throw new Error('API unavailable');
    return mapLead(data);
  } catch (e) {
    throw new Error('Failed to update lead');
  }
};
```

API responses validate content-type before parsing:
```typescript
const contentType = response.headers.get('content-type') || '';
if (!response.ok || !contentType.includes('application/json')) return [];
```

Components catch errors and update UI state:
```typescript
try {
  const result = await submitBooking(data);
  if (result.success) {
    navigate('/success', { state: { ... } });
  } else {
    setErrorMessage(result.error || 'Failed to create booking.');
  }
} catch (e) {
  setErrorMessage('Network error.');
  console.error('Booking error:', e);
}
```

**Error logging:** `console.error()` throughout — no structured logging framework.

**User-facing errors:** Displayed via state-managed error messages, never raw error objects.

## Logging

**Framework:** `console` methods only — no logging library.

**Patterns:**
- `console.error()` for caught errors in catch blocks
- `console.log()` with styled output for email simulation in `services/emailService.ts`
- `console.info()` for informational messages like simulated booking references
- `console.warn()` for non-critical failures like AI image generation

**Server-side:**
- Request logging via Express middleware in `server/index.cjs`:
  ```javascript
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
  ```
- Structured error responses with `error` and optional `details` fields

## Comments

**When to Comment:**
- JSDoc-style block comments on exported functions and API route handlers
- Inline comments for non-obvious logic (e.g., sliding window truncation, fallback behavior)
- Section labels in JSX using `{/* Comment */}` syntax for visual organization

**JSDoc/TSDoc:**
- Used on service functions: `/** Get all quotes */`, `/** Validate booking input */`
- Not used on React components — type inference via TypeScript interfaces serves as documentation
- Used on server route handlers: `/** POST /api/bookings - Create a new booking */`

**JSX Section Comments:**
Widely used to break up large JSX renders:
```tsx
{/* Trust Strip */}
{/* Pricing */}
{/* Scheduling - Industrial Grid */}
{/* Left Column: Form Flow */}
```

## Function Design

**Size:** Large by convention — pages and components are monolithic. `BookingPage.tsx` is 573 lines, `AdminDashboard.tsx` is 589 lines. Business logic, state, and rendering coexist in single component functions.

**Parameters:** Objects for configuration, primitives for simple values. Props interfaces defined inline or co-located.

**Return Values:**
- Services return typed Promises — `Promise<Lead[]>`, `Promise<Quote | null>`, `Promise<boolean>`
- Components return JSX directly (no wrapping div convention — each component decides)
- API endpoints return JSON with `{ success, error?, details? }` envelope

## Module Design

**Exports:**
- Default exports for React components: `export default LandingPage`
- Named exports for service functions: `export const getLeads = async () => { ... }`
- Named exports for types: `export interface Lead { ... }`, `export enum LeadStatus { ... }`
- Named exports for hooks: `export function usePageSEO() { ... }`
- Some modules export both named types and default components: `FAQSection.tsx` exports both `FAQItem` interface and default component

**Barrel Files:** Not used. Each consumer imports directly from the source module.

**Server modules:** CommonJS (`module.exports`, `require()`) in `.cjs` files.

## State Management

**Pattern:** React `useState` exclusively — no external state management library.

**Context:** Single context (`AuthContext`) for authentication state only.

**Form State:** Object in single `useState`:
```typescript
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  email: '',
  // ...
});
```
Updated via spread: `setFormData({...formData, firstName: e.target.value})`.

**Async State:** Loading/error/success pattern using multiple state variables:
```typescript
const [loading, setLoading] = useState(true);
const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
const [errorMessage, setErrorMessage] = useState<string>('');
```

## Environment Variables

**Client-side (Vite):** Accessed via `import.meta.env.VITE_*` or `import.meta.env.PROD`:
```typescript
const API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:3001';
```

**Server-side:** Accessed via `process.env.*` after `dotenv.config()`.

**Convention:** Feature flag pattern — check for env var presence and provide fallback:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://api.z.ai/api/coding/paas/v4';
```

## API Client Patterns

**Base URL:** Environment-dependent — production uses `https://revivepropertyco.au`, development uses `http://localhost:3001`.

**Auth Header:** Retrieved from `localStorage` via helper:
```typescript
const getAuthHeader = () => {
  const token = localStorage.getItem('revive_admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
```

**Content-Type Validation:** Every response is checked for `application/json` before parsing.

**DB Mapping:** snake_case → camelCase mapper functions:
```typescript
const mapLead = (dbLead: any): Lead => ({
  id: dbLead.id,
  firstName: dbLead.first_name,
  lastName: dbLead.last_name,
  // ...
});
```

## Styling Conventions

**Framework:** Tailwind CSS v4 with `@tailwindcss/postcss`.

**Pattern:** Utility classes exclusively — no CSS modules, no styled-components, no custom CSS classes (except `scrollbar-hide` in `index.css`).

**Design System Colors (hardcoded in Tailwind classes):**
- `#121212` — Primary dark / hero backgrounds
- `#36453B` — Accent green / active states
- `#FDFCFB` — Page background
- `#F8F7F4` — Section background
- `#F9F9F7` — Subtle background

**Typography:** Inter font family. `font-black` (900 weight) used extensively. `uppercase` and `tracking-[Xem]` for architectural feel.

**Layout:** `max-w-7xl mx-auto px-6` for page content width. CSS Grid (`grid-cols-12`) for complex layouts.

## SEO Pattern

Every page uses the `usePageSEO` hook with config from `seoConfig.ts`:
```typescript
const LandingPage: React.FC = () => {
  usePageSEO(SEO.home);
  // ...
};
```

Hidden `<h1>` for SEO when visual heading differs:
```tsx
<h1 className="sr-only">Premium Property Maintenance Canberra | ...</h1>
```

Private routes use `noindex: true` in SEO config.

---

*Convention analysis: 2026-04-12*
