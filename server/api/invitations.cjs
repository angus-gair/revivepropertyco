/**
 * Team Invitations API Routes
 * Handles team member invitations, acceptance, and management
 */

const express = require('express');
const crypto = require('crypto');
const { query } = require('../lib/database.cjs');
const { authenticateTenantToken, generateTenantToken, hashPassword } = require('../lib/auth-platform.cjs');
const { getTenantId, tenantMiddleware } = require('../lib/tenant-context.cjs');

const router = express.Router();
const INVITATION_EXPIRY_HOURS = 48; // Invitations expire after 48 hours

/**
 * POST /api/invitations/invite
 * Create a new team member invitation
 * Auth: Bearer token (owner or admin role)
 * Body: { email, role }
 */
router.post('/invite', authenticateTenantToken, tenantMiddleware, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const tenantId = getTenantId();
    const inviterId = req.user.userId;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Role validation
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be admin or member'
      });
    }

    // Check inviter permissions (owner or admin only)
    const inviterResult = await query(
      'SELECT role FROM tenant_users WHERE id = $1 AND tenant_id = $2',
      [inviterId, tenantId]
    );

    if (inviterResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to invite users'
      });
    }

    const inviterRole = inviterResult.rows[0].role;
    if (inviterRole !== 'owner' && inviterRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only owners and admins can invite team members'
      });
    }

    // Prevent creating owner role (only first user is owner)
    if (role === 'owner') {
      return res.status(400).json({
        success: false,
        error: 'Cannot invite users with owner role'
      });
    }

    // Check if user already exists in this tenant
    const existingUser = await query(
      'SELECT id FROM tenant_users WHERE email = $1 AND tenant_id = $2',
      [email, tenantId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'A user with this email already belongs to your tenant'
      });
    }

    // Check for pending invitation
    const pendingInvitation = await query(
      `SELECT id, expires_at FROM tenant_invitations
       WHERE email = $1 AND tenant_id = $2 AND accepted_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
      [email, tenantId]
    );

    if (pendingInvitation.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'A pending invitation already exists for this email'
      });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

    // Create invitation
    const result = await query(
      `INSERT INTO tenant_invitations (tenant_id, email, role, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, role, expires_at, created_at`,
      [tenantId, email, role, inviterId, token, expiresAt]
    );

    const invitation = result.rows[0];

    // TODO: Send invitation email (deferred to Phase 7 with billing integration)
    // For now, return the token for testing purposes
    res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        // Only return token in development for testing
        ...(process.env.NODE_ENV === 'development' && { token })
      }
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invitation'
    });
  }
});

/**
 * GET /api/invitations
 * List all invitations for current tenant
 * Auth: Bearer token
 */
router.get('/', authenticateTenantToken, tenantMiddleware, async (req, res) => {
  try {
    const tenantId = getTenantId();

    const result = await query(
      `SELECT ti.id, ti.email, ti.role, ti.created_at, ti.expires_at, ti.accepted_at,
              u.email as invited_by_email, u.first_name as invited_by_first_name
       FROM tenant_invitations ti
       LEFT JOIN tenant_users u ON ti.invited_by = u.id
       WHERE ti.tenant_id = $1
       ORDER BY ti.created_at DESC`,
      [tenantId]
    );

    res.json({
      success: true,
      invitations: result.rows
    });
  } catch (error) {
    console.error('List invitations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations'
    });
  }
});

/**
 * GET /api/invitations/pending/:token
 * Get invitation details by token (for acceptance page)
 * No auth required - uses token
 */
router.get('/pending/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT ti.id, ti.email, ti.role, ti.expires_at,
              t.name as tenant_name, t.slug as tenant_slug
       FROM tenant_invitations ti
       JOIN tenants t ON ti.tenant_id = t.id
       WHERE ti.token = $1 AND ti.accepted_at IS NULL AND ti.expires_at > CURRENT_TIMESTAMP`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }

    res.json({
      success: true,
      invitation: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        role: result.rows[0].role,
        tenantName: result.rows[0].tenant_name,
        tenantSlug: result.rows[0].tenant_slug,
        expiresAt: result.rows[0].expires_at
      }
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitation'
    });
  }
});

/**
 * POST /api/invitations/accept
 * Accept invitation and create user account
 * Body: { token, password, firstName, lastName }
 */
router.post('/accept', async (req, res) => {
  try {
    const { token, password, firstName, lastName } = req.body;

    // Validation
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token and password are required'
      });
    }

    // Password validation (min 8, letter + number)
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters and include both letters and numbers'
      });
    }

    // Use transaction for invitation acceptance
    const result = await query(
      `WITH inv AS (
        SELECT id, tenant_id, email, role, expires_at
        FROM tenant_invitations
        WHERE token = $1 AND accepted_at IS NULL AND expires_at > CURRENT_TIMESTAMP
        FOR UPDATE
      )
      UPDATE tenant_invitations
      SET accepted_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM inv)
      RETURNING tenant_id, email, role`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation'
      });
    }

    const invitation = result.rows[0];

    // Check if user already exists (race condition)
    const existingUser = await query(
      'SELECT id FROM tenant_users WHERE email = $1 AND tenant_id = $2',
      [invitation.email, invitation.tenant_id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const userResult = await query(
      `INSERT INTO tenant_users (tenant_id, email, password_hash, role, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
       RETURNING id, email, role, first_name, last_name, created_at`,
      [invitation.tenant_id, invitation.email, passwordHash, invitation.role, firstName || '', lastName || '']
    );

    const user = userResult.rows[0];

    // Get tenant info for token
    const tenantResult = await query(
      'SELECT id, slug, name FROM tenants WHERE id = $1',
      [invitation.tenant_id]
    );

    const tenant = tenantResult.rows[0];

    // Generate JWT token
    const jwtToken = generateTenantToken(
      user.id,
      tenant.id,
      tenant.slug,
      user.role
    );

    res.status(201).json({
      success: true,
      message: 'Invitation accepted successfully',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    });
  }
});

/**
 * DELETE /api/invitations/:id
 * Cancel a pending invitation
 * Auth: Bearer token (owner or admin)
 */
router.delete('/:id', authenticateTenantToken, tenantMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = getTenantId();
    const userId = req.user.userId;

    // Check user permissions
    const userResult = await query(
      'SELECT role FROM tenant_users WHERE id = $1 AND tenant_id = $2',
      [userId, tenantId]
    );

    if (userResult.rows.length === 0 || (userResult.rows[0].role !== 'owner' && userResult.rows[0].role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'Only owners and admins can cancel invitations'
      });
    }

    // Delete invitation
    const result = await query(
      `DELETE FROM tenant_invitations
       WHERE id = $1 AND tenant_id = $2 AND accepted_at IS NULL
       RETURNING id`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found or already accepted'
      });
    }

    res.json({
      success: true,
      message: 'Invitation cancelled'
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invitation'
    });
  }
});

module.exports = router;
