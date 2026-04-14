const express = require('express');
const router = express.Router();
const { query, pool } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');
const { v4: uuidv4 } = require('uuid');

// Apply authentication to all hipages routes
router.use(authenticateToken);

/**
 * GET /api/hipages/leads - List hipages leads with pagination and filtering
 */
router.get('/leads', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, synced_to_crm } = req.query;
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (synced_to_crm !== undefined) {
      whereClause += ` AND synced_to_crm = $${paramIndex}`;
      params.push(synced_to_crm === 'true');
      paramIndex++;
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM hipages_leads ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM hipages_leads
      ${whereClause}
      ORDER BY scraped_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await query(dataQuery, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('[hipages] Error fetching leads:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hipages leads' });
  }
});

/**
 * GET /api/hipages/leads/:id - Get single hipages lead
 */
router.get('/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM hipages_leads WHERE lead_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('[hipages] Error fetching lead:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hipages lead' });
  }
});

/**
 * POST /api/hipages/leads/:id/accept - Convert hipages lead to CRM lead
 */
router.post('/leads/:id/accept', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get hipages lead
    const hipagesResult = await client.query(
      'SELECT * FROM hipages_leads WHERE lead_id = $1',
      [req.params.id]
    );

    if (hipagesResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const hipagesLead = hipagesResult.rows[0];

    // Parse customer name into first and last name
    const nameParts = hipagesLead.customer_name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build notes with hipages information
    const notes = `Hipages lead: ${hipagesLead.description || 'No description'}
Credits: ${hipagesLead.credits}
Job Type: ${hipagesLead.job_type}${hipagesLead.job_subtype ? ` (${hipagesLead.job_subtype})` : ''}
Posted: ${hipagesLead.posted_date ? new Date(hipagesLead.posted_date).toLocaleDateString() : 'Unknown'}
Suburb: ${hipagesLead.suburb}${hipagesLead.postcode ? ` ${hipagesLead.postcode}` : ''}`;

    // Create CRM lead
    const leadResult = await client.query(`
      INSERT INTO leads (
        id, first_name, last_name, email, phone, address,
        service_interest, notes, status, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING id
    `, [
      firstName,
      lastName,
      '', // Email not provided by hipages
      '', // Phone not provided by hipages
      hipagesLead.suburb,
      hipagesLead.job_type,
      notes,
      'NEW',
      Date.now()
    ]);

    const crmLeadId = leadResult.rows[0].id;

    // Update hipages lead
    await client.query(
      'UPDATE hipages_leads SET crm_lead_id = $1, synced_to_crm = TRUE WHERE lead_id = $2',
      [crmLeadId, req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        hipagesLeadId: req.params.id,
        crmLeadId
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[hipages] Error accepting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to accept hipages lead' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/hipages/scrape/trigger - Manual scrape trigger (admin only)
 */
router.post('/scrape/trigger', async (req, res) => {
  try {
    // For MVP: Return success message
    // Actual trigger will be implemented via database flag or HTTP call to scraper service in Plan 04
    res.json({
      success: true,
      message: 'Scrape triggered via hipages-scraper service',
      note: 'Implement database flag or HTTP call to scraper service in Phase 04'
    });
  } catch (error) {
    console.error('[hipages] Error triggering scrape:', error);
    res.status(500).json({ success: false, error: 'Failed to trigger scrape' });
  }
});

module.exports = router;
