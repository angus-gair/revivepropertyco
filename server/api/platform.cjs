/**
 * Platform API Routes
 * Handles tenant (business) registration and management operations
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { query, transaction } = require('../lib/database.cjs');
const { generateTenantToken, hashPassword, comparePassword } = require('../lib/auth-platform.cjs');
const { getTenantId } = require('../lib/tenant-context.cjs');

const router = express.Router();

// Rate limiting for registration endpoint (WR-05 fix)
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/platform/register
 * Register a new tenant (business) and create owner user
 * Body: { name, slug, ownerEmail, ownerPassword, firstName, lastName }
 */
router.post('/register', registrationLimiter, async (req, res) => {
  try {
    const { name, slug, ownerEmail, ownerPassword, firstName, lastName } = req.body;

    // Validation
    if (!name || !slug || !ownerEmail || !ownerPassword) {
      return res.status(400).json({
        success: false,
        error: 'Business name, slug, owner email, and password are required'
      });
    }

    // Slug validation (alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Slug must contain only lowercase letters, numbers, and hyphens'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Password validation (min 8 chars, letter + number per AUTH-06)
    if (ownerPassword.length < 8 || !/[A-Za-z]/.test(ownerPassword) || !/[0-9]/.test(ownerPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters and include both letters and numbers'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(ownerPassword);

    // Use transaction for atomic tenant + user creation
    const result = await transaction(async (client) => {
      // Check if slug already exists
      const slugCheck = await client.query(
        'SELECT id FROM tenants WHERE slug = $1',
        [slug]
      );
      if (slugCheck.rows.length > 0) {
        throw new Error('SLUG_EXISTS');
      }

      // Check if email already exists (global uniqueness for platform)
      const emailCheck = await client.query(
        'SELECT email FROM tenant_users WHERE email = $1 LIMIT 1',
        [ownerEmail]
      );
      if (emailCheck.rows.length > 0) {
        throw new Error('EMAIL_EXISTS');
      }

      // Create tenant
      const tenantResult = await client.query(
        `INSERT INTO tenants (name, slug, plan, status)
         VALUES ($1, $2, 'free_trial', 'ACTIVE')
         RETURNING id, name, slug, plan, status, created_at`,
        [name, slug]
      );
      const tenant = tenantResult.rows[0];

      // Create owner user
      const userResult = await client.query(
        `INSERT INTO tenant_users (tenant_id, email, password_hash, role, first_name, last_name, status)
         VALUES ($1, $2, $3, 'owner', $4, $5, 'ACTIVE')
         RETURNING id, email, role, first_name, last_name, created_at`,
        [tenant.id, ownerEmail, passwordHash, firstName || '', lastName || '']
      );
      const user = userResult.rows[0];

      // Call seed function for default data (AUTH-07, D-04)
      await client.query('SELECT seed_tenant_defaults($1)', [tenant.id]);

      return { tenant, user };
    });

    // Generate JWT token with tenant claims (AUTH-02)
    const token = generateTenantToken(
      result.user.id,
      result.tenant.id,
      result.tenant.slug,
      result.user.role
    );

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      token,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        firstName: result.user.first_name,
        lastName: result.user.last_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.message === 'SLUG_EXISTS') {
      return res.status(409).json({
        success: false,
        error: 'This slug is already taken. Please choose another.',
        field: 'slug'
      });
    }

    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.',
        field: 'email'
      });
    }

    res.status(500).json({
      success: false,
      error: 'An error occurred while creating your account. Please try again.'
    });
  }
});

/**
 * GET /api/platform/tenant
 * Get current tenant information
 * Requires: Bearer token
 */
router.get('/tenant', async (req, res) => {
  try {
    const tenantId = getTenantId();

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

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
      tenant: result.rows[0]
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant information'
    });
  }
});

module.exports = router;
