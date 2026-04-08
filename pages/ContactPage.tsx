import React from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Smartphone,
  Facebook,
  Instagram,
  Linkedin,
  Calendar,
  ArrowRight,
  MessageCircle,
  Users
} from 'lucide-react';

const ContactPage: React.FC = () => {
  return (
    <div className="bg-[#FDFCFB] min-h-screen py-16 px-6 lg:px-8 font-sans text-[#121212]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-20 gap-10">
          <div className="max-w-2xl">
            <h2 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.5em] mb-8">Direct Communication</h2>
            <h1 className="text-6xl sm:text-8xl font-black uppercase tracking-tighter text-[#121212] mb-8 leading-[0.85]">
              Get In <br />Touch.
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Connect directly with our Director. Whether it's a technical specification or a marketing partnership, our family office is ready to engage.
            </p>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[#36453B] pb-2 border-b-2 border-[#36453B]">
            Family Office / Canberra
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-slate-200 border border-slate-200">
          
          <div className="lg:col-span-8 bg-white p-0">
            {/* Leadership Grid */}
            <div className="grid grid-cols-1 gap-px bg-slate-100">
              
              {/* Angus Card */}
              <div className="bg-white p-12 lg:p-16 flex flex-col h-full hover:bg-[#FDFCFB] transition-colors group">
                 <div className="w-16 h-16 bg-[#121212] flex items-center justify-center text-white mb-10 group-hover:bg-[#36453B] transition-colors">
                    <User size={24} />
                 </div>
                 <div className="flex-grow">
                    <p className="text-[10px] text-[#36453B] font-black uppercase tracking-[0.4em] mb-2">Director & Co-Founder</p>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Angus James Gair</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Direct Line</p>
                        <a href="tel:0282013710" className="block text-lg font-black hover:text-[#36453B] transition-colors">02 8201 3710</a>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Technical Mobile</p>
                        <a href="tel:0468333745" className="block text-lg font-black hover:text-[#36453B] transition-colors">0468 333 745</a>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Email</p>
                        <a href="mailto:angus@gair.com.au" className="block text-lg font-black hover:text-[#36453B] transition-colors">angus@gair.com.au</a>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Focus Areas</p>
                        <p className="text-sm font-medium text-slate-500">Technical Maintenance, Quality Control, Labour</p>
                      </div>
                    </div>
                 </div>
              </div>

            </div>

            <div className="p-12 lg:p-16 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <MapPin size={18} className="text-[#36453B]" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Operation Base</p>
                  </div>
                  <p className="text-xl font-black leading-tight uppercase tracking-tight">
                    802/2 Marcus Clarke Street,<br />Canberra, ACT 2601
                  </p>
               </div>
               
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Clock size={18} className="text-[#36453B]" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Operational Hours</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black leading-tight uppercase tracking-tight">Mon - Fri: 07:00 - 17:00</p>
                    <p className="text-sm font-medium text-slate-500">Serving Braddon, Kingston, Griffith, Deakin & surrounding ACT suburbs.</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#121212] p-12 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-[#36453B] rounded-full blur-3xl opacity-20 translate-x-10 -translate-y-10"></div>
             
             <div>
               <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 leading-none">Digital <br />Uplink.</h3>
               <p className="text-slate-400 font-medium leading-relaxed mb-12">
                 Initiate a direct line to our technical team. Responses are guaranteed within 4 hours during operational windows.
               </p>

               <div className="space-y-6">
                 <Link to="/book" className="flex items-center justify-between p-6 border border-white/10 hover:bg-[#36453B] hover:border-[#36453B] transition-all group">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1">New Client</p>
                      <p className="text-lg font-black uppercase tracking-tight">Book Assessment</p>
                    </div>
                    <ArrowRight className="text-slate-500 group-hover:text-white transition-colors" />
                 </Link>
                 
                 <a href="mailto:support@reviveproperty.co" className="flex items-center justify-between p-6 border border-white/10 hover:bg-white hover:text-[#121212] transition-all group">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1">General Inquiry</p>
                      <p className="text-lg font-black uppercase tracking-tight">Email Support</p>
                    </div>
                    <ArrowRight className="text-slate-500 group-hover:text-[#121212] transition-colors" />
                 </a>
               </div>
             </div>

             <div className="mt-20 pt-12 border-t border-white/10">
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6">Social Grid</p>
               <div className="flex gap-6">
                 <a href="#" className="text-white hover:text-[#36453B] transition-colors"><Instagram size={20} /></a>
                 <a href="#" className="text-white hover:text-[#36453B] transition-colors"><Facebook size={20} /></a>
                 <a href="#" className="text-white hover:text-[#36453B] transition-colors"><Linkedin size={20} /></a>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;