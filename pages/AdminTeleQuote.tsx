import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { getLeads, updateTeleQuoteSession, updateLead } from '../services/crmService';
import { Lead, LeadStatus, TeleQuoteSession } from '../types';
import { GoogleGenAI } from "@google/genai";
import { 
  Video, 
  Play,
  Sparkles,
  Download,
  Loader2,
  Key,
  MessageSquare,
  Globe,
  Users,
  Activity,
  History as HistoryIcon,
  AlertCircle,
  Eye,
  MonitorPlay,
  Check,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  ClipboardList,
  Info,
  Tv,
  ExternalLink,
  ShieldCheck,
  User,
  ArrowRight,
  Share2,
  FileVideo,
  Monitor,
  Maximize2,
  Trash2
} from 'lucide-react';

interface GeneratedAsset {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  platform: string;
}

// Technical Tooltip Component
const Tooltip: React.FC<{ text: string; children: React.ReactNode; position?: 'top' | 'bottom'; className?: string }> = ({ text, children, position = 'top', className = "" }) => {
  return (
    <div className={`group relative ${className}`}>
      {children}
      <div className={`absolute ${position === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'} left-1/2 -translate-x-1/2 px-4 py-2 bg-[#121212] border border-[#36453B]/40 text-white text-[7px] font-black uppercase tracking-[0.3em] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] shadow-2xl flex items-center gap-2`}>
        <div className="w-1 h-1 bg-[#36453B]"></div>
        {text}
        <div className={`absolute ${position === 'top' ? 'top-full border-t-[#121212]' : 'bottom-full border-b-[#121212]'} left-1/2 -translate-x-1/2 border-6 border-transparent`}></div>
      </div>
    </div>
  );
};

const AdminTeleQuote: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [estimate, setEstimate] = useState<string>("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const [generatingPlatforms, setGeneratingPlatforms] = useState<Map<string, number>>(new Map());
  const [platformPrompts, setPlatformPrompts] = useState<Record<string, string>>({
    zoom: "A high-definition Zoom call recording showing a technical property inspection in Canberra ACT, professional technician pointing at tile detail, crystal clear lighting.",
    teams: "A corporate Microsoft Teams video presentation of a large scale commercial pressure washing project in Canberra CBD, enterprise branding, professional grade video.",
    google_meet: "A smooth Google Meet recording of a bathroom regrouting consultation, split screen showing technician and client, modern Canberra apartment aesthetic.",
    whatsapp: "A casual but professional vertical video recorded for WhatsApp, showing a gardener explaining a landscape plan in a sunny Canberra backyard.",
    messenger: "A vibrant and clear Facebook Messenger video chat showing a pool technician balancing water chemicals, bright summer lighting, clear Canberra pool."
  });
  
  const [platformVideos, setPlatformVideos] = useState<Record<string, string>>({});

  const [messengerPromoPrompt, setMessengerPromoPrompt] = useState("A high-impact Facebook Messenger service explanation video for Revive Property Co. Showcase a technician applying high-performance epoxy grout in a modern Canberra bathroom. Focus on the transformation from moldy to pristine. Cinematic 4K, professional aesthetic.");
  const [isGeneratingMessengerPromo, setIsGeneratingMessengerPromo] = useState(false);
  const [messengerPromoProgress, setMessengerPromoProgress] = useState(0);
  
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [latestPlatform, setLatestPlatform] = useState<string | null>(null);
  const [recentAssets, setRecentAssets] = useState<GeneratedAsset[]>([]);

  const renderSectionRef = useRef<HTMLDivElement>(null);
  const masterPlayerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    checkKeyStatus();
    loadLeads();
  }, []);

  const checkKeyStatus = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    }
  };

  const loadLeads = async () => {
    setLoading(true);
    try {
      const allLeads = await getLeads();
      const teleLeads = allLeads.filter(l => l.telequote_session);
      setLeads(teleLeads);
    } catch (e) {
      console.error("Failed to sync leads:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenKeyDialog = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateMessengerPromo = async () => {
    if (!messengerPromoPrompt || isGeneratingMessengerPromo) return;
    if (!process.env.API_KEY) {
      alert('AI features require an API key to be configured.');
      return;
    }
    setIsGeneratingMessengerPromo(true);
    setMessengerPromoProgress(10);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: messengerPromoPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });

      setMessengerPromoProgress(30);
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        try {
          operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch (err: any) {
          if (err.message?.includes("Requested entity was not found")) {
            setHasApiKey(false);
            throw err;
          }
          throw err;
        }
        setMessengerPromoProgress(prev => Math.min(prev + 12, 95));
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        setGeneratedVideoUrl(url);
        setLatestPlatform('messenger_promo');
        
        const newAsset: GeneratedAsset = {
          id: `PROMO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          url: url,
          prompt: messengerPromoPrompt,
          timestamp: Date.now(),
          platform: 'messenger'
        };
        setRecentAssets(prev => [newAsset, ...prev].slice(0, 12));
        
        setTimeout(() => {
            const player = document.getElementById('master-review-suite');
            player?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    } catch (error) {
      console.error("Promo Synthesis error:", error);
    } finally {
      setIsGeneratingMessengerPromo(false);
      setMessengerPromoProgress(0);
    }
  };

  const generatePlatformVideo = async (platform: string) => {
    const prompt = platformPrompts[platform];
    if (!prompt) return;
    if (!process.env.API_KEY) {
      alert('AI features require an API key to be configured.');
      return;
    }

    // Determine aspect ratio based on platform nature
    const isVertical = platform === 'whatsapp' || platform === 'messenger';
    const aspectRatio = isVertical ? '9:16' : '16:9';

    setGeneratingPlatforms(prev => new Map(prev).set(platform, 10));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      setGeneratingPlatforms(prev => new Map(prev).set(platform, 30));
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        try {
          operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch (err: any) {
          if (err.message?.includes("Requested entity was not found")) {
            setHasApiKey(false);
            throw err;
          }
          throw err;
        }
        setGeneratingPlatforms(prev => {
           const current = prev.get(platform) || 30;
           return new Map(prev).set(platform, Math.min(current + 12, 95));
        });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        setGeneratedVideoUrl(url);
        setLatestPlatform(platform);
        setGeneratingPlatforms(prev => {
           const next = new Map(prev);
           next.delete(platform);
           return next;
        });
        
        // Save specific platform video
        setPlatformVideos(prev => ({
          ...prev,
          [platform]: url
        }));
        
        const newAsset: GeneratedAsset = {
          id: Math.random().toString(36).substr(2, 9),
          url: url,
          prompt: prompt,
          timestamp: Date.now(),
          platform: platform
        };
        setRecentAssets(prev => [newAsset, ...prev].slice(0, 12));
        
        setTimeout(() => {
            const player = document.getElementById('master-review-suite');
            player?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    } catch (error: any) {
      console.error("Synthesis error:", error);
      setGeneratingPlatforms(prev => {
        const next = new Map(prev);
        next.delete(platform);
        return next;
      });
    }
  };

  const handleFinalizeQuote = async () => {
    if (!selectedLead || !selectedLead.telequote_session) return;
    setIsFinalizing(true);
    try {
      const sessionId = selectedLead.telequote_session.id;
      const amount = parseFloat(estimate);
      await updateTeleQuoteSession(sessionId, {
        notes: sessionNotes,
        finalEstimate: isNaN(amount) ? undefined : amount,
        status: 'COMPLETED',
        completedAt: Date.now()
      });
      await updateLead(selectedLead.id, { status: LeadStatus.CONTACTED });
      loadLeads();
      setSelectedLead(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinalizing(false);
    }
  };

  const platformData: Record<string, { icon: React.ReactNode, idTag: string, label: string, strategy: string, tooltip: string }> = {
    zoom: { 
      icon: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Zoom: Camera shape */}
          <rect x="20" y="30" width="50" height="40" rx="6" />
          <path d="M75 40 L90 32 V68 L75 60" />
          <circle cx="45" cy="50" r="12" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        </svg>
      ), 
      idTag: 'PLT-ZOM',
      label: 'Zoom',
      strategy: 'High-fidelity stream',
      tooltip: 'Optimized for high-bandwidth inspection streams.'
    },
    teams: { 
      icon: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Teams: Two people / Shields */}
          <path d="M30 30 A10 10 0 0 1 50 30 A10 10 0 0 1 30 30" />
          <path d="M20 70 C20 50 60 50 60 70" />
          <path d="M60 25 A8 8 0 0 1 76 25 A8 8 0 0 1 60 25" opacity="0.6" />
          <path d="M55 55 C55 45 80 45 80 55" opacity="0.6" />
          <rect x="15" y="15" width="70" height="70" rx="4" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.2" />
        </svg>
      ), 
      idTag: 'PLT-MST',
      label: 'MS Teams',
      strategy: 'Enterprise channel',
      tooltip: 'Standardized enterprise collaboration tunnel.'
    },
    google_meet: { 
      icon: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Google Meet: Camera bubble */}
          <rect x="20" y="25" width="60" height="50" rx="8" />
          <path d="M45 40 L65 50 L45 60 V40 Z" fill="currentColor" fillOpacity="0.1" />
          <path d="M30 35 H70" strokeWidth="0.5" opacity="0.3" />
        </svg>
      ), 
      idTag: 'PLT-GME',
      label: 'Google Meet',
      strategy: 'Browser-based entry',
      tooltip: 'Real-time browser-based video synthesis.'
    },
    whatsapp: { 
      icon: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* WhatsApp: Bubble + Handset */}
          <path d="M50 15 A35 35 0 0 1 50 85 A35 35 0 0 1 25 75 L15 80 L20 65 A35 35 0 0 1 50 15" />
          <path d="M38 38 C35 45 45 55 52 52" strokeLinecap="round" />
          <circle cx="50" cy="50" r="10" strokeWidth="0.5" opacity="0.2" />
        </svg>
      ), 
      idTag: 'PLT-WSP',
      label: 'WhatsApp',
      strategy: 'Direct mobile sync',
      tooltip: 'Direct peer-to-peer mobile documentation.'
    },
    messenger: { 
      icon: (
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Messenger: Bubble + Bolt */}
          <path d="M50 15 A38 38 0 0 1 50 91 L50 95 L40 88 A38 38 0 0 1 50 15" />
          <path d="M35 60 L50 30 L55 50 L70 20" strokeLinejoin="round" />
        </svg>
      ), 
      idTag: 'PLT-MSG',
      label: 'Messenger',
      strategy: 'Social integration',
      tooltip: 'Social engagement and lead interaction node.'
    }
  };

  const PlatformBrandIcon = ({ platform, className = "w-10 h-10", variant = "default" }: { platform: string, className?: string, variant?: "default" | "minimal" }) => {
    const data = platformData[platform];
    if (!data) return <Video className={className} />;
    
    return (
      <Tooltip text={data.tooltip}>
        <div className={`relative group flex items-center justify-center ${variant === "minimal" ? "" : "p-4 border border-[#121212]/10 bg-white group-hover:border-[#36453B] transition-all"}`}>
          {variant !== "minimal" && (
            <>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#36453B]/30 group-hover:border-[#36453B]"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#36453B]/30 group-hover:border-[#36453B]"></div>
            </>
          )}
          <div className={`text-[#121212] group-hover:text-[#36453B] transition-colors ${className}`}>
            {data.icon}
          </div>
        </div>
      </Tooltip>
    );
  };

  if (selectedLead) {
    return (
      <div className="bg-[#121212] min-h-screen text-white font-sans p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-white/5 pb-8">
            <button onClick={() => setSelectedLead(null)} className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors group">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Cancel Dispatch</span>
            </button>
            <div className="text-right">
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedLead.firstName} {selectedLead.lastName}</h2>
              <p className="text-[#36453B] font-black uppercase tracking-[0.3em] text-[10px] mt-1">{selectedLead.serviceInterest} / {selectedLead.telequote_session?.platform.toUpperCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 bg-white/5 p-20 border border-white/10 flex flex-col items-center justify-center text-center shadow-3xl">
              <div className="w-24 h-24 bg-[#36453B] flex items-center justify-center mb-10 shadow-2xl transition-transform hover:scale-110">
                 <Play className="w-10 h-10 text-white fill-current" />
              </div>
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">Launch Dispatch Protocol</h3>
              <p className="text-slate-500 max-w-sm mb-12 font-medium">Session initialized for {selectedLead.telequote_session?.platform}.</p>
              <Tooltip text="Initiates secure external video protocol via new tab." position="bottom">
                <a href={selectedLead.telequote_session?.meetingLink} target="_blank" rel="noreferrer" className="px-16 py-6 bg-white text-[#121212] font-black text-xs uppercase tracking-[0.4em] hover:bg-[#36453B] hover:text-white transition-all">Open Bridge</a>
              </Tooltip>
            </div>
            <div className="lg:col-span-4 bg-white/5 p-10 border border-white/10 space-y-8">
               <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em]">Post-Assessment Notes</h3>
               <textarea value={sessionNotes} onChange={(e) => setSessionNotes(e.target.value)} rows={8} className="w-full bg-black/40 border border-white/5 p-5 text-xs font-medium focus:border-[#36453B] outline-none resize-none" placeholder="Site findings..."/>
               <input type="number" value={estimate} onChange={(e) => setEstimate(e.target.value)} className="w-full bg-black/40 border border-white/5 py-5 px-5 text-xl font-black focus:border-[#36453B] outline-none" placeholder="Estimate (AUD)"/>
               <Tooltip text="Commits estimate to database and closes session ticket." position="top">
                 <button disabled={isFinalizing} onClick={handleFinalizeQuote} className="w-full py-6 bg-[#36453B] text-white font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white hover:text-[#121212] transition-all">Archive Protocol</button>
               </Tooltip>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FDFCFB] min-h-screen py-16 px-6 lg:px-8 font-sans text-[#121212]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#121212] p-12 lg:p-20 text-white shadow-3xl mb-16 relative overflow-hidden border-b-[12px] border-[#36453B]">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
            <div>
              <div className="flex flex-wrap items-center gap-6 mb-10">
                <span className="bg-[#36453B] text-[10px] text-white font-black uppercase tracking-[0.6em] px-6 py-2">TeleQuote Operations Matrix</span>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">Dispatch Authorized</span>
              </div>
              <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-[0.85] uppercase mb-8">Remote <br /><span className="text-slate-500 italic">Assessment Center.</span></h1>
            </div>
            {!hasApiKey && (
              <div className="flex flex-col items-end gap-3">
                <button onClick={handleOpenKeyDialog} className="px-12 py-7 bg-white text-[#121212] font-black text-[10px] uppercase tracking-[0.5em] shadow-2xl hover:bg-[#36453B] hover:text-white transition-all">Enable Studio Access</button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors underline">API Billing Documentation</a>
              </div>
            )}
          </div>
        </div>

        {/* Messenger Synthesis Strategy Section */}
        <section className="mb-24 bg-[#F8F7F4] p-12 border border-slate-200">
           <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:col-span-1 w-full lg:w-1/2 space-y-10">
                <div className="flex items-center gap-6">
                  <div className="bg-[#121212] p-4 text-white">
                    <MessageSquare size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-[#121212] uppercase tracking-tighter">Messenger Synthesis Strategy</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
                  Generate high-impact promotional snippets or technical service explainers tailored specifically for Facebook Messenger's delivery format.
                </p>
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-[#36453B]">Synthesis Brief / Script</label>
                  <textarea 
                    value={messengerPromoPrompt} 
                    onChange={(e) => setMessengerPromoPrompt(e.target.value)} 
                    rows={4} 
                    disabled={!hasApiKey || isGeneratingMessengerPromo}
                    className="w-full bg-white p-6 text-sm font-medium border-l-4 border-[#121212] outline-none shadow-sm focus:border-[#36453B] transition-all resize-none" 
                    placeholder="Enter your promotion specification for Facebook Messenger..."
                  />
                  <Tooltip text={isGeneratingMessengerPromo ? "Rendering active..." : "Synthesizes 9:16 vertical video for social platforms."} position="top">
                    <button 
                      onClick={generateMessengerPromo}
                      disabled={!hasApiKey || isGeneratingMessengerPromo}
                      className="w-full py-6 bg-[#121212] text-white font-black text-[10px] uppercase tracking-[0.4em] hover:bg-[#36453B] transition-all disabled:opacity-20 flex items-center justify-center gap-4 shadow-xl"
                    >
                      {isGeneratingMessengerPromo ? (
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> 
                          <span>{messengerPromoProgress}% Synthesis</span>
                        </div>
                      ) : (
                        <><Sparkles size={16} /> Generate Messenger Content</>
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="w-full lg:w-1/2 flex flex-col items-center">
                 <div className="w-full aspect-[9/16] max-w-[300px] bg-black shadow-3xl relative overflow-hidden border-[8px] border-white group mb-8">
                    {generatedVideoUrl && latestPlatform === 'messenger_promo' ? (
                       <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center text-white/20">
                          <Share2 size={48} className="mb-6 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-[0.5em]">Waiting for Messenger Render</p>
                       </div>
                    )}
                 </div>
                 
                 {generatedVideoUrl && latestPlatform === 'messenger_promo' && (
                    <Tooltip text="Export MP4 asset to local system." position="top">
                      <button 
                        onClick={() => handleDownload(generatedVideoUrl, `Revive_Messenger_${Date.now()}.mp4`)}
                        className="flex items-center gap-3 px-8 py-4 bg-[#121212] text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-[#36453B] transition-all shadow-xl"
                      >
                        <Download size={14} /> Download Vertical Asset
                      </button>
                    </Tooltip>
                 )}
              </div>
           </div>
        </section>

        <section className="mb-24">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-[#121212] uppercase tracking-tighter flex items-center gap-6">
              <div className="w-2 h-10 bg-[#36453B]"></div> Dispatch Queue
            </h2>
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 border-b border-slate-200 pb-2">Operational Integrity Checks: Active</div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {leads.filter(l => l.telequote_session?.status === 'SCHEDULED').map((lead) => {
              const platform = lead.telequote_session?.platform || 'zoom';
              const pData = platformData[platform];
              return (
                <div key={lead.id} className="bg-white border border-slate-200 shadow-xl group hover:border-[#36453B] transition-all flex flex-col sm:flex-row items-stretch overflow-hidden">
                  <div className="bg-[#F8F7F4] p-8 sm:w-48 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-slate-100 group-hover:bg-[#36453B]/5 transition-colors">
                    <PlatformBrandIcon platform={platform} className="w-14 h-14" variant="minimal" />
                    <div className="mt-6 text-center">
                      <p className="text-[10px] font-black uppercase tracking-tighter text-[#121212] mb-1">{pData.label}</p>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{pData.strategy}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-black text-[#121212] uppercase tracking-tight leading-none">{lead.firstName} {lead.lastName}</h3>
                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1">ID: {lead.id.toUpperCase()}</span>
                      </div>
                      <p className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.3em] mb-4">{lead.serviceInterest}</p>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-2 italic mb-8 border-l-2 border-slate-100 pl-4">
                        {lead.notes || "No additional technical specification provided."}
                      </p>
                    </div>
                    <button onClick={() => setSelectedLead(lead)} className="w-full py-5 bg-[#121212] text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] transition-all flex items-center justify-center gap-4">
                      Open Engagement Bridge <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
          <div className="lg:col-span-8 space-y-16">
            <h2 className="text-2xl font-black text-[#121212] uppercase tracking-tighter flex items-center gap-6">
              <MonitorPlay className="w-8 h-8 text-[#36453B]" /> Synthesis Engine Console
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {Object.keys(platformData).map((platform) => {
                const isGenerating = generatingPlatforms.has(platform);
                const progress = generatingPlatforms.get(platform);
                return (
                  <div key={platform} className="bg-white p-10 border border-slate-200 shadow-xl relative overflow-hidden group">
                    {isGenerating && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-10 text-center">
                        <Loader2 className="w-10 h-10 text-[#36453B] animate-spin mb-6" />
                        <Tooltip text="Quantum synthesis in progress. Estimating visual fidelity..." position="bottom">
                           <h4 className="text-[10px] font-black uppercase tracking-widest cursor-help">{progress}% Neural Synchronization</h4>
                        </Tooltip>
                      </div>
                    )}
                    <div className="flex items-center gap-6 mb-10">
                      <PlatformBrandIcon platform={platform} className="w-8 h-8" variant="minimal" />
                      <h4 className="text-xl font-black text-[#121212] uppercase tracking-tight leading-none">{platformData[platform].label}</h4>
                    </div>
                    <textarea 
                      value={platformPrompts[platform]} 
                      onChange={(e) => setPlatformPrompts(prev => ({ ...prev, [platform]: e.target.value }))} 
                      rows={4} 
                      disabled={!hasApiKey || isGenerating} 
                      className="w-full bg-[#F8F7F4] p-5 text-sm font-medium text-slate-700 focus:border-[#36453B] border-l-2 border-slate-200 outline-none resize-none mb-10" 
                    />
                    <Tooltip text="Starts generation pipeline. Consumes API credits." position="top">
                      <button 
                        onClick={() => generatePlatformVideo(platform)} 
                        disabled={!hasApiKey || isGenerating} 
                        className="w-full py-5 bg-[#121212] text-white font-black text-[10px] uppercase tracking-[0.4em] hover:bg-[#36453B] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                      >
                        Initialize Render <ArrowRight size={14} />
                      </button>
                    </Tooltip>
                    
                    {platformVideos[platform] && (
                        <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#36453B]">Output Ready</span>
                              <button onClick={() => setPlatformVideos(prev => { const n = {...prev}; delete n[platform]; return n; })} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={12}/></button>
                           </div>
                           <div className={`bg-black relative shadow-lg mx-auto border-4 border-white ${platform === 'whatsapp' || platform === 'messenger' ? 'aspect-[9/16] w-[180px]' : 'aspect-video w-full'}`}>
                              <video src={platformVideos[platform]} controls className="w-full h-full object-cover" />
                           </div>
                           <button 
                             onClick={() => handleDownload(platformVideos[platform], `Revive_${platform}_${Date.now()}.mp4`)}
                             className="w-full mt-4 py-4 bg-[#F8F7F4] text-[#121212] font-black text-[9px] uppercase tracking-[0.4em] hover:bg-[#36453B] hover:text-white transition-all flex items-center justify-center gap-3 border border-slate-200"
                           >
                             <Download size={12} /> Download MP4
                           </button>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="lg:col-span-4 space-y-16">
             <div ref={renderSectionRef} className="bg-white p-12 border border-slate-200 shadow-3xl">
                <h3 className="text-[11px] font-black text-[#36453B] uppercase tracking-[0.5em] mb-12 flex items-center justify-between">
                  Latest Technical Render <div className="w-8 h-px bg-slate-200"></div>
                </h3>
                {generatedVideoUrl ? (
                   <div className="space-y-6 animate-in fade-in duration-700">
                      <div className={`bg-black relative shadow-lg mx-auto ${latestPlatform === 'messenger_promo' ? 'aspect-[9/16] w-[60%]' : 'aspect-video w-full'}`}>
                         <video key={`sidebar-${generatedVideoUrl}`} src={generatedVideoUrl} controls className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col gap-3">
                         <div className="p-4 bg-[#F8F7F4] border-l-2 border-[#36453B]">
                            <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Source Protocol</p>
                            <p className="text-xs font-black uppercase text-[#121212]">{latestPlatform?.toUpperCase() || 'SYNTHETIC'}</p>
                         </div>
                         <Tooltip text="Secure download of generated inspection asset." position="top">
                           <button 
                              onClick={() => handleDownload(generatedVideoUrl, `Revive_Asset_${Date.now()}.mp4`)}
                              className="w-full py-4 border border-slate-200 text-[#121212] text-[9px] font-black uppercase tracking-[0.5em] hover:bg-[#121212] hover:text-white transition-all flex items-center justify-center gap-3"
                           >
                              <Download size={14} /> Download Technical Asset
                           </button>
                         </Tooltip>
                      </div>
                   </div>
                ) : (
                  <div className="aspect-video bg-[#F8F7F4] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-10 text-center">
                    <Activity className="w-12 h-12 text-slate-300 opacity-20 mb-6" />
                    <Tooltip text="System standing by for new render data." position="bottom">
                       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 cursor-help">Wait-Sync Cycle Active</p>
                    </Tooltip>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Master Review Suite: Prominent preview area below Latest Render */}
        <section id="master-review-suite" className="bg-[#121212] border-t-8 border-[#36453B] p-12 lg:p-24 shadow-4xl mb-24 animate-in fade-in duration-1000">
           <div className="flex flex-col items-center mb-16 text-center">
              <div className="flex items-center gap-6 mb-8">
                 <Monitor className="w-8 h-8 text-[#36453B]" />
                 <h2 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter">Master Review Suite</h2>
              </div>
              <p className="text-slate-500 max-w-2xl font-medium leading-relaxed italic">
                 "Full-scale high-fidelity inspection theater. Final operational audit before client transmission."
              </p>
           </div>

           <div className="max-w-5xl mx-auto space-y-12">
              <div className="aspect-video bg-black relative group shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5">
                 {generatedVideoUrl ? (
                    <>
                       <video 
                          ref={masterPlayerRef} 
                          key={`master-${generatedVideoUrl}`} 
                          src={generatedVideoUrl} 
                          controls 
                          autoPlay 
                          className="w-full h-full object-contain" 
                       />
                       <div className="absolute top-8 left-8 bg-[#36453B]/80 backdrop-blur-md text-white text-[10px] font-black px-6 py-3 uppercase tracking-[0.4em] border border-white/20 flex items-center gap-3">
                          <Activity className="w-3 h-3 animate-pulse" /> Live Master Feed
                       </div>
                       <div className="absolute top-8 right-8 flex gap-2">
                          <button 
                             onClick={() => masterPlayerRef.current?.requestFullscreen()}
                             className="p-3 bg-white/10 hover:bg-white text-white hover:text-[#121212] transition-all border border-white/10"
                          >
                             <Maximize2 size={18} />
                          </button>
                       </div>
                    </>
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-20 text-center">
                       <MonitorPlay className="w-24 h-24 text-white/5 mb-10" />
                       <Tooltip text="Master Review Suite offline. Initiate render to activate." position="top">
                          <h3 className="text-xl font-black text-white/20 uppercase tracking-widest cursor-help">Awaiting Technical Sync</h3>
                       </Tooltip>
                       <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] mt-4">Initialize a synthesis render to begin audit</p>
                    </div>
                 )}
              </div>

              {generatedVideoUrl && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-white/10">
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.5em]">Audit Credentials</h4>
                       <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/5">
                          <div className="p-6 bg-white/5">
                             <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Asset ID</p>
                             <p className="text-xs font-black text-white uppercase">{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                          </div>
                          <div className="p-6 bg-white/5">
                             <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Synthesis Type</p>
                             <p className="text-xs font-black text-white uppercase">{latestPlatform === 'messenger_promo' ? 'VERTICAL PROMO' : 'LANDSCAPE INSPECTION'}</p>
                          </div>
                       </div>
                    </div>
                    <div className="flex flex-col justify-end gap-4">
                       <button 
                          onClick={() => handleDownload(generatedVideoUrl, `Revive_Final_Asset_${Date.now()}.mp4`)}
                          className="w-full py-6 bg-white text-[#121212] font-black text-[10px] uppercase tracking-[0.5em] hover:bg-[#36453B] hover:text-white transition-all flex items-center justify-center gap-4 shadow-2xl"
                       >
                          <Download size={16} /> Archive Master Archive (MP4)
                       </button>
                       <button className="w-full py-6 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.5em] hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-4">
                          <Share2 size={16} /> Secure Transmission Bridge
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </section>
      </div>
    </div>
  );
};

export default AdminTeleQuote;