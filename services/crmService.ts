
import { Lead, Appointment, LeadStatus, ServiceType, Campaign, Task, AppointmentType, TeleQuoteSession } from '../types';

const API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:3001';

const getAuthHeader = () => {
  const token = localStorage.getItem('revive_admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const mapLead = (dbLead: any): Lead => ({
  id: dbLead.id,
  firstName: dbLead.first_name,
  lastName: dbLead.last_name,
  email: dbLead.email,
  phone: dbLead.phone,
  address: dbLead.address,
  serviceInterest: dbLead.service_interest as ServiceType,
  notes: dbLead.notes,
  status: dbLead.status as LeadStatus,
  createdAt: Number(dbLead.created_at),
  statusHistory: dbLead.status_history,
  platform_preference: dbLead.platform_preference
});

const mapAppointment = (dbApp: any): Appointment => ({
  id: dbApp.id,
  leadId: dbApp.lead_id,
  serviceType: dbApp.service_type as ServiceType,
  type: dbApp.type as AppointmentType,
  date: dbApp.date,
  timeSlot: dbApp.time_slot,
  notes: dbApp.notes,
  status: dbApp.status,
  createdAt: Number(dbApp.created_at)
});

const mapTask = (dbTask: any): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  leadId: dbTask.lead_id,
  dueDate: dbTask.due_date,
  completed: dbTask.completed,
  createdAt: Number(dbTask.created_at)
});

export const getLeads = async (): Promise<Lead[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/crm/leads`, {
      headers: getAuthHeader()
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) return [];
    const data = await response.json();
    return data.map(mapLead);
  } catch {
    return [];
  }
};

export const getAppointments = async (): Promise<Appointment[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/crm/appointments`, {
      headers: getAuthHeader()
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) return [];
    const data = await response.json();
    return data.map(mapAppointment);
  } catch {
    return [];
  }
};

export const getTasks = async (): Promise<Task[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/crm/tasks`, {
      headers: getAuthHeader()
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) return [];
    const data = await response.json();
    return data.map(mapTask);
  } catch {
    return [];
  }
};

export const updateLead = async (id: string, updates: Partial<Lead>): Promise<Lead> => {
  // Map camelCase to snake_case for DB
  const dbUpdates: any = {};
  if (updates.firstName) dbUpdates.first_name = updates.firstName;
  if (updates.lastName) dbUpdates.last_name = updates.lastName;
  if (updates.status) dbUpdates.status = updates.status;
  if (updates.notes) dbUpdates.notes = updates.notes;

  try {
    const response = await fetch(`${API_BASE}/api/crm/leads/${id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dbUpdates)
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) throw new Error('API unavailable');
    const data = await response.json();
    return mapLead(data);
  } catch (e) {
    throw new Error('Failed to update lead');
  }
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
  try {
    const response = await fetch(`${API_BASE}/api/crm/tasks`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: task.title,
        leadId: task.leadId,
        dueDate: task.dueDate,
        completed: task.completed
      })
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) throw new Error('API unavailable');
    const data = await response.json();
    return mapTask(data);
  } catch (e) {
    throw new Error('Failed to add task');
  }
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  try {
    const response = await fetch(`${API_BASE}/api/crm/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) throw new Error('API unavailable');
    const data = await response.json();
    return mapTask(data);
  } catch (e) {
    throw new Error('Failed to update task');
  }
};

export const deleteTask = async (id: string): Promise<void> => {
  await fetch(`${API_BASE}/api/crm/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
};

export const getStats = async () => {
  const [leads, appointments] = await Promise.all([getLeads(), getAppointments()]);
  return {
    totalLeads: leads.length,
    newLeads: leads.filter(l => l.status === LeadStatus.NEW).length,
    upcomingJobs: appointments.filter(a => new Date(a.date) >= new Date() && a.status === 'CONFIRMED').length
  };
};

// Placeholder for remaining types to keep compatibility
export const getCampaigns = async (): Promise<Campaign[]> => [];
export const getSessionById = async (id: string) => null;
export const updateTeleQuoteSession = async (id: string, updates: any) => ({});
export const getAvailableSlots = async (date: string) => [];
export const bookAppointment = async (data: any) => ({});
export const bulkUpdateLeadStatus = async (ids: string[], status: any) => {};
export const updateAppointment = async (id: string, updates: any) => ({});
export const deleteAppointment = async (id: string) => {};
