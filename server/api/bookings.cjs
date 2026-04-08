const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../lib/database.cjs');
const { sendConfirmationEmail, sendBusinessNotification } = require('../lib/email.cjs');
const failedQueue = require('../lib/queue.cjs');

// Load queue on startup
failedQueue.loadFromStorage();

/**
 * Validate booking input
 */
function validateBooking(data) {
  const errors = [];

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.push('First name is required (min 2 characters)');
  }
  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.push('Last name is required (min 2 characters)');
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email is required');
  }
  if (!data.phone || data.phone.trim().length < 8) {
    errors.push('Phone number is required (min 8 characters)');
  }
  if (!data.address || data.address.trim().length < 5) {
    errors.push('Address is required (min 5 characters)');
  }
  if (!data.serviceType || data.serviceType.trim().length < 3) {
    errors.push('Service type is required');
  }
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Valid date (YYYY-MM-DD) is required');
  }
  if (!data.timeSlot || !/^\d{2}:\d{2}$/.test(data.timeSlot)) {
    errors.push('Valid time slot (HH:MM) is required');
  }
  if (!data.type || !['QUOTE', 'JOB'].includes(data.type)) {
    errors.push('Type must be QUOTE or JOB');
  }

  // Check if date is not in the past
  const bookingDate = new Date(data.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    errors.push('Booking date cannot be in the past');
  }

  return errors;
}

/**
 * POST /api/bookings - Create a new booking
 */
router.post('/', async (req, res) => {
  try {
    const data = req.body;

    // Validate input
    const errors = validateBooking(data);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking data',
        details: errors
      });
    }

    const bookingId = uuidv4();
    const leadId = uuidv4();
    const appointmentId = uuidv4();
    const touchpointId = uuidv4();
    const timestamp = Date.now();

    // Atomic transaction to create lead, appointment, and touchpoint
    const dbWrite = async () => await transaction(async (client) => {
      // Create lead
      await client.query(
        `INSERT INTO leads (id, first_name, last_name, email, phone, address, service_interest, notes, status, created_at, status_history)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'BOOKED', $9, '[]'::jsonb)`,
        [
          leadId,
          data.firstName.trim(),
          data.lastName.trim(),
          data.email.trim().toLowerCase(),
          data.phone.trim(),
          data.address.trim(),
          data.serviceType,
          data.notes || null,
          timestamp
        ]
      );

      // Create appointment
      await client.query(
        `INSERT INTO appointments (id, lead_id, service_type, type, date, time_slot, notes, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED', $8)`,
        [
          appointmentId,
          leadId,
          data.serviceType,
          data.type,
          data.date,
          data.timeSlot,
          data.notes || null,
          timestamp
        ]
      );

      // Create touchpoint
      await client.query(
        `INSERT INTO touchpoints (id, lead_id, type, timestamp, metadata)
         VALUES ($1, $2, 'BOOKING', $3, $4::jsonb)`,
        [
          touchpointId,
          leadId,
          timestamp,
          JSON.stringify({
            bookingId: bookingId,
            appointmentId: appointmentId,
            serviceType: data.serviceType,
            appointmentType: data.type,
            date: data.date,
            timeSlot: data.timeSlot
          })
        ]
      );
    });

    // Try DB write with queue fallback
    try {
      await dbWrite();
    } catch (dbError) {
      console.error('[Booking] Database write failed, adding to queue:', dbError.message);
      failedQueue.add({
        type: 'booking',
        data: data,
        error: dbError.message,
        timestamp: Date.now()
      });

      // Queue will retry automatically
      // Return immediate success response to user (data is safe in queue)
      console.log('[Booking] Queued for retry - returning success to user');
    }

    // Send confirmation email to customer (non-blocking)
    sendConfirmationEmail(
      data.email,
      data.firstName,
      data.serviceType,
      data.date,
      data.timeSlot,
      data.type,
      bookingId
    ).then(async () => {
        // Small delay before business notifications to respect Resend rate limit (2 req/s)
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Send notification to business owners
        return sendBusinessNotification('NEW_BOOKING', {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          serviceType: data.serviceType,
          type: data.type,
          date: data.date,
          time: data.timeSlot,
          bookingReference: bookingId
        });
    }).catch(err => {
      console.error('[Booking] Async messaging failed:', err.message);
    });

    // Return success response
    res.status(201).json({
      success: true,
      bookingReference: bookingId,
      leadId,
      queuedForRetry: false
    });

  } catch (error) {
    console.error('Booking creation error:', error);

    // Check for unique constraint violation (double-booking)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'This time slot is already booked. Please choose another time.',
        code: 'SLOT_ALREADY_BOOKED'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create booking. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
