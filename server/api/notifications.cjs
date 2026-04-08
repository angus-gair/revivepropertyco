const express = require('express');
const { query } = require('../lib/database.cjs');
const { authenticateToken } = require('../lib/auth.cjs');

const router = express.Router();

/**
 * GET /api/notifications/settings - Get notification preferences (protected)
 */
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    // For now, return default settings
    // In a full implementation, this would be stored in admin_users or a preferences table
    res.json({
      success: true,
      settings: {
        emailNewBookings: true,
        emailNewChats: true,
        emailUrgentTasks: true,
        browserNotifications: false
      }
    });

  } catch (error) {
    console.error('Notifications settings fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification settings'
    });
  }
});

/**
 * PUT /api/notifications/settings - Update notification preferences (protected)
 */
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;

    // For now, just return success
    // In a full implementation, this would store in database
    res.json({
      success: true,
      message: 'Notification preferences updated',
      settings
    });

  } catch (error) {
    console.error('Notifications settings update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification settings'
    });
  }
});

module.exports = router;
