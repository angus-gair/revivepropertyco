import { HipagesLead, HipagesLeadStatus } from '../types';

const API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:3001';

const getAuthHeader = () => {
  const token = localStorage.getItem('revive_admin_token') || localStorage.getItem('revive_platform_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Map database row (snake_case) to TypeScript interface (camelCase)
 */
const mapHipagesLead = (dbLead: any): HipagesLead => ({
  id: dbLead.lead_id,
  hipagesId: dbLead.hipages_id,
  customerName: dbLead.customer_name,
  suburb: dbLead.suburb,
  postcode: dbLead.postcode,
  jobType: dbLead.job_type,
  jobSubtype: dbLead.job_subtype,
  description: dbLead.description,
  credits: dbLead.credits,
  status: dbLead.status as HipagesLeadStatus,
  contactStatus: dbLead.contact_status,
  postedDate: dbLead.posted_date,
  scrapedAt: Number(dbLead.scraped_at),
  syncedToCrm: dbLead.synced_to_crm,
  crmLeadId: dbLead.crm_lead_id,
  rawData: dbLead.raw_data
});

/**
 * Get hipages leads with optional filters
 */
export const getHipagesLeads = async (
  filters?: {
    status?: string;
    syncedToCrm?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<HipagesLead[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.syncedToCrm !== undefined) params.append('synced_to_crm', String(filters.syncedToCrm));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const response = await fetch(`${API_BASE}/api/hipages/noauth/leads${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) return [];

    const data = await response.json();
    return data.data.map(mapHipagesLead);
  } catch {
    return [];
  }
};

/**
 * Get single hipages lead by ID
 */
export const getHipagesLead = async (id: string): Promise<HipagesLead | null> => {
  try {
    const response = await fetch(`${API_BASE}/api/hipages/leads/${id}`, {
      headers: getAuthHeader()
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) return null;

    const data = await response.json();
    return mapHipagesLead(data.data);
  } catch {
    return null;
  }
};

/**
 * Accept hipages lead (convert to CRM lead)
 */
export const acceptHipagesLead = async (
  id: string
): Promise<{ hipagesLeadId: string; crmLeadId: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/hipages/leads/${id}/accept`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      throw new Error('API unavailable');
    }

    const data = await response.json();
    return data.data;
  } catch (e) {
    throw new Error('Failed to accept hipages lead');
  }
};

/**
 * Trigger manual scrape
 */
export const triggerScrape = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/hipages/scrape/trigger`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      throw new Error('API unavailable');
    }

    const data = await response.json();
    return { success: data.success, message: data.message };
  } catch (e) {
    throw new Error('Failed to trigger scrape');
  }
};
