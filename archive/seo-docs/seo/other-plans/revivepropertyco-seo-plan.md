# Revive Property Co. SEO and Google Search Plan

Date: 2026-04-09
Primary domain reviewed: `https://revivepropertyco.au`

## Goal

Make `revivepropertyco.au` discoverable in Google Search, improve local visibility, and build a repeatable SEO system that brings in qualified leads.

## Executive Summary

Your site is live, but there are a few technical issues that should be fixed before doing any serious SEO or Google Search Console work:

1. `/robots.txt` is currently returning HTML instead of a plain text robots file.
2. `/sitemap.xml` is currently returning HTML instead of an XML sitemap.
3. `https://www.revivepropertyco.au` returns `404` instead of redirecting to the canonical domain.
4. The homepage HTML currently appears to have only a basic `<title>` and is missing a visible meta description, canonical tag, Open Graph tags, and JSON-LD structured data in the initial HTML response.
5. The site appears to be a client-rendered React SPA. That can still rank, but it increases the importance of correct metadata, crawlable internal links, and a working sitemap.

These are the first things to fix. Without them, Google can still discover the site, but indexing and search presentation will be weaker than they should be.

## What I Verified On The Live Site

I checked the production site on 2026-04-09 and found:

- `https://revivepropertyco.au` returns `200 OK`
- `https://revivepropertyco.au/robots.txt` returns `200`, but the content type and body behave like HTML, not a robots file
- `https://revivepropertyco.au/sitemap.xml` returns `200`, but the content type and body behave like HTML, not XML
- `https://www.revivepropertyco.au` returns `404`
- Initial HTML includes `<title>Revive Property Co.</title>` but no obvious meta description, canonical, OG tags, or JSON-LD in the server response
- Public routes detected in the built app include:
  - `/`
  - `/pressure-washing`
  - `/garden-maintenance`
  - `/pool-maintenance`
  - `/rubbish-removal`
  - `/regrouting`
  - `/contact`
  - `/book`

The site content appears to focus on property maintenance and restoration services, including regrouting and related service pages.

## Priority Plan

### Phase 1: Fix Indexing and Crawlability First

This is the highest-priority work. Do this before content expansion or link building.

#### 1. Create a real `robots.txt`

Serve a real text file at `https://revivepropertyco.au/robots.txt`.

Recommended starting content:

```txt
User-agent: *
Allow: /

Sitemap: https://revivepropertyco.au/sitemap.xml
```

Requirements:

- Content-Type should be `text/plain`
- It must not be served by the SPA fallback
- It must be reachable without JavaScript

#### 2. Create a real XML sitemap

Serve a real XML sitemap at `https://revivepropertyco.au/sitemap.xml`.

Include at minimum:

- `/`
- `/pressure-washing`
- `/garden-maintenance`
- `/pool-maintenance`
- `/rubbish-removal`
- `/regrouting`
- `/contact`
- `/book`

Requirements:

- Content-Type should be `application/xml` or `text/xml`
- Use absolute canonical URLs
- Exclude admin, login, session, and success pages from the public sitemap

#### 3. Fix canonical domain handling

Pick one canonical hostname and force all variants to it.

Recommended canonical:

- `https://revivepropertyco.au`

Required redirects:

- `http://revivepropertyco.au` -> `https://revivepropertyco.au`
- `http://www.revivepropertyco.au` -> `https://revivepropertyco.au`
- `https://www.revivepropertyco.au` -> `https://revivepropertyco.au`

The current `www` 404 should be replaced with a permanent `301` redirect.

#### 4. Add per-page canonical tags

Each indexable page should output a canonical URL in `<head>`.

Examples:

- Homepage canonical -> `https://revivepropertyco.au/`
- Regrouting page canonical -> `https://revivepropertyco.au/regrouting`

#### 5. Make metadata render reliably

Every public page should have unique:

- `<title>`
- `<meta name="description">`
- canonical tag
- Open Graph tags
- Twitter card tags

For a React SPA, implement this carefully. Best options:

1. Migrate public marketing pages to SSR or static pre-rendering
2. If that is not feasible immediately, inject route-specific head tags using a reliable SEO/head management approach and verify what Google actually receives

If the site stays purely client-rendered, test rendered output with URL Inspection and Rich Results Test after deployment.

#### 6. Add a favicon and site identity signals

Make sure the site has:

- favicon in a crawlable location
- organization name used consistently
- logo asset suitable for structured data and social previews

### Phase 2: Add Structured Data

Use JSON-LD on public pages.

#### 1. Organization schema

Add an `Organization` or `LocalBusiness` entity on the homepage.

Include where accurate:

- business name
- website URL
- logo URL
- contact phone
- email
- service area
- sameAs links to social profiles

#### 2. LocalBusiness schema

If this is a real service business with a geographic service area, use a suitable subtype where appropriate, otherwise `LocalBusiness` is acceptable.

Include where accurate:

- areaServed
- openingHours
- telephone
- image
- priceRange

#### 3. Service schema

Add `Service` structured data to service pages such as:

- Pressure Washing
- Garden Maintenance
- Pool Maintenance
- Rubbish Removal
- Regrouting

Each service page should describe:

- what the service is
- who it is for
- where you offer it
- how to contact or book

#### 4. FAQ schema

Only use `FAQPage` if the page visibly contains the same FAQ content for users. Do not add hidden FAQ markup.

Good candidates:

- pricing questions
- service area questions
- turnaround time
- what is included
- leak/regrouting process

### Phase 3: Improve On-Page SEO

#### 1. Rewrite titles and descriptions

Current homepage title is too broad.

Aim for titles like:

- `Property Maintenance and Regrouting Services | Revive Property Co`
- `Shower Regrouting and Property Maintenance | Revive Property Co Canberra`

Descriptions should:

- state what you do
- state where you operate
- include a trust signal or differentiator
- include a CTA naturally

Example homepage description pattern:

`Revive Property Co provides regrouting, pressure washing, garden maintenance, pool maintenance, and property clean-up services in [service area]. Book a quote online.`

#### 2. Give every public page a single clear search intent

Map one primary keyword theme per page:

- Homepage: brand + broad service category + location
- `/regrouting`: shower regrouting / shower leak repair / bathroom regrouting
- `/pressure-washing`: pressure washing + suburb/city terms
- `/garden-maintenance`: garden maintenance + lawn care + local area
- `/pool-maintenance`: pool maintenance + pool cleaning + local area
- `/rubbish-removal`: rubbish removal + green waste + cleanup + local area

#### 3. Improve heading structure

Each page should have:

- 1 H1 that states the service and location/value proposition
- logical H2 sections for benefits, process, pricing, FAQs, areas served, testimonials, booking CTA

#### 4. Build stronger service pages

Each service page should include:

- who the service is for
- the problems you solve
- service inclusions
- pricing or quote guidance
- before/after proof where possible
- suburbs or regions served
- FAQs
- booking CTA

Thin pages rarely rank well. Aim for genuinely useful pages, not filler.

#### 5. Create location pages only if they are real and useful

If you operate in multiple suburbs or regions, create pages only where you can add local specificity.

Examples:

- `/canberra-regrouting`
- `/belconnen-pressure-washing`
- `/gungahlin-garden-maintenance`

Each location page must include:

- real local service context
- suburb-specific examples
- local testimonials if available
- areas served nearby

Do not mass-generate thin suburb pages.

### Phase 4: Add Internal Linking and Site Architecture

#### 1. Strengthen crawl paths

Make sure every important service page is linked from:

- homepage
- main navigation
- footer
- relevant service cross-links

#### 2. Add contextual links

Examples:

- From regrouting page -> link to contact/book page
- From pool maintenance page -> link to pressure washing if relevant
- From garden maintenance page -> link to rubbish removal for cleanups

#### 3. Add footer trust/navigation block

Include:

- service links
- contact details
- service areas
- business hours
- legal pages

### Phase 5: Local SEO

If this business serves a local geographic area, local SEO is one of the highest-return channels.

#### 1. Create or optimize Google Business Profile

Set up or fully optimize the business profile with:

- exact business name
- primary category
- secondary categories
- service area
- phone
- website
- booking/contact link
- business description
- photos
- logo
- service list

#### 2. Make NAP consistent

Ensure the business name, phone, and service area/contact details are consistent across:

- website
- Google Business Profile
- Facebook
- Instagram
- business directories

#### 3. Collect reviews

Build a process to request Google reviews after completed jobs.

Best practice:

- ask immediately after a positive outcome
- link directly to the review form
- ask customers to mention the specific service and suburb naturally

#### 4. Add trust and proof on-site

Include:

- customer reviews
- before/after photos
- guarantees
- years of experience
- response times
- insurance or licensing details if relevant

### Phase 6: Add Google Search Console Properly

This is how to get the site into Google as directly as possible.

#### Steps

1. Go to Google Search Console: `https://search.google.com/search-console`
2. Add the site as a property
3. Prefer verifying the **Domain property** via DNS if possible
4. Verify ownership
5. Submit `https://revivepropertyco.au/sitemap.xml`
6. Use URL Inspection on:
   - homepage
   - each service page
7. Request indexing for key pages after technical fixes are live

#### Important notes

- Search Console does not guarantee instant indexing
- Submission works best after the sitemap, canonical setup, and robots file are correct
- For a new site, it can still take time for impressions and rankings to build

### Phase 7: Analytics and Conversion Tracking

SEO without measurement turns into guesswork.

#### 1. Install Google Analytics 4

Track:

- page views
- contact form submissions
- booking starts
- booking completions
- click-to-call
- email clicks

#### 2. Link Search Console and GA4

This helps connect:

- search queries
- landing pages
- conversion performance

#### 3. Set up lead events

Critical conversions:

- form submit
- booking submit
- phone click
- quote request

### Phase 8: Content That Can Actually Rank

Once the technical base is fixed, build helpful content around customer intent.

#### High-value content ideas

- `How to tell if your shower needs regrouting`
- `Regrouting vs full bathroom renovation: when to choose each`
- `How often should a pool be professionally serviced?`
- `What is included in a pressure washing service?`
- `How to prepare your property for sale with outdoor maintenance`
- `What causes shower leaks without visible tile damage?`

#### Content rules

- write for real customers, not keyword stuffing
- include local context where relevant
- include images, FAQs, and CTA
- publish under your domain, not only on social media

### Phase 9: Authority and Link Building

Do not buy spammy backlinks.

Focus on:

- Google Business Profile
- local directories
- chamber or local business listings
- supplier/manufacturer listings if relevant
- partnerships with related trades
- local community sponsorships
- case studies worth sharing

Useful link sources:

- local directories
- local trade directories
- social profiles
- local media if you have community stories or before/after transformations

### Phase 10: Technical Quality and Performance

These are not the first blockers, but they matter.

#### 1. Improve page speed

The homepage currently includes Tailwind via CDN in the HTML. For production SEO/performance, a compiled CSS build is usually better than runtime CDN loading.

Review:

- JS bundle size
- image compression
- lazy loading
- font loading
- CSS delivery

#### 2. Make sure pages are mobile-first

Most local service searches are mobile.

Check:

- tap targets
- contact CTA visibility
- LCP image performance
- sticky call/book CTA on mobile

#### 3. Prevent accidental indexing of private routes

Non-public routes should not be indexed:

- `/admin`
- `/admin/regrouting`
- `/admin/telequote`
- `/login`
- `/session/:id`
- `/success`

Use some combination of:

- noindex where appropriate
- exclusion from sitemap
- authentication barriers
- no internal links from public pages

Do not rely on robots.txt alone to protect sensitive pages.

## Recommended Metadata By Page

### Homepage

Target:

- branded service overview
- primary service area
- strongest CTA

Needs:

- title
- description
- Organization/LocalBusiness schema
- links to all service pages

### Regrouting Page

This appears likely to be one of the strongest SEO opportunities.

Target topics:

- shower regrouting
- leaking shower repair
- bathroom tile regrouting
- shower resealing

Needs:

- detailed service explanation
- signs of leaking shower
- process
- pricing guidance
- before/after proof
- FAQ
- booking CTA

### Other Service Pages

For pressure washing, garden maintenance, pool maintenance, and rubbish removal:

- create unique copy
- show outcomes
- show service areas
- show proof
- avoid duplicated template text

## 30 / 60 / 90 Day Rollout

### First 7 Days

- Fix `robots.txt`
- Fix `sitemap.xml`
- Add canonical redirects for `www` and `http`
- Add page-specific titles and descriptions
- Add canonical tags
- Exclude admin/private routes from indexing
- Verify Search Console
- Submit sitemap
- Request indexing for core public URLs

### Days 8-30

- Add Organization or LocalBusiness schema
- Add Service schema to service pages
- Improve homepage copy for clear service + location intent
- Expand the regrouting page first
- Add testimonials and before/after proof
- Install GA4 and conversion tracking
- Set up Google Business Profile fully

### Days 31-60

- Improve remaining service pages
- Add first 3 to 5 useful blog/help articles
- Build citations and local listings
- Start a review acquisition process
- Monitor Search Console coverage and queries weekly

### Days 61-90

- Add high-quality location pages only where justified
- Improve internal links based on Search Console data
- Refresh titles and meta descriptions based on CTR
- Build local partnerships and links
- Publish more proof-driven case studies

## Search Console Monitoring Checklist

Check weekly:

- Pages indexed
- Coverage issues
- Sitemap status
- Core Web Vitals
- Search queries
- Landing pages
- CTR by page
- Mobile usability issues

Watch for:

- `Crawled - currently not indexed`
- duplicate canonical issues
- soft 404s
- blocked resources
- page rendering problems

## Implementation Notes For This Site

Because the site appears to be a React SPA, confirm how routing and head metadata are currently implemented.

Questions to answer in the codebase:

1. Is the site built with Vite + React Router?
2. Are page head tags managed at route level?
3. Is there any static generation or SSR?
4. Is the hosting configuration sending unknown routes to `index.html`, including `/robots.txt` and `/sitemap.xml`?
5. Are there generated static assets for sitemap and robots in the build output?

Likely code tasks:

- add static `public/robots.txt`
- add generated `public/sitemap.xml` or build-time sitemap generation
- add canonical redirects in hosting/proxy config
- add page-level SEO metadata
- add JSON-LD per page

## Direct Answer: How To Add The Site To Google Search

1. Fix the technical issues first:
   - real `robots.txt`
   - real `sitemap.xml`
   - canonical redirects
   - page metadata
2. Verify the domain in Google Search Console
3. Submit the sitemap in Search Console
4. Use URL Inspection and request indexing for:
   - homepage
   - each service page
5. Keep improving content, local signals, and reviews
6. Monitor Search Console every week

Google does not have a separate manual "submit my whole site now" button beyond Search Console verification, sitemap submission, and URL inspection/request indexing.

## Success Metrics

Track progress with:

- indexed pages count
- impressions in Search Console
- clicks in Search Console
- average CTR
- rankings for service + location terms
- phone clicks
- quote requests
- booking submissions

## Recommended Next Technical Task Order

1. Fix `robots.txt`
2. Fix `sitemap.xml`
3. Add `301` redirect from `www` to apex
4. Add title, description, canonical, OG tags per public page
5. Add structured data
6. Verify in Search Console and submit sitemap
7. Improve page copy and local SEO assets

## Sources

Official Google documentation used for the Google submission guidance:

- Google Search Console getting started: https://developers.google.com/search/docs/monitor-debug/search-console-start
- Google Search Central documentation hub: https://developers.google.com/search/docs/

## Notes

I was not able to inspect the project files directly at `razor-edge:/opt/homelab/apps/revivepropertyco/` because SSH to `razor-edge` is rejecting the current user in this environment. This plan is based on the live site behavior and publicly accessible build output.
