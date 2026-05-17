export type RuntimeHealthStatus = 'ok' | 'degraded' | 'down' | 'unconfigured';

export type RuntimeHealthCheck = {
  id: string;
  label: string;
  status: RuntimeHealthStatus;
  latencyMs?: number;
  detail?: string;
  endpoint?: string;
  repairAction?: string;
};

export type RuntimeHealthSummary = {
  status: Exclude<RuntimeHealthStatus, 'unconfigured'>;
  summary: string;
  checkedAt: string;
  debugHref: '/app/settings?tab=system';
  checks: RuntimeHealthCheck[];
};

const CRITICAL_CHECK_IDS = new Set(['frontend', 'firestore', 'backend', 'database']);

export function buildRuntimeHealthSummary(
  checks: RuntimeHealthCheck[],
  checkedAt: Date = new Date(),
): RuntimeHealthSummary {
  const criticalChecks = checks.filter((check) => CRITICAL_CHECK_IDS.has(check.id));
  const criticalDown = criticalChecks.some((check) => check.status === 'down');
  const anyDown = checks.some((check) => check.status === 'down');
  const anyDegraded = checks.some((check) => check.status === 'degraded');
  const status = criticalDown
    ? checks.some((check) => check.id === 'firestore' && check.status === 'down') ? 'down' : 'degraded'
    : anyDown || anyDegraded ? 'degraded' : 'ok';

  return {
    status,
    summary: status === 'ok' ? 'Systems ready' : status === 'degraded' ? 'Some systems degraded' : 'Systems down',
    checkedAt: checkedAt.toISOString(),
    debugHref: '/app/settings?tab=system',
    checks,
  };
}

export function sanitizeRuntimeHealth(report: RuntimeHealthSummary): RuntimeHealthSummary {
  return {
    ...report,
    checks: report.checks.map((check) => ({
      id: check.id,
      label: check.label,
      status: check.status,
      latencyMs: check.latencyMs,
    })),
  };
}

export async function collectRuntimeHealth(): Promise<RuntimeHealthSummary> {
  const startedAt = Date.now();
  const checks: RuntimeHealthCheck[] = [
    { id: 'frontend', label: 'Frontend runtime', status: 'ok', latencyMs: 0 },
    {
      id: 'firestore',
      label: 'Firestore',
      status: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'ok' : 'degraded',
      repairAction: 'Configure Firebase Admin credentials for production persistence.',
    },
    {
      id: 'backend',
      label: 'Private backend',
      status: process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL ? 'ok' : 'unconfigured',
      endpoint: process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL,
      repairAction: 'Set NEXT_PUBLIC_PRAXIS_BACKEND_URL when the private backend is required.',
    },
    {
      id: 'database',
      label: 'Backend checkpoint store',
      status: process.env.AGENT_RUNTIME_DATABASE_URL || process.env.PRAXIS_DATABASE_URL || process.env.DATABASE_URL ? 'ok' : 'unconfigured',
      repairAction: 'Set an agent runtime database URL for durable queued-agent ledgers.',
    },
    {
      id: 'agent_platform',
      label: 'Vertex ADK',
      status: process.env.GOOGLE_VERTEX_PROJECT ? 'ok' : 'unconfigured',
      repairAction: 'Configure Vertex project and ADK worker credentials for queued agent execution.',
    },
  ];

  checks[0] = { ...checks[0], latencyMs: Date.now() - startedAt };
  return buildRuntimeHealthSummary(checks);
}
