/**
 * Sources Library — preference helpers.
 *
 * Brick #50 round 5. Each entry in the analyst's Sources Library can
 * carry a preference flag: 'preferred' lifts the publisher to the top
 * of Source Scout proposals; 'blocked' excludes it; 'neutral' is the
 * default. The flag is stored on `tool-data/sources-library.data[].preference`
 * (the existing list shape extended with one optional field).
 *
 * Pure helpers — no Firestore reads here. Source Scout calls
 * `applySourcePreferences(proposed, savedSources)` to filter + rank.
 */

export type SourcePreference = 'preferred' | 'blocked' | 'neutral';

export interface SavedSource {
  name?: string;
  url?: string;
  domain?: string;
  preference?: SourcePreference;
}

export interface ProposalLike {
  name: string;
  url: string;
  /** Other fields preserved by spread. */
  [key: string]: unknown;
}

/** Normalise a hostname for fuzzy matching. */
export function normalizeHost(input: string): string {
  if (!input) return '';
  const trimmed = input.trim().toLowerCase();
  // Strip protocol + www + trailing slash + path. Keeps the 2-level
  // domain (so `news.bbc.co.uk` becomes `bbc.co.uk` only when we have
  // a TLD list — for now keep the host minus www).
  const host = trimmed
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0];
  return host;
}

/** Resolve the preference for a given URL given the analyst's saved list. */
export function preferenceForUrl(url: string, saved: SavedSource[]): SourcePreference {
  if (!url) return 'neutral';
  const targetHost = normalizeHost(url);
  if (!targetHost) return 'neutral';
  for (const s of saved) {
    const candidates = [s.url, s.domain].filter((x): x is string => typeof x === 'string' && x.length > 0);
    for (const c of candidates) {
      const host = normalizeHost(c);
      if (!host) continue;
      // Match exact host or any subdomain.
      if (host === targetHost || targetHost.endsWith(`.${host}`) || host.endsWith(`.${targetHost}`)) {
        return s.preference ?? 'neutral';
      }
    }
  }
  return 'neutral';
}

/**
 * Apply preferences to a list of proposed sources.
 *   - 'blocked' → removed from output
 *   - 'preferred' → kept and sorted to the top
 *   - 'neutral' → kept in original order (after preferred)
 *
 * Returns a triple { kept, blocked, lift } so the caller can render a
 * "Source Scout removed N blocked publishers" banner if useful.
 */
export function applySourcePreferences<T extends ProposalLike>(
  proposed: T[],
  saved: SavedSource[]
): { kept: T[]; blocked: T[]; lift: T[] } {
  const blocked: T[] = [];
  const lift: T[] = [];
  const neutral: T[] = [];
  for (const p of proposed) {
    const pref = preferenceForUrl(p.url, saved);
    if (pref === 'blocked') {
      blocked.push(p);
    } else if (pref === 'preferred') {
      lift.push(p);
    } else {
      neutral.push(p);
    }
  }
  return { kept: [...lift, ...neutral], blocked, lift };
}

export const __test__ = {
  normalizeHost,
};
