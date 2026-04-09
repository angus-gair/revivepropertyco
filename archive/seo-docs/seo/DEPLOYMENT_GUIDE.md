# 🚀 SEO Implementation — Deployment Guide

> **Files location:** `~/.gemini/antigravity/scratch/revivepropertyco-seo/`
> **Deploy to:** `razor-edge:/opt/homelab/apps/revivepropertyco/`

---

## Files Created

```
revivepropertyco-seo/
├── public/
│   ├── index.html          ← Replace your existing index.html
│   ├── sitemap.xml          ← NEW: Google sitemap
│   └── robots.txt           ← NEW: Clean robots.txt
├── src/
│   ├── hooks/
│   │   └── usePageSEO.jsx   ← NEW: Per-page SEO hook
│   ├── components/
│   │   └── SEOSchemas.jsx   ← NEW: FAQ + Service JSON-LD
│   ├── seoConfig.js         ← NEW: Centralised SEO data
│   └── INTEGRATION_EXAMPLES.jsx  ← Reference: how to wire it up
└── DEPLOYMENT_GUIDE.md      ← This file
```

---

## Step 1: CRITICAL — Switch from HashRouter to BrowserRouter

This is the **#1 most important change**. Find your main app file (likely `src/App.jsx` or `src/main.jsx`) and change:

```diff
- import { HashRouter } from 'react-router-dom';
+ import { BrowserRouter } from 'react-router-dom';

  // In your render:
- <HashRouter>
+ <BrowserRouter>
    <App />
- </HashRouter>
+ </BrowserRouter>
```

From the bundle, your router setup is in the `fM` component (which renders `QT` — the HashRouter). Find and replace it.

### Also update the chatbot system prompt

The Riv chatbot currently references `#/book` and `#/contact`. Update these to `/book` and `/contact`:

```diff
- Direct users to: Online Booking: "#/book"
- Custom Quotes: "#/contact"
+ Direct users to: Online Booking: "/book"
+ Custom Quotes: "/contact"
```

---

## Step 2: Server Config — SPA Fallback

After switching to BrowserRouter, your web server must serve `index.html` for all routes. Without this, direct links like `revivepropertyco.au/pressure-washing` will 404.

### If using Nginx:

```nginx
server {
    listen 80;
    server_name revivepropertyco.au;
    root /var/www/revivepropertyco/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Serve static files with cache headers
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Ensure sitemap.xml and robots.txt are served as-is
    location = /sitemap.xml {
        default_type application/xml;
    }
    location = /robots.txt {
        default_type text/plain;
    }
}
```

### If using Caddy:

```caddyfile
revivepropertyco.au {
    root * /var/www/revivepropertyco/dist
    file_server
    try_files {path} /index.html
}
```

### If using Docker with Nginx:

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### If using Cloudflare Pages:

Create a `_redirects` file in `public/`:
```
/*    /index.html   200
```

---

## Step 3: Copy Files to Project

```bash
# From this machine to razor-edge
PROJECT="/opt/homelab/apps/revivepropertyco"
SEO_FILES="$HOME/.gemini/antigravity/scratch/revivepropertyco-seo"

# Copy static files to public/
scp $SEO_FILES/public/sitemap.xml razor-edge:$PROJECT/public/
scp $SEO_FILES/public/robots.txt razor-edge:$PROJECT/public/

# Copy source files
scp $SEO_FILES/src/hooks/usePageSEO.jsx razor-edge:$PROJECT/src/hooks/
scp $SEO_FILES/src/components/SEOSchemas.jsx razor-edge:$PROJECT/src/components/
scp $SEO_FILES/src/seoConfig.js razor-edge:$PROJECT/src/
```

---

## Step 4: Integrate SEO into Each Page

Add `usePageSEO()` to the top of every page component:

```jsx
// At the top of each component file:
import { usePageSEO } from '../hooks/usePageSEO';
import { SEO } from '../seoConfig';

// Inside the component function (first line):
usePageSEO(SEO.pressureWashing);  // use the matching key
```

For service pages, also add FAQ and Service schemas:

```jsx
import { FAQSchema, ServiceSchema } from '../components/SEOSchemas';

// In the JSX return:
<>
  <FAQSchema faqs={[...]} />
  <ServiceSchema name="..." description="..." ... />
  {/* existing page content */}
</>
```

See `INTEGRATION_EXAMPLES.jsx` for the full copy-paste snippets for each page.

---

## Step 5: Update index.html

Your current `index.html` needs the meta tags added. You can either:

**Option A:** Replace the entire file with the provided `public/index.html`, then re-add the Vite script tag. After building, Vite will inject the correct `<script>` tag automatically.

**Option B:** Manually add these tags to the `<head>` of your existing `index.html`:

```html
<!-- Add after <title> -->
<meta name="description" content="Canberra's leading property maintenance specialists..." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://revivepropertyco.au/" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://revivepropertyco.au/" />
<meta property="og:title" content="Revive Property Co. | Premium Property Maintenance Canberra" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://revivepropertyco.au/og-image.jpg" />
<meta property="og:locale" content="en_AU" />

<!-- Structured Data (paste the full JSON-LD blocks from index.html) -->
<script type="application/ld+json">{ ... }</script>
```

---

## Step 6: Remove CDN Tailwind

In `index.html`, remove this line:

```diff
- <script src="https://cdn.tailwindcss.com"></script>
```

Make sure Tailwind is installed as a dev dependency and compiled at build time:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## Step 7: Create og-image.jpg

Create a **1200×630px** image for social sharing:
- Include your logo
- A hero property photo (before/after pressure washing is great)
- Your tagline or "Premium Property Maintenance — Canberra"
- Place it in `public/og-image.jpg`

---

## Step 8: Build & Deploy

```bash
# On razor-edge, in the project directory:
npm run build

# Restart your web server / Docker container
# The built files will be in dist/ with the new sitemap.xml and robots.txt
```

---

## Step 9: Google Search Console

1. Go to https://search.google.com/search-console
2. Add property: `https://revivepropertyco.au`
3. Verify via DNS (add TXT record in Cloudflare)
4. Submit sitemap: `sitemap.xml`
5. Request indexing for each page via URL Inspection

---

## Step 10: Google Business Profile

1. Go to https://business.google.com
2. Create profile for "Revive Property Co."
3. Category: Property Maintenance
4. Address: 802/2 Marcus Clarke Street, Canberra ACT 2601
5. Phone: 02 8201 3710
6. Verify (postcard/phone)
7. Upload photos, add services, start collecting reviews

---

## Verification Checklist

After deploying, verify everything works:

- [ ] `https://revivepropertyco.au/pressure-washing` loads (not `/#/pressure-washing`)
- [ ] `https://revivepropertyco.au/sitemap.xml` returns valid XML
- [ ] `https://revivepropertyco.au/robots.txt` returns clean text (no HTML)
- [ ] View page source → confirm `<meta name="description">` is present
- [ ] View page source → confirm JSON-LD `LocalBusiness` schema is present
- [ ] Test with [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Test with [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Test with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [ ] Google Search Console → Coverage report shows no errors
