/**
 * FAQ Schema component for service pages.
 * Injects FAQ structured data (JSON-LD) that Google can display
 * as rich results in search.
 *
 * Usage:
 *   <FAQSchema faqs={[
 *     { question: "How much does pressure washing cost?", answer: "From $150..." },
 *     { question: "How long does it take?", answer: "2-4 hours..." },
 *   ]} />
 */
import { useEffect } from 'react';

export function FAQSchema({ faqs = [] }) {
  useEffect(() => {
    if (!faqs.length) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-schema';
    script.textContent = JSON.stringify(schema);

    // Remove any existing FAQ schema
    const existing = document.getElementById('faq-schema');
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('faq-schema');
      if (el) el.remove();
    };
  }, [faqs]);

  return null;
}

/**
 * Service Schema component for service pages.
 * Adds structured data for a specific service offering.
 *
 * Usage:
 *   <ServiceSchema
 *     name="Pressure Washing"
 *     description="Professional pressure washing..."
 *     provider="Revive Property Co."
 *     areaServed="Canberra, ACT"
 *     priceRange="$150 - $800+"
 *     url="https://revivepropertyco.au/pressure-washing"
 *   />
 */
export function ServiceSchema({ name, description, provider, areaServed, priceRange, url }) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name,
      description,
      url,
      provider: {
        '@type': 'LocalBusiness',
        name: provider || 'Revive Property Co.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '802/2 Marcus Clarke Street',
          addressLocality: 'Canberra',
          addressRegion: 'ACT',
          postalCode: '2601',
          addressCountry: 'AU',
        },
      },
      areaServed: {
        '@type': 'City',
        name: areaServed || 'Canberra',
      },
      ...(priceRange && {
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'AUD',
          description: priceRange,
        },
      }),
    };

    const id = `service-schema-${name.replace(/\s+/g, '-').toLowerCase()}`;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(schema);

    const existing = document.getElementById(id);
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [name, description, provider, areaServed, priceRange, url]);

  return null;
}

export default FAQSchema;
