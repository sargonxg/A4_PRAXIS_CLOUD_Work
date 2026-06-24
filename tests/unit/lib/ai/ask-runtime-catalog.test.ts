import { describe, expect, it } from 'vitest';

import { ASK_RUNTIME_OPTIONS, buildAskRuntimeFallbackCandidates, getAskRuntimeOption } from '@/lib/ai/ask-runtime-catalog';
import { getModelMatrixEntry } from '@/lib/ai/model-matrix';
import { buildModelRuntimeHealthCheck, getAskPraxisModelRuntimePolicy } from '@/lib/ai/model-runtime-policy';
import { MODEL_PREFERENCE_VALUES, isModelPreferenceValue, modelPreferenceLabel } from '@/lib/ai/model-preferences';

describe('Ask PRAXIS runtime catalog', () => {
  it('exposes Gemini 3 frontier choices and Gemini 2.5 Vertex fallbacks', () => {
    const ids = ASK_RUNTIME_OPTIONS.map((option) => option.id);

    expect(ids).toEqual([
      getModelMatrixEntry('balanced').model,
      getModelMatrixEntry('complex_reasoning').model,
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
    ]);
    expect(MODEL_PREFERENCE_VALUES).toEqual([...new Set(ids)]);
  });

  it('centralizes frontier and stable fallback policy in the model matrix', () => {
    const policy = getAskPraxisModelRuntimePolicy();

    expect(policy.frontierPrimary.chatModelId).toBe(getModelMatrixEntry('balanced').model);
    expect(policy.frontierPrimary.deepModelId).toBe(getModelMatrixEntry('complex_reasoning').model);
    expect(getModelMatrixEntry('balanced').maxTokens).toBeGreaterThanOrEqual(8192);
    expect(getModelMatrixEntry('complex_reasoning').maxTokens).toBeGreaterThanOrEqual(16384);
    expect(getModelMatrixEntry('writing_quality').maxTokens).toBeGreaterThanOrEqual(8192);
    expect(policy.stableFallback.deep).toEqual(['gemini-2.5-pro', 'gemini-2.5-flash']);
    expect(policy.vertexLocationPolicy.frontierGemini3Location).toBe('global');
  });

  it('validates and labels selectable model preferences', () => {
    expect(isModelPreferenceValue('gemini-2.5-flash-lite')).toBe(true);
    expect(isModelPreferenceValue('gemini-3-pro-image-preview')).toBe(false);
    expect(modelPreferenceLabel(getModelMatrixEntry('complex_reasoning').model)).toContain('Gemini 3.5 Flash');
    expect(modelPreferenceLabel(getModelMatrixEntry('balanced').model)).toContain('Gemini 3.5 Flash');
    expect(modelPreferenceLabel('gemini-2.5-pro')).toContain('GA reasoning fallback');
  });

  it('falls back to the first runtime option for unknown selections', () => {
    expect(getAskRuntimeOption('unknown-model').id).toBe(getModelMatrixEntry('balanced').model);
  });

  it('builds GA fallback candidates for frontier chat selections', () => {
    expect(buildAskRuntimeFallbackCandidates({
      selectedModelId: getModelMatrixEntry('balanced').model,
      analysisDepth: 'standard',
    })).toEqual([
      getModelMatrixEntry('balanced').model,
      'gemini-2.5-flash',
    ]);
  });

  it('lets TACITUS depth override stale user-selected Ask model choices', () => {
    expect(buildAskRuntimeFallbackCandidates({
      selectedModelId: 'gemini-2.5-flash',
      analysisDepth: 'deep',
    })).toEqual([
      getModelMatrixEntry('complex_reasoning').model,
      'gemini-2.5-pro',
      'gemini-2.5-flash',
    ]);
  });

  it('builds Pro then Flash GA fallback candidates for deep frontier selections', () => {
    expect(buildAskRuntimeFallbackCandidates({
      selectedModelId: getModelMatrixEntry('complex_reasoning').model,
      analysisDepth: 'deep',
    })).toEqual([
      getModelMatrixEntry('complex_reasoning').model,
      'gemini-2.5-pro',
      'gemini-2.5-flash',
    ]);
  });

  it('does not duplicate GA candidates for standard GA runtime choices', () => {
    expect(buildAskRuntimeFallbackCandidates({
      selectedModelId: 'gemini-2.5-flash',
      analysisDepth: 'standard',
    })).toEqual(['gemini-2.5-flash']);
  });

  it('reports Vertex runtime health posture from env and policy coverage', () => {
    const health = buildModelRuntimeHealthCheck({
      GOOGLE_VERTEX_PROJECT: 'praxis-test',
      GOOGLE_VERTEX_GEMINI_LOCATION: 'global',
    } as unknown as NodeJS.ProcessEnv);

    expect(health.ok).toBe(true);
    expect(health.frontierPrimaryModels).toEqual([
      getModelMatrixEntry('balanced').model,
      getModelMatrixEntry('complex_reasoning').model,
    ]);
    expect(health.stableFallbackModels).toEqual([
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
    ]);
  });
});
