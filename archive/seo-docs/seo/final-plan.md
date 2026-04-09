# Revive Property Co. — Final Production Readiness Plan

> **Site:** https://revivepropertyco.au
> **Project:** `razor-edge:/opt/homelab/apps/revivepropertyco/`
> **Date:** 9 April 2026
> **Status:** Live but not indexed or discoverable

This document is the **single source of truth** for getting the site to 100% production readiness. It merges findings from 4 independent audits and contains every task needed, sequenced by priority.

Use this to break the work into tickets/sprints.

---

## Source Plans

| Plan | Key Contribution |
|---|---|
| [Antigravity audit](file:///home/rouge/.gemini/antigravity/brain/6ec24944-33ff-4da8-bbb8-c3f0a7e5de5b/artifacts/seo_plan.md) | Live site crawl, identified hash-routing as #1 blocker, created implementation files |
| [ChatGPT audit](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/other-plans/chatgpt.md) | Crawlability failure analysis, backlink strategy, service-area page recommendations |
| [Gemini audit](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/other-plans/gemini.txt) | E-E-A-T framework, AEO (Answer Engine Optimisation), Australian directory matrix with DA scores, social media content pillars, Core Web Vitals benchmarks |
| [Detailed SEO plan](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/other-plans/revivepropertyco-seo-plan.md) | Precise page-by-page metadata specs, private route protection, GA4 conversion tracking, Search Console monitoring cadence |

---

## Implementation Files (Ready to Deploy)

These files were created during the Antigravity audit and are ready to copy to the project:

| File | Purpose |
|---|---|
| [sitemap.xml](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/sitemap.xml) | XML sitemap with all 8 public routes |
| [robots.txt](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/robots.txt) | Clean robots.txt — blocks admin, AI bots; declares sitemap |
| [index.html](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/index.html) | Full index.html with meta tags, OG, geo tags, JSON-LD (LocalBusiness + Organization) |
| [usePageSEO.jsx](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/hooks/usePageSEO.jsx) | React hook for per-page title, description, canonical, OG tags |
| [seoConfig.js](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/seoConfig.js) | Centralised SEO data for all 9 public pages |
| [SEOSchemas.jsx](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/components/SEOSchemas.jsx) | FAQSchema and ServiceSchema components for rich results |
| [INTEGRATION_EXAMPLES.jsx](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/INTEGRATION_EXAMPLES.jsx) | Copy-paste integration patterns for each page |
| [DEPLOYMENT_GUIDE.md](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/DEPLOYMENT_GUIDE.md) | Step-by-step deployment: router migration, server config, verification |

---

## Work Package 1 — Crawlability & Routing (CRITICAL — Do First)

> [!CAUTION]
> Without these fixes, *nothing else matters*. Every plan identified this as the #1 blocker.

### Task 1.1: Switch HashRouter → BrowserRouter
- **What:** Change `HashRouter` to `BrowserRouter` in `src/main.jsx` (or wherever the root render lives)
- **Why:** Hash routes (`/#/pressure-washing`) are invisible to Google. Googlebot ignores everything after `#`. All 4 audits flagged this.
- **How:** See [DEPLOYMENT_GUIDE.md](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/DEPLOYMENT_GUIDE.md) §1
- **Effort:** Low (1 line change + server config)
- **Done when:** `https://revivepropertyco.au/pressure-washing` loads the pressure washing page directly (no `#`)

### Task 1.2: Configure SPA Fallback on Server
- **What:** Ensure the web server returns `index.html` for all unknown routes
- **Why:** Without this, direct links to `/pressure-washing` will return 404
- **How:** Add `try_files $uri $uri/ /index.html;` to Nginx, or equivalent for Caddy/Docker. See [DEPLOYMENT_GUIDE.md](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/DEPLOYMENT_GUIDE.md) §2
- **Effort:** Low
- **Done when:** All routes return 200 when accessed directly via URL bar

### Task 1.3: Set Up 301 Redirects from Hash URLs
- **What:** Redirect old `/#/page` URLs to `/page` for anyone who bookmarked or shared them
- **Why:** Preserves any existing link equity; prevents broken bookmarks
- **Effort:** Low–Medium (client-side redirect in app, or server-level)
- **Done when:** Visiting `/#/pressure-washing` redirects to `/pressure-washing`

### Task 1.4: Fix robots.txt
- **What:** Replace the broken robots.txt (currently serves HTML after the directives) with the clean version
- **How:** Copy [robots.txt](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/robots.txt) to `public/robots.txt`. Ensure it is NOT caught by the SPA fallback — must be served as raw `text/plain`
- **Effort:** Low
- **Done when:** `curl -s https://revivepropertyco.au/robots.txt` returns only text, no HTML

### Task 1.5: Create sitemap.xml
- **What:** Serve a valid XML sitemap at `/sitemap.xml`
- **How:** Copy [sitemap.xml](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/sitemap.xml) to `public/sitemap.xml`. Ensure it is NOT caught by the SPA fallback — must be served as `application/xml`
- **Effort:** Low
- **Done when:** `curl -s https://revivepropertyco.au/sitemap.xml` returns valid XML

### Task 1.6: Fix Canonical Domain — www Redirect
- **What:** `https://www.revivepropertyco.au` currently returns 404. Set up 301 redirects for all variants.
- **Why:** Prevents split ranking signals between www and non-www
- **Redirects needed:**
  - `http://revivepropertyco.au` → `https://revivepropertyco.au`
  - `http://www.revivepropertyco.au` → `https://revivepropertyco.au`
  - `https://www.revivepropertyco.au` → `https://revivepropertyco.au`
- **How:** Configure in Cloudflare Page Rules or DNS settings
- **Effort:** Low
- **Done when:** All 3 variants return 301 to the canonical domain

---

## Work Package 2 — Metadata & Structured Data

### Task 2.1: Add Unique Title Tags Per Page
- **What:** Replace the single `<title>Revive Property Co.</title>` with unique, keyword-rich titles for each route
- **How:** Integrate [usePageSEO.jsx](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/hooks/usePageSEO.jsx) + [seoConfig.js](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/seoConfig.js) into each page component. See [INTEGRATION_EXAMPLES.jsx](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/INTEGRATION_EXAMPLES.jsx)
- **Effort:** Medium (touch every page component)
- **Done when:** Each page shows a unique, descriptive title in the browser tab

### Task 2.2: Add Meta Descriptions Per Page
- **What:** Add `<meta name="description">` per route
- **How:** Already implemented via `usePageSEO` + `seoConfig.js`
- **Effort:** Included in 2.1
- **Done when:** View Source on each page shows a unique description

### Task 2.3: Add Canonical Tags Per Page
- **What:** Add `<link rel="canonical" href="...">` per route
- **How:** Already implemented via `usePageSEO`
- **Effort:** Included in 2.1
- **Done when:** Each page has a self-referencing canonical URL

### Task 2.4: Add Open Graph + Twitter Card Tags
- **What:** Social sharing preview tags for Facebook, LinkedIn, Twitter
- **How:** Already implemented via `usePageSEO`. Also set fallback OG tags in [index.html](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/index.html)
- **Effort:** Included in 2.1
- **Done when:** Facebook Sharing Debugger shows correct preview

### Task 2.5: Create og-image.jpg
- **What:** A 1200×630px branded image for social sharing
- **Content:** Logo + hero photo + "Premium Property Maintenance — Canberra"
- **Where:** `public/og-image.jpg`
- **Effort:** Low
- **Done when:** Image exists and is referenced by OG tags

### Task 2.6: Add JSON-LD LocalBusiness Schema
- **What:** Structured data telling Google this is a local business with specific services and location
- **How:** Already included in [index.html](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/index.html) (LocalBusiness + Organization schemas)
- **Effort:** Low (copy file)
- **Done when:** Google Rich Results Test shows valid LocalBusiness entity

### Task 2.7: Add JSON-LD Service Schema Per Service Page
- **What:** `Service` structured data on each service page
- **How:** Use [SEOSchemas.jsx ServiceSchema](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/components/SEOSchemas.jsx). See [INTEGRATION_EXAMPLES.jsx](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/INTEGRATION_EXAMPLES.jsx) for copy-paste code per service
- **Effort:** Medium
- **Done when:** Rich Results Test validates Service schema on each service page

### Task 2.8: Add JSON-LD FAQ Schema Per Service Page
- **What:** `FAQPage` schema for FAQ sections (earns rich results)
- **How:** Use [SEOSchemas.jsx FAQSchema](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/components/SEOSchemas.jsx) with the pre-written FAQ content in [INTEGRATION_EXAMPLES.jsx](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/INTEGRATION_EXAMPLES.jsx)
- **Important:** Only add FAQ schema if the FAQ content is *also visible on the page* to users (Google's policy)
- **Effort:** Medium
- **Done when:** Rich Results Test shows valid FAQPage on service pages

### Task 2.9: Add Geo Meta Tags
- **What:** `geo.region`, `geo.placename`, `geo.position`, `ICBM` meta tags
- **How:** Already included in [index.html](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/index.html)
- **Effort:** Low (copy file)

---

## Work Package 3 — Google Search Console & Indexing

### Task 3.1: Create Google Search Console Property
- **What:** Register `https://revivepropertyco.au` as a URL-prefix property
- **Where:** https://search.google.com/search-console
- **Effort:** Low

### Task 3.2: Verify Domain Ownership via DNS
- **What:** Add TXT record `google-site-verification=xxx` to Cloudflare DNS
- **Effort:** Low
- **Done when:** Search Console shows "Verified"

### Task 3.3: Submit Sitemap
- **What:** In Search Console → Sitemaps → submit `sitemap.xml`
- **Prerequisite:** Task 1.5 must be done first
- **Done when:** Sitemap shows "Success" status

### Task 3.4: Request Indexing for Key Pages
- **What:** Use URL Inspection → Request Indexing for each public page
- **Pages:** `/`, `/pressure-washing`, `/regrouting`, `/garden-maintenance`, `/pool-maintenance`, `/rubbish-removal`, `/contact`, `/book`
- **Prerequisite:** Work Packages 1 & 2 should be deployed first
- **Done when:** All pages show "URL is on Google" within 2–4 weeks

### Task 3.5: Verify Bing Webmaster Tools
- **What:** Also register at https://www.bing.com/webmasters — import from Google Search Console
- **Effort:** Low

---

## Work Package 4 — Google Business Profile

### Task 4.1: Create Google Business Profile
- **Where:** https://business.google.com
- **Details:**
  - Name: `Revive Property Co.`
  - Primary category: `Property Maintenance`
  - Additional categories: `Pressure Washing Service`, `Pool Cleaning Service`, `Gardener`
  - Address: `802/2 Marcus Clarke Street, Canberra ACT 2601`
  - Service area: Canberra, Braddon, Kingston, Griffith, Deakin, Hughes, Woden Valley, Yarralumla, O'Connor
  - Phone: `02 8201 3710`
  - Website: `https://revivepropertyco.au`
  - Hours: Mon–Fri 7:00am–5:00pm
- **Effort:** Medium

### Task 4.2: Verify Business
- **What:** Complete Google's verification (postcard, phone, or email)
- **Effort:** Low (but may take 1–2 weeks for postcard)

### Task 4.3: Optimise Profile
- **What:** Upload 10+ high-quality photos (before/after, team, truck, completed work), write keyword-rich description (750 chars), add all services with descriptions, enable messaging
- **Effort:** Medium

### Task 4.4: Set Up Review Collection Workflow
- **What:** Create a direct review link and build a process to request reviews after every job
- **Review link format:** `https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`
- **Process:** Send link via SMS/email within 24 hours of job completion
- **Target:** 5+ reviews in first month, ongoing 2+ per month
- **Done when:** Process is documented and first review is collected

### Task 4.5: Begin Google Posts
- **What:** Post weekly updates — recent jobs, before/after, seasonal tips
- **Effort:** Low (ongoing)

---

## Work Package 5 — On-Page SEO & Content Quality

### Task 5.1: Optimise H1 Headings for SEO
- **What:** Current headings use branded language ("System Matrix v4.0", "Investment Framework") that is invisible to search engines
- **Fix:** Each page needs an H1 containing the primary service keyword + "Canberra"
- **Examples:**
  - Pressure washing: `<h1>Professional Pressure Washing in Canberra</h1>`
  - Regrouting: `<h1>Leaking Shower Repair & Epoxy Regrouting Canberra</h1>`
  - Garden: `<h1>Garden & Lawn Maintenance in Canberra</h1>`
  - Pool: `<h1>Pool Cleaning & Maintenance Canberra</h1>`
  - Rubbish: `<h1>Rubbish Removal & Junk Collection Canberra</h1>`
- **Approach:** Keep the branded visual headings for design, but ensure the *actual HTML* `<h1>` is keyword-focused (e.g. use `aria-hidden` visual heading + real H1 for SEO, or simply make the H1 the SEO-friendly version)
- **Effort:** Medium
- **Done when:** Each page has a single H1 with service + location keywords

### Task 5.2: Add Alt Text to All Images
- **What:** Descriptive `alt` attributes on every `<img>` — service name, location, context
- **Examples:** `alt="Pressure washing a concrete driveway in Braddon, Canberra"`
- **Effort:** Medium
- **Done when:** No images have empty or missing alt text (check via Lighthouse)

### Task 5.3: Add Internal Cross-Links Between Service Pages
- **What:** Link between related services naturally in page content
- **Examples:**
  - Pressure washing → "Also need garden cleanup? [View garden maintenance](/garden-maintenance)"
  - Regrouting → "We also offer [pressure washing](/pressure-washing) for complete bathroom transformations"
  - All service pages → link to `/book` and `/contact`
- **Also:** Add footer links to all services + contact details + business hours + service areas
- **Effort:** Medium
- **Done when:** Every service page links to at least 2 other service pages + booking page

### Task 5.4: Add Visible FAQ Sections to Service Pages
- **What:** Show actual FAQ content on each service page, not just hidden schema
- **Why:** Google policy requires FAQ schema to match visible content; also improves user experience and conversion
- **Content:** Use the FAQ questions from [INTEGRATION_EXAMPLES.jsx](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/src/INTEGRATION_EXAMPLES.jsx)
- **Effort:** Medium
- **Done when:** Each service page has 3–5 visible FAQs

### Task 5.5: Structure Content for Answer Engine Optimisation (AEO)
- **What:** Format key content to be extractable by AI search summaries and featured snippets
- **How:** Answer the main question in the first paragraph of each page; use numbered lists and clear standalone headings; structure for "Position Zero"
- **Why:** 69% of searches now result in zero clicks — content must be structured for AI extraction (Gemini plan)
- **Effort:** Medium
- **Done when:** Primary questions are answered in first 2 sentences of each service page

### Task 5.6: Update Chatbot System Prompt
- **What:** The Riv chatbot still references hash routes (`#/book`, `#/contact`)
- **Fix:** Update to `/book` and `/contact` in the system prompt
- **Effort:** Low

---

## Work Package 6 — Performance & Core Web Vitals

### Task 6.1: Remove CDN Tailwind
- **What:** Remove `<script src="https://cdn.tailwindcss.com">` from `index.html`
- **Why:** Adds ~300KB unused CSS. Google penalises slow LCP. All plans flagged this.
- **Prerequisite:** Ensure Tailwind is installed as a build-time dependency (`npm install -D tailwindcss postcss autoprefixer`)
- **Effort:** Low–Medium
- **Done when:** CDN script is removed and build still looks correct

### Task 6.2: Optimise Images
- **What:** Compress all images, convert to WebP, use descriptive filenames
- **Targets:** LCP image < 200KB, all images lazy-loaded below fold
- **Benchmark:** LCP < 2.5 seconds, INP < 200ms, CLS < 0.1
- **Effort:** Medium

### Task 6.3: Preload Fonts & Consider Self-Hosting
- **What:** Add `<link rel="preconnect">` for Google Fonts (already in [index.html](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/index.html)). Consider self-hosting Inter font for faster loads.
- **Effort:** Low

### Task 6.4: Add Favicon & App Identity
- **What:** Add `favicon.svg`, `apple-touch-icon.png`, `favicon.ico`
- **Where:** `public/`
- **Effort:** Low

### Task 6.5: Run Full Performance Audit
- **What:** Test with PageSpeed Insights (mobile + desktop), fix any remaining issues
- **Tools:** https://pagespeed.web.dev/
- **Target:** 90+ on both mobile and desktop
- **Effort:** Variable
- **Done when:** Both mobile and desktop scores are 90+

---

## Work Package 7 — Private Route Protection

### Task 7.1: Prevent Indexing of Admin/Private Routes
- **What:** Ensure these routes are NOT indexed by Google:
  - `/admin`, `/admin/regrouting`, `/admin/telequote`
  - `/login`
  - `/session/:id`
  - `/success`
- **How:** Already excluded from [robots.txt](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/robots.txt) and [sitemap.xml](file:///home/rouge/.gemini/antigravity/scratch/revivepropertyco-seo/public/sitemap.xml). Additionally add `<meta name="robots" content="noindex, nofollow">` to these pages via the `usePageSEO` hook.

> [!IMPORTANT]
> Do NOT rely only on robots.txt — it does not prevent indexing, only crawling. Use `noindex` meta tag + authentication for sensitive pages.

- **Effort:** Low
- **Done when:** Admin pages have noindex meta tag; not in sitemap

---

## Work Package 8 — Local SEO & Citations

### Task 8.1: Establish NAP Standard
- **What:** Document the exact Name, Address, Phone format to use EVERYWHERE
- **Standard:**
  - **Name:** `Revive Property Co.`
  - **Address:** `802/2 Marcus Clarke Street, Canberra ACT 2601`
  - **Phone:** `02 8201 3710`
  - **Email:** `angus@gair.com.au`
  - **Website:** `https://revivepropertyco.au`
- **Rule:** Character-for-character identical on every platform — no "St" vs "Street" variations
- **Done when:** NAP standard is documented and shared with anyone managing listings

### Task 8.2: Register on Directories

| # | Directory | URL | DA | Priority |
|---|---|---|---|---|
| 1 | Google Business Profile | business.google.com | — | 🔴 Essential |
| 2 | Apple Business Connect | businessconnect.apple.com | — | 🔴 Essential |
| 3 | Bing Places | bingplaces.com | — | 🟠 High |
| 4 | Yellow Pages Australia | yellowpages.com.au | 71 | 🟠 High |
| 5 | True Local | truelocal.com.au | 68 | 🟠 High |
| 6 | Facebook Business Page | facebook.com | — | 🟠 High |
| 7 | White Pages Australia | whitepages.com.au | 65 | 🟡 Medium |
| 8 | LocalSearch | localsearch.com.au | 53 | 🟡 Medium |
| 9 | StartLocal | startlocal.com.au | 45 | 🟡 Medium |
| 10 | Hotfrog | hotfrog.com.au | — | 🟡 Medium |
| 11 | HiPages | hipages.com.au | — | 🟡 Medium |
| 12 | ServiceSeeking | serviceseeking.com.au | — | 🟡 Medium |
| 13 | Oneflare | oneflare.com.au | — | 🟡 Medium |
| 14 | Word of Mouth | wordofmouth.com.au | — | 🟡 Medium |
| 15 | Houzz Australia | houzz.com.au | — | 🟡 Medium |

### Task 8.3: Canberra-Specific Listings
- Register with **Canberra Business Chamber**
- List on **CanberraYP**
- Check **ACT Government business directory**
- Join local Canberra Facebook community groups (Braddon, Kingston, Griffith etc.)
- Look for sponsorship opportunities (local sports, events) for backlinks

---

## Work Package 9 — Content Strategy

### Task 9.1: Create "Service Areas" Page
- **Route:** `/service-areas`
- **Content:** List of suburbs served (Braddon, Kingston, Griffith, Deakin, Hughes, Woden Valley, Yarralumla, O'Connor), local context per area, turnaround times, localised testimonials
- **Why:** Reinforces geographic relevance (raised by ChatGPT + Gemini plans)
- **Effort:** Medium
- **Done when:** Page exists with real suburb data; linked from nav/footer; added to sitemap

### Task 9.2: Create Case Studies / Before-After Portfolio
- **Route:** `/projects` or `/case-studies`
- **Content:** 6–12 real job examples with suburb, scope, photos, what changed
- **Why:** Highest-value "linkable asset" for backlinks; converts visitors; demonstrates E-E-A-T "Experience"
- **Effort:** High (photography + writing)
- **Done when:** At least 6 case studies published

### Task 9.3: Add Blog / Resources Section
- **Content plan (first 6 posts):**

| # | Topic | Target Keyword | Type |
|---|---|---|---|
| 1 | "How Much Does Pressure Washing Cost in Canberra? (2026 Guide)" | pressure washing cost canberra | Commercial intent |
| 2 | "Signs Your Shower Is Leaking Behind the Tiles" | leaking shower signs | Problem-solving |
| 3 | "Preparing Your Canberra Garden for Winter" | canberra garden winter prep | Seasonal |
| 4 | "Before & After: Kingston Driveway Transformation" | (brand awareness) | Case study |
| 5 | "Why Epoxy Regrouting Is Better Than Re-Tiling" | epoxy regrouting vs retiling | Comparison |
| 6 | "Pool Maintenance Checklist for Canberra Summers" | pool maintenance checklist canberra | Educational |

- **Guidelines:** 800–1,500 words, original photos, natural keyword placement, clear CTA, interlink to service pages
- **Cadence:** 2–4 per month initially
- **Effort:** High (ongoing)

### Task 9.4: Adopt Pillar-Cluster Content Model
- **What:** Create 1 comprehensive pillar page (~3,000 words) e.g. "The Complete Guide to Property Maintenance in Canberra", then 8–12 cluster articles that link back to it
- **Why:** Builds topical authority with Google (Gemini plan)
- **Effort:** High
- **When:** After first 6 blog posts are published

### Task 9.5: Strengthen Service Page Content
- **What:** Ensure each service page includes:
  - Who the service is for
  - The problems it solves
  - What's included (scope)
  - Pricing guidance
  - Before/after proof
  - Suburbs served
  - Visible FAQs
  - Clear booking CTA
- **Why:** Thin pages don't rank. All plans agreed.
- **Effort:** Medium per page
- **Done when:** Each service page is substantive and complete

---

## Work Package 10 — Analytics, Social, & Link Building

### Task 10.1: Install Google Analytics 4
- **What:** Add GA4 tracking to the site
- **Track:** Page views, form submissions, booking starts/completions, click-to-call, email clicks
- **Effort:** Low–Medium

### Task 10.2: Link GA4 to Search Console
- **What:** Connect the two in GA4 settings → Search Console integration
- **Why:** Correlates search queries with on-site behaviour
- **Effort:** Low

### Task 10.3: Set Up Conversion Events in GA4
- **Events:** `form_submit`, `booking_complete`, `phone_click`, `email_click`
- **Effort:** Medium

### Task 10.4: Optimise Social Media Profiles
- **Instagram:** Before/after Reels (3–5 posts/week), location tags, hashtags (`#CanberraProperty`, `#PressureWashingCanberra`)
- **Facebook:** Business page + active in local community groups
- **LinkedIn:** Connect with real estate agents, property managers; share professional case studies
- **YouTube/TikTok:** Short-form satisfying cleaning videos (pressure washing content performs extremely well)
- **Effort:** Medium (ongoing)

### Task 10.5: Link Building Strategy
- **Local partnerships:** Exchange links with complementary Canberra businesses (real estate agents, builders, pool shops)
- **SourceBottle:** Respond to journalist queries on property topics for press mentions + backlinks
- **Guest posts:** Write for Canberra lifestyle/property blogs
- **Sponsorships:** Local sports clubs, events, charities → "Sponsors" page backlinks
- **Linkable assets:** Build a "2026 Canberra Suburb Maintenance Trend Report" or "Renovation ROI Calculator" (Gemini plan)
- **Effort:** Medium–High (ongoing)

### Task 10.6: Email Marketing
- Collect emails via booking form
- Monthly newsletter with seasonal tips + recent projects + links to blog
- **Effort:** Medium (ongoing)

---

## Phased Timeline

### First 7 Days — Make the Site Crawlable
- [ ] Task 1.1: Switch HashRouter → BrowserRouter
- [ ] Task 1.2: Configure SPA fallback on server
- [ ] Task 1.3: Set up hash-to-clean-URL redirects
- [ ] Task 1.4: Deploy clean robots.txt
- [ ] Task 1.5: Deploy sitemap.xml
- [ ] Task 1.6: Fix www → apex redirect (301)
- [ ] Task 2.1–2.4: Add per-page titles, descriptions, canonicals, OG tags
- [ ] Task 2.6: Add JSON-LD LocalBusiness schema
- [ ] Task 3.1–3.3: Set up Google Search Console, verify, submit sitemap
- [ ] Task 5.6: Update chatbot hash routes
- [ ] Task 7.1: Add noindex to admin/private routes

### Days 8–30 — On-Page SEO + Google Presence
- [ ] Task 2.5: Create og-image.jpg
- [ ] Task 2.7: Add Service schema to service pages
- [ ] Task 2.8: Add FAQ schema to service pages
- [ ] Task 3.4: Request indexing for all key pages
- [ ] Task 3.5: Register Bing Webmaster Tools
- [ ] Task 4.1–4.3: Create + verify + optimise Google Business Profile
- [ ] Task 5.1: Optimise H1 headings for SEO keywords
- [ ] Task 5.2: Add alt text to all images
- [ ] Task 5.3: Add internal cross-links
- [ ] Task 5.4: Add visible FAQ sections
- [ ] Task 5.5: Structure content for AEO
- [ ] Task 6.1: Remove CDN Tailwind
- [ ] Task 6.4: Add favicon
- [ ] Task 10.1–10.3: Install GA4, link to Search Console, set up conversion events
- [ ] Task 8.1: Document NAP standard

### Days 31–60 — Local SEO + Content
- [ ] Task 6.2–6.3: Optimise images, preload fonts
- [ ] Task 6.5: Run PageSpeed audit, fix to 90+
- [ ] Task 8.2: Register on top 8 directories (items 1–8)
- [ ] Task 4.4: Set up review collection workflow
- [ ] Task 4.5: Begin Google Posts (weekly)
- [ ] Task 9.5: Improve service page content depth
- [ ] Task 9.1: Create Service Areas page
- [ ] Task 9.3: Publish first 3 blog posts
- [ ] Task 10.4: Optimise social media profiles

### Days 61–90 — Scale Trust + Authority
- [ ] Task 8.2: Register on remaining directories (items 9–15)
- [ ] Task 8.3: Canberra-specific listings
- [ ] Task 9.2: Publish first case studies (6+)
- [ ] Task 9.3: Publish 3 more blog posts
- [ ] Task 9.4: Begin pillar-cluster content model
- [ ] Task 10.5: Begin link building outreach
- [ ] Task 10.6: Begin email marketing

---

## Ongoing Monitoring

### Weekly (first 4 weeks, then fortnightly, then monthly)

| What | Where |
|---|---|
| Indexed pages count | Google Search Console → Pages |
| Coverage issues | Google Search Console → Pages |
| Search queries + CTR | Google Search Console → Performance |
| Core Web Vitals | Google Search Console → Experience |
| GBP actions (calls, directions, clicks) | Google Business Profile Insights |

### Monthly

| What | Where |
|---|---|
| Organic traffic + conversions | Google Analytics 4 |
| Backlink profile | Ahrefs Webmaster Tools (free) |
| Keyword rankings | Ubersuggest or rank tracker |
| Review count + average rating | Google Business Profile |
| Citation audit (NAP consistency) | Manual spot-check |

### Tools

| Tool | URL | Purpose |
|---|---|---|
| Google Search Console | search.google.com/search-console | Indexing, queries, vitals |
| Google Analytics 4 | analytics.google.com | Traffic, conversions |
| PageSpeed Insights | pagespeed.web.dev | Performance testing |
| Rich Results Test | search.google.com/test/rich-results | Schema validation |
| Schema Validator | validator.schema.org | JSON-LD validation |
| FB Sharing Debugger | developers.facebook.com/tools/debug | OG tag preview |
| Ahrefs Webmaster Tools | ahrefs.com/webmaster-tools | Backlinks, SEO audit |

---

## Expected Results Timeline

| Timeframe | Expectation |
|---|---|
| **Week 1–2** | Site indexed by Google |
| **Week 2–4** | Appearing for branded searches ("Revive Property Co") |
| **Month 1–3** | Rankings for low-competition local terms |
| **Month 3–6** | Rankings improve as content + reviews compound |
| **Month 6–12** | Competitive keyword rankings, steady organic traffic |

---

*Last updated: 9 April 2026*
