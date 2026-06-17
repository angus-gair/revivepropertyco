import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft, Loader2 } from 'lucide-react';
import { useTenantAuth } from '../../contexts/TenantAuthContext';

const PLATFORM_API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:8080';

interface Module {
  name: string;
  label: string;
  description: string;
  active: boolean;
}

const PlatformModulesPage: React.FC = () => {
  const { user, token, isAuthenticated, loading } = useTenantAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState<Module[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role === 'owner' || user?.role === 'admin';

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/platform/login');
    }
  }, [loading, isAuthenticated, navigate]);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  const loadModules = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetch(`${PLATFORM_API_BASE}/api/modules`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setModules(data.modules);
      } else {
        setError(data.error || 'Failed to load modules');
      }
    } catch (e) {
      setError('Network error while loading modules.');
    } finally {
      setFetching(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (isAuthenticated) loadModules();
  }, [isAuthenticated, loadModules]);

  const toggle = async (mod: Module) => {
    if (!canManage) return;
    setSaving(mod.name);
    setError(null);
    const nextActive = !mod.active;
    // Optimistic update
    setModules(prev => prev.map(m => (m.name === mod.name ? { ...m, active: nextActive } : m)));
    try {
      const res = await fetch(`${PLATFORM_API_BASE}/api/modules/${mod.name}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ active: nextActive })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setModules(prev => prev.map(m => (m.name === mod.name ? { ...m, active: mod.active } : m)));
        setError(data.error || 'Failed to update module');
      }
    } catch (e) {
      setModules(prev => prev.map(m => (m.name === mod.name ? { ...m, active: mod.active } : m)));
      setError('Network error while updating module.');
    } finally {
      setSaving(null);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center space-x-4">
          <button
            onClick={() => navigate('/platform/dashboard')}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="p-2 bg-purple-100 rounded-lg">
            <Settings className="h-5 w-5 text-purple-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Modules</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        {!canManage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
            Only owners and admins can change module activation. You can view the current configuration below.
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {fetching ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {modules.map(mod => (
                <li key={mod.name} className="px-6 py-4 flex items-center justify-between">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-slate-900">{mod.label}</p>
                    <p className="text-xs text-slate-500">{mod.description}</p>
                  </div>
                  <button
                    onClick={() => toggle(mod)}
                    disabled={!canManage || saving === mod.name}
                    role="switch"
                    aria-checked={mod.active}
                    title={mod.active ? 'Disable module' : 'Enable module'}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
                      mod.active ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        mod.active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default PlatformModulesPage;
