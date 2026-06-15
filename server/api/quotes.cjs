const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../lib/auth.cjs');
const { query } = require('../lib/database.cjs');
const { resolveTenantId } = require('../lib/tenant-context.cjs');

const router = express.Router();

/**
 * GET /api/quotes - Get all quotes (protected)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT q.*, l.first_name, l.last_name, l.email
       FROM quotes q
       JOIN leads l ON q.lead_id = l.id
       WHERE q.tenant_id = $1
       ORDER BY q.created_at DESC`,
      [resolveTenantId(req)]
    );

    res.json({
      success: true,
      quotes: result.rows
    });

  } catch (error) {
    console.error('Quotes fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quotes'
    });
  }
});

/**
 * POST /api/quotes - Create a new quote (protected)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { leadId, amount, notes, validUntil } = req.body;

    if (!leadId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Lead ID and amount are required'
      });
    }

    const quoteId = uuidv4();
    const tenantId = resolveTenantId(req);

    // Only allow quoting a lead that belongs to the caller's tenant.
    const leadCheck = await query(
      `SELECT 1 FROM leads WHERE id = $1 AND tenant_id = $2`,
      [leadId, tenantId]
    );
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    await query(
      `INSERT INTO quotes (id, lead_id, amount, status, valid_until, notes, created_at, tenant_id)
       VALUES ($1, $2, $3, 'DRAFT', $4, $5, NOW() AT TIME ZONE 'UTC', $6)`,
      [quoteId, leadId, amount, validUntil || null, notes || null, tenantId]
    );

    // Fetch the newly created quote with lead details
    const quoteResult = await query(
      `SELECT q.*, l.first_name, l.last_name, l.email
       FROM quotes q
       JOIN leads l ON q.lead_id = l.id
       WHERE q.id = $1 AND q.tenant_id = $2`,
      [quoteId, tenantId]
    );

    res.status(201).json({
      success: true,
      quote: quoteResult.rows[0]
    });

  } catch (error) {
    console.error('Quote creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quote'
    });
  }
});

/**
 * PUT /api/quotes/:id - Update a quote (protected)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const tenantId = resolveTenantId(req);
    const keys = Object.keys(updates);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const idParam = keys.length + 1;
    const tenantParam = keys.length + 2;
    const values = Object.values(updates);

    const updateResult = await query(
      `UPDATE quotes SET ${setClause} WHERE id = $${idParam} AND tenant_id = $${tenantParam}`,
      [...values, id, tenantId]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    // Fetch updated quote
    const result = await query(
      `SELECT q.*, l.first_name, l.last_name, l.email
       FROM quotes q
       JOIN leads l ON q.lead_id = l.id
       WHERE q.id = $1 AND q.tenant_id = $2`,
      [id, tenantId]
    );

    res.json({
      success: true,
      quote: result.rows[0]
    });

  } catch (error) {
    console.error('Quote update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update quote'
    });
  }
});

/**
 * DELETE /api/quotes/:id - Delete a quote (protected)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const del = await query(
      `DELETE FROM quotes WHERE id = $1 AND tenant_id = $2`,
      [id, resolveTenantId(req)]
    );

    if (del.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    res.json({
      success: true,
      message: 'Quote deleted'
    });

  } catch (error) {
    console.error('Quote deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete quote'
    });
  }
});

module.exports = router;
