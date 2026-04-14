/**
 * Customer Portal API Routes
 * Handles customer authentication, profile management, and account operations
 */

const express = require('express');
const { query } = require('../lib/database.cjs');
const {
  generateToken,
  verifyToken,
  authenticateToken,
  hashPassword,
  comparePassword
} = require('../lib/auth.cjs');

const router = express.Router();

/**
 * POST /api/customer/register
 * Register a new customer account
 */
router.post('/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      mobile,
      email,
      address,
      suburb,
      postcode,
      state,
      password
    } = req.body;

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    if (!mobile && !email) {
      return res.status(400).json({
        success: false,
        error: 'Either mobile number or email address is required'
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    // Validate mobile format (if provided)
    if (mobile) {
      const mobileRegex = /^(\+61|04)[0-9]{8}$/;
      if (!mobileRegex.test(mobile.replace(/[\s]/g, ''))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid mobile number format. Use +61XXXXXXXX or 04XXXXXXXX'
        });
      }
    }

    // Validate email format (if provided)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address format'
        });
      }
    }

    // Check if mobile or email already exists
    const existingCustomer = await query(
      'SELECT customer_id FROM customers WHERE mobile = $1 OR email = $2',
      [mobile || null, email || null]
    );

    if (existingCustomer.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this mobile number or email already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create customer account
    const result = await query(
      `INSERT INTO customers (first_name, last_name, mobile, email, address, suburb, postcode, state, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING customer_id, first_name, last_name, mobile, email, created_at`,
      [firstName, lastName, mobile || null, email || null, address || null, suburb || null, postcode || null, state || 'ACT', passwordHash]
    );

    const customer = result.rows[0];

    // Generate JWT token
    const token = generateToken(customer.customer_id);

    // Log registration
    await query(
      `INSERT INTO audit_log (customer_id, action, details)
       VALUES ($1, 'REGISTER', $2)`,
      [customer.customer_id, JSON.stringify({ method: 'web' })]
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      customer: {
        customerId: customer.customer_id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        mobile: customer.mobile,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while creating your account. Please try again.'
    });
  }
});

/**
 * POST /api/customer/login
 * Authenticate customer and return token
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Mobile/email and password are required'
      });
    }

    // Look up customer by mobile or email
    const result = await query(
      `SELECT customer_id, first_name, last_name, mobile, email, password_hash, status
       FROM customers
       WHERE mobile = $1 OR email = $1`,
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const customer = result.rows[0];

    // Check if account is suspended
    if (customer.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, customer.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken(customer.customer_id);

    // Update last login
    await query(
      'UPDATE customers SET last_login_at = CURRENT_TIMESTAMP WHERE customer_id = $1',
      [customer.customer_id]
    );

    // Log login
    await query(
      `INSERT INTO audit_log (customer_id, action, details)
       VALUES ($1, 'LOGIN', $2)`,
      [customer.customer_id, JSON.stringify({ method: 'web' })]
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      customer: {
        customerId: customer.customer_id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        mobile: customer.mobile,
        email: customer.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while logging in. Please try again.'
    });
  }
});

/**
 * GET /api/customer/profile
 * Get customer profile (authenticated)
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;

    const result = await query(
      `SELECT customer_id, first_name, last_name, mobile, email, address, suburb, postcode, state, created_at, last_login_at
       FROM customers
       WHERE customer_id = $1`,
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const customer = result.rows[0];

    res.json({
      success: true,
      customer: {
        customerId: customer.customer_id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        suburb: customer.suburb,
        postcode: customer.postcode,
        state: customer.state,
        createdAt: customer.created_at,
        lastLoginAt: customer.last_login_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while fetching your profile'
    });
  }
});

/**
 * PUT /api/customer/profile
 * Update customer profile (authenticated)
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;
    const {
      firstName,
      lastName,
      mobile,
      email,
      address,
      suburb,
      postcode,
      state
    } = req.body;

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    if (!mobile && !email) {
      return res.status(400).json({
        success: false,
        error: 'Either mobile number or email address is required'
      });
    }

    // Validate mobile format (if provided)
    if (mobile) {
      const mobileRegex = /^(\+61|04)[0-9]{8}$/;
      if (!mobileRegex.test(mobile.replace(/[\s]/g, ''))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid mobile number format'
        });
      }
    }

    // Validate email format (if provided)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address format'
        });
      }
    }

    // Update profile
    const result = await query(
      `UPDATE customers
       SET first_name = $1, last_name = $2, mobile = $3, email = $4, address = $5, suburb = $6, postcode = $7, state = $8, updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = $9
       RETURNING customer_id, first_name, last_name, mobile, email, address, suburb, postcode, state`,
      [firstName, lastName, mobile || null, email || null, address || null, suburb || null, postcode || null, state || 'ACT', customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    const customer = result.rows[0];

    // Log profile update
    await query(
      `INSERT INTO audit_log (customer_id, action, details)
       VALUES ($1, 'PROFILE_UPDATE', $2)`,
      [customerId, JSON.stringify({ updatedFields: ['firstName', 'lastName', 'mobile', 'email', 'address'] })]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      customer: {
        customerId: customer.customer_id,
        firstName: customer.first_name,
        lastName: customer.last_name,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        suburb: customer.suburb,
        postcode: customer.postcode,
        state: customer.state
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while updating your profile'
    });
  }
});

/**
 * POST /api/customer/change-password
 * Change customer password (authenticated)
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM customers WHERE customer_id = $1',
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, result.rows[0].password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE customers SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE customer_id = $2',
      [newPasswordHash, customerId]
    );

    // Log password change
    await query(
      `INSERT INTO audit_log (customer_id, action, details)
       VALUES ($1, 'PASSWORD_CHANGE', $2)`,
      [customerId, JSON.stringify({ method: 'web' })]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while changing your password'
    });
  }
});

module.exports = router;
