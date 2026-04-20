// Source: Twenty webhook docs (Context7)
// server/lib/twenty-webhooks.cjs
// Webhook signature verification using HMAC-SHA256

const crypto = require('crypto');

/**
 * Verify webhook signature from Twenty CRM
 * Twenty uses HMAC-SHA256: signature = hmac(timestamp + ':' + rawBody)
 *
 * @param {string} rawPayload - Raw request body (string)
 * @param {string} timestampHeader - X-Twenty-Timestamp header value
 * @param {string} signatureHeader - X-Twenty-Signature header value
 * @param {string} secret - Webhook signing secret
 * @param {number} maxAgeSeconds - Maximum age of timestamp (default: 300 = 5 minutes)
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(rawPayload, timestampHeader, signatureHeader, secret, maxAgeSeconds = 300) {
  if (!rawPayload || !timestampHeader || !signatureHeader || !secret) {
    return false;
  }

  // Verify timestamp is recent (prevent replay attacks)
  const timestamp = parseInt(timestampHeader, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(timestamp) || Math.abs(now - timestamp) > maxAgeSeconds) {
    console.warn(`[webhooks] Timestamp too old or invalid: ${timestampHeader}`);
    return false;
  }

  // Construct string to sign: timestamp:rawPayload
  const stringToSign = `${timestamp}:${rawPayload}`;

  // Compute HMAC-SHA256
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign);
  const computedSignature = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signatureHeader, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );

  if (!isValid) {
    console.warn(`[webhooks] Signature mismatch: expected ${computedSignature}, got ${signatureHeader}`);
  }

  return isValid;
}

/**
 * Express middleware for webhook signature verification
 * Requires express.raw() middleware before this to capture raw body
 *
 * Usage:
 *   app.use(express.raw({ type: 'application/json' }));
 *   app.post('/webhooks', webhookMiddleware(process.env.TWENTY_WEBHOOK_SECRET), handler);
 *
 * @param {string} secret - Webhook signing secret
 * @param {number} maxAgeSeconds - Maximum timestamp age (default: 300)
 */
function webhookMiddleware(secret, maxAgeSeconds = 300) {
  return (req, res, next) => {
    // Check for required headers
    // Twenty sends: X-Twenty-Signature, X-Twenty-Timestamp
    const timestamp = req.headers['x-twenty-timestamp'] || req.headers['twenty-timestamp'];
    const signature = req.headers['x-twenty-signature'] || req.headers['twenty-signature'];

    if (!timestamp || !signature) {
      console.warn('[webhooks] Missing required headers');
      return res.status(401).json({
        success: false,
        error: 'Missing webhook headers (X-Twenty-Timestamp, X-Twenty-Signature)'
      });
    }

    // Get raw body (requires express.raw() middleware)
    if (!req.body || !Buffer.isBuffer(req.body)) {
      console.error('[webhooks] Request body is not a Buffer (missing express.raw middleware?)');
      return res.status(500).json({
        success: false,
        error: 'Webhook processing error'
      });
    }

    const rawPayload = req.body.toString('utf8');

    // Verify signature
    if (verifyWebhookSignature(rawPayload, timestamp, signature, secret, maxAgeSeconds)) {
      try {
        // Parse JSON payload for downstream handlers
        req.webhookPayload = JSON.parse(rawPayload);
        req.webhookTimestamp = timestamp;
        next();
      } catch (parseError) {
        console.error('[webhooks] JSON parse error:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON payload'
        });
      }
    } else {
      console.error('[webhooks] Invalid signature for timestamp:', timestamp);
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }
  };
}

/**
 * Generate a webhook signing secret (for setup/testing)
 * @param {number} bytes - Number of random bytes (default: 32)
 * @returns {string} Hex-encoded secret
 */
function generateWebhookSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Create a signature for a payload (for testing)
 * @param {string} payload - JSON payload to sign
 * @param {string} secret - Webhook signing secret
 * @returns {object} { timestamp, signature }
 */
function createTestSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `${timestamp}:${payload}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign);
  const signature = hmac.digest('hex');
  return { timestamp, signature };
}

module.exports = {
  verifyWebhookSignature,
  webhookMiddleware,
  generateWebhookSecret,
  createTestSignature
};
