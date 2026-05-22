import type { AskContextReceipt, AskIntent } from '@/lib/ai/ask-conversation';
import { buildCapsuleReadReceiptFromAsk, type CapsuleReadReceipt } from '@/lib/agent-runtime/capsule-read-receipt';
import { resolveGroundingPlan, type GroundingPlan } from '@/lib/agent-runtime/grounding-adapter';
import { agentToolRequiresApproval, getAgentToolDefinition } from '@/lib/agent-runtime/tool-registry';
import { buildAgentWorkflowPlan, type AgentWorkflowPlan } from '@/lib/agent-runtime/workflow-plan';
import { getPolicyAgent, policyAgentRunIntent, type PolicyAgentOutputDestination, type PolicyAgentRunIntent } from '@/lib/product/policy-agents';
import { buildTacitusRoutingDecision, type TacitusRoutingDecision } from '@/lib/ai/tacitus-routing-policy';
import { getModelMatrixEntry } from '@/lib/ai/model-matrix';

export type AskAgenticMode = 'direct_with_receipts' | 'queue_agent_run';
export type AskOrchestrationComplexity = 'simple' | 'standard' | 'deep';
export type AskSupervisorAction = 'direct_answer' | 'queue_agent_run';
export type AskOrchestrationStageName = 'capsule' | 'triage' | 'agent_router' | 'model_tier' | 'tool_router' | 'language_policy' | 'worker' | 'draft';

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
  grounding: {
    groundingPlan: GroundingPlan;
    sourcePosture: string;
    groundingPosture: string;
    degradedReason: string | null;
  };
  generationBudget: AskGenerationBudgetReceipt;
  languagePolicyReview: AskLanguagePolicyReviewReceipt;
  researchModePresets: AskResearchModePreset[];
  capsuleReadReceipt: CapsuleReadReceipt;
  workflowPlan: AgentWorkflowPlan;
  routingDecision: TacitusRoutingDecision;
  supervisor: {
    action: AskSupervisorAction;
    status: 'planned' | 'queued' | 'dispatch_enqueued' | 'failed' | 'not_required';
    policyAgentId: string | null;
    outputDestination: PolicyAgentOutputDestination | null;
    queuedRun?: AskQueuedAgentRunReceipt | null;
  };
  stages: AskOrchestrationStage[];
}

export type AskOrchestrationStatusId =
  | 'context'
  | 'triage'
  | 'agent'
  | 'documents'
  | 'model-tier'
  | 'tools'
  | 'language-policy'
  | 'worker'
  | 'draft';

export type AskOrchestrationStatus = 'pending' | 'active' | 'complete' | 'warn' | 'queued' | 'skipped' | 'failed';

export interface AskOrchestrationStatusEvent {
  type: 'orchestrationStatus';
  id: AskOrchestrationStatusId;
  label: string;
  status: AskOrchestrationStatus;
  detail: string;
  runId?: string | null;
  outputHref?: string | null;
  canOpen?: boolean;
  canRetry?: boolean;
  canCancel?: boolean;
  agentLabel?: string | null;
  selectedToolIds?: string[];
  sourceCount?: number;
  capsuleCount?: number;
  warningCount?: number;
  approvalGateCount?: number;
  outputTarget?: string | null;
  groundingPosture?: string;
  sourcePosture?: string;
  degradedReason?: string | null;
  fallbackPosture?: string;
}

export interface AskGenerationBudgetReceipt {
  mode: 'standard' | 'long_context';
  taskKind: 'balanced' | 'long_context';
  selectedModelId: string;
  maxOutputTokens: number;
  continuationRecommended: boolean;
  continuationTargets: Array<'memo' | 'evidence_annex' | 'output_capsule'>;
}

export interface AskLanguagePolicyReviewReceipt {
  required: boolean;
  posture: 'standard_language_check' | 'research_policy_review';
  checks: string[];
}

export type AskResearchModePreset =
  | 'sourceability-review'
  | 'current-research-memo'
  | 'red-team-assumptions'
  | 'policy-language-check'
  | 'evidence-annex';

export function buildAskConversationOrchestrationReceipt(input: {
  prompt: string;
  intent: AskIntent;
  contextReceipt: AskContextReceipt;
  sourcePreviewCount: number;
  activeGapCount?: number;
  contextPackageId?: string | null;
  selectedPolicyAgentId?: string | null;
  userSelectedModelId?: string | null;
  requestedOutputType?: string | null;
}): AskConversationOrchestrationReceipt {
  const complexity = classifyComplexity(input.prompt, input.intent, input.contextReceipt, input.activeGapCount ?? 0);
  const routingDecision = buildTacitusRoutingDecision({
    prompt: input.prompt,
    intent: input.intent,
    selectedPolicyAgentId: input.selectedPolicyAgentId,
    userSelectedModelId: input.userSelectedModelId,
    capsuleHealth: input.contextReceipt.health,
    sourcePreviewCount: input.sourcePreviewCount,
    activeGapCount: input.activeGapCount ?? input.contextReceipt.warnings.length,
    requestedOutputType: input.requestedOutputType,
  });
  const policyAgentId = routingDecision.policyAgentId;
  const selectedToolIds = routingDecision.toolRoute.selectedToolIds;
  const approvalRequiredToolIds = selectedToolIds.filter((toolId) => {
    try {
      return agentToolRequiresApproval(toolId);
    } catch {
      return true;
    }
  });
  const blockedToolIds = approvalRequiredToolIds;
  const shouldQueue = routingDecision.workerMode !== 'direct-answer';
  const activeGapCount = input.activeGapCount ?? input.contextReceipt.warnings.length;
  const grounding = buildGroundingReceipt({
    selectedToolIds,
    sourcePreviewCount: input.sourcePreviewCount,
    documentCount: input.contextReceipt.coreRefs.sourceDocumentCoreIds.length,
  });
  const generationBudget = buildAskGenerationBudgetReceipt({
    complexity,
    intent: input.intent,
    selectedModelId: routingDecision.selectedModelId,
  });
  const languagePolicyReview = buildAskLanguagePolicyReview({
    intent: input.intent,
    complexity,
    selectedToolIds,
    activeGapCount,
  });
  const capsuleReadReceipt = buildCapsuleReadReceiptFromAsk({
    capsuleId: input.contextReceipt.capsuleId,
    capsuleVersion: input.contextReceipt.capsuleVersion,
    selectedTools: selectedToolIds,
    outputTarget: routingDecision.outputDestination,
    sourceCount: input.sourcePreviewCount,
    documentCount: input.contextReceipt.coreRefs.sourceDocumentCoreIds.length,
    sourcedParagraphCount: input.contextReceipt.evidenceCount,
    contextGaps: input.contextReceipt.warnings,
    groundingPosture: grounding.groundingPosture,
  });
  const workflowPlan = buildAgentWorkflowPlan({
    prompt: input.prompt,
    runIntent: policyAgentRunIntent(policyAgentId),
    policyAgentId,
    selectedToolIds,
    outputTarget: routingDecision.outputDestination,
    capsuleReadReceipt,
    groundingPosture: grounding.groundingPosture,
  });
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
    grounding,
    generationBudget,
    languagePolicyReview,
    researchModePresets: researchModePresetsFor(input.intent, complexity),
    capsuleReadReceipt,
    workflowPlan,
    routingDecision,
    supervisor: {
      action: shouldQueue ? 'queue_agent_run' : 'direct_answer',
      status: shouldQueue ? 'planned' : 'not_required',
      policyAgentId,
      outputDestination: routingDecision.outputDestination,
      queuedRun: null,
    },
    stages: [
      {
        stage: 'capsule',
        status: input.contextReceipt.health === 'ready' ? 'ok' : 'warn',
        detail: `${input.contextReceipt.health} context with ${input.contextReceipt.evidenceCount} evidence paragraph${input.contextReceipt.evidenceCount === 1 ? '' : 's'}.`,
      },
      {
        stage: 'triage',
        status: 'ok',
        detail: `${input.intent.replace(/_/g, ' ')} request classified as ${complexity}.`,
      },
      {
        stage: 'agent_router',
        status: 'ok',
        detail: `${routingDecision.userSafeLabels.policyAgent} selected.`,
      },
      {
        stage: 'model_tier',
        status: 'ok',
        detail: `${routingDecision.userSafeLabels.modelTier}; ${routingDecision.userSafeLabels.fallbackPosture.toLowerCase()}.`,
      },
      {
        stage: 'tool_router',
        status: blockedToolIds.length ? 'warn' : 'ok',
        detail: `${selectedToolIds.length} tool route${selectedToolIds.length === 1 ? '' : 's'} selected; ${blockedToolIds.length} approval-gated.`,
      },
      {
        stage: 'language_policy',
        status: languagePolicyReview.required ? 'warn' : 'ok',
        detail: languagePolicyReview.required
          ? 'Language, terminology, sourceability, and policy caveat review required before export.'
          : 'Standard terminology and policy-language checks attached.',
      },
      {
        stage: 'worker',
        status: shouldQueue ? 'warn' : 'ok',
        detail: shouldQueue
          ? 'Supervisor will create a durable AgentRun before streaming the answer.'
          : 'Supervisor keeps this turn synchronous and source-receipted.',
      },
      {
        stage: 'draft',
        status: 'ok',
        detail: 'Answer drafting can begin after routing receipts are attached.',
      },
    ],
  };
}

export function buildAskOrchestrationStatusEvents(receipt: AskConversationOrchestrationReceipt): AskOrchestrationStatusEvent[] {
  const queuedRun = receipt.supervisor.queuedRun ?? null;
  const selectedToolIds = receipt.toolRouting.selectedToolIds;
  const policyAgent = getPolicyAgent(receipt.supervisor.policyAgentId);
  const outputTarget = destinationLabel(receipt.supervisor.outputDestination);
  const groundingPosture = receipt.grounding.groundingPosture;
  const sourcePosture = receipt.grounding.sourcePosture;
  const degradedReason = receipt.grounding.degradedReason;
  const warningCount = receipt.capsule.activeGapCount;
  const fallbackPosture = queuedRun?.status ?? (receipt.supervisor.action === 'queue_agent_run' ? 'queued' : 'synchronous');
  const agentStatus = queuedRun?.status === 'ledger_failed'
    ? 'failed'
    : queuedRun?.status === 'dispatch_failed'
      ? 'warn'
      : receipt.supervisor.action === 'queue_agent_run'
        ? 'queued'
        : 'skipped';
  const agentDetail = queuedRun?.status === 'ledger_failed'
    ? 'Deep work queue is unavailable; Ask will continue synchronously.'
    : queuedRun?.status === 'dispatch_failed'
      ? 'Durable run was created, but dispatch needs retry.'
      : receipt.supervisor.action === 'queue_agent_run'
        ? 'Durable agent run queued for deeper work.'
        : 'No durable run needed for this answer.';

  return [
    {
      type: 'orchestrationStatus',
      id: 'context',
      label: 'Reading capsule',
      status: receipt.capsule.contextHealth === 'ready' ? 'complete' : 'warn',
      detail: safeStatusDetail(`${receipt.capsule.contextHealth} capsule checked with ${receipt.capsule.evidenceCount} evidence paragraph${receipt.capsule.evidenceCount === 1 ? '' : 's'}.`),
    },
    {
      type: 'orchestrationStatus',
      id: 'triage',
      label: 'Planning workflow',
      status: 'complete',
      detail: safeStatusDetail(`${receipt.triage.intent.replace(/_/g, ' ')} turn classified as ${receipt.triage.complexity}.`),
      agentLabel: policyAgent?.label ?? receipt.routingDecision.userSafeLabels.policyAgent,
    },
    {
      type: 'orchestrationStatus',
      id: 'agent',
      label: 'Source discovery',
      status: 'complete',
      detail: safeStatusDetail(`${receipt.routingDecision.userSafeLabels.policyAgent} selected.`),
      selectedToolIds,
      sourceCount: receipt.capsule.sourcePreviewCount,
      capsuleCount: receipt.capsule.capsuleId ? 1 : 0,
      groundingPosture,
      sourcePosture,
      degradedReason,
    },
    {
      type: 'orchestrationStatus',
      id: 'documents',
      label: 'Document retrieval',
      status: receipt.capsule.contextHealth === 'missing' ? 'warn' : 'complete',
      detail: safeStatusDetail(`${receipt.capsule.evidenceCount} evidence paragraph${receipt.capsule.evidenceCount === 1 ? '' : 's'} and ${receipt.capsule.sourcePreviewCount} source preview${receipt.capsule.sourcePreviewCount === 1 ? '' : 's'} attached.`),
      sourceCount: receipt.capsule.sourcePreviewCount,
      capsuleCount: receipt.capsule.capsuleId ? 1 : 0,
      warningCount,
    },
    {
      type: 'orchestrationStatus',
      id: 'tools',
      label: 'Claim review',
      status: receipt.toolRouting.blockedToolIds.length ? 'warn' : 'complete',
      detail: safeStatusDetail(`${receipt.toolRouting.selectedToolIds.length} tool route${receipt.toolRouting.selectedToolIds.length === 1 ? '' : 's'} selected; ${receipt.toolRouting.blockedToolIds.length} approval gated.`),
      selectedToolIds,
      approvalGateCount: receipt.toolRouting.approvalRequiredToolIds.length,
      sourceCount: receipt.capsule.sourcePreviewCount,
      warningCount,
    },
    {
      type: 'orchestrationStatus',
      id: 'language-policy',
      label: 'Language and policy review',
      status: receipt.languagePolicyReview.required ? 'complete' : 'skipped',
      detail: receipt.languagePolicyReview.required
        ? 'Sourceability and terminology review queued for this research/policy turn.'
        : 'Standard terminology check only; no specialist policy review needed.',
      selectedToolIds,
      sourceCount: receipt.capsule.sourcePreviewCount,
      warningCount,
    },
    {
      type: 'orchestrationStatus',
      id: 'worker',
      label: 'Producing output',
      status: agentStatus,
      detail: safeStatusDetail(agentDetail),
      runId: queuedRun?.runId && queuedRun.runId !== 'unavailable' ? queuedRun.runId : null,
      outputHref: queuedRun?.outputHref ?? null,
      canOpen: Boolean(queuedRun?.runId && queuedRun.runId !== 'unavailable'),
      canRetry: queuedRun?.status === 'dispatch_failed',
      canCancel: queuedRun?.status === 'queued' || queuedRun?.status === 'dispatch_enqueued',
      agentLabel: policyAgent?.label ?? receipt.routingDecision.userSafeLabels.policyAgent,
      selectedToolIds,
      sourceCount: receipt.capsule.sourcePreviewCount,
      warningCount,
      approvalGateCount: receipt.toolRouting.approvalRequiredToolIds.length,
      outputTarget,
      groundingPosture,
      sourcePosture,
      degradedReason,
      fallbackPosture,
    },
    {
      type: 'orchestrationStatus',
      id: 'draft',
      label: 'Saving receipts',
      status: 'active',
      detail: 'Answer drafting started.',
      outputTarget,
    },
  ];
}

export function buildAskGenerationBudgetReceipt(input: {
  complexity: AskOrchestrationComplexity;
  intent: AskIntent;
  selectedModelId: string;
}): AskGenerationBudgetReceipt {
  const longContext = input.complexity === 'deep'
    || input.intent === 'research_memo'
    || input.intent === 'sourceability_review'
    || input.intent === 'red_team_review'
    || input.intent === 'handover';
  const taskKind = longContext ? 'long_context' : 'balanced';
  const entry = getModelMatrixEntry(taskKind);
  return {
    mode: longContext ? 'long_context' : 'standard',
    taskKind,
    selectedModelId: input.selectedModelId,
    maxOutputTokens: entry.maxTokens ?? (longContext ? 8192 : 4096),
    continuationRecommended: longContext,
    continuationTargets: longContext ? ['memo', 'evidence_annex', 'output_capsule'] : ['memo'],
  };
}

function buildAskLanguagePolicyReview(input: {
  intent: AskIntent;
  complexity: AskOrchestrationComplexity;
  selectedToolIds: string[];
  activeGapCount: number;
}): AskLanguagePolicyReviewReceipt {
  const required = input.complexity === 'deep'
    || input.intent !== 'normal_answer'
    || input.selectedToolIds.includes('sourceability-reviewer')
    || input.activeGapCount > 0;
  return {
    required,
    posture: required ? 'research_policy_review' : 'standard_language_check',
    checks: required
      ? ['terminology', 'policy-neutrality', 'unsupported-claims', 'primary-source-gap-language']
      : ['terminology', 'policy-neutrality'],
  };
}

function researchModePresetsFor(intent: AskIntent, complexity: AskOrchestrationComplexity): AskResearchModePreset[] {
  const presets: AskResearchModePreset[] = ['policy-language-check'];
  if (intent === 'sourceability_review' || complexity === 'deep') presets.push('sourceability-review', 'evidence-annex');
  if (intent === 'research_memo' || complexity === 'deep') presets.push('current-research-memo');
  if (intent === 'red_team_review') presets.push('red-team-assumptions');
  return Array.from(new Set(presets));
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
    stages: receipt.stages.map((stage) => stage.stage === 'worker'
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

function safeStatusDetail(value: string): string {
  return value
    .replace(/https?:\/\/[^\s"')]+/gi, '[redacted-url]')
    .replace(/[A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL|SERVICE_ACCOUNT)[A-Z0-9_]*/gi, '[redacted-env]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]*gserviceaccount\.com/gi, '[redacted-service-account]')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/gi, '[redacted-secret]')
    .replace(/\b(stack\s+trace|traceback|exception)\b/gi, '[redacted-runtime-detail]')
    .replace(/\b[a-z0-9-]+\.run\.app\b/gi, '[redacted-url]');
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

function destinationLabel(destination: PolicyAgentOutputDestination | null): string | null {
  switch (destination) {
    case 'memo_studio':
      return 'Memo Studio';
    case 'canvas':
      return 'Canvas';
    case 'library':
      return 'Capsules';
    case 'handover':
      return 'Handover';
    default:
      return null;
  }
}

function buildGroundingReceipt(input: {
  selectedToolIds: string[];
  sourcePreviewCount: number;
  documentCount: number;
}): AskConversationOrchestrationReceipt['grounding'] {
  const groundingPlan = resolveGroundingPlan({
    selectedToolIds: input.selectedToolIds,
    documentCount: input.documentCount,
    sourceReceiptCount: input.sourcePreviewCount,
  });
  const searchSelected = input.selectedToolIds.includes('grounded-search') || input.selectedToolIds.includes('deep-search-agent');
  const googleGroundingActive = groundingPlan.modes.includes('google_search');
  const sourcePosture = input.sourcePreviewCount > 0
    ? 'Source receipts saved'
    : 'No source receipts saved';
  const groundingPosture = googleGroundingActive
    ? 'Google Search grounding active'
    : searchSelected
      ? 'Grounding unavailable'
      : input.selectedToolIds.includes('sourceability-reviewer')
        ? 'Source review requested'
        : sourcePosture;
  return {
    groundingPlan,
    sourcePosture,
    groundingPosture,
    degradedReason: searchSelected && !googleGroundingActive
      ? 'Google Search grounding is not configured.'
      : null,
  };
}
