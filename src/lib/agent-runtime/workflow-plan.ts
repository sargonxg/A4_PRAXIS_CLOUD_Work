import { createHash } from 'crypto';
import type { CapsuleReadReceipt } from '@/lib/agent-runtime/capsule-read-receipt';
import { agentToolRequiresApproval, getAgentToolDefinition } from '@/lib/agent-runtime/tool-registry';
import {
  getPolicyAgent,
  type PolicyAgentOutputDestination,
  type PolicyAgentRunIntent,
} from '@/lib/product/policy-agents';
import {
  CAPSULE_V3_AGENT_ROLES,
  type ContextCapsuleV3ReviewCardTarget,
} from '@/lib/context/capsule-v3';

export type AgentWorkflowKind =
  | 'direct_answer'
  | 'current_research_brief'
  | 'pdf_memo_output'
  | 'gap_fill'
  | 'multi_agent_review'
  | 'handover'
  | 'capsule_governance';

export interface AgentWorkflowPlan {
  version: 1;
  planId: string;
  workflowKind: AgentWorkflowKind;
  processRail: string[];
  requiredPolicyAgentIds: string[];
  reviewCardOnlyAgentIds: string[];
  reviewCardTargets: ContextCapsuleV3ReviewCardTarget[];
  canonicalMutationPolicy: 'review-card-only' | 'not-applicable';
  selectedTools: string[];
  approvalRequiredToolIds: string[];
  outputTarget: PolicyAgentOutputDestination | null;
  requiresCurrentGrounding: boolean;
  requiresSourceabilityPass: boolean;
  groundingPosture: string;
  planSummary: string;
}

export const AGENT_WORKFLOW_PROCESS_RAIL: AgentWorkflowPlan['processRail'] = [
  'Reading capsule',
  'Planning workflow',
  'Checking evidence',
  'Reviewing claims',
  'Saving artifact',
];

export function buildAgentWorkflowPlan(input: {
  prompt?: string;
  runIntent: PolicyAgentRunIntent;
  policyAgentId?: string | null;
  selectedToolIds: string[];
  outputTarget?: PolicyAgentOutputDestination | null;
  capsuleReadReceipt: CapsuleReadReceipt;
  groundingPosture?: string | null;
}): AgentWorkflowPlan {
  const workflowKind = classifyWorkflowKind(input);
  const requiredPolicyAgentIds = normalizePolicyAgents(input.policyAgentId, workflowKind);
  const selectedTools = normalizeToolIds(input.selectedToolIds);
  const capsuleGovernance = workflowKind === 'capsule_governance';
  const approvalRequiredToolIds = selectedTools.filter((toolId) => agentToolRequiresApproval(toolId));
  const requiresCurrentGrounding = selectedTools.includes('grounded-search') || selectedTools.includes('deep-search-agent');
  const requiresSourceabilityPass = selectedTools.includes('sourceability-reviewer')
    || workflowKind === 'pdf_memo_output'
    || workflowKind === 'current_research_brief'
    || workflowKind === 'multi_agent_review'
    || workflowKind === 'handover';
  const outputTarget = input.outputTarget ?? input.capsuleReadReceipt.outputTarget ?? null;
  const groundingPosture = input.groundingPosture ?? input.capsuleReadReceipt.groundingPosture;

  return {
    version: 1,
    planId: stablePlanId(workflowKind, input.capsuleReadReceipt.receiptId, selectedTools.join(',')),
    workflowKind,
    processRail: capsuleGovernance
      ? [...AGENT_WORKFLOW_PROCESS_RAIL.slice(0, 4), 'Preparing review cards', 'Saving artifact']
      : AGENT_WORKFLOW_PROCESS_RAIL,
    requiredPolicyAgentIds,
    reviewCardOnlyAgentIds: capsuleGovernance ? CAPSULE_V3_AGENT_ROLES.map((role) => role.id) : [],
    reviewCardTargets: capsuleGovernance ? ['advisoryMemory', 'sourceGap', 'graphProposal', 'claimLedger', 'agentInstructions'] : [],
    canonicalMutationPolicy: capsuleGovernance ? 'review-card-only' : 'not-applicable',
    selectedTools,
    approvalRequiredToolIds,
    outputTarget,
    requiresCurrentGrounding,
    requiresSourceabilityPass,
    groundingPosture,
    planSummary: summarizePlan(workflowKind, requiredPolicyAgentIds, selectedTools, outputTarget),
  };
}

function classifyWorkflowKind(input: {
  prompt?: string;
  runIntent: PolicyAgentRunIntent;
  policyAgentId?: string | null;
  selectedToolIds: string[];
}): AgentWorkflowKind {
  const text = input.prompt?.toLowerCase() ?? '';
  if (input.runIntent === 'capsule_factory' || input.policyAgentId === 'capsule-factory') return 'capsule_governance';
  if (input.runIntent === 'handover' || input.policyAgentId === 'handover-builder') return 'handover';
  if (input.runIntent === 'research_memo' || input.selectedToolIds.some((toolId) => toolId === 'grounded-search' || toolId === 'deep-search-agent')) return 'current_research_brief';
  if (input.runIntent === 'format_output' || /\b(pdf|docx|memo|briefing pack|report|export|formatted)\b/.test(text)) return 'pdf_memo_output';
  if (input.runIntent === 'sourceability_review' || input.runIntent === 'red_team_review') return 'multi_agent_review';
  if (/\b(gap|missing source|fill)\b/.test(text)) return 'gap_fill';
  return 'direct_answer';
}

function normalizePolicyAgents(policyAgentId: string | null | undefined, workflowKind: AgentWorkflowKind): string[] {
  const ids = [
    ...(policyAgentId ? [policyAgentId] : []),
    ...(
      workflowKind === 'current_research_brief' || workflowKind === 'pdf_memo_output'
        ? ['sourceability-reviewer']
        : workflowKind === 'multi_agent_review'
          ? ['sourceability-reviewer', 'red-team-analyst']
          : workflowKind === 'handover'
            ? ['sourceability-reviewer', 'handover-builder']
            : []
    ),
  ];
  return Array.from(new Set(ids.filter((id) => Boolean(getPolicyAgent(id)))));
}

function normalizeToolIds(toolIds: string[]): string[] {
  return Array.from(new Set(toolIds.filter((toolId) => {
    try {
      getAgentToolDefinition(toolId);
      return true;
    } catch {
      return false;
    }
  })));
}

function summarizePlan(
  workflowKind: AgentWorkflowKind,
  policyAgentIds: string[],
  selectedTools: string[],
  outputTarget: PolicyAgentOutputDestination | null,
): string {
  const agentLabels = policyAgentIds
    .map((id) => getPolicyAgent(id)?.label)
    .filter((label): label is string => Boolean(label));
  const agentText = agentLabels.length ? agentLabels.join(', ') : 'Ask PRAXIS supervisor';
  const outputText = outputTarget ? ` toward ${outputTarget.replace(/_/g, ' ')}` : '';
  return `${workflowKind.replace(/_/g, ' ')} via ${agentText} with ${selectedTools.length} registered tool route${selectedTools.length === 1 ? '' : 's'}${outputText}.`;
}

function stablePlanId(...parts: string[]): string {
  return `awp:${createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 20)}`;
}
