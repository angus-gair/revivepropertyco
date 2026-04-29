// server/api/twenty-webhooks.cjs
// Webhook receiver for Twenty CRM events

const express = require('express');
const router = express.Router();
const { query } = require('../lib/database.cjs');
const { webhookMiddleware } = require('../lib/twenty-webhooks.cjs');

/**
 * Process webhook events asynchronously
 * Returns immediately to prevent timeout, processes in background
 */
async function processWebhookEvent(eventPayload) {
  const { event, data, timestamp, workspaceId } = eventPayload;

  console.log(`[webhooks] Processing event: ${event}`);

  try {
    switch (event) {
      case 'person.created':
        await handlePersonCreated(data, workspaceId);
        break;
      case 'person.updated':
        await handlePersonUpdated(data, workspaceId);
        break;
      case 'person.deleted':
        await handlePersonDeleted(data, workspaceId);
        break;

      // Custom object events (ServiceJob, HipagesLead, Quote)
      case 'serviceJob.created':
        await handleServiceJobCreated(data, workspaceId);
        break;
      case 'serviceJob.updated':
        await handleServiceJobUpdated(data, workspaceId);
        break;
      case 'serviceJob.deleted':
        await handleServiceJobDeleted(data, workspaceId);
        break;

      case 'hipagesLead.created':
        await handleHipagesLeadCreated(data, workspaceId);
        break;
      case 'hipagesLead.updated':
        await handleHipagesLeadUpdated(data, workspaceId);
        break;

      case 'quote.created':
        await handleQuoteCreated(data, workspaceId);
        break;
      case 'quote.updated':
        await handleQuoteUpdated(data, workspaceId);
        break;

      default:
        console.log(`[webhooks] Unhandled event type: ${event}`);
    }

    // Mark event as processed
    await query(
      `UPDATE twenty_webhook_events SET processed = true, processed_at = CURRENT_TIMESTAMP
       WHERE event_id = $1`,
      [eventPayload._eventId]
    );

  } catch (error) {
    console.error(`[webhooks] Error processing event ${event}:`, error);

    // Mark event as failed
    await query(
      `UPDATE twenty_webhook_events
       SET processed = false, error_message = $2, processed_at = CURRENT_TIMESTAMP
       WHERE event_id = $1`,
      [eventPayload._eventId, error.message]
    );
  }
}

/**
 * Handle person.created event
 */
async function handlePersonCreated(data, workspaceId) {
  console.log(`[webhooks] Person created: ${data.id} - ${data.firstName} ${data.lastName}`);
}

/**
 * Handle person.updated event
 */
async function handlePersonUpdated(data, workspaceId) {
  console.log(`[webhooks] Person updated: ${data.id}`);
}

/**
 * Handle person.deleted event
 */
async function handlePersonDeleted(data, workspaceId) {
  console.log(`[webhooks] Person deleted: ${data.id}`);
}

/**
 * Handle ServiceJob.created event
 */
async function handleServiceJobCreated(data, workspaceId) {
  console.log(`[webhooks] ServiceJob created: ${data.id} - ${data.name}`);
}

/**
 * Handle ServiceJob.updated event
 */
async function handleServiceJobUpdated(data, workspaceId) {
  console.log(`[webhooks] ServiceJob updated: ${data.id} - status: ${data.status}`);
}

/**
 * Handle ServiceJob.deleted event
 */
async function handleServiceJobDeleted(data, workspaceId) {
  console.log(`[webhooks] ServiceJob deleted: ${data.id}`);
}

/**
 * Handle HipagesLead.created event
 */
async function handleHipagesLeadCreated(data, workspaceId) {
  console.log(`[webhooks] HipagesLead created: ${data.id}`);
}

/**
 * Handle HipagesLead.updated event
 */
async function handleHipagesLeadUpdated(data, workspaceId) {
  console.log(`[webhooks] HipagesLead updated: ${data.id}`);
}

/**
 * Handle Quote.created event
 */
async function handleQuoteCreated(data, workspaceId) {
  console.log(`[webhooks] Quote created: ${data.id} - amount: ${data.totalAmount}`);
}

/**
 * Handle Quote.updated event
 */
async function handleQuoteUpdated(data, workspaceId) {
  console.log(`[webhooks] Quote updated: ${data.id} - status: ${data.status}`);
}

/**
 * Generate unique event ID for deduplication
 */
function generateEventId(event, data) {
  const recordId = data?.id || 'unknown';
  const timestamp = Date.now();
  return `${event}-${recordId}-${timestamp}`;
}

/**
 * Check for duplicate event (already processed)
 */
async function isDuplicateEvent(eventId) {
  const result = await query(
    `SELECT id FROM twenty_webhook_events WHERE event_id = $1 AND processed = true LIMIT 1`,
    [eventId]
  );
  return result.rows.length > 0;
}

/**
 * POST /api/twenty/webhooks
 * Webhook receiver for Twenty CRM events
 */
router.post('/webhooks',
  // Webhook signature verification middleware
  webhookMiddleware(process.env.TWENTY_WEBHOOK_SECRET || 'default-secret'),
  async (req, res) => {
    const { event, data, timestamp } = req.webhookPayload;

    // Generate event ID for deduplication
    const eventId = generateEventId(event, data);

    // Check for duplicate
    const duplicate = await isDuplicateEvent(eventId);
    if (duplicate) {
      console.log(`[webhooks] Duplicate event ignored: ${eventId}`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Log event to database
    await query(
      `INSERT INTO twenty_webhook_events (event_id, event_type, payload, received_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [eventId, event, JSON.stringify(req.webhookPayload)]
    );

    // Respond immediately (process asynchronously)
    res.status(200).json({ received: true, eventId });

    // Process event asynchronously
    setImmediate(() => {
      processWebhookEvent({
        ...req.webhookPayload,
        _eventId: eventId
      }).catch(error => {
        console.error('[webhooks] Async processing error:', error);
      });
    });
  }
);

/**
 * GET /api/twenty/webhooks/status
 * Health check for webhook endpoint
 */
router.get('/webhooks/status', async (req, res) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE processed = true) AS processed,
         COUNT(*) FILTER (WHERE processed = false) AS failed,
         COUNT(*) AS total
       FROM twenty_webhook_events
       WHERE received_at > NOW() - INTERVAL '24 hours'`
    );

    res.json({
      success: true,
      status: 'healthy',
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('[webhooks] Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get webhook status'
    });
  }
});

/**
 * GET /api/twenty/webhooks/events
 * List recent webhook events (for debugging)
 */
router.get('/webhooks/events', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await query(
      `SELECT event_id, event_type, received_at, processed, processed_at, error_message
       FROM twenty_webhook_events
       ORDER BY received_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      success: true,
      events: result.rows
    });
  } catch (error) {
    console.error('[webhooks] Events list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list events'
    });
  }
});

module.exports = router;
