import type { AnalystProfile } from '@/types/analyst-profile';
import type { Situation } from '@/types/situation';
import type { MergedPathConfig } from '@/lib/path/types';
import type { RetrievedChunk } from '@/lib/context/system-prompt-block';
import type { Episode } from '@/types/episode';

export interface ContextReadiness {
  score: number;
  coreCompleteness: Record<'user' | 'situation' | 'path' | 'source' | 'graph' | 'time' | 'output', number>;
  sourceGapFlags: string[];
  freshnessScore: number;
  lensCoveragePct: number;
  computedAt: string;
  ttlSeconds: number;
}

const TTL_SECONDS = 5 * 60;

export function computeContextReadiness(input: {
  profile: AnalystProfile | null;
  situation: Situation | null;
  path: MergedPathConfig | null;
  retrievedChunks: RetrievedChunk[];
  episodes: Episode[];
}): ContextReadiness {
  const situation = input.situation;
  const sourceCount = (situation?.sourceUrls?.length ?? 0) + (situation?.customSources?.length ?? 0) + input.retrievedChunks.length;
  const graphCount = situation?.graphEntities ?? 0;
  const outputScore = situation ? Math.max(35, Math.min(90, (situation.documentCount ?? 0) * 20 + input.retrievedChunks.length * 10)) : 0;
  const coreCompleteness = {
    user: input.profile ? 90 : 25,
    situation: situation ? Math.min(95, 30 + (situation.description ? 20 : 0) + Math.min(25, (situation.actors?.length ?? 0) * 5) + (situation.region ? 10 : 0)) : 0,
    path: input.path ? 95 : 0,
    source: Math.min(95, sourceCount * 20),
    graph: Math.min(95, graphCount * 8),
    time: Math.min(95, (input.episodes.length * 12) + (situation?.latestEventDate ? 20 : 0) + (situation?.dateRangeFrom || situation?.dateRangeTo ? 20 : 0)),
    output: outputScore,
  };
  const lensHits = input.path?.lensTop3.filter((lens) =>
    [situation?.description, situation?.contextNotes, ...(input.profile?.perspective.lenses ?? [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(lens.toLowerCase()),
  ).length ?? 0;
  const lensCoveragePct = input.path ? Math.round((lensHits / Math.max(1, input.path.lensTop3.length)) * 100) : 0;
  const sourceGapFlags = [
    sourceCount === 0 ? 'no-sources' : '',
    input.path && input.path.sourceMix.length > 0 && sourceCount < input.path.sourceMix.length ? 'path-source-mix-undercovered' : '',
    graphCount === 0 ? 'no-graph-core' : '',
    input.episodes.length === 0 ? 'no-time-sequence' : '',
  ].filter(Boolean);
  const freshnessScore = situation?.latestEventDate
    ? freshnessFromIso(situation.latestEventDate)
    : sourceCount > 0 ? 55 : 20;
  const score = Math.round(
    Object.values(coreCompleteness).reduce((sum, value) => sum + value, 0) / Object.values(coreCompleteness).length * 0.75
    + freshnessScore * 0.15
    + lensCoveragePct * 0.1,
  );

  return {
    score,
    coreCompleteness,
    sourceGapFlags,
    freshnessScore,
    lensCoveragePct,
    computedAt: new Date().toISOString(),
    ttlSeconds: TTL_SECONDS,
  };
}

function freshnessFromIso(iso: string): number {
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) return 45;
  const ageDays = (Date.now() - timestamp) / (24 * 60 * 60 * 1000);
  if (ageDays <= 2) return 95;
  if (ageDays <= 14) return 80;
  if (ageDays <= 45) return 60;
  if (ageDays <= 120) return 40;
  return 20;
}
