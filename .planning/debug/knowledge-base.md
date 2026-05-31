---
status: resolved
---
# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## hipages-scraper-missing-images — Images not captured from hipages leads
- **Date:** 2026-04-15
- **Error patterns:** attachment_count, images array, raw_data, hipages scraper, image URLs not captured
- **Root cause:** parseLeadsFromText() extracted images from page HTML but main scraper discarded them before saving to database
- **Fix:** Extract all image URLs from page HTML, sequentially assign to leads based on attachment_count field, add images array to lead objects before db-writer.saveLeads()
- **Files changed:** services/hipages-scraper/src/scraper.js

---
