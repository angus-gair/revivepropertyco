import React from 'react';
import ServicePageTemplate, { Benefit, PricingTier, AddOn, CrossLink } from '../components/ServicePageTemplate';
import { Waves, Droplet, Thermometer } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import { FAQSchema, ServiceSchema } from '../components/SEOSchemas';
import { SEO } from '../seoConfig';

const ServicePoolMaintenance: React.FC = () => {
  usePageSEO(SEO.poolMaintenance);

  const heroData = {
    title: "Crystal Clear Pool Maintenance",
    subtitle: "Spend your summer swimming, not skimming. We handle the chemicals, cleaning, and equipment checks so your pool is always ready to dive in.",
    image: "https://images.unsplash.com/photo-1576013551627-5cc20b3db415?auto=format&fit=crop&q=80",
    imageAlt: "Crystal clear swimming pool in Canberra backyard - professional pool cleaning and maintenance"
  };

  const benefitsData = {
    subheading: "Pool Care Made Easy",
    heading: "Healthier Water, Longer Lasting Equipment",
    description: "A neglected pool isn't just ugly; it's expensive to fix. Regular balancing prevents algae blooms and protects your pump from corrosion.",
    items: [
      {
        title: 'Chemical Balance',
        description: 'We precisely test and balance pH, chlorine, and alkalinity to ensure the water is safe for eyes and skin.',
        icon: Droplet,
      },
      {
        title: 'Equipment Health',
        description: 'We check pumps, filters, and chlorinators every visit to catch small issues before they become expensive repairs.',
        icon: Thermometer,
      },
      {
        title: 'Sparkling Clean',
        description: 'Skimming, brushing, and vacuuming. We leave your pool looking like a resort sanctuary.',
        icon: Waves,
      },
    ] as Benefit[]
  };

  const pricingData = {
    heading: "Pool Service Rates",
    description: "Chemicals are charged separately based on consumption to ensure you only pay for what you need.",
    tiers: [
      {
        name: 'Test & Balance',
        price: '$50',
        description: 'We come to you, test the water, and add necessary chemicals.',
        features: [
          'Professional Water Test',
          'Chemical Application',
          'Equipment Check',
          'Detailed Report'
        ],
        buttonText: 'Book Test'
      },
      {
        name: 'Standard Clean',
        price: '$80 - $100',
        description: 'Monthly maintenance visit. Includes cleaning and balancing.',
        recommended: true,
        features: [
          'Water Test & Balance',
          'Scoop & Brush Walls',
          'Empty Skimmer Baskets',
          'Backwash Filter',
          'Vacuum (if required)'
        ],
        buttonText: 'Book Clean'
      },
      {
        name: 'Green Pool Recovery',
        price: '$300+',
        description: 'For pools that have turned into swamps. Multiple visits required.',
        features: [
          'Shock Treatment',
          'Heavy Flocculant',
          'Vacuum to Waste',
          'Filter Degreasing',
          'Clarifier Application'
        ],
        buttonText: 'Get Quote',
        link: '/contact'
      }
    ] as PricingTier[]
  };

  const addOnsData = {
    items: [
      { title: 'Salt Bags', description: 'Supply and add pool salt (20kg).', price: '$25 / bag' },
      { title: 'Filter Clean', description: 'Deep chemical clean of cartridge filter.', price: '$60' },
      { title: 'Mineral Conversion', description: 'Convert your pool to magnesium minerals.', price: 'POA' },
    ] as AddOn[],
    costInfo: {
      heading: "About Pool Costs",
      description: "Pool maintenance costs are generally split into service labor and chemical costs.",
      points: [
        "Chemicals: Charged at retail prices. An average monthly chemical bill is $20-$40.",
        "Condition: Storms or heavy usage will increase chemical consumption.",
        "Equipment: Repairs to pumps or chlorinators are quoted separately."
      ]
    }
  };

  const faqs = [
    { question: 'How often should I have my pool serviced in Canberra?', answer: 'We recommend monthly maintenance visits. During summer with heavy use, fortnightly is ideal.' },
    { question: 'My pool has turned green. Can you fix it?', answer: 'Yes! Our Green Pool Recovery service starts from $300 and includes shock treatment, flocculant, vacuum-to-waste, and filter degreasing.' },
    { question: 'How much does pool maintenance cost in Canberra?', answer: 'Regular pool maintenance visits start from $50 per service. Green pool recovery and equipment repairs are quoted separately.' },
  ];

  const crossLinks: CrossLink[] = [
    {
      title: 'Garden Maintenance',
      description: 'Complete outdoor maintenance including pool surroundings.',
      href: '/garden-maintenance'
    },
    {
      title: 'Pressure Washing',
      description: 'Clean pool decks and surrounding paved areas.',
      href: '/pressure-washing'
    },
    {
      title: 'Book a Service',
      description: 'Schedule regular pool maintenance or green pool recovery.',
      href: '/book'
    }
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <ServiceSchema
        name="Pool Maintenance"
        description="Professional pool cleaning, chemical balancing, equipment checks and green pool recovery in Canberra. Keep your pool pristine year-round."
        areaServed="Canberra, ACT"
        priceRange="$50 - $300+"
        url="https://revivepropertyco.au/pool-maintenance"
      />
      <ServicePageTemplate
        hero={heroData}
        benefits={benefitsData}
        pricing={pricingData}
        addOns={addOnsData}
        seoH1="Pool Cleaning & Maintenance Canberra"
        aeoIntro="Professional pool maintenance in Canberra starts from $50 per service. We handle chemical balancing, equipment checks, and green pool recovery for homes across the ACT."
        crossLinks={crossLinks}
        faqs={faqs}
      />
    </>
  );
};

export default ServicePoolMaintenance;
