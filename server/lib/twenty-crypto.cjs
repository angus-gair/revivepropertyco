// server/lib/twenty-crypto.cjs
// Token encryption/decryption utilities for Twenty API tokens

const crypto = require('crypto');

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.TWENTY_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm'; // Authenticated encryption
const KEY_LENGTH = 32; // bytes
const IV_LENGTH = 16; // bytes
const SALT_LENGTH = 16; // bytes
const AUTH_TAG_LENGTH = 16; // bytes

/**
 * Get or generate encryption key
 * For production, TWENTY_ENCRYPTION_KEY must be set in environment
 */
function getEncryptionKey() {
  if (!ENCRYPTION_KEY) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      throw new Error('TWENTY_ENCRYPTION_KEY environment variable must be set in production');
    }
    // Generate a warning key for development only
    console.warn('[crypto] WARNING: Using random encryption key for development only. Set TWENTY_ENCRYPTION_KEY for production.');
    return crypto.randomBytes(KEY_LENGTH);
  }

  // Derive a 32-byte key from the environment variable using PBKDF2
  // This ensures the key is exactly 32 bytes regardless of input length
  return crypto.pbkdf2Sync(ENCRYPTION_KEY, 'twenty-token-encryption', 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a token using AES-256-GCM
 * @param {string} plaintext - Token to encrypt
 * @returns {object} { encrypted: string, iv: string, authTag: string }
 */
function encryptToken(plaintext) {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty token');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt a token using AES-256-GCM
 * @param {string} encrypted - Encrypted token (hex)
 * @param {string} iv - Initialization vector (hex)
 * @param {string} authTag - Authentication tag (hex)
 * @returns {string} Decrypted plaintext token
 */
function decryptToken(encrypted, iv, authTag) {
  if (!encrypted || !iv || !authTag) {
    throw new Error('Missing required parameters for decryption');
  }

  const key = getEncryptionKey();

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a secure encryption key for environment variable
 * Call this once and set the output as TWENTY_ENCRYPTION_KEY in .env
 * @returns {string} Hex-encoded encryption key (64 hex chars = 32 bytes)
 */
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypt token to a single string (for database storage)
 * Format: iv:authTag:encrypted
 * @param {string} plaintext - Token to encrypt
 * @returns {string} Single encoded string
 */
function encryptTokenToString(plaintext) {
  const result = encryptToken(plaintext);
  return `${result.iv}:${result.authTag}:${result.encrypted}`;
}

/**
 * Decrypt token from a single string
 * @param {string} encoded - iv:authTag:encrypted format
 * @returns {string} Decrypted plaintext token
 */
function decryptTokenFromString(encoded) {
  if (!encoded) {
    throw new Error('Cannot decrypt empty encoded string');
  }

  const parts = encoded.split(':');
  if (parts.length !== 3) {
    // Assume unencrypted token (for migration period)
    return encoded;
  }

  const [iv, authTag, encrypted] = parts;
  return decryptToken(encrypted, iv, authTag);
}

module.exports = {
  encryptToken,
  decryptToken,
  encryptTokenToString,
  decryptTokenFromString,
  generateEncryptionKey
};
