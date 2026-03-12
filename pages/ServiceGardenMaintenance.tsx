
import React from 'react';
import ServicePageTemplate, { Benefit, PricingTier, AddOn } from '../components/ServicePageTemplate';
import { Scissors, Sun, Leaf, Ruler } from 'lucide-react';

const ServiceGardenMaintenance: React.FC = () => {
  const heroData = {
    title: "Curated Estate Management",
    subtitle: "Architectural horticultural care for Sydney's premium residential gardens. We provide precision maintenance that respects the original landscape design intent.",
    image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80"
  };

  const benefitsData = {
    subheading: "Horticultural Spec",
    heading: "Landscape Integrity & Value",
    description: "Property value is inextricably linked to curb appeal and garden health. Our management protocols ensure that your outdoor assets are maintained to exhibition standards.",
    items: [
      {
        title: 'Precision Edging',
        description: 'We don\'t just mow; we sculpt. Using technical edging tools to create sharp, architectural lines between lawn and hardscape.',
        icon: Ruler,
      },
      {
        title: 'Growth Management',
        description: 'Strategic pruning and hedging to promote structural health and aesthetic symmetry across all plant species.',
        icon: Scissors,
      },
      {
        title: 'Waste Extraction',
        description: 'Zero-trace operational standard. All green waste is extracted and processed off-site, leaving the property in pristine condition.',
        icon: Leaf,
      },
    ] as Benefit[]
  };

  const pricingData = {
    heading: "Management Frameworks",
    description: "Regular scheduled maintenance is prioritized for Eastern Suburbs estates. One-off overhaul rates are available based on site assessment.",
    tiers: [
      {
        name: 'THE PRECISION MOW',
        price: '$90-$120',
        description: 'Elite lawn maintenance for standard residential blocks including technical edging.',
        features: [
          'LAWN MOWING (UP TO 400M²)',
          'TECHNICAL VERTICAL EDGING',
          'PATH & DRIVEWAY BLOW-DOWN',
          'CLIPPINGS EXTRACTION',
          'MONTHLY FEEDING CYCLE'
        ],
        buttonText: 'BOOK MOW'
      },
      {
        name: 'ESTATE CARE',
        price: '$180-$250',
        description: 'Comprehensive garden management including hedging, weeding, and health checks.',
        recommended: true,
        features: [
          'EVERYTHING IN "PRECISION MOW"',
          'STRUCTURAL HEDGE TRIMMING',
          'WEED SUPPRESSION (MANUAL/SPRAY)',
          'LEAF LITTER CLEARANCE',
          'PRUNING OF SMALL SHRUBS'
        ],
        buttonText: 'BOOK ESTATE CARE'
      },
      {
        name: 'GARDEN OVERHAUL',
        price: '$500+',
        description: 'For neglected properties or pre-sale transformations. Heavy horticultural restoration.',
        features: [
          'OVERGROWN AREA RECLAMATION',
          'HEAVY TREE LOPPING (UP TO 3M)',
          'MULCH & SOIL ENHANCEMENT',
          'FULL SITE GREEN WASTE REMOVAL',
          'PRE-SALE AESTHETIC POLISH'
        ],
        buttonText: 'REQUEST OVERHAUL QUOTE',
        link: '/contact'
      }
    ] as PricingTier[]
  };

  const addOnsData = {
    items: [
      { title: 'Mulch Supply', description: 'Architectural forest mulch or designer woodchip.', price: '$120 / m³' },
      { title: 'Fertilizer Cycle', description: 'Slow-release industrial grade lawn nutrition.', price: '$40 flat' },
      { title: 'Tree Management', description: 'Chainsaw work for high-level branches.', price: 'from $150' },
    ] as AddOn[],
    costInfo: {
      heading: "Estimation Factors",
      description: "Garden management pricing is calculated based on site complexity and waste volume.",
      points: [
        "TERRAIN ACCESS: Difficult access or steep gradients incur specialized labor loading.",
        "BIOMASS VOLUME: High-density growth requires multiple extraction cycles.",
        "SERVICE FREQUENCY: Fortnightly cycles receive optimized baseline rates."
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

export default ServiceGardenMaintenance;
