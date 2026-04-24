/**
 * Feed capability resolver.
 *
 * The single source of truth for "which data feeds can I actually use right
 * now, given this user's configuration and the platform-level fallbacks?"
 *
 * Consumers:
 *  - The feed aggregator — decides which clients to fan out to and annotates
 *    the result with coverage gaps.
 *  - Dashboard / tool pages — render "unlock with key X" empty states when
 *    a feed is missing.
 *  - Onboarding — surface the tier story honestly.
 *  - Diagnostics — show the full availability matrix.
 *
 * Design notes:
 *  - All decisions are data — no magic booleans scattered across clients.
 *  - Per-uid memoised for 5 minutes (bust on key save/delete via `busting
 *    capabilitiesCache(uid)`).
 *  - Safe to call with `uid = null` — returns a platform-only view used by
 *    cron jobs, the demo path, and diagnostics.
 */

import { PROVIDER_REGISTRY, type ProviderId } from '@/lib/providers/registry';
import { hasPlatformFallback, listUserKeyStatuses } from '@/lib/providers/user-keys';

export type FeedProvider =
  | 'acled'
  | 'gdelt'
  | 'reliefweb'
  | 'hdx'
  | 'unhcr'
  | 'ucdp'
  | 'worldbank'
  | 'sipri'
  | 'crisisgroup'
  | 'unnews'
  | 'grounded_search';

export type FeedTier = 'free' | 'freemium' | 'premium';

/**
 * Status semantics:
 *   available         — call this feed confidently.
 *   user-configured   — available, using the user's own credentials.
 *   platform-only     — available, using platform-tenant credentials.
 *   missing-key       — a credential is required and not configured.
 *   disabled          — intentionally turned off (e.g. provider deprecated).
 */
export type FeedStatus = 'available' | 'user-configured' | 'platform-only' | 'missing-key' | 'disabled';

export interface FeedCapability {
  provider: FeedProvider;
  label: string;
  tagline: string;
  tier: FeedTier;
  status: FeedStatus;
  /** Whether a credential is required at all. */
  requiresKey: boolean;
  /** If `requiresKey`, which ProviderId holds the credential. */
  providerId: ProviderId | null;
  /** What this feed unlocks when available. */
  unlocks: string[];
  /** Where to sign up (for credential-required feeds that are missing-key). */
  signupUrl: string | null;
}

export interface FeedCapabilityMatrix {
  uid: string | null;
  feeds: Record<FeedProvider, FeedCapability>;
  availableProviders: FeedProvider[];
  missingProviders: FeedCapability[];
  fallback: 'grounded_search';
  /** Composite 0–100 score indicating how richly sourced the user is. */
  coverageScore: number;
  computedAt: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Static feed definitions — the "shape" of what is knowable.
// Availability is resolved at call time from user keys + ENV vars.
// ───────────────────────────────────────────────────────────────────────────

interface FeedDef {
  provider: FeedProvider;
  label: string;
  tagline: string;
  tier: FeedTier;
  /** ProviderId whose configured status gates this feed. null = unconditional. */
  providerId: ProviderId | null;
  unlocks: string[];
  signupUrl: string | null;
}

const FEED_DEFS: Readonly<Record<FeedProvider, FeedDef>> = Object.freeze({
  grounded_search: {
    provider: 'grounded_search',
    label: 'Google Search (Grounded)',
    tagline: 'Live web search grounded by Gemini — always available on the free tier.',
    tier: 'free',
    providerId: 'google_ai',
    unlocks: ['Real-time news awareness', 'Citable web-grounded research across every tool'],
    signupUrl: 'https://aistudio.google.com/apikey',
  },
  gdelt: {
    provider: 'gdelt',
    label: 'GDELT',
    tagline: 'Global media event stream — no key required.',
    tier: 'free',
    providerId: null,
    unlocks: ['Media volume trends', 'Tone / sentiment signal', 'Country-level coverage'],
    signupUrl: null,
  },
  reliefweb: {
    provider: 'reliefweb',
    label: 'ReliefWeb',
    tagline: 'OCHA humanitarian situation reports — public, no key required.',
    tier: 'free',
    providerId: null,
    unlocks: ['OCHA situation reports', 'Humanitarian assessments'],
    signupUrl: null,
  },
  hdx: {
    provider: 'hdx',
    label: 'HDX',
    tagline: 'Humanitarian Data Exchange — displacement, food security, funding.',
    tier: 'free',
    providerId: null,
    unlocks: ['IDP / refugee datasets', 'IPC food-security phases', 'OCHA funding status'],
    signupUrl: null,
  },
  unhcr: {
    provider: 'unhcr',
    label: 'UNHCR',
    tagline: 'Refugee and displacement population statistics.',
    tier: 'free',
    providerId: null,
    unlocks: ['Population displacement figures'],
    signupUrl: null,
  },
  ucdp: {
    provider: 'ucdp',
    label: 'UCDP',
    tagline: 'Uppsala Conflict Data Program — authoritative academic dataset.',
    tier: 'free',
    providerId: null,
    unlocks: ['Historical conflict counts', 'Battle-related deaths'],
    signupUrl: null,
  },
  worldbank: {
    provider: 'worldbank',
    label: 'World Bank WDI + WGI',
    tagline: 'Economic and governance indicators.',
    tier: 'free',
    providerId: null,
    unlocks: ['Rule of law, government effectiveness, political stability', 'Economic snapshot'],
    signupUrl: null,
  },
  sipri: {
    provider: 'sipri',
    label: 'SIPRI',
    tagline: 'Arms transfer register.',
    tier: 'free',
    providerId: null,
    unlocks: ['Top suppliers / recipients', 'Arms flow value'],
    signupUrl: null,
  },
  crisisgroup: {
    provider: 'crisisgroup',
    label: 'International Crisis Group',
    tagline: 'CrisisWatch monthly outlook.',
    tier: 'free',
    providerId: null,
    unlocks: ['Qualitative monthly country outlook'],
    signupUrl: null,
  },
  unnews: {
    provider: 'unnews',
    label: 'UN News',
    tagline: 'Official UN system news and statements.',
    tier: 'free',
    providerId: null,
    unlocks: ['Secretary-General statements', 'Agency press releases'],
    signupUrl: null,
  },
  acled: {
    provider: 'acled',
    label: 'ACLED',
    tagline: 'Event-by-event global conflict data — requires free academic / non-profit key.',
    tier: 'freemium',
    providerId: 'acled',
    unlocks: [
      'Timeline of every conflict event',
      'Fatalities + violence type breakdowns',
      'Geospatial event clustering',
      'Precision layer for Risk Monitor',
    ],
    signupUrl: 'https://developer.acleddata.com/',
  },
});

// ───────────────────────────────────────────────────────────────────────────
// Cache (per-uid, 5min TTL)
// ───────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: FeedCapabilityMatrix; expires: number }>();

function cacheKey(uid: string | null): string {
  return uid ? `uid:${uid}` : 'anon';
}

export function bustCapabilitiesCache(uid: string | null): void {
  cache.delete(cacheKey(uid));
}

// ───────────────────────────────────────────────────────────────────────────
// Resolver
// ───────────────────────────────────────────────────────────────────────────
export async function resolveFeedCapabilities(uid: string | null): Promise<FeedCapabilityMatrix> {
  const key = cacheKey(uid);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  // Gather provider statuses once for the user.
  const userStatuses = uid ? await safeListStatuses(uid) : ({} as Partial<Record<ProviderId, { effective: boolean; present: boolean }>>);

  const feeds: Record<FeedProvider, FeedCapability> = {} as Record<FeedProvider, FeedCapability>;

  for (const def of Object.values(FEED_DEFS)) {
    const feed = resolveOne(def, userStatuses);
    feeds[def.provider] = feed;
  }

  const availableProviders = (Object.keys(feeds) as FeedProvider[]).filter(
    (p) => feeds[p].status === 'available' || feeds[p].status === 'user-configured' || feeds[p].status === 'platform-only',
  );
  const missingProviders = (Object.keys(feeds) as FeedProvider[])
    .filter((p) => feeds[p].status === 'missing-key')
    .map((p) => feeds[p]);

  const coverageScore = Math.round((availableProviders.length / Object.keys(FEED_DEFS).length) * 100);

  const matrix: FeedCapabilityMatrix = {
    uid,
    feeds,
    availableProviders,
    missingProviders,
    fallback: 'grounded_search',
    coverageScore,
    computedAt: new Date().toISOString(),
  };

  cache.set(key, { value: matrix, expires: Date.now() + CACHE_TTL_MS });
  return matrix;
}

function resolveOne(
  def: FeedDef,
  userStatuses: Partial<Record<ProviderId, { effective: boolean; present: boolean }>>,
): FeedCapability {
  const base: Omit<FeedCapability, 'status' | 'requiresKey'> = {
    provider: def.provider,
    label: def.label,
    tagline: def.tagline,
    tier: def.tier,
    providerId: def.providerId,
    unlocks: def.unlocks,
    signupUrl: def.signupUrl,
  };

  // Unconditional free feed — no credential path at all.
  if (def.providerId === null) {
    return { ...base, status: 'available', requiresKey: false };
  }

  // Credential-gated feed.
  const status = userStatuses[def.providerId];
  const hasUser = !!status?.present;
  const hasPlatform = hasPlatformFallback(def.providerId);

  // Special case: grounded_search is backed by google_ai but also works via
  // Vertex ADC on Cloud Run — we treat it as always available in that
  // environment. The providers registry ENV var fallback `GOOGLE_AI_API_KEY`
  // is only one path; ADC is the other. So we additionally treat
  // AI_PROVIDER=vertex as equivalent to platform fallback.
  const vertexActive = def.provider === 'grounded_search' && (process.env.AI_PROVIDER ?? '').toLowerCase() === 'vertex';

  if (hasUser) return { ...base, status: 'user-configured', requiresKey: true };
  if (hasPlatform || vertexActive) return { ...base, status: 'platform-only', requiresKey: true };
  return { ...base, status: 'missing-key', requiresKey: true };
}

async function safeListStatuses(uid: string) {
  try {
    const statuses = await listUserKeyStatuses(uid);
    const out: Partial<Record<ProviderId, { effective: boolean; present: boolean }>> = {};
    for (const [id, s] of Object.entries(statuses)) {
      out[id as ProviderId] = { effective: s.effective, present: s.present };
    }
    return out;
  } catch (err) {
    console.warn('[capabilities] listUserKeyStatuses failed, falling back to platform-only view:', err instanceof Error ? err.message : err);
    return {};
  }
}

/**
 * Public providers for UI: each ProviderId plus its live effective status for
 * the current user. Used by Settings and Dashboard.
 */
export function providerFromCapability(capability: FeedCapability): {
  providerId: ProviderId | null;
  spec: (typeof PROVIDER_REGISTRY)[ProviderId] | null;
} {
  if (!capability.providerId) return { providerId: null, spec: null };
  return { providerId: capability.providerId, spec: PROVIDER_REGISTRY[capability.providerId] };
}
