import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
  proposeCapsuleImprovementsFromQualityAudit,
  runCapsuleStarterQualityAudit,
  type CapsuleImprovementProposal,
  type CapsuleImprovementProposalTarget,
  type CapsuleQualityAuditResult,
  type CapsuleStarterDefinition,
} from '@/lib/product/context-capsules';

export type CapsuleQualityRankingMetricId =
  | 'audit'
  | 'sourceSpine'
  | 'claimLedger'
  | 'embeddedGraph'
  | 'tacitKnowledge'
  | 'agentContract'
  | 'freshness';

export interface CapsuleQualityRankingMetric {
  id: CapsuleQualityRankingMetricId;
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface CapsuleQualityRankingItem {
  rank: number;
  starterId: string;
  label: string;
  category: CapsuleStarterDefinition['category'];
  domain: CapsuleStarterDefinition['domain'];
  score: number;
  auditAverage: number;
  sourceCount: number;
  dossierSourceCount: number;
  externalSourceRatio: number;
  freshSourceRatio: number;
  tierOneOrTwoSourceRatio: number;
  primaryAuthoritativeSourceRatio: number;
  supportedClaimCount: number;
  weakClaimCount: number;
  missingClaimCount: number;
  staleClaimCount: number;
  graphNodeCount: number;
  graphEdgeCount: number;
  weakestSignals: string[];
  metrics: CapsuleQualityRankingMetric[];
  reviewProposals: CapsuleImprovementProposal[];
  reviewProposalTargets: CapsuleImprovementProposalTarget[];
}

export interface CapsuleQualityRankingReport {
  generatedAt: string;
  catalogVersion: string;
  total: number;
  weakestCount: number;
  summary: {
    averageScore: number;
    minimumScore: number;
    maximumScore: number;
    reviewProposalCount: number;
    reviewProposalTargetCounts: Record<string, number>;
    weakestSignalCounts: Record<string, number>;
  };
  ranked: CapsuleQualityRankingItem[];
  weakest: CapsuleQualityRankingItem[];
}

export interface CapsuleQualityRankingOptions {
  generatedAt?: string;
  weakestCount?: number;
  starters?: CapsuleStarterDefinition[];
}

const DEFAULT_WEAKEST_COUNT = 20;

export function buildCapsuleQualityRankingReport(
  options: CapsuleQualityRankingOptions = {},
): CapsuleQualityRankingReport {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const starters = options.starters ?? CAPSULE_STARTER_DEFINITIONS;
  const weakestCount = options.weakestCount ?? DEFAULT_WEAKEST_COUNT;
  const rankedWithoutRank = starters
    .map((starter) => rankCapsuleStarter(starter, { generatedAt }))
    .sort((a, b) => a.score - b.score || a.starterId.localeCompare(b.starterId));
  const ranked = rankedWithoutRank.map((item, index) => ({ ...item, rank: index + 1 }));
  const weakest = ranked.slice(0, weakestCount);

  return {
    generatedAt,
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    total: starters.length,
    weakestCount,
    summary: {
      averageScore: roundScore(average(ranked.map((item) => item.score))),
      minimumScore: roundScore(Math.min(...ranked.map((item) => item.score))),
      maximumScore: roundScore(Math.max(...ranked.map((item) => item.score))),
      reviewProposalCount: weakest.reduce((sum, item) => sum + item.reviewProposals.length, 0),
      reviewProposalTargetCounts: countValues(weakest.flatMap((item) => item.reviewProposalTargets)),
      weakestSignalCounts: countValues(weakest.flatMap((item) => item.weakestSignals)),
    },
    ranked,
    weakest,
  };
}

export function rankCapsuleStarter(
  starter: CapsuleStarterDefinition,
  options: { generatedAt?: string } = {},
): Omit<CapsuleQualityRankingItem, 'rank'> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const catalogYear = yearFromText(generatedAt) ?? new Date().getUTCFullYear();
  const freshnessFloor = catalogYear - 1;
  const audit = runCapsuleStarterQualityAudit(starter);
  const auditAverage = average(Object.values(audit.scores));
  const externalSourceRatio = ratio(
    starter.sourcePack.filter((source) => !isInternalSource(source)).length,
    starter.sourcePack.length,
  );
  const freshSourceRatio = ratio(
    starter.sourcePack.filter((source) => {
      const year = yearFromText(source.date);
      return year !== null && year >= freshnessFloor;
    }).length,
    starter.sourcePack.length,
  );
  const tierOneOrTwoSourceRatio = ratio(
    starter.sourcePack.filter((source) => (source.reliabilityTier ?? 3) <= 2).length,
    starter.sourcePack.length,
  );
  const primaryAuthoritativeSourceRatio = ratio(
    starter.researchDossier.sourceSpine.filter((source) => source.role === 'primary-authoritative').length,
    starter.researchDossier.sourceSpine.length,
  );
  const graphNodeCount = starter.ontologyOverlay?.graphSeed.nodeTemplates.length ?? 0;
  const graphEdgeCount = starter.ontologyOverlay?.graphSeed.edgeTemplates.length ?? 0;
  const claimCounts = {
    supported: starter.claimLedgerSeeds.supported.length,
    weak: starter.claimLedgerSeeds.weak.length,
    missing: starter.claimLedgerSeeds.missing.length,
    stale: starter.claimLedgerSeeds.stale.length,
  };
  const totalClaimCount = claimCounts.supported + claimCounts.weak + claimCounts.missing + claimCounts.stale;
  const tacitItems = [
    ...starter.curationProfile.tacitKnowledge.workingAssumptions,
    ...starter.curationProfile.tacitKnowledge.redLines,
    ...starter.curationProfile.tacitKnowledge.approvalPolitics,
    ...starter.curationProfile.tacitKnowledge.practicalHeuristics,
    ...starter.curationProfile.tacitKnowledge.stakeholderSensitivities,
    ...starter.curationProfile.tacitKnowledge.caveats,
  ];
  const tacitAverageLength = average(tacitItems.map((item) => item.length));
  const freshnessPenalty = ratio(
    starter.sourceRefreshDocket.sourceIds.length -
      starter.sourceRefreshDocket.staleSourceIds.length -
      starter.sourceRefreshDocket.missingEvidenceGaps.length,
    starter.sourceRefreshDocket.sourceIds.length,
  );

  const metrics: CapsuleQualityRankingMetric[] = [
    {
      id: 'audit',
      label: 'Quality audit',
      score: auditAverage,
      weight: 0.24,
      detail: auditDetail(audit),
    },
    {
      id: 'sourceSpine',
      label: 'Source spine',
      score: average([
        scoreRatio(starter.sourcePack.length, 8),
        scoreRatio(starter.researchDossier.sourceSpine.length, 8),
        externalSourceRatio,
        freshSourceRatio,
        tierOneOrTwoSourceRatio,
        primaryAuthoritativeSourceRatio,
      ]),
      weight: 0.24,
      detail: `${starter.sourcePack.length} source-pack entries; ${starter.researchDossier.sourceSpine.length} dossier sources; ${percent(externalSourceRatio)} external; ${percent(freshSourceRatio)} fresh.`,
    },
    {
      id: 'claimLedger',
      label: 'Claim ledger',
      score: average([
        scoreRatio(claimCounts.supported, 3),
        scoreRatio(totalClaimCount, 8),
        ratio(claimCounts.supported, totalClaimCount),
        1 - ratio(claimCounts.missing + claimCounts.stale, totalClaimCount * 2),
      ]),
      weight: 0.15,
      detail: `supported ${claimCounts.supported}; weak ${claimCounts.weak}; missing ${claimCounts.missing}; stale ${claimCounts.stale}.`,
    },
    {
      id: 'embeddedGraph',
      label: 'Embedded graph',
      score: average([
        scoreRatio(graphNodeCount, 80),
        scoreRatio(graphEdgeCount, 80),
        scoreRatio(starter.ontologyOverlay?.graphNodeTypes.length ?? 0, 8),
        scoreRatio(starter.ontologyOverlay?.graphEdgeTypes.length ?? 0, 8),
      ]),
      weight: 0.11,
      detail: `${graphNodeCount} node templates; ${graphEdgeCount} edge templates; ${(starter.ontologyOverlay?.graphNodeTypes.length ?? 0)} node types.`,
    },
    {
      id: 'tacitKnowledge',
      label: 'Tacit knowledge',
      score: average([
        scoreRatio(starter.curationProfile.tacitKnowledge.workingAssumptions.length, 3),
        scoreRatio(starter.curationProfile.tacitKnowledge.redLines.length, 3),
        scoreRatio(starter.curationProfile.tacitKnowledge.practicalHeuristics.length, 3),
        scoreRatio(starter.curationProfile.tacitKnowledge.stakeholderSensitivities.length, 2),
        scoreRatio(tacitAverageLength, 90),
      ]),
      weight: 0.11,
      detail: `${tacitItems.length} tacit notes; average note length ${Math.round(tacitAverageLength)} chars.`,
    },
    {
      id: 'agentContract',
      label: 'Agent contract',
      score: average([
        audit.scores.agentUsability,
        audit.scores.reviewGate,
        starter.agentWorkflow.approvalNotes.match(/human|review|approval/i) ? 1 : 0,
        starter.richProfile.agentInstructions.match(/source|review|approval|canonical/i) ? 1 : 0,
      ]),
      weight: 0.1,
      detail: `${starter.agentWorkflow.preferredAgentId}; approval gate ${starter.agentWorkflow.approvalNotes.slice(0, 80)}.`,
    },
    {
      id: 'freshness',
      label: 'Refresh posture',
      score: average([
        starter.sourceRefreshDocket.status === 'verified'
          ? 1
          : starter.sourceRefreshDocket.status === 'needs-refresh'
            ? 0.8
            : 0.55,
        freshnessPenalty,
        ratio(
          starter.sourceRefreshDocket.sourceIds.length - starter.sourceRefreshDocket.staleSourceIds.length,
          starter.sourceRefreshDocket.sourceIds.length,
        ),
      ]),
      weight: 0.05,
      detail: `${starter.sourceRefreshDocket.status}; stale ${starter.sourceRefreshDocket.staleSourceIds.length}; gaps ${starter.sourceRefreshDocket.missingEvidenceGaps.length}.`,
    },
  ];
  const score = roundScore(weightedScore(metrics) * 100);
  const weakestSignals = deriveWeakestSignals(metrics);
  const reviewProposals = buildReviewProposals(starter, audit, metrics, weakestSignals);

  return {
    starterId: starter.starterId,
    label: starter.label,
    category: starter.category,
    domain: starter.domain,
    score,
    auditAverage: roundScore(auditAverage),
    sourceCount: starter.sourcePack.length,
    dossierSourceCount: starter.researchDossier.sourceSpine.length,
    externalSourceRatio: roundScore(externalSourceRatio),
    freshSourceRatio: roundScore(freshSourceRatio),
    tierOneOrTwoSourceRatio: roundScore(tierOneOrTwoSourceRatio),
    primaryAuthoritativeSourceRatio: roundScore(primaryAuthoritativeSourceRatio),
    supportedClaimCount: claimCounts.supported,
    weakClaimCount: claimCounts.weak,
    missingClaimCount: claimCounts.missing,
    staleClaimCount: claimCounts.stale,
    graphNodeCount,
    graphEdgeCount,
    weakestSignals,
    metrics,
    reviewProposals,
    reviewProposalTargets: uniqueTargets(reviewProposals.map((proposal) => proposal.target)),
  };
}

function buildReviewProposals(
  starter: CapsuleStarterDefinition,
  audit: CapsuleQualityAuditResult,
  metrics: CapsuleQualityRankingMetric[],
  weakestSignals: string[],
): CapsuleImprovementProposal[] {
  const proposals = proposeCapsuleImprovementsFromQualityAudit(audit, {
    evidenceSourceIds: [`audit:${starter.starterId}`],
    generatedBy: 'capsule-quality-audit',
  });
  const byTarget = new Set(proposals.map((proposal) => proposal.target));

  for (const metric of metrics.filter((item) => item.score < 0.92 || weakestSignals.includes(`relative-${item.id}`))) {
    const target = proposalTargetForMetric(metric.id);
    if (byTarget.has(target)) continue;
    proposals.push({
      proposalId: `ranking:${slug(`${starter.starterId}:${target}:${metric.id}`)}`,
      starterId: starter.starterId,
      target,
      rationale: `${metric.label} is among this capsule's weaker P1 signals and should be repaired through review-card approval before starter definitions change.`,
      evidenceSourceIds: [`quality-ranking:${starter.starterId}`],
      riskLevel: metric.id === 'sourceSpine' || metric.id === 'claimLedger' ? 'medium' : 'low',
      reviewStatus: 'proposed',
      generatedBy: 'capsule-quality-ranking',
    });
    byTarget.add(target);
  }

  return proposals;
}

function proposalTargetForMetric(metric: CapsuleQualityRankingMetricId): CapsuleImprovementProposalTarget {
  if (metric === 'sourceSpine' || metric === 'freshness') return 'researchDossier.sourceSpine';
  if (metric === 'claimLedger') return 'claimLedgerSeeds';
  if (metric === 'embeddedGraph') return 'ontologyOverlay.graphSeed';
  if (metric === 'tacitKnowledge') return 'curationProfile.tacitKnowledge';
  if (metric === 'agentContract') return 'richProfile.agentInstructions';
  return 'suggestedNextActions';
}

function deriveWeakestSignals(metrics: CapsuleQualityRankingMetric[]): string[] {
  const signals = new Set<string>();
  const sorted = [...metrics].sort((a, b) => a.score - b.score || b.weight - a.weight);
  for (const metric of sorted.slice(0, 3)) signals.add(`relative-${metric.id}`);
  for (const metric of metrics) {
    if (metric.score < 0.8) signals.add(`below-gate-${metric.id}`);
    else if (metric.score < 0.92) signals.add(`watch-${metric.id}`);
  }
  return Array.from(signals);
}

function auditDetail(audit: CapsuleQualityAuditResult): string {
  const scores = Object.entries(audit.scores)
    .map(([key, value]) => `${key} ${roundScore(value)}`)
    .join('; ');
  return `${scores}; findings ${audit.findings.length}; source gaps ${audit.sourceGaps.length}.`;
}

function isInternalSource(source: CapsuleStarterDefinition['sourcePack'][number]): boolean {
  const haystack = `${source.id} ${source.publisher ?? ''} ${source.url}`.toLowerCase();
  return haystack.includes('praxis') || haystack.includes('tacitus');
}

function yearFromText(value: string | null | undefined): number | null {
  const match = value?.match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function weightedScore(metrics: CapsuleQualityRankingMetric[]): number {
  const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
  return totalWeight ? metrics.reduce((sum, metric) => sum + metric.score * metric.weight, 0) / totalWeight : 0;
}

function ratio(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max(0, Math.min(1, value / total));
}

function scoreRatio(value: number, target: number): number {
  return ratio(value, target);
}

function average(values: number[]): number {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) return 0;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function roundScore(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function countValues(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function uniqueTargets(values: CapsuleImprovementProposalTarget[]): CapsuleImprovementProposalTarget[] {
  return Array.from(new Set(values));
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96) || 'capsule-quality';
}
