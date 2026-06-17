/**
 * Customer Quotes API Routes
 * Handles quote listing, details, approval, and rejection for customers
 */

const express = require('express');
const { query } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');
const { syncQuoteDecisionToTwenty } = require('../lib/twenty-portal-sync.cjs');

const router = express.Router();

/**
 * Look up contact details for a quote and push the customer's decision to Twenty CRM.
 * Non-blocking — errors are logged and never affect the portal response.
 */
async function pushQuoteDecision(quoteId, decision, reason) {
  try {
    const info = await query(
      `SELECT q.amount,
              COALESCE(l.email, c.email)           AS email,
              COALESCE(l.first_name, c.first_name) AS first_name,
              COALESCE(l.last_name, c.last_name)   AS last_name,
              l.service_interest                   AS service_type,
              COALESCE(l.address, c.address)       AS address
       FROM quotes q
       LEFT JOIN leads l ON q.lead_id = l.id
       LEFT JOIN customers c ON q.customer_id = c.customer_id
       WHERE q.id = $1`,
      [quoteId]
    );
    if (info.rows.length === 0) return;
    const r = info.rows[0];
    syncQuoteDecisionToTwenty({
      decision,
      quoteId,
      amount: r.amount != null ? parseFloat(r.amount) : null,
      reason: reason || null,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      serviceType: r.service_type,
      address: r.address,
    }).catch(err => console.error(`[customer-quotes] Twenty sync (${decision}) failed:`, err.message));
  } catch (err) {
    console.error(`[customer-quotes] Twenty sync prep (${decision}) failed:`, err.message);
  }
}

/**
 * GET /api/customer/quotes
 * List all quotes for the authenticated customer
 */
router.get('/quotes', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;

    const result = await query(
      `SELECT
        q.id,
        q.lead_id,
        q.amount,
        q.status,
        q.valid_until,
        q.notes,
        q.created_at,
        q.customer_id,
        q.issued_date,
        q.expiry_date,
        q.approved_at,
        q.rejected_at,
        l.first_name,
        l.last_name,
        l.address,
        l.suburb
       FROM quotes q
       LEFT JOIN leads l ON q.lead_id = l.id
       WHERE q.customer_id = $1
       ORDER BY q.created_at DESC`,
      [customerId]
    );

    const quotes = result.rows.map(row => ({
      id: row.id,
      leadId: row.lead_id,
      amount: parseFloat(row.amount),
      status: row.status,
      validUntil: row.valid_until,
      notes: row.notes,
      createdAt: row.created_at,
      customerId: row.customer_id,
      issuedDate: row.issued_date,
      expiryDate: row.expiry_date,
      approvedAt: row.approved_at,
      rejectedAt: row.rejected_at,
      canApprove: row.status === 'SENT' && new Date(row.expiry_date) > new Date(),
      canReject: row.status === 'SENT' && new Date(row.expiry_date) > new Date(),
      isExpired: new Date(row.expiry_date) < new Date(),
      lead: row.lead_id ? {
        firstName: row.first_name,
        lastName: row.last_name,
        address: row.address,
        suburb: row.suburb
      } : null
    }));

    res.json({
      success: true,
      quotes
    });
  } catch (error) {
    console.error('List quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching quotes'
    });
  }
});

/**
 * GET /api/customer/quotes/:id
 * Get detailed quote information
 */
router.get('/quotes/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;
    const quoteId = req.params.id;

    // Get quote details and verify ownership
    const result = await query(
      `SELECT
        q.id,
        q.lead_id,
        q.amount,
        q.status,
        q.valid_until,
        q.notes,
        q.created_at,
        q.customer_id,
        q.issued_date,
        q.expiry_date,
        q.approved_at,
        q.rejected_at,
        l.first_name,
        l.last_name,
        l.email,
        l.phone,
        l.address,
        l.suburb,
        l.postcode,
        l.service_interest
       FROM quotes q
       LEFT JOIN leads l ON q.lead_id = l.id
       WHERE q.id = $1`,
      [quoteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    const quote = result.rows[0];

    // Verify ownership
    if (quote.customer_id !== customerId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this quote'
      });
    }

    const isExpired = new Date(quote.expiry_date) < new Date();
    const canApprove = quote.status === 'SENT' && !isExpired;
    const canReject = quote.status === 'SENT' && !isExpired;

    res.json({
      success: true,
      quote: {
        id: quote.id,
        leadId: quote.lead_id,
        amount: parseFloat(quote.amount),
        status: quote.status,
        validUntil: quote.valid_until,
        notes: quote.notes,
        createdAt: quote.created_at,
        issuedDate: quote.issued_date,
        expiryDate: quote.expiry_date,
        approvedAt: quote.approved_at,
        rejectedAt: quote.rejected_at,
        isExpired,
        canApprove,
        canReject,
        lead: quote.lead_id ? {
          firstName: quote.first_name,
          lastName: quote.last_name,
          email: quote.email,
          phone: quote.phone,
          address: quote.address,
          suburb: quote.suburb,
          postcode: quote.postcode,
          serviceInterest: quote.service_interest
        } : null
      }
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching the quote'
    });
  }
});

/**
 * POST /api/customer/quotes/:id/approve
 * Approve a quote
 */
router.post('/quotes/:id/approve', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;
    const quoteId = req.params.id;
    const { reason } = req.body;

    // Get quote and verify ownership
    const quoteResult = await query(
      `SELECT id, customer_id, status, expiry_date
       FROM quotes
       WHERE id = $1`,
      [quoteId]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    const quote = quoteResult.rows[0];

    // Verify ownership
    if (quote.customer_id !== customerId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this quote'
      });
    }

    // Check if quote can be approved
    if (quote.status !== 'SENT') {
      return res.status(400).json({
        success: false,
        error: `Quote cannot be approved. Current status: ${quote.status}`
      });
    }

    const isExpired = new Date(quote.expiry_date) < new Date();
    if (isExpired) {
      return res.status(400).json({
        success: false,
        error: 'This quote has expired. Please contact us for a new quote.'
      });
    }

    // Approve quote
    await query(
      `UPDATE quotes
       SET status = 'ACCEPTED',
           approved_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [quoteId]
    );

    // Create approval record
    await query(
      `INSERT INTO quote_approvals (quote_id, customer_id, action, reason, actioned_ip)
       VALUES ($1, $2, 'APPROVED', $3, $4)`,
      [quoteId, customerId, reason || null, req.ip || req.connection.remoteAddress]
    );

    // Log approval
    await query(
      `INSERT INTO audit_log (customer_id, action, details)
       VALUES ($1, 'QUOTE_APPROVE', $2)`,
      [customerId, JSON.stringify({ quoteId, reason })]
    );

    // Sync the approval to Twenty CRM (non-blocking): moves the Opportunity to CUSTOMER (won).
    pushQuoteDecision(quoteId, 'approve', reason);

    res.json({
      success: true,
      message: 'Quote approved successfully'
    });
  } catch (error) {
    console.error('Approve quote error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while approving the quote'
    });
  }
});

/**
 * POST /api/customer/quotes/:id/reject
 * Reject a quote
 */
router.post('/quotes/:id/reject', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;
    const quoteId = req.params.id;
    const { reason } = req.body;

    // Get quote and verify ownership
    const quoteResult = await query(
      `SELECT id, customer_id, status, expiry_date
       FROM quotes
       WHERE id = $1`,
      [quoteId]
    );

    if (quoteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Quote not found'
      });
    }

    const quote = quoteResult.rows[0];

    // Verify ownership
    if (quote.customer_id !== customerId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this quote'
      });
    }

    // Check if quote can be rejected
    if (quote.status !== 'SENT') {
      return res.status(400).json({
        success: false,
        error: `Quote cannot be rejected. Current status: ${quote.status}`
      });
    }

    const isExpired = new Date(quote.expiry_date) < new Date();
    if (isExpired) {
      return res.status(400).json({
        success: false,
        error: 'This quote has expired. Please contact us for a new quote.'
      });
    }

    // Reject quote
    await query(
      `UPDATE quotes
       SET status = 'REJECTED',
           rejected_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [quoteId]
    );

    // Create rejection record
    await query(
      `INSERT INTO quote_approvals (quote_id, customer_id, action, reason, actioned_ip)
       VALUES ($1, $2, 'REJECTED', $3, $4)`,
      [quoteId, customerId, reason || null, req.ip || req.connection.remoteAddress]
    );

    // Log rejection
    await query(
      `INSERT INTO audit_log (customer_id, action, details)
       VALUES ($1, 'QUOTE_REJECT', $2)`,
      [customerId, JSON.stringify({ quoteId, reason })]
    );

    // Sync the rejection to Twenty CRM (non-blocking): logs a Note on the Opportunity/Person.
    pushQuoteDecision(quoteId, 'reject', reason);

    res.json({
      success: true,
      message: 'Quote rejected successfully'
    });
  } catch (error) {
    console.error('Reject quote error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while rejecting the quote'
    });
  }
});

module.exports = router;
