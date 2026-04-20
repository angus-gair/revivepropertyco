const express = require('express');
const { query } = require('../../lib/database.cjs');
const { authenticateTenantToken, tenantMiddleware } = require('../../lib/auth-platform.cjs');
const { getTenantId } = require('../../lib/tenant-context.cjs');

/**
 * Register core module routes
 * @param {object} app - Express app instance
 * @param {object} db - Database connection pool
 */
async function register(app, db) {
  const router = express.Router();

  // Apply authentication to all core routes
  router.use(authenticateTenantToken);
  router.use(tenantMiddleware);

  /**
   * GET /api/core/settings
   * Get tenant settings
   */
  router.get('/settings', async (req, res) => {
    try {
      const tenantId = getTenantId();

      const result = await query(
        `SELECT id, name, slug, plan, status, created_at
         FROM tenants
         WHERE id = $1`,
        [tenantId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Tenant not found'
        });
      }

      res.json({
        success: true,
        settings: result.rows[0]
      });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch settings'
      });
    }
  });

  /**
   * GET /api/core/modules
   * List all available modules
   */
  router.get('/modules', async (req, res) => {
    try {
      const tenantId = getTenantId();

      // Get all registered modules from registry
      const { registry } = require('../../lib/modules.cjs');
      const allModules = registry.getAllModules();

      // Get tenant's active modules
      const activeResult = await query(
        `SELECT module_name, active, activated_at
         FROM tenant_modules
         WHERE tenant_id = $1`,
        [tenantId]
      );

      const activeMap = new Map(
        activeResult.rows.map(row => [row.module_name, row])
      );

      const modules = [];
      for (const [name, module] of allModules.entries()) {
        const manifest = module.manifest;
        const activation = activeMap.get(name);

        modules.push({
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          routePrefix: manifest.routePrefix,
          dependencies: manifest.dependencies || [],
          active: !!activation?.active,
          activatedAt: activation?.activated_at || null
        });
      }

      res.json({
        success: true,
        modules
      });
    } catch (error) {
      console.error('List modules error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list modules'
      });
    }
  });

  // Mount router at module's route prefix
  app.use('/api/core', router);

  console.log('[modules/core] Registered routes at /api/core');
}

module.exports = {
  register
};
