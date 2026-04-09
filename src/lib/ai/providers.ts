/**
 * PRAXIS AI Provider Abstraction — Cloud Run Edition
 *
 * Auth priority on Cloud Run:
 *   1. Vertex AI via Application Default Credentials (ADC) — zero config on Cloud Run
 *   2. Google AI Studio via GOOGLE_AI_API_KEY — dev fallback
 *   3. Anthropic via ANTHROPIC_API_KEY — deep analysis
 *
 * All routes call getModel() / getProModel() / getAnalysisModel().
 */

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
// Model IDs
// ---------------------------------------------------------------------------

const MODEL_FLASH = 'gemini-2.5-flash';
const MODEL_PRO   = 'gemini-2.5-pro';

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

function createModel(modelId: string): LanguageModel {
  if (process.env.GOOGLE_VERTEX_PROJECT && process.env.AI_PROVIDER === 'vertex') {
    const { createVertex } = require('@ai-sdk/google-vertex') as typeof import('@ai-sdk/google-vertex');
    return createVertex({
      project:  process.env.GOOGLE_VERTEX_PROJECT,
      location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
    })(modelId);
  }
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })(modelId);
}

function createAnthropicModel(): LanguageModel | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const { createAnthropic } = require('@ai-sdk/anthropic') as typeof import('@ai-sdk/anthropic');
  return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })('claude-sonnet-4');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Standard model (gemini-2.5-flash) — chat, lightweight analysis, terminology. */
export function getModel(modelId?: string): LanguageModel {
  return createModel(modelId ?? MODEL_FLASH);
}

/** Pro model (gemini-2.5-pro) — structured tool generation, dossiers, reports. */
export function getProModel(): LanguageModel {
  return createModel(MODEL_PRO);
}

/**
 * Analysis model — Claude Sonnet if ANTHROPIC_API_KEY is set, else Gemini Pro.
 */
export function getAnalysisModel(): LanguageModel {
  return createAnthropicModel() ?? createModel(MODEL_PRO);
}

/**
 * Tool-specific model — same as getModel/getProModel but accepts pro flag.
 * userId param kept for future per-user tracking via BigQuery.
 */
export function getModelForTool(_toolTag: string, _userId?: string, pro = false): LanguageModel {
  return createModel(pro ? MODEL_PRO : MODEL_FLASH);
}

/**
 * Thinking model — Gemini Pro with extended thinking budget.
 * Use for: scenarios, game-theory, negotiation-prep, mediation-design.
 * Enables deeper multi-step reasoning at the cost of higher latency.
 */
export function getThinkingModel(): LanguageModel {
  if (process.env.GOOGLE_VERTEX_PROJECT && process.env.AI_PROVIDER === 'vertex') {
    const { createVertex } = require('@ai-sdk/google-vertex') as typeof import('@ai-sdk/google-vertex');
    return createVertex({
      project:  process.env.GOOGLE_VERTEX_PROJECT,
      location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
    })(MODEL_PRO, { thinkingConfig: { thinkingBudget: 8192, includeThoughts: false } } as Record<string, unknown>);
  }
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })(
    MODEL_PRO,
    { thinkingConfig: { thinkingBudget: 8192, includeThoughts: false } } as Record<string, unknown>
  );
}

/** Grounded search model — Google AI Studio with Search grounding. */
export function getGroundedModel(modelId: string = MODEL_FLASH): LanguageModel {
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })(modelId);
}

/** User-preference model — routes to the model the user selected in settings. */
export function getModelForUser(settings?: { preferredModel?: string; model?: string }): LanguageModel {
  switch (settings?.preferredModel ?? settings?.model) {
    case 'gemini-2.5-pro':  return getProModel();
    case 'claude-sonnet-4': return getAnalysisModel();
    default:                return getModel();
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
  if (process.env.GOOGLE_VERTEX_PROJECT && process.env.AI_PROVIDER === 'vertex') {
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
      : 'Set GOOGLE_AI_API_KEY in environment',
  };
}

export function getAvailableProviders() {
  return {
    google: {
      name:         'Google AI Studio',
      configured:   !!process.env.GOOGLE_AI_API_KEY,
      model:        MODEL_FLASH,
      capabilities: ['Chat', 'Google Search Grounding', 'Tool Use', 'Streaming'],
      note:         'Primary provider — set GOOGLE_AI_API_KEY',
    },
    vertex: {
      name:         'Google Vertex AI',
      configured:   !!process.env.GOOGLE_VERTEX_PROJECT,
      model:        MODEL_FLASH,
      capabilities: ['VPC-SC', 'IAM', 'Audit Logs', 'Enterprise SLA', 'ADC Auth'],
      note:         'Set AI_PROVIDER=vertex + GOOGLE_VERTEX_PROJECT for Vertex',
    },
    anthropic: {
      name:         'Anthropic Claude',
      configured:   !!process.env.ANTHROPIC_API_KEY,
      model:        'claude-sonnet-4',
      capabilities: ['Deep Analysis', 'Diplomatic Language', 'Complex Reasoning'],
      note:         process.env.ANTHROPIC_API_KEY
        ? 'Active — used for deep analysis'
        : 'Set ANTHROPIC_API_KEY to enable Claude models',
    },
  };
}

// ---------------------------------------------------------------------------
// Legacy exports — back-compat for files that import raw provider instances
// ---------------------------------------------------------------------------

export const google = (() => {
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' });
})();

export const models = {
  flash: google(MODEL_FLASH),
  pro:   google(MODEL_PRO),
} as const;
