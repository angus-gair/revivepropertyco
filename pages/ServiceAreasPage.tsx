import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, CheckCircle } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import { SEO } from '../seoConfig';

interface ServiceArea {
  name: string;
  description: string;
  turnaroundTime: string;
  services: string[];
}

const serviceAreas: ServiceArea[] = [
  {
    name: 'Braddon',
    description: 'Inner-north suburb known for heritage homes and trendy cafes.',
    turnaroundTime: 'Same-day to 48 hours',
    services: ['Pressure Washing', 'Garden Maintenance', 'Rubbish Removal'],
  },
  {
    name: 'Kingston',
    description: 'Lakeside suburb with mix of art deco apartments and family homes.',
    turnaroundTime: '24 to 48 hours',
    services: ['Pressure Washing', 'Pool Maintenance', 'Regrouting'],
  },
  {
    name: 'Griffith',
    description: 'Premium residential area with manicured gardens and large blocks.',
    turnaroundTime: 'Same-day to 48 hours',
    services: ['Garden Maintenance', 'Pool Maintenance', 'Pressure Washing'],
  },
  {
    name: 'Deakin',
    description: 'Diplomatic enclave with prestigious properties requiring careful attention.',
    turnaroundTime: 'By appointment',
    services: ['Garden Maintenance', 'Pressure Washing', 'Regrouting'],
  },
  {
    name: 'Hughes',
    description: 'Family-friendly suburb with spacious yards and established gardens.',
    turnaroundTime: '24 to 48 hours',
    services: ['Garden Maintenance', 'Pool Maintenance', 'Rubbish Removal'],
  },
  {
    name: 'Woden Valley',
    description: 'Large region including multiple suburbs with diverse housing types.',
    turnaroundTime: '24 to 72 hours',
    services: ['All Services Available'],
  },
  {
    name: 'Yarralumla',
    description: 'Waterfront suburb with stunning views and premium properties.',
    turnaroundTime: 'Same-day to 48 hours',
    services: ['Garden Maintenance', 'Pressure Washing', 'Pool Maintenance'],
  },
  {
    name: "O'Connor",
    description: 'Leafy suburb with large blocks and established vegetation.',
    turnaroundTime: '24 to 48 hours',
    services: ['Garden Maintenance', 'Rubbish Removal', 'Pressure Washing'],
  },
];

const ServiceAreasPage: React.FC = () => {
  usePageSEO(SEO.serviceAreas);

  return (
    <div className="bg-[#FDFCFB] min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#121212] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center space-x-5 mb-8">
            <span className="w-12 h-px bg-[#36453B]"></span>
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#36453B]">Service Coverage</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] mb-8">
            Service Areas.
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Professional property maintenance across Canberra and the ACT. We serve Braddon, Kingston, Griffith, Deakin, Hughes, Woden Valley, Yarralumla, O'Connor, and surrounding areas.
          </p>
        </div>
      </section>

      {/* Primary Service Areas */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#121212] mb-4">Primary Service Areas</h2>
              <p className="text-slate-500">Our core service coverage with guaranteed turnaround times.</p>
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.5em] text-[#36453B] pb-2 border-b border-[#36453B]">
              8 Suburbs
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceAreas.map((area, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 p-8 hover:border-[#121212] transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-[#36453B]" />
                  <h3 className="text-lg font-black uppercase tracking-tight text-[#121212]">{area.name}</h3>
                </div>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">{area.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>{area.turnaroundTime}</span>
                </div>
                <div className="space-y-2">
                  {area.services.map((service, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extended Coverage */}
      <section className="py-20 bg-[#F8F7F4]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-[#121212] mb-6">Rest of ACT by Availability</h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              We also service other Canberra suburbs on a case-by-case basis. Contact us to check availability for your location, even if it's not listed above.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {['Belconnen', 'Gungahlin', 'Tuggeranong', 'Weston Creek', 'Woden', 'Inner North', 'South Canberra', 'Queanbeyan'].map((area, idx) => (
                <span key={idx} className="px-4 py-2 bg-white border border-slate-200 text-xs font-medium text-slate-500">
                  {area}
                </span>
              ))}
            </div>
            <Link to="/contact" className="inline-block bg-[#121212] text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] transition-all">
              Check Your Area
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#121212] mb-12 text-center">Why Canberra Locals Trust Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-4xl font-black text-[#36453B] mb-2">10+</div>
              <div className="text-sm text-slate-500">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-[#36453B] mb-2">100%</div>
              <div className="text-sm text-slate-500">Satisfaction Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-[#36453B] mb-2">Local</div>
              <div className="text-sm text-slate-500">Family-Owned Business</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#121212] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-6">Ready to Get Started?</h2>
          <p className="text-slate-400 mb-8">Check if we service your area and book a free consultation.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/book" className="bg-white text-[#121212] px-12 py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] hover:text-white transition-all">
              Book Now
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

export default ServiceAreasPage;
