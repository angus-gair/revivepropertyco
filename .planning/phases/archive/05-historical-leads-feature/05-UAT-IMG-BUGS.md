# Phase 05 - Image & UX Issues - UAT Report

## Overview
User Acceptance Testing for hipages leads page image preview and navigation functionality.

## Test Environment
- **URL:** https://revivepropertyco.au/admin/hipages-leads-noauth
- **Test Date:** 2026-04-15
- **Tester:** User feedback session

---

## Critical Issues Found

### ❌ Issue 1: Image Previews Display Black Screen

**Severity:** CRITICAL - Blocks core functionality

**Expected Behavior:**
- Images should load and display thumbnails in the modal
- Users should see preview of attached images before clicking

**Actual Behavior:**
- All image thumbnails show black screen
- `<img>` tags render but src URLs fail to load
- onError fallback not triggering properly

**Evidence:**
```typescript
// Line 633-640 in HipagesLeadsNoAuthPage.tsx
<img
  src={imageUrl}
  alt={`Attachment ${index + 1}`}
  className="w-full h-32 object-cover"
  onError={(e) => {
    e.currentTarget.src = 'data:image/svg+xml,...';
  }}
/>
```

**Root Cause Analysis:**
1. **Image URLs may be relative paths** - hipages may return `/image.jpg` instead of full URLs
2. **CORS blocking** - hipages images may block external loading
3. **Authentication required** - images may need cookies/session from hipages
4. **Broken URLs** - images may have expired or been deleted

**Impact:**
- Users cannot see what images are attached
- Cannot determine if lead has relevant photos
- Reduces value of image extraction feature

**Fix Required:**
1. Inspect actual image URLs in database
2. Add URL validation/normalization
3. Implement proxy for authenticated images
4. Add better error handling with visible fallback

---

### ❌ Issue 2: No Image Navigation (Next/Previous)

**Severity:** HIGH - Poor UX

**Expected Behavior:**
- Clicking an image should open full-size view
- User can navigate between images with arrows
- "Next" and "Previous" buttons visible
- Keyboard navigation (arrow keys) supported
- Image counter: "Image 3 of 7"

**Actual Behavior:**
- Clicking image opens new tab (`target="_blank"`)
- No navigation between images
- No lightbox/gallery view
- Cannot see all images without closing/opening each

**Evidence:**
```typescript
// Line 627-631 - Current implementation
<a
  href={imageUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="block border border-slate-200 rounded-lg..."
>
```

**Impact:**
- Poor user experience for leads with multiple images
- Users must open/close multiple tabs
- No easy way to browse all attachments
- Feels "static" and outdated

**Fix Required:**
1. Implement lightbox/modal for image viewing
2. Add navigation arrows (previous/next)
3. Add keyboard shortcuts (← → ESC)
4. Show image counter and thumbnails
5. Zoom in/out functionality

---

### ⚠️ Issue 3: Page Feels Static

**Severity:** MEDIUM - UX polish

**Expected Behavior:**
- Page feels alive and responsive
- Visual feedback on interactions
- Smooth transitions and animations

**Actual Behavior:**
- No hover animations on images
- No loading skeletons while fetching
- Abrupt modal open/close
- No visual polish

**Impact:**
- Feels incomplete
- Lacks professional finish
- Poor first impression

**Fix Required:**
1. Add hover effects on image thumbnails
2. Add loading skeleton states
3. Smooth modal transitions
4. Micro-interactions on buttons

---

## Additional UX Improvements Needed

### Issue 4: Image Preview Size

**Current:** Fixed 32px height (`h-32`)
**Problem:** Too small to see details
**Fix:** Make thumbnails larger (h-48) or variable based on aspect ratio

### Issue 5: No Image Download Option

**Current:** Only "Open full size" tooltip
**Problem:** Can't save images locally
**Fix:** Add download button in lightbox

### Issue 6: No Image Info Display

**Current:** No filename or size
**Problem:** Can't identify images
**Fix:** Show filename, dimensions, file size in lightbox

---

## Root Cause Analysis

### Why Images Are Black

**Hypothesis 1: Relative URLs**
```javascript
// Database may have:
image: "/uploads/photo.jpg"  // Missing base URL

// Needs:
image: "https://hipages.com.au/uploads/photo.jpg"
```

**Hypothesis 2: Authentication Required**
- hipages images may require valid session
- Direct URL access without cookies fails
- Need to proxy through backend with authentication

**Hypothesis 3: Expired URLs**
- hipages may use signed URLs that expire
- Images stored temporarily
- Need to download and store permanently

**Hypothesis 4: CORS Blocking**
```javascript
// Browser blocks:
<img src="https://hipages.com.au/image.jpg" />
// Error: CORS policy: No 'Access-Control-Allow-Origin' header
```

---

## Recommended Fix Strategy

### Phase 1: Investigate Image URLs (30 min)
1. Query database for actual image URLs
2. Test loading each URL directly
3. Determine if URLs are absolute/relative
4. Check for authentication requirements

### Phase 2: Fix Image Loading (2 hours)
**Option A: URL Normalization**
```typescript
const normalizeImageUrl = (url: string): string => {
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `https://hipages.com.au${url}`;
  return url;
};
```

**Option B: Backend Proxy**
```typescript
// Frontend
<img src={`/api/hipages/image?url=${encodeURIComponent(imageUrl)}`} />

// Backend
app.get('/api/hipages/image', async (req, res) => {
  const imageUrl = req.query.url;
  const response = await fetch(imageUrl, {
    headers: { 'Cookie': hipagesSession }
  });
  res.setHeader('Content-Type', response.headers.get('Content-Type'));
  response.body.pipe(res);
});
```

**Option C: Persistent Storage**
- Download images during scraping
- Store in R2 or local filesystem
- Serve from own domain

### Phase 3: Implement Lightbox (3 hours)
**Component Structure:**
```typescript
<ImageLightbox
  images={string[]}        // Array of image URLs
  initialIndex={number}     // Start at this image
  onClose={() => void}      // Close callback
/>
```

**Features:**
- Full-screen modal overlay
- Previous/Next arrow buttons
- Keyboard navigation (← → ESC)
- Image counter "3 / 7"
- Thumbnail strip at bottom
- Download button
- Zoom in/out
- Smooth transitions

### Phase 4: Polish & Animations (1 hour)
- Hover effects on thumbnails
- Loading spinners
- Smooth fade-in/out
- Skeleton states

---

## Success Criteria

### Image Loading
- ✅ All images display correctly (no black screens)
- ✅ Broken images show visible fallback (SVG placeholder)
- ✅ Images load quickly (< 2 seconds)

### Lightbox Navigation
- ✅ Click image opens lightbox (not new tab)
- ✅ Previous/Next buttons work
- ✅ Arrow keys navigate images
- ✅ ESC closes lightbox
- ✅ Image counter visible
- ✅ Download button works

### UX Polish
- ✅ Hover effects on thumbnails
- ✅ Smooth transitions
- ✅ Loading states visible
- ✅ No layout shifts

---

## Test Cases

### Test 1: Image Loading
1. Open lead with images
2. Verify thumbnails render (not black)
3. Check browser console for errors
4. **Expected:** All images visible

### Test 2: Image Navigation
1. Click on image thumbnail
2. Verify lightbox opens
3. Press → key
4. Verify next image shows
5. Press ESC
6. Verify lightbox closes
7. **Expected:** Smooth navigation, no new tabs

### Test 3: Multiple Images
1. Open lead with 5+ images
2. Click last image
3. Use Previous button to navigate to first
4. **Expected:** Can navigate all images sequentially

### Test 4: Broken Images
1. Open lead with expired/broken image URLs
2. **Expected:** SVG placeholder shows, no black screen

---

## Priority Matrix

| Issue | Severity | Complexity | Priority |
|-------|----------|------------|----------|
| Black image previews | CRITICAL | Medium | **P0** |
| No navigation (lightbox) | HIGH | High | **P0** |
| Static feel | MEDIUM | Low | **P1** |
| Image download | LOW | Low | **P2** |
| Image metadata | LOW | Low | **P2** |

---

## Recommendations

### Immediate (Before Ship)
1. **Fix image loading** - Investigate URLs, implement proper loading
2. **Implement lightbox** - Basic navigation (prev/next/close)
3. **Add error fallback** - SVG placeholder for broken images

### Post-MVP
1. Add keyboard navigation
2. Add image counter
3. Add download button
4. Add zoom functionality
5. Add thumbnail strip

### Nice to Have
1. Image metadata display
2. Image editing/cropping
3. Bulk download
4. Slideshow mode

---

## Sign-off

**Status:** BLOCKED FROM SHIP ❌

**Blockers:**
1. Image previews not loading (black screens)
2. No image navigation (opens new tabs)

**Recommendation:**
Complete Phase 1 & 2 fixes before shipping. Lightbox can be post-MVP if time-constrained, but image loading MUST work.

---

**Next Steps:**
1. Investigate image URLs in database
2. Determine fix strategy (URL normalization vs proxy vs storage)
3. Implement chosen solution
4. Add lightbox for navigation
5. Re-test and verify fixes

