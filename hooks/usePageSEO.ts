import { useEffect } from 'react';

interface PageSEOOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noindex?: boolean;
}

export function usePageSEO({ title, description, path = '/', image, noindex = false }: PageSEOOptions) {
  useEffect(() => {
    const baseUrl = 'https://revivepropertyco.au';
    const fullUrl = `${baseUrl}${path}`;
    const ogImage = image || `${baseUrl}/og-image.jpg`;

    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    setMeta('name', 'description', description);

    // Set robots meta tag
    if (noindex) {
      setMeta('name', 'robots', 'noindex, nofollow');
    } else {
      // Remove robots tag if it exists and we're not noindex
      document.querySelector('meta[name="robots"]')?.remove();
    }

    setLink('canonical', fullUrl);

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', fullUrl);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:locale', 'en_AU');
    setMeta('property', 'og:site_name', 'Revive Property Co.');

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);
  }, [title, description, path, image]);
}

export default usePageSEO;
