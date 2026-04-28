import { describe, expect, it } from 'vitest';
import { getProviderIntegrationStatus } from '@/app/api/health/provider/route';

describe('getProviderIntegrationStatus', () => {
  it('marks optional integrations live when their env vars are present', () => {
    const status = getProviderIntegrationStatus({
      FIRECRAWL_API_KEY: 'fc-key',
      PARALLEL_API_KEY: 'parallel-key',
      VERTEX_AGENT_ENGINE_ID: '123456789',
      POLAR_ACCESS_TOKEN: 'polar-token',
      POLAR_WEBHOOK_SECRET: 'whsec',
      POLAR_PRODUCT_ANALYST: 'prod-analyst',
      POLAR_PRODUCT_TEAM: 'prod-team',
    });

    expect(status).toEqual({
      firecrawl: true,
      parallel: true,
      vertexAdk: true,
      polar: true,
      polarMissing: [],
    });
  });

  it('reports missing optional integration env vars without exposing values', () => {
    const status = getProviderIntegrationStatus({
      FIRECRAWL_API_KEY: 'fc-key',
      POLAR_ACCESS_TOKEN: 'polar-token',
      POLAR_PRODUCT_ANALYST: 'prod-analyst',
    });

    expect(status.firecrawl).toBe(true);
    expect(status.parallel).toBe(false);
    expect(status.vertexAdk).toBe(false);
    expect(status.polar).toBe(false);
    expect(status.polarMissing).toEqual([
      'POLAR_WEBHOOK_SECRET',
      'POLAR_PRODUCT_TEAM',
    ]);
  });
});
