# Billing Implementation Research: Per-Module SaaS

**Project:** Revive Property Co — Modular Trade SaaS Platform
**Researched:** 2026-04-20
**Stack:** Node.js/Express, PostgreSQL, React
**Modules:** hipages leads, AI quotes, AI SEO, AI content, competitor analysis

---

## 1. Pricing Models

### Per-Module Flat Rate vs Usage-Based vs Hybrid

**Recommendation: Per-module flat rate with optional usage caps.**

| Model | Pros | Cons | Fit |
|-------|------|------|-----|
| Flat rate per module | Predictable, easy to sell, simple billing | Doesn't capture heavy usage value | Best for this use case |
| Usage-based | Revenue scales with value delivered | Unpredictable for customer, harder to sell | Good for AI content volume |
| Hybrid | Captures both | Complex invoicing, harder UX | Consider for AI content only |

**Rationale for flat rate:**
Trade service businesses (plumbers, painters, electricians) are unsophisticated SaaS buyers. Predictable monthly costs lower signup friction dramatically. "hipages leads module: $49/mo" is a one-sentence pitch. "We charge $0.02 per lead retrieved, $0.001 per AI token consumed" kills conversions.

**Exception — AI content module:** If the AI content module involves large LLM calls (long-form SEO articles, competitor reports), a usage cap + overage model makes sense: flat rate includes N credits/month, overages charged at $X per additional credit. This protects your margins without exposing customers to unbounded bills.

**Recommended pricing structure:**
- Base subscription (platform access): $0 or small fee ($29/mo)
- hipages leads scraper: $49/mo
- AI quote engine: $39/mo
- AI SEO module: $59/mo
- AI content module: $49/mo (includes 50 content pieces/mo, $1 each after)
- Competitor analysis: $49/mo
- Bundle discount: 20% off when 3+ modules active

---

## 2. Stripe Integration

### Products and Prices Setup

Create one Stripe Product per module. Each product gets one or more Prices (monthly, annual).

```
stripe.products.create({ name: 'hipages Leads Scraper', metadata: { module: 'hipages_leads' } })
stripe.products.create({ name: 'AI Quote Engine',       metadata: { module: 'ai_quotes' } })
stripe.products.create({ name: 'AI SEO Module',         metadata: { module: 'ai_seo' } })
stripe.products.create({ name: 'AI Content Module',     metadata: { module: 'ai_content' } })
stripe.products.create({ name: 'Competitor Analysis',   metadata: { module: 'competitor_analysis' } })
```

Then create Prices attached to each product:

```javascript
// Flat rate monthly price for hipages module
stripe.prices.create({
  product: 'prod_hipages_xxx',
  unit_amount: 4900,       // $49.00 AUD
  currency: 'aud',
  recurring: { interval: 'month' },
  lookup_key: 'hipages_leads_monthly',  // use for entitlement checks
})
```

**Critical:** Use `lookup_key` on prices. This lets you reference prices by name in code without hardcoding price IDs, which change between test and production.

### Subscription Items for Add-On Modules

All active modules for a tenant live as items on a single subscription. Stripe supports up to 20 items per subscription — more than enough.

```javascript
// Create subscription with initial modules
const subscription = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [
    { price: 'price_hipages_monthly' },
    { price: 'price_ai_quotes_monthly' },
  ],
  proration_behavior: 'create_prorations',
  metadata: { tenant_id: tenantId },
})
```

### Adding a Module Mid-Cycle

```javascript
await stripe.subscriptions.update(subscriptionId, {
  items: [
    { price: 'price_ai_seo_monthly' },  // new item to add
  ],
  proration_behavior: 'always_invoice',  // charge immediately for upgrade
})
```

### Removing a Module Mid-Cycle

```javascript
// First, retrieve the subscription to find the item ID
const subscription = await stripe.subscriptions.retrieve(subscriptionId)
const itemToRemove = subscription.items.data.find(
  item => item.price.lookup_key === 'ai_seo_monthly'
)

await stripe.subscriptions.update(subscriptionId, {
  items: [
    { id: itemToRemove.id, deleted: true },
  ],
  proration_behavior: 'create_prorations',  // credit on next invoice
})
```

### Metered Billing for AI Content (if usage-based)

Since API version 2025-03-31.basil, metered billing requires a Meter object. The legacy usage records API is removed.

```javascript
// Create a meter
const meter = await stripe.billing.meters.create({
  display_name: 'AI Content Credits',
  event_name: 'ai_content_credit_used',
  default_aggregation: { formula: 'sum' },
})

// Create a metered price linked to the meter
const price = await stripe.prices.create({
  currency: 'aud',
  recurring: { interval: 'month', meter: meter.id },
  unit_amount_decimal: '100',  // $1.00 per credit
  product: 'prod_ai_content_xxx',
})

// Report usage (async, write to DB first then sync)
await stripe.billing.meterEvents.create({
  event_name: 'ai_content_credit_used',
  payload: {
    stripe_customer_id: customer.stripe_customer_id,
    value: '1',
  },
})
```

**Best practice for usage reporting:** Never call the Stripe meter event API inline with user actions. Write to your own database first, then sync to Stripe asynchronously via a queue. This gives you retry logic and prevents user-facing failures if Stripe is slow.

### Checkout Session Pattern

Use Checkout for initial subscription creation (handles card collection, SCA, receipts):

```javascript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: stripeCustomerId,  // pre-create customer if you have their email
  line_items: selectedModulePriceIds.map(priceId => ({ price: priceId, quantity: 1 })),
  subscription_data: {
    trial_period_days: 14,
    metadata: { tenant_id: tenantId },
  },
  success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/billing/cancelled`,
})
```

---

## 3. Entitlement System

### Database Schema

Use a `tenant_modules` table as your source of truth. Stripe is the billing authority; your DB is the entitlement authority. Keep them in sync via webhooks.

```sql
-- Core tenants table
CREATE TABLE tenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Module catalog (populated once at deploy time)
CREATE TABLE modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,   -- 'hipages_leads', 'ai_quotes', etc.
  name        TEXT NOT NULL,
  stripe_price_id TEXT,              -- production price ID
  stripe_price_id_test TEXT,         -- test mode price ID
  description TEXT
);

-- Active entitlements (webhook-maintained)
CREATE TABLE tenant_modules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  module_key    TEXT NOT NULL,          -- matches modules.key
  status        TEXT NOT NULL DEFAULT 'active',
                                        -- 'active', 'trialling', 'cancelled', 'past_due'
  activated_at  TIMESTAMPTZ DEFAULT now(),
  expires_at    TIMESTAMPTZ,            -- NULL = no expiry (active subscription)
  trial_ends_at TIMESTAMPTZ,
  stripe_subscription_item_id TEXT,     -- link back to Stripe item
  metadata      JSONB DEFAULT '{}',

  UNIQUE(tenant_id, module_key)
);

-- Usage tracking (for metered modules)
CREATE TABLE module_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),
  module_key  TEXT NOT NULL,
  event_type  TEXT NOT NULL,  -- 'credit_used', 'api_call', etc.
  quantity    INTEGER DEFAULT 1,
  synced_to_stripe BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON module_usage(tenant_id, module_key, synced_to_stripe);
```

### Checking Access at Runtime

**Middleware pattern for Express:**

```javascript
// middleware/requireModule.js
async function requireModule(moduleKey) {
  return async (req, res, next) => {
    const tenantId = req.tenant.id  // set by auth middleware

    const entitlement = await getEntitlement(tenantId, moduleKey)
    if (!entitlement || entitlement.status !== 'active' && entitlement.status !== 'trialling') {
      return res.status(402).json({
        error: 'module_not_active',
        module: moduleKey,
        message: `${moduleKey} module is not active on your plan`,
      })
    }
    next()
  }
}

// Usage in routes
app.get('/api/hipages/leads', requireModule('hipages_leads'), async (req, res) => { ... })
app.post('/api/ai/quote',     requireModule('ai_quotes'),     async (req, res) => { ... })
```

### Caching Entitlements

Entitlement checks on every API call without caching will hammer the database. Two options:

**Option A: In-memory cache with short TTL (simplest — start here)**

```javascript
// services/entitlementCache.js
const cache = new Map()  // tenantId:moduleKey -> { status, expiresAt, cachedAt }
const TTL_MS = 60_000    // 1 minute

async function getEntitlement(tenantId, moduleKey) {
  const cacheKey = `${tenantId}:${moduleKey}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < TTL_MS) {
    return cached
  }

  const row = await db.query(
    'SELECT status, expires_at, trial_ends_at FROM tenant_modules WHERE tenant_id = $1 AND module_key = $2',
    [tenantId, moduleKey]
  )
  const result = row.rows[0] || null
  cache.set(cacheKey, { ...result, cachedAt: Date.now() })
  return result
}

// Invalidate on webhook (called by webhook handler)
function invalidateEntitlement(tenantId, moduleKey) {
  cache.delete(`${tenantId}:${moduleKey}`)
}
```

**Option B: Redis with prefixed keys (when you have multiple Node processes)**

Key pattern: `entitlement:{tenantId}:{moduleKey}` → JSON stringified status object, TTL 60s.

Invalidate on webhook by `DEL entitlement:{tenantId}:*` or per-module key.

---

## 4. Feature Flags + Billing: Webhook-Driven Updates

### The Core Principle

Stripe is the source of truth for payment state. Your DB is the source of truth for entitlements. Webhooks bridge them. Never query Stripe at runtime to check module access — always check your own DB.

### Webhook Handler Architecture

```javascript
// routes/webhooks/stripe.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Acknowledge immediately — Stripe retries on non-200
  res.json({ received: true })

  // Process asynchronously to avoid webhook timeouts
  processStripeEvent(event).catch(console.error)
})

async function processStripeEvent(event) {
  switch (event.type) {

    // Primary entitlement event — use this as main provisioning trigger
    case 'entitlements.active_entitlement_summary.updated': {
      const { customer, entitlements } = event.data.object
      await syncEntitlementsFromStripe(customer, entitlements.data)
      break
    }

    // Subscription-level events — use for status updates
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const subscription = event.data.object
      await updateSubscriptionStatus(subscription)
      break
    }

    // Provisioning trigger — payment succeeded
    case 'invoice.paid': {
      const invoice = event.data.object
      if (invoice.subscription) {
        await activateSubscriptionModules(invoice.subscription)
      }
      break
    }

    // Deprovisioning trigger — payment failed after retries exhausted
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      await deactivateAllModules(subscription.metadata.tenant_id)
      break
    }

    // Dunning — subscription is past_due but not yet cancelled
    case 'invoice.payment_failed': {
      const invoice = event.data.object
      await markSubscriptionPastDue(invoice.subscription)
      break
    }
  }
}
```

### Syncing Entitlements from Stripe

```javascript
async function syncEntitlementsFromStripe(stripeCustomerId, entitlementData) {
  const tenant = await db.query(
    'SELECT id FROM tenants WHERE stripe_customer_id = $1',
    [stripeCustomerId]
  )
  if (!tenant.rows[0]) return

  const tenantId = tenant.rows[0].id
  const activeModuleKeys = new Set(entitlementData.map(e => e.lookup_key))

  // Deactivate modules no longer in entitlement list
  await db.query(
    `UPDATE tenant_modules
     SET status = 'cancelled', expires_at = now()
     WHERE tenant_id = $1 AND module_key != ALL($2) AND status = 'active'`,
    [tenantId, [...activeModuleKeys]]
  )

  // Upsert active modules
  for (const lookupKey of activeModuleKeys) {
    await db.query(
      `INSERT INTO tenant_modules (tenant_id, module_key, status, activated_at)
       VALUES ($1, $2, 'active', now())
       ON CONFLICT (tenant_id, module_key)
       DO UPDATE SET status = 'active', expires_at = NULL`,
      [tenantId, lookupKey]
    )
    invalidateEntitlement(tenantId, lookupKey)
  }
}
```

**Note on Stripe Entitlements API (native):** Stripe has a native Entitlements API (2024+) where you map features to products and query `customer.entitlements.list()`. It works but is described by practitioners as "overly simplistic" — it's binary (has/doesn't have), with no nuance for trial states, grace periods, or usage caps. Building a thin entitlement layer in your own DB gives you full control. Use Stripe's `entitlements.active_entitlement_summary.updated` webhook event to drive your DB updates, but don't rely on Stripe's API for runtime access checks.

---

## 5. Proration

### How Stripe Handles Mid-Cycle Changes

Stripe prorates automatically based on the remaining time in the current billing period, calculated to the second.

**proration_behavior options:**

| Value | Behavior | When to Use |
|-------|----------|-------------|
| `create_prorations` (default) | Creates proration items, charges on next invoice | Module removal — credit next bill |
| `always_invoice` | Calculates proration AND immediately generates invoice | Module addition — charge now |
| `none` | No proration, full price on next cycle | Rarely useful for add-ons |

**Recommended per action:**
- **User adds a module:** `always_invoice` — charge immediately so the new module is active now
- **User removes a module:** `create_prorations` — credit appears on next invoice, no immediate charge

### Previewing Proration Before Committing

Always show the user what they'll be charged before applying changes. Use the Invoice Preview API:

```javascript
// GET /api/billing/preview-change
async function previewModuleChange(req, res) {
  const { tenantId, addModuleKeys = [], removeModuleKeys = [] } = req.body
  const subscription = await getSubscriptionForTenant(tenantId)
  const prorationDate = Math.floor(Date.now() / 1000)

  // Build the items array representing the post-change state
  const items = subscription.items.data
    .filter(item => !removeModuleKeys.includes(item.price.lookup_key))
    .map(item => ({ id: item.id }))  // existing items to keep

  for (const moduleKey of addModuleKeys) {
    const price = await getPriceByLookupKey(`${moduleKey}_monthly`)
    items.push({ price: price.id })
  }

  const upcomingInvoice = await stripe.invoices.createPreview({
    customer: subscription.customer,
    subscription: subscription.id,
    subscription_items: items,
    subscription_proration_behavior: 'always_invoice',
    subscription_proration_date: prorationDate,
  })

  res.json({
    immediateCharge: upcomingInvoice.amount_due,
    nextInvoiceTotal: upcomingInvoice.total,
    prorationDate,  // CRITICAL: pass this back and use it in the actual update call
  })
}
```

**Critical:** Pass `prorationDate` from the preview response into the actual subscription update. This locks the proration to the exact second previewed, preventing the amount from changing between preview and charge.

```javascript
// When user confirms the change
await stripe.subscriptions.update(subscriptionId, {
  items: newItems,
  proration_behavior: 'always_invoice',
  proration_date: prorationDate,  // from preview response
})
```

### Communicating Proration to Users

Present a breakdown before confirming:
- "Adding AI SEO module: $32.26 billed today (prorated for 20 remaining days)"
- "Removing hipages leads: $16.13 credit on your next invoice"
- "Your next invoice on May 15: $127.50"

---

## 6. Self-Service UI

### Stripe Customer Portal vs Custom UI

**Recommendation: Custom module selector UI + Stripe Customer Portal for invoices/payment methods only.**

| Concern | Customer Portal | Custom UI |
|---------|-----------------|-----------|
| Module add/remove | Limited (shows product catalog) | Full control, show proration previews |
| Payment methods | Excellent | More work |
| Invoice history | Excellent | More work |
| Trial state | Not shown clearly | Build exactly what you need |
| Branding/UX | Generic Stripe look | Match your product |
| Dev effort | 1 hour | 2-3 days |

The Customer Portal is excellent for the "manage payment method" and "download invoices" use cases. It is inadequate as the primary module management interface because it doesn't show proration previews, doesn't surface trial countdowns, and doesn't let you present custom upgrade messaging.

### Billing Dashboard Component Structure

```
BillingPage
  ├── CurrentPlanCard
  │     ├── Active modules list with status badges
  │     ├── Next billing date + amount
  │     └── "Manage payment method" → Customer Portal link
  │
  ├── ModuleSelector
  │     ├── ModuleCard (per module)
  │     │     ├── Name, description, price
  │     │     ├── Active/inactive toggle
  │     │     └── Trial badge if in trial
  │     └── ProrationPreview (shows on change)
  │           ├── Immediate charge breakdown
  │           └── Next invoice estimate
  │
  ├── UsageMetrics (for metered modules)
  │     └── Credits used this month / limit
  │
  └── InvoiceHistory → Stripe Customer Portal link
```

### Launch Customer Portal

```javascript
// POST /api/billing/portal
async function createPortalSession(req, res) {
  const tenant = await getTenant(req.user.tenantId)
  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripe_customer_id,
    return_url: `${process.env.BASE_URL}/billing`,
  })
  res.json({ url: session.url })
}
```

Open in same tab (not popup) for better mobile experience and simpler OAuth flow management.

---

## 7. Trial & Onboarding

### Free Trial Architecture

**Recommendation: 14-day free trial on first subscription, no credit card required for trial start. Require card before trial ends.**

```javascript
// Create subscription with trial — no card required initially
const subscription = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: selectedModulePrices.map(priceId => ({ price: priceId })),
  trial_period_days: 14,
  payment_settings: {
    save_default_payment_method: 'on_subscription',
  },
  trial_settings: {
    end_behavior: {
      missing_payment_method: 'pause',  // pause rather than cancel on missing card
    },
  },
})
```

Using `missing_payment_method: 'pause'` instead of `cancel` gives you a grace period to collect the card without immediately cutting off access.

### Per-Module Trial Offers (advanced)

For onboarding new tenants to individual modules post-signup, use the Trial Offer API to attach a temporary free price to specific subscription items:

```javascript
// Create a trial offer for the AI SEO module only
const trialOffer = await stripe.billing.trialOffers.create({
  name: '7-day AI SEO trial',
  applies_to: { products: [aiSeoProductId] },
  end_behavior: { missing_payment_method: 'pause' },
  recurring_pricing: { interval: { type: 'month' } },
  trial_duration: { type: 'relative', interval_count: 7, interval: 'day' },
})
```

This is useful for "try this module free for 7 days" CTAs on the billing page without needing a coupon or price override.

### Trial Conversion Flow

```
Signup → Select modules → Start 14-day trial (no card)
  ↓
Day 11: Email "Trial ends in 3 days — add payment method"
  ↓
Day 14: stripe sends customer.subscription.trial_will_end (3 days before)
  ↓
Day 14: In-app banner "Trial ending soon" with one-click payment method add
  ↓
Trial end: subscription pauses if no card (access suspended, not deleted)
  ↓
User adds card → subscription resumes automatically
  ↓
30-day grace: if still no card → cancel subscription, mark churned
```

### Webhook Events for Trial Management

| Event | Action |
|-------|--------|
| `customer.subscription.trial_will_end` | Fires 3 days before trial end. Send email, show in-app banner. |
| `customer.subscription.updated` (status → `paused`) | Revoke module access, show payment collection flow. |
| `customer.subscription.updated` (status → `active`) | Re-grant module access. |

---

## 8. Implementation Order

**Build in this sequence for fastest path to first paying customer:**

### Phase 1: Entitlements Without Billing (Week 1)

Goal: Module access control works, even if manually managed.

1. Create `tenants`, `modules`, `tenant_modules` tables in PostgreSQL
2. Seed `modules` table with all 5 module definitions
3. Build `requireModule(moduleKey)` middleware
4. Apply middleware to all module-specific API routes
5. Manually toggle `tenant_modules` rows in DB to test gating
6. Build tenant context into auth middleware (set `req.tenant` from JWT/session)

This gives you working feature gates before Stripe exists.

### Phase 2: Stripe Products + Checkout (Week 2)

Goal: Accept first payment.

1. Create Stripe products and prices (in test mode) for all 5 modules
2. Store price IDs in `modules` table
3. Build `/api/billing/create-checkout` endpoint
4. Build simple module selector UI (checkboxes, no proration yet)
5. Handle `invoice.paid` webhook → activate modules in `tenant_modules`
6. Handle `customer.subscription.deleted` webhook → deactivate modules

At this point you can take real money.

### Phase 3: Subscription Management (Week 3)

Goal: Self-service add/remove modules.

1. Build proration preview endpoint
2. Build `/api/billing/update-modules` endpoint (add/remove subscription items)
3. Build billing dashboard UI with module cards and toggle switches
4. Wire up proration preview UX ("You'll be charged $32 today")
5. Handle `entitlements.active_entitlement_summary.updated` webhook for sync
6. Launch Stripe Customer Portal for invoice/payment method management

### Phase 4: Trials + Dunning (Week 4)

Goal: Reduce friction at signup and protect against churn.

1. Enable 14-day trial on checkout
2. Handle `customer.subscription.trial_will_end` → in-app + email notification
3. Implement pause logic for missing payment method
4. Set up Smart Retries in Stripe Dashboard (no code required)
5. Implement `invoice.payment_failed` handler → show payment failure banner

### Phase 5: Usage Billing for AI Content (Optional, later)

Only if the AI content module requires metered billing:

1. Create Meter in Stripe
2. Migrate AI content price to metered
3. Implement async usage reporting queue (write to `module_usage`, sync to Stripe)
4. Build usage meter UI component

---

## Sources

- [Stripe: Set product or subscription quantities (multiple products)](https://docs.stripe.com/billing/subscriptions/multiple-products)
- [Stripe: Modify subscriptions](https://docs.stripe.com/billing/subscriptions/change)
- [Stripe: Prorations](https://docs.stripe.com/billing/subscriptions/prorations)
- [Stripe: Create a preview invoice](https://docs.stripe.com/api/invoices/create_preview)
- [Stripe: Entitlements](https://docs.stripe.com/billing/entitlements)
- [Stripe: Active Entitlement API Reference](https://docs.stripe.com/api/entitlements/active-entitlement)
- [Stripe: Using webhooks with subscriptions](https://docs.stripe.com/billing/subscriptions/webhooks)
- [Stripe: Configure trial offers on subscriptions](https://docs.stripe.com/billing/subscriptions/trials)
- [Stripe: Integrate the customer portal](https://docs.stripe.com/customer-management/integrate-customer-portal)
- [Stripe: Integrate a SaaS business on Stripe](https://docs.stripe.com/saas)
- [Stripe: Implement advanced usage-based billing](https://docs.stripe.com/billing/subscriptions/usage-based/pricing-plans)
- [Multi-Tenant Billing Architecture — Dodo Payments](https://dodopayments.com/blogs/multi-tenant-billing-architecture)
- [Stripe Metered Billing Guide for SaaS (2026)](https://www.buildmvpfast.com/blog/stripe-metered-billing-implementation-guide-saas-2026)
