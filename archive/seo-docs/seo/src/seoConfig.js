/**
 * SEO configuration for every public page.
 *
 * Import this in each page component and pass the relevant entry
 * to the usePageSEO() hook.
 *
 * Example:
 *   import { usePageSEO } from '../hooks/usePageSEO';
 *   import { SEO } from '../seoConfig';
 *   // inside component:
 *   usePageSEO(SEO.pressureWashing);
 */

export const SEO = {
  home: {
    title: 'Revive Property Co. | Premium Property Maintenance Canberra',
    description:
      "Canberra's leading property maintenance specialists. Pressure washing, epoxy regrouting, garden care, pool maintenance & rubbish removal. Family-owned, serving Braddon, Kingston, Griffith & Deakin.",
    path: '/',
  },

  pressureWashing: {
    title: 'Pressure Washing Canberra | Driveway & House Washing | Revive Property Co.',
    description:
      'Professional pressure washing and surface restoration in Canberra. Driveways, patios, decks & building exteriors. Soft wash & high-pressure cleaning. Free quotes available.',
    path: '/pressure-washing',
  },

  regrouting: {
    title: 'Leaking Shower Repair & Epoxy Regrouting Canberra | Revive Property Co.',
    description:
      'Fix leaking showers without removing tiles. Expert epoxy regrouting in Canberra with a 10-year waterproof guarantee. Bathrooms, balconies & splashbacks. Free inspections.',
    path: '/regrouting',
  },

  gardenMaintenance: {
    title: 'Garden & Lawn Maintenance Canberra | Revive Property Co.',
    description:
      'Regular garden maintenance, lawn mowing, hedge trimming & rubbish removal in Canberra. Reliable estate care for homes in Braddon, Kingston, Griffith & surrounds.',
    path: '/garden-maintenance',
  },

  poolMaintenance: {
    title: 'Pool Cleaning & Maintenance Canberra | Revive Property Co.',
    description:
      'Professional pool cleaning, chemical balancing, equipment checks & green pool recovery in Canberra. Keep your pool pristine year-round. Book today.',
    path: '/pool-maintenance',
  },

  rubbishRemoval: {
    title: 'Rubbish Removal & Junk Collection Canberra | Revive Property Co.',
    description:
      'Fast, affordable rubbish removal in Canberra. Single items, trailer loads or full property clearouts. We load, haul & dispose responsibly. Same-day service available.',
    path: '/rubbish-removal',
  },

  book: {
    title: 'Book a Service | Revive Property Co. Canberra',
    description:
      'Book a property maintenance service in Canberra. Pressure washing, regrouting, garden maintenance, pool cleaning or rubbish removal. Easy online booking.',
    path: '/book',
  },

  contact: {
    title: 'Contact Revive Property Co. | Canberra Property Maintenance',
    description:
      'Get in touch with Revive Property Co. for a free quote. Call 02 8201 3710 or email angus@gair.com.au. Office: 802/2 Marcus Clarke Street, Canberra ACT 2601.',
    path: '/contact',
  },

  success: {
    title: 'Booking Confirmed | Revive Property Co.',
    description: 'Your booking with Revive Property Co. has been confirmed. We will be in touch shortly.',
    path: '/success',
  },
};

export default SEO;
