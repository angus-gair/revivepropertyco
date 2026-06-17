const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('./database.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

/**
 * Generate JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to check if token is valid
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Token required.'
    });
  }

  const token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix and trim
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Token required.'
    });
  }

  // Try admin token verification first
  let decoded = verifyToken(token);

  // If not valid admin token, try tenant platform token verification
  if (!decoded) {
    try {
      const { verifyTenantToken } = require('./auth-platform.cjs');
      const decodedTenant = verifyTenantToken(token);
      if (decodedTenant) {
        decoded = {
          userId: decodedTenant.userId,
          tenantId: decodedTenant.tenantId,
          tenantSlug: decodedTenant.tenantSlug,
          role: decodedTenant.role
        };
      }
    } catch (error) {
      console.error('[auth] Error during tenant token verification:', error);
    }
  }

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }

  req.user = decoded;
  next();
}

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  hashPassword,
  comparePassword
};
