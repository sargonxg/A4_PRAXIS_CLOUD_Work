import {
  getAskPraxisModelLabel,
  getAskPraxisRuntimeModelIds,
  getAskPraxisModelRuntimePolicy,
} from '@/lib/ai/model-runtime-policy';

export const MODEL_PREFERENCE_VALUES = getAskPraxisRuntimeModelIds();

export type ModelPreferenceValue = string;

export const DEFAULT_MODEL_PREFERENCE = getAskPraxisModelRuntimePolicy().frontierPrimary.chatModelId as ModelPreferenceValue;

export function isModelPreferenceValue(value: unknown): value is ModelPreferenceValue {
  return typeof value === 'string' && MODEL_PREFERENCE_VALUES.includes(value);
}

export function modelPreferenceLabel(value: ModelPreferenceValue): string {
  const policy = getAskPraxisModelRuntimePolicy();
  if (value === policy.frontierPrimary.deepModelId) return `${getAskPraxisModelLabel(value)} (deep, comprehensive)`;
  if (value === policy.stableFallback.deep[0]) return `${getAskPraxisModelLabel(value)} (GA reasoning fallback)`;
  if (value === policy.stableFallback.chat[0]) return `${getAskPraxisModelLabel(value)} (GA balanced fallback)`;
  if (value === policy.stableFallback.cheap[0]) return `${getAskPraxisModelLabel(value)} (GA high-throughput fallback)`;
  return `${getAskPraxisModelLabel(value)} (fast, conversational)`;
}
