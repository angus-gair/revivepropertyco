// server/lib/twenty-token-storage.cjs
// Token storage service with automatic encryption/decryption

const { query, transaction } = require('./database.cjs');
const { encryptTokenToString, decryptTokenFromString } = require('./twenty-crypto.cjs');

/**
 * Store an API token for a tenant workspace (encrypted)
 * @param {string} tenantId - Tenant ID
 * @param {string} workspaceId - Platform workspace ID
 * @param {string} tokenType - Token type ('API' or 'WEBHOOK')
 * @param {string} token - Plain text token (will be encrypted)
 * @param {string} tokenLabel - Optional label for the token
 * @returns {object} Stored token record
 */
async function storeToken(tenantId, workspaceId, tokenType, token, tokenLabel = null) {
  if (!token) {
    throw new Error('Token cannot be empty');
  }

  // Encrypt the token before storage
  const encryptedToken = encryptTokenToString(token);

  const result = await query(
    `INSERT INTO tenant_twenty_tokens (tenant_id, workspace_id, token_type, encrypted_token, token_label)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tenant_id, workspace_id, token_type) DO UPDATE
     SET encrypted_token = EXCLUDED.encrypted_token,
         token_label = COALESCE(EXCLUDED.token_label, tenant_twenty_tokens.token_label),
         last_used_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [tenantId, workspaceId, tokenType, encryptedToken, tokenLabel]
  );

  return result.rows[0];
}

/**
 * Retrieve and decrypt a token for a tenant workspace
 * @param {string} tenantId - Tenant ID
 * @param {string} workspaceId - Platform workspace ID
 * @param {string} tokenType - Token type ('API' or 'WEBHOOK')
 * @returns {object} { token: string (decrypted), record: object }
 */
async function getToken(tenantId, workspaceId, tokenType) {
  const result = await query(
    `SELECT * FROM tenant_twenty_tokens
     WHERE tenant_id = $1 AND workspace_id = $2 AND token_type = $3`,
    [tenantId, workspaceId, tokenType]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const record = result.rows[0];

  // Decrypt the token
  const decryptedToken = decryptTokenFromString(record.encrypted_token);

  // Update last_used_at
  await query(
    `UPDATE tenant_twenty_tokens SET last_used_at = CURRENT_TIMESTAMP
     WHERE token_id = $1`,
    [record.token_id]
  );

  return {
    token: decryptedToken,
    record: {
      ...record,
      // Don't include encrypted token in output
      encrypted_token: '[REDACTED]'
    }
  };
}

/**
 * Get the API token for a tenant (by tenant slug)
 * @param {string} tenantSlug - Tenant slug
 * @returns {object} { token: string (decrypted), workspace: object }
 */
async function getTokenByTenantSlug(tenantSlug) {
  const result = await query(
    `SELECT tt.*, tw.twenty_workspace_id, tw.server_url, tw.tenant_id
     FROM tenant_twenty_tokens tt
     JOIN twenty_workspaces tw ON tt.workspace_id = tw.workspace_id
     JOIN tenants t ON tw.tenant_id = t.id
     WHERE t.slug = $1 AND tt.token_type = $2`,
    [tenantSlug, 'API']
  );

  if (result.rows.length === 0) {
    return null;
  }

  const record = result.rows[0];

  // Decrypt the token
  const decryptedToken = decryptTokenFromString(record.encrypted_token);

  // Update last_used_at
  await query(
    `UPDATE tenant_twenty_tokens SET last_used_at = CURRENT_TIMESTAMP
     WHERE token_id = $1`,
    [record.token_id]
  );

  return {
    token: decryptedToken,
    workspace: {
      workspaceId: record.workspace_id,
      twentyWorkspaceId: record.twenty_workspace_id,
      serverUrl: record.server_url,
      tenantId: record.tenant_id
    }
  };
}

/**
 * Delete a token
 * @param {string} tenantId - Tenant ID
 * @param {string} workspaceId - Platform workspace ID
 * @param {string} tokenType - Token type ('API' or 'WEBHOOK')
 * @returns {boolean} True if deleted
 */
async function deleteToken(tenantId, workspaceId, tokenType) {
  const result = await query(
    `DELETE FROM tenant_twenty_tokens
     WHERE tenant_id = $1 AND workspace_id = $2 AND token_type = $3
     RETURNING token_id`,
    [tenantId, workspaceId, tokenType]
  );

  return result.rows.length > 0;
}

/**
 * Refresh an existing token (replace with new value)
 * @param {string} tenantId - Tenant ID
 * @param {string} workspaceId - Platform workspace ID
 * @param {string} tokenType - Token type ('API' or 'WEBHOOK')
 * @param {string} newToken - New token value
 * @returns {object} Updated token record
 */
async function refreshToken(tenantId, workspaceId, tokenType, newToken) {
  if (!newToken) {
    throw new Error('New token cannot be empty');
  }

  // Encrypt the new token
  const encryptedToken = encryptTokenToString(newToken);

  const result = await query(
    `UPDATE tenant_twenty_tokens
     SET encrypted_token = $1, last_used_at = CURRENT_TIMESTAMP
     WHERE tenant_id = $2 AND workspace_id = $3 AND token_type = $4
     RETURNING *`,
    [encryptedToken, tenantId, workspaceId, tokenType]
  );

  if (result.rows.length === 0) {
    throw new Error('Token not found');
  }

  return {
    token: newToken,
    record: result.rows[0]
  };
}

/**
 * List all tokens for a tenant (without decrypting)
 * @param {string} tenantId - Tenant ID
 * @returns {array} List of token records (tokens redacted)
 */
async function listTokens(tenantId) {
  const result = await query(
    `SELECT tt.token_id, tt.workspace_id, tt.token_type, tt.token_label,
             tt.last_used_at, tt.expires_at, tt.created_at,
             tw.twenty_workspace_name, tw.server_url
     FROM tenant_twenty_tokens tt
     JOIN twenty_workspaces tw ON tt.workspace_id = tw.workspace_id
     WHERE tt.tenant_id = $1
     ORDER BY tt.created_at DESC`,
    [tenantId]
  );

  return result.rows;
}

module.exports = {
  storeToken,
  getToken,
  getTokenByTenantSlug,
  deleteToken,
  refreshToken,
  listTokens
};
