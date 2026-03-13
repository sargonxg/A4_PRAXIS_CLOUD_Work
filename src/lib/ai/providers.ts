/**
 * PRAXIS AI Provider Abstraction
 *
 * Supports two provider backends:
 *   - "google"  → Google AI Studio (default) — uses GOOGLE_AI_API_KEY
 *   - "vertex"  → Google Vertex AI          — uses GOOGLE_VERTEX_PROJECT + GOOGLE_VERTEX_LOCATION
 *
 * Set AI_PROVIDER env var to "vertex" to switch to Vertex AI.
 * All routes should use getModel() / getGroundedModel() rather than constructing
 * provider instances directly.
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

export type ProviderName = 'google' | 'vertex';

export interface ProviderInfo {
  name: ProviderName;
  displayName: string;
  modelId: string;
  groundedModelId: string;
  isConfigured: boolean;
  configNote: string;
}

// ---------------------------------------------------------------------------
// Provider detection
// ---------------------------------------------------------------------------

function detectProvider(): ProviderName {
  const requested = (process.env.AI_PROVIDER ?? 'google').toLowerCase();
  return requested === 'vertex' ? 'vertex' : 'google';
}

// ---------------------------------------------------------------------------
// Google AI Studio provider
// ---------------------------------------------------------------------------

function createGoogleProvider() {
  return createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY || '',
  });
}

// ---------------------------------------------------------------------------
// Vertex AI provider stub
// To enable: install @ai-sdk/google-vertex, set AI_PROVIDER=vertex,
// GOOGLE_VERTEX_PROJECT, and GOOGLE_VERTEX_LOCATION env vars.
// Until the package is installed, falls back to Google AI Studio.
// ---------------------------------------------------------------------------

async function createVertexProvider() {
  // @ai-sdk/google-vertex is an optional dependency not currently installed.
  // Falls back gracefully to Google AI Studio.
  console.warn('[providers] Vertex AI requested but @ai-sdk/google-vertex is not installed. Falling back to Google AI Studio. Run: npm install @ai-sdk/google-vertex');
  return createGoogleProvider();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_PRO_MODEL = 'gemini-2.5-pro';

/**
 * Returns a standard (non-grounded) language model.
 * @param modelId  Gemini model id — defaults to gemini-2.5-flash
 */
export function getModel(modelId: string = DEFAULT_MODEL): LanguageModel {
  const provider = detectProvider();

  if (provider === 'vertex') {
    // Vertex AI is async; for sync contexts return google fallback
    // Full async usage: use getModelAsync()
    const googleProvider = createGoogleProvider();
    return googleProvider(modelId);
  }

  const googleProvider = createGoogleProvider();
  return googleProvider(modelId);
}

/**
 * Returns the base model to use for grounded search requests.
 * Search grounding must be enabled via providerOptions in the streamText/generateText call:
 *   providerOptions: { google: { useSearchGrounding: true } }
 * @ai-sdk/google v3.x does not support passing options as a second model argument.
 */
export function getGroundedModel(modelId: string = DEFAULT_MODEL): LanguageModel {
  const googleProvider = createGoogleProvider();
  return googleProvider(modelId);
}

/**
 * Returns the pro-tier model for complex generation tasks.
 */
export function getProModel(): LanguageModel {
  return getModel(DEFAULT_PRO_MODEL);
}

/**
 * Async variant — currently equivalent to getModel() since Vertex AI
 * requires installing @ai-sdk/google-vertex separately.
 */
export async function getModelAsync(modelId: string = DEFAULT_MODEL): Promise<LanguageModel> {
  const provider = detectProvider();

  if (provider === 'vertex') {
    // Falls back to Google AI Studio until @ai-sdk/google-vertex is installed
    await createVertexProvider();
  }

  const googleProvider = createGoogleProvider();
  return googleProvider(modelId);
}

/**
 * Returns metadata about the currently configured provider.
 * Used by the settings page and status indicators.
 */
export function getProviderInfo(): ProviderInfo {
  const provider = detectProvider();

  if (provider === 'vertex') {
    const project = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
    return {
      name: 'vertex',
      displayName: 'Google Vertex AI',
      modelId: DEFAULT_MODEL,
      groundedModelId: DEFAULT_MODEL,
      isConfigured: !!project,
      configNote: project
        ? `Project: ${project} · Location: ${location}`
        : 'Set GOOGLE_VERTEX_PROJECT environment variable',
    };
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  return {
    name: 'google',
    displayName: 'Google AI Studio',
    modelId: DEFAULT_MODEL,
    groundedModelId: `${DEFAULT_MODEL} + Search Grounding`,
    isConfigured: !!apiKey,
    configNote: apiKey
      ? `API key configured (${apiKey.slice(0, 6)}...)`
      : 'Set GOOGLE_AI_API_KEY environment variable',
  };
}

// ---------------------------------------------------------------------------
// Legacy export — maintained for backwards compat with files that import
// the raw google provider instance directly
// ---------------------------------------------------------------------------

export const google = createGoogleProvider();

export const models = {
  flash: google(DEFAULT_MODEL),
  pro: google(DEFAULT_PRO_MODEL),
} as const;
