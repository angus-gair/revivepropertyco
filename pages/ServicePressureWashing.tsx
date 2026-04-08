
import React from 'react';
import ServicePageTemplate, { Benefit, PricingTier, AddOn } from '../components/ServicePageTemplate';
import { Home, Shield, Zap } from 'lucide-react';

const ServicePressureWashing: React.FC = () => {
  const heroData = {
    title: "Precision Pressure Restoration",
    subtitle: "High-spec cleaning for Canberra's elite residential facades. We utilize pharmaceutical-grade chemicals and low-pressure soft wash techniques to restore integrity.",
    image: "https://images.unsplash.com/photo-1621252179027-94459d27d3ee?auto=format&fit=crop&q=80"
  };

  const benefitsData = {
    subheading: "Technical Capability",
    heading: "Protecting Asset Longevity",
    description: "It's not just maintenance; it's architectural preservation. Our technical washing protocols prevent substrate degradation and biological growth.",
    items: [
      {
        title: 'Chemical Pre-Treatment',
        description: 'We utilize advanced surfactants to break down hydrocarbons and biological matter before high-pressure contact.',
        icon: Home,
      },
      {
        title: 'Safety Matrix',
        description: 'Removing slippery moss and algae hazards is critical for residential safety standards and public liability.',
        icon: Shield,
      },
      {
        title: 'Biological Control',
        description: 'Soft washing at the molecular level prevents mold spores from returning, extending the lifespan of your paint.',
        icon: Zap,
      },
    ] as Benefit[]
  };

  const pricingData = {
    heading: "Service Specifications",
    description: "Pricing is calculated based on professional trade metrics for the Canberra region. Standard rates are estimates until site inspection.",
    tiers: [
      {
        name: 'THE REFRESH',
        price: '$150-$250',
        description: 'Technical cleaning for single driveways (up to 40m²) and primary entry thresholds.',
        features: [
          'SINGLE DRIVEWAY (UP TO 40M²)',
          'FRONT ENTRY PATH RESTORATION',
          'CHEMICAL PRE-TREATMENT',
          'POST-WASH PH BALANCING RINSE'
        ],
        buttonText: 'BOOK SMALL JOB'
      },
      {
        name: 'THE OVERHAUL',
        price: '$350-$550',
        description: 'Comprehensive driveway, perimeter path, and soft wash for front house facades.',
        recommended: true,
        features: [
          'DOUBLE DRIVEWAY & PERIMETERS',
          'PERIMETER PATH TECHNICAL CLEAN',
          'FRONT FACADE SOFT WASH',
          'SPIDERWEB & DEBRIS REMOVAL',
          'BIOLOGICAL MOULD TREATMENT'
        ],
        buttonText: 'BOOK MEDIUM JOB'
      },
      {
        name: 'THE FULL REVIVE',
        price: '$800+',
        description: 'Complete exterior transformation for high-specification Canberra estates.',
        features: [
          'FULL HOUSE SOFT WASH ENVELOPE',
          'ALL CONCRETE & STONE SURFACES',
          'ROOF CLEANING (TILE/COLORBOND)',
          'FULL GUTTER CLEARANCE INCLUDED',
          'EXTERNAL WINDOW POLISHING'
        ],
        buttonText: 'GET CUSTOM QUOTE',
        link: '/contact'
      }
    ] as PricingTier[]
  };

  const addOnsData = {
    items: [
      { title: 'Stone Sealing', description: 'Architectural protection for natural stone.', price: 'from $12 / m²' },
      { title: 'Gutter Management', description: 'Internal debris removal and flushing.', price: 'from $150' },
      { title: 'Hydrocarbon Extraction', description: 'Heavy duty degreasing for oil stains.', price: '$50 flat fee' },
    ] as AddOn[],
    costInfo: {
      heading: "Valuation Factors",
      description: "Our technical quoting engine considers several variables to ensure accuracy:",
      points: [
        "SUBSTRATE AREA: Precision measurement in square meters.",
        "SOILING SEVERITY: Heavily embedded biological growth requires high-dose treatments.",
        "ACCESS RIGOUR: Multi-story or difficult-access areas utilize specialised safety rigging."
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

export default ServicePressureWashing;
