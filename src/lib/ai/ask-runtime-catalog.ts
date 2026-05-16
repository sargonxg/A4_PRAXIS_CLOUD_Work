import { getModelMatrixEntry } from '@/lib/ai/model-matrix';
import type { ModelPreferenceValue } from '@/lib/ai/model-preferences';

export type AskRuntimeMode = 'chat' | 'research_memo' | 'sourceability_review' | 'handover';
export type AskRuntimeStatus = 'live' | 'planned';

export interface AskRuntimeOption {
  id: ModelPreferenceValue;
  label: string;
  provider: 'vertex';
  mode: AskRuntimeMode;
  status: AskRuntimeStatus;
  summary: string;
}

export const ASK_RUNTIME_OPTIONS = [
  {
    id: getModelMatrixEntry('balanced').model,
    label: 'Gemini 3 Flash Preview',
    provider: 'vertex',
    mode: 'chat',
    status: 'live',
    summary: 'Fast capsule-aware answers, source triage, and everyday workspace questions.',
  },
  {
    id: getModelMatrixEntry('complex_reasoning').model,
    label: 'Gemini 3.1 Pro Preview',
    provider: 'vertex',
    mode: 'research_memo',
    status: 'live',
    summary: 'Deeper reasoning for memos, long context synthesis, and high-stakes review.',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    provider: 'vertex',
    mode: 'research_memo',
    status: 'live',
    summary: 'Stable GA reasoning fallback for long policy synthesis when preview access is constrained.',
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'vertex',
    mode: 'chat',
    status: 'live',
    summary: 'Balanced GA model for everyday capsule discussion, source triage, and tool routing.',
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite',
    provider: 'vertex',
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
