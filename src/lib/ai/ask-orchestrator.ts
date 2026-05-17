import type { AskContextReceipt, AskIntent } from '@/lib/ai/ask-conversation';
import { agentToolRequiresApproval, getAgentToolDefinition, type AgentToolId } from '@/lib/agent-runtime/tool-registry';
import { policyAgentRunIntent, type PolicyAgentOutputDestination, type PolicyAgentRunIntent } from '@/lib/product/policy-agents';

export type AskAgenticMode = 'direct_with_receipts' | 'queue_agent_run';
export type AskOrchestrationComplexity = 'simple' | 'standard' | 'deep';
export type AskSupervisorAction = 'direct_answer' | 'queue_agent_run';
export type AskOrchestrationStageName = 'triage' | 'capsule' | 'tool_router' | 'supervisor';

export interface AskOrchestrationStage {
  stage: AskOrchestrationStageName;
  status: 'ok' | 'warn';
  detail: string;
}

export interface AskQueuedAgentRunReceipt {
  runId: string;
  status: 'queued' | 'dispatch_enqueued' | 'dispatch_failed' | 'ledger_failed';
  outputHref?: string | null;
  dispatchId?: string | null;
  error?: string;
}

export interface AskConversationOrchestrationReceipt {
  version: 1;
  traceId: string | null;
  triage: {
    intent: AskIntent;
    runIntent: PolicyAgentRunIntent;
    complexity: AskOrchestrationComplexity;
    agenticMode: AskAgenticMode;
    policyAgentId: string | null;
    reasons: string[];
  };
  capsule: {
    capsuleId: string | null;
    capsuleVersion: number | null;
    contextHealth: AskContextReceipt['health'];
    contextPackageId: string | null;
    evidenceCount: number;
    sourcePreviewCount: number;
    activeGapCount: number;
    warnings: string[];
  };
  toolRouting: {
    selectedToolIds: string[];
    approvalRequiredToolIds: string[];
    blockedToolIds: string[];
  };
  supervisor: {
    action: AskSupervisorAction;
    status: 'planned' | 'queued' | 'dispatch_enqueued' | 'failed' | 'not_required';
    policyAgentId: string | null;
    outputDestination: PolicyAgentOutputDestination | null;
    queuedRun?: AskQueuedAgentRunReceipt | null;
  };
  stages: AskOrchestrationStage[];
}

export function buildAskConversationOrchestrationReceipt(input: {
  prompt: string;
  intent: AskIntent;
  contextReceipt: AskContextReceipt;
  sourcePreviewCount: number;
  activeGapCount?: number;
  contextPackageId?: string | null;
}): AskConversationOrchestrationReceipt {
  const complexity = classifyComplexity(input.prompt, input.intent, input.contextReceipt, input.activeGapCount ?? 0);
  const policyAgentId = selectPolicyAgent(input.prompt, input.intent, complexity);
  const selectedToolIds = selectTools(input.prompt, input.intent, complexity);
  const approvalRequiredToolIds = selectedToolIds.filter((toolId) => {
    try {
      return agentToolRequiresApproval(toolId);
    } catch {
      return true;
    }
  });
  const blockedToolIds = approvalRequiredToolIds;
  const shouldQueue = complexity === 'deep' || input.intent === 'research_memo';
  const activeGapCount = input.activeGapCount ?? input.contextReceipt.warnings.length;
  const reasons = buildTriageReasons({
    prompt: input.prompt,
    intent: input.intent,
    complexity,
    sourcePreviewCount: input.sourcePreviewCount,
    activeGapCount,
    contextHealth: input.contextReceipt.health,
  });

  for (const toolId of selectedToolIds) {
    getAgentToolDefinition(toolId);
  }

  return {
    version: 1,
    traceId: input.contextReceipt.traceId,
    triage: {
      intent: input.intent,
      runIntent: policyAgentRunIntent(policyAgentId),
      complexity,
      agenticMode: shouldQueue ? 'queue_agent_run' : 'direct_with_receipts',
      policyAgentId,
      reasons,
    },
    capsule: {
      capsuleId: input.contextReceipt.capsuleId,
      capsuleVersion: input.contextReceipt.capsuleVersion,
      contextHealth: input.contextReceipt.health,
      contextPackageId: input.contextPackageId ?? null,
      evidenceCount: input.contextReceipt.evidenceCount,
      sourcePreviewCount: input.sourcePreviewCount,
      activeGapCount,
      warnings: input.contextReceipt.warnings,
    },
    toolRouting: {
      selectedToolIds,
      approvalRequiredToolIds,
      blockedToolIds,
    },
    supervisor: {
      action: shouldQueue ? 'queue_agent_run' : 'direct_answer',
      status: shouldQueue ? 'planned' : 'not_required',
      policyAgentId,
      outputDestination: policyAgentId === 'research-memo' ? 'memo_studio' : null,
      queuedRun: null,
    },
    stages: [
      {
        stage: 'triage',
        status: 'ok',
        detail: shouldQueue
          ? `Queued path selected for ${policyAgentId ?? 'agent'} work.`
          : 'Direct answer selected with orchestration receipts.',
      },
      {
        stage: 'capsule',
        status: input.contextReceipt.health === 'ready' ? 'ok' : 'warn',
        detail: `${input.contextReceipt.health} context with ${input.contextReceipt.evidenceCount} evidence paragraph${input.contextReceipt.evidenceCount === 1 ? '' : 's'}.`,
      },
      {
        stage: 'tool_router',
        status: blockedToolIds.length ? 'warn' : 'ok',
        detail: `${selectedToolIds.length} tool route${selectedToolIds.length === 1 ? '' : 's'} selected; ${blockedToolIds.length} approval-gated.`,
      },
      {
        stage: 'supervisor',
        status: shouldQueue ? 'warn' : 'ok',
        detail: shouldQueue
          ? 'Supervisor will create a durable AgentRun before streaming the answer.'
          : 'Supervisor keeps this turn synchronous and source-receipted.',
      },
    ],
  };
}

export function markAskOrchestrationRunQueued(
  receipt: AskConversationOrchestrationReceipt,
  queuedRun: AskQueuedAgentRunReceipt,
): AskConversationOrchestrationReceipt {
  return {
    ...receipt,
    supervisor: {
      ...receipt.supervisor,
      status: queuedRun.status === 'dispatch_enqueued' ? 'dispatch_enqueued' : queuedRun.status === 'ledger_failed' ? 'failed' : 'queued',
      queuedRun,
    },
    stages: receipt.stages.map((stage) => stage.stage === 'supervisor'
      ? {
          ...stage,
          status: queuedRun.status === 'ledger_failed' || queuedRun.status === 'dispatch_failed' ? 'warn' : 'ok',
          detail: queuedRun.status === 'ledger_failed'
            ? `AgentRun could not be created: ${queuedRun.error ?? 'ledger unavailable'}.`
            : `AgentRun ${queuedRun.runId} ${queuedRun.status.replace(/_/g, ' ')}.`,
        }
      : stage),
  };
}

function classifyComplexity(
  prompt: string,
  intent: AskIntent,
  contextReceipt: AskContextReceipt,
  activeGapCount: number,
): AskOrchestrationComplexity {
  const text = prompt.toLowerCase();
  if (/\b(deep|research|latest|current|today|multi[- ]?source|search|web|sources?|investigate|comprehensive)\b/.test(text)) {
    return 'deep';
  }
  if (intent !== 'normal_answer') return 'standard';
  if (contextReceipt.health !== 'ready' || activeGapCount > 1) return 'standard';
  return 'simple';
}

function selectPolicyAgent(prompt: string, intent: AskIntent, complexity: AskOrchestrationComplexity): string | null {
  const text = prompt.toLowerCase();
  if (intent === 'handover') return 'handover-builder';
  if (intent === 'red_team_review') return 'red-team-analyst';
  if (intent === 'sourceability_review') return 'sourceability-reviewer';
  if (intent === 'research_memo') return 'research-memo';
  if (complexity === 'deep' && /\b(memo|brief|write up|draft|options paper)\b/.test(text)) return 'research-memo';
  if (complexity === 'deep') return 'research-memo';
  return null;
}

function selectTools(prompt: string, intent: AskIntent, complexity: AskOrchestrationComplexity): AgentToolId[] {
  const text = prompt.toLowerCase();
  const tools = new Set<AgentToolId>(['context-resolve', 'capsule-evidence-pack']);
  if (complexity === 'deep') {
    tools.add('grounded-search');
    tools.add('deep-search-agent');
  }
  if (intent === 'research_memo' || /\b(memo|brief|write up|draft|options paper)\b/.test(text)) tools.add('policy-memo');
  if (intent === 'sourceability_review' || complexity === 'deep' || /\b(cite|citation|verify|sourceability|sources?)\b/.test(text)) tools.add('sourceability-reviewer');
  if (intent === 'red_team_review') tools.add('red-team-review');
  if (intent === 'handover') tools.add('handover-package');
  if (/\b(format|docx|pdf|markdown|export pack)\b/.test(text)) tools.add('memo-formatter');
  if (/\b(document|upload|attached|quote|chunk)\b/.test(text)) tools.add('document-retrieve');
  if (/\b(graph|canvas|actor map|relationship)\b/.test(text)) tools.add('graph-mutation');
  if (/\b(export|send externally|external)\b/.test(text)) tools.add('external-export');
  return Array.from(tools);
}

function buildTriageReasons(input: {
  prompt: string;
  intent: AskIntent;
  complexity: AskOrchestrationComplexity;
  sourcePreviewCount: number;
  activeGapCount: number;
  contextHealth: AskContextReceipt['health'];
}): string[] {
  const reasons = [
    `intent:${input.intent}`,
    `complexity:${input.complexity}`,
    `context:${input.contextHealth}`,
  ];
  if (input.sourcePreviewCount > 0) reasons.push(`sources:${input.sourcePreviewCount}`);
  if (input.activeGapCount > 0) reasons.push(`gaps:${input.activeGapCount}`);
  if (input.complexity === 'deep') reasons.push('deep/current/multi-source language detected');
  return reasons;
}
