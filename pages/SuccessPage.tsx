
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

  useEffect(() => {
    // Attempt to find the session ID for the newly created lead to provide the lobby link
    const findSession = async () => {
      if (state?.isQuote) {
        // In a real app, we'd pass the session ID in the state, but here we'll look up the most recent lead
        // matching the details as a fallback mechanism for this demo structure
        const leads = await getLeads();
        const match = leads.find(l => l.email === state.email && l.firstName === state.firstName);
        if (match && match.telequote_session) {
          setSessionId(match.telequote_session.id);
        }
      }
    };
    findSession();
  }, [state]);

  if (!state) return <Navigate to="/" replace />;

  const { firstName = 'Client', email, date, time, isQuote, serviceType } = state;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center py-20 px-6 font-sans text-[#121212]">
      <div className="max-w-2xl w-full space-y-12 bg-white p-12 lg:p-16 border border-[#121212]/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-[#36453B]"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 bg-[#36453B]/5 flex items-center justify-center mb-10 border border-[#36453B]/10">
            <CheckCircle className="h-12 w-12 text-[#36453B] animate-in zoom-in duration-500" />
          </div>

          <h2 className="text-[11px] font-black text-[#36453B] uppercase tracking-[0.6em] mb-6">Matrix Synchronized</h2>
          <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-10">
            Confirmed.
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
            Technical engagement for <span className="text-[#121212] font-black">{firstName}</span> is now archived. Our operations team has been notified.
          </p>
        </div>

        {/* Technical Receipt */}
        <div className="bg-[#121212] p-10 text-white relative overflow-hidden border-l-8 border-[#36453B]">
          <div className="flex justify-between items-start mb-12">
            <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.5em] flex items-center gap-4">
              <ShieldCheck size={16} /> Service Confirmation Matrix
            </h3>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-8">
               <div>
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">Schedule Window</p>
                 <p className="font-black text-xl uppercase tracking-tight">{new Date(date || '').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                 <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.1em] mt-1">{time} Canberra</p>
               </div>
               <div>
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">Technical Discipline</p>
                 <p className="font-black text-xl uppercase tracking-tight">{serviceType || 'General Maintenance'}</p>
               </div>
             </div>
             
             <div className="space-y-8">
               <div className="flex flex-col items-center justify-center p-6 border border-white/10 bg-white/5">
                 {isQuote ? <Video size={32} className="text-[#36453B] mb-4" /> : <ClipboardList size={32} className="text-[#36453B] mb-4" />}
                 <p className="text-[10px] font-black uppercase tracking-widest text-center">{isQuote ? 'REMOTE TELEQUOTE' : 'ON-SITE RESTORATION'}</p>
               </div>
             </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
           {isQuote && sessionId && (
              <div className="bg-[#36453B]/5 p-8 border border-[#36453B]/20 text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#36453B] mb-4">Immediate Action Required</p>
                 <p className="text-sm text-slate-600 mb-6">Your secure TeleQuote Lobby is ready. Please bookmark this link or enter now to test your connection.</p>
                 <Link to={`/session/${sessionId}`} className="inline-flex items-center gap-3 px-10 py-5 bg-[#36453B] text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#121212] transition-colors shadow-lg">
                    Enter Lobby <ExternalLink size={14} />
                 </Link>
              </div>
           )}

           <div className="bg-[#F8F7F4] p-8 border border-slate-100 flex items-center gap-6">
              <div className="w-12 h-12 bg-white flex items-center justify-center shadow-sm text-[#36453B]">
                <Mail size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-[#121212] uppercase tracking-widest mb-1">Receipt Transmitted</p>
                 <p className="text-[10px] text-slate-400 font-medium italic">Sent to {email || 'registered address'}</p>
              </div>
           </div>
        </div>

        <div className="pt-8 flex flex-col gap-6 text-center">
          <Link to="/" className="inline-block px-12 py-7 bg-[#121212] text-white text-[11px] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-[#36453B] transition-all rounded-none">
            Back to Dashboard <ArrowRight className="inline ml-4 w-4 h-4" />
          </Link>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] italic uppercase">Revive Property Co. Canberra Operations</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;