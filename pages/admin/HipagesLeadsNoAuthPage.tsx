import { useEffect, useState, useMemo } from 'react';
import { usePageSEO } from '../../hooks/usePageSEO';
import { SEO } from '../../seoConfig';
import { HipagesLead, HipagesLeadStatus } from '../../types';
import { Search, RefreshCw, Filter, Bell, Image as ImageIcon, Wifi, WifiOff, Check, X } from 'lucide-react';
import { ImageLightbox } from '../../components/ImageLightbox';

type SortField = 'posted_date' | 'credits' | 'customer_name' | 'suburb';
type SortOrder = 'asc' | 'desc';

const APP_VERSION = 'v1.0.6'; // Auto-increment on deploy

const HipagesLeadsNoAuthPage: React.FC = () => {
  usePageSEO({ ...SEO.admin, title: 'hipages Leads (No Auth) - Debug' });

  const [leads, setLeads] = useState<HipagesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [syncFilter, setSyncFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [selectedLead, setSelectedLead] = useState<HipagesLead | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [sortField, setSortField] = useState<SortField>('posted_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    loadLeads();
  }, [statusFilter, syncFilter]);

  // Polling for live updates (every 30 minutes)
  useEffect(() => {
    console.log('[Polling] Starting 30-minute polling for live updates');

    // Initial load
    loadLeads();

    // Set up polling interval
    const pollInterval = setInterval(() => {
      console.log('[Polling] Refreshing leads...');
      loadLeads();
    }, 1800000); // 30 minutes

    return () => {
      console.log('[Polling] Stopping polling');
      clearInterval(pollInterval);
    };
  }, [statusFilter, syncFilter]);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // No limit - pull all available leads

      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      if (syncFilter !== 'ALL') {
        params.append('synced_to_crm', syncFilter === 'SYNCED' ? 'true' : 'false');
      }

      const response = await fetch(`https://revivepropertyco.au/api/hipages/noauth/leads?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setLeads(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load leads');
      }
    } catch (err) {
      console.error('Error loading hipages leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    let filtered = leads.filter(lead =>
      searchTerm === '' ||
      lead.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.suburb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.job_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'posted_date':
          const dateA = a.posted_date ? new Date(a.posted_date).getTime() : 0;
          const dateB = b.posted_date ? new Date(b.posted_date).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'credits':
          comparison = a.credits - b.credits;
          break;
        case 'customer_name':
          comparison = (a.customer_name || '').localeCompare(b.customer_name || '');
          break;
        case 'suburb':
          comparison = (a.suburb || '').localeCompare(b.suburb || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [leads, searchTerm, statusFilter, syncFilter, sortField, sortOrder]);

  // Extract images from raw_data
  const getLeadImages = (lead: HipagesLead): string[] => {
    try {
      const rawData = typeof lead.raw_data === 'string' ? JSON.parse(lead.raw_data) : (lead.raw_data || {});

      // Check for images in raw_data
      if (rawData.images && Array.isArray(rawData.images)) {
        return rawData.images;
      }

      // Check for image URLs in description or other fields
      const images: string[] = [];
      if (rawData.description) {
        const imgMatches = rawData.description.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|gif)/gi);
        if (imgMatches) {
          images.push(...imgMatches);
        }
      }

      return images;
    } catch (e) {
      console.error('Error parsing raw_data:', e);
      return [];
    }
  };

  // Check if lead has images
  const hasImages = (lead: HipagesLead): boolean => {
    return getLeadImages(lead).length > 0;
  };

  // Normalize URL for proxy
  const normalizeImageUrl = (imageUrl: string): string => {
    return `/api/hipages/image?url=${encodeURIComponent(imageUrl)}`;
  };

  // Open lightbox
  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Handle accept action
  const handleAccept = async (lead: HipagesLead) => {
    if (!confirm(`Accept lead from ${lead.customer_name || 'Unknown'} (${lead.suburb})?`)) {
      return;
    }

    setProcessingAction(lead.lead_id);
    try {
      const response = await fetch(`https://revivepropertyco.au/api/hipages/leads/${lead.lead_id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('revive_admin_token') || ''}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Lead accepted! CRM Lead ID: ${result.data.crmLeadId}`);
        loadLeads(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Failed to accept lead: ${error.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Error accepting lead:', e);
      alert('Failed to accept lead. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle decline action (mark as accepted but with note)
  const handleDecline = async (lead: HipagesLead) => {
    const reason = prompt(`Why are you declining this lead from ${lead.customer_name || 'Unknown'}?`);
    if (reason === null) return; // User cancelled

    setProcessingAction(lead.lead_id);
    try {
      // For now, we'll just log it. In a real implementation, you'd have a decline endpoint
      console.log(`Declined lead ${lead.lead_id} for: ${reason}`);
      alert(`Lead declined. Reason: ${reason}`);
      // You could add this to a notes field or update status
    } finally {
      setProcessingAction(null);
    }
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const normalizeStatus = (status: string): string => {
    if (!status) return 'unknown';
    return status.toLowerCase().replace(/[^a-z]/g, '_');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#36453B] animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Loading hipages leads...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-16 px-6 lg:px-8 font-sans text-[#121212]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">hipages Leads (NO AUTH)</h1>
            <div className="flex items-center gap-6">
              <p className="text-lg text-slate-500">
                Debug page: No authentication required • {leads.length} leads loaded • <span className="text-[9px] font-mono text-slate-400">{APP_VERSION}</span>
              </p>

              {/* Live Polling Status */}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isLive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                <Wifi className="w-4 h-4" />
                Live (30m)
              </div>

              {newLeadsCount > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium animate-pulse">
                  <Bell className="w-4 h-4" />
                  {newLeadsCount} new lead{newLeadsCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={loadLeads}
              className="px-6 py-3 bg-[#36453B] text-white text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#121212] transition-all flex items-center gap-3"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-12 p-8 bg-rose-50 border-l-4 border-rose-500">
            <p className="text-rose-800 font-bold text-lg">Error: {error}</p>
            <p className="text-rose-600 mt-2">
              This page bypasses authentication for debugging. If you see this error, there might be a network or API issue.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-6 items-center bg-white p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 text-[9px] font-black uppercase tracking-widest bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="FIRST_TO_ACCEPT">First to accept</option>
              <option value="WAITLIST">Waitlist</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Filter size={16} className="text-slate-400" />
            <select
              value={syncFilter}
              onChange={(e) => setSyncFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 text-[9px] font-black uppercase tracking-widest bg-white"
            >
              <option value="ALL">All Sync Status</option>
              <option value="SYNCED">Synced to CRM</option>
              <option value="UNSYNCED">Not synced</option>
            </select>
          </div>

          <div className="flex items-center gap-3 flex-grow">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, suburb, or job type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 text-sm"
            />
          </div>
        </div>

        {/* Leads Table */}
        {filteredLeads.length === 0 ? (
          <div className="text-center py-32 bg-white border border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">
              {searchTerm || statusFilter !== 'ALL' || syncFilter !== 'ALL'
                ? 'No leads match your filters'
                : 'No hipages leads available'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-2xl overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-[#F8F7F4]">
                <tr>
                  <th
                    className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('customer_name')}
                  >
                    Name {sortField === 'customer_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('suburb')}
                  >
                    Location {sortField === 'suburb' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    Job
                  </th>
                  <th
                    className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('credits')}
                  >
                    Credits {sortField === 'credits' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('posted_date')}
                  >
                    Posted {sortField === 'posted_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-3 py-3 text-center text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    Images
                  </th>
                  <th className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-center text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const postedDate = lead.posted_date ? new Date(lead.posted_date) : null;
                  const rawData = typeof lead.raw_data === 'string' ? JSON.parse(lead.raw_data) : (lead.raw_data || {});
                  const images = getLeadImages(lead);
                  const hasImagesCount = images.length;

                  return (
                    <tr
                      key={lead.lead_id}
                      className="hover:bg-[#FDFCFB] cursor-pointer transition-all"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-bold text-[#121212]">{lead.customer_name || 'Unknown'}</div>
                        {lead.description && (
                          <div className="text-xs text-slate-500 truncate max-w-[120px] mt-1" title={lead.description}>
                            {lead.description}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm text-slate-700">
                          {lead.suburb} {lead.postcode && <span className="text-slate-400">• {lead.postcode}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm text-[#36453B] font-medium">
                          {lead.job_type}
                        </div>
                        {lead.job_subtype && (
                          <div className="text-xs text-slate-500">{lead.job_subtype}</div>
                        )}
                        {rawData.start_by && (
                          <div className="text-xs text-orange-600 mt-1">
                            Start: {rawData.start_by}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="text-sm font-bold text-[#121212]">{lead.credits}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {postedDate && (
                          <div className="text-xs text-slate-600">
                            {postedDate.toLocaleDateString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              timeZone: 'Australia/Sydney'
                            })}
                            <span className="text-slate-400 ml-1">
                              {postedDate.toLocaleTimeString('en-AU', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                                timeZone: 'Australia/Sydney'
                              })}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {lead.contact_status && (
                          <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border ${
                            lead.contact_status === 'Supplied' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            lead.contact_status.includes('verified') ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {lead.contact_status.toLowerCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {hasImagesCount > 0 ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                            <ImageIcon className="w-3 h-3" />
                            {hasImagesCount}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border ${
                          lead.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' :
                          lead.status === 'FIRST_TO_ACCEPT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          lead.status === 'WAITLIST' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {normalizeStatus(lead.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => handleAccept(lead)}
                            disabled={processingAction === lead.lead_id || lead.syncedToCrm}
                            className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Accept Lead"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDecline(lead)}
                            disabled={processingAction === lead.lead_id}
                            className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Decline Lead"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-12 p-6 bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Total leads: {leads.length}</li>
            <li>API Endpoint: /api/hipages/noauth/leads</li>
            <li>Authentication: <strong className="text-green-600">DISABLED</strong></li>
            <li>Status Filter: {statusFilter}</li>
            <li>Sync Filter: {syncFilter}</li>
            <li>Search Term: {searchTerm || '(none)'}</li>
          </ul>
        </div>

        {/* Lead Details Modal */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedLead(null)}>
            <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-[#121212]">Lead Details</h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="text-slate-400 hover:text-slate-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Customer & Location */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer</label>
                      <p className="text-lg font-semibold text-[#121212]">{selectedLead.customer_name || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                      <p className="text-lg text-[#36453B]">
                        {selectedLead.suburb}
                        {selectedLead.postcode && <span className="text-slate-500"> • {selectedLead.postcode}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="border-t border-slate-200 pt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Job Details</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-[#121212]">{selectedLead.job_type}</p>
                          {selectedLead.job_subtype && (
                            <p className="text-sm text-slate-600">{selectedLead.job_subtype}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">{selectedLead.credits}</p>
                          <p className="text-xs text-slate-500 uppercase">credits</p>
                        </div>
                      </div>

                      {selectedLead.description && (
                        <div className="mt-4 p-4 bg-slate-50 rounded">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedLead.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timing & Status */}
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                      <span className={`px-3 py-1 text-sm font-bold uppercase tracking-wider border ${
                        selectedLead.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200' :
                        selectedLead.status === 'FIRST_TO_ACCEPT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        selectedLead.status === 'WAITLIST' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {normalizeStatus(selectedLead.status)}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contact</label>
                      {selectedLead.contact_status ? (
                        <span className={`px-3 py-1 text-sm font-bold uppercase tracking-wider border ${
                          selectedLead.contact_status === 'Supplied' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          selectedLead.contact_status.includes('verified') ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {selectedLead.contact_status.toLowerCase()}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Posted</label>
                      {selectedLead.posted_date ? (
                        <p className="text-sm text-slate-700">
                          {new Date(selectedLead.posted_date).toLocaleString('en-AU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Australia/Sydney'
                          })}
                        </p>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </div>

                  {/* Images Section */}
                  {(() => {
                    const images = getLeadImages(selectedLead);
                    return images.length > 0 && (
                      <div className="border-t border-slate-200 pt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                          Attachments ({images.length})
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {images.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                              <button
                                onClick={() => openLightbox(images, index)}
                                className="w-full border border-slate-200 rounded-lg overflow-hidden hover:border-purple-400 transition-all hover:scale-105 cursor-pointer"
                              >
                                <img
                                  src={normalizeImageUrl(imageUrl)}
                                  alt={`Attachment ${index + 1}`}
                                  className="w-full h-32 object-cover"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="12"%3EImage not available%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    Click to enlarge
                                  </span>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Raw Data */}
                  {selectedLead.raw_data && (
                    <div className="border-t border-slate-200 pt-4">
                      <details className="group">
                        <summary className="cursor-pointer">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 inline-flex items-center gap-2">
                            Additional Information (Raw Data)
                            <span className="text-xs text-slate-400 group-open:hidden">▶</span>
                            <span className="text-xs text-slate-400 hidden group-open:inline">▼</span>
                          </label>
                        </summary>
                        <div className="text-xs text-slate-600 mt-2">
                          {typeof selectedLead.raw_data === 'string' ? (
                            <pre className="bg-slate-50 p-3 rounded overflow-x-auto">
                              {JSON.stringify(JSON.parse(selectedLead.raw_data), null, 2)}
                            </pre>
                          ) : (
                            <pre className="bg-slate-50 p-3 rounded overflow-x-auto">
                              {JSON.stringify(selectedLead.raw_data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 mt-6">
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="px-6 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && (
          <ImageLightbox
            images={lightboxImages}
            initialIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default HipagesLeadsNoAuthPage;
