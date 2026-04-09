import { useEffect } from 'react';

/**
 * usePageSEO — Sets per-page title, meta description, canonical URL,
 * and Open Graph tags. Drop-in replacement for react-helmet without
 * the extra dependency.
 *
 * Usage:
 *   usePageSEO({
 *     title: 'Pressure Washing Canberra | Revive Property Co.',
 *     description: 'Professional pressure washing in Canberra...',
 *     path: '/pressure-washing',
 *   });
 */
export function usePageSEO({ title, description, path = '/', image }) {
  useEffect(() => {
    const baseUrl = 'https://revivepropertyco.au';
    const fullUrl = `${baseUrl}${path}`;
    const ogImage = image || `${baseUrl}/og-image.jpg`;

    // Title
    document.title = title;

    // Helper: set or create a <meta> tag
    const setMeta = (attr, key, content) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper: set or create a <link> tag
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // Standard meta
    setMeta('name', 'description', description);

    // Canonical
    setLink('canonical', fullUrl);

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', fullUrl);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:locale', 'en_AU');
    setMeta('property', 'og:site_name', 'Revive Property Co.');

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);
  }, [title, description, path, image]);
}

export default usePageSEO;
