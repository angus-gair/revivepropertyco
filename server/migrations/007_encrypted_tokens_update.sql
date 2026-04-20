-- Migration 007: Encrypted Token Storage Update
-- Description: Updates token storage for encryption and documents encryption key requirement
-- Author: Claude (GSD Planner)
-- Date: 2026-04-20
-- Version: 1.0.0

BEGIN;

-- ============================================================================
-- ENCRYPTED_TOKEN COLUMN UPDATE
-- ============================================================================
-- The encrypted_token column already exists from migration 005.
-- This migration documents the encryption format and adds comments.

-- Add comments documenting encryption format
COMMENT ON COLUMN tenant_twenty_tokens.encrypted_token IS 'Encrypted API token. Format: iv:authTag:encrypted (hex-encoded). AES-256-GCM encryption. Decrypt using twenty-crypto.cjs.';

-- Add index for token lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_tenant_tokens_lookup ON tenant_twenty_tokens(tenant_id, workspace_id, token_type);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check comment was added
SELECT 'encrypted_token comment exists' AS check, col_description IS NOT NULL AS result
FROM pg_description
JOIN pg_attribute ON pg_attribute.oid = pg_description.objoid AND pg_attribute.attnum = pg_description.objsubid
JOIN pg_class ON pg_class.oid = pg_attribute.attrelid
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE pg_namespace.nspname = 'public'
  AND pg_class.relname = 'tenant_twenty_tokens'
  AND pg_attribute.attname = 'encrypted_token';

-- Check index was created
SELECT 'idx_tenant_tokens_lookup exists' AS check, COUNT(*) > 0 AS result
FROM pg_indexes
WHERE indexname = 'idx_tenant_tokens_lookup';

COMMIT;

-- ============================================================================
-- IMPORTANT: ENVIRONMENT VARIABLE REQUIREMENT
-- ============================================================================
-- After this migration, ensure TWENTY_ENCRYPTION_KEY is set in .env
--
-- Generate a new encryption key:
--   node -e "console.log(require('./server/lib/twenty-crypto.cjs').generateEncryptionKey())"
--
-- Add to .env:
--   TWENTY_ENCRYPTION_KEY=<generated-64-char-hex-key>
--
-- IMPORTANT: Store this key securely. If lost, all encrypted tokens cannot be decrypted.
--
-- ============================================================================
-- MIGRATION OF EXISTING TOKENS
-- ============================================================================
-- Existing unencrypted tokens in encrypted_token column will be automatically
-- re-encrypted on next access via decryptTokenFromString() (has backward compatibility).
--
-- To force migration of all tokens, run:
--   node server/scripts/migrate-tokens-to-encrypted.cjs
--
-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
