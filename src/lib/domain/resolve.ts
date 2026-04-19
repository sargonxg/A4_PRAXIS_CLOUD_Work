/**
 * resolveDomain — single entry point for reading merged domain configs.
 *
 * - Reads config/domains/{id} from Firestore via Firebase Admin.
 * - Deep-merges with config/domains/generic.
 * - Caches the merged result for 5 minutes per-process.
 * - Never throws: unknown id, missing doc, or read failure → returns
 *   the baked-in seed for `generic` so tools always have valid config.
 *
 * Spec: docs/superpowers/specs/2026-04-19-domain-taxonomy-stabilization-design.md §6
 */

import { adminDb } from '@/lib/firebase/admin';
import { LENSES, type Lens } from '@/types/analyst-profile';
import {
  type DomainConfig,
  type DomainId,
  type MergedDomainConfig,
  DomainConfigSchema,
  DOMAIN_IDS,
  isDomainId,
} from '@/types/domain';
import { DOMAIN_SEEDS } from './seeds';

// ---------------------------------------------------------------------------
// In-process cache (5-minute TTL)
// ---------------------------------------------------------------------------

interface CachedEntry {
  value: MergedDomainConfig;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<DomainId, CachedEntry>();

export function bustDomainCache(id?: DomainId): void {
  if (!id) {
    cache.clear();
    return;
  }
  cache.delete(id);
  // If generic busts, every other domain's resolved value also changes.
  if (id === 'generic') cache.clear();
}

// ---------------------------------------------------------------------------
// Firestore reads (with seed fallback)
// ---------------------------------------------------------------------------

async function readDomainDoc(id: DomainId): Promise<DomainConfig | null> {
  try {
    const snap = await adminDb.doc(`domains/${id}`).get();
    if (!snap.exists) return null;
    const raw = snap.data();
    if (!raw) return null;
    const parsed = DomainConfigSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn(`[domain.resolve] Invalid doc for "${id}":`, parsed.error.issues);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.warn(`[domain.resolve] Firestore read failed for "${id}":`, err);
    return null;
  }
}

function seedToConfig(id: DomainId): DomainConfig {
  const seed = DOMAIN_SEEDS[id];
  return {
    ...seed,
    version: 0,
    schemaVersion: 1,
  };
}

// ---------------------------------------------------------------------------
// Merge: generic + specific → MergedDomainConfig
// ---------------------------------------------------------------------------

function buildFullLensWeights(partial: Partial<Record<Lens, number>>): Record<Lens, number> {
  const full: Record<Lens, number> = {} as Record<Lens, number>;
  for (const lens of LENSES) {
    full[lens] = partial[lens] ?? 1.0;
  }
  return full;
}

function mergeDomains(
  generic: DomainConfig,
  specific: DomainConfig | null,
): MergedDomainConfig {
  if (!specific || specific.id === 'generic') {
    return {
      ...generic,
      lensWeights: buildFullLensWeights(generic.lensWeights),
      inheritanceTrace: {
        parent: null,
        inheritedFields: [],
        overriddenFields: [],
      },
    };
  }

  // Per-key merge. Arrays: specific wins if non-empty; else inherit. Records: shallow-merge.
  const mergedLensWeights: Record<Lens, number> = {} as Record<Lens, number>;
  const overridden: string[] = [];
  const inherited: string[] = [];

  for (const lens of LENSES) {
    const genericWeight = generic.lensWeights[lens] ?? 1.0;
    const specificWeight = specific.lensWeights[lens];
    if (specificWeight !== undefined) {
      mergedLensWeights[lens] = specificWeight;
    } else {
      mergedLensWeights[lens] = genericWeight;
    }
  }

  const preferredFeeds =
    specific.preferredFeeds.length > 0 ? specific.preferredFeeds : generic.preferredFeeds;
  if (specific.preferredFeeds.length > 0) overridden.push('preferredFeeds');
  else inherited.push('preferredFeeds');

  const frameworks = specific.frameworks.length > 0 ? specific.frameworks : generic.frameworks;
  if (specific.frameworks.length > 0) overridden.push('frameworks');
  else inherited.push('frameworks');

  const promptOverrides = { ...generic.promptOverrides, ...specific.promptOverrides };

  return {
    id: specific.id,
    name: specific.name,
    description: specific.description,
    parentId: specific.parentId,
    lensWeights: mergedLensWeights,
    preferredFeeds,
    frameworks,
    promptOverrides,
    defaultAudience: specific.defaultAudience ?? generic.defaultAudience,
    colorHex: specific.colorHex,
    icon: specific.icon,
    version: specific.version,
    schemaVersion: specific.schemaVersion,
    inheritanceTrace: {
      parent: generic.id,
      inheritedFields: inherited,
      overriddenFields: overridden,
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve a single domain to its merged config.
 *
 * Unknown id → falls back to `generic` with a warn log.
 * Firestore unavailable → falls back to baked-in seeds so tools still work.
 */
export async function resolveDomain(domainId: string): Promise<MergedDomainConfig> {
  const id = isDomainId(domainId) ? domainId : 'generic';

  const cached = cache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const [genericDoc, specificDoc] = await Promise.all([
    readDomainDoc('generic'),
    id === 'generic' ? Promise.resolve(null) : readDomainDoc(id),
  ]);

  const generic = genericDoc ?? seedToConfig('generic');
  const specific = id === 'generic' ? null : specificDoc ?? seedToConfig(id);

  const merged = mergeDomains(generic, specific);

  cache.set(id, { value: merged, expiresAt: Date.now() + CACHE_TTL_MS });
  return merged;
}

/**
 * Convenience: list every domain in merged form. Used by admin UI and pickers.
 */
export async function listDomains(): Promise<MergedDomainConfig[]> {
  const results = await Promise.all(DOMAIN_IDS.map((id) => resolveDomain(id)));
  // Keep 'generic' first, then alphabetical by name.
  const generic = results.find((d) => d.id === 'generic')!;
  const rest = results
    .filter((d) => d.id !== 'generic')
    .sort((a, b) => a.name.localeCompare(b.name));
  return [generic, ...rest];
}

/**
 * Resolve a user's effective domain: primary + secondaries as weight boosts.
 *
 * Each secondary domain contributes a 0.5× boost on lens weights where
 * the secondary's value exceeds the primary's value. Feeds/frameworks
 * from secondaries are *unioned* into the primary's list.
 */
export async function resolveUserDomain(profile: {
  perspective: { primaryDomain?: string; secondaryDomains?: string[] };
}): Promise<MergedDomainConfig> {
  const primaryId = profile.perspective.primaryDomain ?? 'generic';
  const primary = await resolveDomain(primaryId);

  const secondaryIds = (profile.perspective.secondaryDomains ?? []).filter(
    (id): id is DomainId => isDomainId(id) && id !== primaryId,
  );
  if (secondaryIds.length === 0) return primary;

  const secondaries = await Promise.all(secondaryIds.map(resolveDomain));

  const boostedWeights: Record<Lens, number> = { ...primary.lensWeights };
  const feedUnion = new Set<string>(primary.preferredFeeds);
  const frameworkUnion = new Set<string>(primary.frameworks);

  for (const sec of secondaries) {
    for (const lens of LENSES) {
      const secWeight = sec.lensWeights[lens];
      if (secWeight > boostedWeights[lens]) {
        boostedWeights[lens] = (boostedWeights[lens] + secWeight) / 2;
      }
    }
    for (const feed of sec.preferredFeeds) feedUnion.add(feed);
    for (const fw of sec.frameworks) frameworkUnion.add(fw);
  }

  return {
    ...primary,
    lensWeights: boostedWeights,
    preferredFeeds: Array.from(feedUnion),
    frameworks: Array.from(frameworkUnion),
  };
}

/**
 * Merge user's effective domain with a situation's domain. Situation wins on
 * framework/feed specificity; user's audience preference wins; lens weights
 * are element-wise max (both user and situation amplify together).
 */
export function mergeUserAndSituationDomains(
  userDomain: MergedDomainConfig,
  situationDomain: MergedDomainConfig,
): MergedDomainConfig {
  if (situationDomain.id === userDomain.id) return userDomain;
  if (situationDomain.id === 'generic') return userDomain;
  if (userDomain.id === 'generic') return situationDomain;

  const mergedWeights: Record<Lens, number> = {} as Record<Lens, number>;
  for (const lens of LENSES) {
    mergedWeights[lens] = Math.max(userDomain.lensWeights[lens], situationDomain.lensWeights[lens]);
  }

  // Situation-led: feeds + frameworks from situation, unioned with user's top-level.
  const feeds = Array.from(new Set([...situationDomain.preferredFeeds, ...userDomain.preferredFeeds]));
  const frameworks = Array.from(
    new Set([...situationDomain.frameworks, ...userDomain.frameworks]),
  );

  return {
    ...situationDomain,
    lensWeights: mergedWeights,
    preferredFeeds: feeds,
    frameworks,
    defaultAudience: userDomain.defaultAudience ?? situationDomain.defaultAudience,
    inheritanceTrace: {
      parent: userDomain.id,
      inheritedFields: ['defaultAudience'],
      overriddenFields: ['id', 'lensWeights', 'preferredFeeds', 'frameworks'],
    },
  };
}
