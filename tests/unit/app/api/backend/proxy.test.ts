import { describe, expect, it } from 'vitest';
import { isAllowedBackendPath } from '@/app/api/backend/[...path]/route';

describe('backend proxy allowlist', () => {
  it('allows known user-scoped graph, pipeline, and analysis routes', () => {
    expect(isAllowedBackendPath('POST', 'pipeline/run')).toBe(true);
    expect(isAllowedBackendPath('POST', 'pipeline/ingest-url')).toBe(true);
    expect(isAllowedBackendPath('GET', 'graph/sit-1')).toBe(true);
    expect(isAllowedBackendPath('POST', 'graph/sit-1/temporal/search')).toBe(true);
    expect(isAllowedBackendPath('GET', 'analyze/sit-1/brief.json')).toBe(true);
  });

  it('blocks operational and unknown backend routes', () => {
    expect(isAllowedBackendPath('GET', 'agents/health')).toBe(false);
    expect(isAllowedBackendPath('POST', 'graph/test-connection')).toBe(false);
    expect(isAllowedBackendPath('DELETE', 'graph/sit-1')).toBe(false);
    expect(isAllowedBackendPath('GET', 'pipeline/run')).toBe(false);
  });
});
