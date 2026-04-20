import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Settings, LogOut, Loader2 } from 'lucide-react';
import { useTenantAuth } from '../../contexts/TenantAuthContext';

const PlatformDashboard: React.FC = () => {
  const { user, tenant, isAuthenticated, loading, logout } = useTenantAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/platform/login');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !tenant) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/platform/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{tenant.name}</h1>
                <p className="text-sm text-slate-500">{tenant.slug}.reviveplatform.com</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome to your platform dashboard
          </h2>
          <p className="text-slate-600">
            Manage your team, configure modules, and customize your workspace.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Tenant Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Tenant Details</h3>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Plan</dt>
                <dd className="font-medium capitalize text-slate-900">{tenant.plan}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd className="font-medium capitalize text-slate-900">{tenant.status.toLowerCase()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd className="font-medium text-slate-900">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Team Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Team</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Invite team members and manage permissions.
            </p>
            <button
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => navigate('/platform/team')}
            >
              Manage Team
            </button>
          </div>

          {/* Module Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Modules</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Enable and configure platform modules.
            </p>
            <button
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              onClick={() => navigate('/platform/modules')}
            >
              Manage Modules
            </button>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Coming Soon:</strong> Team invitations, module activation, billing, and more features are under development.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PlatformDashboard;
