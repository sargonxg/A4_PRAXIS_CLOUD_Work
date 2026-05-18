import type { AskIntent } from '@/lib/ai/ask-conversation';
import { buildModelFallbackCandidates, getAskPraxisModelRuntimePolicy, type ModelFallbackCandidate } from '@/lib/ai/model-runtime-policy';
import { agentToolRequiresApproval, type AgentToolId } from '@/lib/agent-runtime/tool-registry';
import { getPolicyAgent, type PolicyAgentOutputDestination } from '@/lib/product/policy-agents';

export type TacitusModelTier = 'fast' | 'standard' | 'deep' | 'sourceability';
export type TacitusWorkerMode =
  | 'direct-answer'
  | 'research-memo'
  | 'output-formatter'
  | 'sourceability-reviewer'
  | 'red-team-analyst'
  | 'handover-builder'
  | 'capsule-factory';

export interface TacitusRoutingDecision {
  version: 1;
  policyAgentId: string | null;
  toolRoute: {
    selectedToolIds: AgentToolId[];
    approvalRequiredToolIds: AgentToolId[];
  };
  modelTier: TacitusModelTier;
  modelFamily: 'Gemini';
  selectedModelId: string;
  fallbackChain: ModelFallbackCandidate[];
  workerMode: TacitusWorkerMode;
  outputDestination: PolicyAgentOutputDestination | null;
  approvalGates: string[];
  reasons: string[];
  userSelectedModelIgnored: boolean;
  userSafeLabels: {
    policyAgent: string;
    modelTier: string;
    fallbackPosture: string;
    workerMode: string;
  };
}

export function buildTacitusRoutingDecision(input: {
  prompt: string;
  intent: AskIntent;
  selectedPolicyAgentId?: string | null;
  userSelectedModelId?: string | null;
  capsuleHealth: 'ready' | 'thin' | 'missing';
  sourcePreviewCount: number;
  activeGapCount: number;
  requestedOutputType?: string | null;
}): TacitusRoutingDecision {
  const text = input.prompt.toLowerCase();
  const policy = getAskPraxisModelRuntimePolicy();
  const policyAgentId = selectPolicyAgent({
    text,
    intent: input.intent,
    selectedPolicyAgentId: input.selectedPolicyAgentId,
    activeGapCount: input.activeGapCount,
    requestedOutputType: input.requestedOutputType,
  });
  const workerMode = workerModeFor(policyAgentId);
  const modelTier = selectModelTier({
    text,
    intent: input.intent,
    workerMode,
    capsuleHealth: input.capsuleHealth,
    activeGapCount: input.activeGapCount,
  });
  const depth = modelTier === 'deep' || modelTier === 'sourceability' ? 'deep' : modelTier === 'fast' ? 'chat' : 'chat';
  const selectedModelId = depth === 'deep'
    ? policy.frontierPrimary.deepModelId
    : policy.frontierPrimary.chatModelId;
  const fallbackChain = buildModelFallbackCandidates({
    selectedModelId,
    depth,
  });
  const selectedToolIds = selectTools(text, input.intent, workerMode, modelTier);
  const approvalRequiredToolIds = selectedToolIds.filter((toolId) => agentToolRequiresApproval(toolId));
  const policyAgent = getPolicyAgent(policyAgentId);
  const reasons = buildReasons({
    intent: input.intent,
    modelTier,
    workerMode,
    capsuleHealth: input.capsuleHealth,
    sourcePreviewCount: input.sourcePreviewCount,
    activeGapCount: input.activeGapCount,
    userSelectedModelIgnored: Boolean(input.userSelectedModelId),
  });

  return {
    version: 1,
    policyAgentId,
    toolRoute: {
      selectedToolIds,
      approvalRequiredToolIds,
    },
    modelTier,
    modelFamily: 'Gemini',
    selectedModelId,
    fallbackChain,
    workerMode,
    outputDestination: policyAgent?.outputDestination ?? outputDestinationFor(workerMode),
    approvalGates: approvalRequiredToolIds,
    reasons,
    userSelectedModelIgnored: Boolean(input.userSelectedModelId),
    userSafeLabels: {
      policyAgent: policyAgent?.label ?? 'Direct Ask PRAXIS answer',
      modelTier: `TACITUS selected ${modelTier === 'sourceability' ? 'sourceability' : modelTier} reasoning`,
      fallbackPosture: fallbackChain.length > 1 ? 'Stable fallback ready' : 'Primary route only',
      workerMode: labelForWorker(workerMode),
    },
  };
}

function selectPolicyAgent(input: {
  text: string;
  intent: AskIntent;
  selectedPolicyAgentId?: string | null;
  activeGapCount: number;
  requestedOutputType?: string | null;
}): string | null {
  if (input.selectedPolicyAgentId && getPolicyAgent(input.selectedPolicyAgentId)) return input.selectedPolicyAgentId;
  if (input.intent === 'handover') return 'handover-builder';
  if (input.intent === 'red_team_review') return 'red-team-analyst';
  if (input.intent === 'sourceability_review') return 'sourceability-reviewer';
  if (input.intent === 'research_memo') return 'research-memo';
  if (/\b(context\s*capsule|contextcapsule|capsule factory|build (a )?capsule|improve (the )?capsule)\b/.test(input.text)) return 'capsule-factory';
  if (/\b(format|docx|pdf|markdown|export-ready|export ready|output format|turn this into)\b/.test(input.text) || input.requestedOutputType) return 'output-formatter';
  if (/\b(red[- ]?team|challenge assumptions|stress test)\b/.test(input.text)) return 'red-team-analyst';
  if (/\b(handover|successor|handoff)\b/.test(input.text)) return 'handover-builder';
  if (/\b(sourceability|source-check|citation audit|verify claims|unsupported claims)\b/.test(input.text)) return 'sourceability-reviewer';
  if (/\b(deep|research|latest|current|multi[- ]?source|search|web|memo|brief|options paper)\b/.test(input.text)) return 'research-memo';
  return null;
}

function workerModeFor(policyAgentId: string | null): TacitusWorkerMode {
  switch (policyAgentId) {
    case 'research-memo':
    case 'output-formatter':
    case 'sourceability-reviewer':
    case 'red-team-analyst':
    case 'handover-builder':
    case 'capsule-factory':
      return policyAgentId;
    default:
      return 'direct-answer';
  }
}

function selectModelTier(input: {
  text: string;
  intent: AskIntent;
  workerMode: TacitusWorkerMode;
  capsuleHealth: 'ready' | 'thin' | 'missing';
  activeGapCount: number;
}): TacitusModelTier {
  if (input.workerMode === 'sourceability-reviewer') return 'sourceability';
  if (input.workerMode === 'research-memo' || input.workerMode === 'red-team-analyst' || input.workerMode === 'handover-builder' || input.workerMode === 'capsule-factory') return 'deep';
  if (/\b(deep|latest|current|multi[- ]?source|investigate|comprehensive)\b/.test(input.text)) return 'deep';
  if (input.workerMode === 'output-formatter' || input.capsuleHealth !== 'ready' || input.activeGapCount > 0 || input.intent !== 'normal_answer') return 'standard';
  return 'fast';
}

function selectTools(
  text: string,
  intent: AskIntent,
  workerMode: TacitusWorkerMode,
  modelTier: TacitusModelTier,
): AgentToolId[] {
  const tools = new Set<AgentToolId>(['context-resolve', 'capsule-evidence-pack']);
  if (modelTier === 'deep' || modelTier === 'sourceability') {
    tools.add('grounded-search');
    tools.add('deep-search-agent');
  }
  if (workerMode === 'capsule-factory') tools.add('capsule-repository-read');
  if (workerMode === 'research-memo' || /\b(memo|brief|write up|draft|options paper)\b/.test(text)) tools.add('policy-memo');
  if (workerMode === 'sourceability-reviewer' || modelTier === 'deep' || /\b(cite|citation|verify|sourceability|sources?)\b/.test(text)) tools.add('sourceability-reviewer');
  if (workerMode === 'red-team-analyst' || intent === 'red_team_review') tools.add('red-team-review');
  if (workerMode === 'handover-builder' || intent === 'handover') tools.add('handover-package');
  if (workerMode === 'output-formatter' || /\b(format|docx|pdf|markdown|export pack)\b/.test(text)) tools.add('memo-formatter');
  if (/\b(document|upload|attached|quote|chunk)\b/.test(text)) tools.add('document-retrieve');
  if (/\b(graph|canvas|actor map|relationship)\b/.test(text)) tools.add('graph-mutation');
  if (/\b(export|send externally|external)\b/.test(text)) tools.add('external-export');
  return Array.from(tools);
}

function outputDestinationFor(workerMode: TacitusWorkerMode): PolicyAgentOutputDestination | null {
  if (workerMode === 'capsule-factory') return 'library';
  if (workerMode === 'handover-builder') return 'handover';
  if (workerMode === 'direct-answer') return null;
  return 'memo_studio';
}

function buildReasons(input: {
  intent: AskIntent;
  modelTier: TacitusModelTier;
  workerMode: TacitusWorkerMode;
  capsuleHealth: string;
  sourcePreviewCount: number;
  activeGapCount: number;
  userSelectedModelIgnored: boolean;
}): string[] {
  const reasons = [
    `intent:${input.intent}`,
    `model-tier:${input.modelTier}`,
    `worker:${input.workerMode}`,
    `capsule:${input.capsuleHealth}`,
  ];
  if (input.sourcePreviewCount > 0) reasons.push(`sources:${input.sourcePreviewCount}`);
  if (input.activeGapCount > 0) reasons.push(`gaps:${input.activeGapCount}`);
  if (input.userSelectedModelIgnored) reasons.push('user model preference ignored for Ask PRAXIS');
  return reasons;
}

function labelForWorker(workerMode: TacitusWorkerMode): string {
  switch (workerMode) {
    case 'direct-answer':
      return 'Direct Ask PRAXIS answer';
    case 'research-memo':
      return 'Research memo worker';
    case 'output-formatter':
      return 'Output formatter worker';
    case 'sourceability-reviewer':
      return 'Sourceability reviewer worker';
    case 'red-team-analyst':
      return 'Red-team analyst worker';
    case 'handover-builder':
      return 'Handover builder worker';
    case 'capsule-factory':
      return 'Capsule factory worker';
  }
}
