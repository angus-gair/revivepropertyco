import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, TenantUser, TenantAuthState } from '../types';

interface TenantAuthContextType {
  user: TenantUser | null;
  tenant: Tenant | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; user?: TenantUser; tenant?: Tenant }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

interface RegisterData {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerPassword: string;
  firstName: string;
  lastName: string;
}

const TenantAuthContext = createContext<TenantAuthContextType | undefined>(undefined);

const PLATFORM_API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:8080';

export const useTenantAuth = () => {
  const context = useContext(TenantAuthContext);
  if (context === undefined) {
    throw new Error('useTenantAuth must be used within a TenantAuthProvider');
  }
  return context;
};

export const TenantAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TenantUser | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('revive_platform_token');
        const storedUser = localStorage.getItem('revive_platform_user');
        const storedTenant = localStorage.getItem('revive_platform_tenant');

        if (storedToken && storedUser && storedTenant) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setTenant(JSON.parse(storedTenant));
        }
      } catch (error) {
        console.error('Failed to initialize tenant auth:', error);
        // Clear corrupted data
        localStorage.removeItem('revive_platform_token');
        localStorage.removeItem('revive_platform_user');
        localStorage.removeItem('revive_platform_tenant');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const response = await fetch(`${PLATFORM_API_BASE}/api/auth/platform/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success && data.token && data.user && data.tenant) {
        setToken(data.token);
        setUser(data.user);
        setTenant(data.tenant);

        localStorage.setItem('revive_platform_token', data.token);
        localStorage.setItem('revive_platform_user', JSON.stringify(data.user));
        localStorage.setItem('revive_platform_tenant', JSON.stringify(data.tenant));

        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string; user?: TenantUser; tenant?: Tenant }> => {
    setLoading(true);
    try {
      const response = await fetch(`${PLATFORM_API_BASE}/api/platform/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success && result.token && result.user && result.tenant) {
        setToken(result.token);
        setUser(result.user);
        setTenant(result.tenant);

        localStorage.setItem('revive_platform_token', result.token);
        localStorage.setItem('revive_platform_user', JSON.stringify(result.user));
        localStorage.setItem('revive_platform_tenant', JSON.stringify(result.tenant));

        return { success: true, user: result.user, tenant: result.tenant };
      }

      return { success: false, error: result.error || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setTenant(null);
    localStorage.removeItem('revive_platform_token');
    localStorage.removeItem('revive_platform_user');
    localStorage.removeItem('revive_platform_tenant');
  };

  const refreshAuth = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${PLATFORM_API_BASE}/api/auth/platform/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success && data.valid && data.user && data.tenant) {
        setUser(data.user);
        setTenant(data.tenant);
      } else {
        // Token invalid, clear auth
        logout();
      }
    } catch (error) {
      console.error('Refresh auth error:', error);
      // Don't clear on network error, might be temporary
    }
  };

  const value: TenantAuthContextType = {
    user,
    tenant,
    token,
    loading,
    isAuthenticated: !!(user && tenant && token),
    login,
    register,
    logout,
    refreshAuth
  };

  return (
    <TenantAuthContext.Provider value={value}>
      {children}
    </TenantAuthContext.Provider>
  );
};
