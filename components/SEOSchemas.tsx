import { useEffect } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQ[];
}

export function FAQSchema({ faqs }: FAQSchemaProps) {
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

    const existing = document.getElementById('faq-schema');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-schema';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById('faq-schema')?.remove();
    };
  }, [faqs]);

  return null;
}

interface ServiceSchemaProps {
  name: string;
  description: string;
  provider?: string;
  areaServed?: string;
  priceRange?: string;
  url: string;
}

export function ServiceSchema({ name, description, provider, areaServed, priceRange, url }: ServiceSchemaProps) {
  useEffect(() => {
    const schema: Record<string, unknown> = {
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
    };

    if (priceRange) {
      schema.offers = {
        '@type': 'AggregateOffer',
        priceCurrency: 'AUD',
        description: priceRange,
      };
    }

    const id = `service-schema-${name.replace(/\s+/g, '-').toLowerCase()}`;
    document.getElementById(id)?.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [name, description, provider, areaServed, priceRange, url]);

  return null;
}

export default FAQSchema;
