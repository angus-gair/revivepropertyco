// In-memory queue for failed operations
const fs = require('fs');
const path = require('path');

class FailedRequestQueue {
  constructor() {
    this.queue = [];
    this.maxRetries = 5;
    this.baseDelay = 1000; // 1 second base delay
    this.storagePath = path.join(__dirname, '..', '..', 'tmp', 'queue.json');
    this.ensureStorageDir();
  }

  ensureStorageDir() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Add item to queue
   */
  add(item) {
    this.queue.push({
      ...item,
      attempts: 0,
      addedAt: Date.now()
    });

    console.log(`[Queue] Added item to queue. Queue size: ${this.queue.length}`);
    this.persistQueue();
  }

  /**
   * Process next item in queue
   */
  async processNext(processorFn) {
    if (this.queue.length === 0) {
      return null;
    }

    const item = this.queue[0];
    item.attempts++;

    try {
      console.log(`[Queue] Processing item (attempt ${item.attempts}/${this.maxRetries})`);
      const result = await processorFn(item.data);

      // Success - remove from queue
      this.queue.shift();
      console.log(`[Queue] Item processed successfully. Remaining: ${this.queue.length}`);
      this.persistQueue();
      return { success: true, result };

    } catch (error) {
      console.error(`[Queue] Item failed (attempt ${item.attempts}):`, error.message);

      if (item.attempts >= this.maxRetries) {
        // Max retries reached - move to failed
        this.queue.shift();
        console.error(`[Queue] Item failed after ${this.maxRetries} attempts. Giving up.`);
        this.persistQueue();
        return { success: false, error, maxRetriesReached: true };
      } else {
        // Exponential backoff - keep in queue
        const delay = this.baseDelay * Math.pow(2, item.attempts);
        console.log(`[Queue] Retrying in ${delay}ms...`);
        setTimeout(() => {}, delay);
        return { success: false, error, willRetry: true };
      }
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      size: this.queue.length,
      items: this.queue,
      oldestItem: this.queue.length > 0 ? this.queue[0] : null
    };
  }

  /**
   * Clear queue
   */
  clear() {
    const cleared = this.queue.length;
    this.queue = [];
    this.persistQueue();
    console.log(`[Queue] Cleared ${cleared} items`);
    return cleared;
  }

  /**
   * Persist queue to file
   */
  persistQueue() {
    try {
      const data = JSON.stringify({
        timestamp: Date.now(),
        queue: this.queue
      });
      fs.writeFileSync(this.storagePath, data);
    } catch (error) {
      console.error('[Queue] Failed to persist queue:', error);
    }
  }

  /**
   * Load queue from file
   */
  loadFromStorage() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const stored = fs.readFileSync(this.storagePath, 'utf-8');
        const data = JSON.parse(stored);
        this.queue = data.queue || [];
        console.log(`[Queue] Loaded ${this.queue.length} items from storage`);
      }
    } catch (error) {
      console.error('[Queue] Failed to load queue:', error);
    }
  }

  /**
   * Export for file persistence on shutdown
   */
  exportToFile(filePath) {
    const fs = require('fs');
    const data = JSON.stringify({
      timestamp: Date.now(),
      queue: this.queue
    }, null, 2);
    fs.writeFileSync(filePath, data);
  }
}

// Singleton instance
const failedQueue = new FailedRequestQueue();

module.exports = failedQueue;
