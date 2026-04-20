const fs = require('fs');
const path = require('path');
const { query } = require('./database.cjs');
const { getTenantId } = require('./tenant-context.cjs');

/**
 * ModuleRegistry - Discover and manage platform modules
 *
 * Modules are discovered from server/modules directory at startup.
 * Each module must have:
 * - manifest.json: metadata (name, version, dependencies, routePrefix)
 * - index.cjs: exports register(app, db) function
 */
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.sortedOrder = [];
  }

  /**
   * Discover and load all modules from filesystem
   * Scans server/modules directory for subdirectories with manifest.json and index.cjs
   * @param {string} modulePath - Absolute path to modules directory
   * @returns {string[]} Array of module names in dependency order
   */
  discoverModules(modulePath) {
    if (!fs.existsSync(modulePath)) {
      console.log('[modules] No modules directory found at', modulePath);
      return [];
    }

    const entries = fs.readdirSync(modulePath, { withFileTypes: true });
    const moduleDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));

    for (const dir of moduleDirs) {
      const manifestPath = path.join(modulePath, dir.name, 'manifest.json');
      const indexPath = path.join(modulePath, dir.name, 'index.cjs');

      if (fs.existsSync(manifestPath) && fs.existsSync(indexPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const moduleExports = require(indexPath);

          this.modules.set(manifest.name, {
            manifest,
            exports: moduleExports,
            path: path.join(modulePath, dir.name)
          });

          console.log(`[modules] Discovered: ${manifest.name} v${manifest.version}`);
        } catch (error) {
          console.error(`[modules] Failed to load module ${dir.name}:`, error.message);
        }
      }
    }

    this.sortedOrder = this.sortModulesByDependency();
    return this.sortedOrder;
  }

  /**
   * Topological sort of modules by dependencies (Kahn's algorithm)
   * Ensures modules load after their dependencies
   * @returns {string[]} Array of module names in dependency order
   */
  sortModulesByDependency() {
    const graph = {};
    const inDegree = {};

    // Initialize graph and in-degree map (WR-07 fix: correct in-degree calculation)
    for (const [name, module] of this.modules.entries()) {
      const deps = module.manifest.dependencies || [];
      graph[name] = deps;
      // In-degree = number of dependencies this module has
      inDegree[name] = deps.length;
    }

    // Queue of modules with no incoming edges
    const queue = Object.keys(inDegree).filter(n => inDegree[n] === 0);
    const sorted = [];

    while (queue.length > 0) {
      const node = queue.shift();
      sorted.push(node);

      // Reduce in-degree for dependent modules
      for (const [name, deps] of Object.entries(graph)) {
        if (deps.includes(node)) {
          inDegree[name]--;
          if (inDegree[name] === 0) {
            queue.push(name);
          }
        }
      }
    }

    // Check for cycles
    if (sorted.length !== this.modules.size) {
      throw new Error('Circular dependency detected in modules');
    }

    return sorted;
  }

  /**
   * Register all modules in dependency order
   * Calls each module's register(app, db) function
   * @param {object} app - Express app instance
   * @param {object} db - Database connection pool
   */
  async registerAll(app, db) {
    console.log(`[modules] Registering ${this.sortedOrder.length} modules...`);

    for (const moduleName of this.sortedOrder) {
      const module = this.modules.get(moduleName);
      if (module?.exports.register) {
        try {
          await module.exports.register(app, db);
          console.log(`[modules] ✓ Registered: ${moduleName}`);
        } catch (error) {
          console.error(`[modules] ✗ Failed to register ${moduleName}:`, error.message);
        }
      }
    }
  }

  /**
   * Get module by name
   * @param {string} name - Module name
   * @returns {object|null} Module object or null
   */
  getModule(name) {
    return this.modules.get(name) || null;
  }

  /**
   * Get all loaded modules
   * @returns {Map} Map of module name to module object
   */
  getAllModules() {
    return this.modules;
  }
}

/**
 * Middleware to check if tenant has module activated
 * Queries tenant_modules table and returns 403 if not active
 * @param {string} moduleName - Name of module to check
 * @returns {function} Express middleware
 */
function requireModule(moduleName) {
  return async (req, res, next) => {
    const tenantId = getTenantId();

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Tenant context required.'
      });
    }

    try {
      const result = await query(
        `SELECT active FROM tenant_modules
         WHERE tenant_id = $1 AND module_name = $2`,
        [tenantId, moduleName]
      );

      if (result.rows.length === 0 || !result.rows[0].active) {
        return res.status(403).json({
          success: false,
          error: `Module '${moduleName}' is not active for your tenant. Please enable it in your account settings.`,
          module: moduleName
        });
      }

      next();
    } catch (error) {
      console.error('Module check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify module access'
      });
    }
  };
}

// Singleton instance
const registry = new ModuleRegistry();

module.exports = {
  registry,
  requireModule
};
