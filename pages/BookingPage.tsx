import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { getAvailableSlots, bookAppointment, addLead } from '../services/crmService';
import { sendConfirmationEmail } from '../services/emailService';
import { ServiceType, LeadStatus, AppointmentType } from '../types';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight, Video, ClipboardList, Loader2, ShieldCheck, ArrowRight, Info, Hash } from 'lucide-react';
import CalendarPicker from '../components/CalendarPicker';
import PlatformSelector from '../components/TeleQuote/PlatformSelector';
import MediaUpload from '../components/TeleQuote/MediaUpload';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(minDate);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [step, setStep] = useState<1 | 2>(1);
  const [isBooking, setIsBooking] = useState(false);
  const [transmissionStatus, setTransmissionStatus] = useState<string>('');
  
  const [bookingType, setBookingType] = useState<AppointmentType>('QUOTE');
  const [platformPreference, setPlatformPreference] = useState<string>('whatsapp');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    serviceInterest: (localStorage.getItem('revive_last_detected_service') as ServiceType) || ServiceType.PRESSURE_WASHING,
    notes: ''
  });

  // Simulated live-generated project ID for architectural feel
  const projectCoordinate = useMemo(() => {
    return `REV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
        if (selectedDate) {
            const slots = await getAvailableSlots(selectedDate);
            setAvailableSlots(slots);
        }
    };
    fetchSlots();
  }, [selectedDate]);

  const handleBook = async () => {
    setIsBooking(true);
    setTransmissionStatus('ARCHIVING LEAD DATA...');
    
    try {
      const lead = await addLead({
        ...formData,
        status: LeadStatus.BOOKED,
        platform_preference: bookingType === 'QUOTE' ? platformPreference : undefined
      });

      setTransmissionStatus('SYNCHRONIZING CALENDAR...');
      await bookAppointment({
        leadId: lead.id,
        serviceType: formData.serviceInterest,
        type: bookingType,
        date: selectedDate,
        timeSlot: selectedSlot,
        notes: formData.notes
      });

      setTransmissionStatus('TRANSMITTING RECEIPT...');
      await sendConfirmationEmail({
        to: formData.email,
        firstName: formData.firstName,
        serviceType: formData.serviceInterest,
        date: selectedDate,
        time: selectedSlot,
        type: bookingType
      });

      localStorage.removeItem('revive_last_detected_service');
      navigate('/success', {
        state: {
          type: 'booking',
          firstName: formData.firstName,
          email: formData.email,
          date: selectedDate,
          time: selectedSlot,
          isQuote: bookingType === 'QUOTE',
          serviceType: formData.serviceInterest
        }
      });
    } catch (e) {
      alert('Error initiating booking.');
    } finally {
        setIsBooking(false);
    }
  };

  return (
    <div className="bg-[#FDFCFB] min-h-screen py-10 lg:py-16 px-6 lg:px-8 font-sans text-[#121212]">
      <div className="max-w-7xl mx-auto">
        
        {/* Condensed Header */}
        <div className="mb-12 border-b border-slate-200 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-10 h-[2px] bg-[#36453B]"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#36453B]">Onboarding Matrix</span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-[#121212] leading-none">Service Intake.</h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Step 0{step} / Manifest Completion</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-slate-200 border border-slate-200 shadow-2xl relative">
          {isBooking && (
            <div className="absolute inset-0 bg-[#121212]/95 z-[60] flex flex-col items-center justify-center p-10 text-center text-white backdrop-blur-sm">
               <Loader2 className="w-12 h-12 text-[#36453B] animate-spin mb-6" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{transmissionStatus}</p>
            </div>
          )}

          {/* Left Column: Form Flow */}
          <div className="lg:col-span-8 bg-white p-8 lg:p-12">
            {step === 1 ? (
              <div className="space-y-12 animate-in fade-in duration-500">
                {/* Protocol Selection - Compact Matrix */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-3">
                    <ShieldCheck size={14} /> 01. Engagement Protocol
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setBookingType('QUOTE')}
                      className={`flex items-center gap-6 p-6 border transition-all text-left group ${bookingType === 'QUOTE' ? 'border-[#36453B] bg-[#36453B]/5' : 'border-slate-100 bg-slate-50/50 hover:bg-white'}`}
                    >
                      <div className={`p-4 ${bookingType === 'QUOTE' ? 'bg-[#36453B] text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <Video size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-tight text-[#121212]">Remote TeleQuote</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Instant Digital Assessment</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => setBookingType('JOB')}
                      className={`flex items-center gap-6 p-6 border transition-all text-left group ${bookingType === 'JOB' ? 'border-[#36453B] bg-[#36453B]/5' : 'border-slate-100 bg-slate-50/50 hover:bg-white'}`}
                    >
                      <div className={`p-4 ${bookingType === 'JOB' ? 'bg-[#36453B] text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <ClipboardList size={20} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-tight text-[#121212]">Site Commencement</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">On-site execution slot</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Scheduling - Integrated Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-3">
                       <Calendar size={14} /> 02. Date Selection
                    </h3>
                    <CalendarPicker 
                      selectedDate={selectedDate} 
                      onDateSelect={(date) => { setSelectedDate(date); setSelectedSlot(''); }}
                      minDate={minDate} 
                    />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-3">
                       <Clock size={14} /> 03. Arrival Window
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all border ${
                            selectedSlot === slot ? 'bg-[#121212] text-white border-[#121212]' : 'bg-white text-slate-700 border-slate-100 hover:border-[#36453B]'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                      {availableSlots.length === 0 && <p className="col-span-full py-10 text-center text-[9px] text-slate-300 font-black uppercase tracking-widest border border-dashed">No availability</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <button
                    disabled={!selectedSlot}
                    onClick={() => setStep(2)}
                    className="w-full py-6 bg-[#121212] text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] disabled:opacity-20 transition-all flex items-center justify-center gap-4 shadow-xl"
                  >
                    Configure Identification <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em]">04. Principal Detail</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                           <input type="text" placeholder="First Name" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="bg-[#F8F7F4] border-b border-slate-200 p-4 text-[10px] font-black uppercase tracking-widest focus:border-[#36453B] outline-none" />
                           <input type="text" placeholder="Last Name" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="bg-[#F8F7F4] border-b border-slate-200 p-4 text-[10px] font-black uppercase tracking-widest focus:border-[#36453B] outline-none" />
                        </div>
                        <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#F8F7F4] border-b border-slate-200 p-4 text-[10px] font-black uppercase tracking-widest focus:border-[#36453B] outline-none" />
                        <input type="tel" placeholder="Mobile Number" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-[#F8F7F4] border-b border-slate-200 p-4 text-[10px] font-black uppercase tracking-widest focus:border-[#36453B] outline-none" />
                      </div>
                   </div>
                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em]">05. Site Specification</h4>
                      <div className="space-y-3">
                        <input type="text" placeholder="Full Property Address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-[#F8F7F4] border-b border-slate-200 p-4 text-[10px] font-black uppercase tracking-widest focus:border-[#36453B] outline-none" />
                        <select value={formData.serviceInterest} onChange={(e) => setFormData({...formData, serviceInterest: e.target.value as ServiceType})} className="w-full bg-[#F8F7F4] border-b border-slate-200 p-4 text-[10px] font-black uppercase tracking-widest focus:border-[#36453B] outline-none appearance-none">
                          {Object.values(ServiceType).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                        <textarea placeholder="Brief Job Notes..." rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-[#F8F7F4] border-b border-slate-200 p-4 text-[10px] font-medium focus:border-[#36453B] outline-none resize-none" />
                      </div>
                   </div>
                </div>

                {bookingType === 'QUOTE' && (
                  <div className="space-y-10 pt-8 border-t border-slate-100">
                     <PlatformSelector selectedPlatform={platformPreference} onSelect={setPlatformPreference} />
                     <MediaUpload onUploadComplete={() => {}} />
                  </div>
                )}

                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-5 border border-slate-200 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button onClick={handleBook} disabled={isBooking} className="flex-[2] py-5 bg-[#36453B] text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#121212] transition-all shadow-xl">
                    Finalize Manifest & Dispatch
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Manifest Summary (Blueprint feel) */}
          <div className="lg:col-span-4 bg-[#F8F7F4] p-8 lg:p-12 flex flex-col border-l border-slate-200">
            <h3 className="text-[10px] font-black text-[#121212] uppercase tracking-[0.5em] mb-10 flex items-center justify-between">
              Technical Manifest <div className="w-8 h-px bg-slate-300"></div>
            </h3>
            
            <div className="space-y-8 flex-grow">
               <div className="pb-6 border-b border-slate-200">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Coordinate</p>
                  <div className="flex items-center gap-4">
                    <Hash size={16} className="text-[#36453B]" />
                    <p className="text-xs font-black uppercase tracking-tighter">{projectCoordinate}</p>
                  </div>
               </div>

               <div className="pb-6 border-b border-slate-200">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocol</p>
                  <div className="flex items-center gap-4">
                    {bookingType === 'QUOTE' ? <Video size={16} className="text-[#36453B]" /> : <ClipboardList size={16} className="text-[#36453B]" />}
                    <p className="text-xs font-black uppercase tracking-tighter">{bookingType === 'QUOTE' ? 'TeleQuote Remote' : 'Site Commencement'}</p>
                  </div>
               </div>

               <div className="pb-6 border-b border-slate-200">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Line</p>
                  <p className="text-xs font-black uppercase tracking-tighter">{formData.serviceInterest}</p>
               </div>

               <div className="pb-6 border-b border-slate-200">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Arrival window</p>
                  <p className="text-xs font-black uppercase tracking-tighter">
                    {selectedSlot ? `${new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} @ ${selectedSlot}` : 'Pending Selection'}
                  </p>
               </div>

               {step === 2 && (
                 <div className="pb-6 border-b border-slate-200 animate-in fade-in">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Client Identity</p>
                    <p className="text-xs font-black uppercase tracking-tighter">
                      {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : 'Anonymized'}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 truncate">{formData.email}</p>
                 </div>
               )}
            </div>

            <div className="mt-12 bg-[#121212] p-8 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#36453B]"></div>
               <div className="relative z-10">
                  <p className="text-[8px] font-black text-[#36453B] uppercase tracking-[0.4em] mb-4">Operations Note</p>
                  <p className="text-[10px] leading-relaxed font-bold italic text-slate-500 group-hover:text-slate-300 transition-colors">
                    "All TeleQuote slots are recorded for precision auditing. Ensure your mobile handset has standard camera permissions active."
                  </p>
               </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.6em]">ISO 9001 Management Protocol • Sydney 2024</p>
      </div>
    </div>
  );
};

export default BookingPage;