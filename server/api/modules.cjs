/**
 * Platform Modules API Routes
 * Lets a tenant view and toggle the platform modules (features) available to
 * their workspace. Activation state is stored in the tenant_modules table
 * (migration 003) and enforced elsewhere by lib/modules.cjs requireModule().
 */

const express = require('express');
const { query } = require('../lib/database.cjs');
const { authenticateTenantToken } = require('../lib/auth-platform.cjs');
const { getTenantId, tenantMiddleware } = require('../lib/tenant-context.cjs');

const router = express.Router();

/**
 * Catalogue of platform modules a tenant can enable. Keyed by the module_name
 * stored in tenant_modules. Kept in code (rather than a registry scan) because
 * the filesystem ModuleRegistry is not wired into the server yet.
 */
const MODULE_CATALOG = [
  {
    name: 'crm',
    label: 'CRM',
    description: 'Leads, appointments, tasks and pipeline management.',
    defaultActive: true
  },
  {
    name: 'bookings',
    label: 'Online Bookings',
    description: 'Public booking widget with availability and quote requests.',
    defaultActive: true
  },
  {
    name: 'ai-quotes',
    label: 'AI Quotes (Riv)',
    description: 'AI concierge that generates instant quotes from chat.',
    defaultActive: true
  },
  {
    name: 'hipages-leads',
    label: 'hipages Leads',
    description: 'Automated hipages lead scraping and sync into the CRM.',
    defaultActive: false
  },
  {
    name: 'customer-portal',
    label: 'Customer Portal',
    description: 'Self-service portal for customers to view and approve quotes.',
    defaultActive: false
  }
];

/**
 * GET /api/modules
 * List the module catalogue with this tenant's activation state.
 * Auth: Bearer tenant token.
 */
router.get('/', authenticateTenantToken, tenantMiddleware, async (req, res) => {
  try {
    const tenantId = getTenantId();

    const result = await query(
      'SELECT module_name, active FROM tenant_modules WHERE tenant_id = $1',
      [tenantId]
    );

    const stateByName = new Map(result.rows.map(r => [r.module_name, r.active]));

    const modules = MODULE_CATALOG.map(m => ({
      name: m.name,
      label: m.label,
      description: m.description,
      // Fall back to the module's default when the tenant has no explicit row.
      active: stateByName.has(m.name) ? stateByName.get(m.name) : m.defaultActive
    }));

    res.json({ success: true, modules });
  } catch (error) {
    console.error('List modules error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch modules'
    });
  }
});

/**
 * PUT /api/modules/:moduleName
 * Activate or deactivate a module for the current tenant (owner/admin only).
 * Body: { active: boolean }
 */
router.put('/:moduleName', authenticateTenantToken, tenantMiddleware, async (req, res) => {
  try {
    const tenantId = getTenantId();
    const userId = req.user.userId;
    const { moduleName } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Body must include "active" as a boolean'
      });
    }

    // Module must be a known catalogue entry
    if (!MODULE_CATALOG.some(m => m.name === moduleName)) {
      return res.status(404).json({
        success: false,
        error: 'Unknown module'
      });
    }

    // Only owners and admins can change module activation
    const userResult = await query(
      'SELECT role FROM tenant_users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    if (userResult.rows.length === 0 ||
        (userResult.rows[0].role !== 'owner' && userResult.rows[0].role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Only owners and admins can change modules'
      });
    }

    // Upsert the tenant_modules row
    await query(
      `INSERT INTO tenant_modules (tenant_id, module_name, active)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, module_name)
       DO UPDATE SET active = EXCLUDED.active`,
      [tenantId, moduleName, active]
    );

    res.json({
      success: true,
      message: `Module '${moduleName}' ${active ? 'enabled' : 'disabled'}`,
      module: { name: moduleName, active }
    });
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update module'
    });
  }
});

module.exports = router;
