
export enum ServiceType {
  PRESSURE_WASHING = 'Pressure Washing',
  GARDEN_MAINTENANCE = 'Garden Maintenance',
  LAWN_MOWING = 'Lawn Mowing',
  POOL_MAINTENANCE = 'Pool Maintenance',
  RUBBISH_REMOVAL = 'Rubbish Removal & Declutter',
  RE_GROUTING = 'Re-grouting',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  BOOKED = 'BOOKED',
  ARCHIVED = 'ARCHIVED',
}

export type AppointmentType = 'QUOTE' | 'JOB';

export interface StatusChange {
  from: LeadStatus | null;
  to: LeadStatus;
  timestamp: number;
}

export interface TeleQuoteSession {
  id: string;
  leadId: string;
  sessionCode?: string; // For friendly URL access
  platform: 'whatsapp' | 'google_meet' | 'zoom' | 'teams' | 'messenger';
  meetingLink?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  recordingUrl?: string;
  notes?: string;
  finalEstimate?: number;
  completedAt?: number;
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  serviceInterest: ServiceType;
  notes: string;
  status: LeadStatus;
  createdAt: number;
  statusHistory?: StatusChange[];
  media_attachments?: string[];
  platform_preference?: string;
  telequote_session?: TeleQuoteSession;
}

export interface Appointment {
  id: string;
  leadId: string;
  serviceType: ServiceType;
  type: AppointmentType;
  date: string;
  timeSlot: string;
  notes?: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  leadId?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS';
  status: 'DRAFT' | 'SENT';
  audienceCount: number;
  lastSent?: number;
}

export enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export interface Quote {
  id: string;
  leadId: string;
  amount: number;
  status: QuoteStatus;
  validUntil?: string;
  notes?: string;
  createdAt?: string;
  lead?: Lead;
}