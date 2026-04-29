# Historical Lead Extraction & UI Toggle Plan

## Overview
Extract all available hipages leads (historical) and add UI toggle to show "Last 50" vs "All Time"

## Current State
- Scraper only captures visible leads on first page (~50 leads)
- No pagination or scrolling implemented
- All 50 current leads are from today only (2026-04-15)
- Frontend shows all available leads (no limit toggle)

## Requirements

### 1. Scraper Enhancement
**Goal:** Extract historical leads going back as far as hipages allows

**Technical Approach:**
- Implement pagination to load all available leads
- OR implement infinite scroll to capture all historical data
- Handle rate limiting and avoid triggering hipages anti-scraping measures

**Investigation Needed:**
- Check if hipages.com.au has pagination on leads page
- Determine max historical lead availability (30 days? 60 days? unlimited?)
- Identify any rate limiting or bot detection

### 2. UI Toggle Enhancement
**Goal:** Add toggle to show "Last 50" vs "All Time"

**UI Requirements:**
- Toggle switch at top of leads table
- Default: "Last 50" (better performance)
- Option: "All Time" (shows complete historical data)
- Display lead count badge (e.g., "Showing 50 of 1,247 total leads")

**API Requirements:**
- Add `limit` parameter support (default: 50, special value: -1 for all)
- Maintain current pagination for large datasets

## Implementation Plan

### Phase 1: Investigation & Discovery (1-2 hours)
1. Manual testing on hipages.com.au
   - Check for pagination links/buttons
   - Test infinite scroll behavior
   - Identify any rate limiting
   - Determine historical lead availability

2. Technical assessment
   - Choose approach: pagination vs infinite scroll vs API
   - Estimate total lead count
   - Plan storage strategy

### Phase 2: Scraper Enhancement (3-4 hours)
1. Implement pagination/scrolling
   - Add loop to load all pages
   - Implement delay between requests (polite scraping)
   - Add progress logging

2. Testing & validation
   - Test with small dataset first
   - Monitor for errors/bans
   - Validate data integrity

### Phase 3: UI Toggle (2-3 hours)
1. Backend changes
   - Update API to support `limit=all` parameter
   - Optimize queries for large datasets

2. Frontend changes
   - Add toggle component
   - Update API calls based on toggle state
   - Add loading states for "All Time" option
   - Display lead count badges

### Phase 4: Deployment & Testing (1-2 hours)
1. Deploy scraper changes
2. Deploy frontend changes
3. Monitor performance
4. Verify data accuracy

## Success Criteria
- ✅ Scraper can extract all available historical leads
- ✅ UI toggle works (Last 50 / All Time)
- ✅ Performance acceptable for "All Time" view
- ✅ No hipages account restrictions triggered
- ✅ Data integrity maintained

## Risks & Mitigation

### Risk 1: Hipages rate limiting
**Mitigation:** Add delays between requests, implement exponential backoff

### Risk 2: Large dataset performance
**Mitigation:** Use pagination for frontend, optimize database queries

### Risk 3: Hipages TOS violation
**Mitigation:** Be conservative with scraping frequency, respect robots.txt

## Open Questions
1. How far back does hipages keep leads?
2. Is there a hipages API we should use instead of scraping?
3. What's the expected total lead count?
4. Should we archive old leads separately?
