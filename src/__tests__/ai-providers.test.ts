import { describe, it, expect } from 'vitest';
import { getProviderInfo } from '../lib/ai/providers';

describe('AI Providers', () => {
  it('getProviderInfo returns correct structure', () => {
    const info = getProviderInfo();
    expect(info).toHaveProperty('name');
    expect(info).toHaveProperty('displayName');
    expect(info).toHaveProperty('modelId');
    expect(info).toHaveProperty('isConfigured');
    expect(['google', 'vertex']).toContain(info.name);
  });
});
