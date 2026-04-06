/**
 * PRAXIS AI Provider Abstraction — v3 (Gateway-first)
 *
 * Auth priority:
 *   1. VERCEL_OIDC_TOKEN — auto-provisioned by `vercel env pull`, auto-refreshed on Vercel.
 *                          Run `vercel env pull .env.local` once; Vercel handles renewal.
 *   2. Direct providers  — dev fallback when no gateway token is available.
 *
 * To enable AI Gateway (recommended for production):
 *   vercel link && vercel env pull .env.local
 *
 * Gateway model slugs use provider/model dot-version format:
 *   ✓ google/gemini-2.5-flash
 *   ✓ google/gemini-2.5-pro
 *   ✓ anthropic/claude-sonnet-4.6
 *
 * All routes call getModel() / getProModel() / getAnalysisModel().
 * Use getModelForTool(toolTag, userId) for per-tool cost attribution.
 */

import type { LanguageModel } from 'ai';

export type ProviderName = 'gateway' | 'google' | 'vertex';

export interface ProviderInfo {
  name: ProviderName;
  displayName: string;
  modelId: string;
  groundedModelId: string;
  isConfigured: boolean;
  configNote: string;
}

// ---------------------------------------------------------------------------
// Gateway model slugs — provider/model with dot-version format
// ---------------------------------------------------------------------------

const GW_FLASH  = 'google/gemini-2.5-flash';
const GW_PRO    = 'google/gemini-2.5-pro';
const GW_CLAUDE = 'anthropic/claude-sonnet-4.6';

// ---------------------------------------------------------------------------
// Direct model IDs — only used in the dev fallback path (no gateway)
// ---------------------------------------------------------------------------

const DIRECT_FLASH = 'gemini-2.5-flash';
const DIRECT_PRO   = 'gemini-2.5-pro';

// ---------------------------------------------------------------------------
// Gateway availability
// ---------------------------------------------------------------------------

function isGatewayConfigured(): boolean {
  // VERCEL_OIDC_TOKEN is provisioned by `vercel env pull` and auto-refreshed
  // on Vercel deployments. This is the only gateway auth method used here —
  // OIDC eliminates manual key rotation and is the Vercel-recommended approach.
  return !!process.env.VERCEL_OIDC_TOKEN;
}

// ---------------------------------------------------------------------------
// Gateway model factory
// Passing a "provider/model" string routes through AI Gateway automatically.
// providerOptions.gateway enables failover, user tracking, and cost tags.
// ---------------------------------------------------------------------------

function gatewayModel(
  slug: string,
  opts?: { userId?: string; toolTag?: string }
): LanguageModel {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { gateway } = require('ai') as { gateway: (slug: string, opts?: unknown) => LanguageModel };

  const isAnthropic = slug.startsWith('anthropic/');
  return gateway(slug, {
    providerOptions: {
      gateway: {
        order: isAnthropic ? ['anthropic', 'bedrock'] : ['google', 'vertex'],
        ...(opts?.userId  && { user: opts.userId }),
        ...(opts?.toolTag && {
          tags: [
            `tool:${opts.toolTag}`,
            `env:${process.env.NODE_ENV === 'production' ? 'production' : 'development'}`,
            'app:praxis',
          ],
        }),
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Direct provider fallback — only when gateway is not configured
// ---------------------------------------------------------------------------

function directModel(modelId: string): LanguageModel {
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Standard model (gemini-2.5-flash) — chat, lightweight analysis, terminology.
 */
export function getModel(modelId?: string): LanguageModel {
  if (isGatewayConfigured()) return gatewayModel(modelId ?? GW_FLASH);
  return directModel(modelId ?? DIRECT_FLASH);
}

/**
 * Pro model (gemini-2.5-pro) — structured tool generation, dossiers, reports.
 */
export function getProModel(): LanguageModel {
  if (isGatewayConfigured()) return gatewayModel(GW_PRO);
  return directModel(DIRECT_PRO);
}

/**
 * Analysis model — Claude Sonnet via AI Gateway, or Gemini Pro as fallback.
 * When gateway is active: OIDC auth handles Anthropic — no direct key needed.
 * When gateway is absent: falls back gracefully to Gemini Pro.
 */
export function getAnalysisModel(): LanguageModel {
  if (isGatewayConfigured()) return gatewayModel(GW_CLAUDE);
  return directModel(DIRECT_PRO);
}

/**
 * Tool-specific model with per-tool cost attribution via AI Gateway.
 * Visible in Vercel dashboard: AI → Usage, filterable by tag.
 *
 * @param toolTag  e.g. 'actor-profiles', 'power-map', 'dossier-generate'
 * @param userId   Firebase UID — enables per-user spend tracking + rate limiting
 * @param pro      true = gemini-2.5-pro, false = gemini-2.5-flash
 */
export function getModelForTool(toolTag: string, userId?: string, pro = false): LanguageModel {
  if (isGatewayConfigured()) return gatewayModel(pro ? GW_PRO : GW_FLASH, { userId, toolTag });
  return directModel(pro ? DIRECT_PRO : DIRECT_FLASH);
}

/**
 * Grounded search model — always uses Google AI Studio directly.
 * Search grounding is a Google-specific capability unavailable through gateway.
 */
export function getGroundedModel(modelId: string = DIRECT_FLASH): LanguageModel {
  const { createGoogleGenerativeAI } = require('@ai-sdk/google') as typeof import('@ai-sdk/google');
  return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' })(modelId);
}

/**
 * User-preference model — routes to the model the user selected in settings.
 */
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
  if (isGatewayConfigured()) {
    const hasOidc = !!process.env.VERCEL_OIDC_TOKEN;
    return {
      name:            'gateway',
      displayName:     'Vercel AI Gateway',
      modelId:         GW_FLASH,
      groundedModelId: `${DIRECT_FLASH} + Google Search (direct)`,
      isConfigured:    true,
      configNote:      hasOidc
        ? 'OIDC auth — tokens auto-refreshed on Vercel'
        : 'API key auth — consider `vercel env pull` for OIDC',
    };
  }
  if (process.env.GOOGLE_VERTEX_PROJECT && process.env.AI_PROVIDER === 'vertex') {
    return {
      name:            'vertex',
      displayName:     'Google Vertex AI (direct)',
      modelId:         DIRECT_FLASH,
      groundedModelId: DIRECT_FLASH,
      isConfigured:    true,
      configNote:      `Project: ${process.env.GOOGLE_VERTEX_PROJECT} · Location: ${process.env.GOOGLE_VERTEX_LOCATION ?? 'us-central1'}`,
    };
  }
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  return {
    name:            'google',
    displayName:     'Google AI Studio (direct)',
    modelId:         DIRECT_FLASH,
    groundedModelId: `${DIRECT_FLASH} + Search Grounding`,
    isConfigured:    !!apiKey,
    configNote:      apiKey
      ? `API key configured (${apiKey.slice(0, 6)}…)`
      : 'Set GOOGLE_AI_API_KEY or run `vercel env pull` for gateway OIDC',
  };
}

export function getAvailableProviders() {
  const gatewayActive = isGatewayConfigured();
  const hasOidc       = !!process.env.VERCEL_OIDC_TOKEN;

  return {
    gateway: {
      name:         'Vercel AI Gateway',
      configured:   gatewayActive,
      model:        GW_FLASH,
      capabilities: ['Provider Failover', 'Cost Tracking', 'Per-User Rate Limits', 'Audit Logs', '100+ Models'],
      note:         gatewayActive
        ? hasOidc
          ? 'Active (OIDC) — tokens auto-refresh on Vercel'
          : 'Active (API key) — run `vercel env pull` for OIDC auto-refresh'
        : 'Run `vercel env pull` to provision VERCEL_OIDC_TOKEN',
    },
    google: {
      name:         'Google AI Studio',
      configured:   !!process.env.GOOGLE_AI_API_KEY,
      model:        DIRECT_FLASH,
      capabilities: ['Chat', 'Google Search Grounding', 'Tool Use', 'Streaming'],
      note:         'Used for Search Grounding (gateway cannot access this capability)',
    },
    vertex: {
      name:         'Google Vertex AI',
      configured:   !!process.env.GOOGLE_VERTEX_PROJECT,
      model:        DIRECT_FLASH,
      capabilities: ['VPC-SC', 'IAM', 'Audit Logs', 'Enterprise SLA'],
      note:         'Available as gateway failover target (set AI_PROVIDER=vertex + GOOGLE_VERTEX_PROJECT)',
    },
    anthropic: {
      name:         'Anthropic Claude',
      configured:   gatewayActive,
      model:        GW_CLAUDE,
      capabilities: ['Deep Analysis', 'Diplomatic Language', 'Complex Reasoning'],
      note:         gatewayActive
        ? 'Accessible via AI Gateway — OIDC auth, no direct key needed'
        : 'Enable AI Gateway (run `vercel env pull`) to access Claude models',
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
  flash: google(DIRECT_FLASH),
  pro:   google(DIRECT_PRO),
} as const;
