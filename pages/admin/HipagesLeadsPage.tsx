import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { usePageSEO } from '../hooks/usePageSEO';
import {
  RefreshCw, AlertCircle, CheckCircle2, Filter, Search, User, Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getHipagesLeads, acceptHipagesLead } from '../services/hipagesService';
import { HipagesLead, HipagesLeadStatus } from '../types';

const HipagesLeadsPage: React.FC = () => {
  usePageSEO({ title: 'hipages Leads', noindex: true });
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<HipagesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [syncedFilter, setSyncedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [selectedLead, setSelectedLead] = useState<HipagesLead | null>(null);
  const [acceptingLead, setAcceptingLead] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getHipagesLeads();
      setLeads(data);
    } catch (e) {
      console.error("Failed to load hipages leads", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      const matchesSynced = syncedFilter === 'ALL' ||
        (syncedFilter === 'SYNCED' && lead.syncedToCrm) ||
        (syncedFilter === 'NOT_SYNCED' && !lead.syncedToCrm);
      const matchesSearch = searchQuery === '' ||
        lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.suburb.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.jobType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSynced && matchesSearch;
    });
  }, [leads, statusFilter, syncedFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">hipages Leads</h1>
          {newLeadsCount > 0 && (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
              <Bell className="w-4 h-4" />
              {newLeadsCount} new leads
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Statuses</option>
              <option value={HipagesLeadStatus.AVAILABLE}>Available</option>
              <option value={HipagesLeadStatus.FIRST_TO_ACCEPT}>First to accept</option>
              <option value={HipagesLeadStatus.WAITLIST}>Waitlist</option>
              <option value={HipagesLeadStatus.ACCEPTED}>Accepted</option>
              <option value={HipagesLeadStatus.EXPIRED}>Expired</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={syncedFilter}
              onChange={(e) => setSyncedFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Sync Status</option>
              <option value="SYNCED">Synced to CRM</option>
              <option value="NOT_SYNCED">Not synced</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, suburb, or job type..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            onClick={loadData}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
              <span className="text-sm text-slate-500">Loading hipages leads...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No hipages leads available</h3>
            <p className="text-sm text-slate-500">
              Leads will appear here when the scraper finds new opportunities.
              Try adjusting filters or trigger a manual scrape.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && filteredLeads.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Job Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{lead.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-600">{lead.suburb}</div>
                      {lead.postcode && (
                        <div className="text-xs text-slate-400">{lead.postcode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{lead.jobType}</div>
                      {lead.jobSubtype && (
                        <div className="text-xs text-slate-500">{lead.jobSubtype}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-orange-600">{lead.credits}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        lead.status === HipagesLeadStatus.AVAILABLE
                          ? 'bg-green-100 text-green-800'
                          : lead.status === HipagesLeadStatus.FIRST_TO_ACCEPT
                          ? 'bg-orange-100 text-orange-800'
                          : lead.status === HipagesLeadStatus.WAITLIST
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {lead.status.toLowerCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {lead.syncedToCrm ? (
                        <button
                          onClick={() => navigate(`/admin/leads/${lead.crmLeadId}`)}
                          className="text-orange-600 hover:text-orange-900 font-medium"
                        >
                          View in CRM
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-orange-600 hover:text-orange-900 font-medium"
                        >
                          Accept Lead
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for lead details */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Lead Details</h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Customer Name</label>
                    <p className="mt-1 text-sm text-slate-900">{selectedLead.customerName}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Location</label>
                    <p className="mt-1 text-sm text-slate-900">
                      {selectedLead.suburb}
                      {selectedLead.postcode && ` ${selectedLead.postcode}`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Job Type</label>
                    <p className="mt-1 text-sm text-slate-900">{selectedLead.jobType}</p>
                    {selectedLead.jobSubtype && (
                      <p className="text-sm text-slate-600">{selectedLead.jobSubtype}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Credits</label>
                    <p className="mt-1 text-sm font-semibold text-orange-600">{selectedLead.credits}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedLead.status === HipagesLeadStatus.AVAILABLE
                        ? 'bg-green-100 text-green-800'
                        : selectedLead.status === HipagesLeadStatus.FIRST_TO_ACCEPT
                        ? 'bg-orange-100 text-orange-800'
                        : selectedLead.status === HipagesLeadStatus.WAITLIST
                        ? 'bg-pink-100 text-pink-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {selectedLead.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>

                  {selectedLead.description && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Description</label>
                      <p className="mt-1 text-sm text-slate-600">{selectedLead.description}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  {!selectedLead.syncedToCrm && (
                    <button
                      onClick={async () => {
                        if (!confirm(`Convert hipages lead from ${selectedLead.customerName} (${selectedLead.suburb}) to CRM lead?`)) {
                          return;
                        }

                        setAcceptingLead(selectedLead.id);
                        try {
                          const result = await acceptHipagesLead(selectedLead.id);
                          console.log('[Accept] Lead converted:', result);
                          // Update local state
                          setLeads(prev => prev.map(l =>
                            l.id === selectedLead.id
                              ? { ...l, syncedToCrm: true, crmLeadId: result.crmLeadId }
                              : l
                          ));
                          setSelectedLead(null);
                          alert('Lead converted successfully. View in CRM leads.');
                        } catch (e) {
                          console.error('[Accept] Failed to convert lead:', e);
                          alert('Failed to convert lead. Please try again.');
                        } finally {
                          setAcceptingLead(null);
                        }
                      }}
                      disabled={acceptingLead === selectedLead.id}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {acceptingLead === selectedLead.id ? 'Converting...' : 'Accept Lead'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HipagesLeadsPage;
