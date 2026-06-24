import {
  buildCapsuleQualityRankingReport,
  type CapsuleQualityRankingItem,
} from '@/lib/product/capsule-quality-ranking';
import {
  CAPSULE_STARTER_DEFINITIONS,
  resolveCapsuleTaxonomy,
  type CapsuleStarterDefinition,
} from '@/lib/product/context-capsules';

export type CapsuleLibraryCategory =
  | 'conflict'
  | 'mediation'
  | 'governance'
  | 'narrative'
  | 'human-rights'
  | 'economic'
  | 'humanitarian'
  | 'legal'
  | 'security';

export type CapsuleReadinessTier = 'verified' | 'ready' | 'review';

export interface CapsuleLibraryInside {
  sources: number;
  claims: number;
  graphNodes: number;
  graphEdges: number;
}

export interface CapsuleLibraryCoreRefs {
  userCoreId: string | null;
  situationCoreId: string | null;
  sourceCoreIds: string[];
  documentCoreIds: string[];
  toolCoreIds: string[];
  outputCoreIds: string[];
  productCoreIds: string[];
  objectiveCoreIds: string[];
  graphCoreId: string | null;
  timeCoreId: string | null;
}

export interface CapsuleLibraryEntry {
  id: string;
  title: string;
  valueProp: string;
  category: CapsuleLibraryCategory;
  capsuleType: CapsuleStarterDefinition['category'];
  starterDomain: CapsuleStarterDefinition['domain'];
  ontologyStack: string[];
  inside: CapsuleLibraryInside;
  readinessTier: CapsuleReadinessTier;
  ranking: {
    rank: number;
    score: number;
  };
  coreRefs: CapsuleLibraryCoreRefs;
}

export const CAPSULE_LIBRARY_CATEGORIES: Array<{ id: CapsuleLibraryCategory; label: string }> = [
  { id: 'conflict', label: 'Conflict' },
  { id: 'mediation', label: 'Mediation' },
  { id: 'governance', label: 'Governance' },
  { id: 'narrative', label: 'Narrative' },
  { id: 'human-rights', label: 'Human rights' },
  { id: 'economic', label: 'Economic' },
  { id: 'humanitarian', label: 'Humanitarian' },
  { id: 'legal', label: 'Legal' },
  { id: 'security', label: 'Security' },
];

const FEATURED_PER_CATEGORY = 3;

export const CAPSULE_LIBRARY_ENTRIES: CapsuleLibraryEntry[] = buildCapsuleLibraryEntries();

export function filterCapsuleLibraryEntries(
  entries: CapsuleLibraryEntry[],
  category: CapsuleLibraryCategory | 'all',
): CapsuleLibraryEntry[] {
  return category === 'all' ? entries : entries.filter((entry) => entry.category === category);
}

export function getCapsuleLibraryEntry(id: string): CapsuleLibraryEntry | null {
  return CAPSULE_LIBRARY_ENTRIES.find((entry) => entry.id === id) ?? null;
}

function buildCapsuleLibraryEntries(): CapsuleLibraryEntry[] {
  const rankingByStarter = new Map(
    buildCapsuleQualityRankingReport({ generatedAt: '2026-06-17T02:58:17.977Z' })
      .ranked
      .map((item) => [item.starterId, item]),
  );
  const starters = CAPSULE_STARTER_DEFINITIONS
    .flatMap((starter) => {
      const category = libraryCategoryForStarter(starter);
      const ranking = rankingByStarter.get(starter.starterId);
      return category && ranking ? [{ starter, category, ranking }] : [];
    });

  return CAPSULE_LIBRARY_CATEGORIES.flatMap(({ id }) => starters
    .filter((item) => item.category === id)
    .sort((a, b) => b.ranking.score - a.ranking.score || a.ranking.rank - b.ranking.rank)
    .slice(0, FEATURED_PER_CATEGORY)
    .map(({ starter, category, ranking }) => libraryEntryFromStarter(starter, category, ranking)));
}

function libraryEntryFromStarter(
  starter: CapsuleStarterDefinition,
  category: CapsuleLibraryCategory,
  ranking: CapsuleQualityRankingItem,
): CapsuleLibraryEntry {
  const claims =
    starter.claimLedgerSeeds.supported.length +
    starter.claimLedgerSeeds.weak.length +
    starter.claimLedgerSeeds.missing.length +
    starter.claimLedgerSeeds.stale.length;
  const graphNodes = starter.ontologyOverlay?.graphSeed.nodeTemplates.length ?? 0;
  const graphEdges = starter.ontologyOverlay?.graphSeed.edgeTemplates.length ?? 0;
  const taxonomy = resolveCapsuleTaxonomy(starter);
  const ontologyStack = uniqueStrings([
    ...(starter.ontologyOverlay?.baseOntologyIds ?? []),
    starter.ontologyOverlay?.workOntologyId ?? null,
    ...taxonomy.policyTeams.map((team) => team.label),
    ...(starter.ontologyOverlay?.graphNodeTypes.slice(0, 4) ?? []),
  ]).slice(0, 6);

  return {
    id: starter.starterId,
    title: starter.label,
    valueProp: cleanOneLine(starter.summary),
    category,
    capsuleType: starter.category,
    starterDomain: starter.domain,
    ontologyStack,
    inside: {
      sources: starter.sourcePack.length,
      claims,
      graphNodes,
      graphEdges,
    },
    readinessTier: readinessTier(starter.readinessStars, ranking.score),
    ranking: {
      rank: ranking.rank,
      score: ranking.score,
    },
    coreRefs: {
      userCoreId: starter.coreRefs.userCoreId ?? null,
      situationCoreId: starter.coreRefs.situationCoreId ?? null,
      sourceCoreIds: uniqueStrings([
        ...(starter.coreRefs.sourceCoreIds ?? []),
        ...starter.sourcePack.map((source) => source.id),
      ]),
      documentCoreIds: [...(starter.coreRefs.documentCoreIds ?? [])],
      toolCoreIds: uniqueStrings([
        ...(starter.coreRefs.toolCoreIds ?? []),
        ...starter.recommendedToolIds.slice(0, 2),
      ]),
      outputCoreIds: uniqueStrings([
        ...(starter.coreRefs.outputCoreIds ?? []),
        ...starter.outputProductIds,
      ]),
      productCoreIds: uniqueStrings([
        ...(starter.coreRefs.productCoreIds ?? []),
        ...starter.outputProductIds,
      ]),
      objectiveCoreIds: [...(starter.coreRefs.objectiveCoreIds ?? [])],
      graphCoreId: starter.coreRefs.graphCoreId ?? null,
      timeCoreId: starter.coreRefs.timeCoreId ?? null,
    },
  };
}

function libraryCategoryForStarter(starter: CapsuleStarterDefinition): CapsuleLibraryCategory | null {
  const haystack = [
    starter.starterId,
    starter.label,
    starter.domain,
    ...starter.tags,
  ].join(' ').toLowerCase();

  if (matchesAny(haystack, ['mediation', 'mediator', 'negotiation', 'batna', 'zopa', 'ceasefire-monitoring'])) return 'mediation';
  if (matchesAny(haystack, ['human-rights', 'accountability', 'rights', 'ihl', 'ohchr'])) return 'human-rights';
  if (matchesAny(haystack, ['humanitarian', 'access', 'displacement', 'ocha', 'reliefweb', 'protection'])) return 'humanitarian';
  if (starter.domain === 'finance' || starter.domain === 'critical-minerals' || starter.domain === 'sustainability' || starter.domain === 'exposure-mapping' || matchesAny(haystack, ['economic', 'sanctions', 'debt', 'trade', 'cbam', 'market'])) return 'economic';
  if (matchesAny(haystack, ['legal', 'mandate', 'compliance', 'rule-of-law', 'treaty'])) return 'legal';
  if (matchesAny(haystack, ['narrative', 'media', 'information', 'disinformation', 'integrity', 'cyber'])) return 'narrative';
  if (matchesAny(haystack, ['security', 'defence', 'armed-conflict', 'war', 'escalation', 'houthi', 'baltic', 'resilience'])) return 'security';
  if (starter.domain === 'ai-governance' || starter.domain === 'policy-review' || starter.domain === 'public-health' || starter.domain === 'election-integrity' || matchesAny(haystack, ['governance', 'public-sector', 'regulatory', 'implementation'])) return 'governance';
  if (matchesAny(haystack, ['conflict', 'crisis', 'diplomacy', 'stabilization', 'transition', 'normalization'])) return 'conflict';
  return null;
}

function readinessTier(stars: number, score: number): CapsuleReadinessTier {
  if (stars >= 5 && score >= 86) return 'verified';
  if (stars >= 4 && score >= 82) return 'ready';
  return 'review';
}

function matchesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

function cleanOneLine(value: string): string {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > 150 ? `${text.slice(0, 147).trimEnd()}...` : text;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim())));
}
