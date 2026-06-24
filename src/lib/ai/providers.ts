/**
 * PRAXIS AI Provider Abstraction — Cloud Run Edition (v3.0)
 *
 * Auth priority on Cloud Run:
 *   1. Vertex AI via Application Default Credentials (ADC) — zero config on Cloud Run
 *   2. Google AI Studio via GOOGLE_AI_API_KEY — dev fallback
 *
 * Models are selected from MODEL_MATRIX.json:
 *   - Gemini task kinds: the sanctioned Gemini 3.5 family
 *   - embeddings_text / embeddings_long : text-embedding-005
 *
 * Zero-Config Fallback Chain (Part 3):
 *   getProModel():       Matrix-selected Vertex model → Google AI fallback → Flash
 *   getAnalysisModel():  Matrix-selected deep reasoning model
 *   getEmbeddingModel(): text-embedding-005 → null (vector disabled)
 *
 * All routes import from here — never hardcode model strings in route files.
 */

import { generateText as aiGenerateText, type GenerateTextResult } from 'ai';
import type { LanguageModel } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex';
import { AI_PLATFORM_POSTURE, getModelMatrixEntry } from './model-matrix';
import { getAskPraxisModelRuntimePolicy } from './model-runtime-policy';

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
// Model IDs come from MODEL_MATRIX.json. Gemini 3 frontier models use the
// Gemini global endpoint by default, so do not scatter raw model strings
// through routes.
// ---------------------------------------------------------------------------

const MODEL_FLASH = getModelMatrixEntry('balanced').model;
const MODEL_PRO   = getModelMatrixEntry('complex_reasoning').model;
const MODEL_EMBED = getModelMatrixEntry('embeddings_text').model;

// ---------------------------------------------------------------------------
// Internal factories
// ---------------------------------------------------------------------------

function createVertexModel(modelId: string): LanguageModel {
  const location = modelId.startsWith('gemini-3')
    ? (process.env.GOOGLE_VERTEX_GEMINI_LOCATION || 'global')
    : (process.env.GOOGLE_VERTEX_LOCATION || AI_PLATFORM_POSTURE.defaultRegion || 'us-central1');
  return createVertex({
    project:  process.env.GOOGLE_VERTEX_PROJECT!,
    location,
  })(modelId);
}

function createGoogleModel(modelId: string): LanguageModel {
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })(modelId);
}

function createModel(modelId: string): LanguageModel {
  if (isVertexProviderActive()) {
    try { return createVertexModel(modelId); } catch { /* fall through */ }
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    try { return createGoogleModel(modelId); } catch { /* fall through */ }
  }
  throw new Error(
    `[providers] No AI provider configured. Set GOOGLE_AI_API_KEY or GOOGLE_VERTEX_PROJECT. Attempted: ${modelId}`
  );
}

export function isVertexProviderActive(): boolean {
  if (!process.env.GOOGLE_VERTEX_PROJECT) return false;
  const provider = (process.env.AI_PROVIDER ?? '').toLowerCase();
  return provider === 'vertex' || (!provider && !process.env.GOOGLE_AI_API_KEY);
}

export function hasServerAiProvider(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_VERTEX_PROJECT);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Standard model — chat, lightweight analysis, terminology.
 */
export function getModel(modelId?: string): LanguageModel {
  return createModel(modelId ?? MODEL_FLASH);
}

/**
 * Pro model — structured tool generation, dossiers, reports.
 * Falls back to Flash if the matrix-selected deep model is unavailable.
 */
export function getProModel(): LanguageModel {
  if (isVertexProviderActive()) {
    try { return createVertexModel(MODEL_PRO); } catch { /* fall through */ }
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    try { return createGoogleModel(MODEL_PRO); } catch { /* fall through */ }
    // Fallback to Flash if Pro unavailable
    try { return createGoogleModel(MODEL_FLASH); } catch { /* fall through */ }
  }
  throw new Error('[providers] No AI provider configured. Set GOOGLE_AI_API_KEY or GOOGLE_VERTEX_PROJECT.');
}

/**
 * Analysis model — Gemini Deep Think high.
 */
export function getAnalysisModel(): LanguageModel {
  return getDeepThinkModel('high');
}

/**
 * Deep Think model — Gemini Pro with configurable thinking level.
 * Use for: Game Theory, scenario probability, treaty legal analysis.
 *
 * The thinking_level parameter is provider-specific; callers pass it
 * per-request when supported by the active model.
 * Callers pass it per-request: { providerOptions: { google: { thinking_level: 'high' } } }
 */
export function getDeepThinkModel(_level: 'low' | 'medium' | 'high' = 'medium'): LanguageModel {
  return createModel(MODEL_PRO);
}

/**
 * Calls generateText with the Pro model; if the Pro model is unavailable or
 * returns an error (model not found, quota exceeded, permission denied, etc.),
 * retries automatically with the Flash model.
 *
 * Use this instead of `generateText({ model: getProModel(), ... })` in routes
 * that use structured output — the Pro model may not be accessible on all API
 * key tiers in production.
 */
export async function callProModel(
  options: Omit<Parameters<typeof aiGenerateText>[0], 'model'>
): Promise<GenerateTextResult<Record<string, never>, never>> {
  const fullOptions = options as Parameters<typeof aiGenerateText>[0];
  try {
    return await aiGenerateText({ ...fullOptions, model: getProModel() }) as unknown as GenerateTextResult<Record<string, never>, never>;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Fall back to Flash for model-level errors; rethrow for request/schema errors
    const isModelError =
      /model|quota|permission|not found|unavailable|access|tier|API/i.test(msg);
    if (isModelError) {
      console.warn(`[providers] Pro model failed (${msg.slice(0, 120)}), retrying with Flash`);
      return await aiGenerateText({ ...fullOptions, model: getModel() }) as unknown as GenerateTextResult<Record<string, never>, never>;
    }
    throw err;
  }
}

/**
 * Multimodal embedding model — 768-dimensional vectors.
 * Supports: text, image, video, audio, PDF.
 * Returns null if unavailable — caller must handle (vector search gracefully disabled).
 */
export function getEmbeddingModel(): ReturnType<ReturnType<typeof import('@ai-sdk/google')['createGoogleGenerativeAI']>['textEmbeddingModel']> | null {
  if (isVertexProviderActive()) {
    try {
      return createVertex({
        project: process.env.GOOGLE_VERTEX_PROJECT,
        location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
      }).textEmbeddingModel(MODEL_EMBED);
    } catch { /* fall through */ }
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
        .textEmbeddingModel(MODEL_EMBED);
    } catch { /* fall through */ }
  }
  console.warn('[providers] No embedding model available. Vector search disabled. Set GOOGLE_AI_API_KEY or GOOGLE_VERTEX_PROJECT.');
  return null;
}

/**
 * Tool-specific model — accepts pro flag for convenience.
 */
export function getModelForTool(_toolTag: string, _userId?: string, pro = false): LanguageModel {
  return pro ? getProModel() : getModel();
}

/**
 * Thinking model — alias for getDeepThinkModel (back-compat).
 * Set thinking level per-request via providerOptions.
 */
export function getThinkingModel(): LanguageModel {
  return getDeepThinkModel();
}

/**
 * Grounded search model — Gemini Flash + Google Search + Maps grounding.
 * Enable grounding per-request: tools: [{ type: 'web_search_20250305', name: 'web_search' }]
 */
export function getGroundedModel(_modelId?: string): LanguageModel {
  return getModel(MODEL_FLASH);
}

/** User-preference model — routes to the model the user selected in settings. */
export function getModelForUser(settings?: { preferredModel?: string; model?: string }): LanguageModel {
  const selected = settings?.preferredModel ?? settings?.model;
  const runtimePolicy = getAskPraxisModelRuntimePolicy();
  if (selected === MODEL_PRO || selected === runtimePolicy.stableFallback.deep[0]) return getProModel();
  if (selected === MODEL_FLASH || selected === runtimePolicy.stableFallback.chat[0]) return getModel();
  return getModel();
}

/** Async variant — kept for back-compat. */
export async function getModelAsync(modelId?: string): Promise<LanguageModel> {
  return getModel(modelId);
}

// ---------------------------------------------------------------------------
// Provider info — used by settings page and status indicators
// ---------------------------------------------------------------------------

export function getProviderInfo(): ProviderInfo {
  if (isVertexProviderActive()) {
    return {
      name:            'vertex',
      displayName:     'Google Vertex AI runtime',
      modelId:         MODEL_FLASH,
      groundedModelId: MODEL_FLASH,
      isConfigured:    true,
      configNote:      `Project: ${process.env.GOOGLE_VERTEX_PROJECT} · Location: ${process.env.GOOGLE_VERTEX_LOCATION ?? AI_PLATFORM_POSTURE.defaultRegion} · Enterprise surface: ${AI_PLATFORM_POSTURE.enterpriseAgentPlatform}`,
    };
  }
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  return {
    name:            'google',
    displayName:     'Google AI Studio',
    modelId:         MODEL_FLASH,
    groundedModelId: `${MODEL_FLASH} + Search Grounding`,
    isConfigured:    !!apiKey,
    configNote:      apiKey
      ? `API key configured (${apiKey.slice(0, 6)}...)`
      : 'Set GOOGLE_AI_API_KEY or GOOGLE_VERTEX_PROJECT in environment',
  };
}

export function getAvailableProviders() {
  return {
    google: {
      name:         'Google AI Studio',
      configured:   !!process.env.GOOGLE_AI_API_KEY,
      model:        MODEL_FLASH,
      capabilities: ['Chat', 'Google Search Grounding', 'Tool Use', 'Streaming', 'Gemini 3.5 frontier', 'Embeddings (768-dim)'],
      note:         'Local fallback — production should use Vertex AI ADC',
    },
    vertex: {
      name:         'Google Vertex AI runtime',
      configured:   isVertexProviderActive(),
      model:        MODEL_FLASH,
      capabilities: ['VPC-SC', 'IAM', 'Audit Logs', 'Enterprise SLA', 'ADC Auth', 'Gemini Enterprise agent platform alignment'],
      note:         'Production default — set AI_PROVIDER=vertex + GOOGLE_VERTEX_PROJECT',
    },
  };
}

// ---------------------------------------------------------------------------
// Model name constants — exported for UI / settings / type guards
// ---------------------------------------------------------------------------

export const MODEL_NAMES = {
  flash:  MODEL_FLASH,
  pro:    MODEL_PRO,
  embed:  MODEL_EMBED,
} as const;

// ---------------------------------------------------------------------------
// Legacy exports — back-compat for files that import raw provider instances
// Lazy initialization: provider is only created on first access, not at import
// time (prevents failures when GOOGLE_AI_API_KEY is not set at startup).
// ---------------------------------------------------------------------------

let _googleProvider: ReturnType<typeof import('@ai-sdk/google')['createGoogleGenerativeAI']> | null = null;

function getGoogleProvider(): ReturnType<typeof import('@ai-sdk/google')['createGoogleGenerativeAI']> {
  if (!_googleProvider) {
    _googleProvider = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' });
  }
  return _googleProvider;
}

/** @deprecated Use getModel() or getProModel() instead */
export const google = new Proxy({} as ReturnType<typeof import('@ai-sdk/google')['createGoogleGenerativeAI']>, {
  apply: (_target, _thisArg, args) => (getGoogleProvider() as (...a: unknown[]) => unknown)(...args),
  get: (_target, prop) => (getGoogleProvider() as unknown as Record<string | symbol, unknown>)[prop],
});

/** @deprecated Use getModel() or getProModel() instead */
export const models = {
  get flash() { return getGoogleProvider()(MODEL_FLASH); },
  get pro()   { return getGoogleProvider()(MODEL_PRO); },
} as const;
