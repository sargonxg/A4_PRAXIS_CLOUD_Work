import { adminDb } from '@/lib/firebase/admin';
import {
  type MergedPathConfig,
  type PathConfig,
  type PathId,
  PathConfigSchema,
  PATH_IDS,
  isPathId,
  pathIdForDomain,
} from '@/lib/path/types';
import { PATH_SEEDS } from '@/lib/path/seeds';

interface CachedEntry {
  value: MergedPathConfig;
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<PathId, CachedEntry>();

export function bustPathCache(id?: PathId): void {
  if (!id) {
    cache.clear();
    return;
  }
  cache.delete(id);
}

async function readPathDoc(id: PathId): Promise<PathConfig | null> {
  try {
    const snap = await adminDb.doc(`paths/${id}`).get();
    if (!snap.exists) return null;
    const parsed = PathConfigSchema.safeParse(snap.data());
    if (!parsed.success) {
      console.warn(`[path.resolve] Invalid doc for "${id}":`, parsed.error.issues);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.warn(`[path.resolve] Firestore read failed for "${id}":`, err);
    return null;
  }
}

function seedToConfig(id: PathId): PathConfig {
  return {
    ...PATH_SEEDS[id],
    version: 0,
    schemaVersion: 1,
  };
}

export async function resolvePath(pathId: string | null | undefined, domainId?: string | null): Promise<MergedPathConfig | null> {
  const inferred = isPathId(pathId) ? pathId : pathIdForDomain(domainId);
  if (!inferred) return null;

  const cached = cache.get(inferred);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const doc = await readPathDoc(inferred);
  const value = doc ?? seedToConfig(inferred);
  cache.set(inferred, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function listPaths(): Promise<MergedPathConfig[]> {
  const paths = await Promise.all(PATH_IDS.map((id) => resolvePath(id)));
  return paths
    .filter((path): path is MergedPathConfig => Boolean(path))
    .sort((a, b) => a.name.localeCompare(b.name));
}
