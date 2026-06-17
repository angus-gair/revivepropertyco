import { useEffect, useState, useMemo } from 'react';
import { usePageSEO } from '../../hooks/usePageSEO';
import { SEO } from '../../seoConfig';
import { HpBusiness } from '../../types';
import {
  Star, MapPin, Phone, Globe, Award, RefreshCw, Search, Filter,
  ExternalLink, X, MessageCircle, Archive
} from 'lucide-react';
import { io } from 'socket.io-client';

type SortField = 'scraped_at' | 'rating' | 'review_count' | 'business_name';
type SortOrder = 'asc' | 'desc';

const APP_VERSION = 'v1.0.0';

const statusColors: Record<string, string> = {
  NEW: 'bg-green-50 text-green-700 border-green-200',
  CONTACTED: 'bg-blue-50 text-blue-700 border-blue-200',
  CONVERTED: 'bg-purple-50 text-purple-700 border-purple-200',
  ARCHIVED: 'bg-slate-50 text-slate-500 border-slate-200',
};

const HipagesBusinessesPage: React.FC = () => {
  usePageSEO({ ...SEO.admin, title: 'hipages Businesses - Contractors' });

  const [businesses, setBusinesses] = useState<HpBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tradeFilter, setTradeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<HpBusiness | null>(null);
  const [sortField, setSortField] = useState<SortField>('scraped_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Scraper Operations State
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [triggeringScrape, setTriggeringScrape] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const token = localStorage.getItem('revive_admin_token') || localStorage.getItem('revive_platform_token');
  const hasToken = !!token;

  // Socket.IO for real-time updates
  useEffect(() => {
    const socket = io('https://revivepropertyco.au', {
      path: '/socket.io',
      transports: ['websocket']
    });

    socket.on('hp-businesses:updated', (payload) => {
      console.log('[Socket] Received live scraper update:', payload);
      loadBusinesses();
      loadSessions();
    });

    socket.on('hipages:leadsUpdated', (payload) => {
      console.log('[Socket] Received hipages:leadsUpdated update:', payload);
      loadBusinesses();
      loadSessions();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Polling for live updates (every 30 minutes)
  useEffect(() => {
    console.log('[Polling] Starting 30-minute polling for hp-businesses');
    loadBusinesses();
    loadSessions();

    const pollInterval = setInterval(() => {
      console.log('[Polling] Refreshing hp-businesses...');
      loadBusinesses();
      loadSessions();
    }, 1800000); // 30 minutes

    return () => {
      console.log('[Polling] Stopping polling');
      clearInterval(pollInterval);
    };
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        'https://revivepropertyco.au/api/hp-businesses/noauth/businesses?limit=10000'
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setBusinesses(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load businesses');
      }
    } catch (err) {
      console.error('Error loading hp-businesses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const response = await fetch('https://revivepropertyco.au/api/hp-businesses/sessions?limit=5', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.success) {
        setSessions(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load sessions');
      }
    } catch (err) {
      console.error('Error loading scrape sessions:', err);
      setSessionsError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Unique trades for filter dropdown
  const uniqueTrades = useMemo(() => {
    const trades = businesses
      .map((b) => b.primary_trade)
      .filter((t): t is string => !!t);
    return Array.from(new Set(trades)).sort();
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    let filtered = businesses.filter((b) => {
      const matchesSearch =
        searchTerm === '' ||
        b.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.suburb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.primary_trade?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || b.lead_status === statusFilter;
      const matchesTrade = tradeFilter === 'ALL' || b.primary_trade === tradeFilter;

      return matchesSearch && matchesStatus && matchesTrade;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'scraped_at':
          comparison =
            new Date(a.scraped_at).getTime() - new Date(b.scraped_at).getTime();
          break;
        case 'rating':
          comparison = (a.rating ?? 0) - (b.rating ?? 0);
          break;
        case 'review_count':
          comparison = a.review_count - b.review_count;
          break;
        case 'business_name':
          comparison = a.business_name.localeCompare(b.business_name);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [businesses, searchTerm, statusFilter, tradeFilter, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const rated = businesses.filter((b) => b.rating !== null && b.rating !== undefined);
    const avgRating =
      rated.length > 0
        ? (rated.reduce((sum, b) => sum + (b.rating ?? 0), 0) / rated.length).toFixed(1)
        : '—';

    const tradeCounts: Record<string, number> = {};
    businesses.forEach((b) => {
      if (b.primary_trade) {
        tradeCounts[b.primary_trade] = (tradeCounts[b.primary_trade] || 0) + 1;
      }
    });
    const topTrade = Object.entries(tradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    return { total: businesses.length, avgRating, topTrade };
  }, [businesses]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleContact = async (business: HpBusiness, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasToken) {
      alert('Authentication required to perform status updates.');
      return;
    }
    if (
      !confirm(`Mark "${business.business_name}" as CONTACTED?`)
    )
      return;

    setProcessingAction(business.id);
    try {
      const response = await fetch(
        `https://revivepropertyco.au/api/hp-businesses/businesses/${business.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ lead_status: 'CONTACTED' }),
        }
      );
      if (response.ok) {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === business.id ? { ...b, lead_status: 'CONTACTED' } : b
          )
        );
        if (selectedBusiness?.id === business.id) {
          setSelectedBusiness({ ...selectedBusiness, lead_status: 'CONTACTED' });
        }
      } else {
        const err = await response.json();
        alert(`Failed: ${err.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Error updating status:', e);
      alert('Failed to update status. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleArchive = async (business: HpBusiness, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasToken) {
      alert('Authentication required to archive businesses.');
      return;
    }
    if (!confirm(`Archive "${business.business_name}"?`)) return;

    setProcessingAction(business.id);
    try {
      const response = await fetch(
        `https://revivepropertyco.au/api/hp-businesses/businesses/${business.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ lead_status: 'ARCHIVED' }),
        }
      );
      if (response.ok) {
        setBusinesses((prev) =>
          prev.map((b) =>
            b.id === business.id ? { ...b, lead_status: 'ARCHIVED' } : b
          )
        );
        if (selectedBusiness?.id === business.id) {
          setSelectedBusiness({ ...selectedBusiness, lead_status: 'ARCHIVED' });
        }
      } else {
        const err = await response.json();
        alert(`Failed: ${err.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Error archiving business:', e);
      alert('Failed to archive. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleTriggerScrape = async () => {
    if (!hasToken) {
      alert('Authentication required to trigger scraper.');
      return;
    }
    if (!confirm('Are you sure you want to trigger a manual scrape run?')) return;
    setTriggeringScrape(true);
    try {
      const response = await fetch('https://revivepropertyco.au/api/hp-businesses/scrape/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({})
      });
      if (response.ok) {
        alert('Scraper run triggered successfully in the background.');
        setTimeout(() => loadSessions(), 1000);
      } else {
        const err = await response.json();
        alert(`Failed to trigger scrape: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error triggering scrape:', err);
      alert('Failed to trigger scraper. Please try again.');
    } finally {
      setTriggeringScrape(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-12 h-12 text-[#36453B] animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Loading businesses...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-16 px-6 lg:px-8 font-sans text-[#121212]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-3">
              hipages Businesses
            </h1>
            <p className="text-lg text-slate-500">
              Contractor directory • {businesses.length} businesses loaded •{' '}
              <span className="text-[9px] font-mono text-slate-400">{APP_VERSION}</span>
            </p>
          </div>
          <button
            onClick={loadBusinesses}
            className="px-6 py-3 bg-[#36453B] text-white text-[9px] font-black uppercase tracking-[0.4em] hover:bg-[#121212] transition-all flex items-center gap-3"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total</p>
            <p className="text-3xl font-black text-[#121212]">{stats.total}</p>
          </div>
          <div className="bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg Rating</p>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <p className="text-3xl font-black text-[#121212]">{stats.avgRating}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Top Trade</p>
            <p className="text-xl font-black text-[#36453B] truncate">{stats.topTrade}</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-10 p-8 bg-rose-50 border-l-4 border-rose-500">
            <p className="text-rose-800 font-bold text-lg">Error: {error}</p>
            <p className="text-rose-600 mt-2">
              Could not reach the API endpoint. Check network or API status.
            </p>
          </div>
        )}

        {/* Scraper Operations Panel */}
        <div className="mb-8 bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#36453B]">
                Scraper Operations & Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Monitor and trigger background directory synchronization
              </p>
            </div>
            <button
              onClick={handleTriggerScrape}
              disabled={triggeringScrape || !hasToken}
              className="px-6 py-3 bg-[#121212] text-white text-[9px] font-black uppercase tracking-[0.3em] hover:bg-[#36453B] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {triggeringScrape ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Triggering Scrape...
                </>
              ) : (
                'Trigger Scrape'
              )}
            </button>
          </div>

          {sessionsError && (
            <div className="p-4 mb-4 bg-rose-50 border-l-2 border-rose-500 text-xs text-rose-800 font-medium">
              Failed to load sessions: {sessionsError}
            </div>
          )}

          {loadingSessions && sessions.length === 0 ? (
            <div className="flex justify-center py-6">
              <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200">
              <p className="text-xs text-slate-400">No scrape sessions recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 bg-white text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                      Session ID
                    </th>
                    <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                      Trade / Location
                    </th>
                    <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                      Started At
                    </th>
                    <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                      Completed At
                    </th>
                    <th className="px-4 py-2 text-[8px] font-black text-slate-400 uppercase tracking-wider text-right">
                      Found / New / Upd
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-[10px] text-slate-500">
                        {session.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider border ${
                            session.status === 'completed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : session.status === 'failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                          }`}
                        >
                          {session.status}
                        </span>
                        {session.status === 'failed' && session.error_message && (
                          <div className="text-[10px] text-rose-600 mt-1 max-w-xs truncate font-mono" title={session.error_message}>
                            Error: {session.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {session.trade_category || 'All'} • {session.location || 'All'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(session.started_at).toLocaleString('en-AU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'Australia/Sydney'
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {session.completed_at
                          ? new Date(session.completed_at).toLocaleString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                              timeZone: 'Australia/Sydney'
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700">
                        {session.businesses_found} /{' '}
                        <span className="text-green-600">{session.businesses_new}</span> /{' '}
                        <span className="text-blue-600">{session.businesses_updated}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-6 items-center bg-white p-6 border border-slate-200 shadow-sm">
          {/* Status filter */}
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 text-[9px] font-black uppercase tracking-widest bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="CONVERTED">Converted</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Trade filter */}
          <div className="flex items-center gap-3">
            <Filter size={16} className="text-slate-400" />
            <select
              value={tradeFilter}
              onChange={(e) => setTradeFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 text-[9px] font-black uppercase tracking-widest bg-white"
            >
              <option value="ALL">All Trades</option>
              {uniqueTrades.map((trade) => (
                <option key={trade} value={trade}>
                  {trade}
                </option>
              ))}
            </select>
          </div>

          {/* Sort field */}
          <div className="flex items-center gap-3">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-4 py-2 border border-slate-200 text-[9px] font-black uppercase tracking-widest bg-white"
            >
              <option value="scraped_at">Sort: Date Scraped</option>
              <option value="rating">Sort: Rating</option>
              <option value="review_count">Sort: Reviews</option>
              <option value="business_name">Sort: Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-slate-200 text-[9px] font-black uppercase tracking-widest bg-white hover:bg-slate-50 transition-colors"
              title="Toggle sort order"
            >
              {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 flex-grow">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, suburb, or trade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 text-sm"
            />
          </div>

          {/* Live count badge */}
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#36453B] text-white text-[9px] font-black uppercase tracking-widest">
            {filteredBusinesses.length} shown
          </div>
        </div>

        {/* Table */}
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-32 bg-white border border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">
              {searchTerm || statusFilter !== 'ALL' || tradeFilter !== 'ALL'
                ? 'No businesses match your filters'
                : 'No businesses available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-2xl">
            <table className="min-w-full divide-y divide-slate-100 bg-white border border-slate-200">
              <thead className="bg-[#F8F7F4]">
                <tr>
                  <th
                    className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('business_name')}
                  >
                    Business {sortField === 'business_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    Trade
                  </th>
                  <th
                    className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('rating')}
                  >
                    Rating {sortField === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('review_count')}
                  >
                    Reviews {sortField === 'review_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-3 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-wider">
                    Years
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
                {filteredBusinesses.map((business) => (
                  <tr
                    key={business.id}
                    className="hover:bg-[#FDFCFB] cursor-pointer transition-all"
                    onClick={() => setSelectedBusiness(business)}
                  >
                    {/* BUSINESS */}
                    <td className="px-3 py-3 max-w-[200px]">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#121212] truncate">
                            {business.business_name}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {business.verified && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5">
                                ✓ verified
                              </span>
                            )}
                            {business.badge_level && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5">
                                <Award className="w-2.5 h-2.5" />
                                {business.badge_level}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* LOCATION */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-slate-700">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        {business.suburb || '—'}
                        {business.postcode && (
                          <span className="text-slate-400"> • {business.postcode}</span>
                        )}
                      </div>
                      {business.state && (
                        <div className="text-xs text-slate-400 mt-0.5">{business.state}</div>
                      )}
                    </td>

                    {/* TRADE */}
                    <td className="px-3 py-3 max-w-[140px]">
                      <div className="text-sm font-medium text-[#36453B] truncate">
                        {business.primary_trade || '—'}
                      </div>
                      {business.trade_categories && business.trade_categories.length > 1 && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          +{business.trade_categories.length - 1} more
                        </div>
                      )}
                    </td>

                    {/* RATING */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {business.rating !== null && business.rating !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-[#121212]">
                            {business.rating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* REVIEWS */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#121212]">
                        {business.review_count}
                      </div>
                      {business.job_count > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {business.job_count} jobs
                        </div>
                      )}
                    </td>

                    {/* CONTACT */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {business.phone && (
                          <div className="flex items-center gap-1 text-xs text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {business.phone}
                          </div>
                        )}
                        {business.website && (
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Globe className="w-3 h-3" />
                            website
                          </a>
                        )}
                        {!business.phone && !business.website && (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </div>
                    </td>

                    {/* YEARS */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {business.years_on_hipages !== null &&
                      business.years_on_hipages !== undefined ? (
                        <div>
                          <span className="text-sm font-bold text-[#121212]">
                            {business.years_on_hipages}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">yrs</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider border ${
                          statusColors[business.lead_status] ?? statusColors.NEW
                        }`}
                      >
                        {business.lead_status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td
                      className="px-3 py-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={(e) => handleContact(business, e)}
                          disabled={
                            processingAction === business.id ||
                            business.lead_status === 'ARCHIVED' ||
                            !hasToken
                          }
                          className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Mark as Contacted"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleArchive(business, e)}
                          disabled={
                            processingAction === business.id ||
                            business.lead_status === 'ARCHIVED' ||
                            !hasToken
                          }
                          className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Business Details Modal */}
        {selectedBusiness && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedBusiness(null)}
          >
            <div
              className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 min-w-0 pr-4">
                    <h2 className="text-2xl font-bold text-[#121212] break-words">
                      {selectedBusiness.business_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {selectedBusiness.verified && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-2 py-0.5">
                          ✓ verified
                        </span>
                      )}
                      {selectedBusiness.badge_level && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5">
                          <Award className="w-3 h-3" />
                          {selectedBusiness.badge_level}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                          statusColors[selectedBusiness.lead_status] ?? statusColors.NEW
                        }`}
                      >
                        {selectedBusiness.lead_status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBusiness(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Location & Trade */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Location
                      </label>
                      <p className="text-base text-[#36453B] font-medium">
                        {[selectedBusiness.suburb, selectedBusiness.postcode, selectedBusiness.state]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Primary Trade
                      </label>
                      <p className="text-base font-semibold text-[#121212]">
                        {selectedBusiness.primary_trade || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3 border-t border-slate-200 pt-4">
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Rating
                      </p>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-xl font-black text-[#121212]">
                          {selectedBusiness.rating?.toFixed(1) ?? '—'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Reviews
                      </p>
                      <p className="text-xl font-black text-[#121212]">
                        {selectedBusiness.review_count}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Jobs
                      </p>
                      <p className="text-xl font-black text-[#121212]">
                        {selectedBusiness.job_count}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        Years
                      </p>
                      <p className="text-xl font-black text-[#121212]">
                        {selectedBusiness.years_on_hipages ?? '—'}
                      </p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="border-t border-slate-200 pt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      Contact
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {selectedBusiness.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {selectedBusiness.phone}
                        </div>
                      )}
                      {selectedBusiness.website && (
                        <a
                          href={selectedBusiness.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Globe className="w-4 h-4" />
                          {selectedBusiness.website}
                        </a>
                      )}
                      {selectedBusiness.profile_url && (
                        <a
                          href={selectedBusiness.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-[#36453B] hover:text-[#121212] font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on hipages
                        </a>
                      )}
                    </div>
                    {selectedBusiness.response_rate && (
                      <p className="text-xs text-slate-500 mt-2">
                        Response rate: {selectedBusiness.response_rate}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  {selectedBusiness.description && (
                    <div className="border-t border-slate-200 pt-4">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Description
                      </label>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedBusiness.description}
                      </p>
                    </div>
                  )}

                  {/* Trade Categories */}
                  {selectedBusiness.trade_categories &&
                    selectedBusiness.trade_categories.length > 0 && (
                      <div className="border-t border-slate-200 pt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Trade Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedBusiness.trade_categories.map((cat) => (
                            <span
                              key={cat}
                              className="px-2 py-1 text-xs font-medium bg-[#F8F7F4] border border-slate-200 text-slate-700"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Service Areas */}
                  {selectedBusiness.service_areas &&
                    selectedBusiness.service_areas.length > 0 && (
                      <div className="border-t border-slate-200 pt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Service Areas
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedBusiness.service_areas.map((area) => (
                            <span
                              key={area}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-50 border border-slate-200 text-slate-600"
                            >
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Scraped date */}
                  <div className="border-t border-slate-200 pt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Scraped At
                    </label>
                    <p className="text-sm text-slate-600">
                      {new Date(selectedBusiness.scraped_at).toLocaleString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Australia/Sydney',
                      })}
                    </p>
                  </div>

                  {/* Footer actions */}
                  <div className="flex justify-between items-center border-t border-slate-200 pt-4 mt-6">
                    <div className="flex gap-3">
                      <button
                        onClick={(e) => handleContact(selectedBusiness, e)}
                        disabled={
                          processingAction === selectedBusiness.id ||
                          selectedBusiness.lead_status === 'ARCHIVED' ||
                          !hasToken
                        }
                        className="px-4 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Mark Contacted
                      </button>
                      <button
                        onClick={(e) => handleArchive(selectedBusiness, e)}
                        disabled={
                          processingAction === selectedBusiness.id ||
                          selectedBusiness.lead_status === 'ARCHIVED' ||
                          !hasToken
                        }
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Archive
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedBusiness(null)}
                      className="px-6 py-2 border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HipagesBusinessesPage;
