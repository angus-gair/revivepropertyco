const express = require('express');
const { query } = require('../lib/database.cjs');

const router = express.Router();

/**
 * Generate time slots for a day
 */
function generateTimeSlots() {
  const slots = [];
  for (let hour = 7; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
}

/**
 * GET /api/availability?date=YYYY-MM-DD
 */
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;

    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD.'
      });
    }

    // Check if date is in the past
    const requestedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate < today) {
      return res.status(400).json({
        success: false,
        error: 'Cannot book appointments in the past.',
        slots: []
      });
    }

    // Get all CONFIRMED appointments for this date
    const result = await query(
      `SELECT time_slot FROM appointments WHERE date = $1 AND status = 'CONFIRMED'`,
      [date]
    );

    const bookedSlots = new Set(result.rows.map(row => row.time_slot));
    const allSlots = generateTimeSlots();

    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.has(slot));

    res.json({
      success: true,
      date,
      slots: availableSlots,
      totalSlots: allSlots.length,
      bookedSlots: bookedSlots.size
    });

  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
