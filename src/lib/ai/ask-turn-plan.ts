import type { AgentWorkflowPlan } from '@/lib/agent-runtime/workflow-plan';
import type { AskIntent } from '@/lib/ai/ask-conversation';
import type { AskGenerationBudgetReceipt, AskOrchestrationComplexity } from '@/lib/ai/ask-orchestrator';
import type { TacitusRoutingDecision } from '@/lib/ai/tacitus-routing-policy';

export type AskTurnPlanIntent =
  | 'quick_answer'
  | 'policy_research'
  | 'conflict_analysis'
  | 'source_check'
  | 'memo'
  | 'handover'
  | 'capsule_build';

export type AskTurnPlanComplexity = 'simple' | 'standard' | 'deep' | 'multi_agent';

export type AskTurnPlanAnswerShape =
  | 'short_answer'
  | 'research_memo'
  | 'table'
  | 'evidence_annex'
  | 'briefing'
  | 'handover_pack'
  | 'output_capsule';

export type AskTurnPlanContinuationPolicy =
  | 'complete_now'
  | 'offer_deep_run'
  | 'queue_agent'
  | 'ask_for_sources'
  | 'needs_human_review';

export type AskTurnPlanOutputMode =
  | 'quick_answer'
  | 'sourceability_review'
  | 'policy_brief'
  | 'evidence_annex_memo_pack';

export interface AskTurnPlan {
  version: 1;
  outputMode: AskTurnPlanOutputMode;
  intent: AskTurnPlanIntent;
  complexity: AskTurnPlanComplexity;
  answerShape: AskTurnPlanAnswerShape;
  requiredTools: string[];
  requiredAgents: string[];
  qualityBar: string[];
  statusRail: string[];
  artifactPlan: string[];
  continuationPolicy: AskTurnPlanContinuationPolicy;
}

export function buildAskTurnPlan(input: {
  prompt: string;
  intent: AskIntent;
  orchestrationComplexity: AskOrchestrationComplexity;
  contextHealth: 'ready' | 'thin' | 'missing';
  sourcePreviewCount: number;
  activeGapCount: number;
  selectedToolIds: string[];
  approvalRequiredToolIds: string[];
  generationBudget: AskGenerationBudgetReceipt;
  routingDecision: TacitusRoutingDecision;
  workflowPlan: AgentWorkflowPlan;
}): AskTurnPlan {
  const text = input.prompt.toLowerCase();
  const requiredAgents = normalizeAgents(input.routingDecision.policyAgentId, input.workflowPlan.requiredPolicyAgentIds);
  const answerShape = selectAnswerShape(text, input.intent, input.routingDecision.workerMode);
  const complexity = selectComplexity(input.orchestrationComplexity, requiredAgents, input.routingDecision.workerMode);
  const outputMode = selectOutputMode({
    answerShape,
    intent: input.intent,
    requiredAgents,
    requiresSourceabilityPass: input.workflowPlan.requiresSourceabilityPass,
    workerMode: input.routingDecision.workerMode,
  });

  return {
    version: 1,
    outputMode,
    intent: selectIntent(text, input.intent, input.routingDecision.workerMode),
    complexity,
    answerShape,
    requiredTools: input.selectedToolIds,
    requiredAgents,
    qualityBar: buildQualityBar({
      sourcePreviewCount: input.sourcePreviewCount,
      activeGapCount: input.activeGapCount,
      answerShape,
      requiredAgents,
      requiresSourceabilityPass: input.workflowPlan.requiresSourceabilityPass,
      approvalRequiredToolIds: input.approvalRequiredToolIds,
    }),
    statusRail: buildStatusRail(input.routingDecision.workerMode, answerShape),
    artifactPlan: buildArtifactPlan(answerShape, input.routingDecision.workerMode, input.workflowPlan.requiresSourceabilityPass),
    continuationPolicy: selectContinuationPolicy({
      shouldQueue: input.routingDecision.workerMode !== 'direct-answer',
      contextHealth: input.contextHealth,
      sourcePreviewCount: input.sourcePreviewCount,
      activeGapCount: input.activeGapCount,
      approvalRequiredToolIds: input.approvalRequiredToolIds,
      generationBudget: input.generationBudget,
    }),
  };
}

function selectIntent(text: string, intent: AskIntent, workerMode: TacitusRoutingDecision['workerMode']): AskTurnPlanIntent {
  if (workerMode === 'capsule-factory') return 'capsule_build';
  if (intent === 'handover' || workerMode === 'handover-builder') return 'handover';
  if (intent === 'sourceability_review' || workerMode === 'sourceability-reviewer') return 'source_check';
  if (intent === 'research_memo' && /\b(conflict|crisis|ceasefire|armed|war|violence|actor|faction|insurgent|peace|stabilization)\b/.test(text)) {
    return 'conflict_analysis';
  }
  if (intent === 'research_memo' || workerMode === 'research-memo') return 'policy_research';
  if (workerMode === 'output-formatter') return 'memo';
  return 'quick_answer';
}

function selectAnswerShape(
  text: string,
  intent: AskIntent,
  workerMode: TacitusRoutingDecision['workerMode'],
): AskTurnPlanAnswerShape {
  if (/\b(table|matrix|compare|comparison|rank|scorecard)\b/.test(text)) return 'table';
  if (/\b(evidence annex|annex|source annex|citation annex)\b/.test(text)) return 'evidence_annex';
  if (intent === 'handover' || workerMode === 'handover-builder') return 'handover_pack';
  if (workerMode === 'capsule-factory') return 'output_capsule';
  if (intent === 'research_memo' || workerMode === 'research-memo' || workerMode === 'output-formatter') return 'research_memo';
  if (/\b(briefing|brief)\b/.test(text)) return 'briefing';
  return 'short_answer';
}

function selectComplexity(
  orchestrationComplexity: AskOrchestrationComplexity,
  requiredAgents: string[],
  workerMode: TacitusRoutingDecision['workerMode'],
): AskTurnPlanComplexity {
  if (requiredAgents.length > 1) return 'multi_agent';
  if (workerMode !== 'direct-answer' && orchestrationComplexity === 'deep') return 'multi_agent';
  return orchestrationComplexity;
}

function buildQualityBar(input: {
  sourcePreviewCount: number;
  activeGapCount: number;
  answerShape: AskTurnPlanAnswerShape;
  requiredAgents: string[];
  requiresSourceabilityPass: boolean;
  approvalRequiredToolIds: string[];
}): string[] {
  const items = new Set<string>(['source-posture', 'caveats']);
  if (input.sourcePreviewCount > 0) items.add('source-count');
  if (input.activeGapCount > 0) items.add('source-gaps');
  if (input.requiresSourceabilityPass || input.requiredAgents.includes('sourceability-reviewer')) {
    items.add('sourceability');
    items.add('unsupported-claims');
  }
  if (input.answerShape === 'table') items.add('table-shape');
  if (input.approvalRequiredToolIds.length > 0) items.add('approval-gates');
  return Array.from(items);
}

function buildStatusRail(
  workerMode: TacitusRoutingDecision['workerMode'],
  answerShape: AskTurnPlanAnswerShape,
): string[] {
  const rail = ['Reading capsule', 'Planning workflow', 'Checking evidence'];
  if (workerMode !== 'direct-answer') rail.push('Routing agents');
  rail.push(answerShape === 'short_answer' ? 'Drafting answer' : 'Preparing artifact');
  return rail;
}

function buildArtifactPlan(
  answerShape: AskTurnPlanAnswerShape,
  workerMode: TacitusRoutingDecision['workerMode'],
  requiresSourceabilityPass: boolean,
): string[] {
  const artifacts = new Set<string>();
  if (answerShape === 'research_memo' || workerMode === 'research-memo') artifacts.add('research_memo');
  if (answerShape === 'table') {
    artifacts.add('source_table');
    artifacts.add('policy_options_table');
  }
  if (answerShape === 'evidence_annex' || requiresSourceabilityPass) artifacts.add('evidence_annex');
  if (answerShape === 'handover_pack' || workerMode === 'handover-builder') artifacts.add('handover_pack');
  if (answerShape === 'output_capsule' || workerMode === 'capsule-factory') artifacts.add('output_capsule');
  return Array.from(artifacts);
}

function selectOutputMode(input: {
  answerShape: AskTurnPlanAnswerShape;
  intent: AskIntent;
  requiredAgents: string[];
  requiresSourceabilityPass: boolean;
  workerMode: TacitusRoutingDecision['workerMode'];
}): AskTurnPlanOutputMode {
  if (input.answerShape === 'table' || input.answerShape === 'evidence_annex' || input.answerShape === 'handover_pack') {
    return 'evidence_annex_memo_pack';
  }
  if (input.intent === 'sourceability_review' || input.workerMode === 'sourceability-reviewer') {
    return 'sourceability_review';
  }
  if (input.answerShape === 'research_memo' || input.answerShape === 'briefing' || input.workerMode === 'research-memo') {
    return 'policy_brief';
  }
  if (input.requiresSourceabilityPass || input.requiredAgents.includes('sourceability-reviewer')) {
    return 'sourceability_review';
  }
  return 'quick_answer';
}

function selectContinuationPolicy(input: {
  shouldQueue: boolean;
  contextHealth: 'ready' | 'thin' | 'missing';
  sourcePreviewCount: number;
  activeGapCount: number;
  approvalRequiredToolIds: string[];
  generationBudget: AskGenerationBudgetReceipt;
}): AskTurnPlanContinuationPolicy {
  if (input.approvalRequiredToolIds.length > 0) return 'needs_human_review';
  if (input.shouldQueue) return 'queue_agent';
  if (input.contextHealth === 'missing' || (input.contextHealth === 'thin' && input.sourcePreviewCount === 0) || input.activeGapCount > 0) {
    return 'ask_for_sources';
  }
  if (input.generationBudget.continuationRecommended) return 'offer_deep_run';
  return 'complete_now';
}

function normalizeAgents(policyAgentId: string | null, workflowPolicyAgentIds: string[]): string[] {
  return Array.from(new Set([
    ...(policyAgentId ? [policyAgentId] : []),
    ...workflowPolicyAgentIds,
  ]));
}
