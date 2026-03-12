
import React from 'react';
import { 
  TrendingUp, 
  Hammer, 
  Scale, 
  DollarSign, 
  Wrench, 
  BookOpen, 
  Info,
  Layers,
  ShoppingBag,
  Target, 
  Zap,
  Camera,
  MessageSquare,
  ShieldCheck,
  AlertOctagon,
  MousePointer2,
  ListChecks,
  ChevronRight,
  HardHat,
  Cpu,
  Box,
  Clock,
  ClipboardList
} from 'lucide-react';

const AdminRegrouting: React.FC = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { name: 'Summary', icon: BookOpen, id: 'summary' },
    { name: 'Services', icon: ListChecks, id: 'service-details' },
    { name: 'Service Scope', icon: ClipboardList, id: 'service-scope' },
    { name: 'Fundamentals', icon: Hammer, id: 'removal' },
    { name: 'Matrix', icon: Scale, id: 'comparison' },
    { name: 'Equipment', icon: ShoppingBag, id: 'tools' },
    { name: 'Pricing', icon: DollarSign, id: 'pricing' },
    { name: 'Execution', icon: Layers, id: 'technical' },
  ];

  return (
    <div className="bg-[#FDFCFB] min-h-screen py-16 px-6 lg:px-8 font-sans text-[#121212]">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-[#121212] p-12 lg:p-20 text-white shadow-2xl mb-20 relative overflow-hidden border-b-8 border-[#36453B]">
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-12">
              <span className="bg-[#36453B] text-[10px] text-white font-black uppercase tracking-[0.5em] px-6 py-2 shadow-lg">Director Matrix v1.2</span>
            </div>
            <h1 className="text-6xl lg:text-9xl font-black tracking-tighter mb-12 leading-[0.85] uppercase">
              Regrouting <br /><span className="text-white/40">Strategic Protocol</span>
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 pt-12 border-t border-white/10">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em]">Target Margin</p>
                <p className="text-4xl font-black">45% – 60%</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em]">Floor Rate</p>
                <p className="text-4xl font-black">$35 – $55</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em]">Project LTV</p>
                <p className="text-4xl font-black">$1,200+</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Sidebar */}
          <aside className="lg:col-span-3 hidden lg:block sticky top-32 h-fit">
            <nav className="space-y-1 bg-white border border-slate-200">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center gap-5 px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-[#121212] hover:bg-slate-50 transition-all border-b border-slate-100 last:border-b-0 w-full text-left group"
                >
                  <item.icon className="w-4 h-4 text-[#36453B] group-hover:scale-110 transition-transform" />
                  {item.name}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-32 pb-32">
            <section id="summary" className="scroll-mt-32">
              <h2 className="text-4xl font-black text-[#121212] mb-12 flex items-center gap-6 uppercase tracking-tighter">
                <div className="w-3 h-12 bg-[#36453B]"></div>
                Executive Overview
              </h2>
              <div className="bg-white p-16 border border-slate-200 shadow-xl">
                <p className="text-2xl text-slate-700 leading-relaxed font-medium mb-12">
                  Regrouting is our <span className="text-[#121212] font-black italic">high-precision anchor service</span>. This guide defines the technical standard for all Sydney Eastern Suburbs operations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="p-10 bg-[#F8F7F4] border border-slate-200 flex items-start gap-6">
                      <ShieldCheck className="w-8 h-8 text-[#36453B] shrink-0" />
                      <div>
                        <h4 className="font-black text-[#121212] mb-3 uppercase tracking-widest text-xs">Retention Logic</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">Precision regrouting drives 65% repeat business in estate garden management.</p>
                      </div>
                   </div>
                   <div className="p-10 bg-[#F8F7F4] border border-slate-200 flex items-start gap-6">
                      <Cpu className="w-8 h-8 text-[#36453B] shrink-0" />
                      <div>
                        <h4 className="font-black text-[#121212] mb-3 uppercase tracking-widest text-xs">Digital Matrix</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">All leads are synchronized via the TeleQuote remote inspection pipeline.</p>
                      </div>
                   </div>
                </div>
              </div>
            </section>

            <section id="service-details" className="scroll-mt-32">
              <h2 className="text-4xl font-black text-[#121212] mb-12 flex items-center gap-6 uppercase tracking-tighter">
                <div className="w-3 h-12 bg-[#36453B]"></div>
                Operational Matrix
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border border-slate-200">
                {[
                  { title: "Shower Base", val: "$350-$450", desc: "Entry-level floor + perimeter seal.", icon: Zap },
                  { title: "Full Shower", val: "$900-$1.4k", desc: "Technical wall and floor restoration.", icon: ShieldCheck },
                  { title: "Kitchen Splash", val: "$250-$400", desc: "High-visibility architectural detail.", icon: MousePointer2 },
                  { title: "Main Floors", val: "$35/sqm+", desc: "Volume-based machine extraction.", icon: Layers }
                ].map((s, idx) => (
                  <div key={idx} className="bg-white p-12 group hover:bg-[#FDFCFB] transition-all">
                    <div className="flex justify-between items-start mb-10">
                      <div className="p-4 bg-[#F8F7F4] text-[#121212] group-hover:bg-[#121212] group-hover:text-white transition-all">
                        <s.icon className="w-8 h-8 stroke-[1]" />
                      </div>
                      <span className="text-2xl font-black text-[#121212] tracking-tighter">{s.val}</span>
                    </div>
                    <h4 className="text-xl font-black text-[#121212] mb-4 uppercase tracking-tight">{s.title}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="service-scope" className="scroll-mt-32">
              <h2 className="text-4xl font-black text-[#121212] mb-12 flex items-center gap-6 uppercase tracking-tighter">
                <div className="w-3 h-12 bg-[#36453B]"></div>
                Regrouting Service Details
              </h2>
              <div className="grid grid-cols-1 gap-8">
                {[
                  {
                    title: "Standard Shower Base Regrout",
                    duration: "4 - 6 Hours",
                    scope: [
                      "Mechanical removal of floor grout (minimum 2/3 depth).",
                      "Complete removal of perimeter silicone beads.",
                      "Anti-fungal chemical wash and substrate drying.",
                      "Installation of flexible cementitious or epoxy hybrid grout.",
                      "Application of sanitary grade architectural silicone."
                    ]
                  },
                  {
                    title: "Full Shower Enclosure (Epoxy)",
                    duration: "1 - 2 Days",
                    scope: [
                      "Wall and floor grout mechanical extraction.",
                      "Steam cleaning of tiles to remove soap scum matrix.",
                      "Injection of 2-part architectural grade epoxy.",
                      "100% waterproof seal validation.",
                      "Full perimeter and vertical joint silicone detail."
                    ]
                  },
                  {
                    title: "Main Floor / Balcony Restoration",
                    duration: "1 Day per 30m²",
                    scope: [
                      "Rotary machine cleaning and degreasing.",
                      "Mechanical extraction of joint lines.",
                      "H-Class dust extraction throughout process.",
                      "Colour-matched grout installation (Mapei/Laticrete).",
                      "Final haze removal and buffing."
                    ]
                  }
                ].map((service, idx) => (
                  <div key={idx} className="bg-white p-10 border border-slate-200 shadow-sm hover:shadow-xl transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
                      <h3 className="text-xl font-black text-[#121212] uppercase tracking-tight">{service.title}</h3>
                      <div className="flex items-center gap-3 bg-[#F8F7F4] px-4 py-2 border border-slate-200">
                        <Clock className="w-4 h-4 text-[#36453B]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">{service.duration}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Scope of Work</h4>
                      <ul className="space-y-3">
                        {service.scope.map((item, i) => (
                          <li key={i} className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 bg-[#36453B] mt-1.5 shrink-0"></div>
                            <span className="text-sm text-slate-600 font-medium leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="removal" className="scroll-mt-32">
              <h2 className="text-4xl font-black text-[#121212] mb-12 flex items-center gap-6 uppercase tracking-tighter">
                <div className="w-3 h-12 bg-[#36453B]"></div>
                Technical Fundamentals
              </h2>
              <div className="bg-[#121212] p-16 text-white shadow-2xl space-y-16">
                <div className="flex flex-col md:flex-row gap-16 items-center">
                  <div className="flex-1">
                    <h3 className="text-3xl font-black mb-6 uppercase tracking-tight">The 2/3 Depth Protocol</h3>
                    <p className="text-slate-400 font-medium leading-relaxed text-lg">
                      Absolute mandate: Minimum removal of <span className="text-white font-bold italic">2/3 of tile depth</span>. Diamond bits only. No carbide scraping permitted for professional-grade execution.
                    </p>
                  </div>
                  <div className="w-full md:w-80 aspect-square bg-[#36453B]/10 border-4 border-dashed border-[#36453B]/20 flex flex-col items-center justify-center text-[#36453B]">
                    <Hammer className="w-16 h-16 mb-6 opacity-30" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Visual Reference</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div className="p-10 border border-white/5 bg-white/5">
                    <h5 className="font-black text-[#36453B] mb-4 uppercase tracking-widest text-xs">Vibration Control</h5>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Oscillating MM700 required for perimeter work to negate ceramic stress cracking.</p>
                  </div>
                  <div className="p-10 border border-white/5 bg-white/5">
                    <h5 className="font-black text-[#36453B] mb-4 uppercase tracking-widest text-xs">Extraction</h5>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">H-Class filtration mandatory. Zero silica settlement allowed within client environments.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="appendix" className="scroll-mt-32">
              <h2 className="text-4xl font-black text-[#121212] mb-12 flex items-center gap-6 uppercase tracking-tighter">
                <div className="w-3 h-12 bg-slate-400"></div>
                Operational Appendix
              </h2>
              <div className="bg-[#F8F7F4] p-12 border border-slate-200">
                <div className="space-y-4">
                  {[
                    { title: "Silica SDS Documentation", icon: AlertOctagon },
                    { title: "Technical On-site Checklist", icon: HardHat },
                    { title: "Primary Supplier Matrix", icon: Box }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-8 bg-white border border-slate-100 hover:border-[#36453B] transition-all cursor-pointer group shadow-sm">
                      <div className="flex items-center gap-8">
                        <div className="p-4 bg-slate-50 text-[#121212] group-hover:bg-[#121212] group-hover:text-white transition-all"><item.icon size={20} /></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-700">{item.title}</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-[#36453B] group-hover:translate-x-3 transition-all" />
                    </div>
                  ))}
                </div>
                <div className="mt-16 pt-12 border-t border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-slate-400">
                    <Info className="w-6 h-6 opacity-30" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Protocol End Matrix v1.2</p>
                  </div>
                  <button className="text-[10px] font-black uppercase tracking-[0.4em] text-[#36453B] hover:underline">Export Technical PDF</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegrouting;
