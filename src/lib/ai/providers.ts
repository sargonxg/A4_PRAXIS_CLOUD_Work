/**
 * PRAXIS AI Provider Abstraction — Cloud Run Edition (v3.0)
 *
 * Auth priority on Cloud Run:
 *   1. Vertex AI via Application Default Credentials (ADC) — zero config on Cloud Run
 *   2. Google AI Studio via GOOGLE_AI_API_KEY — dev fallback
 *   3. Anthropic via ANTHROPIC_API_KEY — deep analysis
 *
 * Models:
 *   - gemini-2.5-flash          : Standard tasks — chat, lightweight analysis, terminology
 *   - gemini-2.5-pro            : Pro + Deep Think — structured generation, analysis, 65K output
 *   - text-embedding-005        : Embeddings — 768-dim text vectors
 *   - claude-sonnet-4-20250514 : Deep analysis — nuanced conflict analysis, diplomatic language
 *
 * Zero-Config Fallback Chain (Part 3):
 *   getProModel():       Vertex Gemini 2.5 Pro → Google AI Gemini 2.5 Pro → Flash
 *   getAnalysisModel():  Claude Sonnet 4 → Gemini 2.5 Pro
 *   getEmbeddingModel(): text-embedding-005 → null (vector disabled)
 *
 * All routes import from here — never hardcode model strings in route files.
 */

import { generateText as aiGenerateText, type GenerateTextResult } from 'ai';
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
// Model IDs — Vertex latest stable aliases.
// Google Cloud's Vertex model lifecycle page lists gemini-2.5-pro and
// gemini-2.5-flash as latest stable model IDs. The previous Gemini 3 preview
// strings returned Vertex 404s in praxisbytacitus.
// ---------------------------------------------------------------------------

const MODEL_FLASH = 'gemini-2.5-flash';
const MODEL_PRO   = 'gemini-2.5-pro';
const MODEL_EMBED = 'text-embedding-005';

// ---------------------------------------------------------------------------
// Internal factories
// ---------------------------------------------------------------------------

function createVertexModel(modelId: string): LanguageModel {
  const { createVertex } = require('@ai-sdk/google-vertex') as typeof import('@ai-sdk/google-vertex');
  return createVertex({
    project:  process.env.GOOGLE_VERTEX_PROJECT!,
    location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
  })(modelId);
}

function createGoogleModel(modelId: string): LanguageModel {
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
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

function createAnthropicModel(): LanguageModel | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const { createAnthropic } = require('@ai-sdk/anthropic') as typeof import('@ai-sdk/anthropic');
    return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })('claude-sonnet-4-20250514');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Standard model (gemini-2.5-flash) — chat, lightweight analysis, terminology.
 */
export function getModel(modelId?: string): LanguageModel {
  return createModel(modelId ?? MODEL_FLASH);
}

/**
 * Pro model (gemini-2.5-pro) — structured tool generation, dossiers, reports.
 * 1M context window, 65K output tokens. Falls back to Flash if Pro unavailable.
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
 * Analysis model — Claude Sonnet 4 if configured, else Gemini Pro.
 * Best for nuanced conflict analysis, diplomatic language, creative scenarios.
 */
export function getAnalysisModel(): LanguageModel {
  const claude = createAnthropicModel();
  if (claude) return claude;
  return getProModel();
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
  return getProModel();
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
      const { createVertex } = require('@ai-sdk/google-vertex') as typeof import('@ai-sdk/google-vertex');
      return createVertex({
        project: process.env.GOOGLE_VERTEX_PROJECT,
        location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
      }).textEmbeddingModel(MODEL_EMBED);
    } catch { /* fall through */ }
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
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
  switch (settings?.preferredModel ?? settings?.model) {
    case 'gemini-2.5-pro':
    case 'gemini-2.5-pro':   return getProModel();
    case 'claude-sonnet-4':
    case 'claude-sonnet-4-20250514': return getAnalysisModel();
    case 'gemini-2.5-flash':
    case 'gemini-2.5-flash':
    case 'gemini-3-flash':
    default:                         return getModel();
  }
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
      displayName:     'Google Vertex AI',
      modelId:         MODEL_FLASH,
      groundedModelId: MODEL_FLASH,
      isConfigured:    true,
      configNote:      `Project: ${process.env.GOOGLE_VERTEX_PROJECT} · Location: ${process.env.GOOGLE_VERTEX_LOCATION ?? 'us-central1'}`,
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
      capabilities: ['Chat', 'Google Search Grounding', 'Tool Use', 'Streaming', 'Gemini 2.5', 'Embeddings (768-dim)'],
      note:         'Primary provider — set GOOGLE_AI_API_KEY for local dev, or use Vertex on Cloud Run',
    },
    vertex: {
      name:         'Google Vertex AI',
      configured:   isVertexProviderActive(),
      model:        MODEL_FLASH,
      capabilities: ['VPC-SC', 'IAM', 'Audit Logs', 'Enterprise SLA', 'ADC Auth', 'Gemini 2.5'],
      note:         'Optional — set AI_PROVIDER=vertex + GOOGLE_VERTEX_PROJECT',
    },
    anthropic: {
      name:         'Anthropic Claude',
      configured:   !!process.env.ANTHROPIC_API_KEY,
      model:        'claude-sonnet-4-20250514',
      capabilities: ['Deep Analysis', 'Diplomatic Language', 'Complex Reasoning', 'Extended Thinking'],
      note:         process.env.ANTHROPIC_API_KEY
        ? 'Active — used for deep analysis (getAnalysisModel)'
        : 'Optional — set ANTHROPIC_API_KEY to enable Claude for deep analysis',
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
  claude: 'claude-sonnet-4-20250514',
} as const;

// ---------------------------------------------------------------------------
// Legacy exports — back-compat for files that import raw provider instances
// Lazy initialization: provider is only created on first access, not at import
// time (prevents failures when GOOGLE_AI_API_KEY is not set at startup).
// ---------------------------------------------------------------------------

let _googleProvider: ReturnType<typeof import('@ai-sdk/google')['createGoogleGenerativeAI']> | null = null;

function getGoogleProvider(): ReturnType<typeof import('@ai-sdk/google')['createGoogleGenerativeAI']> {
  if (!_googleProvider) {
    const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
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
