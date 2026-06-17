import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Loader2, Mail, Trash2, ShieldCheck } from 'lucide-react';
import { useTenantAuth } from '../../contexts/TenantAuthContext';

const PLATFORM_API_BASE = import.meta.env.PROD
  ? 'https://revivepropertyco.au'
  : 'http://localhost:8080';

interface Member {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  lastLoginAt: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

const PlatformTeamPage: React.FC = () => {
  const { user, token, isAuthenticated, loading } = useTenantAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  const loadData = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    setError(null);
    try {
      const [teamRes, invRes] = await Promise.all([
        fetch(`${PLATFORM_API_BASE}/api/platform/team`, { headers: authHeaders() }),
        fetch(`${PLATFORM_API_BASE}/api/invitations`, { headers: authHeaders() })
      ]);
      const teamData = await teamRes.json();
      const invData = await invRes.json();

      if (teamData.success) setMembers(teamData.members);
      if (invData.success) setInvitations(invData.invitations);

      if (!teamData.success && !invData.success) {
        setError(teamData.error || invData.error || 'Failed to load team');
      }
    } catch (e) {
      setError('Network error while loading team.');
    } finally {
      setFetching(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${PLATFORM_API_BASE}/api/invitations/invite`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      if (data.success) {
        setNotice(`Invitation sent to ${inviteEmail}.`);
        setInviteEmail('');
        setInviteRole('member');
        loadData();
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (e) {
      setError('Network error while sending invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleCancel = async (id: string) => {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`${PLATFORM_API_BASE}/api/invitations/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setInvitations(prev => prev.filter(i => i.id !== id));
      } else {
        setError(data.error || 'Failed to cancel invitation');
      }
    } catch (e) {
      setError('Network error while cancelling invitation.');
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingInvitations = invitations.filter(i => !i.accepted_at);

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
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Team</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        {notice && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            {notice}
          </div>
        )}

        {/* Invite form */}
        {canManage && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Invite a team member</h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'admin' | 'member')}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              >
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4 mr-2" /> Invite</>}
              </button>
            </form>
          </div>
        )}

        {/* Members */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Members</h2>
          </div>
          {fetching ? (
            <div className="p-6 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : members.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No team members yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {members.map(m => (
                <li key={m.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {[m.firstName, m.lastName].filter(Boolean).join(' ') || m.email}
                    </p>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {m.role === 'owner' && <ShieldCheck className="h-4 w-4 text-blue-600" />}
                    <span className="text-xs font-medium capitalize px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {m.role}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pending invitations */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Pending invitations</h2>
          </div>
          {pendingInvitations.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No pending invitations.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingInvitations.map(inv => (
                <li key={inv.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.email}</p>
                    <p className="text-xs text-slate-500">
                      {inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleCancel(inv.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                      title="Cancel invitation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default PlatformTeamPage;
