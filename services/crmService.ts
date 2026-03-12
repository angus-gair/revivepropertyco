
import { Lead, Appointment, LeadStatus, ServiceType, Campaign, Task, AppointmentType, TeleQuoteSession } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LEADS_KEY = 'revive_leads';
const APPOINTMENTS_KEY = 'revive_appointments';
const SESSIONS_KEY = 'revive_telequote_sessions';

// --- Synthetic Data Generators ---
const SUBURBS = ['Coogee', 'Randwick', 'Maroubra', 'South Coogee', 'Mascot', 'Bronte', 'Clovelly', 'Kensington', 'Kingsford'];
const STREETS = ['Oberon St', 'Rainbow St', 'Arden St', 'Malabar Rd', 'Anzac Pde', 'Coogee Bay Rd', 'Beach St', 'High St', 'Botany Rd', 'Cowper St', 'Avoca St', 'Belmore Rd', 'Dudley St', 'Brook St'];
const FIRST_NAMES = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Sophie', 'William', 'Isabella', 'Jack', 'Olivia', 'Thomas', 'Chloe', 'Daniel', 'Mia', 'Joshua', 'Charlotte', 'Liam', 'Amelia', 'Oliver', 'Ava'];
const LAST_NAMES = ['Smith', 'Jones', 'Wilson', 'Brown', 'Taylor', 'White', 'Martin', 'Anderson', 'Thompson', 'Nguyen', 'Li', 'Cohen', 'O\'Connor', 'Kelly', 'Sullivan'];

const SERVICE_NOTES: Record<ServiceType, string[]> = {
  [ServiceType.PRESSURE_WASHING]: [
    "Sandstone driveway requires soft wash. Heavy moss buildup.",
    "Front facade and double driveway. Heritage tile path.",
    "Rear patio and pool surround cleaning needed before summer.",
    "Commercial shopfront entrance, heavy foot traffic staining.",
    "Full exterior wash down including gutters and eaves."
  ],
  [ServiceType.GARDEN_MAINTENANCE]: [
    "Overgrown hedge along fence line. Needs structural pruning.",
    "Regular lawn mowing and edging required for rental property.",
    "Garden overhaul before property sale. Weeding and mulching.",
    "Strata block maintenance, front garden beds only.",
    "Rose pruning and seasonal fertilization."
  ],
  [ServiceType.LAWN_MOWING]: [
    "Fortnightly mow and edge. Corner block.",
    "Long grass, hasn't been cut in 6 weeks. Catchings removed.",
    "Small courtyard lawn, access via garage."
  ],
  [ServiceType.POOL_MAINTENANCE]: [
    "Green pool recovery. Pump hasn't run in 2 weeks.",
    "Regular monthly balance and clean.",
    "Salt chlorinator check and filter sand change.",
    "Leaf scoop and vacuum after storm."
  ],
  [ServiceType.RUBBISH_REMOVAL]: [
    "Old fridge and 2 mattresses to be removed.",
    "Garage clear out. Mixed general waste and cardboard.",
    "Green waste pile from weekend gardening. Trailer load.",
    "Renovation debris, old carpet and underlay."
  ],
  [ServiceType.RE_GROUTING]: [
    "Master shower leaking. Needs epoxy regrout.",
    "Kitchen splashback silicone replacement.",
    "Balcony tiles loose, grout missing in high traffic areas.",
    "Main bathroom floor regrout and seal. White grout turning black.",
    "Full shower restoration, mould behind silicone."
  ]
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateSyntheticData = () => {
  const generatedLeads: Lead[] = [];
  const generatedAppointments: Appointment[] = [];
  const generatedSessions: TeleQuoteSession[] = [];
  
  const now = new Date();
  // Generate 45 leads
  for (let i = 0; i < 45; i++) {
    const id = Math.random().toString(36).substr(2, 9);
    const service = pick(Object.values(ServiceType));
    const suburb = pick(SUBURBS);
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    
    // Date distribution: Some recent past, mostly future (next 90 days)
    const dayOffset = randomInt(-10, 90); 
    const leadDate = new Date(now);
    leadDate.setDate(leadDate.getDate() + dayOffset);
    const timestamp = leadDate.getTime();

    // Determine status based on date
    let status = LeadStatus.NEW;
    if (dayOffset < 0) status = Math.random() > 0.5 ? LeadStatus.BOOKED : LeadStatus.ARCHIVED;
    else if (dayOffset < 14) status = Math.random() > 0.3 ? LeadStatus.CONTACTED : LeadStatus.NEW;
    else status = Math.random() > 0.6 ? LeadStatus.BOOKED : LeadStatus.NEW;

    const lead: Lead = {
      id,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `04${randomInt(10, 99)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
      address: `${randomInt(1, 150)} ${pick(STREETS)}, ${suburb} NSW 20${randomInt(31, 36)}`,
      serviceInterest: service,
      notes: pick(SERVICE_NOTES[service]),
      status,
      createdAt: timestamp - (randomInt(1, 5) * 86400000), // Created 1-5 days before the "appointment" target
      statusHistory: [{ from: null, to: status, timestamp: timestamp }]
    };

    // If booked, create appointment
    if (status === LeadStatus.BOOKED) {
      const appDateStr = leadDate.toISOString().split('T')[0];
      const slot = `${String(randomInt(8, 16)).padStart(2, '0')}:00`;
      
      generatedAppointments.push({
        id: Math.random().toString(36).substr(2, 9),
        leadId: id,
        serviceType: service,
        type: Math.random() > 0.7 ? 'QUOTE' : 'JOB',
        date: appDateStr,
        timeSlot: slot,
        status: dayOffset < 0 ? 'COMPLETED' : 'CONFIRMED',
        notes: lead.notes
      });
    }

    // Add some TeleQuote sessions
    if (Math.random() > 0.7) {
      const session: TeleQuoteSession = {
        id: Math.random().toString(36).substr(2, 9),
        leadId: id,
        sessionCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
        platform: pick(['whatsapp', 'google_meet', 'zoom', 'teams', 'messenger']),
        status: status === LeadStatus.BOOKED ? 'COMPLETED' : 'SCHEDULED',
        meetingLink: `https://meet.google.com/rvive-${Math.random().toString(36).substr(2, 6)}`,
        notes: "Client requested virtual assessment for balcony access issues.",
        finalEstimate: status === LeadStatus.BOOKED ? randomInt(150, 1200) : undefined
      };
      generatedSessions.push(session);
      lead.telequote_session = session;
    }

    generatedLeads.push(lead);
  }

  // Save to local storage
  localStorage.setItem(LEADS_KEY, JSON.stringify(generatedLeads));
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(generatedAppointments));
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(generatedSessions));

  return generatedLeads;
};


const getLocal = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setLocal = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Returns all potential time slots for a business day (08:00 - 17:00).
 */
export const getAllPotentialSlots = (): string[] => {
  const slots: string[] = [];
  const start = 8;
  const end = 17;
  for (let i = start; i < end; i++) {
    slots.push(`${String(i).padStart(2, '0')}:00`);
  }
  return slots;
};

export const getLeads = async (): Promise<Lead[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('leads').select('*, telequote_sessions(*)').order('createdAt', { ascending: false });
    if (!error && data) return data as Lead[];
  }
  
  let leads = getLocal<Lead>(LEADS_KEY);
  
  // Synthetic Data Injection if empty
  if (leads.length === 0) {
    leads = generateSyntheticData();
  }

  const sessions = getLocal<TeleQuoteSession>(SESSIONS_KEY);
  
  return leads.map(l => ({
    ...l,
    telequote_session: sessions.find(s => s.leadId === l.id)
  }));
};

export const getSessionById = async (sessionId: string): Promise<{ session: TeleQuoteSession, lead: Lead, appointment?: Appointment } | null> => {
  const leads = await getLeads();
  const appointments = await getAppointments();
  
  // Find the lead that contains this session (since we mapped it in getLeads)
  const lead = leads.find(l => l.telequote_session?.id === sessionId);
  
  if (!lead || !lead.telequote_session) return null;

  const appointment = appointments.find(a => a.leadId === lead.id);

  return {
    session: lead.telequote_session,
    lead: lead,
    appointment
  };
};

export const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'status' | 'statusHistory'>): Promise<Lead> => {
  const timestamp = Date.now();
  const leadObj = {
    ...leadData,
    createdAt: timestamp,
    status: LeadStatus.NEW,
    statusHistory: [{ from: null, to: LeadStatus.NEW, timestamp: timestamp }]
  };

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('leads').insert([leadObj]).select().single();
    if (!error && data) return data as Lead;
  }

  const newLead: Lead = { ...leadObj, id: generateId() };
  const leads = getLocal<Lead>(LEADS_KEY);
  leads.unshift(newLead);
  setLocal(LEADS_KEY, leads);

  // If it's a TeleQuote, create a session
  if (leadData.platform_preference) {
    const session: TeleQuoteSession = {
      id: generateId(),
      leadId: newLead.id,
      sessionCode: generateId().toUpperCase(), // Generate a short code
      platform: leadData.platform_preference as any,
      status: 'SCHEDULED',
      meetingLink: leadData.platform_preference === 'whatsapp' 
        ? `https://wa.me/${leadData.phone.replace(/\D/g, '')}` 
        : `https://meet.google.com/rvive-${generateId()}`
    };
    const sessions = getLocal<TeleQuoteSession>(SESSIONS_KEY);
    sessions.push(session);
    setLocal(SESSIONS_KEY, sessions);
    // Attach to returned object for immediate UI use
    newLead.telequote_session = session;
  }

  return newLead;
};

export const updateTeleQuoteSession = async (sessionId: string, updates: Partial<TeleQuoteSession>): Promise<TeleQuoteSession> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('telequote_sessions').update(updates).eq('id', sessionId).select().single();
    if (error) throw error;
    return data as TeleQuoteSession;
  }
  const sessions = getLocal<TeleQuoteSession>(SESSIONS_KEY);
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) throw new Error('Session not found');
  sessions[index] = { ...sessions[index], ...updates };
  setLocal(SESSIONS_KEY, sessions);
  return sessions[index];
};

export const getAppointments = async (): Promise<Appointment[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data } = await supabase.from('appointments').select('*').order('date', { ascending: true });
    if (data) return data as Appointment[];
  }
  return getLocal<Appointment>(APPOINTMENTS_KEY).sort((a, b) => a.date.localeCompare(b.date));
};

export const getAvailableSlots = async (date: string): Promise<string[]> => {
  const slots = getAllPotentialSlots();

  let appointments: Appointment[] = [];
  if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.from('appointments').select('timeSlot, status').eq('date', date).neq('status', 'CANCELLED');
      if (data) appointments = data as any;
  } else {
      appointments = getLocal<Appointment>(APPOINTMENTS_KEY).filter(a => a.date === date && a.status !== 'CANCELLED');
  }
  const takenSlots = appointments.map(a => a.timeSlot);
  return slots.filter(slot => !takenSlots.includes(slot));
};

export const bookAppointment = async (appointmentData: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> => {
  const appointmentObj = { ...appointmentData, status: 'CONFIRMED' };
  if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('appointments').insert([appointmentObj]).select().single();
      if (error) throw error;
      return data as Appointment;
  }
  const newAppointment: Appointment = { ...appointmentObj, id: generateId() } as Appointment;
  const apps = getLocal<Appointment>(APPOINTMENTS_KEY);
  apps.push(newAppointment);
  setLocal(APPOINTMENTS_KEY, apps);
  return newAppointment;
};

export const getStats = async () => {
    const leads = await getLeads();
    const appointments = await getAppointments();
    return {
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === LeadStatus.NEW).length,
        upcomingJobs: appointments.filter(a => new Date(a.date) >= new Date() && a.status === 'CONFIRMED').length
    };
};

export const getTasks = async (): Promise<Task[]> => { return getLocal('revive_tasks'); };
export const getCampaigns = async (): Promise<Campaign[]> => { return getLocal('revive_campaigns'); };

/**
 * Updates an existing lead record.
 */
export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Lead;
  }
  const leads = getLocal<Lead>(LEADS_KEY);
  const index = leads.findIndex(l => l.id === id);
  if (index === -1) throw new Error('Lead not found');
  leads[index] = { ...leads[index], ...updates };
  setLocal(LEADS_KEY, leads);
  return leads[index];
};

/**
 * Updates multiple leads status at once.
 */
export const bulkUpdateLeadStatus = async (ids: string[], status: LeadStatus): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('leads').update({ status }).in('id', ids);
    if (error) throw error;
    return;
  }
  const leads = getLocal<Lead>(LEADS_KEY);
  const updatedLeads = leads.map(l => ids.includes(l.id) ? { ...l, status } : l);
  setLocal(LEADS_KEY, updatedLeads);
};

/**
 * Task management functions.
 */
export const addTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  const newTask: Task = { ...task, id: generateId(), createdAt: Date.now() };
  const tasks = getLocal<Task>('revive_tasks');
  tasks.unshift(newTask);
  setLocal('revive_tasks', tasks);
  return newTask;
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const tasks = getLocal<Task>('revive_tasks');
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) throw new Error('Task not found');
  tasks[index] = { ...tasks[index], ...updates };
  setLocal('revive_tasks', tasks);
  return tasks[index];
};

export const deleteTask = async (id: string): Promise<void> => {
  const tasks = getLocal<Task>('revive_tasks');
  const filtered = tasks.filter(t => t.id !== id);
  setLocal('revive_tasks', filtered);
};

/**
 * Appointment management functions.
 */
export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<Appointment> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Appointment;
  }
  const apps = getLocal<Appointment>(APPOINTMENTS_KEY);
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) throw new Error('Appointment not found');
  apps[index] = { ...apps[index], ...updates };
  setLocal(APPOINTMENTS_KEY, apps);
  return apps[index];
};

export const deleteAppointment = async (id: string): Promise<void> => {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const apps = getLocal<Appointment>(APPOINTMENTS_KEY);
  const filtered = apps.filter(a => a.id !== id);
  setLocal(APPOINTMENTS_KEY, filtered);
};
