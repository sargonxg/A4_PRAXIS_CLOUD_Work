export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'expired';

export type AgentTriggerType =
  | 'manual'
  | 'schedule'
  | 'webhook'
  | 'email_event'
  | 'source_update'
  | 'capsule_change';

export type AgentToolRisk = 'low' | 'medium' | 'high';

export type AgentReasoningPhase = 'plan' | 'act' | 'reflect' | 'approval_gate' | 'complete';

export interface SelectedCoreIds {
  userCoreId: string | null;
  teamCoreId: string | null;
  situationCoreId: string | null;
  pathCoreId: string | null;
  sourceCoreIds: string[];
  documentCoreIds: string[];
  graphCoreId: string | null;
  timeCoreId: string | null;
  outputCoreIds: string[];
  toolCoreIds: string[];
  objectiveCoreIds: string[];
  productCoreIds: string[];
  memoryCoreId: string | null;
}

export interface AgentSpec {
  id: string;
  ownerUid: string;
  capsuleId: string;
  contextStackId: string | null;
  contextPackageId: string | null;
  label: string;
  description: string | null;
  triggerTypes: AgentTriggerType[];
  selectedCoreIds: SelectedCoreIds;
  maxStep: number;
  maxSessionMinutes: number;
  internalEstimatedCostCents: number | null;
  internalSpendCents: number | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface AgentRun {
  id: string;
  agentSpecId: string | null;
  ownerUid: string;
  capsuleId: string;
  contextStackId: string | null;
  contextPackageId: string | null;
  selectedCoreIds: SelectedCoreIds;
  status: AgentRunStatus;
  triggerType: AgentTriggerType;
  objective: string;
  traceId: string;
  parentRunId: string | null;
  idempotencyKey: string;
  maxStep: number;
  maxSessionMinutes: number;
  internalEstimatedCostCents: number | null;
  internalSpendCents: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
}

export type AgentRunFailureEventSummary = {
  eventId: string;
  eventType: string;
  message: string | null;
  phase: string | null;
  createdAt: string;
};

export type AgentRunFailureToolCallSummary = {
  toolCallId: string | null;
  toolId: string;
  status: 'failed';
  risk: AgentToolRisk | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
};

export type AgentRunFailureSummary = {
  schemaVersion: 1;
  category: string;
  failedPhase: string;
  executionMode: string;
  policyAgentId: string | null;
  errorName: string;
  sanitizedError: string;
  retryGuidance: string;
  lastEventBeforeFailure: AgentRunFailureEventSummary | null;
  failingToolCall: AgentRunFailureToolCallSummary | null;
  createdAt: string;
};

export interface AgentRunEvent {
  id: string;
  runId: string;
  ownerUid: string;
  capsuleId: string;
  eventType: string;
  fromStatus: AgentRunStatus | null;
  toStatus: AgentRunStatus | null;
  message: string | null;
  data: Record<string, unknown>;
  traceId: string;
  createdAt: string;
}

export interface AgentToolCall {
  id: string;
  runId: string;
  ownerUid: string;
  capsuleId: string;
  toolId: string;
  risk: AgentToolRisk;
  status: 'planned' | 'waiting_approval' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentApproval {
  id: string;
  runId: string;
  ownerUid: string;
  capsuleId: string;
  toolCallId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reason: string;
  risk: AgentToolRisk;
  requestedAt: string;
  decidedAt: string | null;
  decidedByUid: string | null;
  expiresAt: string | null;
}

export interface AgentTrigger {
  id: string;
  ownerUid: string;
  capsuleId: string;
  agentSpecId: string;
  triggerType: AgentTriggerType;
  enabled: boolean;
  scheduleCron: string | null;
  sourceRef: string | null;
  idempotencyScope: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentReasoningStep {
  id: string;
  phase: AgentReasoningPhase;
  toolId: string | null;
  risk: AgentToolRisk;
  message: string;
  requiresApproval: boolean;
  receiptId: string | null;
}

export interface AgentReasoningLoopResult {
  completed: boolean;
  stoppedForApproval: boolean;
  steps: AgentReasoningStep[];
  nextApprovalReason: string | null;
}

export interface CapsuleAgentExecutionContext {
  cognitiveReceipts?: import('@/lib/cognitive-capsule/context-adapter').CognitiveAttachmentReceipt[];
  version: 1;
  capsuleId: string;
  capsuleVersion: number;
  contextPackageId: string | null;
  traceId: string | null;
  conversationThreadId: string | null;
  objectivePreview: string;
  selectedCoreIds: SelectedCoreIds;
  retrievalPlan: {
    layerIds: string[];
    repositoryDocumentIds: string[];
    repositorySourceReceiptIds: string[];
    repositoryChunkCount: number;
    repositoryFreshness: string | null;
  };
  evidencePack: {
    packId: string | null;
    paragraphCount: number;
    gapCount: number;
  };
  modelRuntime: {
    selectedModel: string | null;
    actualModel: string | null;
    fallbackCandidates: string[];
  };
  orchestration: {
    agenticMode: string;
    supervisorAction: string;
    policyAgentId: string | null;
    selectedToolIds: string[];
    approvalRequiredToolIds: string[];
  };
}

export type CreateAgentRunInput = {
  ownerUid: string;
  capsuleId: string;
  contextStackId?: string | null;
  contextPackageId?: string | null;
  selectedCoreIds?: Partial<SelectedCoreIds>;
  agentSpecId?: string | null;
  triggerType: AgentTriggerType;
  objective: string;
  traceId?: string;
  parentRunId?: string | null;
  idempotencyKey?: string;
  maxStep?: number;
  maxSessionMinutes?: number;
  internalEstimatedCostCents?: number | null;
  metadata?: Record<string, unknown>;
};

export const DEFAULT_SELECTED_CORE_IDS: SelectedCoreIds = {
  userCoreId: null,
  teamCoreId: null,
  situationCoreId: null,
  pathCoreId: null,
  sourceCoreIds: [],
  documentCoreIds: [],
  graphCoreId: null,
  timeCoreId: null,
  outputCoreIds: [],
  toolCoreIds: [],
  objectiveCoreIds: [],
  productCoreIds: [],
  memoryCoreId: null,
};
