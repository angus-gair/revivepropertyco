import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTenantAuth } from '../contexts/TenantAuthContext';

/**
 * PlatformProtectedRoute - Guards platform routes using TenantAuthContext
 * Ensures only authenticated platform users can access protected pages
 * (CR-02 fix)
 */
const PlatformProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useTenantAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/platform/login" replace />;
  }

  return <>{children}</>;
};

export default PlatformProtectedRoute;
