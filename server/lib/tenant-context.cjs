const { AsyncLocalStorage } = require('async_hooks');

/**
 * AsyncLocalStorage instance for tenant context
 * Stores { tenantId, tenantSlug, userId, role } for current request
 */
const tenantContext = new AsyncLocalStorage();

/**
 * Get current tenant ID from AsyncLocalStorage context
 * @returns {string|undefined} Tenant UUID or undefined if not in request context
 */
function getTenantId() {
  return tenantContext.getStore()?.tenantId;
}

/**
 * Get full tenant context from AsyncLocalStorage
 * @returns {object|undefined} Context object { tenantId, tenantSlug, userId, role } or undefined
 */
function getTenantContext() {
  return tenantContext.getStore();
}

/**
 * Express middleware to extract tenant from JWT and store in AsyncLocalStorage
 * Must be used AFTER authenticateTenantToken middleware
 * Sets PostgreSQL session variables for RLS policies (WR-02 fix)
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next callback
 */
async function tenantMiddleware(req, res, next) {
  const { query } = require('./database.cjs');

  const tenantData = {
    tenantId: req.user?.tenantId,
    tenantSlug: req.user?.tenantSlug,
    userId: req.user?.userId,
    role: req.user?.role
  };

  // Set PostgreSQL session variables for RLS policies before processing request
  if (tenantData.tenantId) {
    try {
      await query('SELECT set_config($1, $2, true)', ['app.current_tenant', tenantData.tenantId]);
      if (tenantData.role) {
        await query('SELECT set_config($1, $2, true)', ['app.user_role', tenantData.role]);
      }
    } catch (error) {
      console.error('Failed to set tenant context:', error);
    }
  }

  tenantContext.run(tenantData, () => {
    next();
  });
}

/**
 * Execute a function with explicit tenant context (for background jobs/tests)
 * @param {object} context - Tenant context { tenantId, tenantSlug, userId, role }
 * @param {function} fn - Function to execute
 * @returns {any} Result of fn()
 */
function runInTenantContext(context, fn) {
  return tenantContext.run(context, fn);
}

module.exports = {
  tenantContext,
  getTenantId,
  getTenantContext,
  tenantMiddleware,
  runInTenantContext
};
