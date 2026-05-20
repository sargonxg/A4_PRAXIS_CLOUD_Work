import { z } from 'zod';
import type { AgentRun } from '@/lib/agent-runtime/types';
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
  selectedTools: z.array(z.string()).optional(),
  sourcePosture: z.string().nullable().optional(),
  sourceCount: z.number().int().nonnegative().optional(),
  approvalGateCount: z.number().int().nonnegative().optional(),
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
  const selectedTools = Array.isArray(run.metadata?.selectedTools)
    ? run.metadata.selectedTools.filter((item): item is string => typeof item === 'string')
    : [];
  const sourceCount = nonnegativeInt(run.metadata?.sourceCount)
    ?? stringArray(run.metadata?.sourceReceiptIds).length
    ?? 0;
  const approvalGateCount = nonnegativeInt(run.metadata?.approvalGateCount)
    ?? stringArray(run.metadata?.approvalRequiredToolIds).length
    ?? 0;
  const sourcePosture = typeof run.metadata?.sourcePosture === 'string' ? run.metadata.sourcePosture : null;
  const groundingPosture = typeof run.metadata?.groundingPosture === 'string'
    ? run.metadata.groundingPosture
    : selectedTools.includes('grounded-search')
      ? 'Google grounding requested'
      : sourcePosture ?? 'No grounding metadata';
  const factoryMetadata = normalizeFactoryMetadata(run.metadata);
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
    outputHref: outputDestination ? destinationHref(outputDestination) : null,
    outputTargetLabel: outputDestination ? destinationLabel(outputDestination) : null,
    selectedTools,
    sourcePosture: sourcePosture ?? 'No grounding metadata',
    sourceCount,
    approvalGateCount,
    readiness: policyAgent?.readiness ?? null,
    riskLevel: policyAgent?.riskLevel ?? null,
    contextReceipt: {
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
    },
    ...(factoryMetadata ? { factoryMetadata } : {}),
  });
}

function normalizeOutputDestination(value: unknown): PolicyAgentOutputDestination | null {
  return value === 'memo_studio' || value === 'canvas' || value === 'library' || value === 'handover'
    ? value
    : null;
}

function destinationLabel(destination: PolicyAgentOutputDestination): string {
  switch (destination) {
    case 'memo_studio':
      return 'Memo Studio';
    case 'canvas':
      return 'Canvas';
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

function nonnegativeInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}
