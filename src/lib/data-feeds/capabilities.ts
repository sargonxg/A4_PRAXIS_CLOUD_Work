import { PROVIDER_REGISTRY, type ProviderId } from '@/lib/providers/registry';
import { hasPlatformFallback, listUserKeyStatuses } from '@/lib/providers/user-keys';

export type FeedProvider = 'grounded_search';
export type FeedTier = 'free';
export type FeedStatus = 'available' | 'user-configured' | 'platform-only' | 'missing-key';

export interface FeedCapability {
  provider: FeedProvider;
  label: string;
  tagline: string;
  tier: FeedTier;
  status: FeedStatus;
  requiresKey: boolean;
  providerId: ProviderId;
  unlocks: string[];
  signupUrl: string;
}

export interface FeedCapabilityMatrix {
  uid: string | null;
  feeds: Record<FeedProvider, FeedCapability>;
  availableProviders: FeedProvider[];
  missingProviders: FeedCapability[];
  fallback: 'grounded_search';
  coverageScore: number;
  computedAt: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: FeedCapabilityMatrix; expires: number }>();

function cacheKey(uid: string | null): string {
  return uid ? `uid:${uid}` : 'anon';
}

export function bustCapabilitiesCache(uid: string | null): void {
  cache.delete(cacheKey(uid));
}

export async function resolveFeedCapabilities(uid: string | null): Promise<FeedCapabilityMatrix> {
  const key = cacheKey(uid);
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const userStatuses = uid ? await safeListStatuses(uid) : {};
  const hasUser = !!userStatuses.google_ai?.present;
  const vertexActive = (process.env.AI_PROVIDER ?? '').toLowerCase() === 'vertex';
  const hasPlatform = hasPlatformFallback('google_ai') || vertexActive;
  const status: FeedStatus = hasUser ? 'user-configured' : hasPlatform ? 'platform-only' : 'missing-key';

  const capability: FeedCapability = {
    provider: 'grounded_search',
    label: 'Google Search grounding',
    tagline: 'Live web research grounded by Gemini and Google Search.',
    tier: 'free',
    status,
    requiresKey: true,
    providerId: 'google_ai',
    unlocks: ['Live web research', 'Citable search-grounded findings', 'Source receipts'],
    signupUrl: 'https://aistudio.google.com/apikey',
  };

  const matrix: FeedCapabilityMatrix = {
    uid,
    feeds: { grounded_search: capability },
    availableProviders: status === 'missing-key' ? [] : ['grounded_search'],
    missingProviders: status === 'missing-key' ? [capability] : [],
    fallback: 'grounded_search',
    coverageScore: status === 'missing-key' ? 0 : 100,
    computedAt: new Date().toISOString(),
  };

  cache.set(key, { value: matrix, expires: Date.now() + CACHE_TTL_MS });
  return matrix;
}

async function safeListStatuses(uid: string) {
  try {
    const statuses = await listUserKeyStatuses(uid);
    return {
      google_ai: {
        effective: statuses.google_ai?.effective ?? false,
        present: statuses.google_ai?.present ?? false,
      },
    };
  } catch (err) {
    console.warn('[capabilities] listUserKeyStatuses failed:', err instanceof Error ? err.message : err);
    return {};
  }
}

export function providerFromCapability(capability: FeedCapability): {
  providerId: ProviderId;
  spec: (typeof PROVIDER_REGISTRY)[ProviderId];
} {
  return { providerId: capability.providerId, spec: PROVIDER_REGISTRY[capability.providerId] };
}
