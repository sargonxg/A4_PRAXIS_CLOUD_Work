type StatusRow = { status?: string; durationMs?: number; contextHealth?: number; ontologyId?: string; firewallStatus?: string };

export function buildOperationalMetricsSnapshot(input: {
  now: Date;
  toolRuns: StatusRow[];
  marketplaceArtifacts: StatusRow[];
  jobs: StatusRow[];
  agentRuns: StatusRow[];
  ingestions: StatusRow[];
  events: Array<{ status?: number; type?: string }>;
  credits: Array<{ amount?: number; createdAt?: string }>;
}) {
  const failed = input.toolRuns.filter((row) => row.status === 'failed').length;
  const lowCount = [...input.toolRuns, ...input.marketplaceArtifacts].filter((row) => typeof row.contextHealth === 'number' && row.contextHealth < 50).length;
  const creditsBurn24h = input.credits.reduce((sum, row) => sum + Math.abs(Math.min(0, row.amount ?? 0)), 0);
  const authDegraded = input.events.some((event) => event.status === 401 || event.status === 429);
  return {
    schemaVersion: 'operational-metrics-v1',
    generatedAt: input.now.toISOString(),
    aggregates: {
      toolRuns: { total: input.toolRuns.length, failed },
      contextHealth: { lowCount },
      cost: { creditsBurn24h },
    },
    panels: [
      { id: 'tool-runs', status: failed ? 'degraded' : 'ok' },
      { id: 'context-health', status: lowCount ? 'degraded' : 'ok' },
      { id: 'marketplace', status: 'ok' },
      { id: 'jobs', status: 'ok' },
      { id: 'agents', status: input.agentRuns.length ? 'active' : 'ok' },
      { id: 'ingestion', status: input.ingestions.length ? 'active' : 'ok' },
      { id: 'auth-abuse', status: authDegraded ? 'degraded' : 'ok' },
    ],
  };
}
