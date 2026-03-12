
import React from 'react';
import ServicePageTemplate, { Benefit, PricingTier, AddOn } from '../components/ServicePageTemplate';
import { Droplet, ShieldCheck, Sparkles, Layers } from 'lucide-react';

const ServiceRegrouting: React.FC = () => {
  const heroData = {
    title: "Leaking Shower & Epoxy Grout Specialists",
    subtitle: "Stop leaks permanently without removing tiles. We utilize hospital-grade epoxy resin to create a 100% waterproof barrier, backed by a 10-year guarantee against water penetration.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80"
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

  return (
    <ServicePageTemplate 
      hero={heroData}
      benefits={benefitsData}
      pricing={pricingData}
      addOns={addOnsData}
    />
  );
};

export default ServiceRegrouting;
