#!/bin/bash
# Verification script for deployment

echo "=== Checking deployment ==="
echo ""

echo "1. Checking version badge..."
curl -s "https://revivepropertyco.au/admin/hipages-leads-noauth" | grep -q "v1.0.6" && echo "✅ Version v1.0.6 is LIVE" || echo "❌ Version not found (may be cached)"

echo ""
echo "2. Checking image proxy..."
curl -s "https://revivepropertyco.au/api/hipages/image?url=https://attachments.hipagesusercontent.com/20260415/20260415_631935905f95e789d30a8596cd8cbb5a" -I | grep -q "HTTP/2 200" && echo "✅ Image proxy is LIVE" || echo "❌ Image proxy not working"

echo ""
echo "3. Checking for old route..."
curl -s "https://revivepropertyco.au/admin/hipages-leads" | grep -q "404\|Cannot GET" && echo "✅ Old route REMOVED" || echo "⚠️ Old route may still exist"

echo ""
echo "4. Instructions for user:"
echo "   If you don't see changes, do a hard refresh:"
echo "   - Chrome/Firefox: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
echo "   - This clears Cloudflare cache"
echo ""
echo "5. What to look for:"
echo "   - Version badge: 'v1.0.6' in top right of pages"
echo "   - Image hover text: 'Click to enlarge' (NOT 'Open full size')"
echo "   - Click image → lightbox opens (NOT new tab)"
echo "   - Use arrow keys to navigate between images"
