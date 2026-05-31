import 'server-only';

import { createHash } from 'node:crypto';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
  type CapsuleStarterDefinition,
} from '@/lib/product/context-capsules';

export const CAPSULE_STARTERS_COLLECTION_PATH = 'config/capsule_starters';
export const CAPSULE_STARTERS_HISTORY_COLLECTION_PATH = 'config/capsule_starters_history';
export const CACHE_TTL_MS = 5 * 60 * 1000;

type LoaderDeps = {
  now?: () => number;
};

type StarterCache = {
  loadedAt: number;
  starters: CapsuleStarterDefinition[];
};

let starterCache: StarterCache | null = null;

export function contentHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function clearCapsuleStarterCache() {
  starterCache = null;
}

export async function listCapsuleStarterDefinitions(deps: LoaderDeps = {}): Promise<CapsuleStarterDefinition[]> {
  const now = deps.now?.() ?? Date.now();
  if (starterCache && now - starterCache.loadedAt < CACHE_TTL_MS) {
    return starterCache.starters;
  }
  const db = getAdminDbOrThrow();
  const snap = await db.collection('config').doc('capsule_starters').collection('items').get();
  const starters = snap.docs
    .map((doc) => doc.data().definition as CapsuleStarterDefinition | undefined)
    .filter((starter): starter is CapsuleStarterDefinition => Boolean(starter?.starterId));
  const resolved = starters.length ? starters : CAPSULE_STARTER_DEFINITIONS;
  starterCache = { loadedAt: now, starters: resolved };
  return resolved;
}

export async function getCapsuleStarterDefinition(starterId: string, deps: LoaderDeps = {}): Promise<CapsuleStarterDefinition | null> {
  const starters = await listCapsuleStarterDefinitions(deps);
  return starters.find((starter) => starter.starterId === starterId) ?? null;
}

export function staticCapsuleStarterSeedRows() {
  return CAPSULE_STARTER_DEFINITIONS.map((definition) => {
    const hash = contentHash(definition);
    return {
      id: definition.starterId,
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      contentHash: hash,
      definition,
      historyId: `${definition.starterId}_${CAPSULE_STARTER_CATALOG_VERSION}_${hash.slice(0, 12)}`,
    };
  });
}
