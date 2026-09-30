import {
  buildModelFallbackCandidates,
  getAskPraxisModelLabel,
  getAskPraxisModelRuntimePolicy,
} from '@/lib/ai/model-runtime-policy';
import type { ModelPreferenceValue } from '@/lib/ai/model-preferences';
import { getModelMatrixEntry } from '@/lib/ai/model-matrix';

export type AskRuntimeMode = 'chat' | 'research_memo' | 'sourceability_review' | 'handover';
export type AskRuntimeStatus = 'live' | 'planned';

export interface AskRuntimeOption {
  id: ModelPreferenceValue;
  label: string;
  provider: 'vertex';
  lifecycleTier: 'frontier_primary' | 'stable_fallback';
  mode: AskRuntimeMode;
  status: AskRuntimeStatus;
  summary: string;
}

const ASK_MODEL_POLICY = getAskPraxisModelRuntimePolicy();

export const ASK_RUNTIME_OPTIONS = [
  {
    id: ASK_MODEL_POLICY.frontierPrimary.chatModelId,
    label: getAskPraxisModelLabel(ASK_MODEL_POLICY.frontierPrimary.chatModelId),
    provider: 'vertex',
    lifecycleTier: 'frontier_primary',
    mode: 'chat',
    status: 'live',
    summary: 'Fast capsule-aware answers, source triage, and everyday workspace questions.',
  },
  {
    id: ASK_MODEL_POLICY.frontierPrimary.deepModelId,
    label: getAskPraxisModelLabel(ASK_MODEL_POLICY.frontierPrimary.deepModelId),
    provider: 'vertex',
    lifecycleTier: 'frontier_primary',
    mode: 'research_memo',
    status: 'live',
    summary: 'Deeper reasoning for memos, long context synthesis, and high-stakes review.',
  },
  {
    id: getModelMatrixEntry('cheap_classify').model,
    label: getAskPraxisModelLabel(getModelMatrixEntry('cheap_classify').model),
    provider: 'vertex',
    lifecycleTier: 'stable_fallback',
    mode: 'chat',
    status: 'live',
    summary: 'Economical recall, extraction, tagging, and classification; provider access is required.',
  },
  {
    id: ASK_MODEL_POLICY.stableFallback.deep[0],
    label: getAskPraxisModelLabel(ASK_MODEL_POLICY.stableFallback.deep[0]),
    provider: 'vertex',
    lifecycleTier: 'stable_fallback',
    mode: 'research_memo',
    status: 'live',
    summary: 'Stable GA reasoning fallback for long policy synthesis when preview access is constrained.',
  },
  {
    id: ASK_MODEL_POLICY.stableFallback.chat[0],
    label: getAskPraxisModelLabel(ASK_MODEL_POLICY.stableFallback.chat[0]),
    provider: 'vertex',
    lifecycleTier: 'stable_fallback',
    mode: 'chat',
    status: 'live',
    summary: 'Balanced GA model for everyday capsule discussion, source triage, and tool routing.',
  },
  {
    id: ASK_MODEL_POLICY.stableFallback.cheap[0],
    label: getAskPraxisModelLabel(ASK_MODEL_POLICY.stableFallback.cheap[0]),
    provider: 'vertex',
    lifecycleTier: 'stable_fallback',
    mode: 'chat',
    status: 'live',
    summary: 'High-throughput GA fallback for quick classification, drafting, and lightweight checks.',
  },
] as const satisfies readonly AskRuntimeOption[];

export const ASK_ORCHESTRATION_OPTIONS = [
  {
    id: 'vertex-grounded-search',
    label: 'Vertex grounding',
    status: 'live',
    summary: 'Use grounded retrieval when a claim needs fresh public or private source support.',
  },
  {
    id: 'genkit-flow',
    label: 'Genkit flow',
    status: 'planned',
    summary: 'Structured multi-step flows for premium capsule builds, reviews, and tool orchestration.',
  },
  {
    id: 'agent-engine-memory',
    label: 'Agent Engine memory',
    status: 'planned',
    summary: 'Long-running session memory for enterprise capsules once approval gates are in place.',
  },
] as const;

export function getAskRuntimeOption(id: string | null | undefined): AskRuntimeOption {
  return ASK_RUNTIME_OPTIONS.find((option) => option.id === id) ?? ASK_RUNTIME_OPTIONS[0];
}

export function buildAskRuntimeFallbackCandidates(input: {
  selectedModelId: string | null | undefined;
  analysisDepth?: string | null;
}): ModelPreferenceValue[] {
  const deep = input.analysisDepth === 'deep';
  const selected = deep
    ? ASK_MODEL_POLICY.frontierPrimary.deepModelId
    : getAskRuntimeOption(input.selectedModelId).id;
  return buildModelFallbackCandidates({
    selectedModelId: selected,
    depth: deep ? 'deep' : 'chat',
  }).map((candidate) => candidate.modelId);
}

export function isAskRuntimeModelAccessError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid (?:argument|json|schema)|schema|unsupported (?:parameter|option)|validation/i.test(message)) return false;
  return /quota|resource.?exhausted|permission|not found|unavailable|forbidden|unauthorized|denied|\b(?:401|403|404|429|503)\b/i.test(message);
}
