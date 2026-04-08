const express = require('express');
const failedQueue = require('../lib/queue.cjs');

const router = express.Router();

/**
 * GET /api/queue - Get queue status (protected)
 */
router.get('/', (req, res) => {
  const status = failedQueue.getStatus();
  res.json({
    success: true,
    ...status
  });
});

/**
 * POST /api/queue/process - Manually trigger queue processing (protected)
 */
router.post('/process', async (req, res) => {
  // This would be called by a cron job or admin action
  // For now, just return the status
  const status = failedQueue.getStatus();

  if (status.size === 0) {
    return res.json({
      success: true,
      message: 'No items in queue'
    });
  }

  res.json({
    success: true,
    message: 'Queue processing initiated',
    queueSize: status.size
  });
});

/**
 * DELETE /api/queue/clear - Clear the queue (protected)
 */
router.delete('/clear', (req, res) => {
  const cleared = failedQueue.clear();
  res.json({
    success: true,
    message: `Cleared ${cleared} items from queue`
  });
});

module.exports = router;
