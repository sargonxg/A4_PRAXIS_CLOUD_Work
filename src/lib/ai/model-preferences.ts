import { getModelMatrixEntry } from '@/lib/ai/model-matrix';

export const MODEL_PREFERENCE_VALUES = [
  getModelMatrixEntry('balanced').model,
  getModelMatrixEntry('complex_reasoning').model,
] as const;

export type ModelPreferenceValue = typeof MODEL_PREFERENCE_VALUES[number];

export const DEFAULT_MODEL_PREFERENCE = getModelMatrixEntry('balanced').model as ModelPreferenceValue;

export function isModelPreferenceValue(value: unknown): value is ModelPreferenceValue {
  return typeof value === 'string' && MODEL_PREFERENCE_VALUES.includes(value as ModelPreferenceValue);
}

export function modelPreferenceLabel(value: ModelPreferenceValue): string {
  if (value === getModelMatrixEntry('complex_reasoning').model) return 'Gemini Pro (deep, comprehensive)';
  return 'Gemini Flash (fast, economical)';
}
