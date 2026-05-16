import { describe, expect, it } from 'vitest';

import { ASK_RUNTIME_OPTIONS, getAskRuntimeOption } from '@/lib/ai/ask-runtime-catalog';
import { getModelMatrixEntry } from '@/lib/ai/model-matrix';
import { MODEL_PREFERENCE_VALUES, isModelPreferenceValue, modelPreferenceLabel } from '@/lib/ai/model-preferences';

describe('Ask PRAXIS runtime catalog', () => {
  it('exposes Gemini 3 frontier previews and Gemini 2.5 Vertex choices', () => {
    const ids = ASK_RUNTIME_OPTIONS.map((option) => option.id);

    expect(ids).toEqual([
      getModelMatrixEntry('balanced').model,
      getModelMatrixEntry('complex_reasoning').model,
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
    ]);
    expect(MODEL_PREFERENCE_VALUES).toEqual(ids);
  });

  it('validates and labels selectable model preferences', () => {
    expect(isModelPreferenceValue('gemini-2.5-flash-lite')).toBe(true);
    expect(isModelPreferenceValue('gemini-3-pro-image-preview')).toBe(false);
    expect(modelPreferenceLabel(getModelMatrixEntry('complex_reasoning').model)).toContain('Gemini 3.1 Pro Preview');
    expect(modelPreferenceLabel('gemini-2.5-pro')).toContain('GA reasoning fallback');
  });

  it('falls back to the first runtime option for unknown selections', () => {
    expect(getAskRuntimeOption('unknown-model').id).toBe(getModelMatrixEntry('balanced').model);
  });
});
