---
phase: 02-twenty-crm-integration
plan: 04
subsystem: security, database, api
tags: [aes-256-gcm, encryption, token-storage, crypto, pbkdf2]

# Dependency graph
requires:
  - phase: 02-twenty-crm-integration
    plan: 01
    provides: twenty-crypto.cjs, twenty-token-storage.cjs
  - phase: 02-twenty-crm-integration
    plan: 02
    provides: token encryption/decryption utilities
provides:
  - AES-256-GCM token encryption at rest
  - Token storage service with automatic encryption/decryption
  - Migration documenting encryption format and key requirements
affects: [02-twenty-crm-integration, security]

# Tech tracking
tech-stack:
  added: [Node.js crypto module, AES-256-GCM, PBKDF2 key derivation]
  patterns: [Authenticated encryption with auth tag, Environment-based key derivation, Backward-compatible decryption]

key-files:
  created:
    - server/lib/twenty-crypto.cjs
    - server/lib/twenty-token-storage.cjs
    - server/migrations/007_encrypted_tokens_update.sql
  modified:
    - server/api/twenty.cjs

key-decisions:
  - "AES-256-GCM chosen for authenticated encryption (provides both confidentiality and integrity)"
  - "PBKDF2 with 100,000 iterations derives 32-byte key from environment variable"
  - "Single-string storage format (iv:authTag:encrypted) for database simplicity"
  - "Backward compatibility: unencrypted tokens return as-is on decryption attempt"

patterns-established:
  - "Pattern 1: Encrypt-before-store, decrypt-after-retrieve for all sensitive tokens"
  - "Pattern 2: Redacted output in token listings (never return decrypted tokens in bulk)"
  - "Pattern 3: last_used_at timestamp updated on each token access"

requirements-completed: [CRM-08]

# Metrics
duration: 8min
completed: 2026-04-20
---

# Phase 02 Plan 04: Encrypted Token Storage Summary

**AES-256-GCM token encryption at rest with PBKDF2 key derivation and automatic storage service integration**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-20T20:40:51Z
- **Completed:** 2026-04-20T20:48:00Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- **Token encryption utilities** using AES-256-GCM authenticated encryption with 128-bit IV and auth tag
- **Token storage service** with automatic encryption on storage and decryption on retrieval
- **API integration** - updated twenty.cjs to use encrypted token storage throughout
- **Migration documentation** for encryption format and TWENTY_ENCRYPTION_KEY requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Create token encryption utilities** - `78234d4` (feat)
2. **Task 2: Create token storage service with automatic encryption** - `aa0b132` (feat)
3. **Task 3: Update twenty.cjs API to use encrypted token storage** - `3c8627f` (feat)
4. **Task 4: Create migration for encrypted token storage update** - `4fa524a` (feat)

## Files Created/Modified

### Created
- `server/lib/twenty-crypto.cjs` - Token encryption/decryption using AES-256-GCM
  - `encryptToken()` / `decryptToken()` - Core crypto operations with separate IV/authTag
  - `encryptTokenToString()` / `decryptTokenFromString()` - Single-format storage helpers
  - `generateEncryptionKey()` - Generates 64-hex-char key for environment variable
  - `getEncryptionKey()` - PBKDF2 key derivation from environment

- `server/lib/twenty-token-storage.cjs` - Token storage with automatic encryption
  - `storeToken()` - Encrypts and stores token with upsert-on-conflict
  - `getToken()` - Retrieves and decrypts token, updates last_used_at
  - `getTokenByTenantSlug()` - Tenant-slug lookup for context resolution
  - `deleteToken()` - Removes token from database
  - `refreshToken()` - Replaces token with new encrypted value
  - `listTokens()` - Lists tokens redacted (no decryption)

- `server/migrations/007_encrypted_tokens_update.sql` - Encryption documentation
  - Documents encryption format (iv:authTag:encrypted hex-encoded)
  - Adds COMMENT for encrypted_token column
  - Creates idx_tenant_tokens_lookup index
  - Includes TWENTY_ENCRYPTION_KEY setup instructions

### Modified
- `server/api/twenty.cjs` - Integrated encrypted token storage
  - Added imports: `storeToken`, `getToken`, `listTokens`
  - POST /workspaces/register now uses `storeToken()` for encrypted storage
  - POST /setup-objects now uses `getToken()` for decrypted retrieval
  - POST /test-connection now uses `getToken()` for decrypted retrieval
  - Added GET /api/twenty/tokens endpoint (lists tenant tokens redacted)
  - Removed all "TODO: Decrypt" comments

## Decisions Made

1. **AES-256-GCM algorithm** - Provides authenticated encryption (detects tampering via auth tag)
2. **PBKDF2 key derivation** - Ensures 32-byte key length regardless of environment variable input
3. **Single-string storage format** - `iv:authTag:encrypted` in hex for one-column database storage
4. **Backward compatibility** - `decryptTokenFromString()` returns unencrypted tokens as-is if colon count != 3 (for migration period)
5. **Development fallback** - Random key generated in non-production if TWENTY_ENCRYPTION_KEY not set (with warning)

## Deviations from Plan

None - plan executed exactly as written. All tasks completed according to specification with no auto-fixes required.

## Issues Encountered

None - all implementations worked as expected on first attempt.

## Verification

Encryption roundtrip tested successfully:
```bash
TWENTY_ENCRYPTION_KEY="test-key" node -e "
const { encryptTokenToString, decryptTokenFromString } = require('./server/lib/twenty-crypto.cjs');
const original = 'test-token-123';
const encrypted = encryptTokenToString(original);
const decrypted = decryptTokenFromString(encrypted);
console.log('Match:', original === decrypted);
"
# Output: Match: true
```

Key generation produces correct length:
```bash
node -e "console.log(require('./server/lib/twenty-crypto.cjs').generateEncryptionKey().length === 64);"
# Output: true
```

All modules compile successfully:
- `server/lib/twenty-crypto.cjs` - OK
- `server/lib/twenty-token-storage.cjs` - OK
- `server/api/twenty.cjs` - OK (uses storeToken/getToken/listTokens)

## Threat Mitigations Implemented

Per threat model from PLAN.md:

| Threat ID | Category | Mitigation |
|-----------|----------|------------|
| T-02-18 | Information Disclosure (Token storage) | AES-256-GCM encryption at rest, key from environment variable |
| T-02-19 | Information Disclosure (Token in memory) | Decrypted tokens never logged, `[REDACTED]` in output |
| T-02-20 | Tampering (Token database) | Authenticated encryption (GCM) detects tampering via auth tag |
| T-02-21 | Repudiation (Token usage) | `last_used_at` timestamp updated on each access |
| T-02-22 | Denial of Service (Lost encryption key) | Accept risk - key loss = token loss; documented key backup in migration |

## User Setup Required

**Environment variable must be set before production use:**

```bash
# Generate a new encryption key
node -e "console.log(require('./server/lib/twenty-crypto.cjs').generateEncryptionKey())"

# Add to .env
TWENTY_ENCRYPTION_KEY=<generated-64-char-hex-key>
```

**Critical:** Store this key securely. If lost, all encrypted tokens cannot be decrypted and must be re-registered via Twenty CRM.

## Next Phase Readiness

- Token encryption fully integrated and tested
- Migration ready for deployment (adds index and comments only)
- Next phase (02-05) can now use secure token storage for webhook handling
- All API endpoints updated to use encrypted storage

## Self-Check: PASSED

All created files exist:
- FOUND: server/lib/twenty-crypto.cjs
- FOUND: server/lib/twenty-token-storage.cjs
- FOUND: server/migrations/007_encrypted_tokens_update.sql
- FOUND: .planning/phases/02-twenty-crm-integration/02-04-SUMMARY.md

All task commits exist:
- FOUND: 78234d4 (Task 1: token encryption utilities)
- FOUND: aa0b132 (Task 2: token storage service)
- FOUND: 3c8627f (Task 3: API integration)
- FOUND: 4fa524a (Task 4: migration)

No stub patterns found in created files.

---
*Phase: 02-twenty-crm-integration*
*Plan: 04*
*Completed: 2026-04-20*
