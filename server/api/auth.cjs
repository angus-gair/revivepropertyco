const express = require('express');
const { query } = require('../lib/database.cjs');
const { comparePassword, generateToken } = require('../lib/auth.cjs');

const router = express.Router();

/**
 * POST /api/auth/login - Admin authentication
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.'
      });
    }

    // Find admin user
    const result = await query(
      `SELECT id, username, password_hash, email FROM admin_users WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.'
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials.'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/auth/verify - Verify current token
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required.'
      });
    }

    // Token is already verified in authenticateToken middleware
    // This endpoint is for clients to check token validity
    res.json({
      success: true,
      valid: true
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
});

module.exports = router;
