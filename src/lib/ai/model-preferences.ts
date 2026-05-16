import { getModelMatrixEntry } from '@/lib/ai/model-matrix';

export const MODEL_PREFERENCE_VALUES = [
  getModelMatrixEntry('balanced').model,
  getModelMatrixEntry('complex_reasoning').model,
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
] as const;

export type ModelPreferenceValue = typeof MODEL_PREFERENCE_VALUES[number];

export const DEFAULT_MODEL_PREFERENCE = getModelMatrixEntry('balanced').model as ModelPreferenceValue;

export function isModelPreferenceValue(value: unknown): value is ModelPreferenceValue {
  return typeof value === 'string' && MODEL_PREFERENCE_VALUES.includes(value as ModelPreferenceValue);
}

export function modelPreferenceLabel(value: ModelPreferenceValue): string {
  if (value === getModelMatrixEntry('complex_reasoning').model) return 'Gemini 3 Pro Preview (deep, comprehensive)';
  if (value === 'gemini-2.5-pro') return 'Gemini 2.5 Pro (GA reasoning fallback)';
  if (value === 'gemini-2.5-flash') return 'Gemini 2.5 Flash (GA balanced fallback)';
  if (value === 'gemini-2.5-flash-lite') return 'Gemini 2.5 Flash-Lite (GA high-throughput fallback)';
  return 'Gemini 3 Flash Preview (fast, conversational)';
}
