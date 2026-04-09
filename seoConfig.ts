export interface PageSEOConfig {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
}

export const SEO: Record<string, PageSEOConfig> = {
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
    noindex: true,
  },

  review: {
    title: 'Leave a Review | Revive Property Co. Canberra',
    description: 'Share your experience with Revive Property Co. Your feedback helps Canberra homeowners find trusted property maintenance services.',
    path: '/review',
  },

  // Content pages
  serviceAreas: {
    title: 'Service Areas | Revive Property Co. Canberra',
    description: 'We serve Braddon, Kingston, Griffith, Deakin, Hughes, Woden Valley, Yarralumla, O\'Connor and surrounding areas in Canberra ACT. Check your location for service availability.',
    path: '/service-areas',
  },

  projects: {
    title: 'Recent Projects | Revive Property Co. Canberra',
    description: 'Browse our before-and-after transformations across Canberra. Real results for pressure washing, regrouting, garden maintenance, pool cleaning and rubbish removal projects.',
    path: '/projects',
  },

  blog: {
    title: 'Property Maintenance Guides | Revive Property Co. Canberra',
    description: 'Expert advice on property maintenance in Canberra. Cost guides, seasonal tips, troubleshooting and how-to articles for homeowners.',
    path: '/blog',
  },

  // Private routes (noindex)
  admin: {
    title: 'Admin Dashboard | Revive Property Co.',
    description: 'Admin dashboard for managing leads, appointments, and tasks.',
    path: '/admin',
    noindex: true,
  },

  login: {
    title: 'Login | Revive Property Co.',
    description: 'Admin login for Revive Property Co.',
    path: '/login',
    noindex: true,
  },

  adminRegrouting: {
    title: 'Regrouting Admin | Revive Property Co.',
    description: 'Admin panel for regrouting job management.',
    path: '/admin/regrouting',
    noindex: true,
  },

  adminTelequote: {
    title: 'TeleQuote Admin | Revive Property Co.',
    description: 'Admin panel for video consultation management.',
    path: '/admin/telequote',
    noindex: true,
  },

  telequoteSession: {
    title: 'TeleQuote Session | Revive Property Co.',
    description: 'Video consultation session.',
    path: '/session/:id',
    noindex: true,
  },
};

export default SEO;
