/**
 * Customer Portal Service
 * Handles API calls for customer authentication and profile management
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

// Customer type definition
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

// Register request type
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  mobile?: string;
  email?: string;
  address?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  password: string;
}

// Login request type
export interface LoginRequest {
  identifier: string; // mobile or email
  password: string;
}

// Update profile request type
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  mobile?: string;
  email?: string;
  address?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
}

// API response type
export interface CustomerAuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  customer?: Customer;
  error?: string;
}

// Profile response type
export interface ProfileResponse {
  success: boolean;
  customer?: Customer;
  error?: string;
}

/**
 * Get authentication headers from localStorage
 */
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('revive_customer_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Check response content type before parsing JSON
 */
async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    // Try to get error message from JSON
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.error || 'Request failed');
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error('Expected JSON response');
  }

  return response.json();
}

/**
 * Register a new customer account
 */
export const registerCustomer = async (data: RegisterRequest): Promise<CustomerAuthResponse> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await parseResponse(response);

    // Store token and customer data in localStorage
    if (result.success && result.token) {
      localStorage.setItem('revive_customer_token', result.token);
      localStorage.setItem('revive_customer_user', JSON.stringify(result.customer));
    }

    return result;
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
};

/**
 * Login customer
 */
export const loginCustomer = async (data: LoginRequest): Promise<CustomerAuthResponse> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await parseResponse(response);

    // Store token and customer data in localStorage
    if (result.success && result.token) {
      localStorage.setItem('revive_customer_token', result.token);
      localStorage.setItem('revive_customer_user', JSON.stringify(result.customer));
    }

    return result;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    };
  }
};

/**
 * Get customer profile
 */
export const getCustomerProfile = async (): Promise<ProfileResponse> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/profile`, {
      headers: getAuthHeader()
    });

    const result = await parseResponse(response);

    // Update localStorage with fresh data
    if (result.success && result.customer) {
      localStorage.setItem('revive_customer_user', JSON.stringify(result.customer));
    }

    return result;
  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile'
    };
  }
};

/**
 * Update customer profile
 */
export const updateCustomerProfile = async (data: UpdateProfileRequest): Promise<ProfileResponse> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/profile`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });

    const result = await parseResponse(response);

    // Update localStorage with fresh data
    if (result.success && result.customer) {
      localStorage.setItem('revive_customer_user', JSON.stringify(result.customer));
    }

    return result;
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile'
    };
  }
};

/**
 * Change customer password
 */
export const changeCustomerPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/change-password`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const result = await parseResponse(response);
    return result;
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password'
    };
  }
};

/**
 * Logout customer (clears localStorage)
 */
export const logoutCustomer = (): void => {
  localStorage.removeItem('revive_customer_token');
  localStorage.removeItem('revive_customer_user');
};

/**
 * Get customer from localStorage
 */
export const getStoredCustomer = (): Customer | null => {
  const userStr = localStorage.getItem('revive_customer_user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Get token from localStorage
 */
export const getStoredToken = (): string | null => {
  return localStorage.getItem('revive_customer_token');
};

/**
 * Check if customer is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getStoredToken();
  const customer = getStoredCustomer();
  return !!(token && customer);
};

/**
 * Validate token format (basic check)
 */
export const isTokenValid = (): boolean => {
  const token = getStoredToken();
  if (!token) return false;

  try {
    // Basic JWT format check (header.payload.signature)
    const parts = token.split('.');
    return parts.length === 3;
  } catch {
    return false;
  }
};

/**
 * Document-related types and functions
 */

export interface CustomerDocument {
  documentId: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedAt: string;
}

export interface UploadDocumentResponse {
  success: boolean;
  message?: string;
  document?: CustomerDocument;
  error?: string;
}

export interface ListDocumentsResponse {
  success: boolean;
  documents?: CustomerDocument[];
  error?: string;
}

/**
 * Upload a document
 */
export const uploadDocument = async (
  file: File,
  description?: string
): Promise<UploadDocumentResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch(`${API_BASE}/api/customer/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getStoredToken()}`
      },
      body: formData
    });

    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      if (contentType.includes('application/json')) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!contentType.includes('application/json')) {
      throw new Error('Expected JSON response');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload document error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * List all documents
 */
export const listDocuments = async (): Promise<ListDocumentsResponse> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/documents`, {
      headers: getAuthHeader()
    });

    const result = await parseResponse(response);
    return result;
  } catch (error) {
    console.error('List documents error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch documents'
    };
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (
  documentId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/documents/${documentId}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });

    const result = await parseResponse(response);
    return result;
  } catch (error) {
    console.error('Delete document error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete document'
    };
  }
};

/**
 * Get download URL for a document
 */
export const getDocumentDownloadUrl = (documentId: string): string => {
  return `${API_BASE}/api/customer/documents/${documentId}`;
};

/**
 * Quote-related types and functions
 */

export interface CustomerQuote {
  id: string;
  leadId: string;
  amount: number;
  status: string;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  issuedDate?: string;
  expiryDate?: string;
  approvedAt?: string;
  rejectedAt?: string;
  canApprove: boolean;
  canReject: boolean;
  isExpired: boolean;
  lead?: {
    firstName: string;
    lastName: string;
    address: string;
    suburb: string;
  };
}

export interface QuoteDetails extends CustomerQuote {
  lead?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    suburb?: string;
    postcode?: string;
    serviceInterest?: string;
  };
}

export interface ListQuotesResponse {
  success: boolean;
  quotes?: CustomerQuote[];
  error?: string;
}

export interface QuoteDetailsResponse {
  success: boolean;
  quote?: QuoteDetails;
  error?: string;
}

/**
 * List all quotes
 */
export const listQuotes = async (): Promise<ListQuotesResponse> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/quotes`, {
      headers: getAuthHeader()
    });

    const result = await parseResponse(response);
    return result;
  } catch (error) {
    console.error('List quotes error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch quotes'
    };
  }
};

/**
 * Get quote details
 */
export const getQuoteDetails = async (quoteId: string): Promise<QuoteDetailsResponse> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/quotes/${quoteId}`, {
      headers: getAuthHeader()
    });

    const result = await parseResponse(response);
    return result;
  } catch (error) {
    console.error('Get quote details error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch quote details'
    };
  }
};

/**
 * Approve a quote
 */
export const approveQuote = async (
  quoteId: string,
  reason?: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/quotes/${quoteId}/approve`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ reason })
    });

    const result = await parseResponse(response);
    return result;
  } catch (error) {
    console.error('Approve quote error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve quote'
    };
  }
};

/**
 * Reject a quote
 */
export const rejectQuote = async (
  quoteId: string,
  reason?: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/api/customer/quotes/${quoteId}/reject`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ reason })
    });

    const result = await parseResponse(response);
    return result;
  } catch (error) {
    console.error('Reject quote error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject quote'
    };
  }
};
