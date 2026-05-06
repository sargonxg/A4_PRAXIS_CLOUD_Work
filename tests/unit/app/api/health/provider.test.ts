import { describe, expect, it } from 'vitest';
import { getProviderIntegrationStatus } from '@/app/api/health/provider/route';

describe('getProviderIntegrationStatus', () => {
  it('marks optional integrations live when their env vars are present', () => {
    const status = getProviderIntegrationStatus({
      GOOGLE_AI_API_KEY: 'google-key',
      VERTEX_AGENT_ENGINE_ID: '123456789',
      POLAR_ACCESS_TOKEN: 'polar-token',
      POLAR_WEBHOOK_SECRET: 'whsec',
      POLAR_PRODUCT_ANALYST: 'prod-analyst',
      POLAR_PRODUCT_TEAM: 'prod-team',
    });

    expect(status).toEqual({
      groundedSearch: true,
      vertexAdk: true,
      polar: true,
      polarMissing: [],
    });
  });

  it('reports missing optional integration env vars without exposing values', () => {
    const status = getProviderIntegrationStatus({
      GOOGLE_AI_API_KEY: 'google-key',
      POLAR_ACCESS_TOKEN: 'polar-token',
      POLAR_PRODUCT_ANALYST: 'prod-analyst',
    });

    expect(status.groundedSearch).toBe(true);
    expect(status.vertexAdk).toBe(false);
    expect(status.polar).toBe(false);
    expect(status.polarMissing).toEqual([
      'POLAR_WEBHOOK_SECRET',
      'POLAR_PRODUCT_TEAM',
    ]);
  });
});
