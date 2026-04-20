/**
 * Platform Authentication API Routes
 * Handles tenant user authentication and token verification
 */

const express = require('express');
const { query } = require('../lib/database.cjs');
const { verifyTenantUser, generateTenantToken, comparePassword, authenticateTenantToken } = require('../lib/auth-platform.cjs');
const { tenantMiddleware } = require('../lib/tenant-context.cjs');

const router = express.Router();

/**
 * POST /api/auth/platform/login
 * Authenticate tenant user and return JWT with tenant claims
 * Body: { email, password }
 * Headers: { X-Tenant-Slug } - Required for multi-tenant isolation (WR-01 fix)
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Require tenant context for multi-tenant isolation (WR-01 fix)
    const tenantSlug = req.headers['x-tenant-slug'];
    if (!tenantSlug) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context required. Include X-Tenant-Slug header.'
      });
    }

    // Find user by email within specific tenant
    const result = await query(
      `SELECT tu.id, tu.tenant_id, tu.email, tu.password_hash, tu.role,
              tu.first_name, tu.last_name, tu.status,
              t.slug as tenant_slug, t.name as tenant_name
       FROM tenant_users tu
       JOIN tenants t ON tu.tenant_id = t.id
       WHERE tu.email = $1 AND t.slug = $2 AND tu.status = 'ACTIVE'`,
      [email, tenantSlug]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last_login_at
    await query(
      'UPDATE tenant_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT with tenant claims (AUTH-02)
    const token = generateTenantToken(
      user.id,
      user.tenant_id,
      user.tenant_slug,
      user.role
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      tenant: {
        id: user.tenant_id,
        slug: user.tenant_slug,
        name: user.tenant_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

/**
 * POST /api/auth/platform/verify
 * Verify JWT token and return current user+tenant info
 * Header: Authorization: Bearer <token>
 */
router.post('/verify', authenticateTenantToken, tenantMiddleware, async (req, res) => {
  try {
    // Token already verified by authenticateTenantToken
    // req.user contains userId, tenantId, tenantSlug, role

    const result = await query(
      `SELECT tu.id, tu.email, tu.role, tu.first_name, tu.last_name,
              t.id as tenant_id, t.slug as tenant_slug, t.name as tenant_name, t.plan
       FROM tenant_users tu
       JOIN tenants t ON tu.tenant_id = t.id
       WHERE tu.id = $1 AND tu.tenant_id = $2 AND tu.status = 'ACTIVE'`,
      [req.user.userId, req.user.tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      tenant: {
        id: user.tenant_id,
        slug: user.tenant_slug,
        name: user.tenant_name,
        plan: user.plan
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }
});

module.exports = router;
