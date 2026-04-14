/**
 * Customer Portal Dashboard Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import {
  getCustomerProfile,
  listQuotes,
  listDocuments
} from '../../services/customerService';

interface DashboardStats {
  totalQuotes: number;
  pendingQuotes: number;
  totalDocuments: number;
  recentActivity: number;
}

interface RecentActivity {
  id: string;
  type: 'quote' | 'document' | 'status_change';
  description: string;
  timestamp: string;
  status?: string;
}

const CustomerDashboardPage: React.FC = () => {
  const { customer } = useCustomerAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotes: 0,
    pendingQuotes: 0,
    totalDocuments: 0,
    recentActivity: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load customer data and calculate stats
      const profileData = await getCustomerProfile();
      const quotesData = await listQuotes();
      const documentsData = await listDocuments();

      // Calculate stats
      const pendingQuotes = quotesData.filter(q => q.status === 'PENDING').length;

      setStats({
        totalQuotes: quotesData.length,
        pendingQuotes,
        totalDocuments: documentsData.length,
        recentActivities: 5 // Placeholder - would come from audit log
      });

      // Create recent activity from quotes and documents
      const activities: RecentActivity[] = [];

      // Add recent quotes
      quotesData.slice(0, 3).forEach(quote => {
        activities.push({
          id: quote.quoteId,
          type: 'quote',
          description: `Quote ${quote.quoteNumber} for ${quote.projectName || 'Project'}`,
          timestamp: quote.createdAt || new Date().toISOString(),
          status: quote.status
        });
      });

      // Add recent documents
      documentsData.slice(0, 2).forEach(doc => {
        activities.push({
          id: doc.documentId,
          type: 'document',
          description: `Uploaded ${doc.fileName}`,
          timestamp: doc.uploadedAt
        });
      });

      // Sort by timestamp
      activities.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return FileText;
      case 'document':
        return Upload;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 md:py-12">
        {/* Welcome Hero Section */}
        <div className="mb-12 md:mb-24 p-6 md:p-20 bg-white border border-outline-variant relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-[0.5] pointer-events-none rounded-bl-full" />
          <div className="relative z-10">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-tighter leading-[0.9] md:leading-[0.85] mb-6 md:mb-8">
              Welcome,<br />
              <span className="text-blue-600">{customer?.firstName} {customer?.lastName}</span>
            </h1>
            <p className="text-sm md:text-lg text-neutral-500 leading-relaxed font-medium max-w-2xl mb-8">
              Manage your property service quotes, documents, and profile settings all in one place.
              Thank you for choosing Revive Property Co.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/customer/quotes')}
                className="bg-black text-white px-6 md:px-8 py-3 md:py-4 font-display text-xs font-bold tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2"
              >
                View Quotes
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/customer/documents')}
                className="border border-black px-6 md:px-8 py-3 md:py-4 font-display text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                Upload Documents
              </button>
            </div>
          </div>
          <div className="mt-8 md:mt-12 flex flex-wrap items-center gap-4 md:gap-6 font-display text-[0.5rem] md:text-[0.65rem] tracking-widest text-neutral-400 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 animate-pulse" />
              SECURE_CONNECTION_ACTIVE
            </div>
            <div className="hidden sm:block">CUSTOMER_PORTAL_V1.0</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          <div className="bg-white border border-outline-variant p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
              <TrendingUp className="text-neutral-400" size={20} />
            </div>
            <div className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
              {stats.totalQuotes}
            </div>
            <div className="font-display text-[0.6rem] tracking-[0.2em] text-neutral-500 uppercase">
              Total Quotes
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Clock className="text-yellow-600" size={24} />
              </div>
              {stats.pendingQuotes > 0 && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              )}
            </div>
            <div className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
              {stats.pendingQuotes}
            </div>
            <div className="font-display text-[0.6rem] tracking-[0.2em] text-neutral-500 uppercase">
              Pending Action
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Upload className="text-green-600" size={24} />
              </div>
            </div>
            <div className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
              {stats.totalDocuments}
            </div>
            <div className="font-display text-[0.6rem] tracking-[0.2em] text-neutral-500 uppercase">
              Documents
            </div>
          </div>

          <div className="bg-white border border-outline-variant p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="text-purple-600" size={24} />
              </div>
            </div>
            <div className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
              {stats.recentActivity}
            </div>
            <div className="font-display text-[0.6rem] tracking-[0.2em] text-neutral-500 uppercase">
              Recent Activity
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight uppercase mb-6 md:mb-8">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/customer/documents')}
              className="bg-white border border-outline-variant p-6 text-left hover:bg-neutral-50 transition-colors group"
            >
              <Upload className="text-neutral-400 group-hover:text-black mb-4" size={24} />
              <div className="font-display text-sm font-bold tracking-wider uppercase mb-2">
                Upload Document
              </div>
              <div className="text-xs text-neutral-500">
                Share project photos or files
              </div>
            </button>

            <button
              onClick={() => navigate('/customer/quotes')}
              className="bg-white border border-outline-variant p-6 text-left hover:bg-neutral-50 transition-colors group"
            >
              <FileText className="text-neutral-400 group-hover:text-black mb-4" size={24} />
              <div className="font-display text-sm font-bold tracking-wider uppercase mb-2">
                Review Quotes
              </div>
              <div className="text-xs text-neutral-500">
                {stats.pendingQuotes > 0
                  ? `${stats.pendingQuotes} awaiting your response`
                  : 'View all your quotes'}
              </div>
            </button>

            <button
              onClick={() => navigate('/customer/profile')}
              className="bg-white border border-outline-variant p-6 text-left hover:bg-neutral-50 transition-colors group"
            >
              <CheckCircle2 className="text-neutral-400 group-hover:text-black mb-4" size={24} />
              <div className="font-display text-sm font-bold tracking-wider uppercase mb-2">
                Update Profile
              </div>
              <div className="text-xs text-neutral-500">
                Manage your contact details
              </div>
            </button>

            <button
              onClick={() => window.open('https://revivepropertyco.au/contact', '_blank')}
              className="bg-white border border-outline-variant p-6 text-left hover:bg-neutral-50 transition-colors group"
            >
              <AlertCircle className="text-neutral-400 group-hover:text-black mb-4" size={24} />
              <div className="font-display text-sm font-bold tracking-wider uppercase mb-2">
                Get Support
              </div>
              <div className="text-xs text-neutral-500">
                Contact our team
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tight uppercase mb-6 md:mb-8">
            Recent Activity
          </h2>
          {recentActivities.length === 0 ? (
            <div className="bg-white border border-outline-variant p-12 text-center">
              <Clock className="text-neutral-300 mx-auto mb-4" size={48} />
              <div className="font-display text-sm font-bold tracking-wider uppercase mb-2">
                No Recent Activity
              </div>
              <div className="text-sm text-neutral-500">
                Your activity will appear here
              </div>
            </div>
          ) : (
            <div className="bg-white border border-outline-variant divide-y divide-outline-variant">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="p-6 flex items-start gap-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-surface-low rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="text-neutral-400" size={20} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="font-display text-sm font-medium text-neutral-900 mb-1">
                        {activity.description}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-neutral-500">
                          {formatDate(activity.timestamp)}
                        </div>
                        {activity.status && (
                          <div className={`px-2 py-0.5 border text-[0.6rem] font-bold tracking-wider uppercase ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
