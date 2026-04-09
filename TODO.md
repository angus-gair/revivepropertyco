# Revive Property Co. — SEO & Development TODO

> Last Updated: 9 April 2026
> Status: Site is live with technical SEO complete. Manual and content tasks remain.

---

## 🔴 Critical (Do First)

### Google Search Console Setup
- [ ] Create Google Search Console property (URL-prefix)
- [ ] Verify domain ownership (DNS TXT record)
- [ ] Submit sitemap.xml (`https://revivepropertyco.au/sitemap.xml`)
- [ ] Request indexing for key pages (use URL Inspection tool)

**Time:** 30 minutes | **Impact:** Site indexing

### Google Business Profile
- [ ] Create GBP at https://business.google.com
- [ ] Use exact NAP from `docs/NAP_STANDARD.md`:
  - Name: `Revive Property Co.`
  - Address: `802/2 Marcus Clarke Street, Canberra ACT 2601`
  - Phone: `02 8201 3710`
- [ ] Upload 10+ photos (before/after, team, equipment)
- [ ] Write keyword-rich description
- [ ] Enable messaging
- [ ] Verify business

**Time:** 1-2 hours | **Impact:** Local search visibility

---

## 🟠 High Priority (Week 1)

### Analytics Setup
- [ ] Install Google Analytics 4
- [ ] Link GA4 to Google Search Console
- [ ] Set up conversion events:
  - `form_submit` (booking form)
  - `booking_complete` (success page)
  - `phone_click` (click-to-call)
  - `email_click` (email links)

**Time:** 1-2 hours | **Impact:** Track performance

### Core Directory Registrations
- [ ] Apple Business Connect (https://businessconnect.apple.com)
- [ ] Bing Places (https://bingplaces.com)
- [ ] Yellow Pages Australia (https://yellowpages.com.au)
- [ ] True Local (https://truelocal.com.au)

**Use NAP from `docs/NAP_STANDARD.md` — character-for-character identical**

**Time:** 2-3 hours | **Impact:** Citations, local SEO

---

## 🟡 Medium Priority (Week 2-4)

### Content Creation

#### Blog Posts (3 required)
- [ ] "How Much Does Pressure Washing Cost in Canberra? (2026 Guide)"
  - Target: `pressure washing cost canberra`
  - Length: 800–1500 words
  - Include: Pricing table, before/after photos

- [ ] "Signs Your Shower Is Leaking Behind the Tiles"
  - Target: `leaking shower signs`
  - Length: 800–1200 words
  - Include: Problem photos, solution overview

- [ ] "Preparing Your Canberra Garden for Winter"
  - Target: `canberra garden winter prep`
  - Length: 800–1200 words
  - Include: Checklist, seasonal tips

**Time:** 6–10 hours | **Impact:** Content marketing, organic traffic**

#### Case Studies (6 required)
Structure ready at `/projects` — need actual content:
- [ ] Kingston Driveway Transformation (Pressure Washing)
- [ ] Griffith Bathroom Waterproofing (Regrouting)
- [ ] Deakin Estate Overhaul (Garden Maintenance)
- [ ] Braddon Pool Recovery (Pool Maintenance)
- [ ] Hughes Property Clearout (Rubbish Removal)
- [ ] Yarralumla Patio Restoration (Pressure Washing)

**Each case study needs:** Suburb, service type, before/after photos, scope, results

**Time:** 10–15 hours (photography + writing) | **Impact:** Trust, conversions

### Review Workflow
- [ ] Create Google review link format
- [ ] Document review request process
- [ ] Train team to ask for reviews after jobs
- [ ] Target: 5 reviews in first month

**Time:** 1-2 hours | **Impact:** Social proof, rankings

### Social Media Setup
- [ ] Create/optimize Instagram profile
- [ ] Create/optimize Facebook business page
- [ ] Create/optimize LinkedIn profile
- [ ] Post 3-5 before/after photos

**Time:** 2-3 hours | **Impact:** Brand awareness, traffic

---

## 🟢 Lower Priority (Month 2-3)

### Additional Directory Registrations
- [ ] White Pages Australia
- [ ] LocalSearch
- [ ] StartLocal
- [ ] Hotfrog
- [ ] HiPages
- [ ] ServiceSeeking
- [ ] Oneflare
- [ ] Word of Mouth
- [ ] Houzz Australia

**Time:** 2-3 hours | **Impact:** Citations

### Canberra-Specific Listings
- [ ] Canberra Business Chamber
- [ ] CanberraYP
- [ ] ACT Government business directory
- [ ] Join local Facebook community groups

**Time:** 1-2 hours | **Impact:** Local relevance

### Additional Blog Content
- [ ] "Before & After: Kingston Driveway Transformation"
- [ ] "Why Epoxy Regrouting Is Better Than Re-Tiling"
- [ ] "Pool Maintenance Checklist for Canberra Summers"

**Time:** 6–10 hours | **Impact:** Content depth

### Link Building
- [ ] Partner with complementary Canberra businesses
- [ ] Respond to journalist queries (SourceBottle)
- [ ] Guest post opportunities
- [ ] Local sponsorships for backlinks

**Time:** Ongoing | **Impact:** Authority, rankings

---

## 📋 Reference Documentation

| Document | Purpose |
|----------|---------|
| `docs/NAP_STANDARD.md` | Exact business info format for directories |
| `docs/SEO_ASSESSMENT_CHECKLIST.md` | Full implementation status |
| `tests/test-seo-*.cjs` | Validation scripts for each work package |

---

## 🔧 Quick Commands

### Run All SEO Tests
```bash
for f in tests/test-seo-*.cjs; do echo "## $f ##"; node $f; done
```

### Build & Deploy
```bash
npm run build
docker compose up -d --build app
```

### Check Site Status
```bash
curl -sI https://revivepropertyco.au | head -1
```

---

## 📊 Progress Summary

| Work Package | Status | Notes |
|--------------|--------|-------|
| WP1: Crawlability | ✅ Complete | BrowserRouter, robots.txt, sitemap |
| WP2: Metadata | ✅ Complete | All pages have titles, descriptions, OG tags |
| WP3: Search Console | ⏳ Manual | Ready, needs GSC setup |
| WP4: GBP Schema | ✅ Complete | JSON-LD ready, needs GBP creation |
| WP5: On-Page SEO | ✅ Complete | H1s, alt text, FAQs, AEO all done |
| WP6: Performance | ✅ Complete | Images optimized, favicons, lazy loading |
| WP7: Private Routes | ✅ Complete | noindex tags in place |
| WP8: Local SEO | 📝 Documentation | NAP documented, directories pending |
| WP9: Content Structure | ✅ Complete | Pages ready, content pending |
| WP10: Analytics | ⏳ Pending | GA4 not yet installed |

---

## 🎯 Next 7 Days

1. Monday: Set up Google Search Console + Google Business Profile
2. Tuesday: Register on Apple Business Connect + Bing Places
3. Wednesday: Install GA4 + conversion tracking
4. Thursday: Register on Yellow Pages + True Local
5. Friday: Write first blog post
6. Weekend: Take photos for case studies
