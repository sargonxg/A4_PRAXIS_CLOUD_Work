/**
 * Mock fixture for /api/cores/library?kind=...
 *
 * The real endpoint is shipped by Codex CX-10 (drag-from-rail backend).
 * Until it lands, the swap drawer falls back to this fixture so the UI
 * is testable end-to-end and the contract assumption is explicit.
 *
 * Contract assumption (flag in PR if Codex ships a different shape):
 *   GET /api/cores/library?kind=<kind>
 *   → { cores: LibraryCore[] }
 */

import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { listCoreLibrary, type LibraryCore } from '@/lib/cores/core-library';

export type { LibraryCore };

export function mockCoresLibrary(kind: CoreSpecimenKind): LibraryCore[] {
  return listCoreLibrary({ kind });
}

export async function fetchCoresLibrary(kind: CoreSpecimenKind): Promise<LibraryCore[]> {
  try {
    const res = await fetch(`/api/cores/library?kind=${encodeURIComponent(kind)}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const body = (await res.json()) as { cores?: LibraryCore[] };
      if (Array.isArray(body.cores) && body.cores.length > 0) return body.cores;
    }
  } catch {
    /* fall through */
  }
  return mockCoresLibrary(kind);
}
