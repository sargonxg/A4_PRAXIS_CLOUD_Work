import { beforeAll, describe, expect, it } from 'vitest';
import { buildCleanupAudit } from '../../../scripts/audit-route-cleanup-map';
import type { CleanupAudit } from '../../../scripts/audit-route-cleanup-map';

describe('route cleanup map', () => {
  let audit: CleanupAudit;

  beforeAll(() => {
    audit = buildCleanupAudit();
  }, 30000);

  it('maps all API routes with conservative cleanup dispositions', () => {
    expect(audit.totalRoutes).toBeGreaterThanOrEqual(207);
    expect(audit.routeMap).toHaveLength(audit.totalRoutes);
    expect(audit.routeMap.every((entry) => entry.disposition)).toBe(true);
    expect(audit.routeMap.every((entry) => entry.methods.length > 0 || entry.callerEvidence.length > 0)).toBe(true);
    expect(audit.routeMap.every((entry) => entry.dataStores.length > 0)).toBe(true);
    expect(audit.summary['delete candidate']).toBe(0);
  });

  it('preserves canonical visible and agentic runtime surfaces', () => {
    expect(audit.visibleSurfaces.map((entry) => entry.path)).toEqual([
      '/',
      '/login',
      '/app',
      '/app/capsules',
      '/app/repository',
      '/app/settings',
      '/agents/[runId]',
    ]);
    expect(audit.agenticRuntime.every((entry) => entry.status !== 'blocked')).toBe(true);
    expect(audit.routeMap.find((entry) => entry.route === '/api/agents/runs')?.disposition).toBe('do not touch');
    expect(audit.routeMap.find((entry) => entry.route === '/api/conversations/[conversationId]/turns')?.disposition).toBe('do not touch');
  });
});
