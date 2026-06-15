const express = require('express');
const router = express.Router();
const { query, pool } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');
const { resolveTenantId } = require('../lib/tenant-context.cjs');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /api/hipages/debug - Debug endpoint (no auth required)
 */
router.get('/debug', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM hipages_leads');
    res.json({
      success: true,
      message: 'Hipages API is working',
      database: 'Connected',
      totalLeads: result.rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/hipages/test - Test endpoint (no auth)
 */
router.get('/test', async (req, res) => {
  res.json({ success: true, message: 'Test endpoint works!' });
});

/**
 * GET /api/hipages/image - Proxy hipages images to bypass CORS
 */
router.get('/image', async (req, res) => {
  try {
    console.log('[hipages] Image proxy called with URL:', req.query.url?.substring(0, 50));
    const { url } = req.query;

    // Security: Validate URL is from hipagesusercontent.com
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Allow only hipagesusercontent.com URLs
    if (!url.startsWith('https://attachments.hipagesusercontent.com/') &&
        !url.startsWith('http://attachments.hipagesusercontent.com/')) {
      return res.status(403).json({ error: 'Invalid URL domain' });
    }

    // Fetch image from hipages CDN
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RevivePropertyCo/1.0)'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch image: ${response.statusText}`
      });
    }

    // Get content type from response
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    // Set content type and cache headers
    // Note: Do NOT manually set Access-Control-Allow-Origin here.
    // The global cors() middleware in server/index.cjs already sets the correct
    // origin-specific CORS headers. Setting a wildcard here would conflict with
    // the credentials header and cause browsers to reject the image (black rectangle).
    res.setHeader('Content-Type', contentType);

    // Cache for 1 year (images don't change)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Pipe image data to response
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

    console.log(`[hipages] Proxied image: ${url} (${contentType})`);
  } catch (error) {
    console.error('[hipages] Error proxying image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

/**
 * GET /api/hipages/noauth/leads - Public hipages leads endpoint (no auth required)
 */
router.get('/noauth/leads', async (req, res) => {
  try {
    const { page = 1, limit = 10000, status, synced_to_crm } = req.query;
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
    console.error('[hipages] Error fetching leads (noauth):', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hipages leads' });
  }
});

// Apply authentication to all other hipages routes
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
        service_interest, notes, status, created_at, tenant_id
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
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
      Date.now(),
      resolveTenantId(req) // scraped leads belong to the Revive (default) tenant
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
 * POST /api/hipages/leads/:id/promote-opportunity - Promote hipages lead to Twenty CRM Opportunity
 */
router.post('/leads/:id/promote-opportunity', async (req, res) => {
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

    if (hipagesLead.synced_to_crm) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Lead has already been promoted' });
    }

    // Try to get dynamic workspace/token for tenant if authenticated
    let apiToken = process.env.TWENTY_API_TOKEN;
    let serverUrl = process.env.TWENTY_SERVER_URL || 'http://twenty:3000';

    if (req.user && req.user.tenantId) {
      const workspaceResult = await client.query(
        'SELECT * FROM twenty_workspaces WHERE tenant_id = $1',
        [req.user.tenantId]
      );
      if (workspaceResult.rows.length > 0) {
        const workspace = workspaceResult.rows[0];
        serverUrl = workspace.server_url;
        // get decrypted token
        const { getToken } = require('../lib/twenty-token-storage.cjs');
        const tokenData = await getToken(req.user.tenantId, workspace.workspace_id, 'API');
        if (tokenData) {
          apiToken = tokenData.token;
        }
      }
    }

    // If no apiToken is configured, return error
    if (!apiToken || apiToken === 'generate-after-twenty-setup') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Twenty CRM integration is not configured. Please set TWENTY_API_TOKEN.'
      });
    }

    // Parse customer name into first and last name
    const nameParts = hipagesLead.customer_name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Initialize Twenty client
    const { TwentyClient } = require('../lib/twenty-client.cjs');
    const twentyClient = new TwentyClient(apiToken, serverUrl);

    // 1. Search or create Person in Twenty
    let personId;
    try {
      const existingPerson = await twentyClient.findPersonByName(firstName, lastName);
      if (existingPerson) {
        personId = existingPerson.id;
      } else {
        const newPerson = await twentyClient.createPerson({
          firstName,
          lastName,
          email: undefined,
          phone: undefined
        });
        personId = newPerson.id;
      }
    } catch (err) {
      console.error('[hipages] Error checking/creating Person in Twenty:', err);
      throw new Error(`Twenty CRM Person matching failed: ${err.message}`);
    }

    // 2. Create Opportunity in Twenty linked to Person
    const optName = `${hipagesLead.job_type} - ${hipagesLead.customer_name} - ${hipagesLead.suburb}`;
    const creditsCost = parseInt(hipagesLead.credits) || 0;
    const amountVal = creditsCost * 20;
    const amountAmountMicros = amountVal * 1000000;

    let opportunityId;
    try {
      const newOpt = await twentyClient.createOpportunity({
        name: optName,
        amountAmountMicros,
        amountCurrencyCode: 'AUD',
        stage: 'NEW',
        pointOfContactId: personId
      });
      opportunityId = newOpt.id;
    } catch (err) {
      console.error('[hipages] Error creating Opportunity in Twenty:', err);
      throw new Error(`Twenty CRM Opportunity creation failed: ${err.message}`);
    }

    // 3. Create Note in Twenty linked to Opportunity
    const postedStr = hipagesLead.posted_date ? new Date(hipagesLead.posted_date).toISOString() : 'Unknown';
    const noteMarkdown = `### Hipages Lead Details
- **Lead ID:** ${hipagesLead.lead_id}
- **Job Type:** ${hipagesLead.job_type}${hipagesLead.job_subtype ? ` (${hipagesLead.job_subtype})` : ''}
- **Description:** ${hipagesLead.description || 'No description'}
- **Location:** ${hipagesLead.suburb}${hipagesLead.postcode ? ` ${hipagesLead.postcode}` : ''}
- **Credits:** ${hipagesLead.credits}
- **Status:** ${hipagesLead.status}
- **Contact Status:** ${hipagesLead.contact_status || 'Unknown'}
- **Posted Date:** ${postedStr}`;

    try {
      await twentyClient.createNote({
        body: noteMarkdown,
        noteTargets: {
          create: [
            {
              opportunityId
            }
          ]
        }
      });
    } catch (err) {
      console.warn('[hipages] Warning: Failed to create note in Twenty for Opportunity:', err.message);
    }

    // Update local database hipages_leads
    await client.query(
      'UPDATE hipages_leads SET synced_to_crm = TRUE, crm_opportunity_id = $1 WHERE lead_id = $2',
      [opportunityId, req.params.id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        hipagesLeadId: req.params.id,
        crmOpportunityId: opportunityId,
        personId
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[hipages] Error promoting lead to CRM Opportunity:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to promote lead' });
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
