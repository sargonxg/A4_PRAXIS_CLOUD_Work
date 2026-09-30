import {
  buildCapsuleQualityRankingReport,
  type CapsuleQualityRankingItem,
} from '@/lib/product/capsule-quality-ranking';
import {
  CAPSULE_STARTER_DEFINITIONS,
  getCapsuleStarterDefinition,
  resolveCapsuleTaxonomy,
  type CapsuleResolvedTaxonomy,
  type CapsuleStarterDefinition,
  type CapsuleTaxonomyFacet,
  type CapsuleTaxonomyInput,
} from '@/lib/product/context-capsules';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { POLICY_CAPSULE_SPOTLIGHTS } from '@/lib/capsules/spotlights';
import {
  isCapsuleDockSlotKind,
  type CapsuleDockSlotKind,
} from '@/lib/context/active-context-stack';

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

export interface CapsuleLibraryResearchSignals {
  sourceSpineCount: number;
  evidenceGapCount: number;
  refreshStatus: string;
  graphNodeCount: number;
  graphEdgeCount: number;
  unsupportedClaimCount: number;
}

export interface CapsuleLibraryTaxonomy {
  types: CapsuleTaxonomyFacet[];
  domains: CapsuleTaxonomyFacet[];
  policyTeams: CapsuleTaxonomyFacet[];
}

export interface CapsuleLibraryFacetOption {
  id: string;
  label: string;
  tag: string;
  count: number;
}

export interface CapsuleLibraryFacetOptions {
  types: CapsuleLibraryFacetOption[];
  domains: CapsuleLibraryFacetOption[];
  teams: CapsuleLibraryFacetOption[];
}

export interface CapsuleLibraryFacetFilters {
  type?: string | null;
  domain?: string | null;
  team?: string | null;
}

export type CapsuleDockSlotProposalInput =
  | CapsuleLibraryEntry
  | CapsuleResolvedTaxonomy
  | CapsuleTaxonomyInput
  | { taxonomy: Pick<CapsuleLibraryTaxonomy, 'types'> };

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
  origin: 'starter' | 'user';
  reviewState?: 'draft' | 'needs-review' | 'decisions-saved' | 'archived' | 'starter';
  updatedAt?: string | null;
  structuralScore?: number | null;
  unsupportedAssessed?: boolean;
  version: number | null;
  capsuleType: CapsuleStarterDefinition['category'];
  starterDomain: CapsuleStarterDefinition['domain'];
  ontologyStack: string[];
  inside: CapsuleLibraryInside;
  researchSignals: CapsuleLibraryResearchSignals;
  readinessTier: CapsuleReadinessTier;
  searchKeywords: string[];
  taxonomy: CapsuleLibraryTaxonomy;
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

export function filterCapsuleRepositoryEntries(
  entries: CapsuleLibraryEntry[],
  category: CapsuleLibraryCategory | 'all',
  query: string,
  facets: CapsuleLibraryFacetFilters = {},
): CapsuleLibraryEntry[] {
  const categoryFiltered = filterCapsuleLibraryEntries(entries, category);
  const tokens = tokenizeSearch(query);
  return categoryFiltered.filter((entry) => {
    if (!matchesFacet(entry.taxonomy.types, facets.type)) return false;
    if (!matchesFacet(entry.taxonomy.domains, facets.domain)) return false;
    if (!matchesFacet(entry.taxonomy.policyTeams, facets.team)) return false;
    if (!tokens.length) return true;
    const haystack = repositorySearchText(entry);
    return tokens.every((token) => haystack.includes(token));
  });
}

export function buildCapsuleLibraryFacetOptions(entries: CapsuleLibraryEntry[]): CapsuleLibraryFacetOptions {
  return {
    types: facetOptionsFromEntries(entries, (entry) => entry.taxonomy.types),
    domains: facetOptionsFromEntries(entries, (entry) => entry.taxonomy.domains),
    teams: facetOptionsFromEntries(entries, (entry) => entry.taxonomy.policyTeams),
  };
}

export function proposeDockSlotForCapsule(input: CapsuleDockSlotProposalInput): CapsuleDockSlotKind {
  const taxonomy = isResolvedTaxonomy(input)
    ? input
    : isTaxonomyCarrier(input)
      ? input.taxonomy
      : resolveCapsuleTaxonomy(input);

  for (const facet of taxonomy.types) {
    const candidate = (facet.value ?? facet.id ?? facet.tag.replace(/^type:/, '')).toLowerCase();
    if (isCapsuleDockSlotKind(candidate)) return candidate;
  }
  return 'situation';
}

export function buildCapsuleRepositoryEntries(input: {
  userCapsules?: PraxisCapsule[];
  starterEntries?: CapsuleLibraryEntry[];
} = {}): CapsuleLibraryEntry[] {
  const userEntries = (input.userCapsules ?? []).map(capsuleRepositoryEntryFromCapsule);
  const userIds = new Set(userEntries.map((entry) => entry.id));
  const starterEntries = (input.starterEntries ?? CAPSULE_LIBRARY_ENTRIES)
    .filter((entry) => !userIds.has(entry.id));
  return [...userEntries, ...starterEntries];
}

export function capsuleRepositoryEntryFromCapsule(capsule: PraxisCapsule): CapsuleLibraryEntry {
  const refs = capsule.coreRefs;
  const tags = capsule.community?.tags ?? [];
  const starter = getCapsuleStarterDefinition(capsule.capsuleId);
  const capsuleType = starter?.category ?? capsuleTypeForCapsule(capsule);
  const starterDomain = starter?.domain ?? domainForCapsule(capsule);
  const taxonomy = resolveCapsuleTaxonomy({
    capsuleId: capsule.capsuleId,
    category: capsuleType,
    domain: starterDomain,
    scope: capsule.scope,
    community: capsule.community,
    starterSnapshot: capsule.starterSnapshot as CapsuleTaxonomyInput['starterSnapshot'],
    coreRefs: refs,
  });
  const ontologyStack = uniqueStrings([
    ...ontologyIdsForCapsule(capsule),
    capsule.activeOntologyStackId ?? null,
    ...tags.filter((tag) => /ontology|aco:|actor|claim|source|event|narrative/i.test(tag)),
  ]).slice(0, 6);
  const sourceRefs = Array.isArray(capsule.sourceRefs) ? capsule.sourceRefs.length : 0;
  const claims = claimsCountForCapsule(capsule);
  const graphNodes = capsule.graphStats?.nodeCount ?? 0;
  const graphEdges = capsule.graphStats?.edgeCount ?? 0;
  const researchSignals = researchSignalsForCapsule(capsule, {
    sourceCount: refs.sourceCoreIds.length + refs.documentCoreIds.length + sourceRefs,
    graphNodes,
    graphEdges,
  });
  const score = capsule.trust?.score ?? capsule.health?.score ?? 0;

  return {
    id: capsule.capsuleId,
    title: capsule.label,
    valueProp: cleanOneLine(capsule.summary || capsule.trust?.summary || 'Saved user capsule.'),
    category: libraryCategoryForCapsule(capsule),
    origin: 'user',
    reviewState: capsule.archivedAt ? 'archived' : capsule.latestGateState === 'applied' ? 'decisions-saved' : capsule.latestGateState === 'draft' ? 'draft' : 'needs-review',
    updatedAt: capsule.updatedAt,
    structuralScore: capsule.health?.score ?? null,
    unsupportedAssessed: [...(Array.isArray(capsule.claimLedger) ? capsule.claimLedger : []), ...(capsule.v3?.claimLedger?.allClaims ?? [])].some((claim) => isRecord(claim) && (typeof claim.support === 'string' || typeof claim.status === 'string')),
    version: capsule.version ?? null,
    capsuleType,
    starterDomain,
    ontologyStack: ontologyStack.length ? ontologyStack : ['workspace context'],
    inside: {
      sources: refs.sourceCoreIds.length + refs.documentCoreIds.length + sourceRefs,
      claims,
      graphNodes,
      graphEdges,
    },
    researchSignals,
    readinessTier: readinessTierForCapsule(capsule),
    searchKeywords: uniqueStrings([
      ...tags,
      ...claimTextsForCapsule(capsule),
      ...refs.sourceCoreIds,
      ...refs.documentCoreIds,
      ...(refs.toolCoreIds ?? []),
      ...refs.outputCoreIds,
      ...(refs.productCoreIds ?? []),
    ]).slice(0, 80),
    taxonomy,
    ranking: {
      rank: 0,
      score,
    },
    coreRefs: {
      userCoreId: refs.userCoreId ?? null,
      situationCoreId: refs.situationCoreId ?? null,
      sourceCoreIds: refs.sourceCoreIds ?? [],
      documentCoreIds: refs.documentCoreIds ?? [],
      toolCoreIds: refs.toolCoreIds ?? [],
      outputCoreIds: refs.outputCoreIds ?? [],
      productCoreIds: refs.productCoreIds ?? [],
      objectiveCoreIds: refs.objectiveCoreIds ?? [],
      graphCoreId: refs.graphCoreId ?? null,
      timeCoreId: refs.timeCoreId ?? null,
    },
  };
}

export function getCapsuleLibraryEntry(id: string): CapsuleLibraryEntry | null {
  return CAPSULE_LIBRARY_ENTRIES.find((entry) => entry.id === id) ?? null;
}

function buildCapsuleLibraryEntries(): CapsuleLibraryEntry[] {
  const spotlightIds = new Set<string>(POLICY_CAPSULE_SPOTLIGHTS.map((item) => item.id));
  const rankingByStarter = new Map(
    buildCapsuleQualityRankingReport({ generatedAt: '2026-06-17T02:58:17.977Z' })
      .ranked
      .map((item) => [item.starterId, item]),
  );
  const starters = CAPSULE_STARTER_DEFINITIONS
    .flatMap((starter) => {
      const category = libraryCategoryForStarter(starter)
        ?? (spotlightIds.has(starter.starterId) ? 'governance' : null);
      const ranking = rankingByStarter.get(starter.starterId);
      return category && ranking ? [{ starter, category, ranking }] : [];
    });

  const featured = CAPSULE_LIBRARY_CATEGORIES.flatMap(({ id }) => starters
    .filter((item) => item.category === id)
    .sort((a, b) => b.ranking.score - a.ranking.score || a.ranking.rank - b.ranking.rank)
    .slice(0, FEATURED_PER_CATEGORY)
    .map(({ starter, category, ranking }) => libraryEntryFromStarter(starter, category, ranking)));
  const spotlights = starters.filter(({ starter }) => spotlightIds.has(starter.starterId))
    .map(({ starter, category, ranking }) => libraryEntryFromStarter(starter, category, ranking));
  return Array.from(new Map([...spotlights, ...featured].map((entry) => [entry.id, entry])).values());
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
    origin: 'starter',
    reviewState: 'starter',
    structuralScore: ranking.score,
    unsupportedAssessed: true,
    version: null,
    capsuleType: starter.category,
    starterDomain: starter.domain,
    ontologyStack,
    inside: {
      sources: starter.sourcePack.length,
      claims,
      graphNodes,
      graphEdges,
    },
    researchSignals: {
      sourceSpineCount: starter.researchDossier.sourceSpine.length,
      evidenceGapCount: starter.researchDossier.knownEvidenceGaps.length,
      refreshStatus: starter.sourceRefreshDocket.status,
      graphNodeCount: starter.graphLiteProjection.nodeCount,
      graphEdgeCount: starter.graphLiteProjection.edgeCount,
      unsupportedClaimCount: starter.claimLedgerSeeds.missing.length + starter.claimLedgerSeeds.stale.length,
    },
    readinessTier: readinessTier(starter.readinessStars, ranking.score),
    searchKeywords: uniqueStrings([
      ...starter.tags,
      ...starter.sourcePack.flatMap((source) => [source.id, source.label, source.publisher]),
      ...starter.recommendedToolIds,
      ...starter.outputProductIds,
      starter.summary,
    ]).slice(0, 80),
    taxonomy,
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

function libraryCategoryForCapsule(capsule: PraxisCapsule): CapsuleLibraryCategory {
  const starterCategory = categoryFromUnknown(capsule.starterSnapshot);
  if (starterCategory) return starterCategory;
  const text = [
    capsule.capsuleId,
    capsule.label,
    capsule.summary,
    capsule.scope,
    ...capsule.community.tags,
    domainForCapsule(capsule),
    ...ontologyIdsForCapsule(capsule),
  ].join(' ').toLowerCase();
  return libraryCategoryForText(text) ?? 'governance';
}

function categoryFromUnknown(value: unknown): CapsuleLibraryCategory | null {
  if (!isRecord(value)) return null;
  return libraryCategoryForText([
    stringFromUnknown(value.category),
    stringFromUnknown(value.domain),
    stringFromUnknown(value.starterId),
    stringFromUnknown(value.label),
  ].join(' ').toLowerCase());
}

function libraryCategoryForStarter(starter: CapsuleStarterDefinition): CapsuleLibraryCategory | null {
  const haystack = [
    starter.starterId,
    starter.label,
    starter.domain,
    ...starter.tags,
  ].join(' ').toLowerCase();

  return libraryCategoryForText(haystack);
}

function libraryCategoryForText(haystack: string): CapsuleLibraryCategory | null {
  if (matchesAny(haystack, ['mediation', 'mediator', 'negotiation', 'batna', 'zopa', 'ceasefire-monitoring'])) return 'mediation';
  if (matchesAny(haystack, ['human-rights', 'human rights', 'accountability', 'rights', 'ihl', 'ohchr'])) return 'human-rights';
  if (matchesAny(haystack, ['humanitarian', 'access', 'displacement', 'ocha', 'reliefweb', 'protection'])) return 'humanitarian';
  if (matchesAny(haystack, ['finance', 'critical-minerals', 'sustainability', 'exposure-mapping', 'economic', 'sanctions', 'debt', 'trade', 'cbam', 'market'])) return 'economic';
  if (matchesAny(haystack, ['legal', 'mandate', 'compliance', 'rule-of-law', 'treaty'])) return 'legal';
  if (matchesAny(haystack, ['narrative', 'media', 'information', 'disinformation', 'integrity', 'cyber'])) return 'narrative';
  if (matchesAny(haystack, ['security', 'defence', 'armed-conflict', 'war', 'escalation', 'houthi', 'baltic', 'resilience'])) return 'security';
  if (matchesAny(haystack, ['ai-governance', 'policy-review', 'public-health', 'election-integrity', 'governance', 'public-sector', 'regulatory', 'implementation'])) return 'governance';
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

function repositorySearchText(entry: CapsuleLibraryEntry): string {
  return [
    entry.id,
    entry.title,
    entry.valueProp,
    entry.category,
    entry.origin,
    entry.capsuleType,
    entry.starterDomain,
    entry.readinessTier,
    ...entry.searchKeywords,
    ...entry.ontologyStack,
    ...entry.taxonomy.types.map((facet) => `${facet.label} ${facet.tag}`),
    ...entry.taxonomy.domains.map((facet) => `${facet.label} ${facet.tag}`),
    ...entry.taxonomy.policyTeams.map((facet) => `${facet.label} ${facet.tag}`),
    entry.coreRefs.userCoreId,
    entry.coreRefs.situationCoreId,
    entry.coreRefs.graphCoreId,
    entry.coreRefs.timeCoreId,
    ...entry.coreRefs.sourceCoreIds,
    ...entry.coreRefs.documentCoreIds,
    ...entry.coreRefs.toolCoreIds,
    ...entry.coreRefs.outputCoreIds,
    ...entry.coreRefs.productCoreIds,
    ...entry.coreRefs.objectiveCoreIds,
  ].filter(Boolean).join(' ').toLowerCase();
}

function tokenizeSearch(value: string): string[] {
  return value.toLowerCase().split(/\s+/).map((token) => token.trim()).filter(Boolean);
}

function facetOptionsFromEntries(
  entries: CapsuleLibraryEntry[],
  facetsForEntry: (entry: CapsuleLibraryEntry) => CapsuleTaxonomyFacet[],
): CapsuleLibraryFacetOption[] {
  const options = new Map<string, CapsuleLibraryFacetOption>();
  for (const entry of entries) {
    for (const facet of facetsForEntry(entry)) {
      const tag = facet.tag.trim();
      if (!tag) continue;
      const current = options.get(tag);
      options.set(tag, {
        id: facet.id,
        label: facet.label,
        tag,
        count: (current?.count ?? 0) + 1,
      });
    }
  }
  return Array.from(options.values()).sort((a, b) => a.label.localeCompare(b.label) || a.tag.localeCompare(b.tag));
}

function matchesFacet(facets: CapsuleTaxonomyFacet[], selected: string | null | undefined): boolean {
  if (!selected || selected === 'all') return true;
  return facets.some((facet) => facet.tag === selected);
}

function isResolvedTaxonomy(input: unknown): input is CapsuleResolvedTaxonomy {
  if (!isRecord(input)) return false;
  return Array.isArray(input.types) && Array.isArray(input.domains) && Array.isArray(input.policyTeams);
}

function isTaxonomyCarrier(input: unknown): input is { taxonomy: Pick<CapsuleLibraryTaxonomy, 'types'> } {
  return isRecord(input) && isRecord(input.taxonomy) && Array.isArray(input.taxonomy.types);
}

function ontologyIdsForCapsule(capsule: PraxisCapsule): string[] {
  return uniqueStrings([
    ...stringListFromUnknown(capsule.v3?.grounding?.ontologyBinding?.ontologyIds),
    ...stringListFromUnknown(capsule.v3?.grounding?.ontologyBinding?.taxonomyPath),
    stringFromUnknown(capsule.v3?.grounding?.ontologyBinding?.domainId),
  ]);
}

function domainForCapsule(capsule: PraxisCapsule): CapsuleStarterDefinition['domain'] {
  const posture = isRecord(capsule.memoryPosture) ? capsule.memoryPosture : null;
  const builderDraft = isRecord(posture?.builderDraft) ? posture.builderDraft : null;
  const domain = stringFromUnknown(builderDraft?.domain)
    ?? stringFromUnknown(capsule.v3?.grounding?.ontologyBinding?.domainId)
    ?? stringFromUnknown(capsule.starterSnapshot && isRecord(capsule.starterSnapshot) ? capsule.starterSnapshot.domain : null)
    ?? 'generic';
  return domain as CapsuleStarterDefinition['domain'];
}

function capsuleTypeForCapsule(capsule: PraxisCapsule): CapsuleStarterDefinition['category'] {
  if (capsule.scope === 'user' || capsule.coreRefs.userCoreId) return 'user';
  if ((capsule.coreRefs.toolCoreIds?.length ?? 0) > 0 && !capsule.coreRefs.situationCoreId) return 'tool';
  if ((capsule.coreRefs.outputCoreIds?.length ?? 0) + (capsule.coreRefs.productCoreIds?.length ?? 0) > 0 && !capsule.coreRefs.situationCoreId) return 'output';
  return 'situation';
}

function claimsCountForCapsule(capsule: PraxisCapsule): number {
  const v3Claims = capsule.v3?.claimLedger?.allClaims;
  if (Array.isArray(v3Claims) && v3Claims.length) return v3Claims.length;
  return Array.isArray(capsule.claimLedger) ? capsule.claimLedger.length : 0;
}

function researchSignalsForCapsule(
  capsule: PraxisCapsule,
  fallback: { sourceCount: number; graphNodes: number; graphEdges: number },
): CapsuleLibraryResearchSignals {
  const snapshot = isRecord(capsule.starterSnapshot) ? capsule.starterSnapshot : null;
  const dossier = isRecord(snapshot?.researchDossier) ? snapshot.researchDossier : null;
  const refreshDocket = isRecord(snapshot?.sourceRefreshDocket) ? snapshot.sourceRefreshDocket : null;
  const graphLiteProjection = isRecord(snapshot?.graphLiteProjection) ? snapshot.graphLiteProjection : null;
  const claimLedgerSeeds = isRecord(snapshot?.claimLedgerSeeds) ? snapshot.claimLedgerSeeds : null;
  const evidenceGaps = stringListFromUnknown(dossier?.knownEvidenceGaps);
  const staleSourceIds = stringListFromUnknown(refreshDocket?.staleSourceIds);
  const missingClaims = Array.isArray(claimLedgerSeeds?.missing) ? claimLedgerSeeds.missing.length : 0;
  const staleClaims = Array.isArray(claimLedgerSeeds?.stale) ? claimLedgerSeeds.stale.length : 0;
  const unsupportedClaims = unsupportedClaimsCountForCapsule(capsule);

  return {
    sourceSpineCount: Array.isArray(dossier?.sourceSpine) ? dossier.sourceSpine.length : fallback.sourceCount,
    evidenceGapCount: evidenceGaps.length || stringListFromUnknown(refreshDocket?.missingEvidenceGaps).length,
    refreshStatus: stringFromUnknown(refreshDocket?.status) ?? (staleSourceIds.length ? 'needs-refresh' : 'workspace-capsule'),
    graphNodeCount: numberFromUnknown(graphLiteProjection?.nodeCount) ?? fallback.graphNodes,
    graphEdgeCount: numberFromUnknown(graphLiteProjection?.edgeCount) ?? fallback.graphEdges,
    unsupportedClaimCount: missingClaims + staleClaims || unsupportedClaims,
  };
}

function unsupportedClaimsCountForCapsule(capsule: PraxisCapsule): number {
  const v3Claims = capsule.v3?.claimLedger?.allClaims;
  const claims = Array.isArray(v3Claims) && v3Claims.length ? v3Claims : capsule.claimLedger;
  if (!Array.isArray(claims)) return 0;
  return claims.filter((claim) => {
    if (!isRecord(claim)) return false;
    const support = `${stringFromUnknown(claim.support) ?? stringFromUnknown(claim.status) ?? ''}`.toLowerCase();
    return /unsupported|missing|stale|weak/.test(support);
  }).length;
}

function claimTextsForCapsule(capsule: PraxisCapsule): string[] {
  const v3Claims = capsule.v3?.claimLedger?.allClaims;
  const claims = Array.isArray(v3Claims) && v3Claims.length ? v3Claims : capsule.claimLedger;
  if (!Array.isArray(claims)) return [];
  return claims.flatMap((claim) => {
    if (!isRecord(claim)) return [];
    return [stringFromUnknown(claim.text) ?? stringFromUnknown(claim.claim)].filter((value): value is string => Boolean(value));
  });
}

function readinessTierForCapsule(capsule: PraxisCapsule): CapsuleReadinessTier {
  const score = capsule.trust?.score ?? capsule.health?.score ?? 0;
  if (score >= 88) return 'verified';
  if (score >= 70) return 'ready';
  return 'review';
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim())));
}

function stringFromUnknown(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function stringListFromUnknown(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function numberFromUnknown(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
