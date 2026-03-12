
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { getLeads, getAppointments, updateLead, getTasks, addTask, updateTask, deleteTask } from '../services/crmService';
import { Lead, Appointment, LeadStatus, ServiceType, Task } from '../types';
import { 
  User, 
  Calendar as CalendarIcon, 
  LogOut, 
  Video, 
  RefreshCw, 
  ChevronRight as ChevronRightSmall, 
  LayoutDashboard, 
  Settings, 
  Activity, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  FileText, 
  Archive, 
  CheckCircle2, 
  ArrowUpRight,
  ClipboardList,
  CheckSquare,
  Trash2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leads' | 'calendar' | 'stats' | 'tasks'>('leads');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [serviceFilter, setServiceFilter] = useState<ServiceType | 'ALL'>('ALL');

  // Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskLeadId, setNewTaskLeadId] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [l, a, t] = await Promise.all([getLeads(), getAppointments(), getTasks()]);
        setLeads(l);
        setAppointments(a);
        setTasks(t);
    } catch (e) {
        console.error("Failed to load dashboard data", e);
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: LeadStatus) => {
    try {
      await updateLead(id, { status });
      if (selectedLead?.id === id) {
        setSelectedLead(prev => prev ? { ...prev, status } : null);
      }
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    setIsTaskSubmitting(true);
    try {
        await addTask({
            title: newTaskTitle,
            leadId: newTaskLeadId || undefined,
            dueDate: newTaskDueDate || undefined,
            completed: false
        });
        setNewTaskTitle('');
        setNewTaskLeadId('');
        setNewTaskDueDate('');
        const t = await getTasks();
        setTasks(t);
    } catch (error) {
        console.error("Task creation failed", error);
    } finally {
        setIsTaskSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
      try {
          await updateTask(taskId, { completed: !currentStatus });
          const t = await getTasks();
          setTasks(t);
      } catch (error) {
          console.error("Task update failed", error);
      }
  };

  const handleDeleteTask = async (taskId: string) => {
      if(!window.confirm("Confirm deletion of operational directive?")) return;
      try {
          await deleteTask(taskId);
          const t = await getTasks();
          setTasks(t);
      } catch (error) {
          console.error("Task deletion failed", error);
      }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredLeads = leads
    .filter((lead) => statusFilter === 'ALL' || lead.status === statusFilter)
    .filter((lead) => serviceFilter === 'ALL' || lead.serviceInterest === serviceFilter);

  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null, date: null });
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, date: dateStr });
    }
    return days;
  }, [currentCalendarDate]);

  const getLeadName = (leadId?: string) => {
      if (!leadId) return null;
      const lead = leads.find(l => l.id === leadId);
      return lead ? `${lead.firstName} ${lead.lastName}` : 'Unknown Asset';
  };

  const isOverdue = (dateStr?: string) => {
      if (!dateStr) return false;
      const due = new Date(dateStr);
      const today = new Date();
      today.setHours(0,0,0,0);
      return due < today;
  };

  if (loading && leads.length === 0) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
              <div className="flex flex-col items-center gap-4">
                <RefreshCw className="w-12 h-12 text-[#36453B] animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Synchronizing Matrix</span>
              </div>
          </div>
      )
  }

  return (
    <div className="bg-[#FDFCFB] min-h-screen py-16 px-6 lg:px-8 font-sans text-[#121212]">
      <div className="max-w-7xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-10">
          <div className="max-w-2xl">
            <h2 className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.5em] mb-8">Internal Control Panel</h2>
            <h1 className="text-6xl sm:text-8xl font-black uppercase tracking-tighter text-[#121212] mb-8 leading-[0.85]">
              System <br />Command.
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Sydney property management hub. Synchronizing lead pipelines, technical schedules, and operational logistics.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 border border-slate-200 shadow-sm flex-wrap">
             {['leads', 'calendar', 'tasks', 'stats'].map((tab) => (
                <button 
                  key={tab}
                  className={`px-6 sm:px-8 py-3 text-[9px] font-black uppercase tracking-[0.4em] transition-all rounded-none ${activeTab === tab ? 'bg-[#121212] text-white shadow-xl' : 'text-slate-400 hover:text-[#121212]'}`}
                  onClick={() => setActiveTab(tab as any)}
                >{tab}</button>
              ))}
              <button onClick={handleSignOut} className="p-3 text-slate-400 hover:text-rose-600 transition-all border-l border-slate-100 ml-2" title="Sign Out"><LogOut size={16} /></button>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 border border-slate-200 mb-20 shadow-2xl">
          {[
            { label: 'Pipeline Leads', value: leads.length, icon: User, trend: '+4% vs LY' },
            { label: 'Active Tasks', value: tasks.filter(t => !t.completed).length, icon: ClipboardList, trend: 'Critical' },
            { label: 'Confirmed Jobs', value: appointments.length, icon: CalendarIcon, trend: 'Capacity 85%' }
          ].map((card, idx) => (
            <div key={idx} className="bg-white p-12 flex flex-col group transition-all hover:bg-[#FDFCFB]">
              <div className="flex justify-between items-start mb-10">
                <div className="bg-[#121212] p-5 text-white shadow-lg group-hover:bg-[#36453B] transition-colors rounded-none">
                  <card.icon size={24} strokeWidth={1} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{card.trend}</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">{card.label}</p>
                <p className="text-6xl font-black text-[#121212] tracking-tighter">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Work Area */}
        <div className="bg-white border border-slate-200 shadow-2xl overflow-hidden min-h-[700px] relative">
          
          {activeTab === 'leads' && (
             <div className="flex flex-col">
               <div className="p-10 border-b border-slate-100 bg-[#F9F9F7] flex flex-wrap gap-10 justify-between items-center">
                  <div className="flex gap-6">
                      <div className="relative">
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest p-4 outline-none focus:border-[#36453B] appearance-none cursor-pointer pr-12 rounded-none">
                            <option value="ALL">All Status Matrix</option>
                            {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronRightSmall className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value as any)} className="bg-white border border-slate-200 text-[9px] font-black uppercase tracking-widest p-4 outline-none focus:border-[#36453B] appearance-none cursor-pointer pr-12 rounded-none">
                            <option value="ALL">All Disciplines</option>
                            {Object.values(ServiceType).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                        <ChevronRightSmall className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[#36453B] flex items-center gap-3">
                    <Activity className="w-4 h-4" /> Operational Archive: {leads.length}
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-[#F8F7F4]">
                          <tr>
                              <th className="px-12 py-10 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Timestamp</th>
                              <th className="px-12 py-10 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Principal Asset</th>
                              <th className="px-12 py-10 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Technical Need</th>
                              <th className="px-12 py-10 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Matrix Status</th>
                              <th className="relative px-12 py-10"><span className="sr-only">Actions</span></th>
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-5">
                          {filteredLeads.map((lead) => (
                              <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-[#FDFCFB] transition-all cursor-pointer group">
                                  <td className="px-12 py-10 whitespace-nowrap text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                      {new Date(lead.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-12 py-10 whitespace-nowrap">
                                      <div className="text-lg font-black text-[#121212] uppercase tracking-tighter mb-1">{lead.firstName} {lead.lastName}</div>
                                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{lead.phone}</div>
                                  </td>
                                  <td className="px-12 py-10 whitespace-nowrap text-[10px] text-[#36453B] font-black uppercase tracking-widest">
                                      {lead.serviceInterest}
                                  </td>
                                  <td className="px-12 py-10 whitespace-nowrap">
                                      <span className={`px-5 py-2 text-[9px] font-black uppercase tracking-[0.4em] border
                                          ${lead.status === LeadStatus.NEW ? 'bg-[#36453B] text-white border-[#36453B]' : 'bg-white text-slate-400 border-slate-200'}
                                      `}>
                                          {lead.status}
                                      </span>
                                  </td>
                                  <td className="px-12 py-10 whitespace-nowrap text-right">
                                      <button className="p-4 bg-slate-50 text-slate-300 group-hover:bg-[#121212] group-hover:text-white transition-all"><ChevronRightSmall size={18} /></button>
                                  </td>
                              </tr>
                          ))}
                          {filteredLeads.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-32 text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">No Matching Matrix Entries Found</td>
                            </tr>
                          )}
                      </tbody>
                  </table>
               </div>
             </div>
          )}

          {activeTab === 'tasks' && (
             <div className="p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Task List */}
               <div className="lg:col-span-2 space-y-12">
                 <div>
                    <h3 className="text-2xl font-black text-[#121212] uppercase tracking-tighter mb-8 flex items-center gap-4">
                       <AlertCircle className="text-[#36453B]" /> Pending Directives
                    </h3>
                    <div className="space-y-4">
                       {tasks.filter(t => !t.completed).map(task => (
                          <div key={task.id} className={`p-6 bg-white border-l-4 shadow-sm flex items-start gap-4 transition-all hover:shadow-md ${isOverdue(task.dueDate) ? 'border-rose-500' : 'border-[#36453B]'}`}>
                             <button onClick={() => handleToggleTask(task.id, task.completed)} className="mt-1 text-slate-300 hover:text-[#36453B] transition-colors">
                                <CheckSquare size={24} />
                             </button>
                             <div className="flex-grow">
                                <h4 className={`text-lg font-black text-[#121212] uppercase tracking-tight mb-1 ${isOverdue(task.dueDate) ? 'text-rose-600' : ''}`}>{task.title}</h4>
                                <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                   {task.dueDate && <span className={isOverdue(task.dueDate) ? 'text-rose-500' : ''}>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                                   {task.leadId && <span>Target: {getLeadName(task.leadId)}</span>}
                                </div>
                             </div>
                             <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 size={18} />
                             </button>
                          </div>
                       ))}
                       {tasks.filter(t => !t.completed).length === 0 && (
                          <div className="p-8 text-center border-2 border-dashed border-slate-200">
                             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Operational Queue Empty</p>
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="opacity-60">
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter mb-8 flex items-center gap-4">
                       <Archive className="text-slate-300" /> Archive
                    </h3>
                    <div className="space-y-4">
                       {tasks.filter(t => t.completed).map(task => (
                          <div key={task.id} className="p-4 bg-slate-50 border border-slate-200 flex items-center gap-4">
                             <button onClick={() => handleToggleTask(task.id, task.completed)} className="text-[#36453B]">
                                <CheckCircle2 size={20} />
                             </button>
                             <div className="flex-grow">
                                <h4 className="text-sm font-bold text-slate-500 line-through uppercase tracking-tight">{task.title}</h4>
                             </div>
                             <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                             </button>
                          </div>
                       ))}
                    </div>
                 </div>
               </div>

               {/* Create Task Form */}
               <div className="bg-[#121212] p-10 text-white shadow-2xl h-fit sticky top-10">
                 <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                   <Plus className="bg-[#36453B] rounded-full p-1" /> Initialize Directive
                 </h3>
                 <form onSubmit={handleCreateTask} className="space-y-6">
                    <div>
                       <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-[#36453B] mb-2">Directive Title</label>
                       <input 
                         type="text" 
                         value={newTaskTitle}
                         onChange={(e) => setNewTaskTitle(e.target.value)}
                         placeholder="e.g. Follow up on Quote #402"
                         className="w-full bg-white/10 border border-white/10 p-4 text-sm font-medium text-white placeholder-white/30 focus:border-[#36453B] outline-none"
                         required
                       />
                    </div>
                    <div>
                       <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-[#36453B] mb-2">Target Asset (Lead)</label>
                       <select 
                         value={newTaskLeadId}
                         onChange={(e) => setNewTaskLeadId(e.target.value)}
                         className="w-full bg-white/10 border border-white/10 p-4 text-sm font-medium text-white focus:border-[#36453B] outline-none appearance-none cursor-pointer"
                       >
                         <option value="" className="text-black">General / No Assignment</option>
                         {leads.map(lead => (
                            <option key={lead.id} value={lead.id} className="text-black">{lead.firstName} {lead.lastName}</option>
                         ))}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-[#36453B] mb-2">Execution Deadline</label>
                       <input 
                         type="date" 
                         value={newTaskDueDate}
                         onChange={(e) => setNewTaskDueDate(e.target.value)}
                         className="w-full bg-white/10 border border-white/10 p-4 text-sm font-medium text-white focus:border-[#36453B] outline-none [color-scheme:dark]"
                       />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isTaskSubmitting}
                      className="w-full py-5 bg-white text-[#121212] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] hover:text-white transition-all mt-6 shadow-xl"
                    >
                       Commit Protocol
                    </button>
                 </form>
               </div>
             </div>
          )}

          {/* Lead Inspector Modal / Slide-over */}
          {selectedLead && (
            <div className="absolute inset-0 bg-white z-[50] animate-in slide-in-from-right duration-500 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-10 flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-[#121212] flex items-center justify-center text-white">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">{selectedLead.firstName} {selectedLead.lastName}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Asset Ref: {selectedLead.id.toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLead(null)} className="p-4 hover:bg-slate-50 transition-colors text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 lg:p-20 grid grid-cols-1 lg:grid-cols-3 gap-20">
                <div className="lg:col-span-2 space-y-20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-3"><MapPin size={12} /> Site Geography</p>
                      <p className="text-xl font-black uppercase tracking-tight leading-tight">{selectedLead.address}</p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-3"><Clock size={12} /> Intake Timestamp</p>
                      <p className="text-xl font-black uppercase tracking-tight">{new Date(selectedLead.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-3"><Mail size={12} /> Comm Line</p>
                      <p className="text-xl font-black tracking-tight">{selectedLead.email}</p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-3"><Phone size={12} /> Direct Matrix</p>
                      <p className="text-xl font-black tracking-tight">{selectedLead.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-[#36453B] uppercase tracking-[0.4em] flex items-center gap-3"><FileText size={12} /> Technical Brief</p>
                    <div className="bg-[#F8F7F4] p-10 border border-slate-100 min-h-[150px]">
                      <p className="text-lg text-slate-600 font-medium italic leading-relaxed">
                        {selectedLead.notes || "No additional technical specification provided."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  <div className="bg-[#121212] p-10 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#36453B] rotate-45 translate-x-8 -translate-y-8"></div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-10 text-[#36453B]">Operational Status</h4>
                    <div className="space-y-4">
                      {/* Fixed: Use LeadStatus directly from types instead of LS */}
                      {Object.values(LeadStatus).map((status) => (
                        <button 
                          key={status}
                          // Fixed: Explicitly cast status to LeadStatus to resolve unknown type error
                          onClick={() => handleUpdateLeadStatus(selectedLead.id, status as LeadStatus)}
                          className={`w-full py-5 text-[10px] font-black uppercase tracking-[0.4em] border transition-all flex items-center justify-between px-6 ${
                            selectedLead.status === status 
                            ? 'bg-[#36453B] border-[#36453B] text-white shadow-xl' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/40'
                          }`}
                        >
                          {status}
                          {selectedLead.status === status && <CheckCircle2 size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-10 border border-slate-200 bg-[#FDFCFB] space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Action Matrix</h4>
                    <div className="space-y-3">
                      <button className="w-full py-4 border border-slate-200 text-[9px] font-black uppercase tracking-widest hover:bg-[#121212] hover:text-white transition-all flex items-center justify-center gap-3">
                        <ArrowUpRight size={14} /> Transmit Email Brief
                      </button>
                      <button 
                        onClick={() => navigate('/admin/telequote')}
                        className="w-full py-4 bg-[#36453B] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#121212] transition-all flex items-center justify-center gap-3 shadow-lg"
                      >
                        <Video size={14} /> Launch TeleQuote
                      </button>
                      <button className="w-full py-4 border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-300 cursor-not-allowed flex items-center justify-center gap-3">
                        <Archive size={14} /> Purge Entry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
             <div className="p-16">
                 <div className="flex justify-between items-center mb-16">
                    <h3 className="text-4xl font-black text-[#121212] uppercase tracking-tighter">Execution Calendar.</h3>
                    <div className="flex gap-4">
                        <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))} className="p-4 border border-slate-200 hover:bg-[#121212] hover:text-white transition-all"><ChevronRightSmall size={20} className="rotate-180" /></button>
                        <button onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))} className="p-4 border border-slate-200 hover:bg-[#121212] hover:text-white transition-all"><ChevronRightSmall size={20} /></button>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 shadow-xl">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="bg-[#F8F7F4] p-6 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 text-center">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day, idx) => (
                      <div key={idx} className={`bg-white min-h-[140px] p-6 group hover:bg-[#FDFCFB] transition-all relative ${!day.day ? 'bg-slate-50/50' : ''}`}>
                         {day.day && (
                           <>
                             <span className="text-xl font-black text-slate-300 group-hover:text-[#121212] transition-colors">{day.day}</span>
                             <div className="mt-4 space-y-2">
                                {appointments.filter(a => a.date === day.date).map((app, appIdx) => (
                                   <div key={appIdx} className="bg-[#36453B] text-white p-3 text-[9px] font-black uppercase tracking-tight shadow-lg border-l-4 border-[#121212]">
                                      {app.timeSlot} • {app.serviceType.split(' ')[0]}
                                   </div>
                                ))}
                             </div>
                           </>
                         )}
                      </div>
                    ))}
                 </div>
             </div>
          )}

          {activeTab === 'stats' && (
             <div className="p-20 grid grid-cols-1 md:grid-cols-2 gap-20 animate-in fade-in duration-700">
               <div>
                 <h3 className="text-3xl font-black uppercase tracking-tighter mb-12 flex items-center gap-6">
                    <div className="w-2 h-10 bg-[#36453B]"></div>
                    Performance Matrix
                 </h3>
                 <div className="space-y-12">
                   {[
                     { label: 'Lead Conversion Rate', value: '62%', color: 'bg-[#36453B]' },
                     { label: 'Booking Efficiency', value: '88%', color: 'bg-[#121212]' },
                     { label: 'Sydney Market Share', value: '14%', color: 'bg-slate-300' }
                   ].map((stat, i) => (
                     <div key={i} className="space-y-4">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                          <span className="text-slate-500">{stat.label}</span>
                          <span className="text-[#121212]">{stat.value}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 overflow-hidden">
                           <div className={`h-full ${stat.color}`} style={{ width: stat.value }}></div>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
               <div className="bg-[#121212] p-16 text-white border-b-[16px] border-[#36453B] flex flex-col justify-center shadow-2xl">
                 <h4 className="text-5xl font-black uppercase tracking-tighter leading-none mb-10">
                   Operational <br />Health Status.
                 </h4>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed italic border-l-2 border-white/20 pl-8 mb-10">
                   "Growth is stabilized within the Eastern Suburbs corridor. Strategic focus remains on technical service expansion and high-fidelity client retention."
                 </p>
                 <button onClick={() => setActiveTab('leads')} className="bg-white text-[#121212] px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-[#36453B] hover:text-white transition-all rounded-none self-start">Review Live Pipeline</button>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
