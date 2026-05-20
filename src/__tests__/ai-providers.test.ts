import { describe, it, expect } from 'vitest';
import { getProviderInfo, MODEL_NAMES } from '../lib/ai/providers';
import { AI_PLATFORM_POSTURE, getModelMatrixEntry, getTaskKinds } from '../lib/ai/model-matrix';

describe('AI Providers', () => {
  it('getProviderInfo returns correct structure', () => {
    const info = getProviderInfo();
    expect(info).toHaveProperty('name');
    expect(info).toHaveProperty('displayName');
    expect(info).toHaveProperty('modelId');
    expect(info).toHaveProperty('isConfigured');
    expect(['google', 'vertex']).toContain(info.name);
  });

  it('loads the Pack 15 model matrix and platform posture', () => {
    expect(getModelMatrixEntry('balanced').model).toBe(MODEL_NAMES.flash);
    expect(getModelMatrixEntry('complex_reasoning').provider).toBe('vertex');
    expect(getModelMatrixEntry('embeddings_text').model).toBe(MODEL_NAMES.embed);
    expect(AI_PLATFORM_POSTURE.enterpriseAgentPlatform).toBe('gemini-enterprise');
    expect(AI_PLATFORM_POSTURE.developerModelRuntime).toBe('vertex-ai');
    expect(getTaskKinds()).toContain('writing_quality');
  });
});
