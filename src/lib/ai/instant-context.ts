import { buildCapsuleRetrievalPlan, type TurnCapsule } from '@/lib/ai/context-kernel';
import { buildCapsulePromptBlock, type InjectableContext } from '@/lib/context/context-injection';
import { DEFAULT_CONTEXT_STACK_ID, sanitizeActiveContextStack } from '@/lib/context/active-context-stack';
import type { CapsuleCoreRefs, PraxisCapsule } from '@/lib/context/capsule-service';
import { isTemporalIntent } from '@/lib/context/temporal-timeline';
import { classifyDomain } from '@/lib/domain/classifier';
import { resolveDomain } from '@/lib/domain/resolve';
import type { TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import type { OntologyId } from '@/lib/ontology/types';
import type { CapsuleOntologyBinding, CapsuleTemporality, SourcingPolicy } from '@/types/context-capsule';
import type { DomainId } from '@/types/domain';

export interface InstantContextInput { uid: string; prompt: string; situationId?: string; }
export interface InstantContextResult {
  turnCapsule: TurnCapsule;
  capsuleContext: InjectableContext;
  ephemeral: true;
  domain: string;
  rationale: string;
}

const LOW_CONFIDENCE_FLOOR = 0.55;

const DOMAIN_PRIMITIVES: Partial<Record<DomainId, TacitusCorePrimitive[]>> = {
  generic: ['Actor', 'Claim', 'Interest', 'Constraint'],
  'armed-conflict-security': ['Actor', 'Claim', 'Interest', 'Constraint'],
  'diplomacy-negotiation': ['Actor', 'Claim', 'Interest', 'Commitment'],
  humanitarian: ['Actor', 'Claim', 'Event', 'Constraint'], 'human-rights': ['Actor', 'Claim', 'Constraint', 'Event'],
  'governance-rule-of-law': ['Actor', 'Claim', 'Constraint', 'Commitment'], 'economic-sanctions': ['Actor', 'Claim', 'Leverage', 'Constraint'],
  'development-stabilization': ['Actor', 'Interest', 'Constraint', 'Commitment'],
  'climate-environmental-security': ['Actor', 'Claim', 'Event', 'Constraint'],
  'information-cyber': ['Actor', 'Claim', 'Narrative', 'Event'], 'transnational-threats': ['Actor', 'Claim', 'Leverage', 'Event'],
};

const DOMAIN_ONTOLOGIES: Partial<Record<DomainId, OntologyId[]>> = {
  generic: ['governance'], 'armed-conflict-security': ['conflict', 'security'],
  'diplomacy-negotiation': ['mediation', 'governance'], humanitarian: ['humanitarian'],
  'human-rights': ['human-rights', 'legal'], 'governance-rule-of-law': ['governance', 'legal'],
  'economic-sanctions': ['economic', 'governance'], 'development-stabilization': ['governance', 'humanitarian'],
  'climate-environmental-security': ['security', 'governance'], 'information-cyber': ['narrative', 'security'],
  'transnational-threats': ['security', 'conflict'],
};

const LIVE_SEARCH_30_DAY_DOMAINS = new Set<DomainId>([
  'armed-conflict-security', 'humanitarian', 'information-cyber',
]);

const MULTI_YEAR_DOMAINS = new Set<DomainId>([
  'governance-rule-of-law', 'economic-sanctions', 'human-rights', 'diplomacy-negotiation',
]);

export async function buildInstantContextCapsule(input: InstantContextInput): Promise<InstantContextResult> {
  const now = new Date().toISOString();
  const prompt = cleanSignal(input.prompt, 4_000) ?? '';
  const classification = await classifyDomain({ name: prompt.slice(0, 160), description: prompt });
  const domainId: DomainId = classification.confidence >= LOW_CONFIDENCE_FLOOR ? classification.domainId : 'generic';
  const domainConfig = await resolveDomain(domainId);
  const temporalIntent = isTemporalIntent(prompt);
  const freshnessWindowDays = temporalIntent ? Math.max(recencyWindowDaysFor(domainId), 1_095) : recencyWindowDaysFor(domainId);
  const capsuleId = `instant-${Date.now().toString(36)}`;
  const primitives = DOMAIN_PRIMITIVES[domainId] ?? DOMAIN_PRIMITIVES.generic!;
  const ontologyIds = DOMAIN_ONTOLOGIES[domainId] ?? DOMAIN_ONTOLOGIES.generic!;
  const sourcingPolicy = buildSourcingPolicy(domainId, freshnessWindowDays, domainConfig.preferredFeeds);
  const temporality = buildTemporality(now, freshnessWindowDays);
  const ontologyBinding: CapsuleOntologyBinding = {
    domainId,
    taxonomyPath: domainId === 'generic' ? ['generic'] : ['generic', domainId],
    ontologyIds,
    acoPrimitives: primitives,
    bindingRationale: `Instant context binds the prompt to ${domainId} for live-search grounding; it is ephemeral and requires source verification before reliance.`,
  };
  const refs = buildInstantCoreRefs(input.situationId);
  const capsule = buildCapsule({ capsuleId, uid: input.uid, now, refs, domainId, ontologyBinding, temporality, freshnessWindowDays });
  const stack = sanitizeActiveContextStack({ stackId: DEFAULT_CONTEXT_STACK_ID, capsuleId, situationId: cleanSignal(input.situationId), updatedAt: now });
  const promptBlock = [
    '<praxis-context-capsule-instant>',
    'context_mode: instant context',
    'warning: This instant context was synthesized from the user prompt. It is NOT a saved ContextCapsule and must not be treated as durable PRAXIS memory.',
    'grounding_mode: LIVE SEARCH',
    `capsule_id: ${capsuleId}`,
    `domain_id: ${domainId}`,
    `domain_confidence: ${classification.confidence.toFixed(2)}`,
    `domain_rationale: ${promptSafeLine(classification.rationale || 'classifier returned no rationale')}`,
    `ontology_ids: ${ontologyIds.join(', ')}`,
    `aco_primitives: ${primitives.join(', ')}`,
    `frameworks: ${compactList(domainConfig.frameworks, 6)}`,
    `preferred_feeds: ${compactList(domainConfig.preferredFeeds, 6)}`,
    `sourcing_policy: mode=${sourcingPolicy.mode}; minSourcesPerClaim=${sourcingPolicy.minSourcesPerClaim}; recencyWindowDays=${sourcingPolicy.recencyWindowDays}; citationStyle=${sourcingPolicy.citationStyle}; requiredSourceTypes=${sourcingPolicy.requiredSourceTypes.join(', ') || 'none'}`,
    `temporality: asOf=${temporality.asOf}; validFrom=${temporality.validFrom}; temporalIntent=${temporalIntent ? 'yes' : 'no'}`,
    `prompt_signal: ${promptSafeLine(prompt || 'empty prompt')}`,
    'rule: The agent MUST verify checkable/current claims by calling a search/grounding tool, structure findings against the ontology primitives, cite sources inline, and surface gaps honestly.',
    '</praxis-context-capsule-instant>',
    '',
    buildCapsulePromptBlock(capsule, { resolvedAt: now, situationId: input.situationId, activeContextStack: stack }),
  ].join('\n');
  const capsuleContext: InjectableContext = {
    capsule,
    associatedCapsules: [],
    missingAssociatedCapsuleIds: [],
    dockCapsules: [],
    missingDockCapsuleIds: [],
    stack,
    injectionKey: `instant:${capsuleId}:v0`,
    promptBlock,
    sharePath: `/app?capsuleId=${encodeURIComponent(capsuleId)}`,
    resolvedAt: now,
  };
  const baseCapsule = {
    traceId: `turn_instant_${Date.now().toString(36)}`,
    capsuleId,
    capsuleVersion: 0,
    stack: {
      stackId: capsuleId,
      label: capsule.label,
      scope: capsule.scope,
      parentCapsuleId: null,
      forkedFromVersion: null,
      activeForSituationIds: capsule.activeForSituationIds,
      lockedCoreKinds: [],
    },
    userCore: refs.userCoreId,
    situationCore: refs.situationCoreId,
    sourceDocumentCore: [],
    graphCore: refs.graphCoreId,
    memoryCore: null,
    outputCore: [],
    retrievedEvidence: [],
    graphProposalCounts: { proposed: 0, accepted: 0, rejected: 0 },
    activeGaps: capsule.health.warnings,
    recentToolOutputs: [],
    tokenBudgetReport: {
      maxInputTokens: 24_000,
      reservedOutputTokens: 4_000,
      estimatedContextChars: promptBlock.length,
      estimatedContextTokens: Math.ceil(promptBlock.length / 4),
      droppedCores: [],
    },
    injectableContext: capsuleContext,
    memory: { semantic: [], episodic: [], procedural: [] },
  } satisfies Omit<TurnCapsule, 'retrievalPlan'>;
  const turnCapsule: TurnCapsule = { ...baseCapsule, retrievalPlan: buildCapsuleRetrievalPlan(baseCapsule) };
  return {
    turnCapsule,
    capsuleContext,
    ephemeral: true,
    domain: domainId,
    rationale: `Detected ${domainId} at ${classification.confidence.toFixed(2)} confidence; using ${primitives.join('/')} with live-search sourcing over ${freshnessWindowDays} day(s).`,
  };
}

function buildInstantCoreRefs(situationId: string | undefined): CapsuleCoreRefs {
  return {
    userCoreId: null, teamCoreId: null, situationCoreId: cleanSignal(situationId), pathCoreId: null,
    sourceCoreIds: [], documentCoreIds: [], graphCoreId: null, timeCoreId: null, outputCoreIds: [],
    toolCoreIds: ['instant-context'], objectiveCoreIds: [], productCoreIds: [], memoryCoreId: null,
  };
}

function buildCapsule(input: {
  capsuleId: string; uid: string; now: string; refs: CapsuleCoreRefs; domainId: DomainId;
  ontologyBinding: CapsuleOntologyBinding; temporality: CapsuleTemporality; freshnessWindowDays: number;
}): PraxisCapsule {
  return {
    capsuleId: input.capsuleId,
    ownerUid: input.uid,
    scope: 'situation',
    summary: 'Ephemeral instant context synthesized from the prompt and not saved.',
    parentCapsuleId: null,
    forkedFromVersion: null,
    associatedCapsuleIds: [],
    coreRefs: input.refs,
    retrievalPolicy: {
      layers: ['sources', 'graph', 'documents', 'tool-output'], limit: 8,
      checkFreshness: true, freshnessWindowDays: input.freshnessWindowDays,
    },
    health: {
      score: 45,
      semaphore: 'amber',
      signals: [],
      missingCores: [],
      warnings: ['instant context: no saved capsule or situation corpus was selected; verify current claims with live search before relying on the answer.'],
      blockers: [],
    },
    activeForSituationIds: input.refs.situationCoreId ? [input.refs.situationCoreId] : [],
    lockedCoreKinds: [],
    provenance: {
      source: 'api', createdBy: input.uid, parentCapsuleId: null, forkedFromVersion: null,
      notes: 'Ephemeral instant context synthesized from the Ask prompt; not persisted.',
    },
    access: {
      visibility: 'private',
      sharedWithUserIds: [],
      sharedWithOrgIds: [],
      allowClone: false,
      allowDownload: false,
      allowCommunityRating: false,
    },
    community: {
      favorite: false,
      userRating: null,
      averageRating: null,
      ratingCount: 0,
      tags: ['instant-context'],
      listedInMarketplace: false,
      publishedAt: null,
      cloneCount: 0,
      downloadCount: 0,
    },
    trust: {
      level: 'amber',
      score: 45,
      label: 'Instant context',
      summary: 'Synthesized from the prompt and NOT saved.',
      blockers: [],
      recommendations: ['Use live search and inline citations before relying on checkable or current claims.'],
      checkedAt: input.now,
    },
    temporality: input.temporality,
    ontologyBinding: input.ontologyBinding,
    createdAt: input.now,
    updatedAt: input.now,
    archivedAt: null,
    schemaVersion: 1,
    version: 0,
    label: 'Instant context',
  };
}

function buildSourcingPolicy(domainId: DomainId, recencyWindowDays: number, preferredFeeds: string[]): SourcingPolicy {
  return {
    mode: 'live-search', minSourcesPerClaim: domainId === 'generic' ? 1 : 2,
    allowedDomains: [], blockedDomains: [], recencyWindowDays,
    requiredSourceTypes: uniqueStrings(['official', 'primary-source', 'credible-media', ...preferredFeeds]).slice(0, 8),
    citationStyle: 'inline',
  };
}

function buildTemporality(now: string, freshnessWindowDays: number): CapsuleTemporality {
  const validFrom = new Date(Date.parse(now) - freshnessWindowDays * 86_400_000).toISOString();
  return {
    timelineAnchors: [{ id: 'instant-as-of', label: 'Instant context as-of timestamp', date: now, kind: 'as-of', confidence: 1 }],
    asOf: now,
    validFrom,
  };
}

function recencyWindowDaysFor(domainId: DomainId): number {
  if (LIVE_SEARCH_30_DAY_DOMAINS.has(domainId)) return 30;
  if (MULTI_YEAR_DOMAINS.has(domainId)) return 1_095;
  return 365;
}

function cleanSignal(value: unknown, limit = 160): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, limit) : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim() ?? '').filter(Boolean)));
}

function compactList(values: string[], limit: number): string {
  const compact = uniqueStrings(values).slice(0, limit);
  return compact.length ? compact.join(', ') : 'none';
}

function promptSafeLine(value: string): string {
  return value.replace(/[<>{}]/g, (char) => ({ '<': '‹', '>': '›', '{': '(', '}': ')' }[char] ?? char)).replace(/\s+/g, ' ').trim().slice(0, 600);
}
