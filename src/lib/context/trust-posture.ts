import type { PraxisCapsule } from '@/lib/context/capsule-service';
import type { SourceFreshnessGate } from '@/lib/sources/freshness-gate';
import type { Situation } from '@/types/situation';

export type TrustPostureBand = 'thin' | 'usable' | 'ready';

export interface TrustClickTarget {
  href: string;
  label: string;
}

export interface TrustContributor {
  id: string;
  signal: 'evidence coverage' | 'source freshness' | 'graph readiness' | 'claim support' | 'missing gaps';
  score: number;
  weight: number;
  detail: string;
  clickTarget: TrustClickTarget;
}

export interface TrustPosture {
  score: number;
  band: TrustPostureBand;
  contributors: TrustContributor[];
}

export function computeTrustPosture(
  capsule: PraxisCapsule,
  situation?: Partial<Situation> | null,
  opts: { sourceFreshness?: SourceFreshnessGate[] } = {},
): TrustPosture {
  const contributors: TrustContributor[] = [
    evidenceCoverage(capsule, situation),
    sourceFreshness(capsule, situation, opts.sourceFreshness),
    graphReadiness(capsule, situation),
    claimSupport(capsule, situation),
    missingGaps(capsule, situation),
  ];
  const totalWeight = contributors.reduce((sum, contributor) => sum + contributor.weight, 0);
  const score = clamp(Math.round(
    contributors.reduce((sum, contributor) => sum + contributor.score * contributor.weight, 0) / totalWeight,
  ));
  return {
    score,
    band: score >= 75 ? 'ready' : score >= 45 ? 'usable' : 'thin',
    contributors,
  };
}

function evidenceCoverage(capsule: PraxisCapsule, situation?: Partial<Situation> | null): TrustContributor {
  const sourceCount = uniqueCount([
    ...capsule.coreRefs.sourceCoreIds,
    ...(situation?.sourceUrls ?? []),
    ...(situation?.customSources?.map((source) => source.id) ?? []),
  ]);
  const documentCount = uniqueCount([
    ...capsule.coreRefs.documentCoreIds,
    ...(situation?.initialDocumentIds ?? []),
  ]) || situation?.documentCount || 0;
  const evidenceCount = sourceCount + documentCount;
  return {
    id: 'evidence-coverage',
    signal: 'evidence coverage',
    score: clamp(Math.min(evidenceCount / 8, sourceCount / 5, Math.max(1, documentCount) / 3) * 100),
    weight: 0.25,
    detail: `${evidenceCount} evidence item(s): ${sourceCount} source(s), ${documentCount} document(s). Target is 8 mixed receipts.`,
    clickTarget: {
      href: situation?.id ? `/app/contexts?situationId=${situation.id}` : '/app/contexts',
      label: 'Open Source Core',
    },
  };
}

function sourceFreshness(capsule: PraxisCapsule, situation?: Partial<Situation> | null, liveFreshness: SourceFreshnessGate[] = []): TrustContributor {
  const freshnessWindowDays = capsule.retrievalPolicy.freshnessWindowDays ?? 90;
  if (liveFreshness.length > 0) {
    const stale = liveFreshness.filter((feed) => feed.suggestedAction !== 'ok');
    const worstStaleSeconds = Math.max(0, ...liveFreshness.map((feed) => feed.staleSeconds ?? freshnessWindowDays * 86_400));
    const score = clamp(100 - (worstStaleSeconds / (freshnessWindowDays * 86_400)) * 100);
    return {
      id: 'source-freshness',
      signal: 'source freshness',
      score: stale.length === 0 ? Math.max(75, score) : score,
      weight: 0.15,
      detail: stale.length === 0
        ? `${liveFreshness.length} configured feed(s) report fresh source posture.`
        : `${stale.length}/${liveFreshness.length} feed(s) need action: ${stale.slice(0, 3).map((feed) => `${feed.feedId}:${feed.suggestedAction}`).join(', ')}.`,
      clickTarget: {
        href: situation?.id ? `/app/assistant?situationId=${situation.id}` : '/app/contexts',
        label: 'Check sources',
      },
    };
  }
  const latest = newestDate([
    situation?.latestEventDate,
    situation?.lastAiRefresh,
    situation?.updatedAt,
    capsule.updatedAt,
  ]);
  const ageDays = latest ? daysSince(latest) : Number.POSITIVE_INFINITY;
  const score = Number.isFinite(ageDays)
    ? clamp(100 - (ageDays / freshnessWindowDays) * 100)
    : 0;
  return {
    id: 'source-freshness',
    signal: 'source freshness',
    score: capsule.retrievalPolicy.checkFreshness ? score : Math.max(55, score),
    weight: 0.15,
    detail: latest
      ? `Newest context signal is ${Math.max(0, Math.round(ageDays))} day(s) old; freshness window is ${freshnessWindowDays} days.`
      : 'No dated source or situation refresh signal is available.',
    clickTarget: {
      href: situation?.id ? `/app/assistant?situationId=${situation.id}` : '/app/contexts',
      label: 'Check sources',
    },
  };
}

function graphReadiness(capsule: PraxisCapsule, situation?: Partial<Situation> | null): TrustContributor {
  const graphNodes = situation?.graphEntities ?? 0;
  const hasGraphCore = Boolean(capsule.coreRefs.graphCoreId);
  return {
    id: 'graph-readiness',
    signal: 'graph readiness',
    score: clamp(Math.max(
      hasGraphCore ? 55 : 0,
      graphNodes ? (graphNodes / 25) * 100 : 0,
    )),
    weight: 0.2,
    detail: hasGraphCore
      ? `${graphNodes} graph node(s) plus an attached graph core signal.`
      : `${graphNodes} graph node(s); attach or build the Situation Core graph before high-trust handoff.`,
    clickTarget: {
      href: situation?.id ? `/app/contexts?situationId=${situation.id}` : '/app/contexts',
      label: 'Open Situation Core',
    },
  };
}

function claimSupport(capsule: PraxisCapsule, situation?: Partial<Situation> | null): TrustContributor {
  const dataCompleteness = situation?.dataCompleteness ?? 0;
  const capsuleHealth = capsule.health.score;
  const warningPenalty = Math.min(30, capsule.health.warnings.length * 10);
  return {
    id: 'claim-support',
    signal: 'claim support',
    score: clamp(Math.max(dataCompleteness, capsuleHealth) - warningPenalty),
    weight: 0.2,
    detail: `Capsule health is ${capsuleHealth}; data completeness is ${dataCompleteness || 'unknown'}${warningPenalty ? ` with ${warningPenalty} warning penalty.` : '.'}`,
    clickTarget: {
      href: situation?.id ? `/app/assistant?situationId=${situation.id}` : '/app/assistant',
      label: 'Review claim support',
    },
  };
}

function missingGaps(capsule: PraxisCapsule, situation?: Partial<Situation> | null): TrustContributor {
  const missingCoreCount = capsule.health.missingCores.length;
  const explicitGapCount = looseArray(situation, 'openQuestions').length + looseArray(situation, 'evidenceGaps').length;
  const gapCount = missingCoreCount + explicitGapCount;
  return {
    id: 'missing-gaps',
    signal: 'missing gaps',
    score: clamp(100 - gapCount * 18),
    weight: 0.2,
    detail: gapCount === 0
      ? 'No missing capsule core or explicit evidence gap is currently flagged.'
      : `${gapCount} gap(s): ${missingCoreCount} missing core(s), ${explicitGapCount} open evidence question(s).`,
    clickTarget: {
      href: situation?.id ? `/app/contexts?situationId=${situation.id}` : '/app/contexts',
      label: 'Close gaps',
    },
  };
}

function uniqueCount(values: Array<string | null | undefined>): number {
  return new Set(values.map((value) => value?.trim()).filter(Boolean)).size;
}

function newestDate(values: Array<string | null | undefined>): Date | null {
  const dates = values
    .map((value) => value ? new Date(value) : null)
    .filter((value): value is Date => value instanceof Date && Number.isFinite(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());
  return dates[0] ?? null;
}

function daysSince(date: Date): number {
  return (Date.now() - date.getTime()) / 86_400_000;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function looseArray(object: unknown, key: string): unknown[] {
  if (!object || typeof object !== 'object') return [];
  const value = (object as Record<string, unknown>)[key];
  return Array.isArray(value) ? value : [];
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
