const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./database.cjs');

// JWT_SECRET must be set in production (WR-03 fix)
// Use default only in development for convenience
const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? null : 'dev-secret-do-not-use-in-production');

if (!process.env.JWT_SECRET) {
  if (isProduction) {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  console.warn('WARNING: Using default JWT secret for development only. Set JWT_SECRET environment variable.');
}

const JWT_EXPIRY = '7d'; // Token expires in 7 days

/**
 * Generate JWT token with tenant claims
 * @param {string} userId - User UUID
 * @param {string} tenantId - Tenant UUID
 * @param {string} tenantSlug - Tenant unique slug
 * @param {string} role - User role (owner, admin, member)
 * @returns {string} JWT token
 */
function generateTenantToken(userId, tenantId, tenantSlug, role) {
  return jwt.sign(
    {
      userId,
      tenantId,
      tenantSlug,
      role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verify JWT token and extract claims
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token payload or null if invalid
 */
function verifyTenantToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to verify tenant token and attach user+tenant to request
 * Sets req.user with { userId, tenantId, tenantSlug, role }
 */
function authenticateTenantToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Token required.'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyTenantToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }

  // Attach user and tenant info to request
  req.user = {
    userId: decoded.userId,
    tenantId: decoded.tenantId,
    tenantSlug: decoded.tenantSlug,
    role: decoded.role
  };

  next();
}

/**
 * Hash password using bcrypt (10 salt rounds per AUTH-06, D-14)
 * Reuses existing pattern from auth.cjs
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Password hash
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored password hash
 * @returns {Promise<boolean>} True if password matches
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Verify tenant user exists and belongs to correct tenant
 * @param {string} tenantId - Tenant UUID
 * @param {string} userId - User UUID
 * @returns {Promise<object|null>} User record or null if not found
 */
async function verifyTenantUser(tenantId, userId) {
  try {
    const result = await query(
      `SELECT id, email, role, status FROM tenant_users
       WHERE id = $1 AND tenant_id = $2 AND status = 'ACTIVE'`,
      [userId, tenantId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Verify tenant user error:', error);
    return null;
  }
}

module.exports = {
  generateTenantToken,
  verifyTenantToken,
  authenticateTenantToken,
  hashPassword,
  comparePassword,
  verifyTenantUser
};
