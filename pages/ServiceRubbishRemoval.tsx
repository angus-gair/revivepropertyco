import React from 'react';
import ServicePageTemplate, { Benefit, PricingTier, AddOn } from '../components/ServicePageTemplate';
import { Trash2, Truck, RefreshCw } from 'lucide-react';

const ServiceRubbishRemoval: React.FC = () => {
  const heroData = {
    title: "Rubbish Removal & Decluttering",
    subtitle: "Got a pile of junk taking up space? We load it, haul it, and dispose of it responsibly so you never have to visit the tip.",
    image: "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&q=80"
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

  return (
    <ServicePageTemplate 
      hero={heroData}
      benefits={benefitsData}
      pricing={pricingData}
      addOns={addOnsData}
    />
  );
};

export default ServiceRubbishRemoval;