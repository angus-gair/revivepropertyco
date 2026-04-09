
import React from 'react';
import ServicePageTemplate, { Benefit, PricingTier, AddOn, CrossLink } from '../components/ServicePageTemplate';
import { Home, Shield, Zap } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import { FAQSchema, ServiceSchema } from '../components/SEOSchemas';
import { SEO } from '../seoConfig';

const ServicePressureWashing: React.FC = () => {
  usePageSEO(SEO.pressureWashing);

  const heroData = {
    title: "Precision Pressure Restoration",
    subtitle: "High-spec cleaning for Canberra's elite residential facades. We utilize pharmaceutical-grade chemicals and low-pressure soft wash techniques to restore integrity.",
    image: "https://images.unsplash.com/photo-1621252179027-94459d27d3ee?auto=format&fit=crop&q=80",
    imageAlt: "Professional pressure washing a concrete driveway in Braddon, Canberra"
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

  const faqs = [
    { question: 'How much does pressure washing cost in Canberra?', answer: 'Pressure washing in Canberra typically starts from $150 for a single driveway (up to 40m²). A full exterior restoration starts at $800+. Contact Revive Property Co. for a free quote tailored to your property.' },
    { question: 'How long does pressure washing take?', answer: 'Most residential pressure washing jobs take 2-4 hours. Larger properties or heavily stained surfaces may take a full day.' },
    { question: 'Will pressure washing damage my driveway or paint?', answer: 'No. We use appropriate pressure levels and soft-wash techniques for delicate surfaces. Our trained operators assess each surface type before cleaning.' },
    { question: 'Do you pressure wash in winter in Canberra?', answer: 'Yes, we operate year-round. Winter is actually ideal for cleaning before algae and mould become established in the warmer months.' },
  ];

  const crossLinks: CrossLink[] = [
    {
      title: 'Garden Maintenance',
      description: 'Complete garden cleanup after pressure washing for a transformed property.',
      href: '/garden-maintenance'
    },
    {
      title: 'Epoxy Regrouting',
      description: 'Fix leaking showers and restore grout to like-new condition.',
      href: '/regrouting'
    },
    {
      title: 'Rubbish Removal',
      description: 'Clear away green waste and debris after exterior cleaning.',
      href: '/rubbish-removal'
    }
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <ServiceSchema
        name="Pressure Washing"
        description="Professional high-pressure and soft-wash cleaning for driveways, patios, building facades, and roofs in the Canberra region."
        areaServed="Canberra, ACT"
        priceRange="$150 - $800+"
        url="https://revivepropertyco.au/pressure-washing"
      />
      <ServicePageTemplate
        hero={heroData}
        benefits={benefitsData}
        pricing={pricingData}
        addOns={addOnsData}
        seoH1="Professional Pressure Washing in Canberra"
        aeoIntro="Professional pressure washing in Canberra starts from $150. We use soft-wash techniques and pharmaceutical-grade chemicals to safely restore driveways, patios, and building exteriors. Free quotes available."
        crossLinks={crossLinks}
        faqs={faqs}
      />
    </>
  );
};

export default ServicePressureWashing;
