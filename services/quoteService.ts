import { Quote, QuoteStatus } from '../types';

const API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:3001';

/**
 * Get all quotes
 */
export const getQuotes = async (): Promise<Quote[]> => {
  const token = localStorage.getItem('revive_auth_token');

  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE}/api/quotes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch quotes:', response.status);
      return [];
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      return [];
    }

    const data = await response.json();
    return data.quotes || [];
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
};

/**
 * Create a new quote
 */
export const createQuote = async (quote: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote | null> => {
  const token = localStorage.getItem('revive_auth_token');

  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(quote)
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create quote');
      }
      throw new Error('Failed to create quote');
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Invalid response type');
    }

    const data = await response.json();
    return data.quote;
  } catch (error) {
    console.error('Error creating quote:', error);
    return null;
  }
};

/**
 * Update a quote
 */
export const updateQuote = async (id: string, updates: Partial<Quote>): Promise<Quote | null> => {
  const token = localStorage.getItem('revive_auth_token');

  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/api/quotes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update quote');
      }
      throw new Error('Failed to update quote');
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Invalid response type');
    }

    const data = await response.json();
    return data.quote;
  } catch (error) {
    console.error('Error updating quote:', error);
    return null;
  }
};

/**
 * Delete a quote
 */
export const deleteQuote = async (id: string): Promise<boolean> => {
  const token = localStorage.getItem('revive_auth_token');

  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE}/api/quotes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting quote:', error);
    return false;
  }
};

/**
 * Update quote status
 */
export const updateQuoteStatus = async (id: string, status: QuoteStatus): Promise<boolean> => {
  return updateQuote(id, { status });
};
