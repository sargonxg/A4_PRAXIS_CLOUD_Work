import { normalizeToLatest } from '@/lib/context/capsule-schema';
import {
  TrustGraphCapsuleSyncRequestSchema,
  buildTrustGraphCollectionId,
  buildTrustGraphWorkspaceId,
  type TrustGraphCapsuleSegment,
  type TrustGraphCapsuleSyncRequest,
} from '@/lib/knowledge/trustgraph-contract';

type NormalizedCoreRefs = {
  userCoreId: string | null;
  teamCoreId: string | null;
  situationCoreId: string | null;
  pathCoreId: string | null;
  sourceCoreIds: string[];
  documentCoreIds: string[];
  graphCoreId: string | null;
  timeCoreId: string | null;
  toolCoreIds: string[];
  objectiveCoreIds: string[];
  productCoreIds: string[];
  outputCoreIds: string[];
  memoryCoreId: string | null;
};

export function buildTrustGraphCapsuleSyncRequest(input: {
  uid: string;
  capsule: unknown;
  workspaceMode?: string;
  collectionPrefix?: string;
}): TrustGraphCapsuleSyncRequest {
  const capsule = normalizeToLatest(input.capsule);
  const coreRefs = normalizeCoreRefs(readRecord(input.capsule)?.coreRefs);
  const workspaceId = buildTrustGraphWorkspaceId({
    uid: input.uid,
    capsuleId: capsule.identity.capsuleId,
    mode: input.workspaceMode,
  });
  const collectionId = buildTrustGraphCollectionId({
    uid: input.uid,
    capsuleId: capsule.identity.capsuleId,
    prefix: input.collectionPrefix,
  });
  const ontologyRefs = uniqueStrings([
    capsule.contextCaptureProfile.profileId,
    ...capsule.contextCaptureProfile.sourceBindings.flatMap((binding) => binding.ontologyIds),
  ]);
  const segments = buildTrustGraphCapsuleSegments(capsule, coreRefs);

  return TrustGraphCapsuleSyncRequestSchema.parse({
    uid: input.uid,
    capsuleId: capsule.identity.capsuleId,
    workspaceId,
    collectionId,
    capsuleVersion: capsule.identity.capsuleVersion,
    schemaVersion: `context-capsule.v${capsule.schemaVersion}`,
    sourceRefs: uniqueStrings([...coreRefs.sourceCoreIds, ...capsule.sourceSpine.sourceIds]),
    documentRefs: coreRefs.documentCoreIds,
    graphRefs: cleanArray([coreRefs.graphCoreId, ...capsule.memoryPosture.graphProposals]),
    toolRefs: coreRefs.toolCoreIds,
    outputRefs: uniqueStrings([
      ...coreRefs.outputCoreIds,
      ...coreRefs.productCoreIds,
      ...capsule.outputContracts.map((contract) => contract.outputId),
    ]),
    memoryRefs: cleanArray([coreRefs.memoryCoreId, capsule.memoryPosture.cogneeDatasetId]),
    ontologyRefs,
    segments,
    advisoryOnly: true,
  });
}

function buildTrustGraphCapsuleSegments(
  capsule: ReturnType<typeof normalizeToLatest>,
  coreRefs: NormalizedCoreRefs,
): TrustGraphCapsuleSegment[] {
  const sourceIds = capsule.sourceSpine.sourceIds;
  const segments: TrustGraphCapsuleSegment[] = [
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'identity',
      id: 'identity',
      label: capsule.identity.label,
      text: [
        capsule.identity.summary,
        `Purpose: ${capsule.businessUseCase.purpose}`,
        `Use case: ${capsule.businessUseCase.useCase}`,
        `Audience: ${capsule.businessUseCase.audience.join(', ') || 'unspecified'}`,
        `Best next action: ${capsule.businessUseCase.bestNextAction}`,
      ],
      refIds: [capsule.identity.capsuleId],
      metadata: {
        scope: capsule.identity.scope,
        capsuleClass: capsule.identity.capsuleClass,
        capsuleMode: capsule.identity.capsuleMode,
        canonicalStore: capsule.identity.canonicalStore,
      },
      reviewRequired: false,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'user',
      id: 'user',
      label: 'User and tacit knowledge',
      text: [
        ...capsule.humanTacitKnowledge.workingAssumptions,
        ...capsule.humanTacitKnowledge.hiddenConstraints,
        ...capsule.humanTacitKnowledge.redLines,
        ...capsule.humanTacitKnowledge.institutionalHabits,
        ...capsule.humanTacitKnowledge.approvalPolitics,
        ...capsule.humanTacitKnowledge.practicalHeuristics,
        ...capsule.humanTacitKnowledge.stakeholderSensitivities,
        ...capsule.humanTacitKnowledge.caveats,
        ...capsule.humanTacitKnowledge.recurringDecisions,
        ...capsule.humanTacitKnowledge.promptlessKnowledge,
      ],
      refIds: cleanArray([coreRefs.userCoreId, coreRefs.teamCoreId]),
      sourceIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'situation',
      id: 'situation',
      label: 'Situation and decision frame',
      text: [
        capsule.businessUseCase.purpose,
        capsule.businessUseCase.useCase,
        `Decision horizon: ${capsule.businessUseCase.decisionHorizon ?? 'unset'}`,
        `Update cadence: ${capsule.businessUseCase.updateCadence ?? 'unset'}`,
      ],
      refIds: cleanArray([coreRefs.situationCoreId]),
      sourceIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'path',
      id: 'path',
      label: 'Method path',
      text: capsule.reasoningScaffold.publicMethod,
      refIds: cleanArray([coreRefs.pathCoreId]),
      sourceIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'source',
      id: 'source-spine',
      label: 'Source spine',
      text: [
        ...capsule.sourceSpine.sourceRefs.map((source) => `${source.sourceId}: ${source.label}${source.publisher ? ` (${source.publisher})` : ''}`),
        ...capsule.sourceSpine.sourceGaps.map((gap) => `Gap: ${gap}`),
      ],
      refIds: coreRefs.sourceCoreIds,
      sourceIds,
      metadata: {
        freshnessWindowDays: capsule.sourceSpine.freshnessWindowDays,
        independenceScore: capsule.sourceSpine.independenceScore,
        score: capsule.sourceSpine.score,
        staleSourceIds: capsule.sourceSpine.staleSourceIds,
        requiredSourceTypes: capsule.sourceSpine.requiredSourceTypes,
      },
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'document',
      id: 'documents',
      label: 'Attached documents',
      text: coreRefs.documentCoreIds.length ? coreRefs.documentCoreIds : ['No document cores attached.'],
      refIds: coreRefs.documentCoreIds,
      documentIds: coreRefs.documentCoreIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'graph',
      id: 'graph-candidates',
      label: 'Graph and claim candidates',
      text: [
        ...capsule.claimLedger.allClaims.map((claim) => `${claim.support}: ${claim.text}`),
        ...capsule.memoryPosture.graphProposals.map((proposal) => `Graph proposal: ${proposal}`),
      ],
      refIds: cleanArray([coreRefs.graphCoreId]),
      sourceIds,
      ontologyIds: capsule.contextCaptureProfile.sourceBindings.flatMap((binding) => binding.ontologyIds),
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'time',
      id: 'time',
      label: 'Time and freshness',
      text: [
        `Decision horizon: ${capsule.businessUseCase.decisionHorizon ?? 'unset'}`,
        `Update cadence: ${capsule.businessUseCase.updateCadence ?? 'unset'}`,
        `Stale sources: ${capsule.sourceSpine.staleSourceIds.join(', ') || 'none'}`,
      ],
      refIds: cleanArray([coreRefs.timeCoreId]),
      sourceIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'tool',
      id: 'tools',
      label: 'Allowed tools and agent rules',
      text: [
        `Best next action: ${capsule.agentOperatingContract.bestNextAction}`,
        ...capsule.agentOperatingContract.allowedActions.map((action) => `Allowed action: ${action}`),
        ...capsule.agentOperatingContract.forbiddenActions.map((action) => `Forbidden action: ${action}`),
        ...capsule.agentOperatingContract.sourceRequirements.map((requirement) => `Source requirement: ${requirement}`),
        ...capsule.agentOperatingContract.reviewCheckpoints.map((checkpoint) => `Review checkpoint: ${checkpoint}`),
        ...capsule.agentOperatingContract.toolRecommendations.map((tool) => `Tool recommendation: ${tool}`),
        ...capsule.agentOperatingContract.handoffInstructions.map((instruction) => `Handoff: ${instruction}`),
        ...capsule.agentOperatingContract.stopConditions.map((condition) => `Stop condition: ${condition}`),
      ],
      refIds: coreRefs.toolCoreIds,
      sourceIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'objective',
      id: 'objective',
      label: 'Objective',
      text: [capsule.businessUseCase.bestNextAction],
      refIds: coreRefs.objectiveCoreIds,
      sourceIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'product',
      id: 'product',
      label: 'Product family',
      text: coreRefs.productCoreIds,
      refIds: coreRefs.productCoreIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'output',
      id: 'outputs',
      label: 'Output contracts',
      text: capsule.outputContracts.map((contract) =>
        `${contract.outputId}: ${contract.label}; type=${contract.artifactType}; citations=${contract.citationRequired}; review=${contract.reviewRequired}`,
      ),
      refIds: coreRefs.outputCoreIds,
      sourceIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'memory',
      id: 'memory',
      label: 'Memory posture',
      text: [
        ...capsule.memoryPosture.canonicalCapsuleFacts,
        ...capsule.memoryPosture.advisoryCogneeRecall,
        ...capsule.memoryPosture.sessionMemory,
        ...capsule.memoryPosture.disputedClaims,
        ...capsule.memoryPosture.rejectedInferences,
      ],
      refIds: cleanArray([coreRefs.memoryCoreId, capsule.memoryPosture.cogneeDatasetId]),
      sourceIds,
      metadata: {
        cogneeMode: capsule.memoryPosture.cogneeMode,
        advisoryOnly: true,
      },
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'ontology',
      id: 'ontology',
      label: 'Ontology capture profile',
      text: [
        capsule.contextCaptureProfile.profileId,
        ...capsule.contextCaptureProfile.sourceBindings.map((binding) =>
          `${binding.sourceId}: ${binding.ontologyIds.join(', ')} -> ${binding.expectedClaims.join('; ')}`,
        ),
      ],
      refIds: [capsule.contextCaptureProfile.profileId],
      sourceIds,
      ontologyIds: capsule.contextCaptureProfile.sourceBindings.flatMap((binding) => binding.ontologyIds),
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'governance',
      id: 'governance',
      label: 'Governance and review gates',
      text: [
        `Human gate: ${capsule.governance.humanGateStatus}`,
        `Agents may mutate canonical: ${capsule.governance.agentsMayMutateCanonical}`,
        ...capsule.governance.reviewCardsRequiredForTargets.map((target) => `Review target: ${target}`),
      ],
      refIds: capsule.governance.reviewCardsRequiredForTargets,
      sourceIds,
    }),
    segment({
      capsuleId: capsule.identity.capsuleId,
      coreKind: 'review',
      id: 'review-cards',
      label: 'Review cards',
      text: capsule.reviewCards.map((card) => `${card.reviewCardId}: ${card.title}; target=${card.target}; state=${card.state}`),
      refIds: capsule.reviewCards.map((card) => card.reviewCardId),
      sourceIds,
    }),
  ];

  return segments.filter((item) => item.text.trim().length > 0);
}

function segment(input: {
  capsuleId: string;
  coreKind: TrustGraphCapsuleSegment['coreKind'];
  id: string;
  label: string;
  text: string[] | string;
  refIds?: string[];
  sourceIds?: string[];
  documentIds?: string[];
  runIds?: string[];
  ontologyIds?: string[];
  metadata?: Record<string, unknown>;
  reviewRequired?: boolean;
}): TrustGraphCapsuleSegment {
  const text = Array.isArray(input.text) ? input.text.map((item) => item.trim()).filter(Boolean).join('\n') : input.text.trim();
  return {
      id: `${input.capsuleId}:${input.id}`,
      coreKind: input.coreKind,
      label: input.label,
      text: compactSegmentText(text || 'No reviewed context captured yet.'),
    refIds: uniqueStrings(input.refIds ?? []),
    sourceIds: uniqueStrings(input.sourceIds ?? []),
    documentIds: uniqueStrings(input.documentIds ?? []),
    runIds: uniqueStrings(input.runIds ?? []),
    ontologyIds: uniqueStrings(input.ontologyIds ?? []),
    advisoryOnly: true,
    reviewRequired: input.reviewRequired ?? true,
    metadata: input.metadata ?? {},
  };
}

function normalizeCoreRefs(value: unknown): NormalizedCoreRefs {
  const refs = readRecord(value) ?? {};
  return {
    userCoreId: stringOrNull(refs.userCoreId),
    teamCoreId: stringOrNull(refs.teamCoreId),
    situationCoreId: stringOrNull(refs.situationCoreId),
    pathCoreId: stringOrNull(refs.pathCoreId),
    sourceCoreIds: cleanArray(refs.sourceCoreIds),
    documentCoreIds: cleanArray(refs.documentCoreIds),
    graphCoreId: stringOrNull(refs.graphCoreId),
    timeCoreId: stringOrNull(refs.timeCoreId),
    toolCoreIds: cleanArray(refs.toolCoreIds),
    objectiveCoreIds: cleanArray(refs.objectiveCoreIds),
    productCoreIds: cleanArray(refs.productCoreIds),
    outputCoreIds: cleanArray(refs.outputCoreIds),
    memoryCoreId: stringOrNull(refs.memoryCoreId),
  };
}

function cleanArray(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()));
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function compactSegmentText(value: string): string {
  const trimmed = value.trim();
  return trimmed.length <= 4000 ? trimmed : `${trimmed.slice(0, 3997)}...`;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}
