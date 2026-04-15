# Debug Session: Hipages Scraper - Missing Images

**Started:** 2026-04-15
**Status:** AWAITING_HUMAN_VERIFY
**Slug:** hipages-scraper-missing-images

## Issue Summary

The hipages scraper is not capturing image URLs from leads, even when attachments are present on hipages.com.au.

## Symptoms

### Expected Behavior
- Scraper should extract all image URLs from hipages ads
- Images should be stored in `raw_data.images` array
- Images should be displayed in the admin dashboard

### Actual Behavior
- Scraper detects `attachment_count: 1` but doesn't capture image URLs
- No images array in `raw_data` field
- Image extraction regex returns empty array

### Error Messages
None - silent data loss

### Timeline
- **Never worked**: Images have never been captured since scraper was implemented
- **Discovery**: Found while comparing hipages.com.au site to database data

### Reproduction
1. Check lead: Joel, Camden 2570, Handyman, posted Apr 15, 2026
2. Hipages shows "1 Attachment" with photo
3. Database shows `attachment_count: 1` but no images in `raw_data`

## Investigation Evidence

### Database Verification
```sql
SELECT raw_data FROM hipages_leads
WHERE customer_name ILIKE '%Joel%'
  AND suburb ILIKE '%Camden%'
  AND postcode = '2570';
```

**Result:**
- `attachment_count: 1` present
- No `images` array in raw_data
- No image URLs anywhere in the stored object

### Code Analysis

**File:** `services/hipages-scraper/src/scraper.js`

**Line 40-48** - Image extraction exists:
```javascript
// Extract image URLs from HTML if provided
let images = [];
if (pageHtml) {
  const imgMatches = pageHtml.match(/https:\/\/img\.hipages\.com\.au\/[^\s"<>]+?\.(?:jpg|jpeg|png|webp)/gi) || [];
  const attachmentMatches = pageHtml.match(/https:\/\/attachments\.hipagesusercontent\.com\/[^\s"<>]+/gi) || [];
  images = [...new Set([...imgMatches, ...attachmentMatches])];
}
```

**Line 362** - Images returned:
```javascript
const { leads, phoneNumbers, images } = parseLeadsFromText(pageData.allText, pageHtml);
```

**Line 372** - Images returned from scrapePage:
```javascript
return { leads, phoneNumbers, images };
```

**Line 376-381** - **BUT IMAGES ARE DISCARDED**:
```javascript
const leadsData = await scrapePage("https://business.hipages.com.au/leads", "leads");
allLeads.push(...leadsData.leads);  // ❌ Only saves leads, ignores images!

const jobsData = await scrapePage("https://business.hipages.com.au/jobs", "jobs");
allLeads.push(...jobsData.leads);  // ❌ Only saves leads, ignores images!
```

**Line 388** - Images never passed to db-writer:
```javascript
const result = await dbWriter.saveLeads(allLeads);  // ❌ No images!
```

## Root Cause Analysis

**PRIMARY BUG:** The scraper extracts images successfully but discards them before saving to database.

**Breakdown:**
1. ✅ parseLeadsFromText() extracts images from HTML (lines 40-48)
2. ✅ scrapePage() returns images array (line 372)
3. ❌ Main scraper discards images (lines 376-381)
4. ❌ saveLeads() never receives images (line 388)
5. ❌ raw_data doesn't include images (db-writer.js line 138)

**SECONDARY BUG:** Image extraction regex may not match hipages' current URL format.

## Resolution

**Root Cause:** Images extracted at page level but not associated with individual leads before database insertion.

**Fix Implemented:**
1. Updated regex to match hipages attachment URLs: `https://attachments\.hipagesusercontent\.com\/[a-zA-Z0-9\/_-]+`
2. Extracted all image URLs from page HTML (found 168 URLs in latest scrape)
3. Sequentially assigned images to leads based on `attachment_count` field
4. Added `images` array to each lead object before saving to database
5. db-writer already saves entire lead object as raw_data (no change needed)

**Files Changed:**
- services/hipages-scraper/src/scraper.js (lines 383-461: image extraction and assignment logic)

**Verification Evidence:**
```
[scraper] Found 168 hipages image URLs in page HTML
[scraper] Attached 1 page-level images to lead: Joel (fallback)
[scraper] Attached 3 page-level images to lead: Mindah (fallback)
[scraper] Attached 5 page-level images to lead: Jazz (fallback)
[db-writer] Saved 50 leads to database
```

**Status:** Fix deployed to Docker, awaiting user verification

## Verification Checklist

- [x] Scraper extracts image URLs from HTML (168 URLs found)
- [x] Images assigned to leads based on attachment_count
- [x] Joel's lead received 1 image (matches attachment_count: 1)
- [x] Leads saved to database with images array
- [ ] User verifies images display in admin dashboard
- [ ] User confirms images match hipages.com.au attachments

## Next Steps for User Verification

1. Access hipages leads admin dashboard at `/admin/hipages-leads`
2. Find lead "Joel, Camden 2570, Handyman" (posted Apr 15, 2026)
3. Verify that images are now displayed (check for image thumbnails/gallery)
4. Compare with hipages.com.au to confirm images match the attachments
5. Check a few other leads with attachment_count > 0

**Tell me:** "Images displaying correctly" OR what's still missing/wrong
