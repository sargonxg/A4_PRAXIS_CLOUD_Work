import { z } from 'zod';
import type { CapsuleReadReceipt } from '@/lib/agent-runtime/capsule-read-receipt';
import type { SourceabilityLedgerSummary } from '@/lib/agent-runtime/sourceability-ledger';
import type { AgentWorkflowPlan } from '@/lib/agent-runtime/workflow-plan';
import type { AgentRun } from '@/lib/agent-runtime/types';
import { normalizeAgentRunFailureSummary } from '@/lib/agent-runtime/failure-summary';
import { buildProofSummaryFromAgentRun } from '@/lib/proof/proof-summary';
import { destinationHref, getPolicyAgent, type PolicyAgentOutputDestination } from '@/lib/product/policy-agents';

export const AgentTriggerTypeSchema = z.enum([
  'manual',
  'schedule',
  'webhook',
  'email_event',
  'source_update',
  'capsule_change',
]);

export const SelectedCoreIdsSchema = z.object({
  userCoreId: z.string().nullable().optional(),
  teamCoreId: z.string().nullable().optional(),
  situationCoreId: z.string().nullable().optional(),
  pathCoreId: z.string().nullable().optional(),
  sourceCoreIds: z.array(z.string()).optional(),
  documentCoreIds: z.array(z.string()).optional(),
  graphCoreId: z.string().nullable().optional(),
  timeCoreId: z.string().nullable().optional(),
  outputCoreIds: z.array(z.string()).optional(),
  toolCoreIds: z.array(z.string()).optional(),
  objectiveCoreIds: z.array(z.string()).optional(),
  productCoreIds: z.array(z.string()).optional(),
  memoryCoreId: z.string().nullable().optional(),
}).optional();

export const CreateManualAgentRunRequestSchema = z.object({
  capsuleId: z.string().min(1).max(240).optional(),
  contextStackId: z.string().min(1).max(240).nullable().optional(),
  contextPackageId: z.string().min(1).max(240).nullable().optional(),
  selectedCoreIds: SelectedCoreIdsSchema,
  policyAgentId: z.string().min(1).max(240).optional(),
  outputDestination: z.enum(['memo_studio', 'canvas', 'library', 'handover']).optional(),
  agentSpecId: z.string().min(1).max(240).nullable().optional(),
  triggerType: AgentTriggerTypeSchema.default('manual'),
  objective: z.string().min(1).max(2000),
  traceId: z.string().min(1).max(240).optional(),
  parentRunId: z.string().min(1).max(240).nullable().optional(),
  idempotencyKey: z.string().min(8).max(240).optional(),
  maxStep: z.number().int().positive().max(100).optional(),
  maxSessionMinutes: z.number().int().positive().max(24 * 60).optional(),
  internalEstimatedCostCents: z.number().int().nonnegative().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const GetAgentRunParamsSchema = z.object({
  runId: z.string().trim().min(1).max(240),
});

export const ListAgentRunsQuerySchema = z.object({
  capsuleId: z.string().trim().min(1).max(240),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export const AgentRunOutputSchema = z.object({
  runId: z.string(),
  status: z.enum(['queued', 'running', 'waiting_approval', 'succeeded', 'failed', 'cancelled', 'expired']),
  capsuleId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  objective: z.string(),
  policyAgentId: z.string().nullable().optional(),
  policyAgentLabel: z.string().nullable().optional(),
  outputDestination: z.enum(['memo_studio', 'canvas', 'library', 'handover']).nullable().optional(),
  outputHref: z.string().nullable().optional(),
  outputTargetLabel: z.string().nullable().optional(),
  memoId: z.string().nullable().optional(),
  outputCapsuleId: z.string().nullable().optional(),
  selectedTools: z.array(z.string()).optional(),
  searchPlan: z.object({
    queries: z.array(z.string()),
    sourceClasses: z.array(z.string()),
    freshnessNeed: z.string(),
    timeframe: z.string().nullable(),
  }).nullable().optional(),
  sourceReceiptIds: z.array(z.string()).optional(),
  sourcePosture: z.string().nullable().optional(),
  sourceCount: z.number().int().nonnegative().optional(),
  groundingPlan: z.record(z.string(), z.unknown()).nullable().optional(),
  groundingPosture: z.string().nullable().optional(),
  degradedReason: z.string().nullable().optional(),
  approvalGateCount: z.number().int().nonnegative().optional(),
  artifactIds: z.array(z.string()).optional(),
  latestMirroredEvent: z.object({
    eventType: z.string(),
    message: z.string().nullable(),
    createdAt: z.string(),
  }).nullable().optional(),
  failureSummary: z.object({
    schemaVersion: z.literal(1),
    category: z.string(),
    failedPhase: z.string(),
    executionMode: z.string(),
    policyAgentId: z.string().nullable(),
    errorName: z.string(),
    sanitizedError: z.string(),
    retryGuidance: z.string(),
    lastEventBeforeFailure: z.object({
      eventId: z.string(),
      eventType: z.string(),
      message: z.string().nullable(),
      phase: z.string().nullable(),
      createdAt: z.string(),
    }).nullable(),
    failingToolCall: z.object({
      toolCallId: z.string().nullable(),
      toolId: z.string(),
      status: z.literal('failed'),
      risk: z.enum(['low', 'medium', 'high']).nullable(),
      error: z.string().nullable(),
      startedAt: z.string().nullable(),
      completedAt: z.string().nullable(),
    }).nullable(),
    createdAt: z.string(),
  }).nullable().optional(),
  readiness: z.enum(['live', 'queued', 'planned', 'gated']).nullable().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).nullable().optional(),
  contextReceipt: z.object({
    activeCapsuleOrChain: z.string().nullable(),
    selectedTools: z.array(z.string()),
    outputDestination: z.string().nullable(),
    sourcePosture: z.string().nullable(),
    sourceCount: z.number().int().nonnegative(),
    approvalGateCount: z.number().int().nonnegative(),
    groundingPosture: z.string(),
    degradedReason: z.string().nullable(),
  }).optional(),
  capsuleReadReceipt: z.record(z.string(), z.unknown()).optional(),
  workflowPlan: z.record(z.string(), z.unknown()).optional(),
  sourceabilityLedgerSummary: z.object({
    totalClaims: z.number().int().nonnegative(),
    supportedClaims: z.number().int().nonnegative(),
    weakClaims: z.number().int().nonnegative(),
    unsupportedClaims: z.number().int().nonnegative(),
    contradictedClaims: z.number().int().nonnegative(),
    modelPriorClaims: z.number().int().nonnegative(),
    assumptionClaims: z.number().int().nonnegative(),
  }).optional(),
  proofSummary: z.object({
    contextHealth: z.enum(['ready', 'review', 'thin', 'missing', 'degraded']),
    sourceCount: z.number().int().nonnegative(),
    documentCount: z.number().int().nonnegative(),
    unsupportedClaimCount: z.number().int().nonnegative(),
    confidenceDistribution: z.object({
      high: z.number().int().nonnegative(),
      medium: z.number().int().nonnegative(),
      low: z.number().int().nonnegative(),
    }),
    outputHref: z.string().nullable(),
    memoId: z.string().nullable(),
    outputCapsuleId: z.string().nullable(),
    modelPolicyLabel: z.string(),
    outputTarget: z.string().nullable(),
    activeCapsule: z.string().nullable(),
    appliedCapsules: z.array(z.string()),
    sourceability: z.object({
      totalClaims: z.number().int().nonnegative(),
      supportedClaims: z.number().int().nonnegative(),
      weakClaims: z.number().int().nonnegative(),
      unsupportedClaims: z.number().int().nonnegative(),
      contradictedClaims: z.number().int().nonnegative(),
      modelPriorClaims: z.number().int().nonnegative(),
      assumptionClaims: z.number().int().nonnegative(),
    }),
    groundingVerification: z.object({
      coverageScore: z.number().min(0).max(1),
      groundedClaimCount: z.number().int().nonnegative(),
      totalClaimCount: z.number().int().nonnegative(),
      ungroundedSpanCount: z.number().int().nonnegative(),
      contradictedSpanCount: z.number().int().nonnegative(),
      flaggedSpans: z.array(z.object({
        text: z.string(),
        reason: z.string(),
        claimCardIds: z.array(z.string()),
        sourceReceiptIds: z.array(z.string()),
        graphPathIds: z.array(z.string()),
      })),
    }).nullable(),
    degradedStates: z.array(z.string()),
    improvementActions: z.array(z.string()),
    exportBlocked: z.boolean(),
  }).optional(),
  factoryMetadata: z.object({
    factoryLane: z.string().nullable(),
    ontologyStack: z.array(z.string()),
    graphMode: z.string().nullable(),
    cogneeMode: z.string().nullable(),
    sourceReceiptIds: z.array(z.string()),
    embeddedGraphArtifactId: z.string().nullable(),
    ecosystemContributors: z.array(z.string()),
  }).optional(),
});

export type CreateManualAgentRunRequest = z.infer<typeof CreateManualAgentRunRequestSchema>;
export type GetAgentRunParams = z.infer<typeof GetAgentRunParamsSchema>;
export type ListAgentRunsQuery = z.infer<typeof ListAgentRunsQuerySchema>;
export type AgentRunOutput = z.infer<typeof AgentRunOutputSchema>;

export function toAgentRunOutput(run: AgentRun): AgentRunOutput {
  const policyAgentId = typeof run.metadata?.policyAgentId === 'string' ? run.metadata.policyAgentId : null;
  const policyAgent = getPolicyAgent(policyAgentId);
  const metadataDestination = normalizeOutputDestination(run.metadata?.outputDestination);
  const outputDestination = policyAgent?.outputDestination ?? metadataDestination;
  const activeContextStack = isRecord(run.metadata?.activeContextStack) ? run.metadata.activeContextStack : null;
  const appliedCapsules = Array.isArray(run.metadata?.appliedCapsules) ? run.metadata.appliedCapsules : [];
  const selectedTools = stringArray(run.metadata?.selectedTools).length
    ? stringArray(run.metadata?.selectedTools)
    : stringArray(run.metadata?.selectedToolIds);
  const sourceReceiptIds = stringArray(run.metadata?.sourceReceiptIds);
  const sourceCount = nonnegativeInt(run.metadata?.sourceCount)
    ?? sourceReceiptIds.length
    ?? 0;
  const approvalGateCount = nonnegativeInt(run.metadata?.approvalGateCount)
    ?? stringArray(run.metadata?.approvalRequiredToolIds).length
    ?? 0;
  const sourcePosture = typeof run.metadata?.sourcePosture === 'string' ? run.metadata.sourcePosture : null;
  const groundingPosture = typeof run.metadata?.groundingPosture === 'string'
    ? run.metadata.groundingPosture
    : selectedTools.includes('grounded-search')
      ? 'Grounding unavailable'
      : sourcePosture ?? 'No grounding metadata';
  const degradedReason = typeof run.metadata?.degradedReason === 'string' ? run.metadata.degradedReason : null;
  const searchPlan = normalizeSearchPlan(run.metadata?.searchPlan);
  const groundingPlan = isRecord(run.metadata?.groundingPlan) ? run.metadata.groundingPlan : null;
  const factoryMetadata = normalizeFactoryMetadata(run.metadata);
  const capsuleReadReceipt = isRecord(run.metadata?.capsuleReadReceipt) ? run.metadata.capsuleReadReceipt as unknown as CapsuleReadReceipt : undefined;
  const workflowPlan = isRecord(run.metadata?.workflowPlan) ? run.metadata.workflowPlan as unknown as AgentWorkflowPlan : undefined;
  const sourceabilityLedgerSummary = normalizeSourceabilityLedgerSummary(run.metadata?.sourceabilityLedgerSummary);
  const groundingVerification = isRecord(run.metadata?.groundingVerification) ? run.metadata.groundingVerification : undefined;
  const artifactIds = normalizeArtifactIds(run.metadata);
  const latestMirroredEvent = normalizeLatestMirroredEvent(run.metadata?.latestMirroredEvent);
  const failureSummary = normalizeAgentRunFailureSummary(run.metadata?.failureSummary);
  const memoId = stringValue(run.metadata?.memoId);
  const outputCapsuleId = stringValue(run.metadata?.outputCapsuleId);
  const boardroomOutput = isRecord(run.metadata?.boardroomOutput) ? run.metadata.boardroomOutput : null;
  const outputHref = typeof run.metadata?.outputHref === 'string' && run.metadata.outputHref.startsWith('/app')
    ? run.metadata.outputHref
    : outputDestination ? destinationHref(outputDestination) : null;
  const contextReceipt = {
    activeCapsuleOrChain: appliedCapsules
      .flatMap((item) => isRecord(item) && typeof item.label === 'string' ? [item.label] : [])
      .slice(0, 4)
      .join(' + ') || (typeof activeContextStack?.capsuleId === 'string' ? activeContextStack.capsuleId : run.capsuleId),
    selectedTools,
    outputDestination: outputDestination ?? null,
    sourcePosture,
    sourceCount,
    approvalGateCount,
    groundingPosture,
    degradedReason,
  };
  const shouldExposeProofSummary = Boolean(
    memoId
    || outputCapsuleId
    || boardroomOutput
    || capsuleReadReceipt
    || workflowPlan
    || sourceabilityLedgerSummary
    || groundingVerification,
  );
  return AgentRunOutputSchema.parse({
    runId: run.id,
    status: run.status,
    capsuleId: run.capsuleId,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    objective: run.objective,
    policyAgentId,
    policyAgentLabel: policyAgent?.label ?? null,
    outputDestination,
    outputHref,
    outputTargetLabel: outputDestination ? destinationLabel(outputDestination) : null,
    ...(memoId ? { memoId } : {}),
    ...(outputCapsuleId ? { outputCapsuleId } : {}),
    selectedTools,
    searchPlan,
    sourceReceiptIds,
    sourcePosture: sourcePosture ?? 'No grounding metadata',
    sourceCount,
    groundingPlan,
    groundingPosture,
    degradedReason,
    approvalGateCount,
    artifactIds,
    latestMirroredEvent,
    failureSummary,
    readiness: policyAgent?.readiness ?? null,
    riskLevel: policyAgent?.riskLevel ?? null,
    contextReceipt,
    ...(capsuleReadReceipt ? { capsuleReadReceipt } : {}),
    ...(workflowPlan ? { workflowPlan } : {}),
    ...(sourceabilityLedgerSummary ? { sourceabilityLedgerSummary } : {}),
    ...(shouldExposeProofSummary ? {
      proofSummary: buildProofSummaryFromAgentRun({
        runId: run.id,
        status: run.status,
        capsuleId: run.capsuleId,
        appliedCapsules,
        selectedTools,
        sourceReceiptIds,
        sourceCount,
        documentCount: run.selectedCoreIds?.documentCoreIds?.length ?? 0,
        outputDestination,
        outputHref,
        memoId,
        outputCapsuleId,
        contextReceipt,
        capsuleReadReceipt,
        workflowPlan,
        sourceabilityLedgerSummary,
        groundingVerification,
        sourcePosture,
        groundingPosture,
        degradedReason,
        modelPolicy: run.metadata?.modelPolicy,
        modelTier: run.metadata?.modelTier,
        selectedModelId: run.metadata?.selectedModelId,
        modelLifecycleTier: run.metadata?.modelLifecycleTier,
        fallbackPosture: run.metadata?.fallbackPosture,
      }, boardroomOutput),
    } : {}),
    ...(factoryMetadata ? { factoryMetadata } : {}),
  });
}

function normalizeSearchPlan(value: unknown): AgentRunOutput['searchPlan'] | null {
  if (!isRecord(value)) return null;
  return {
    queries: stringArray(value.queries).slice(0, 12),
    sourceClasses: stringArray(value.sourceClasses).slice(0, 12),
    freshnessNeed: typeof value.freshnessNeed === 'string' ? value.freshnessNeed : 'not_specified',
    timeframe: typeof value.timeframe === 'string' ? value.timeframe : null,
  };
}

function normalizeOutputDestination(value: unknown): PolicyAgentOutputDestination | null {
  return value === 'memo_studio' || value === 'canvas' || value === 'library' || value === 'handover'
    ? value
    : null;
}

function normalizeSourceabilityLedgerSummary(value: unknown): SourceabilityLedgerSummary | null {
  if (!isRecord(value)) return null;
  const summary = {
    totalClaims: nonnegativeInt(value.totalClaims) ?? 0,
    supportedClaims: nonnegativeInt(value.supportedClaims) ?? 0,
    weakClaims: nonnegativeInt(value.weakClaims) ?? 0,
    unsupportedClaims: nonnegativeInt(value.unsupportedClaims) ?? 0,
    contradictedClaims: nonnegativeInt(value.contradictedClaims) ?? 0,
    modelPriorClaims: nonnegativeInt(value.modelPriorClaims) ?? 0,
    assumptionClaims: nonnegativeInt(value.assumptionClaims) ?? 0,
  };
  return summary;
}

function normalizeArtifactIds(metadata: Record<string, unknown> | undefined): string[] {
  if (!metadata) return [];
  return Array.from(new Set([
    ...stringArray(metadata.artifactIds),
    ...stringArray(metadata.createdArtifactIds),
    ...[
      metadata.memoId,
      metadata.outputCapsuleId,
      metadata.handoverPackageId,
      metadata.documentId,
      metadata.exportId,
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0),
  ].map((value) => value.trim()).filter(Boolean)));
}

function normalizeLatestMirroredEvent(value: unknown): AgentRunOutput['latestMirroredEvent'] | null {
  if (!isRecord(value)) return null;
  const eventType = typeof value.eventType === 'string' && value.eventType.trim()
    ? value.eventType.trim()
    : typeof value.type === 'string' && value.type.trim()
      ? value.type.trim()
      : null;
  const createdAt = typeof value.createdAt === 'string' && value.createdAt.trim()
    ? value.createdAt.trim()
    : null;
  if (!eventType || !createdAt) return null;
  return {
    eventType,
    message: typeof value.message === 'string' && value.message.trim() ? value.message.trim() : null,
    createdAt,
  };
}

function destinationLabel(destination: PolicyAgentOutputDestination): string {
  switch (destination) {
    case 'memo_studio':
      return 'Work';
    case 'canvas':
      return 'Context';
    case 'library':
      return 'Capsules';
    case 'handover':
      return 'Handover';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeFactoryMetadata(metadata: Record<string, unknown> | undefined): AgentRunOutput['factoryMetadata'] | null {
  if (!metadata) return null;
  const hasFactoryMetadata = [
    'factoryLane',
    'ontologyStack',
    'graphMode',
    'cogneeMode',
    'sourceReceiptIds',
    'embeddedGraphArtifactId',
    'ecosystemContributors',
  ].some((key) => key in metadata);
  if (!hasFactoryMetadata) return null;

  return {
    factoryLane: typeof metadata.factoryLane === 'string' ? metadata.factoryLane : null,
    ontologyStack: stringArray(metadata.ontologyStack),
    graphMode: typeof metadata.graphMode === 'string' ? metadata.graphMode : null,
    cogneeMode: typeof metadata.cogneeMode === 'string' ? metadata.cogneeMode : null,
    sourceReceiptIds: stringArray(metadata.sourceReceiptIds),
    embeddedGraphArtifactId: typeof metadata.embeddedGraphArtifactId === 'string' ? metadata.embeddedGraphArtifactId : null,
    ecosystemContributors: stringArray(metadata.ecosystemContributors),
  };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function nonnegativeInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}
