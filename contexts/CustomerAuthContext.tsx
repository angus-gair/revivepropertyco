/**
 * Customer Authentication Context
 * Manages customer authentication state for the customer portal
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, loginCustomer, logoutCustomer, getStoredCustomer, getStoredToken, isAuthenticated as checkAuth } from '../services/customerService';

interface CustomerAuthContextType {
  customer: Customer | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedCustomer = getStoredCustomer();
        const storedToken = getStoredToken();

        if (storedCustomer && storedToken) {
          setCustomer(storedCustomer);
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear corrupted data
        logoutCustomer();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (identifier: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await loginCustomer({ identifier, password });

      if (response.success && response.token && response.customer) {
        setCustomer(response.customer);
        setToken(response.token);

        // If remember me is not checked, token will expire after 7 days (default)
        // If remember me is checked, we could extend this to 30 days (future enhancement)

        return { success: true };
      }

      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success && result.token && result.customer) {
        setCustomer(result.customer);
        setToken(result.token);

        // Store in localStorage
        localStorage.setItem('revive_customer_token', result.token);
        localStorage.setItem('revive_customer_user', JSON.stringify(result.customer));

        return { success: true };
      }

      return { success: false, error: result.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutCustomer();
    setCustomer(null);
    setToken(null);
  };

  const refreshCustomer = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/customer/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.customer) {
          setCustomer(result.customer);
          localStorage.setItem('revive_customer_user', JSON.stringify(result.customer));
        }
      }
    } catch (error) {
      console.error('Failed to refresh customer data:', error);
    }
  };

  const value: CustomerAuthContextType = {
    customer,
    token,
    loading,
    isAuthenticated: !!(customer && token),
    login,
    register,
    logout,
    refreshCustomer
  };

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
