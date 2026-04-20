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
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next callback
 */
function tenantMiddleware(req, res, next) {
  const tenantData = {
    tenantId: req.user?.tenantId,
    tenantSlug: req.user?.tenantSlug,
    userId: req.user?.userId,
    role: req.user?.role
  };

  tenantContext.run(tenantData, () => {
    // Set PostgreSQL session variable for RLS policies
    if (tenantData.tenantId) {
      // Store in AsyncLocalStorage for app-layer access
      // PostgreSQL session variable set per-request in database queries
    }
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
