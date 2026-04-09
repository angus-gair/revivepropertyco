
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById } from '../services/crmService';
import { usePageSEO } from '../hooks/usePageSEO';
import { SEO } from '../seoConfig';
import { Lead, TeleQuoteSession, Appointment } from '../types';
import { 
  Video, 
  VideoOff,
  Clock, 
  User, 
  ShieldCheck, 
  Loader2, 
  ExternalLink,
  Wifi,
  Mic,
  MicOff,
  Camera,
  Settings,
  RefreshCw
} from 'lucide-react';

const TeleQuoteLobby: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  usePageSEO({ ...SEO.telequoteSession, path: `/session/${id}`, noindex: true });
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<{ session: TeleQuoteSession, lead: Lead, appointment?: Appointment } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Hardware State
  const [isTesting, setIsTesting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      try {
        const data = await getSessionById(id);
        if (data) {
          setSessionData(data);
        } else {
          setError('Invalid Session Coordinate');
        }
      } catch (e) {
        setError('Connection Matrix Failed');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  useEffect(() => {
    // Simulated Pre-flight check
    const timer = setTimeout(() => {
        setIsReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleStartTest = async () => {
    try {
      setPermissionError(false);
      const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(newStream);
      setIsTesting(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Hardware access denied", err);
      setPermissionError(true);
    }
  };

  const handleStopTest = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsTesting(false);
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOn(videoTrack.enabled);
      }
    }
  };

  const handleJoin = () => {
    // Ensure we stop the local test stream before launching external app so we don't hog the camera
    handleStopTest();
    
    if (!sessionData?.session.meetingLink) return;
    const url = sessionData.session.meetingLink;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-[#36453B] animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Establishing Secure Uplink</p>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center">
        <div className="p-12 border border-slate-200 bg-white text-center shadow-2xl">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-6" />
          <h1 className="text-xl font-black uppercase tracking-tighter mb-4">Session Not Found</h1>
          <p className="text-sm text-slate-500 mb-8">This TeleQuote coordinate is invalid or expired.</p>
          <button onClick={() => navigate('/')} className="px-8 py-3 bg-[#121212] text-white text-[10px] font-black uppercase tracking-[0.3em]">Return to Base</button>
        </div>
      </div>
    );
  }

  const { session, lead, appointment } = sessionData;
  const platformName = session.platform === 'google_meet' ? 'Google Meet' : session.platform === 'teams' ? 'Microsoft Teams' : session.platform.charAt(0).toUpperCase() + session.platform.slice(1);

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Matrix */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.9),rgba(18,18,18,0.9)),url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80')] bg-cover bg-center pointer-events-none"></div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 relative z-10">
        
        {/* Left Column: Mission Control Info */}
        <div className="flex flex-col justify-center space-y-12 py-10 order-2 lg:order-1">
           <div>
             <div className="flex items-center gap-4 mb-6">
               <div className={`w-2 h-2 rounded-full animate-pulse ${isTesting ? 'bg-orange-500' : 'bg-green-500'}`}></div>
               <span className={`text-[9px] font-black uppercase tracking-[0.5em] ${isTesting ? 'text-orange-500' : 'text-green-500'}`}>
                 {isTesting ? 'Hardware Diagnostic Active' : 'Live Uplink Ready'}
               </span>
             </div>
             <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
               TeleQuote <br />Lobby.
             </h1>
             <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
               Welcome, <span className="text-white">{lead.firstName}</span>. You are currently in the secure staging area for your technical assessment.
             </p>
           </div>

           <div className="space-y-6">
             <div className="flex items-start gap-6">
               <div className="p-3 bg-white/5 border border-white/10">
                 <Clock className="w-5 h-5 text-[#36453B]" />
               </div>
               <div>
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">Time Slot</p>
                 <p className="text-xl font-black uppercase">{appointment ? `${new Date(appointment.date).toLocaleDateString()} @ ${appointment.timeSlot}` : 'ASAP Queue'}</p>
               </div>
             </div>
             <div className="flex items-start gap-6">
               <div className="p-3 bg-white/5 border border-white/10">
                 <User className="w-5 h-5 text-[#36453B]" />
               </div>
               <div>
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">Technical Lead</p>
                 <p className="text-xl font-black uppercase">Angus James Gair</p>
               </div>
             </div>
             <div className="flex items-start gap-6">
                <div className="p-3 bg-white/5 border border-white/10">
                  <Video className="w-5 h-5 text-[#36453B]" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-1">Protocol</p>
                  <p className="text-xl font-black uppercase">{platformName} Secure Bridge</p>
                </div>
             </div>
           </div>
        </div>

        {/* Right Column: The "Launchpad" */}
        <div className="bg-white text-[#121212] flex flex-col justify-between shadow-[0_0_100px_rgba(54,69,59,0.3)] relative overflow-hidden order-1 lg:order-2 h-full min-h-[600px]">
           <div className="absolute top-0 right-0 w-24 h-24 bg-[#36453B] rotate-45 translate-x-12 -translate-y-12 z-20"></div>
           
           {isTesting ? (
             // Active Camera Preview Mode
             <div className="relative flex-grow bg-black flex flex-col">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover flex-grow ${!isCamOn ? 'hidden' : ''}`} 
                />
                {!isCamOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                    <VideoOff size={48} opacity={0.5} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Camera Disabled</p>
                  </div>
                )}
                
                {/* Hardware Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4 z-30">
                  <button 
                    onClick={toggleMic}
                    className={`p-4 rounded-full transition-all border ${isMicOn ? 'bg-white/20 text-white border-transparent hover:bg-white hover:text-black' : 'bg-red-500/80 text-white border-red-500'}`}
                  >
                    {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                  <button 
                    onClick={toggleCam}
                    className={`p-4 rounded-full transition-all border ${isCamOn ? 'bg-white/20 text-white border-transparent hover:bg-white hover:text-black' : 'bg-red-500/80 text-white border-red-500'}`}
                  >
                    {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>
                  <button 
                    onClick={handleStopTest}
                    className="px-6 py-4 bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black border border-white/20 transition-all rounded-full"
                  >
                    Close Test
                  </button>
                </div>
             </div>
           ) : (
             // Launchpad Mode
             <div className="p-12 lg:p-16 flex flex-col h-full">
               <div className="mb-12">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-[#36453B] mb-8 flex items-center gap-3">
                   <ShieldCheck size={16} /> System Readiness
                 </h3>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#F8F7F4] border-l-4 border-[#36453B]">
                       <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-3"><Wifi size={14} /> Network</span>
                       <span className="text-[10px] font-black text-[#36453B] uppercase">Optimal</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#F8F7F4] border-l-4 border-slate-300">
                       <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-3"><Camera size={14} /> Camera</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase">Untested</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[#F8F7F4] border-l-4 border-slate-300">
                       <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-3"><Mic size={14} /> Audio</span>
                       <span className="text-[10px] font-black text-slate-400 uppercase">Untested</span>
                    </div>
                 </div>

                 <button 
                    onClick={handleStartTest}
                    className="w-full mt-6 py-4 border border-slate-200 text-[#121212] text-[9px] font-black uppercase tracking-[0.3em] hover:bg-[#121212] hover:text-white transition-all flex items-center justify-center gap-3"
                  >
                    <Settings size={14} /> Test Camera & Mic
                  </button>
                  {permissionError && (
                    <p className="text-red-500 text-[9px] font-bold uppercase tracking-widest text-center mt-3">Hardware Access Denied. Check Permissions.</p>
                  )}
               </div>

               <div className="space-y-6 mt-auto">
                  {isReady ? (
                    <button 
                      onClick={handleJoin}
                      className="w-full group relative overflow-hidden py-8 bg-[#121212] text-white shadow-2xl transition-all hover:bg-[#36453B]"
                    >
                       <div className="relative z-10 flex flex-col items-center gap-2">
                          <span className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                            Initialize Bridge <ExternalLink size={24} />
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-[0.4em] opacity-60 group-hover:opacity-100 transition-opacity">Launch {platformName} Client</span>
                       </div>
                    </button>
                  ) : (
                    <div className="w-full py-8 bg-slate-100 text-slate-400 text-center flex flex-col items-center gap-3 cursor-wait">
                       <Loader2 className="w-6 h-6 animate-spin" />
                       <span className="text-[9px] font-black uppercase tracking-[0.3em]">Synchronizing...</span>
                    </div>
                  )}
                  
                  <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    By initializing, you consent to the recording of this assessment for technical accuracy and quoting purposes.
                  </p>
               </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default TeleQuoteLobby;
