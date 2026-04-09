import * as React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Shield, Star, Clock, AlertCircle } from 'lucide-react';
import FAQSection, { FAQItem } from './FAQSection';

export interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
  buttonText?: string;
  link?: string;
}

export interface Benefit {
  title: string;
  description: string;
  icon: React.ElementType;
}

export interface AddOn {
  title: string;
  description: string;
  price: string;
}

export interface CrossLink {
  title: string;
  description: string;
  href: string;
}

interface ServicePageTemplateProps {
  hero: { title: string; subtitle: string; image: string; imageAlt?: string; };
  benefits: { heading: string; subheading: string; description: string; items: Benefit[]; };
  pricing: { heading: string; description: string; tiers: PricingTier[]; };
  addOns: { items: AddOn[]; costInfo: { heading: string; description: string; points: string[]; }; };
  seoH1?: string; // SEO-optimized H1 (can differ from visual heading)
  crossLinks?: CrossLink[]; // Internal links to related services
  faqs?: FAQItem[]; // FAQ items for visible section
  aeoIntro?: string; // Answer Engine Optimisation intro paragraph
}

const ServicePageTemplate: React.FC<ServicePageTemplateProps> = ({
  hero,
  benefits,
  pricing,
  addOns,
  seoH1,
  crossLinks,
  faqs,
  aeoIntro
}) => {
  return (
    <div className="bg-[#FDFCFB]">
      {/* SEO H1 - Hidden visually but present for search engines */}
      {seoH1 && <h1 className="sr-only">{seoH1}</h1>}

      {/* Hero: Compressed Height for better information flow */}
      <div className="relative min-h-[60vh] flex items-center overflow-hidden bg-[#121212]">
        <img src={hero.image} alt={hero.imageAlt || hero.title} className="absolute inset-0 w-full h-full object-cover filter brightness-[0.6] grayscale-[0.2]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#121212]/90 via-[#121212]/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 py-16 lg:py-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-12 h-px bg-[#36453B]"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.6em] text-[#36453B]">System Matrix v4.0</span>
            </div>
            <h2 className="text-6xl lg:text-8xl font-black uppercase tracking-tighter text-white leading-[0.85] mb-8">{hero.title}</h2>
            <p className="text-base text-slate-300 font-medium leading-relaxed max-w-lg mb-12">{hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/book" className="bg-white text-[#121212] px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-center shadow-2xl hover:bg-[#36453B] hover:text-white transition-all rounded-none">Book Inspection</Link>
              <Link to="/contact" className="border border-white/20 text-white px-10 py-6 text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center hover:bg-white hover:text-[#121212] transition-all rounded-none">Custom Brief <ArrowRight className="ml-3 w-4 h-4" /></Link>
            </div>
          </div>
        </div>
      </div>

      {/* AEO Intro - For Answer Engine Optimisation */}
      {aeoIntro && (
        <div className="bg-white border-b border-slate-100 py-8">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-base text-slate-600 leading-relaxed">{aeoIntro}</p>
          </div>
        </div>
      )}

      {/* Trust Strip */}
      <div className="bg-white border-b border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-between gap-8 text-[9px] font-black uppercase tracking-[0.4em] text-[#36453B] opacity-60">
            <div className="flex items-center gap-3"><Shield className="w-4 h-4" /> ISO Standards</div>
            <div className="flex items-center gap-3"><Star className="w-4 h-4" /> Canberra & ACT Spec</div>
            <div className="flex items-center gap-3"><Clock className="w-4 h-4" /> 24hr Dispatch</div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-[#F8F7F4] py-16 lg:py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[#121212] mb-6 leading-tight">Investment <br />Framework.</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed italic">{pricing.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 border border-slate-200 shadow-2xl">
            {pricing.tiers.map((tier) => (
              <div key={tier.name} className={`p-10 lg:p-12 transition-all duration-300 flex flex-col h-full relative ${tier.recommended ? 'bg-[#121212] text-white' : 'bg-white'}`}>
                {tier.recommended && <div className="absolute top-0 left-0 bg-[#36453B] text-white text-[8px] font-black uppercase tracking-[0.5em] px-6 py-2">REC. SPEC</div>}
                <h3 className={`text-[9px] font-black uppercase tracking-[0.5em] mb-10 ${tier.recommended ? 'text-slate-500' : 'text-[#121212]'}`}>{tier.name}</h3>
                <div className="flex flex-col mb-8">
                  <span className={`text-5xl font-black tracking-tighter leading-none mb-1 ${tier.recommended ? 'text-white' : 'text-[#121212]'}`}>{tier.price}</span>
                  <span className={`text-[8px] font-bold uppercase tracking-[0.3em] ${tier.recommended ? 'text-slate-500' : 'text-slate-400'}`}>ESTIMATE BASE</span>
                </div>
                <p className={`text-[13px] font-medium leading-relaxed mb-12 ${tier.recommended ? 'text-slate-400' : 'text-slate-500'}`}>{tier.description}</p>
                <div className="space-y-4 mb-16 flex-grow">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-3 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                      <Check className={`h-3 w-3 flex-none ${tier.recommended ? 'text-[#36453B]' : 'text-slate-400'}`} />
                      <span className={tier.recommended ? 'text-slate-200' : 'text-slate-600'}>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link to={tier.link || "/book"} className={`block w-full py-6 text-center text-[9px] font-black uppercase tracking-[0.5em] transition-all ${tier.recommended ? 'bg-white text-[#121212] hover:bg-[#36453B] hover:text-white' : 'bg-[#121212] text-white hover:bg-[#36453B]'}`}>{tier.buttonText || "Initialize"}</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#36453B] mb-8">{benefits.subheading}</h2>
            <p className="text-4xl font-black uppercase tracking-tighter text-[#121212] mb-8 leading-[0.95]">{benefits.heading}</p>
            <p className="text-base text-slate-500 font-medium leading-relaxed">{benefits.description}</p>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100 border border-slate-100">
            {benefits.items.map((feature) => (
              <div key={feature.title} className="bg-white p-10 hover:bg-[#FDFCFB] transition-colors">
                <div className="text-[#36453B] mb-6"><feature.icon className="h-6 w-6 stroke-[1.5]" /></div>
                <h3 className="text-lg font-black uppercase tracking-tight text-[#121212] mb-3">{feature.title}</h3>
                <p className="text-[13px] leading-relaxed text-slate-500 font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#36453B] mb-10">Technical Supplements</h3>
            {addOns.items.map((addon, idx) => (
              <div key={idx} className="flex justify-between items-end border-b border-slate-100 pb-8 group">
                <div>
                  <h4 className="text-base font-black text-[#121212] uppercase tracking-tight mb-1 group-hover:text-[#36453B] transition-colors">{addon.title}</h4>
                  <p className="text-[12px] text-slate-400 font-medium">{addon.description}</p>
                </div>
                <span className="text-[9px] font-black text-[#121212] bg-[#F8F7F4] uppercase tracking-[0.3em] px-6 py-2 border border-slate-200">{addon.price}</span>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 bg-[#36453B] p-10 text-white flex flex-col justify-center border-b-[12px] border-[#121212] shadow-2xl">
            <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-6">Dispatch <br />Rules.</h3>
            <ul className="space-y-4">
              {addOns.costInfo.points.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[9px] font-bold tracking-widest text-white/70 uppercase leading-tight">
                  <div className="w-1.5 h-1.5 bg-white/20 mt-0.5 shrink-0"></div> {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Cross-Links Section - Internal SEO Links */}
      {crossLinks && crossLinks.length > 0 && (
        <div className="py-16 bg-[#FDFCFB] border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#36453B] mb-8">Related Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {crossLinks.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.href}
                  className="bg-white border border-slate-200 p-8 hover:border-[#36453B] transition-all group"
                >
                  <h3 className="text-base font-black uppercase tracking-tight text-[#121212] mb-2 group-hover:text-[#36453B] transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-slate-500">{link.description}</p>
                  <span className="inline-flex items-center gap-2 mt-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#36453B]">
                    Learn More <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQ Section */}
      {faqs && faqs.length > 0 && <FAQSection faqs={faqs} />}

      <div className="py-24 bg-[#FDFCFB] text-center border-t border-slate-100">
        <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[#121212] mb-10 leading-none">Initiate <br />Asset Care.</h2>
        <Link to="/book" className="inline-block bg-[#121212] text-white px-16 py-7 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] transition-all shadow-2xl rounded-none">Availability Matrix</Link>
      </div>
    </div>
  );
};

export default ServicePageTemplate;
