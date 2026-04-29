---
status: awaiting_human_verify
trigger: "hipages-leads-duplicates investigation"
created: 2026-04-15T12:00:00Z
updated: 2026-04-15T12:25:00Z
---

## Current Focus
hypothesis: Fix implemented and cleanup completed successfully
test: Cleanup merged 9 duplicates (243 → 234 unique leads), need to verify frontend displays correctly
expecting: No more duplicate entries visible on frontend, hipages dashboard shows correct data
next_action: Verify frontend displays cleaned data, then test with next scheduled scrape

## Symptoms
expected: Each lead from hipages.com.au should appear exactly once on our site with correct details
actual: Multiple duplicate leads exist (found 10+ customers with 2-14 entries each), empty customer names creating invalid IDs, leads don't match hipages.com.au
errors: None in logs, but data integrity issues
reproduction: Visit https://revivepropertyco.au/admin/hipages-leads-noauth and observe duplicate leads, empty names, inconsistent data
started: Never worked correctly from the start - this is a new integration

## Eliminated

- hypothesis: Scraper is failing to extract lead data correctly
  evidence: Scraper is working - last run saved 50 leads successfully
  timestamp: 2026-04-15T12:00:00Z

- hypothesis: Database ON CONFLICT logic is broken
  evidence: ON CONFLICT (hipages_id) DO UPDATE is correct, but cannot work because hipages_id keeps changing
  timestamp: 2026-04-15T12:05:00Z

## Evidence

- timestamp: 2026-04-15T12:00:00Z
  checked: Context provided
  found: Scraper is working - last run saved 50 leads; Database has 243 total leads with many duplicates
  implication: Issue is in data processing or ID generation, not scraping failure

- timestamp: 2026-04-15T12:00:00Z
  checked: Context provided
  found: hipages_id generation uses: customer_name + suburb + posted_date timestamp
  implication: ID changes when timestamp changes, even for same lead

- timestamp: 2026-04-15T12:00:00Z
  checked: Context provided
  found: Empty names create IDs like "--timestamp" (14 entries found)
  implication: Empty customer names break ID uniqueness

- timestamp: 2026-04-15T12:00:00Z
  checked: Context provided
  found: Same person posting multiple times creates different IDs due to timestamp
  implication: Timestamp in ID prevents proper deduplication

- timestamp: 2026-04-15T12:00:00Z
  checked: Context provided
  found: Suburb format variations (e.g., "Waitlist\nHalekulani" vs "Halekulani") create different IDs
  implication: Data cleaning needed before ID generation

- timestamp: 2026-04-15T12:05:00Z
  checked: db-writer.js lines 16-27 (generateHipagesId function)
  found: hipages_id = `${namePart}-${suburbPart}-${datePart}` where datePart = new Date(lead.posted_date).getTime()
  implication: CONFIRMED: Timestamp is included in hipages_id composite key. When same lead is scraped multiple times, if posted_date differs by even milliseconds, a new hipages_id is generated, creating duplicates

- timestamp: 2026-04-15T12:05:00Z
  checked: db-writer.js lines 103-126 (saveLeads function)
  found: Uses ON CONFLICT (hipages_id) DO UPDATE to handle duplicates, but this only works if hipages_id is consistent
  implication: The upsert logic is correct but cannot work because hipages_id keeps changing for the same lead

- timestamp: 2026-04-15T12:05:00Z
  checked: scraper.js lines 156-168 (lead validation logic)
  found: Validates leads with hasValidName OR (hasValidJobType && hasValidLocation), allows empty customer_name
  implication: Empty customer names pass validation, creating invalid hipages_id values like "--timestamp"

- timestamp: 2026-04-15T12:05:00Z
  checked: Knowledge base
  found: Previous issue "hipages-scraper-missing-images" was about image extraction, not ID generation
  implication: This is a new issue unrelated to previous fixes

- timestamp: 2026-04-15T12:10:00Z
  checked: Code analysis and hypothesis testing
  found: ROOT CAUSE CONFIRMED - hipages_id generation algorithm includes timestamp, making IDs unstable across scrapes
  implication: Fix implemented - removed timestamp, added data normalization, created cleanup script

- timestamp: 2026-04-15T12:20:00Z
  checked: Executed cleanup script in Docker container
  found: Cleanup successful - reduced 243 leads to 234 unique leads (9 duplicates merged and deleted)
  implication: Database now cleaned, new hipages_id generation algorithm will prevent future duplicates

## Resolution
root_cause: hipages_id generation includes posted_date timestamp in the composite key (customer_name-suburb-timestamp). When the same lead is scraped multiple times with slightly different posted_date values (even milliseconds difference), a new hipages_id is generated, creating duplicate entries. Additionally, empty customer_names create invalid IDs like "--timestamp", and suburb format variations (e.g., "Waitlist\nHalekulani" vs "Halekulani") create different IDs for the same lead.

fix:
1. Updated generateHipagesId() in db-writer.js:
   - Removed timestamp from composite key
   - Added fallback for empty customer_name (uses job_type)
   - Added description hash to distinguish similar jobs
   - New format: customer_name-suburb-job_type-description_hash
2. Added data normalization in scraper.js before saveLeads():
   - Clean suburb: remove "Waitlist" prefix, newlines, extra whitespace
   - Normalize customer_name, job_type, description
3. Created and executed cleanup script to fix existing duplicates

verification:
- ✓ Cleanup script executed successfully: 243 → 234 leads (9 duplicates removed)
- ✓ All leads updated with new hipages_id format
- ✓ Frontend verification needed: check https://revivepropertyco.au/admin/hipages-leads-noauth
- ✓ Next scrape (every 6 hours) will verify no new duplicates are created

files_changed:
- services/hipages-scraper/src/db-writer.js (generateHipagesId function - lines 12-47)
- services/hipages-scraper/src/scraper.js (data cleaning before saveLeads - lines 470-492)
