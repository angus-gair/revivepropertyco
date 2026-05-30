
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
  customerId?: string;
  issuedDate?: string;
  expiryDate?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

/**
 * Customer Portal Types
 */

export interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  mobile?: string;
  email?: string;
  address?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface CustomerDocument {
  documentId: string;
  customerId: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedAt: string;
}

export interface CustomerQuote extends Quote {
  canApprove: boolean;
  canReject: boolean;
  isExpired: boolean;
  lineItems?: QuoteLineItem[];
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuoteApproval {
  approvalId: string;
  quoteId: string;
  customerId: string;
  action: 'APPROVED' | 'REJECTED';
  reason?: string;
  actionedAt: string;
  actionedIp?: string;
}

export enum CustomerAuditAction {
  REGISTER = 'REGISTER',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_DELETE = 'DOCUMENT_DELETE',
  QUOTE_APPROVE = 'QUOTE_APPROVE',
  QUOTE_REJECT = 'QUOTE_REJECT',
}

/**
 * Platform / Multi-Tenant Types
 */

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'free_trial' | 'growth' | 'enterprise';
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL_EXPIRED';
  createdAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  firstName?: string;
  lastName?: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  lastLoginAt?: string;
  createdAt: string;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'admin' | 'member';
  invitedBy: string;
  token: string;
  acceptedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export interface TenantModule {
  name: string;
  version: string;
  description: string;
  routePrefix: string;
  dependencies: string[];
  active: boolean;
  activatedAt?: string;
}

export interface TenantAuthState {
  user: TenantUser | null;
  tenant: Tenant | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * hipages Scraper Types
 */

export enum HipagesLeadStatus {
  AVAILABLE = 'AVAILABLE',
  FIRST_TO_ACCEPT = 'FIRST_TO_ACCEPT',
  WAITLIST = 'WAITLIST',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED'
}

export interface HipagesLead {
  id: string; // lead_id (UUID)
  hipagesId: string; // hipages_id (unique identifier from hipages)
  customerName: string;
  suburb: string;
  postcode?: string;
  jobType: string;
  jobSubtype?: string;
  description?: string;
  credits: number;
  status: HipagesLeadStatus;
  contactStatus?: string;
  postedDate?: Date | string;
  scrapedAt: number | Date;
  syncedToCrm: boolean;
  crmLeadId?: string; // Link to main leads table
  rawData?: any; // Full hipages response for audit
}

/**
 * Twenty CRM Integration Types
 */

export interface TwentyWorkspace {
  id: string;
  tenantId: string; // Link to platform tenant
  name: string;
  slug: string;
  serverUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface TwentyServiceJob {
  id: string;
  name: string;
  description?: string;
  status: 'NEW' | 'CONTACTED' | 'BOOKED' | 'ARCHIVED';
  personId?: string; // Link to Twenty Person
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  // Custom fields (metadata stored in Twenty)
  serviceType?: string;
  address?: string;
  originalLeadId?: string;
}

export interface TwentyPerson {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TwentyQuote {
  id: string;
  name: string;
  serviceJobId?: string; // Link to TwentyServiceJob
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  totalAmount: number;
  expiryDate?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: TwentyQuoteLineItem[];
}

export interface TwentyQuoteLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TwentyHipagesLead extends TwentyServiceJob {
  sourceUrl?: string;
  postedDate?: string;
  scrapedAt?: string;
  hipagesStatus?: string;
  credits?: number;
}

export interface TwentyWebhookEvent {
  event: string; // e.g., 'person.created', 'serviceJob.updated'
  data: any;
  timestamp: string;
  workspaceId?: string;
}

export interface TenantTwentyToken {
  id: string;
  tenantId: string;
  workspaceId: string;
  tokenType: 'API' | 'WEBHOOK';
  encryptedToken: string;
  tokenLabel?: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface HpBusiness {
  id: string;
  hipages_profile_id: string | null;
  business_name: string;
  slug: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  primary_trade: string | null;
  trade_categories: string[] | null;
  rating: number | null;
  review_count: number;
  job_count: number;
  response_rate: string | null;
  years_on_hipages: number | null;
  profile_url: string | null;
  phone: string | null;
  website: string | null;
  verified: boolean;
  badge_level: string | null;
  description: string | null;
  service_areas: string[] | null;
  images_count: number;
  lead_status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'ARCHIVED';
  scraped_at: string;
  last_updated: string;
  raw_data: any | null;
  created_at: string;
}
