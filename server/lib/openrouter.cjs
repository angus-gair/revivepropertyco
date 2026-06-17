'use strict';
/**
 * OpenRouter AI service — thin wrapper around the OpenAI-compatible REST API.
 * Endpoint: https://openrouter.ai/api/v1/chat/completions
 * Default model: openrouter/free  (swap via OPENROUTER_MODEL or options.model)
 *
 * Drop-in replacement for the GLM (Z.AI) calls used in:
 *   - HiPages auto-bid classifier (n8n workflow)
 *   - Riv chat widget backend proxy
 *   - Any future AI features
 *
 * Swap for a premium model later by setting OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
 * (or any model slug from https://openrouter.ai/models) — no code change needed.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Call OpenRouter with a list of messages.
 * @param {Array<{role:string, content:string}>} messages
 * @param {object} [options]
 * @param {string} [options.model]        Override OPENROUTER_MODEL env var
 * @param {string} [options.systemPrompt] Prepended as a system message if set
 * @param {number} [options.temperature]  Defaults to 0 for deterministic output
 * @param {number} [options.maxTokens]    Max completion tokens
 * @returns {Promise<{content:string, model:string, usage:object|null}>}
 */
async function callOpenRouter(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-or-v1-REPLACE')) {
    throw new Error('OPENROUTER_API_KEY is not set. Add it to .env.');
  }

  const model = options.model || process.env.OPENROUTER_MODEL || 'openrouter/free';

  const finalMessages = options.systemPrompt
    ? [{ role: 'system', content: options.systemPrompt }, ...messages]
    : messages;

  const body = {
    model,
    messages: finalMessages,
    temperature: options.temperature !== undefined ? options.temperature : 0,
  };
  if (options.maxTokens) body.max_tokens = options.maxTokens;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://revivepropertyco.au',
      'X-Title': 'Revive Property Co',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`OpenRouter HTTP ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenRouter error: ${JSON.stringify(data.error)}`);
  }

  const content = data.choices?.[0]?.message?.content ?? '';
  return {
    content,
    model: data.model || model,
    usage: data.usage || null,
  };
}

module.exports = { callOpenRouter, OPENROUTER_URL };
