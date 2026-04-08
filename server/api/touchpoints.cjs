const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../lib/auth.cjs');
const { query } = require('../lib/database.cjs');

const router = express.Router();

/**
 * POST /api/touchpoints - Create a touchpoint (protected)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { leadId, type, timestamp, metadata } = req.body;
    const touchpointId = uuidv4();

    await query(
      `INSERT INTO touchpoints (id, lead_id, type, timestamp, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        touchpointId,
        leadId || null,
        type,
        timestamp || Date.now(),
        metadata ? JSON.stringify(metadata) : '{}'
      ]
    );

    res.status(201).json({
      success: true,
      touchpointId
    });

  } catch (error) {
    console.error('Touchpoint creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create touchpoint'
    });
  }
});

/**
 * GET /api/touchpoints/lead/:leadId - Get touchpoints for a lead (protected)
 */
router.get('/lead/:leadId', authenticateToken, async (req, res) => {
  try {
    const { leadId } = req.params;

    const result = await query(
      `SELECT * FROM touchpoints WHERE lead_id = $1 ORDER BY timestamp DESC`,
      [leadId]
    );

    res.json({
      success: true,
      touchpoints: result.rows
    });

  } catch (error) {
    console.error('Touchpoint fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch touchpoints'
    });
  }
});

module.exports = router;
