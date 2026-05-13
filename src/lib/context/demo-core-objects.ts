import {
  V5_DEMO_CONTEXT_SEEDS,
  getV5DemoCaseModule,
  type DemoContextSeed,
} from '@/lib/cases/v5-demo-contexts';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import type { UserModelRecord } from '@/lib/user-models/types';
import type {
  BaseCore,
  CoreKind,
  GraphCore,
  OutputCore,
  SituationCore,
  SourceCore,
  UserCore,
} from '@/lib/context/core-objects';
import type { CanonicalSourceReceipt } from '@/types/source-receipt';

const DEMO_OWNER = '_demo';
const SCHEMA_VERSION = 1 as const;
const NOW = '2026-05-13T00:00:00.000Z';

export const DEMO_CONTEXT_USER_MODEL_BY_SITUATION: Record<string, string> = {
  'indo-pacific-2026': 'foreign-policy-analyst',
  'ai-regulation-2026': 'domestic-policy-analyst',
  'fb-sustainability-2026': 'corporate-strategic-analyst',
};

export const DEMO_USER_CORES: readonly UserCore[] = PUBLIC_USER_MODELS.map(userModelToDemoUserCore);
export const DEMO_SITUATION_CORES: readonly SituationCore[] = V5_DEMO_CONTEXT_SEEDS.map(demoSeedToSituationCore);

export function getDemoUserCoreForSituation(demoSituationId: string): UserCore | null {
  const modelId = DEMO_CONTEXT_USER_MODEL_BY_SITUATION[demoSituationId];
  return DEMO_USER_CORES.find((core) => core.id === `demo-user-core:${modelId}`) ?? null;
}

export function getDemoSituationCore(demoSituationId: string): SituationCore | null {
  return DEMO_SITUATION_CORES.find((core) => core.sourceDemoId === demoSituationId) ?? null;
}

export function getDemoSourceCores(demoSituationId: string): SourceCore[] {
  const caseModule = getV5DemoCaseModule(demoSituationId);
  if (!caseModule) return [];
  const seed = V5_DEMO_CONTEXT_SEEDS.find((item) => item.id === demoSituationId);
  return caseModule.sources.map((source, index) => sourceReceiptToSourceCore(demoSituationId, source, seed?.actors ?? [], index));
}

export function getDemoGraphCore(demoSituationId: string): GraphCore | null {
  const seed = V5_DEMO_CONTEXT_SEEDS.find((item) => item.id === demoSituationId);
  if (!seed) return null;
  return {
    ...baseCore(`demo-graph-core:${seed.id}`, 'graph', `Graph Core - ${seed.name}`, `Actors, claims, events, and source posture for ${seed.name}.`, seed.tags, seed.id),
    nodeCount: seed.graphCounts.actors + seed.graphCounts.claims + seed.graphCounts.commitments + seed.graphCounts.events,
    edgeCount: seed.graphCounts.claims + seed.graphCounts.commitments + seed.sourceSeeds.length,
    actors: seed.actors,
    claims: claimSeeds(seed),
    timelineEvents: seed.situationEpisodes.map((episode) => episode.title),
    layout: buildDemoLayout(seed),
  };
}

export function getDemoOutputCore(demoSituationId: string): OutputCore | null {
  const seed = V5_DEMO_CONTEXT_SEEDS.find((item) => item.id === demoSituationId);
  const userCore = getDemoUserCoreForSituation(demoSituationId);
  const situationCore = getDemoSituationCore(demoSituationId);
  if (!seed || !userCore || !situationCore) return null;
  return {
    ...baseCore(`demo-output-core:${seed.id}:memo`, 'output', `Memo template - ${seed.name}`, 'Starter memo structure that inherits the selected User Core, Situation Core, sources, and graph posture.', seed.tags, seed.id),
    outputType: 'memo',
    userCoreId: userCore.id,
    situationCoreId: situationCore.id,
    sourceCoreIds: getDemoSourceCores(demoSituationId).slice(0, 8).map((source) => source.id),
    draftSections: ['Executive summary', 'Situation background', 'Analysis', 'Options', 'Risks', 'Recommendations', 'Evidence and gaps', 'Sources', 'Handover notes'],
  };
}

function userModelToDemoUserCore(model: UserModelRecord): UserCore {
  return {
    ...baseCore(`demo-user-core:${model.modelId}`, 'user', model.identity, model.mandate, [model.workOntologyId, 'demo-user-core'], model.modelId),
    role: model.role,
    audience: model.audienceDefaults,
    writingStyle: model.communicationStyle,
    analyticPreferences: model.methodologyToolkit,
    evidenceStandards: [
      `${model.confidenceTolerance} confidence tolerance`,
      `${model.outputPreferences.citationFormat} citations`,
      'flag unsupported claims before export',
    ],
    domains: [model.workOntologyId],
    recurringConstraints: model.prohibitedFrames.length ? model.prohibitedFrames : ['Make assumptions and evidence gaps explicit.'],
    decisionPosture: model.outputPreferences.languagePosture,
    savedMethods: model.toolAffinities,
  };
}

function demoSeedToSituationCore(seed: DemoContextSeed): SituationCore {
  return {
    ...baseCore(`demo-situation-core:${seed.id}`, 'situation', seed.name, seed.summary, seed.tags, seed.id),
    caseFrame: seed.summary,
    geography: seed.region,
    timeline: seed.situationEpisodes,
    actors: seed.actors,
    claims: claimSeeds(seed),
    risks: riskSeeds(seed),
    openQuestions: openQuestionSeeds(seed),
    sources: seed.sourceSeeds.map((source) => source.title),
    graphSummary: seed.graphCounts,
    goals: goalSeeds(seed),
    currentPhase: 'assessment',
    nextMoves: nextMoveSeeds(seed),
    draftOutputLinks: [`/app/write?demo=${seed.id}`],
  };
}

function sourceReceiptToSourceCore(
  demoSituationId: string,
  source: CanonicalSourceReceipt,
  actors: string[],
  index: number,
): SourceCore {
  return {
    ...baseCore(
      `demo-source-core:${source.receiptId}`,
      'source',
      source.title ?? source.name ?? `Source ${index + 1}`,
      source.excerpt ?? 'Demo source receipt.',
      ['demo-source-core', source.tier ?? 'source'],
      demoSituationId,
    ),
    sourceType: source.kind ?? source.retrievalMethod ?? 'source',
    url: source.url,
    publisher: source.provider ?? source.source,
    publishedDate: source.publishedDate,
    tier: source.tier,
    keyClaims: source.excerpt ? [source.excerpt] : [],
    actors: actors.slice(0, 4),
    timelineEvents: source.publishedDate ? [`Published ${source.publishedDate}`] : [],
  };
}

function baseCore<K extends CoreKind>(
  id: string,
  kind: K,
  title: string,
  summary: string,
  tags: string[],
  sourceDemoId: string,
): BaseCore & { kind: K } {
  return {
    id,
    ownerUid: DEMO_OWNER,
    teamId: null,
    kind,
    title,
    summary,
    status: 'demo' as const,
    tags,
    createdAt: NOW,
    updatedAt: NOW,
    provenance: {
      source: 'public-demo' as const,
      createdBy: 'PRAXIS demo seed',
      receipts: [sourceDemoId],
      notes: 'Canonical demo seed object. Fork into a user workspace before mutation.',
    },
    schemaVersion: SCHEMA_VERSION,
    isDemo: true,
    sourceDemoId,
  };
}

function claimSeeds(seed: DemoContextSeed): string[] {
  return [
    `${seed.name} has ${seed.graphCounts.claims} seeded analytic claims.`,
    `The current actor set includes ${seed.actors.slice(0, 4).join(', ')}.`,
    `Source posture is anchored by ${seed.sourceSeeds.filter((source) => source.tier === 'T1').length} primary receipts.`,
  ];
}

function riskSeeds(seed: DemoContextSeed): string[] {
  if (seed.id === 'indo-pacific-2026') return ['Escalation signaling', 'Alliance absorption lag', 'Maritime incident spillover'];
  if (seed.id === 'ai-regulation-2026') return ['Federal-state preemption uncertainty', 'Patchwork compliance', 'Civil-rights enforcement gaps'];
  return ['Claims substantiation risk', 'Climate disclosure exposure', 'Supplier and retailer pressure'];
}

function openQuestionSeeds(seed: DemoContextSeed): string[] {
  return (seed.cachedResponses ?? []).map((item) => item.question).slice(0, 3);
}

function goalSeeds(seed: DemoContextSeed): string[] {
  if (seed.id === 'fb-sustainability-2026') return ['Prepare board-ready regulatory exposure memo', 'Separate verified commitments from reputational claims'];
  if (seed.id === 'ai-regulation-2026') return ['Map the federal-state regulatory landscape', 'Draft a legislative briefing with preemption options'];
  return ['Brief senior readers on near-term strategic shifts', 'Preserve temporality and stakeholder positions'];
}

function nextMoveSeeds(seed: DemoContextSeed): string[] {
  return [
    'Ask PRAXIS for the current situation read.',
    'Attach or inspect the source receipts.',
    seed.id === 'ai-regulation-2026' ? 'Draft a preemption options memo.' : 'Draft a one-page options memo.',
  ];
}

function buildDemoLayout(seed: DemoContextSeed): GraphCore['layout'] {
  return {
    user: { x: 0, y: 0 },
    situation: { x: 260, y: 0 },
    sources: { x: 520, y: -80 },
    actors: { x: 520, y: 80 },
    timeline: { x: 780, y: 0 },
    output: { x: 1040, y: 0 },
    ...Object.fromEntries(seed.actors.slice(0, 6).map((actor, index) => [`actor:${actor}`, { x: 480 + index * 80, y: 180 + (index % 2) * 70 }])),
  };
}
