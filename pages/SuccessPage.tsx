
import React, { useEffect, useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, Clock, ArrowRight, Video, ClipboardList, ShieldCheck, Mail, ExternalLink } from 'lucide-react';
import { getLeads } from '../services/crmService';

interface SuccessState {
  type?: 'contact' | 'booking';
  firstName?: string;
  email?: string;
  date?: string;
  time?: string;
  isQuote?: boolean;
  serviceType?: string;
}

const SuccessPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as SuccessState;
  const [sessionId, setSessionId] = useState<string | null>(null);

  if (!state) return <Navigate to="/" replace />;

  const { firstName = 'Client', email, date, time, isQuote, serviceType } = state;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#FDFCFB] flex flex-col items-center justify-center py-8 lg:py-12 px-6 font-sans text-[#121212]">
      <div className="max-w-3xl w-full space-y-8 bg-white p-8 lg:p-12 border border-[#121212]/5 shadow-2xl relative overflow-hidden group/success">
        {/* Top Status Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#36453B]"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-slate-100 pb-8">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-[#36453B]/5 flex items-center justify-center border border-[#36453B]/10 rotate-12 group-hover/success:rotate-0 transition-transform duration-700">
              <ShieldCheck className="h-8 w-8 text-[#36453B] animate-in zoom-in duration-500" />
            </div>
            <div>
              <h2 className="text-[9px] font-black text-[#36453B] uppercase tracking-[0.5em] mb-1">Matrix Synchronized</h2>
              <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none flex items-center gap-4 text-[#121212]">
                Confirmed. <CheckCircle size={32} className="text-[#36453B] animate-pulse" />
              </h1>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Lead Archived</p>
            <p className="text-[11px] font-bold text-[#121212] uppercase tracking-tighter">Handshake Complete</p>
          </div>
        </div>

        <p className="text-base text-slate-500 font-medium leading-relaxed max-w-2xl">
          Technical engagement for <span className="text-[#121212] font-black underline decoration-[#36453B]/30">{firstName}</span> has been logged. Our Canberra operations team has been notified.
        </p>

        {/* Technical Receipt - Compact High-Density Grid */}
        <div className="bg-[#121212] p-8 text-white relative overflow-hidden">
          {/* Blueprint Overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#36453B_1px,transparent_1px),linear-gradient(to_bottom,#36453B_1px,transparent_1px)] bg-[size:15px_15px]"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 grid grid-cols-2 gap-8">
               <div className="space-y-1">
                 <p className="text-[8px] text-[#36453B] font-black uppercase tracking-[0.3em]">Schedule</p>
                 <p className="font-black text-sm uppercase tracking-widest">{new Date(date || '').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                 <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.1em]">{time} ACT</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[8px] text-[#36453B] font-black uppercase tracking-[0.3em]">Discipline</p>
                 <p className="font-black text-sm uppercase tracking-widest truncate">{serviceType || 'MAINTENANCE'}</p>
                 <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.1em]">Ref: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
               </div>
             </div>
             
             <div className="flex items-center justify-center md:justify-end border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-8">
               <div className="flex items-center gap-4 text-right">
                 <div>
                   <p className="text-[8px] text-[#36453B] font-black uppercase tracking-[0.3em]">Protocol</p>
                   <p className="text-[10px] font-black uppercase tracking-widest">{isQuote ? 'TELEQUOTE' : 'SITE AUDIT'}</p>
                 </div>
                 <div className="p-3 border border-white/10 bg-white/5">
                   {isQuote ? <Video size={20} className="text-[#36453B]" /> : <ClipboardList size={20} className="text-[#36453B]" />}
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Action Blocks - Compaction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {isQuote && sessionId ? (
              <div className="bg-[#36453B]/5 p-6 border border-[#36453B]/10 flex flex-col justify-between">
                 <div className="mb-4">
                   <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#36453B] mb-2 flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-[#36453B] rounded-full animate-pulse"></div> Lobby Ready
                   </p>
                   <p className="text-[11px] text-slate-500 font-bold leading-tight">Your secure video portal is now active for visual sync.</p>
                 </div>
                 <Link to={`/session/${sessionId}`} className="inline-flex items-center justify-center gap-3 w-full py-4 bg-[#36453B] text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-[#121212] transition-colors shadow-lg">
                    Enter Lobby <ExternalLink size={12} />
                 </Link>
              </div>
           ) : (
              <div className="bg-[#F8F7F4] p-6 border border-slate-100 flex items-center gap-5">
                <div className="w-10 h-10 bg-white flex items-center justify-center shadow-sm text-[#36453B] border border-slate-50">
                  <Mail size={16} />
                </div>
                <div>
                   <p className="text-[9px] font-black text-[#121212] uppercase tracking-widest mb-0.5">Transmission Sent</p>
                   <p className="text-[9px] text-slate-400 font-bold truncate max-w-[180px] lowercase">{email || 'Primary Contact'}</p>
                </div>
              </div>
           )}

           <div className="flex flex-col gap-4">
              <Link to="/" className="flex-1 flex items-center justify-center px-8 py-5 bg-[#121212] text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-[#36453B] transition-all relative overflow-hidden group/btn">
                <span className="relative z-10">Return to Node</span>
                <ArrowRight className="relative z-10 ml-4 w-3.5 h-3.5 group-hover/btn:translate-x-2 transition-transform" />
                <div className="absolute inset-0 bg-white/5 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-500"></div>
              </Link>
              <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.5em] text-center">Protocol Revive-2026-ACT</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;