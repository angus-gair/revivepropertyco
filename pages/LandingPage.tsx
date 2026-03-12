import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';

// Technical Blueprint Icons
const TechnicalIcon = ({ type }: { type: string }) => {
  const color = "currentColor";
  const strokeWidth = "1.2";

  const icons: Record<string, React.ReactNode> = {
    pressure: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" stroke={color} strokeWidth={strokeWidth} strokeDasharray="2 2" opacity="0.3" />
        <path d="M30 70 L50 30 L70 70" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <path d="M40 70 H60" stroke={color} strokeWidth={strokeWidth} />
        <circle cx="50" cy="30" r="5" fill={color} />
        <line x1="50" y1="35" x2="50" y2="80" stroke={color} strokeWidth={strokeWidth} strokeDasharray="4 2" />
      </svg>
    ),
    grout: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="15" width="70" height="70" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <line x1="50" y1="15" x2="50" y2="85" stroke={color} strokeWidth={strokeWidth} />
        <line x1="15" y1="50" x2="85" y2="50" stroke={color} strokeWidth={strokeWidth} />
        <rect x="40" y="40" width="20" height="20" fill={color} opacity="0.2" />
        <path d="M45 45 L55 55 M55 45 L45 55" stroke={color} strokeWidth={strokeWidth} />
      </svg>
    ),
    garden: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M20 80 Q50 20 80 80" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <line x1="50" y1="80" x2="50" y2="40" stroke={color} strokeWidth={strokeWidth} />
        <circle cx="35" cy="65" r="3" fill={color} />
        <circle cx="65" cy="65" r="3" fill={color} />
        <path d="M10 80 H90" stroke={color} strokeWidth={strokeWidth} strokeDasharray="2 2" />
      </svg>
    ),
    pool: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="20" y="30" width="60" height="40" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <path d="M20 40 C30 35 40 45 50 40 C60 35 70 45 80 40" stroke={color} strokeWidth={strokeWidth} fill="none" />
        <path d="M20 55 C30 50 40 60 50 55 C60 50 70 60 80 55" stroke={color} strokeWidth={strokeWidth} fill="none" opacity="0.5" />
        <line x1="50" y1="15" x2="50" y2="30" stroke={color} strokeWidth={strokeWidth} />
      </svg>
    )
  };

  return (
    <div className="w-10 h-10 text-current transition-transform duration-500 group-hover:scale-110">
      {icons[type]}
    </div>
  );
};

const AiImage = ({ 
  prompt, 
  storageKey, 
  aspectRatio = "3:4", 
  alt, 
  label, 
  title, 
  className = "" 
}: { 
  prompt: string, 
  storageKey: string, 
  aspectRatio?: string, 
  alt: string, 
  label?: string, 
  title?: string,
  className?: string
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateImage = async () => {
      const savedImage = localStorage.getItem(storageKey);
      if (savedImage) {
        setImageUrl(savedImage);
        setLoading(false);
        return;
      }

      // Skip AI generation if no API key
      if (!process.env.API_KEY) {
        setLoading(false);
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: aspectRatio as any } }
        });

        const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
        if (imagePart?.inlineData?.data) {
          const base64Data = `data:image/png;base64,${imagePart.inlineData.data}`;
          setImageUrl(base64Data);
          localStorage.setItem(storageKey, base64Data);
        }
      } catch (error) {
        console.warn(`Generation failed for ${storageKey}`, error);
      } finally {
        setLoading(false);
      }
    };

    generateImage();
  }, [prompt, storageKey, aspectRatio]);

  return (
    <div className={`bg-slate-100 overflow-hidden relative border border-[#121212]/10 shadow-sm group ${className}`}>
      {loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3 min-h-[300px]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em]">Rendering Asset...</span>
        </div>
      ) : imageUrl ? (
        <>
          <img src={imageUrl} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
          {(label || title) && (
             <>
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white w-full pr-6">
                {label && <p className="text-[8px] font-black text-[#36453B] bg-white px-2 py-1 inline-block uppercase tracking-[0.4em] mb-2 shadow-sm">{label}</p>}
                {title && <h4 className="text-xl font-black tracking-tighter uppercase leading-none">{title}</h4>}
              </div>
             </>
          )}
        </>
      ) : (
        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
            <span className="text-xs text-slate-400">Image Unavailable</span>
        </div>
      )}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const services = [
    { title: 'Pressure Washing', description: 'Industrial restoration of stone and concrete.', type: 'pressure', link: '/pressure-washing' },
    { title: 'Epoxy Grouting', description: 'Precision tile restoration and waterproof sealing.', type: 'grout', link: '/regrouting' },
    { title: 'Estate Management', description: 'Curated maintenance for premium Sydney properties.', type: 'garden', link: '/garden-maintenance' },
    { title: 'Pool Hydraulics', description: 'Technical water chemistry and filtration optimization.', type: 'pool', link: '/pool-maintenance' },
  ];

  return (
    <div className="bg-[#FDFCFB]">
      
      {/* Hero: Tighter Spacing & Compressed Height */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[70vh]">
          
          <div className="lg:col-span-8 flex flex-col justify-center py-12 lg:py-20 pr-0 lg:pr-10 z-10">
            <div className="flex items-center space-x-5 mb-8">
              <span className="w-12 h-px bg-[#36453B]"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#36453B]">Sydney's Technical Authority</span>
            </div>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-[#121212] tracking-tighter leading-[0.85] uppercase mb-10">
              Technical <br />Maintenance.
            </h1>
            <p className="text-base text-slate-500 max-w-lg font-medium leading-relaxed mb-12">
              Architectural-grade restoration for the Eastern Suburbs. We specialize in precision execution for pressure washing, epoxy regrouting, and estate care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/book" className="bg-[#121212] text-white px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] transition-all text-center rounded-none shadow-lg">Schedule Assessment</Link>
              <Link to="/contact" className="border border-[#121212] text-[#121212] px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-slate-50 transition-all text-center rounded-none">Direct Inquiry</Link>
            </div>
          </div>
          
          <div className="lg:col-span-4 relative h-[30vh] lg:h-auto overflow-hidden">
            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=90" alt="Sydney Modern Residence" className="w-full h-full object-cover grayscale-[0.2]" />
            <div className="absolute inset-0 bg-[#36453B]/5 mix-blend-overlay"></div>
          </div>
        </div>
      </section>

      {/* Services Grid: Tightened rhythm, 4-col display */}
      <section className="py-16 lg:py-20 bg-[#F8F7F4]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-10">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-[#121212] mb-6 leading-none">Operational <br />Disciplines.</h2>
              <p className="text-slate-500 font-medium text-sm">Specialized service lines focused on aesthetic integrity.</p>
            </div>
            <div className="text-[9px] font-black uppercase tracking-[0.5em] text-[#36453B] pb-2 border-b border-[#36453B]">SPEC / 04</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 shadow-2xl">
            {services.map((service, idx) => (
              <Link key={idx} to={service.link} className="group p-10 bg-white hover:bg-[#FDFCFB] transition-all duration-300">
                <div className="mb-10 text-[#121212] group-hover:text-[#36453B] transition-colors"><TechnicalIcon type={service.type} /></div>
                <h3 className="text-lg font-black uppercase tracking-tight text-[#121212] mb-4">{service.title}</h3>
                <p className="text-[11px] leading-relaxed text-slate-400 font-medium mb-10">{service.description}</p>
                <div className="flex items-center text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 group-hover:text-[#121212] transition-colors">
                  Specifications <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* About Section: Family & Leadership */}
      <section className="py-16 lg:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Leadership Text */}
            <div className="lg:col-span-4 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-8">
                 <div className="p-2 bg-[#F8F7F4] rounded-full text-[#36453B]"><Heart size={16} fill="currentColor" /></div>
                 <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#36453B]">Family Owned & Operated</span>
               </div>
               <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[#121212] mb-8 leading-tight">Our Family,<br />Your Home.</h2>
               <div className="space-y-6 text-sm text-slate-500 font-medium leading-relaxed">
                 <p>
                   Revive Property Co. is proudly owned and operated by <strong>Angus Gair</strong>. We combine technical precision with genuine care to deliver a service experience that feels personal.
                 </p>
                 <p>
                   Angus directs all on-site operations and manages the client journey, ensuring every job meets our rigorous standards from your first quote to final delivery.
                 </p>
                 <p>
                   Together with his three boys—James, Finn, and Archie—Angus is building a business rooted in trust, reliability, and the vibrant community spirit of Sydney's Eastern Suburbs.
                 </p>
               </div>

               <div className="mt-12 pt-12 border-t border-slate-100 grid grid-cols-1 gap-8">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-[#36453B] mb-1">Director & Co-Founder</p>
                    <p className="text-lg font-black text-[#121212] uppercase tracking-tighter">Angus Gair</p>
                  </div>
               </div>
            </div>

            {/* Imagery Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-100 overflow-hidden relative border border-[#121212]/10 shadow-sm group h-[400px] md:h-auto">
                <img src="/angus.png" alt="Angus James Gair & Son" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white w-full pr-6">
                  <p className="text-[8px] font-black text-[#36453B] bg-white px-2 py-1 inline-block uppercase tracking-[0.4em] mb-2 shadow-sm">Director & Co-Founder</p>
                  <h4 className="text-xl font-black tracking-tighter uppercase leading-none">Angus Gair</h4>
                </div>
              </div>
              <div className="bg-slate-100 overflow-hidden relative border border-[#121212]/10 shadow-sm group h-[400px] md:h-auto">
                 <img src="/family.png" alt="The Gair Family" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/80 via-transparent to-transparent"></div>
                 <div className="absolute bottom-6 left-6 text-white w-full pr-6">
                   <p className="text-[8px] font-black text-[#36453B] bg-white px-2 py-1 inline-block uppercase tracking-[0.4em] mb-2 shadow-sm">James, Finn & Archie</p>
                   <h4 className="text-xl font-black tracking-tighter uppercase leading-none">The Gair Family</h4>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA: Tighter vertical footprint */}
      <section className="bg-[#121212] py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter leading-tight mb-8">Secure Your Slot.</h2>
          <p className="text-slate-500 text-sm font-medium mb-12 max-w-xl mx-auto leading-relaxed italic">"Lock in a technical assessment date before our seasonal schedule reaches capacity."</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/book" className="bg-white text-[#121212] px-12 py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] hover:text-white transition-all rounded-none">Launch Portal</Link>
            <Link to="/contact" className="border border-white/10 text-white px-12 py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white hover:text-[#121212] transition-all rounded-none">Inquire</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;