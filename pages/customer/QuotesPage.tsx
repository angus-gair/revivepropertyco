/**
 * Customer Portal Quote Management Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  listQuotes,
  getQuoteDetails,
  approveQuote,
  rejectQuote
} from '../../services/customerService';
import type { CustomerQuote } from '../../services/customerService';

interface QuoteDetail extends CustomerQuote {
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    gst: string;
    total: number;
  }>;
}

const CustomerQuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<CustomerQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await listQuotes();
      setQuotes(response.quotes);
    } catch (error: any) {
      setError(error.message || 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuote = async (quoteId: string) => {
    try {
      setLoading(true);
      const details = await getQuoteDetails(quoteId);
      setSelectedQuote(details);
    } catch (error: any) {
      setError(error.message || 'Failed to load quote details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (quoteId: string) => {
    if (!confirm('Are you sure you want to approve this quote?')) return;

    try {
      setActionLoading(true);
      await approveQuote(quoteId);
      setSuccess('Quote approved successfully');
      await loadQuotes();
      setSelectedQuote(null);
    } catch (error: any) {
      setError(error.message || 'Failed to approve quote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await rejectQuote(selectedQuote!.quoteId, rejectionReason);
      setSuccess('Quote rejected successfully');
      setShowRejectModal(false);
      setRejectionReason('');
      await loadQuotes();
      setSelectedQuote(null);
    } catch (error: any) {
      setError(error.message || 'Failed to reject quote');
    } finally {
      setActionLoading(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return Clock;
      case 'APPROVED':
        return CheckCircle2;
      case 'REJECTED':
        return XCircle;
      case 'EXPIRED':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isQuoteExpired = (quote: CustomerQuote) => {
    if (!quote.expiryDate) return false;
    return new Date(quote.expiryDate) < new Date();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (loading && !selectedQuote) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight uppercase mb-4">
            Quotes
          </h1>
          <p className="text-neutral-500">
            Review and manage your service quotes
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-grow">
              <div className="font-semibold text-red-900 mb-1">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <XCircle size={20} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 flex items-start gap-3">
            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-grow">
              <div className="font-semibold text-green-900 mb-1">Success</div>
              <div className="text-sm text-green-700">{success}</div>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-400 hover:text-green-600"
            >
              <CheckCircle2 size={20} />
            </button>
          </div>
        )}

        {selectedQuote ? (
          /* Quote Detail View */
          <div>
            <button
              onClick={() => setSelectedQuote(null)}
              className="mb-6 font-display text-xs font-bold tracking-widest text-neutral-500 hover:text-black flex items-center gap-2"
            >
              ← Back to quotes
            </button>

            <div className="bg-white border border-outline-variant shadow-sm">
              {/* Quote Header */}
              <div className="p-6 md:p-8 border-b border-outline-variant">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold tracking-tight uppercase mb-2">
                      {selectedQuote.projectName || 'Quote'}
                    </h2>
                    <div className="font-display text-sm text-neutral-500">
                      Quote {selectedQuote.quoteNumber}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="font-display text-3xl font-bold tracking-tight">
                      {formatCurrency(selectedQuote.totalAmount)}
                    </div>
                    <div className="text-sm text-neutral-500">Total Amount</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-neutral-400" />
                    <span className="text-neutral-500">Issued:</span>
                    <span className="font-medium">{formatDate(selectedQuote.createdAt)}</span>
                  </div>
                  {selectedQuote.expiryDate && (
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-neutral-400" />
                      <span className="text-neutral-500">Expires:</span>
                      <span className="font-medium">{formatDate(selectedQuote.expiryDate)}</span>
                    </div>
                  )}
                  <div className="ml-auto">
                    <span className={`px-3 py-1 border text-[0.65rem] font-bold tracking-wider ${getStatusColor(selectedQuote.status)}`}>
                      {selectedQuote.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {selectedQuote.lineItems && selectedQuote.lineItems.length > 0 && (
                <div className="p-6 md:p-8 border-b border-outline-variant">
                  <h3 className="font-display text-sm font-bold tracking-wider uppercase mb-4">
                    Line Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-black">
                          <th className="text-left font-display text-[0.6rem] font-bold tracking-wider py-2">Description</th>
                          <th className="text-right font-display text-[0.6rem] font-bold tracking-wider py-2">Qty</th>
                          <th className="text-right font-display text-[0.6rem] font-bold tracking-wider py-2">Unit Price</th>
                          <th className="text-right font-display text-[0.6rem] font-bold tracking-wider py-2">GST</th>
                          <th className="text-right font-display text-[0.6rem] font-bold tracking-wider py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuote.lineItems.map((item, index) => (
                          <tr key={index} className="border-b border-outline-variant">
                            <td className="py-3 text-sm">{item.description}</td>
                            <td className="py-3 text-sm text-right">{item.quantity}</td>
                            <td className="py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-3 text-sm text-right">{item.gst}</td>
                            <td className="py-3 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-black">
                          <td colSpan={4} className="py-3 text-right font-display text-sm font-bold tracking-wider">
                            TOTAL
                          </td>
                          <td className="py-3 text-right font-display text-lg font-bold">
                            {formatCurrency(selectedQuote.totalAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Terms */}
              <div className="p-6 md:p-8">
                <h3 className="font-display text-sm font-bold tracking-wider uppercase mb-4">
                  Terms & Conditions
                </h3>
                <div className="text-sm text-neutral-600 space-y-2">
                  <p>• This quote is valid for 30 days from the issue date unless otherwise stated.</p>
                  <p>• Approval of this quote authorizes Revive Property Co. to proceed with the work described.</p>
                  <p>• Any variations to the scope will be documented in a variation quote.</p>
                  <p>• Payment terms are as specified in the quote or as agreed upon commencement.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 md:p-8 border-t border-outline-variant bg-surface-low/30">
                {selectedQuote.status === 'PENDING' && !isQuoteExpired(selectedQuote) ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleApprove(selectedQuote.quoteId)}
                      disabled={actionLoading}
                      className="flex-1 px-6 py-3 bg-green-600 text-white font-display text-xs font-bold tracking-widest hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      {actionLoading ? 'Processing...' : 'Approve Quote'}
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="flex-1 px-6 py-3 bg-red-600 text-white font-display text-xs font-bold tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      Reject Quote
                    </button>
                    <button
                      onClick={() => window.open(`/api/customer/quotes/${selectedQuote.quoteId}/pdf`, '_blank')}
                      className="px-6 py-3 border border-black font-display text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Download PDF
                    </button>
                  </div>
                ) : selectedQuote.status === 'APPROVED' ? (
                  <div className="bg-green-50 border border-green-200 p-4 text-center">
                    <CheckCircle2 className="text-green-600 mx-auto mb-2" size={32} />
                    <div className="font-display text-sm font-bold tracking-wider text-green-900 mb-1">
                      QUOTE APPROVED
                    </div>
                    <div className="text-sm text-green-700">
                      This quote has been approved and work is scheduled.
                    </div>
                  </div>
                ) : selectedQuote.status === 'REJECTED' ? (
                  <div className="bg-red-50 border border-red-200 p-4 text-center">
                    <XCircle className="text-red-600 mx-auto mb-2" size={32} />
                    <div className="font-display text-sm font-bold tracking-wider text-red-900 mb-1">
                      QUOTE REJECTED
                    </div>
                    <div className="text-sm text-red-700">
                      This quote has been rejected.
                      {selectedQuote.rejectionReason && (
                        <span className="block mt-2">Reason: {selectedQuote.rejectionReason}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 p-4 text-center">
                    <AlertTriangle className="text-gray-600 mx-auto mb-2" size={32} />
                    <div className="font-display text-sm font-bold tracking-wider text-gray-900 mb-1">
                      {selectedQuote.status}
                    </div>
                    <div className="text-sm text-gray-700">
                      This quote is {selectedQuote.status.toLowerCase()} and no longer actionable.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Quotes List */
          <>
            {quotes.length === 0 ? (
              <div className="bg-white border border-outline-variant p-16 text-center">
                <FileText className="text-neutral-300 mx-auto mb-4" size={64} />
                <div className="font-display text-xl font-bold tracking-tight uppercase mb-2">
                  No Quotes Yet
                </div>
                <p className="text-neutral-500 mb-6">
                  When you receive quotes, they will appear here
                </p>
                <button
                  onClick={() => window.open('https://revivepropertyco.au/contact', '_blank')}
                  className="bg-black text-white px-6 py-3 font-display text-xs font-bold tracking-widest hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
                >
                  Request a Quote
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {quotes.map((quote) => {
                  const StatusIcon = getStatusIcon(quote.status);
                  const expired = isQuoteExpired(quote);

                  return (
                    <div
                      key={quote.quoteId}
                      className="bg-white border border-outline-variant p-6 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-grow">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-surface-low rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="text-neutral-400" size={24} />
                            </div>
                            <div className="flex-grow">
                              <h3 className="font-display text-lg font-bold tracking-tight mb-1">
                                {quote.projectName || 'Quote'}
                              </h3>
                              <div className="font-display text-xs text-neutral-500 mb-2">
                                {quote.quoteNumber}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                                <div className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {formatDate(quote.createdAt)}
                                </div>
                                {quote.expiryDate && (
                                  <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    Expires: {formatDate(quote.expiryDate)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                          <div className="text-right">
                            <div className="font-display text-2xl font-bold tracking-tight">
                              {formatCurrency(quote.totalAmount)}
                            </div>
                            <div className={`px-2 py-1 border text-[0.6rem] font-bold tracking-wider inline-flex items-center gap-1 ${getStatusColor(quote.status)} ${expired ? 'opacity-75' : ''}`}>
                              <StatusIcon size={12} />
                              {quote.status}
                            </div>
                          </div>

                          <button
                            onClick={() => handleViewQuote(quote.quoteId)}
                            className="px-4 py-2 bg-black text-white font-display text-[0.6rem] font-bold tracking-widest hover:bg-neutral-800 transition-colors flex items-center gap-2"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRejectModal(false)}
            />
            <div className="relative w-full max-w-md bg-white border border-black shadow-2xl p-8">
              <h3 className="font-display text-xl font-bold tracking-tight uppercase mb-4">
                Reject Quote
              </h3>
              <p className="text-sm text-neutral-600 mb-6">
                Please provide a reason for rejecting this quote. This helps us improve our service.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-4 py-3 border border-outline-variant focus:outline-none focus:border-black font-display text-sm mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-display text-xs font-bold tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Quote'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={actionLoading}
                  className="px-6 py-3 border border-black font-display text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerQuotesPage;
