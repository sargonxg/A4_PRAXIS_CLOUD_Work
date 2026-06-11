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

const IdSchema = z.string().min(1).max(240);
const TextSchema = z.string().min(1).max(4000);
const ToolRunShape = {
  runId: IdSchema.optional(),
  capsuleId: IdSchema.optional(),
  traceId: IdSchema.optional(),
  objective: z.string().max(2000).optional(),
};
const ReceiptListSchema = z.array(IdSchema).default([]);
const ArtifactListSchema = z.array(IdSchema).default([]);
const StrictEmptyObjectSchema = z.object({}).strict();

const ContextResolveInputSchema = z.object({
  ...ToolRunShape,
  contextPackageId: IdSchema.nullable().optional(),
}).strict();
const ContextResolveOutputSchema = z.object({
  capsuleId: IdSchema.optional(),
  capsuleVersion: z.number().int().nonnegative().optional(),
  contextHealth: z.enum(['ready', 'review', 'thin', 'missing', 'degraded']).optional(),
  gapCount: z.number().int().nonnegative().optional(),
}).strict();

const EvidencePackInputSchema = z.object({
  ...ToolRunShape,
  maxParagraphs: z.number().int().positive().max(50).optional(),
  documentIds: z.array(IdSchema).optional(),
  sourceReceiptIds: z.array(IdSchema).optional(),
}).strict();
const EvidencePackOutputSchema = z.object({
  packId: IdSchema.optional(),
  paragraphCount: z.number().int().nonnegative().optional(),
  gapCount: z.number().int().nonnegative().optional(),
  sourceReceiptIds: ReceiptListSchema,
  documentIds: ReceiptListSchema,
}).strict();

const SourceabilityReviewInputSchema = z.object({
  ...ToolRunShape,
  claims: z.array(TextSchema).optional(),
  sourceReceiptIds: z.array(IdSchema).optional(),
  documentIds: z.array(IdSchema).optional(),
}).strict();
const SourceabilityReviewOutputSchema = z.object({
  totalClaims: z.number().int().nonnegative().optional(),
  supportedClaims: z.number().int().nonnegative().optional(),
  weakClaims: z.number().int().nonnegative().optional(),
  unsupportedClaims: z.number().int().nonnegative().optional(),
  reviewCardIds: ReceiptListSchema,
}).strict();

const SourceGapScoutInputSchema = z.object({
  ...ToolRunShape,
  gaps: z.array(TextSchema).optional(),
  unsupportedClaims: z.array(TextSchema).optional(),
  sourceReceiptIds: z.array(IdSchema).optional(),
}).strict();
const SourceGapScoutOutputSchema = z.object({
  gapCount: z.number().int().nonnegative().optional(),
  unsupportedClaimCount: z.number().int().nonnegative().optional(),
  candidateReceiptCount: z.number().int().nonnegative().optional(),
  reviewCardIds: ReceiptListSchema,
}).strict();

const DailyBriefInputSchema = z.object({
  ...ToolRunShape,
  since: z.string().max(120).nullable().optional(),
  capsuleDeltaCount: z.number().int().nonnegative().optional(),
  sourceReceiptIds: z.array(IdSchema).optional(),
}).strict();
const DailyBriefOutputSchema = z.object({
  memoId: IdSchema.optional(),
  outputHref: z.string().max(500).optional(),
  sourceReceiptIds: ReceiptListSchema,
  unsupportedClaimCount: z.number().int().nonnegative().optional(),
  notificationId: IdSchema.nullable().optional(),
}).strict();

const DocumentRetrieveInputSchema = z.object({
  ...ToolRunShape,
  query: z.string().max(1000).optional(),
  documentIds: z.array(IdSchema).optional(),
  maxChunks: z.number().int().positive().max(100).optional(),
}).strict();
const DocumentRetrieveOutputSchema = z.object({
  documentIds: ReceiptListSchema,
  chunkCount: z.number().int().nonnegative().optional(),
  excerptCount: z.number().int().nonnegative().optional(),
}).strict();

const CapsuleRepositoryReadInputSchema = z.object({
  ...ToolRunShape,
  includeStarterCatalog: z.boolean().optional(),
  includeVersionHistory: z.boolean().optional(),
}).strict();
const CapsuleRepositoryReadOutputSchema = z.object({
  capsuleCount: z.number().int().nonnegative().optional(),
  sourceGapCount: z.number().int().nonnegative().optional(),
  reviewCardIds: ReceiptListSchema,
}).strict();

const GroundedSearchInputSchema = z.object({
  ...ToolRunShape,
  query: z.string().min(1).max(1000).optional(),
  sourceClasses: z.array(z.string().min(1).max(120)).optional(),
  timeframe: z.string().max(120).nullable().optional(),
}).strict();
const GroundedSearchOutputSchema = z.object({
  queryCount: z.number().int().nonnegative().optional(),
  sourceReceiptIds: ReceiptListSchema,
  groundingPosture: z.string().max(240).optional(),
}).strict();

const DeepSearchAgentInputSchema = GroundedSearchInputSchema.extend({
  depth: z.enum(['standard', 'deep']).optional(),
}).strict();
const DeepSearchAgentOutputSchema = z.object({
  runId: IdSchema.optional(),
  sourceReceiptIds: ReceiptListSchema,
  searchPlanId: IdSchema.optional(),
  groundingPosture: z.string().max(240).optional(),
}).strict();

const PolicyMemoInputSchema = z.object({
  ...ToolRunShape,
  evidencePackId: IdSchema.optional(),
  sourceReceiptIds: z.array(IdSchema).optional(),
  requestedFormat: z.enum(['memo', 'brief', 'handover', 'annex']).optional(),
}).strict();
const PolicyMemoOutputSchema = z.object({
  memoId: IdSchema.optional(),
  outputHref: z.string().max(500).optional(),
  sourceReceiptIds: ReceiptListSchema,
  gapCount: z.number().int().nonnegative().optional(),
}).strict();

const MemoFormatterInputSchema = z.object({
  ...ToolRunShape,
  artifactId: IdSchema.optional(),
  content: z.string().max(16000).optional(),
  formats: z.array(z.enum(['markdown', 'docx', 'pdf', 'handover'])).optional(),
}).strict();
const MemoFormatterOutputSchema = z.object({
  memoId: IdSchema.optional(),
  outputHref: z.string().max(500).optional(),
  exportFormats: z.array(z.string().min(1).max(60)).default([]),
}).strict();

const RedTeamReviewInputSchema = z.object({
  ...ToolRunShape,
  claims: z.array(TextSchema).optional(),
  options: z.array(TextSchema).optional(),
  assumptions: z.array(TextSchema).optional(),
}).strict();
const RedTeamReviewOutputSchema = z.object({
  objections: z.array(TextSchema).default([]),
  risks: z.array(TextSchema).default([]),
  confidenceAdjustments: z.array(TextSchema).default([]),
}).strict();

const BoardroomDeliberationInputSchema = z.object({
  ...ToolRunShape,
  question: z.string().max(2000).optional(),
  participantIds: z.array(IdSchema).max(8).optional(),
  selectedSourceIds: z.array(IdSchema).optional(),
  rounds: z.number().int().positive().max(5).optional(),
}).strict();
const BoardroomDeliberationOutputSchema = z.object({
  meetingBrief: z.string().max(4000).optional(),
  transcriptEventCount: z.number().int().nonnegative().optional(),
  outputCapsuleId: IdSchema.optional(),
}).strict();

const BoardExecutivePackInputSchema = z.object({
  ...ToolRunShape,
  boardroomRunId: IdSchema.optional(),
  synthesis: z.string().max(8000).optional(),
  evidenceStats: z.object({
    sourceCount: z.number().int().nonnegative().optional(),
    documentCount: z.number().int().nonnegative().optional(),
    unsupportedClaimCount: z.number().int().nonnegative().optional(),
  }).strict().optional(),
}).strict();
const BoardExecutivePackOutputSchema = z.object({
  memoId: IdSchema.optional(),
  outputCapsuleId: IdSchema.optional(),
  openQuestionCount: z.number().int().nonnegative().optional(),
}).strict();

const HandoverPackageInputSchema = z.object({
  ...ToolRunShape,
  artifactIds: z.array(IdSchema).optional(),
  nextOwner: z.string().max(240).optional(),
}).strict();
const HandoverPackageOutputSchema = z.object({
  handoverPackageId: IdSchema.optional(),
  outputCapsuleId: IdSchema.optional(),
  nextActions: z.array(TextSchema).default([]),
}).strict();

const OutputCapsuleSaveInputSchema = z.object({
  ...ToolRunShape,
  title: z.string().max(240).optional(),
  summary: z.string().max(4000).optional(),
  artifactIds: ArtifactListSchema,
  sourceReceiptIds: ReceiptListSchema,
}).strict();
const OutputCapsuleSaveOutputSchema = z.object({
  outputCapsuleId: IdSchema.optional(),
  outputHref: z.string().max(500).optional(),
  sourceReceiptIds: ReceiptListSchema,
}).strict();

const ApprovalGateInputSchema = z.object({
  ...ToolRunShape,
  proposalId: IdSchema.optional(),
  artifactId: IdSchema.optional(),
  claimId: IdSchema.optional(),
  action: z.string().max(240).optional(),
  reason: z.string().max(1000).optional(),
}).strict();
const ApprovalGateOutputSchema = z.object({
  approvalRequired: z.boolean().default(true),
  approvalId: IdSchema.optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired']).optional(),
}).strict();

export const AGENT_TOOL_REGISTRY = {
  'context-resolve': tool({
    id: 'context-resolve',
    label: 'Resolve active capsule',
    description: 'Reads the ContextCapsule, selected cores, health, and retrieval posture.',
    inputSchema: ContextResolveInputSchema,
    outputSchema: ContextResolveOutputSchema,
    risk: 'low',
    requiredCores: [],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'capsule-evidence-pack': tool({
    id: 'capsule-evidence-pack',
    label: 'Build evidence pack',
    description: 'Builds the model-ready capsule evidence object from documents, chunks, receipts, memories, and output history.',
    inputSchema: EvidencePackInputSchema,
    outputSchema: EvidencePackOutputSchema,
    risk: 'low',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'sourceability-reviewer': tool({
    id: 'sourceability-reviewer',
    label: 'Review sourceability',
    description: 'Checks unsupported claims, weak source coverage, citation gaps, and review blockers.',
    inputSchema: SourceabilityReviewInputSchema,
    outputSchema: SourceabilityReviewOutputSchema,
    risk: 'low',
    requiredCores: ['sourceCoreIds'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'source-gap-scout': tool({
    id: 'source-gap-scout',
    label: 'Scout source gaps',
    description: 'Finds candidate source receipts for evidence gaps and unsupported claims, then writes review-gated source-pack cards.',
    inputSchema: SourceGapScoutInputSchema,
    outputSchema: SourceGapScoutOutputSchema,
    risk: 'low',
    requiredCores: ['sourceCoreIds'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'daily-brief': tool({
    id: 'daily-brief',
    label: 'Daily Brief',
    description: 'Creates a review-gated dated brief draft from capsule deltas and fresh grounded receipts.',
    inputSchema: DailyBriefInputSchema,
    outputSchema: DailyBriefOutputSchema,
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'memo',
    approvalPolicy: 'auto',
  }),
  'document-retrieve': tool({
    id: 'document-retrieve',
    label: 'Retrieve document evidence',
    description: 'Reads uploaded documents, chunks, digests, and source receipts attached to the active capsule.',
    inputSchema: DocumentRetrieveInputSchema,
    outputSchema: DocumentRetrieveOutputSchema,
    risk: 'low',
    requiredCores: ['documentCoreIds'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'capsule-repository-read': tool({
    id: 'capsule-repository-read',
    label: 'Read capsule repository',
    description: 'Reads reusable ContextCapsule cores, starter definitions, repository documents, and source gaps before building a capsule draft.',
    inputSchema: CapsuleRepositoryReadInputSchema,
    outputSchema: CapsuleRepositoryReadOutputSchema,
    risk: 'low',
    requiredCores: [],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'grounded-search': tool({
    id: 'grounded-search',
    label: 'Grounded source search',
    description: 'Routes read-only current-source collection through approved grounded search surfaces.',
    inputSchema: GroundedSearchInputSchema,
    outputSchema: GroundedSearchOutputSchema,
    risk: 'medium',
    requiredCores: ['sourceCoreIds'],
    persistenceTarget: 'source_receipt',
    approvalPolicy: 'auto',
  }),
  'deep-search-agent': tool({
    id: 'deep-search-agent',
    label: 'Deep Search Agent',
    description: 'Queues deep/current/multi-source research work while keeping PRAXIS as the canonical receipt ledger.',
    inputSchema: DeepSearchAgentInputSchema,
    outputSchema: DeepSearchAgentOutputSchema,
    risk: 'medium',
    requiredCores: ['situationCoreId', 'sourceCoreIds'],
    persistenceTarget: 'source_receipt',
    approvalPolicy: 'auto',
  }),
  'policy-memo': tool({
    id: 'policy-memo',
    label: 'Draft policy memo',
    description: 'Creates a Work draft from the active capsule and evidence pack.',
    inputSchema: PolicyMemoInputSchema,
    outputSchema: PolicyMemoOutputSchema,
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'memo',
    approvalPolicy: 'auto',
  }),
  'memo-formatter': tool({
    id: 'memo-formatter',
    label: 'Format work product',
    description: 'Turns an Ask answer, memo, or capsule notes into a structured export-ready work product.',
    inputSchema: MemoFormatterInputSchema,
    outputSchema: MemoFormatterOutputSchema,
    risk: 'medium',
    requiredCores: ['outputCoreIds'],
    persistenceTarget: 'memo',
    approvalPolicy: 'auto',
  }),
  'red-team-review': tool({
    id: 'red-team-review',
    label: 'Red-team review',
    description: 'Challenges assumptions, options, incentives, and evidence quality using the active capsule.',
    inputSchema: RedTeamReviewInputSchema,
    outputSchema: RedTeamReviewOutputSchema,
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'boardroom-deliberation': tool({
    id: 'boardroom-deliberation',
    label: 'Boardroom deliberation',
    description: 'Runs sequential participant turns from the active capsule and records transcript proof.',
    inputSchema: BoardroomDeliberationInputSchema,
    outputSchema: BoardroomDeliberationOutputSchema,
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'run_event',
    approvalPolicy: 'auto',
  }),
  'board-executive-pack': tool({
    id: 'board-executive-pack',
    label: 'Board-executive pack',
    description: 'Creates the final chair synthesis, evidence stats, risks, open questions, and next actions as a reviewable output.',
    inputSchema: BoardExecutivePackInputSchema,
    outputSchema: BoardExecutivePackOutputSchema,
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'output_capsule',
    approvalPolicy: 'auto',
  }),
  'handover-package': tool({
    id: 'handover-package',
    label: 'Build handover package',
    description: 'Packages capsule state, outputs, gaps, receipts, and next actions for another analyst or agent.',
    inputSchema: HandoverPackageInputSchema,
    outputSchema: HandoverPackageOutputSchema,
    risk: 'medium',
    requiredCores: ['outputCoreIds', 'memoryCoreId'],
    persistenceTarget: 'output_capsule',
    approvalPolicy: 'auto',
  }),
  'output-capsule-save': tool({
    id: 'output-capsule-save',
    label: 'Save output capsule',
    description: 'Persists a reviewable OutputCapsuleRecord with citations, gaps, provenance, and run linkage.',
    inputSchema: OutputCapsuleSaveInputSchema,
    outputSchema: OutputCapsuleSaveOutputSchema,
    risk: 'medium',
    requiredCores: ['situationCoreId'],
    persistenceTarget: 'output_capsule',
    approvalPolicy: 'auto',
  }),
  'graph-mutation': tool({
    id: 'graph-mutation',
    label: 'Graph mutation',
    description: 'Writes or promotes graph changes. V1 stops for approval before execution.',
    inputSchema: ApprovalGateInputSchema,
    outputSchema: ApprovalGateOutputSchema,
    risk: 'high',
    requiredCores: ['graphCoreId'],
    persistenceTarget: 'graph_proposal',
    approvalPolicy: 'approval_required',
  }),
  'external-export': tool({
    id: 'external-export',
    label: 'External export',
    description: 'Exports output outside PRAXIS. V1 stops for approval before execution.',
    inputSchema: ApprovalGateInputSchema,
    outputSchema: ApprovalGateOutputSchema,
    risk: 'high',
    requiredCores: ['outputCoreIds'],
    persistenceTarget: 'external_export',
    approvalPolicy: 'approval_required',
  }),
  'browser-mcp-write': tool({
    id: 'browser-mcp-write',
    label: 'Browser or MCP write',
    description: 'Writes through browser automation or MCP connectors. V1 stops for approval before execution.',
    inputSchema: ApprovalGateInputSchema,
    outputSchema: ApprovalGateOutputSchema,
    risk: 'high',
    requiredCores: ['toolCoreIds'],
    persistenceTarget: 'external_export',
    approvalPolicy: 'approval_required',
  }),
  'unsupported-claim-acceptance': tool({
    id: 'unsupported-claim-acceptance',
    label: 'Accept unsupported claim',
    description: 'Allows a claim to pass despite missing source support. V1 requires approval.',
    inputSchema: ApprovalGateInputSchema,
    outputSchema: ApprovalGateOutputSchema,
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
    inputSchema: input.inputSchema ?? StrictEmptyObjectSchema,
    outputSchema: input.outputSchema ?? StrictEmptyObjectSchema,
    ...input,
  };
}
