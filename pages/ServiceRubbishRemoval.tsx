import React from 'react';
import ServicePageTemplate, { Benefit, PricingTier, AddOn, CrossLink } from '../components/ServicePageTemplate';
import { Trash2, Truck, RefreshCw } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import { FAQSchema, ServiceSchema } from '../components/SEOSchemas';
import { SEO } from '../seoConfig';

const ServiceRubbishRemoval: React.FC = () => {
  usePageSEO(SEO.rubbishRemoval);

  const heroData = {
    title: "Rubbish Removal & Decluttering",
    subtitle: "Got a pile of junk taking up space? We load it, haul it, and dispose of it responsibly so you never have to visit the tip.",
    image: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80",
    imageAlt: "Rubbish removal trailer loaded with green waste and household items in Canberra"
  };

  const benefitsData = {
    subheading: "Clear The Clutter",
    heading: "Fast, Easy Waste Removal",
    description: "Whether you're moving house, cleaning out the garage, or just have too much hard rubbish, we make it disappear.",
    items: [
      {
        title: 'We Load It',
        description: 'Don\'t break your back. Point to the pile, and we will carry it to the trailer for you.',
        icon: Truck,
      },
      {
        title: 'Responsible Disposal',
        description: 'We sort recyclables, green waste, and donations to minimize what ends up in landfill.',
        icon: RefreshCw,
      },
      {
        title: 'End of Lease',
        description: 'Perfect for tenants needing to clear a property quickly to get their bond back.',
        icon: Trash2,
      },
    ] as Benefit[]
  };

  const pricingData = {
    heading: "Load Rates",
    description: "Pricing includes labor, transport, and tip fees. Heavy items may incur surcharges.",
    tiers: [
      {
        name: 'Single Item',
        price: '$60 - $80',
        description: 'Pick up of a fridge, mattress, or sofa.',
        features: [
          'Curbside or Easy Access',
          'Loading Included',
          'Tip Fees Included',
          '15-30 min Service'
        ],
        buttonText: 'Book Pickup'
      },
      {
        name: 'Trailer Load',
        price: '$180 - $250',
        description: 'Standard 6x4 trailer load (approx 1 cubic meter).',
        recommended: true,
        features: [
          'General Household Junk',
          'Green Waste',
          'Cardboard / Packaging',
          'Garage Cleanout'
        ],
        buttonText: 'Book Trailer'
      },
      {
        name: 'Property Clearout',
        price: '$450+',
        description: 'Multiple loads for full house or yard clearances.',
        features: [
          'Multiple Trailer Loads',
          'Two Man Team',
          'Heavy Lifting',
          'Sweep Up Afterwards',
          'Deceased Estates'
        ],
        buttonText: 'Get Quote',
        link: '/contact'
      }
    ] as PricingTier[]
  };

  const addOnsData = {
    items: [
      { title: 'Mattress Disposal', description: 'Surcharge for mattress recycling fees.', price: '$40 each' },
      { title: 'Car Tyres', description: 'Disposal fee per tyre.', price: '$15 each' },
      { title: 'Heavy Items', description: 'Concrete, bricks, or soil.', price: 'POA' },
    ] as AddOn[],
    costInfo: {
      heading: "What we can't take",
      description: "For safety and legal reasons, there are some items we cannot accept.",
      points: [
        "Hazardous Waste: Asbestos, chemicals, paint, or biological waste.",
        "Heavy Construction: We are not a skip bin service for heavy demolition rubble.",
        "Access: Items must be accessible without risking damage to walls or doorways."
      ]
    }
  };

  const faqs = [
    { question: 'How much does rubbish removal cost in Canberra?', answer: 'Single item pickup (fridge, mattress, sofa) starts from $60-$80. A full trailer load is $180-$250.' },
    { question: 'Can you remove green waste?', answer: 'Yes! We handle green waste, general household junk, furniture, and more. We sort recyclables and donate where possible.' },
    { question: 'Do you do same-day rubbish removal in Canberra?', answer: 'Yes, same-day service is often available depending on our schedule. Call 02 8201 3710 to check availability.' },
  ];

  const crossLinks: CrossLink[] = [
    {
      title: 'Garden Maintenance',
      description: 'Complete garden cleanups with green waste removal included.',
      href: '/garden-maintenance'
    },
    {
      title: 'Pressure Washing',
      description: 'Clean up after rubbish removal with a thorough pressure wash.',
      href: '/pressure-washing'
    },
    {
      title: 'Book a Pickup',
      description: 'Schedule rubbish removal at your convenience.',
      href: '/book'
    }
  ];

  return (
    <>
      <FAQSchema faqs={faqs} />
      <ServiceSchema
        name="Rubbish Removal"
        description="Fast, affordable rubbish removal in Canberra. Single items, trailer loads or full property clearouts. We load, haul and dispose responsibly. Same-day service available."
        areaServed="Canberra, ACT"
        priceRange="$60 - $450+"
        url="https://revivepropertyco.au/rubbish-removal"
      />
      <ServicePageTemplate
        hero={heroData}
        benefits={benefitsData}
        pricing={pricingData}
        addOns={addOnsData}
        seoH1="Rubbish Removal & Junk Collection Canberra"
        aeoIntro="Fast rubbish removal in Canberra starts from $60 for single items. We load, haul, and dispose responsibly with same-day service available."
        crossLinks={crossLinks}
        faqs={faqs}
      />
    </>
  );
};

export default ServiceRubbishRemoval;
