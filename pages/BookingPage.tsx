import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { getAvailableSlots, submitBooking } from '../services/bookingApiService';
import { ServiceType, AppointmentType } from '../types';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight, Video, ClipboardList, Loader2, ShieldCheck, ArrowRight, Info, Hash, AlertTriangle } from 'lucide-react';
import CalendarPicker from '../components/CalendarPicker';
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
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const [bookingType, setBookingType] = useState<AppointmentType>('QUOTE');
  const [platformPreference, setPlatformPreference] = useState<string>('webrtc');
  const [timeBucket, setTimeBucket] = useState<'ALL' | 'MORNING' | 'MIDDAY' | 'AFTERNOON'>('MORNING');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    serviceInterest: (localStorage.getItem('revive_last_detected_service') as ServiceType) || ServiceType.PRESSURE_WASHING,
    notes: ''
  });

  const priceGuides: Record<string, string> = {
    [ServiceType.PRESSURE_WASHING]: '$249',
    [ServiceType.GARDEN_MAINTENANCE]: '$129',
    [ServiceType.LAWN_MOWING]: '$89',
    [ServiceType.POOL_MAINTENANCE]: '$149',
    [ServiceType.RUBBISH_REMOVAL]: '$189',
    [ServiceType.RE_GROUTING]: '$399',
  };

  const serviceCodes: Record<string, string> = {
    [ServiceType.PRESSURE_WASHING]: 'PW-24',
    [ServiceType.GARDEN_MAINTENANCE]: 'GM-12',
    [ServiceType.LAWN_MOWING]: 'LM-08',
    [ServiceType.POOL_MAINTENANCE]: 'PM-14',
    [ServiceType.RUBBISH_REMOVAL]: 'RR-18',
    [ServiceType.RE_GROUTING]: 'RG-39',
  };

  const filteredSlots = useMemo(() => {
    if (timeBucket === 'ALL') return availableSlots;
    return availableSlots.filter(slot => {
      const hour = parseInt(slot.split(':')[0]);
      if (timeBucket === 'MORNING') return hour < 12;
      if (timeBucket === 'MIDDAY') return hour >= 12 && hour < 15;
      if (timeBucket === 'AFTERNOON') return hour >= 15;
      return true;
    });
  }, [availableSlots, timeBucket]);

  // Simulated live-generated project ID for architectural feel
  const projectCoordinate = useMemo(() => {
    return `REV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
        if (selectedDate) {
            setAvailableSlots([]); // Clear while loading
            const slots = await getAvailableSlots(selectedDate);
            setAvailableSlots(slots);
        }
    };
    fetchSlots();
  }, [selectedDate]);

  const handleBook = async () => {
    setSubmissionStatus('submitting');
    setErrorMessage('');
    setFieldErrors({});

    try {
      const result = await submitBooking({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        serviceType: formData.serviceInterest,
        date: selectedDate,
        timeSlot: selectedSlot,
        type: bookingType,
        notes: formData.notes,
        platformPreference: bookingType === 'QUOTE' ? platformPreference : undefined
      });

      if (result.success && result.bookingReference) {
        setSubmissionStatus('success');
        localStorage.removeItem('revive_last_detected_service');
        navigate('/success', {
          state: {
            type: 'booking',
            firstName: formData.firstName,
            email: formData.email,
            date: selectedDate,
            time: selectedSlot,
            isQuote: bookingType === 'QUOTE',
            serviceType: formData.serviceInterest,
            bookingReference: result.bookingReference
          }
        });
      } else {
        setSubmissionStatus('error');
        setErrorMessage(result.error || 'Failed to create booking. Please try again.');
        
        // Map details to fields
        if (result.details && Array.isArray(result.details)) {
          const errors: Record<string, string> = {};
          result.details.forEach((err: string) => {
            if (err.toLowerCase().includes('first name')) errors.firstName = err;
            else if (err.toLowerCase().includes('last name')) errors.lastName = err;
            else if (err.toLowerCase().includes('email')) errors.email = err;
            else if (err.toLowerCase().includes('phone')) errors.phone = err;
            else if (err.toLowerCase().includes('address')) errors.address = err;
            else if (err.toLowerCase().includes('date')) errors.date = err;
            else if (err.toLowerCase().includes('time slot')) errors.timeSlot = err;
          });
          setFieldErrors(errors);
        }
      }
    } catch (e) {
      setSubmissionStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
      console.error('Booking error:', e);
    }
  };

  return (
    <div className="bg-[#FDFCFB] min-h-screen py-8 lg:py-12 px-4 lg:px-8 font-sans text-[#121212]">
      <div className="max-w-7xl mx-auto">
        
        {/* Ultra-Modern Header - Compact */}
        <div className="mb-8 border-b border-slate-200 pb-8 flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-10 h-[2px] bg-[#36453B]"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.5em] text-[#36453B]">System Initialization</span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-[#121212] leading-[0.85]">Intake<br/>Protocol.</h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Step 0{step} / Manifest Construction</p>
            <div className="flex gap-1.5 p-1 bg-slate-50 border border-slate-100 rounded-sm">
              <div className={`h-1 w-8 transition-all duration-700 ${step >= 1 ? 'bg-[#36453B]' : 'bg-slate-200'}`}></div>
              <div className={`h-1 w-8 transition-all duration-700 ${step >= 2 ? 'bg-[#36453B]' : 'bg-slate-200'}`}></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-slate-200 border border-slate-200 shadow-[0_30px_80px_-15px_rgba(0,0,0,0.12)] relative overflow-hidden group/container">
          {/* Subtle Ambient Grid Layer */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

          {submissionStatus === 'submitting' && (
            <div className="absolute inset-0 bg-[#121212]/95 z-[60] flex flex-col items-center justify-center p-10 text-center text-white backdrop-blur-md">
               <div className="relative">
                 <Loader2 className="w-16 h-16 text-[#36453B] animate-spin mb-8" />
                 <div className="absolute inset-0 blur-xl bg-[#36453B]/20 animate-pulse"></div>
               </div>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Synchronizing Manifest...</p>
            </div>
          )}

          {submissionStatus === 'error' && (
            <div className="absolute inset-0 bg-[#121212]/95 z-[60] flex flex-col items-center justify-center p-10 text-center text-white backdrop-blur-sm">
               <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Protocol Interrupted</p>
               <p className="text-sm text-slate-300 max-w-md font-medium">{errorMessage}</p>
               <button onClick={() => setSubmissionStatus('idle')} className="mt-6 px-8 py-3 bg-[#36453B] text-white uppercase font-black text-[9px] tracking-[0.3em] hover:bg-[#121212] transition-all border border-[#36453B]/20 shadow-2xl">
                 Resume Stream
               </button>
            </div>
          )}

          {/* Left Column: Form Flow */}
          <div className="lg:col-span-8 bg-white p-6 lg:p-12 relative">
            {step === 1 ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* 01. Service Calibration - Tile Grid */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-4">
                      <span className="w-4 h-px bg-[#36453B]/20"></span> 01. Service Calibration
                    </h3>
                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">[GRID: CORE-X1]</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.values(ServiceType).map(s => {
                      const isSelected = formData.serviceInterest === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setFormData({...formData, serviceInterest: s})}
                          className={`group relative p-5 border transition-all duration-500 text-left overflow-hidden ${
                            isSelected 
                            ? 'border-[#36453B] bg-[#36453B]/5 ring-1 ring-[#36453B] shadow-2xl shadow-[#36453B]/5' 
                            : 'border-slate-100 bg-[#F8F7F4]/50 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          {/* Corner CAD Bracket */}
                          <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t border-r transition-colors duration-500 ${isSelected ? 'border-[#36453B]' : 'border-slate-200'}`}></div>
                          
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className={`text-[8px] font-black uppercase tracking-tighter transition-colors ${isSelected ? 'text-[#36453B]' : 'text-slate-400'}`}>
                                [SYS-{serviceCodes[s]}]
                              </p>
                              {isSelected && <div className="w-1.5 h-1.5 bg-[#36453B] rounded-full animate-pulse"></div>}
                            </div>
                            <h4 className={`text-[9px] font-black uppercase tracking-widest leading-tight transition-colors duration-500 ${isSelected ? 'text-[#121212]' : 'text-slate-500 group-hover:text-[#121212]'}`}>
                              {s}
                            </h4>
                          </div>

                          {/* Interactive Load Bar */}
                          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-100/50 overflow-hidden">
                            <div className={`h-full transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${isSelected ? 'w-full bg-[#36453B]' : 'w-0'}`}></div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 02. & 03. Split Protocol & Investment Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Vertical Protocol Stack */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-4">
                      <span className="w-4 h-px bg-[#36453B]/20"></span> 02. Engagement
                    </h3>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => setBookingType('QUOTE')}
                        className={`relative flex items-center gap-4 p-5 border transition-all duration-500 text-left group overflow-hidden ${bookingType === 'QUOTE' ? 'border-[#36453B] bg-[#36453B]/5 shadow-lg' : 'border-slate-100 bg-[#F8F7F4]/50 hover:bg-white'}`}
                      >
                        <div className={`w-10 h-10 flex items-center justify-center transition-all duration-500 ${bookingType === 'QUOTE' ? 'bg-[#36453B] text-white shadow-lg shadow-[#36453B]/20' : 'bg-white text-slate-300 border border-slate-100'}`}>
                          <Video size={16} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-tight text-[#121212]">Remote TeleQuote</h4>
                          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Instant browser intake</p>
                        </div>
                        {bookingType === 'QUOTE' && <div className="ml-auto w-1 h-5 bg-[#36453B] animate-in slide-in-from-right duration-500"></div>}
                      </button>

                      <button 
                        onClick={() => setBookingType('JOB')}
                        className={`relative flex items-center gap-4 p-5 border transition-all duration-500 text-left group overflow-hidden ${bookingType === 'JOB' ? 'border-[#36453B] bg-[#36453B]/5 shadow-lg' : 'border-slate-100 bg-[#F8F7F4]/50 hover:bg-white'}`}
                      >
                        <div className={`w-10 h-10 flex items-center justify-center transition-all duration-500 ${bookingType === 'JOB' ? 'bg-[#36453B] text-white shadow-lg shadow-[#36453B]/20' : 'bg-white text-slate-300 border border-slate-100'}`}>
                          <ClipboardList size={16} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-tight text-[#121212]">Site Execution</h4>
                          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Physical mobilization</p>
                        </div>
                        {bookingType === 'JOB' && <div className="ml-auto w-1 h-5 bg-[#36453B] animate-in slide-in-from-right duration-500"></div>}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Investment Framework */}
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-4">
                      <span className="w-4 h-px bg-[#36453B]/20"></span> 03. Investment
                    </h3>
                    <div className="p-8 border border-[#36453B]/10 bg-[#121212] text-white relative group overflow-hidden shadow-xl">
                      {/* Blueprint Grid Overlay */}
                      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#36453B_1px,transparent_1px),linear-gradient(to_bottom,#36453B_1px,transparent_1px)] bg-[size:15px_15px]"></div>
                      
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                        <Hash size={40} className="text-[#36453B]" />
                      </div>
                      
                      <div className="relative z-10">
                        <p className="text-[8px] font-black text-[#36453B] uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#36453B]"></span> Baseline metrics
                        </p>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-3xl font-black tracking-tighter tabular-nums">{priceGuides[formData.serviceInterest]}</span>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">EST. INITIAL</span>
                        </div>
                        <p className="text-[9px] font-bold italic text-slate-400 leading-relaxed uppercase tracking-tighter border-t border-white/5 pt-3">
                          "Prices represent Canberra baseline benchmarks. Final sync post-assessment."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100 flex flex-col items-center">
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-6 bg-[#121212] text-white text-[10px] font-black uppercase tracking-[0.6em] hover:bg-[#36453B] transition-all duration-700 flex items-center justify-center gap-6 shadow-xl group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <span className="relative z-10">Commit to Scheduling</span>
                    <ArrowRight size={16} className="relative z-10 group-hover:translate-x-4 transition-transform duration-700" />
                  </button>
                  <p className="mt-6 text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] flex items-center gap-3">
                    <ShieldCheck size={10} className="text-[#36453B]/40" /> Parameters Validated • Network Ready
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-in slide-in-from-right-12 duration-700">
                {/* Scheduling - Industrial Grid - PROPORTIONAL & STABLE */}
                <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10 pb-10 border-b border-slate-50 items-start">
                  <div className="space-y-5 min-w-0">
                    <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-4">
                       <Calendar size={14} className="text-[#36453B]/40" /> 04. Date Selection
                    </h3>
                    <div className="relative group/cal border border-slate-100 p-1 bg-white">
                      <CalendarPicker 
                        selectedDate={selectedDate} 
                        onDateSelect={(date) => { setSelectedDate(date); setSelectedSlot(''); }}
                        minDate={minDate} 
                      />
                    </div>
                  </div>
                  <div className="space-y-5 min-w-0">
                    <div className="flex flex-col gap-5 h-auto">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-4">
                           <Clock size={14} className="text-[#36453B]/40" /> 05. Arrival Window
                        </h3>
                        {/* Bespoke Segmented Slider Filter */}
                        <div className="relative p-1 bg-slate-50 border border-slate-100 rounded-[2px] flex items-center group/filter">
                          {/* Sliding Indicator */}
                          <div 
                            className="absolute h-[calc(100%-8px)] bg-white shadow-sm border border-slate-100 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                            style={{ 
                              width: 'calc(25% - 2px)', 
                              left: timeBucket === 'ALL' ? '4px' : timeBucket === 'MORNING' ? '25%' : timeBucket === 'MIDDAY' ? '50%' : '75%',
                              transform: `translateX(${timeBucket === 'ALL' ? '0' : timeBucket === 'MORNING' ? '1px' : timeBucket === 'MIDDAY' ? '2px' : '3px'})`
                            }}
                          ></div>
                          
                          {['ALL', 'MORNING', 'MIDDAY', 'AFTERNOON'].map(b => (
                            <button
                              key={b}
                              onClick={() => setTimeBucket(b as any)}
                              className={`relative z-10 flex-1 py-2 text-[8px] font-black uppercase tracking-[0.1em] transition-colors duration-500 ${timeBucket === b ? 'text-[#121212]' : 'text-slate-400 hover:text-[#121212]'}`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* FIXED HEIGHT GRID - PREVENTS STRETCHING */}
                      <div className="grid grid-cols-2 gap-2 content-start min-h-[280px]">
                        {filteredSlots.slice(0, 10).map(slot => {
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`group/slot relative h-[72px] p-4 transition-all duration-500 border rounded-sm text-left overflow-hidden ${
                                isSelected 
                                ? 'bg-[#121212] text-white border-[#121212] shadow-xl translate-y-[-1px]' 
                                : 'bg-white text-slate-600 border-slate-100 hover:border-[#36453B]'
                              }`}
                            >
                              <div className="relative z-10 flex flex-col justify-between h-full">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[7px] font-bold uppercase tracking-widest ${isSelected ? 'text-[#36453B]' : 'text-slate-300'}`}>UTC+OFFSET</span>
                                  {isSelected && <div className="w-1.5 h-1.5 bg-[#36453B] rounded-full animate-pulse"></div>}
                                </div>
                                <span className="text-[11px] font-black tabular-nums tracking-[0.2em]">{slot}</span>
                                
                                <div className="flex items-center gap-2">
                                  <div className={`h-[2px] flex-grow rounded-full overflow-hidden ${isSelected ? 'bg-white/10' : 'bg-slate-50'}`}>
                                    <div 
                                      className={`h-full transition-all duration-1000 ${isSelected ? 'bg-[#36453B] w-[40%]' : 'bg-slate-200 w-[15%] group-hover/slot:w-[30%]'}`}
                                    ></div>
                                  </div>
                                  <span className={`text-[6px] font-black uppercase ${isSelected ? 'text-slate-500' : 'text-slate-300'}`}>Load: {isSelected ? 'Optimum' : 'Standby'}</span>
                                </div>
                              </div>
                              <div className={`absolute top-0 right-0 w-1.5 h-1.5 border-t border-r transition-colors ${isSelected ? 'border-[#36453B]/40' : 'border-slate-100'}`}></div>
                            </button>
                          );
                        })}
                        
                        {filteredSlots.length === 0 && (
                          <div className="col-span-full h-[280px] text-center border border-dashed border-slate-100 rounded-sm flex flex-col items-center justify-center bg-slate-50/20">
                            <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] animate-pulse">Module Depleted</p>
                            <p className="text-[7px] text-slate-400 uppercase tracking-widest mt-2">Adjust temporal filter</p>
                          </div>
                        )}
                      </div>
                      
                      {filteredSlots.length > 10 && (
                        <div className="flex items-center justify-center gap-4">
                          <div className="h-px flex-grow bg-slate-50"></div>
                          <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em]">+{filteredSlots.length - 10} SUPPRESSED</span>
                          <div className="h-px flex-grow bg-slate-50"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <h4 className="text-[11px] font-black text-[#36453B] uppercase tracking-[0.5em] flex items-center gap-4">
                        <span className="w-4 h-px bg-[#36453B]/30"></span> 06. Principal
                      </h4>
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="relative group/input">
                             <p className={`absolute -top-3 left-0 text-[7px] font-black uppercase tracking-widest transition-all duration-500 ${fieldErrors.firstName ? 'text-red-500 opacity-100' : 'text-slate-300 opacity-0 group-focus-within/input:opacity-100'}`}>
                               {fieldErrors.firstName || 'First Name'}
                             </p>
                             <input type="text" placeholder="FIRST NAME" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className={`w-full bg-transparent border-b p-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all duration-500 placeholder:text-slate-300 ${fieldErrors.firstName ? 'border-red-500/50' : 'border-slate-200 focus:border-[#36453B]'}`} />
                           </div>
                           <div className="relative group/input">
                             <p className={`absolute -top-3 left-0 text-[7px] font-black uppercase tracking-widest transition-all duration-500 ${fieldErrors.lastName ? 'text-red-500 opacity-100' : 'text-slate-300 opacity-0 group-focus-within/input:opacity-100'}`}>
                               {fieldErrors.lastName || 'Last Name'}
                             </p>
                             <input type="text" placeholder="LAST NAME" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className={`w-full bg-transparent border-b p-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all duration-500 placeholder:text-slate-300 ${fieldErrors.lastName ? 'border-red-500/50' : 'border-slate-200 focus:border-[#36453B]'}`} />
                           </div>
                        </div>
                        <div className="relative group/input">
                          <p className={`absolute -top-3 left-0 text-[7px] font-black uppercase tracking-widest transition-all duration-500 ${fieldErrors.email ? 'text-red-500 opacity-100' : 'text-slate-300 opacity-0 group-focus-within/input:opacity-100'}`}>
                            {fieldErrors.email || 'Email Reference'}
                          </p>
                          <input type="email" placeholder="EMAIL ADDRESS" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full bg-transparent border-b p-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all duration-500 placeholder:text-slate-300 ${fieldErrors.email ? 'border-red-500/50' : 'border-slate-200 focus:border-[#36453B]'}`} />
                        </div>
                        <div className="relative group/input">
                          <p className={`absolute -top-3 left-0 text-[7px] font-black uppercase tracking-widest transition-all duration-500 ${fieldErrors.phone ? 'text-red-500 opacity-100' : 'text-slate-300 opacity-0 group-focus-within/input:opacity-100'}`}>
                            {fieldErrors.phone || 'Mobile Unit'}
                          </p>
                          <input type="tel" placeholder="MOBILE CONTACT" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={`w-full bg-transparent border-b p-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all duration-500 placeholder:text-slate-300 ${fieldErrors.phone ? 'border-red-500/50' : 'border-slate-200 focus:border-[#36453B]'}`} />
                        </div>
                      </div>
                   </div>
                   <div className="space-y-8">
                      <h4 className="text-[11px] font-black text-[#36453B] uppercase tracking-[0.5em] flex items-center gap-4">
                        <span className="w-4 h-px bg-[#36453B]/30"></span> 07. Specification
                      </h4>
                      <div className="space-y-6">
                        <div className="relative group/input">
                          <p className={`absolute -top-3 left-0 text-[7px] font-black uppercase tracking-widest transition-all duration-500 ${fieldErrors.address ? 'text-red-500 opacity-100' : 'text-slate-300 opacity-0 group-focus-within/input:opacity-100'}`}>
                            {fieldErrors.address || 'Property Coordinate'}
                          </p>
                          <input type="text" placeholder="FULL PROPERTY ADDRESS" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className={`w-full bg-transparent border-b p-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all duration-500 placeholder:text-slate-300 ${fieldErrors.address ? 'border-red-500/50' : 'border-slate-200 focus:border-[#36453B]'}`} />
                        </div>
                        <div className="relative group/input">
                          <p className="absolute -top-3 left-0 text-[7px] font-black text-slate-300 uppercase tracking-widest opacity-0 group-focus-within/input:opacity-100 transition-all duration-500">Job Intelligence</p>
                          <textarea placeholder="ADDITIONAL JOB NOTES..." rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-transparent border-b border-slate-200 p-3 text-[10px] font-medium uppercase tracking-widest focus:border-[#36453B] outline-none transition-all duration-500 placeholder:text-slate-300 resize-none" />
                        </div>
                      </div>
                   </div>
                </div>

                {bookingType === 'QUOTE' && (
                  <div className="pt-8 border-t border-slate-100">
                     <div className="flex items-center gap-6 p-6 bg-[#36453B]/5 border border-[#36453B]/10 rounded-sm">
                        <Video size={24} className="text-[#36453B]" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#121212]">Universal Video Protocol Active</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">A secure link will be dispatched upon manifest finalization.</p>
                        </div>
                     </div>
                  </div>
                )}

                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-5 border border-slate-100 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-slate-50 transition-all flex items-center justify-center gap-4 group">
                    <ChevronLeft size={14} className="group-hover:-translate-x-2 transition-transform" /> Recalibrate
                  </button>
                  <button 
                    onClick={handleBook} 
                    disabled={isBooking || !selectedSlot || !formData.firstName || !formData.email || !formData.address} 
                    className="flex-[2] py-5 bg-[#36453B] text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#121212] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-700 shadow-xl"
                  >
                    Finalize & Dispatch Manifest
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Manifest Summary (Blueprint feel) */}
          <div className="lg:col-span-4 bg-[#F8F7F4] p-6 lg:p-10 flex flex-col border-l border-slate-200 relative overflow-hidden">
            {/* Subtle Industrial Watermark */}
            <div className="absolute -bottom-10 -right-10 text-[100px] font-black text-slate-200/20 select-none pointer-events-none rotate-12">RVP</div>

            <h3 className="text-[10px] font-black text-[#121212] uppercase tracking-[0.5em] mb-10 flex items-center justify-between">
              Manifest <div className="w-10 h-px bg-slate-300"></div>
            </h3>
            
            <div className="space-y-6 flex-grow relative z-10">
               <div className="pb-5 border-b border-slate-200/60">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2.5">Project Coordinate</p>
                  <div className="bg-[#121212] p-3 flex items-center justify-center">
                    <p className="text-white text-[11px] font-black uppercase tracking-[0.4em] tabular-nums">{projectCoordinate}</p>
                  </div>
               </div>

               <div className="pb-5 border-b border-slate-200/60">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2.5">Module</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#121212]">
                    {formData.serviceInterest || 'AWAITING SELECTION'}
                  </p>
               </div>

               <div className="pb-5 border-b border-slate-200/60">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2.5">Protocol</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#121212]">
                    {bookingType === 'QUOTE' ? 'TeleQuote Remote' : 'Site Commencement'}
                  </p>
               </div>

               <div className="pb-5 border-b border-slate-200/60">
                  <div className="flex justify-between items-center mb-2.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Window</p>
                    {step === 2 && !selectedSlot && <span className="text-[7px] font-black text-red-500 uppercase tracking-widest animate-pulse">[REQUIRED]</span>}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#121212]">
                    {selectedSlot ? `${new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })} @ ${selectedSlot}` : 'AWAITING SYNC'}
                  </p>
               </div>

               <div className="animate-in fade-in duration-700">
                  <div className="flex justify-between items-center mb-2.5">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity</p>
                    {step === 2 && (!formData.firstName || !formData.email || !formData.address) && <span className="text-[7px] font-black text-red-500 uppercase tracking-widest animate-pulse">[REQUIRED]</span>}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#121212] truncate">
                    {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : 'ANONYMIZED'}
                  </p>
               </div>
            </div>

            <div className="mt-12 pt-6 border-t border-slate-200">
               <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] text-center italic">Precision Management Protocol</p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">ISO 9001 Management Protocol • ACT Region 2026</p>
      </div>
    </div>
  );
};

export default BookingPage;