import React from 'react';
import ServicePageTemplate, { Benefit, PricingTier, AddOn, CrossLink } from '../components/ServicePageTemplate';
import { Droplet, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import { FAQSchema, ServiceSchema } from '../components/SEOSchemas';
import { SEO } from '../seoConfig';

const ServiceRegrouting: React.FC = () => {
  usePageSEO(SEO.regrouting);

  const heroData = {
    title: "Leaking Shower & Epoxy Grout Specialists",
    subtitle: "Stop leaks permanently without removing tiles. We utilize hospital-grade epoxy resin to create a 100% waterproof barrier, backed by a 10-year guarantee against water penetration.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80",
    imageAlt: "Epoxy regrouting a shower floor in Canberra - leaking shower repair without removing tiles"
  };

  const benefitsData = {
    subheading: "Why Upgrade to Epoxy?",
    heading: "The Permanent Waterproof Solution",
    description: "Standard cement grout is porous and eventually fails, causing structural water damage. Our epoxy system creates an impermeable seal that is stronger than the tile itself.",
    items: [
      {
        title: '100% Waterproof',
        description: 'Epoxy grout is impervious to water. It solves 95% of shower leaks without the need for invasive plumbing or tile removal.',
        icon: Droplet,
      },
      {
        title: 'Mould Resistant',
        description: 'Unlike cement, epoxy does not absorb moisture, meaning mould and bacteria have nowhere to grow. Your shower stays clinically clean.',
        icon: ShieldCheck,
      },
      {
        title: 'Stain Proof',
        description: 'The resin-based compound repels stains from shampoo, soap, and dyes, maintaining its color integrity for decades.',
        icon: Sparkles,
      },
    ] as Benefit[]
  };

  const pricingData = {
    heading: "Restoration Packages",
    description: "We offer fixed-price solutions for standard shower sizes. Upgrading to full Epoxy is highly recommended for long-term peace of mind.",
    tiers: [
      {
        name: 'LEAK STOP (BASE)',
        price: '$380 - $480',
        description: 'Targeted repair for leaking shower bases. Essential waterproofing.',
        features: [
          'FLOOR GROUT REMOVAL (DIAMOND TOOLING)',
          'PERIMETER SILICONE REPLACEMENT',
          'DRAIN RIM SEALING',
          'HYBRID GROUT INSTALLATION',
          'WATERPROOF CHECK'
        ],
        buttonText: 'STOP THE LEAK'
      },
      {
        name: 'FULL EPOXY ARMOUR',
        price: '$950 - $1,400',
        description: 'Complete wall-to-floor restoration using industrial epoxy. The gold standard.',
        recommended: true,
        features: [
          'FULL SHOWER DE-GROUTING (WALLS & FLOOR)',
          'STEAM CLEAN & SANITIZATION',
          '100% EPOXY RESIN INJECTION',
          'COLOUR-MATCHED SILICONE DETAIL',
          '10-YEAR LEAK-FREE GUARANTEE'
        ],
        buttonText: 'UPGRADE TO EPOXY'
      },
      {
        name: 'BALCONY SEAL',
        price: '$45/m²+',
        description: 'Volume rates for balconies and main floor areas.',
        features: [
          'MECHANICAL REMOVAL OF OLD GROUT',
          'EXPANSION JOINT REPLACEMENT',
          'CRACKED TILE REPAIRS',
          'EFFLORESCENCE REMOVAL',
          'ANTI-SLIP TREATMENTS AVAILABLE'
        ],
        buttonText: 'GET SITE QUOTE',
        link: '/contact'
      }
    ] as PricingTier[]
  };

  const addOnsData = {
    items: [
      { title: 'Silicone Refresh', description: 'Remove and replace moldy silicone only.', price: '$150 min' },
      { title: 'Cracked Tile Repair', description: 'Careful removal and replacement of broken tiles.', price: 'POA' },
      { title: 'Shower Screen Seal', description: 'Replacement of rubber seals and water deflectors.', price: '$80' },
    ] as AddOn[],
    costInfo: {
      heading: "Why choose Epoxy?",
      description: "While the initial investment is higher, epoxy grout lasts a lifetime compared to standard cement which typically fails every 3-5 years.",
      points: [
        "LONGEVITY: Epoxy does not crack, shrink, or crumble over time.",
        "VALUE: Protects your property from hidden water damage costs.",
        "AESTHETICS: Modern, smooth finish available in 50+ designer colours."
      ]
    }
  };

  const faqs = [
    { question: 'Can you fix a leaking shower without removing tiles?', answer: "Yes! Our epoxy regrouting process creates a 100% waterproof seal without removing any tiles. It's faster, cheaper, and less disruptive than re-tiling." },
    { question: 'How long does epoxy regrouting last?', answer: 'Epoxy grout is permanent. We offer a 10-year guarantee against water penetration. Unlike cement grout, epoxy does not crack, shrink, or absorb moisture.' },
    { question: 'How much does shower regrouting cost in Canberra?', answer: 'A targeted shower base leak repair starts from $380. A full wall-to-floor epoxy restoration costs $950-$1,400 depending on shower size.' },
  ];

  const crossLinks: CrossLink[] = [
    {
      title: 'Pressure Washing',
      description: 'Complete bathroom transformations with our exterior pressure washing.',
      href: '/pressure-washing'
    },
    {
      title: 'Pool Maintenance',
      description: 'Keep your entire property in pristine condition.',
      href: '/pool-maintenance'
    },
    {
      title: 'Book a Service',
      description: 'Schedule a free inspection and quote for your shower.',
      href: '/book'
    }
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <ServiceSchema
        name="Epoxy Regrouting"
        description="Leaking shower repair and epoxy grout specialists in Canberra. Fix leaks without removing tiles. 10-year waterproof guarantee."
        areaServed="Canberra, ACT"
        priceRange="$380 - $1,400"
        url="https://revivepropertyco.au/regrouting"
      />
      <ServicePageTemplate
        hero={heroData}
        benefits={benefitsData}
        pricing={pricingData}
        addOns={addOnsData}
        seoH1="Leaking Shower Repair & Epoxy Regrouting Canberra"
        aeoIntro="Yes, we can fix leaking showers without removing tiles. Epoxy regrouting in Canberra starts from $380 for a targeted shower base repair, with a 10-year waterproof guarantee."
        crossLinks={crossLinks}
        faqs={faqs}
      />
    </>
  );
};

export default ServiceRegrouting;
