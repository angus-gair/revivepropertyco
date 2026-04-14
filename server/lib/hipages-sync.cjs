const { pool } = require('./database.cjs');

/**
 * Subscribe to hipages_leads_updated PostgreSQL notifications
 * and broadcast to connected Socket.IO clients
 *
 * @param {Object} io - Socket.IO server instance
 * @returns {Object} PostgreSQL client with notification handler
 */
async function subscribeToHipagesUpdates(io) {
  // Get dedicated client from pool (don't use query() - need persistent connection for LISTEN)
  const client = await pool.connect();

  // Set up notification handler
  client.on('notification', async (msg) => {
    if (msg.channel === 'hipages_leads_updated') {
      try {
        const payload = JSON.parse(msg.payload);
        console.log('[sync] Received hipages update:', payload);

        // Broadcast to all connected admin clients
        io.emit('hipages:leadsUpdated', payload);
      } catch (error) {
        console.error('[sync] Error processing notification:', error);
      }
    }
  });

  // Execute LISTEN
  try {
    await client.query('LISTEN hipages_leads_updated');
    console.log('[sync] Subscribed to hipages_leads_updated channel');
  } catch (error) {
    console.error('[sync] Failed to subscribe to hipages_leads_updated:', error);
    // Don't crash server on LISTEN failure
  }

  return client;
}

module.exports = { subscribeToHipagesUpdates };
