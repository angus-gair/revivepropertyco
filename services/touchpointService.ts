const API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:3001';

export type TouchpointType = 'PAGE_VIEW' | 'CHAT_MESSAGE' | 'FORM_VIEW' | 'BOOKING' | 'EMAIL';

export interface Touchpoint {
  id: string;
  leadId?: string;
  type: TouchpointType;
  timestamp: number;
  metadata: Record<string, any>;
}

/**
 * Record a touchpoint in the system
 */
export const recordTouchpoint = async (type: TouchpointType, leadId?: string, metadata: Record<string, any> = {}): Promise<void> => {
  try {
    // If no lead ID, we can't store yet - will be associated later
    if (!leadId) {
      // Store in localStorage to associate with future lead
      const pendingTouchpoints = JSON.parse(localStorage.getItem('revive_pending_touchpoints') || '[]');
      pendingTouchpoints.push({
        type,
        timestamp: Date.now(),
        metadata
      });
      localStorage.setItem('revive_pending_touchpoints', JSON.stringify(pendingTouchpoints));
      return;
    }

    await fetch(`${API_BASE}/api/touchpoints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('revive_auth_token') || ''}`
      },
      body: JSON.stringify({
        leadId,
        type,
        timestamp: Date.now(),
        metadata
      })
    });
  } catch (error) {
    console.error('Failed to record touchpoint:', error);
  }
};

/**
 * Record a page view
 */
export const recordPageView = async (page: string) => {
  await recordTouchpoint('PAGE_VIEW', undefined, { page });
};

/**
 * Record a form view
 */
export const recordFormView = async (formType: string) => {
  await recordTouchpoint('FORM_VIEW', undefined, { formType });
};

/**
 * Record a booking action
 */
export const recordBooking = async (leadId: string, details: Record<string, any>) => {
  await recordTouchpoint('BOOKING', leadId, details);
};

/**
 * Associate pending touchpoints with a lead after booking
 */
export const associateTouchpoints = async (leadId: string) => {
  const pendingTouchpoints = JSON.parse(localStorage.getItem('revive_pending_touchpoints') || '[]');

  if (pendingTouchpoints.length === 0) return;

  for (const touchpoint of pendingTouchpoints) {
    await fetch(`${API_BASE}/api/touchpoints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('revive_auth_token') || ''}`
      },
      body: JSON.stringify({
        leadId,
        ...touchpoint
      })
    });
  }

  localStorage.removeItem('revive_pending_touchpoints');
};
