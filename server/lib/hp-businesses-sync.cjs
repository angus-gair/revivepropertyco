const { pool } = require('./hp-businesses-db.cjs');

/**
 * Subscribe to hp_businesses_updated PostgreSQL notifications
 * and broadcast to connected Socket.IO clients
 *
 * @param {Object} io - Socket.IO server instance
 * @returns {Object} PostgreSQL client with notification handler
 */
async function subscribeToHpBusinessesUpdates(io) {
  // Get dedicated client from pool (don't use query() - need persistent connection for LISTEN)
  const client = await pool.connect();

  // Set up notification handler
  client.on('notification', async (msg) => {
    if (msg.channel === 'hp_businesses_updated') {
      try {
        const payload = JSON.parse(msg.payload);
        console.log('[sync-businesses] Received hp_businesses_updated:', payload);

        // Broadcast to all connected admin clients
        io.emit('hp-businesses:updated', payload);
        io.emit('hipages:leadsUpdated', payload);
      } catch (error) {
        console.error('[sync-businesses] Error processing notification:', error);
      }
    }
  });

  // Execute LISTEN
  try {
    await client.query('LISTEN hp_businesses_updated');
    console.log('[sync-businesses] Subscribed to hp_businesses_updated channel');
  } catch (error) {
    console.error('[sync-businesses] Failed to subscribe to hp_businesses_updated:', error);
    // Don't crash server on LISTEN failure
  }

  return client;
}

module.exports = { subscribeToHpBusinessesUpdates };
