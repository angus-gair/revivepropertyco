/**
 * EXAMPLE: How to integrate usePageSEO + schemas into each page component.
 *
 * This file shows the pattern for the Pressure Washing page.
 * Apply the same pattern to every service page, homepage, contact, book, etc.
 *
 * DO NOT use this file directly — integrate the hooks into your existing components.
 */

import { usePageSEO } from '../hooks/usePageSEO';
import { SEO } from '../seoConfig';
import { FAQSchema, ServiceSchema } from '../components/SEOSchemas';

// ========================================
// HOMEPAGE — add inside your homepage component
// ========================================
// function HomePage() {
//   usePageSEO(SEO.home);
//   return ( ... existing JSX ... );
// }


// ========================================
// PRESSURE WASHING PAGE — full example
// ========================================
function PressureWashingPageExample() {
  // 1. Set page-level SEO (title, description, canonical, OG)
  usePageSEO(SEO.pressureWashing);

  // 2. Your existing component code goes here...
  // const hero = { ... };
  // const benefits = { ... };
  // etc.

  return (
    <>
      {/* 3. Add FAQ schema for this service */}
      <FAQSchema
        faqs={[
          {
            question: 'How much does pressure washing cost in Canberra?',
            answer:
              'Pressure washing in Canberra typically starts from $150 for a single driveway (up to 40m²). A full exterior restoration starts at $800+. Contact Revive Property Co. for a free quote tailored to your property.',
          },
          {
            question: 'How long does pressure washing take?',
            answer:
              'Most residential pressure washing jobs take 2-4 hours. Larger properties or heavily stained surfaces may take a full day.',
          },
          {
            question: 'Will pressure washing damage my driveway or paint?',
            answer:
              'No. We use appropriate pressure levels and soft-wash techniques for delicate surfaces. Our trained operators assess each surface type before cleaning.',
          },
          {
            question: 'Do you pressure wash in winter in Canberra?',
            answer:
              'Yes, we operate year-round. Winter is actually ideal for cleaning before algae and mould become established in the warmer months.',
          },
        ]}
      />

      {/* 4. Add Service schema */}
      <ServiceSchema
        name="Pressure Washing"
        description="Professional high-pressure and soft-wash cleaning for driveways, patios, building facades, and roofs in the Canberra region."
        areaServed="Canberra, ACT"
        priceRange="$150 - $800+"
        url="https://revivepropertyco.au/pressure-washing"
      />

      {/* 5. Your existing page JSX */}
      {/* <ServicePage hero={hero} benefits={benefits} pricing={pricing} addOns={addOns} /> */}
    </>
  );
}


// ========================================
// REGROUTING PAGE — add these to your existing component
// ========================================
// function RegroutingPage() {
//   usePageSEO(SEO.regrouting);
//   return (
//     <>
//       <FAQSchema faqs={[
//         { question: 'Can you fix a leaking shower without removing tiles?', answer: 'Yes! Our epoxy regrouting process creates a 100% waterproof seal without removing any tiles. It\'s faster, cheaper, and less disruptive than re-tiling.' },
//         { question: 'How long does epoxy regrouting last?', answer: 'Epoxy grout is permanent. We offer a 10-year guarantee against water penetration. Unlike cement grout, epoxy does not crack, shrink, or absorb moisture.' },
//         { question: 'How much does shower regrouting cost in Canberra?', answer: 'A targeted shower base leak repair starts from $380. A full wall-to-floor epoxy restoration costs $950-$1,400 depending on shower size.' },
//       ]} />
//       <ServiceSchema name="Epoxy Regrouting" description="Leaking shower repair and epoxy grout specialists in Canberra. Fix leaks without removing tiles." areaServed="Canberra, ACT" priceRange="$380 - $1,400" url="https://revivepropertyco.au/regrouting" />
//       {/* existing JSX */}
//     </>
//   );
// }


// ========================================
// GARDEN MAINTENANCE PAGE
// ========================================
// function GardenMaintenancePage() {
//   usePageSEO(SEO.gardenMaintenance);
//   return (
//     <>
//       <FAQSchema faqs={[
//         { question: 'How much does lawn mowing cost in Canberra?', answer: 'A standard precision mow for residential blocks starts from $60-$90 including edging and blowing.' },
//         { question: 'Do you do one-off garden cleanups?', answer: 'Yes! Our Garden Overhaul service is perfect for neglected properties or pre-sale transformations, starting from $400.' },
//       ]} />
//       <ServiceSchema name="Garden Maintenance" description="Regular lawn mowing, hedge trimming, and garden care in Canberra." areaServed="Canberra, ACT" priceRange="$60 - $500+" url="https://revivepropertyco.au/garden-maintenance" />
//       {/* existing JSX */}
//     </>
//   );
// }


// ========================================
// POOL MAINTENANCE PAGE
// ========================================
// function PoolMaintenancePage() {
//   usePageSEO(SEO.poolMaintenance);
//   return (
//     <>
//       <FAQSchema faqs={[
//         { question: 'How often should I have my pool serviced in Canberra?', answer: 'We recommend monthly maintenance visits. During summer with heavy use, fortnightly is ideal.' },
//         { question: 'My pool has turned green. Can you fix it?', answer: 'Yes! Our Green Pool Recovery service starts from $300 and includes shock treatment, flocculant, vacuum-to-waste, and filter degreasing.' },
//       ]} />
//       <ServiceSchema name="Pool Maintenance" description="Professional pool cleaning and chemical balancing in Canberra." areaServed="Canberra, ACT" priceRange="$50 - $300+" url="https://revivepropertyco.au/pool-maintenance" />
//       {/* existing JSX */}
//     </>
//   );
// }


// ========================================
// RUBBISH REMOVAL PAGE
// ========================================
// function RubbishRemovalPage() {
//   usePageSEO(SEO.rubbishRemoval);
//   return (
//     <>
//       <FAQSchema faqs={[
//         { question: 'How much does rubbish removal cost in Canberra?', answer: 'Single item pickup (fridge, mattress, sofa) starts from $60-$80. A full trailer load is $180-$250.' },
//         { question: 'Can you remove green waste?', answer: 'Yes! We handle green waste, general household junk, furniture, and more. We sort recyclables and donate where possible.' },
//       ]} />
//       <ServiceSchema name="Rubbish Removal" description="Fast junk removal and property clearouts in Canberra." areaServed="Canberra, ACT" priceRange="$60 - $450+" url="https://revivepropertyco.au/rubbish-removal" />
//       {/* existing JSX */}
//     </>
//   );
// }


// ========================================
// BOOK & CONTACT PAGES — simpler, just need usePageSEO
// ========================================
// function BookPage() {
//   usePageSEO(SEO.book);
//   return ( ... existing JSX ... );
// }
//
// function ContactPage() {
//   usePageSEO(SEO.contact);
//   return ( ... existing JSX ... );
// }
//
// function SuccessPage() {
//   usePageSEO(SEO.success);
//   return ( ... existing JSX ... );
// }

export default PressureWashingPageExample;
