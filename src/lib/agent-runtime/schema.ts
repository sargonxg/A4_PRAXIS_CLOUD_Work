import { z } from 'zod';
import type { AgentRun } from '@/lib/agent-runtime/types';
import { destinationHref, getPolicyAgent } from '@/lib/product/policy-agents';

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
  policyAgentId: z.string().nullable().optional(),
  policyAgentLabel: z.string().nullable().optional(),
  outputDestination: z.enum(['memo_studio', 'canvas', 'library', 'handover']).nullable().optional(),
  outputHref: z.string().nullable().optional(),
});

export type CreateManualAgentRunRequest = z.infer<typeof CreateManualAgentRunRequestSchema>;
export type GetAgentRunParams = z.infer<typeof GetAgentRunParamsSchema>;
export type ListAgentRunsQuery = z.infer<typeof ListAgentRunsQuerySchema>;
export type AgentRunOutput = z.infer<typeof AgentRunOutputSchema>;

export function toAgentRunOutput(run: AgentRun): AgentRunOutput {
  const policyAgentId = typeof run.metadata?.policyAgentId === 'string' ? run.metadata.policyAgentId : null;
  const policyAgent = getPolicyAgent(policyAgentId);
  const outputDestination = policyAgent?.outputDestination ?? null;
  return AgentRunOutputSchema.parse({
    runId: run.id,
    status: run.status,
    capsuleId: run.capsuleId,
    createdAt: run.createdAt,
    policyAgentId,
    policyAgentLabel: policyAgent?.label ?? null,
    outputDestination,
    outputHref: outputDestination ? destinationHref(outputDestination) : null,
  });
}
