import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import { SEO } from '../seoConfig';

interface Project {
  id: string;
  title: string;
  suburb: string;
  service: string;
  date: string;
  beforeAfter: boolean;
  description: string;
  tags: string[];
}

// Placeholder structure - actual projects to be added with real content
const projects: Project[] = [
  {
    id: 'kingston-driveway',
    title: 'Kingston Driveway Transformation',
    suburb: 'Kingston',
    service: 'Pressure Washing',
    date: 'March 2026',
    beforeAfter: true,
    description: 'Complete restoration of a stained concrete driveway using soft-wash techniques.',
    tags: ['Driveway', 'Soft Wash', 'Before/After'],
  },
  {
    id: 'griffith-shower',
    title: 'Griffith Bathroom Waterproofing',
    suburb: 'Griffith',
    service: 'Epoxy Regrouting',
    date: 'February 2026',
    beforeAfter: true,
    description: 'Leaking shower repaired with epoxy regrouting - no tile removal required.',
    tags: ['Shower', 'Waterproofing', '10-Year Guarantee'],
  },
  {
    id: 'deakin-garden',
    title: 'Deakin Estate Overhaul',
    suburb: 'Deakin',
    service: 'Garden Maintenance',
    date: 'March 2026',
    beforeAfter: true,
    description: 'Complete garden restoration including hedging, lawn care, and cleanup.',
    tags: ['Hedging', 'Lawn Care', 'Estate Maintenance'],
  },
  {
    id: 'braddon-pool',
    title: 'Braddon Pool Recovery',
    suburb: 'Braddon',
    service: 'Pool Maintenance',
    date: 'January 2026',
    beforeAfter: true,
    description: 'Green pool transformed to crystal clear in just 48 hours.',
    tags: ['Green Pool', 'Chemical Balance', 'Recovery'],
  },
  {
    id: 'hughes-rubbish',
    title: 'Hughes Property Clearout',
    suburb: 'Hughes',
    service: 'Rubbish Removal',
    date: 'February 2026',
    beforeAfter: true,
    description: 'Full property cleanout including green waste and general rubbish removal.',
    tags: ['Cleanout', 'Green Waste', 'Removal'],
  },
  {
    id: 'yarralumla-patio',
    title: 'Yarralumla Patio Restoration',
    suburb: 'Yarralumla',
    service: 'Pressure Washing',
    date: 'March 2026',
    beforeAfter: true,
    description: 'Patio and deck cleaning to prepare for summer entertaining season.',
    tags: ['Patio', 'Deck', 'Exterior Cleaning'],
  },
];

const ProjectsPage: React.FC = () => {
  usePageSEO(SEO.projects);

  return (
    <div className="bg-[#FDFCFB] min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#121212] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center space-x-5 mb-8">
            <span className="w-12 h-px bg-[#36453B]"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#36453B]">Our Work</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8">
            Recent Projects.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Real results for real Canberra homeowners. Browse our before-and-after transformations across Braddon, Kingston, Griffith, and surrounding suburbs.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-white border-b border-slate-200 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-[#121212] text-white text-xs font-medium">All Projects</button>
            <button className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200">Pressure Washing</button>
            <button className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200">Regrouting</button>
            <button className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200">Garden</button>
            <button className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200">Pool</button>
            <button className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200">Rubbish Removal</button>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div key={project.id} className="group bg-white border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow">
                {/* Placeholder for project image */}
                <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  <ImageIcon className="w-16 h-16 text-slate-300" />
                  {project.beforeAfter && (
                    <div className="absolute top-4 right-4 bg-[#36453B] text-white px-3 py-1 text-[9px] font-black uppercase tracking-wider">
                      Before/After
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                    <MapPin className="w-3 h-3" />
                    <span>{project.suburb}</span>
                    <span>•</span>
                    <Calendar className="w-3 h-3" />
                    <span>{project.date}</span>
                  </div>

                  <h3 className="text-lg font-black uppercase tracking-tight text-[#121212] mb-2">{project.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{project.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-100 text-[10px] font-medium text-slate-500 uppercase">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#36453B] group-hover:text-[#121212]">
                    View Project
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="px-10 py-4 border border-[#121212] text-[#121212] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#121212] hover:text-white transition-all">
              Load More Projects
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#121212] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-6">Have a Project in Mind?</h2>
          <p className="text-slate-400 mb-8">Get a free quote for your property maintenance needs.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/book" className="bg-white text-[#121212] px-12 py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] hover:text-white transition-all">
              Get a Quote
            </Link>
            <Link to="/contact" className="border border-white/30 text-white px-12 py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-[#121212] transition-all">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProjectsPage;
