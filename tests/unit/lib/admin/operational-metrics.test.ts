import { describe, expect, it } from 'vitest';
import { buildOperationalMetricsSnapshot } from '@/lib/admin/operational-metrics';

describe('operational metrics', () => {
  it('builds seven charter panels from sampled operational rows', () => {
    const snapshot = buildOperationalMetricsSnapshot({
      now: new Date('2026-05-06T00:00:00.000Z'),
      toolRuns: [
        { status: 'completed', durationMs: 1000, contextHealth: 80, ontologyId: 'conflict' },
        { status: 'failed', durationMs: 5000, contextHealth: 40, ontologyId: 'conflict', firewallStatus: 'warn' },
      ],
      marketplaceArtifacts: [{ status: 'completed', contextHealth: 70, ontologyId: 'mediation' }],
      jobs: [],
      agentRuns: [{ status: 'running' }],
      ingestions: [{ status: 'pending_review', durationMs: 2000 }],
      events: [{ status: 429, type: 'rate_limit' }, { status: 401, type: 'auth' }],
      credits: [{ amount: -3, createdAt: '2026-05-05T23:00:00.000Z' }],
    });

    expect(snapshot.schemaVersion).toBe('operational-metrics-v1');
    expect(snapshot.panels).toHaveLength(7);
    expect(snapshot.aggregates.toolRuns.failed).toBe(1);
    expect(snapshot.aggregates.contextHealth.lowCount).toBe(1);
    expect(snapshot.aggregates.cost.creditsBurn24h).toBe(3);
    expect(snapshot.panels.find((panel) => panel.id === 'auth-abuse')?.status).toBe('degraded');
  });
});
