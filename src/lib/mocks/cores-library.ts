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
import type { LibraryCore } from '@/lib/cores/core-library';

export type { LibraryCore };

const UPDATED_AT = '2026-05-14T00:00:00.000Z';

const MOCK_LIBRARY_CORES: LibraryCore[] = [
  core('usr-analyst-template', 'user', 'Senior policy analyst', 'template', 92, 11, 'Role, audience, standards, voice, and uncertainty posture.', ['user', 'persona']),
  core('sit-demo-template', 'situation', 'Starter Situation Core', 'template', 88, 18, 'Case frame, actors, claims, sources, and open questions.', ['situation', 'demo']),
  core('path-diplomacy-template', 'path', 'Diplomacy path', 'template', 90, 12, 'Negotiation, sequencing, commitments, and careful language.', ['path', 'diplomacy']),
  core('src-receipts-template', 'source', 'Source receipt set', 'template', 86, 10, 'Trusted source mix and evidence posture.', ['source', 'receipts']),
  core('doc-uploaded-corpus', 'document', 'Uploaded document corpus', 'workspace', 72, 9, 'User files chunked, embedded, and attached to active capsules.', ['document', 'upload']),
  core('grf-actor-claim-template', 'graph', 'Actor-claim graph', 'template', 84, 9, 'Actors, claims, dates, relationships, and review gaps.', ['graph', 'actors']),
  core('tim-policy-horizon', 'time', 'Policy horizon', 'template', 100, 5, 'Freshness window, scenario horizon, and date-sensitive caveats.', ['time', 'freshness']),
  core('tool-ask-praxis', 'tool', 'Ask PRAXIS', 'live', 94, 16, 'Context-aware reasoning over the active capsule.', ['tool', 'ask']),
  core('obj-source-repair', 'objective', 'Source gap repair', 'template', 86, 9, 'Turns weak claims into collection tasks.', ['objective', 'sources']),
  core('prd-options-memo', 'product', 'Cited options memo', 'template', 96, 10, 'BLUF, options, risks, evidence ledger, and decision ask.', ['product', 'memo']),
  core('out-handover', 'output', 'Handover package', 'template', 88, 8, 'Context, memo, sources, and next moves packaged together.', ['output', 'handover']),
  core('mem-working-assumptions', 'memory', 'Pinned working assumptions', 'live', 82, 5, 'Recurring caveats, adopted definitions, and user preferences.', ['memory', 'assumptions']),
];

export function mockCoresLibrary(kind: CoreSpecimenKind): LibraryCore[] {
  return MOCK_LIBRARY_CORES.filter((core) => core.kind === kind);
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

function core(
  id: string,
  kind: CoreSpecimenKind,
  name: string,
  lineage: string,
  completeness: number,
  projectedReadinessDelta: number,
  essence: string,
  tags: string[],
): LibraryCore {
  return {
    id,
    kind,
    name,
    lineage,
    completeness,
    projectedReadinessDelta,
    essence,
    tags,
    ownerScope: kind === 'user' ? 'user' : kind === 'tool' ? 'platform' : kind === 'product' || kind === 'output' || kind === 'document' ? 'artifact' : 'situation',
    template: true,
    updatedAt: UPDATED_AT,
    source: 'template',
    status: 'ready',
  };
}
