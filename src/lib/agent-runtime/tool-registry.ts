import { z } from 'zod';
import type { AgentToolRisk, SelectedCoreIds } from '@/lib/agent-runtime/types';

export type AgentToolApprovalPolicy = 'auto' | 'approval_required';
export type AgentToolPersistenceTarget =
  | 'none'
  | 'run_event'
  | 'memo'
  | 'output_capsule'
  | 'graph_proposal'
  | 'source_receipt'
  | 'external_export';

export interface AgentToolDefinition {
  id: string;
  label: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  risk: AgentToolRisk;
  requiredCores: Array<keyof SelectedCoreIds>;
  persistenceTarget: AgentToolPersistenceTarget;
  approvalPolicy: AgentToolApprovalPolicy;
}

const EmptyObjectSchema = z.record(z.string(), z.unknown()).default({});

export const AGENT_TOOL_REGISTRY = {
  'context-resolve': tool({
    id: 'context-resolve',
    label: 'Resolve active capsule',
    description: 'Reads the ContextCapsule, selected cores, health, and retrieval posture.',
    risk: 'low',
    requiredCores: [],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'capsule-evidence-pack': tool({
    id: 'capsule-evidence-pack',
    label: 'Build evidence pack',
    description: 'Builds the model-ready capsule evidence object from documents, chunks, receipts, memories, and output history.',
    risk: 'low',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'sourceability-reviewer': tool({
    id: 'sourceability-reviewer',
    label: 'Review sourceability',
    description: 'Checks unsupported claims, weak source coverage, citation gaps, and review blockers.',
    risk: 'low',
    requiredCores: ['sourceCoreIds'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'document-retrieve': tool({
    id: 'document-retrieve',
    label: 'Retrieve document evidence',
    description: 'Reads uploaded documents, chunks, digests, and source receipts attached to the active capsule.',
    risk: 'low',
    requiredCores: ['documentCoreIds'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'capsule-repository-read': tool({
    id: 'capsule-repository-read',
    label: 'Read capsule repository',
    description: 'Reads reusable ContextCapsule cores, starter definitions, repository documents, and source gaps before building a capsule draft.',
    risk: 'low',
    requiredCores: [],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'grounded-search': tool({
    id: 'grounded-search',
    label: 'Grounded source search',
    description: 'Routes read-only current-source collection through approved grounded search surfaces.',
    risk: 'medium',
    requiredCores: ['sourceCoreIds'],
    persistenceTarget: 'source_receipt',
    approvalPolicy: 'auto',
  }),
  'deep-search-agent': tool({
    id: 'deep-search-agent',
    label: 'Deep Search Agent',
    description: 'Queues deep/current/multi-source research work while keeping PRAXIS as the canonical receipt ledger.',
    risk: 'medium',
    requiredCores: ['situationCoreId', 'sourceCoreIds'],
    persistenceTarget: 'source_receipt',
    approvalPolicy: 'auto',
  }),
  'policy-memo': tool({
    id: 'policy-memo',
    label: 'Draft policy memo',
    description: 'Creates a Memo Studio draft from the active capsule and evidence pack.',
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'memo',
    approvalPolicy: 'auto',
  }),
  'memo-formatter': tool({
    id: 'memo-formatter',
    label: 'Format work product',
    description: 'Turns an Ask answer, memo, or capsule notes into a structured export-ready work product.',
    risk: 'medium',
    requiredCores: ['outputCoreIds'],
    persistenceTarget: 'memo',
    approvalPolicy: 'auto',
  }),
  'red-team-review': tool({
    id: 'red-team-review',
    label: 'Red-team review',
    description: 'Challenges assumptions, options, incentives, and evidence quality using the active capsule.',
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'boardroom-deliberation': tool({
    id: 'boardroom-deliberation',
    label: 'Boardroom deliberation',
    description: 'Runs sequential participant turns from the active capsule and records transcript proof.',
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'board-executive-pack': tool({
    id: 'board-executive-pack',
    label: 'Board-executive pack',
    description: 'Creates the final chair synthesis, evidence stats, risks, open questions, and next actions as a reviewable output.',
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'output_capsule',
    approvalPolicy: 'auto',
  }),
  'handover-package': tool({
    id: 'handover-package',
    label: 'Build handover package',
    description: 'Packages capsule state, outputs, gaps, receipts, and next actions for another analyst or agent.',
    risk: 'medium',
    requiredCores: ['outputCoreIds', 'memoryCoreId'],
    persistenceTarget: 'output_capsule',
    approvalPolicy: 'auto',
  }),
  'output-capsule-save': tool({
    id: 'output-capsule-save',
    label: 'Save output capsule',
    description: 'Persists a reviewable OutputCapsuleRecord with citations, gaps, provenance, and run linkage.',
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'output_capsule',
    approvalPolicy: 'auto',
  }),
  'graph-mutation': tool({
    id: 'graph-mutation',
    label: 'Graph mutation',
    description: 'Writes or promotes graph changes. V1 stops for approval before execution.',
    risk: 'high',
    requiredCores: ['graphCoreId'],
    persistenceTarget: 'graph_proposal',
    approvalPolicy: 'approval_required',
  }),
  'external-export': tool({
    id: 'external-export',
    label: 'External export',
    description: 'Exports output outside PRAXIS. V1 stops for approval before execution.',
    risk: 'high',
    requiredCores: ['outputCoreIds'],
    persistenceTarget: 'external_export',
    approvalPolicy: 'approval_required',
  }),
  'browser-mcp-write': tool({
    id: 'browser-mcp-write',
    label: 'Browser or MCP write',
    description: 'Writes through browser automation or MCP connectors. V1 stops for approval before execution.',
    risk: 'high',
    requiredCores: ['toolCoreIds'],
    persistenceTarget: 'external_export',
    approvalPolicy: 'approval_required',
  }),
  'unsupported-claim-acceptance': tool({
    id: 'unsupported-claim-acceptance',
    label: 'Accept unsupported claim',
    description: 'Allows a claim to pass despite missing source support. V1 requires approval.',
    risk: 'high',
    requiredCores: ['sourceCoreIds'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'approval_required',
  }),
} satisfies Record<string, AgentToolDefinition>;

export type AgentToolId = keyof typeof AGENT_TOOL_REGISTRY;

export function getAgentToolDefinition(toolId: string): AgentToolDefinition {
  const definition = AGENT_TOOL_REGISTRY[toolId as AgentToolId];
  if (!definition) throw new Error(`Unknown agent tool: ${toolId}`);
  return definition;
}

export function listAgentToolDefinitions(): AgentToolDefinition[] {
  return Object.values(AGENT_TOOL_REGISTRY);
}

export function agentToolRequiresApproval(toolId: string): boolean {
  return getAgentToolDefinition(toolId).approvalPolicy === 'approval_required';
}

function tool(input: Omit<AgentToolDefinition, 'inputSchema' | 'outputSchema'> & {
  inputSchema?: z.ZodTypeAny;
  outputSchema?: z.ZodTypeAny;
}): AgentToolDefinition {
  return {
    inputSchema: input.inputSchema ?? EmptyObjectSchema,
    outputSchema: input.outputSchema ?? EmptyObjectSchema,
    ...input,
  };
}
