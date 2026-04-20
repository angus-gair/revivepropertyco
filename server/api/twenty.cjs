// server/api/twenty.cjs
// Platform API endpoints for Twenty CRM workspace and schema management

const express = require('express');
const router = express.Router();
const { query } = require('../lib/database.cjs');
const { authenticateTenantToken } = require('../lib/auth-platform.cjs');
const { tenantMiddleware } = require('../lib/tenant-context.cjs');
const { TwentyClient } = require('../lib/twenty-client.cjs');
const { setupWorkspaceSchema } = require('../lib/twenty-schema.cjs');
const { storeToken, getToken, listTokens } = require('../lib/twenty-token-storage.cjs');

// Apply tenant authentication to all routes
router.use(authenticateTenantToken);
router.use(tenantMiddleware);

/**
 * POST /api/twenty/workspaces/register
 * Register a Twenty workspace for the current tenant
 * Body: { twentyWorkspaceId, twentyWorkspaceName, serverUrl, apiToken }
 */
router.post('/workspaces/register', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { twentyWorkspaceId, twentyWorkspaceName, twentyWorkspaceSlug, serverUrl, apiToken } = req.body;

    if (!twentyWorkspaceId || !serverUrl || !apiToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: twentyWorkspaceId, serverUrl, apiToken'
      });
    }

    // Verify the API token by testing connection to Twenty
    const twentyClient = new TwentyClient(apiToken, serverUrl);
    const testResult = await twentyClient.testConnection();

    if (!testResult.success) {
      return res.status(401).json({
        success: false,
        error: 'Failed to connect to Twenty CRM. Check API token and server URL.'
      });
    }

    // Check if workspace already exists for this tenant
    const existingResult = await query(
      'SELECT * FROM twenty_workspaces WHERE tenant_id = $1',
      [tenantId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Workspace already registered for this tenant'
      });
    }

    // Create workspace record
    const workspaceResult = await query(
      `INSERT INTO twenty_workspaces (tenant_id, twenty_workspace_id, twenty_workspace_name, twenty_workspace_slug, server_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tenantId, twentyWorkspaceId, twentyWorkspaceName, twentyWorkspaceSlug || null, serverUrl]
    );

    const workspace = workspaceResult.rows[0];

    // Store API token (encrypted)
    await storeToken(tenantId, workspace.workspace_id, 'API', apiToken, 'Default API token');

    // Setup custom objects in Twenty workspace
    const schemaResult = await setupWorkspaceSchema(twentyClient);

    if (!schemaResult.success) {
      console.error('[twenty] Schema setup failed:', schemaResult.error);
      // Don't fail registration, but log error
    }

    res.status(201).json({
      success: true,
      workspace: {
        id: workspace.workspace_id,
        twentyWorkspaceId: workspace.twenty_workspace_id,
        serverUrl: workspace.server_url,
        schemaSetup: schemaResult.success
      }
    });

  } catch (error) {
    console.error('[twenty] Workspace registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register workspace'
    });
  }
});

/**
 * GET /api/twenty/workspaces
 * Get the Twenty workspace for the current tenant
 */
router.get('/workspaces', async (req, res) => {
  try {
    const { tenantId } = req.user;

    const result = await query(
      'SELECT * FROM twenty_workspaces WHERE tenant_id = $1',
      [tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No workspace registered for this tenant'
      });
    }

    res.json({
      success: true,
      workspace: result.rows[0]
    });

  } catch (error) {
    console.error('[twenty] Get workspace error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workspace'
    });
  }
});

/**
 * POST /api/twenty/setup-objects
 * Setup custom objects in the tenant's Twenty workspace
 */
router.post('/setup-objects', async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Get workspace info
    const workspaceResult = await query(
      'SELECT * FROM twenty_workspaces WHERE tenant_id = $1',
      [tenantId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No workspace registered for this tenant'
      });
    }

    const workspace = workspaceResult.rows[0];

    // Get and decrypt API token
    const tokenData = await getToken(tenantId, workspace.workspace_id, 'API');

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        error: 'No API token found for workspace'
      });
    }

    const apiToken = tokenData.token;

    // Create Twenty client and setup schema
    const twentyClient = new TwentyClient(apiToken, workspace.server_url);
    const schemaResult = await setupWorkspaceSchema(twentyClient);

    res.json({
      success: schemaResult.success,
      objects: schemaResult.objects,
      error: schemaResult.error || null
    });

  } catch (error) {
    console.error('[twenty] Setup objects error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup objects'
    });
  }
});

/**
 * POST /api/twenty/test-connection
 * Test connection to tenant's Twenty workspace
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { tenantId } = req.user;

    const workspaceResult = await query(
      'SELECT * FROM twenty_workspaces WHERE tenant_id = $1',
      [tenantId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No workspace registered for this tenant'
      });
    }

    const workspace = workspaceResult.rows[0];

    // Get and decrypt API token
    const tokenData = await getToken(tenantId, workspace.workspace_id, 'API');

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        error: 'No API token found for workspace'
      });
    }

    const apiToken = tokenData.token;
    const twentyClient = new TwentyClient(apiToken, workspace.server_url);
    const testResult = await twentyClient.testConnection();

    res.json({
      success: testResult.success,
      workspaces: testResult.workspaces || null,
      error: testResult.error || null
    });

  } catch (error) {
    console.error('[twenty] Test connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test connection'
    });
  }
});

/**
 * GET /api/twenty/tokens
 * List all tokens for the current tenant (redacted)
 */
router.get('/tokens', async (req, res) => {
  try {
    const { tenantId } = req.tenant;

    const tokens = await listTokens(tenantId);

    res.json({
      success: true,
      tokens
    });

  } catch (error) {
    console.error('[twenty] List tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list tokens'
    });
  }
});

module.exports = router;
