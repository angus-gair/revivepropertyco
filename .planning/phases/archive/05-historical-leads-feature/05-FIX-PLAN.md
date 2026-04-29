# Image Loading & Lightbox - Fix Plan

## Problem Diagnosis

### Root Cause: CORS Blocking

**Issue:** hipages image URLs (`attachments.hipagesusercontent.com`) do not include CORS headers, causing browser to block image loading.

**Evidence:**
```bash
$ curl -I https://attachments.hipagesusercontent.com/...
HTTP/2 200
content-type: image/jpg
# NO Access-Control-Allow-Origin header!
```

**Browser Behavior:**
```
GET https://attachments.hipagesusercontent.com/...
Origin: https://revivepropertyco.au

Status: 200 OK (but blocked)
Error: CORS policy: No 'Access-Control-Allow-Origin' header
```

**Why Images Show Black:**
1. Browser fetches image URL
2. Server returns 200 OK with image data
3. Browser checks CORS headers
4. No `Access-Control-Allow-Origin` found
5. Browser blocks rendering → **black screen**
6. `onError` handler doesn't fire (no network error)

---

## Solution Options

### ❌ Option 1: URL Normalization
**Won't Work:** URLs are already correct absolute URLs. Issue is CORS, not path.

### ❌ Option 2: Client-side CORS Proxy
**Won't Work:** Third-party proxies (cors-anywhere) are unreliable, rate-limited, and insecure for production.

### ✅ Option 3: Backend Image Proxy (RECOMMENDED)

**Approach:** Proxy images through backend to bypass CORS

**Architecture:**
```
Browser → Backend Proxy → hipages CDN
              ↓
         Add CORS headers
              ↓
         Return to browser
```

**Benefits:**
- ✅ Fixes CORS issue completely
- ✅ Can cache images locally
- ✅ Can authenticate if needed
- ✅ Works with all browsers
- ✅ No external dependencies

**Implementation:**
```typescript
// Backend: /api/hipages/image
app.get('/api/hipages/image', async (req, res) => {
  const { url } = req.query;

  // Security: Validate URL is from hipages
  if (!url.startsWith('https://attachments.hipagesusercontent.com/')) {
    return res.status(403).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(url);

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', response.headers.get('Content-Type'));
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year

    // Pipe image data
    response.body.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});
```

**Frontend Update:**
```typescript
// Change from:
<img src={imageUrl} />

// To:
<img src={`/api/hipages/image?url=${encodeURIComponent(imageUrl)}`} />
```

---

### ✅ Option 4: Persistent Image Storage (BETTER LONG-TERM)

**Approach:** Download images during scraping and store permanently

**Benefits:**
- ✅ No dependency on hipages CDN uptime
- ✅ Images never expire
- ✅ Faster loading (local CDN)
- ✅ Can compress/optimize
- ✅ Full control

**Implementation:**

**Scraper (during extraction):**
```javascript
// In services/hipages-scraper/src/scraper.js
const downloadImage = async (imageUrl) => {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();

  // Upload to R2 or local storage
  const filename = `hipages/${Date.now()}_${uuid()}.jpg`;
  await storage.put(filename, buffer);

  return `https://revivepropertyco.au/storage/${filename}`;
};

// Replace URLs in raw_data
lead.raw_data.images = await Promise.all(
  lead.raw_data.images.map(downloadImage)
);
```

**Storage Options:**
1. **Cloudflare R2** (recommended - free tier)
2. **Local filesystem** (simpler - `/public/hipages-images/`)
3. **PostgreSQL BYTEA** (not recommended - bloated DB)

---

## Recommended Implementation Plan

### Phase 1: Quick Fix - Backend Proxy (1-2 hours)
**Goal:** Unblock image loading immediately

**Tasks:**
1. ✅ Create `/api/hipages/image` proxy endpoint
2. ✅ Add URL validation (security)
3. ✅ Add CORS headers
4. ✅ Update frontend to use proxy
5. ✅ Test image loading

**Commit Message:**
```
fix(hipages): add image proxy to bypass CORS blocking

- Add /api/hipages/image proxy endpoint
- Validate URLs are from hipagesusercontent.com
- Add CORS headers to proxied responses
- Update frontend to use proxied URLs

Fixes black screen issue where hipages images
failed to load due to CORS restrictions.
```

**Files to Change:**
- `server/api/hipages.cjs` - Add proxy endpoint
- `pages/admin/HipagesLeadsNoAuthPage.tsx` - Update image URLs

---

### Phase 2: Lightbox Navigation (2-3 hours)
**Goal:** Add proper image gallery navigation

**Component Structure:**
```typescript
// components/ImageLightbox.tsx
interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const next = () => setCurrentIndex((i) => (i + 1) % images.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white">
        <X size={32} />
      </button>

      {/* Image */}
      <img
        src={`/api/hipages/image?url=${encodeURIComponent(images[currentIndex])}`}
        className="max-w-full max-h-full object-contain"
      />

      {/* Navigation */}
      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 text-white">
            <ChevronLeft size={48} />
          </button>
          <button onClick={next} className="absolute right-4 text-white">
            <ChevronRight size={48} />
          </button>
        </>
      )}

      {/* Counter */}
      <div className="absolute bottom-4 text-white">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};
```

**Integration in HipagesLeadsNoAuthPage.tsx:**
```typescript
// Add state for lightbox
const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxImages, setLightboxImages] = useState<string[]>([]);
const [lightboxIndex, setLightboxIndex] = useState(0);

// Update click handler (line 627)
const openLightbox = (images: string[], index: number) => {
  setLightboxImages(images);
  setLightboxIndex(index);
  setLightboxOpen(true);
};

// In modal images section (line 625):
<a
  onClick={(e) => {
    e.preventDefault();
    openLightbox(images, index);
  }}
  className="cursor-pointer"
>
  <img src={...} />
</a>

// Render lightbox at bottom
{lightboxOpen && (
  <ImageLightbox
    images={lightboxImages}
    initialIndex={lightboxIndex}
    onClose={() => setLightboxOpen(false)}
  />
)}
```

**Tasks:**
1. ✅ Create ImageLightbox component
2. ✅ Add keyboard navigation (← → ESC)
3. ✅ Add prev/next buttons
4. ✅ Add image counter
5. ✅ Update modal to use lightbox
6. ✅ Test navigation

**Commit Message:**
```
feat(hipages): add image lightbox with navigation

- Create ImageLightbox component with keyboard support
- Add previous/next navigation for multi-image leads
- Add image counter display
- Replace target="_blank" with lightbox overlay
- Support arrow keys and ESC for navigation

Improves UX for browsing lead attachments.
```

---

### Phase 3: Persistent Storage (Future Enhancement)
**Goal:** Download and store images permanently

**Tasks:**
1. Create `/public/hipages-images/` directory
2. Update scraper to download images
3. Save to filesystem during extraction
4. Update URLs to local paths
5. Add to .dockerignore for build

**Why Later:**
- Requires scraper changes
- Need storage strategy (R2 vs local)
- Current proxy solution works well
- Can be added as optimization

---

## Testing Plan

### Test 1: Image Loading (After Phase 1)
1. Open lead with images
2. **Expected:** Images render correctly (no black screens)
3. **Expected:** No CORS errors in console
4. **Expected:** Images load in < 2 seconds

### Test 2: Lightbox Navigation (After Phase 2)
1. Click on image thumbnail
2. **Expected:** Lightbox opens (not new tab)
3. Press → key
4. **Expected:** Next image shows
5. Press ← key
6. **Expected:** Previous image shows
7. Press ESC
8. **Expected:** Lightbox closes

### Test 3: Multiple Images
1. Open lead with 5 images
2. Click last image
3. Use Previous button repeatedly
4. **Expected:** Can navigate through all images
5. **Expected:** Counter shows "1 / 5", "2 / 5", etc.

### Test 4: Broken Images
1. Manually test with invalid URL
2. **Expected:** SVG placeholder displays
3. **Expected:** No black screen
4. **Expected:** Error visible in console

---

## Success Criteria

### Phase 1 (Image Loading)
- ✅ All images display correctly
- ✅ No CORS errors in browser console
- ✅ Images load in < 2 seconds
- ✅ Broken images show fallback

### Phase 2 (Lightbox)
- ✅ Click opens lightbox (not new tab)
- ✅ Arrow keys navigate images
- ✅ ESC closes lightbox
- ✅ Image counter visible
- ✅ Smooth transitions

---

## Priority & Timeline

| Phase | Priority | Complexity | Estimate | Must Ship |
|-------|----------|------------|----------|-----------|
| Phase 1: Image Proxy | **P0** | Low | 1-2 hours | ✅ YES |
| Phase 2: Lightbox | **P0** | Medium | 2-3 hours | ✅ YES |
| Phase 3: Storage | P1 | High | 4-6 hours | ❌ NO |

**Total Time:** 3-5 hours for must-have features

---

## Deployment Plan

1. **Deploy Phase 1:**
   - `npm run build`
   - `docker restart revivepropertyco-backend`
   - Test image loading
   - Verify no CORS errors

2. **Deploy Phase 2:**
   - `npm run build`
   - `docker restart revivepropertyco`
   - Test lightbox navigation
   - Verify keyboard shortcuts

3. **Verification:**
   - Open 5 leads with images
   - Test all navigation features
   - Check browser console for errors
   - Confirm no black screens

---

## Rollback Plan

If issues arise:
```bash
# Rollback backend
git revert <commit-hash>
docker restart revivepropertyco-backend

# Rollback frontend
git revert <commit-hash>
npm run build
docker restart revivepropertyco
```

