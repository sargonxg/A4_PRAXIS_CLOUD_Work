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

export interface LibraryCore {
  id: string;
  kind: CoreSpecimenKind;
  name: string;
  /** Lineage badge — short token like "v3" or "fork:abc". */
  lineage: string;
  /** Completeness 0–100 — used for the pill color. */
  completeness: number;
  /** Projected delta a swap into this slot would produce (-100..+100). */
  projectedReadinessDelta: number;
  essence?: string;
  updatedAt: string;
}

const NOW = new Date().toISOString();

const SEED: LibraryCore[] = [
  // user
  { id: 'usr-senior-analyst', kind: 'user', name: 'Senior analyst — Indo-Pacific', lineage: 'v4', completeness: 92, projectedReadinessDelta: 12, essence: 'Hedged, source-linked, treasury audience.', updatedAt: NOW },
  { id: 'usr-mediator', kind: 'user', name: 'Mediator — Track II', lineage: 'v2', completeness: 78, projectedReadinessDelta: 6, essence: 'Process-led voice, ZOPA framing.', updatedAt: NOW },
  { id: 'usr-policy-advisor', kind: 'user', name: 'Policy advisor — principal', lineage: 'v1', completeness: 64, projectedReadinessDelta: -2, essence: 'BLUF-first, principal-grade brevity.', updatedAt: NOW },

  // situation
  { id: 'sit-syria-2026q2', kind: 'situation', name: 'Syria — Damascus-SDF window', lineage: 'v7', completeness: 88, projectedReadinessDelta: 18, essence: '30 Jan agreement compliance arc.', updatedAt: NOW },
  { id: 'sit-sudan-rsf', kind: 'situation', name: 'Sudan — RSF expansion', lineage: 'v3', completeness: 71, projectedReadinessDelta: 8, essence: 'Darfur escalation, civilian harm.', updatedAt: NOW },

  // path
  { id: 'pth-conflict', kind: 'path', name: 'Conflict & Security', lineage: 'v1', completeness: 100, projectedReadinessDelta: 22, essence: 'Glasl + Stedman + Fearon.', updatedAt: NOW },
  { id: 'pth-diplomacy', kind: 'path', name: 'Diplomacy & Negotiation', lineage: 'v1', completeness: 100, projectedReadinessDelta: 18, essence: 'ZOPA + BATNA + ripeness.', updatedAt: NOW },
  { id: 'pth-humanitarian', kind: 'path', name: 'Humanitarian Response', lineage: 'v1', completeness: 100, projectedReadinessDelta: 16, essence: 'IPC + protection + access.', updatedAt: NOW },

  // source
  { id: 'src-ucdp', kind: 'source', name: 'UCDP event feed', lineage: 'live', completeness: 96, projectedReadinessDelta: 14, essence: '24h refresh, geocoded.', updatedAt: NOW },
  { id: 'src-gdelt', kind: 'source', name: 'GDELT 15-min feed', lineage: 'live', completeness: 88, projectedReadinessDelta: 10, essence: 'Tone + actor extraction.', updatedAt: NOW },
  { id: 'src-reliefweb', kind: 'source', name: 'ReliefWeb cluster updates', lineage: 'live', completeness: 81, projectedReadinessDelta: 8, essence: 'OCHA + cluster syndication.', updatedAt: NOW },

  // graph
  { id: 'grf-actor-map', kind: 'graph', name: 'Actor map (12 nodes)', lineage: 'v3', completeness: 74, projectedReadinessDelta: 9, essence: 'Pivot actors + leverage.', updatedAt: NOW },
  { id: 'grf-coalition', kind: 'graph', name: 'Coalition graph', lineage: 'v1', completeness: 52, projectedReadinessDelta: 4, essence: 'Stated alliances, brittle edges.', updatedAt: NOW },

  // time
  { id: 'tim-30day', kind: 'time', name: '30-day analyst window', lineage: 'preset', completeness: 100, projectedReadinessDelta: 5, essence: 'Recent past, near-term decisions.', updatedAt: NOW },
  { id: 'tim-72h-ops', kind: 'time', name: '72-hour ops window', lineage: 'preset', completeness: 100, projectedReadinessDelta: 7, essence: 'Tight situation tracking.', updatedAt: NOW },

  // output
  { id: 'out-policy-memo', kind: 'output', name: 'Policy memo (A4)', lineage: 'template', completeness: 100, projectedReadinessDelta: 6, essence: 'EB Garamond, footnote receipts.', updatedAt: NOW },
  { id: 'out-talking-points', kind: 'output', name: 'Talking points (1-pager)', lineage: 'template', completeness: 100, projectedReadinessDelta: 4, essence: 'BLUF-first speaker notes.', updatedAt: NOW },

  // memory
  { id: 'mem-personal', kind: 'memory', name: 'Personal working memory', lineage: 'live', completeness: 80, projectedReadinessDelta: 5, essence: 'Pinned facts + adopted directives.', updatedAt: NOW },
];

export function mockCoresLibrary(kind: CoreSpecimenKind): LibraryCore[] {
  return SEED.filter((c) => c.kind === kind).sort(
    (a, b) => b.projectedReadinessDelta - a.projectedReadinessDelta,
  );
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
