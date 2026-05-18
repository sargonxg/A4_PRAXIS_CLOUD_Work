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

const CRITICAL_CHECK_IDS = new Set(['frontend', 'firestore', 'backend', 'database', 'agent_ledger', 'agent_queue']);

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
    summary: redactPublicRuntimeString(report.summary),
    checks: report.checks.map((check) => ({
      id: redactPublicRuntimeString(check.id),
      label: redactPublicRuntimeString(check.label),
      status: check.status,
      latencyMs: check.latencyMs,
    })),
  };
}

export async function collectRuntimeHealth(): Promise<RuntimeHealthSummary> {
  const startedAt = Date.now();
  const queueCheck = await checkAgentTaskQueue();
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
      id: 'agent_ledger',
      label: 'Deep work queue',
      status: process.env.AGENT_RUNTIME_DATABASE_URL || process.env.PRAXIS_DATABASE_URL || process.env.DATABASE_URL ? 'ok' : 'unconfigured',
      repairAction: 'Set an agent runtime database URL for durable queued-agent ledgers.',
    },
    queueCheck,
    {
      id: 'agent_platform',
      label: 'Agent platform',
      status: process.env.GOOGLE_VERTEX_PROJECT ? 'ok' : 'unconfigured',
      repairAction: 'Configure Vertex project and ADK worker credentials for queued agent execution.',
    },
  ];

  checks[0] = { ...checks[0], latencyMs: Date.now() - startedAt };
  return buildRuntimeHealthSummary(checks);
}

async function checkAgentTaskQueue(): Promise<RuntimeHealthCheck> {
  const project = process.env.AGENT_RUN_TASKS_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.GCLOUD_PROJECT
    || 'praxisbytacitus';
  const location = process.env.AGENT_RUN_TASKS_LOCATION
    || process.env.GOOGLE_CLOUD_LOCATION
    || process.env.GCP_REGION
    || 'us-central1';
  const queue = process.env.AGENT_RUN_TASKS_QUEUE || 'agent-runs';
  const queuePath = `projects/${project}/locations/${location}/queues/${queue}`;
  const startedAt = Date.now();

  try {
    const { CloudTasksClient } = await import('@google-cloud/tasks');
    const client = new CloudTasksClient();
    await client.getQueue({ name: queuePath });
    return {
      id: 'agent_queue',
      label: 'Agent task queue',
      status: 'ok',
      latencyMs: Date.now() - startedAt,
      detail: queuePath,
    };
  } catch (error) {
    const restCheck = await checkAgentTaskQueueViaMetadata(queuePath, startedAt);
    if (restCheck) return restCheck;

    return {
      id: 'agent_queue',
      label: 'Agent task queue',
      status: 'down',
      latencyMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : String(error),
      repairAction: `Create or grant access to ${queuePath}.`,
    };
  }
}

async function checkAgentTaskQueueViaMetadata(queuePath: string, startedAt: number): Promise<RuntimeHealthCheck | null> {
  try {
    const tokenResponse = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
      headers: { 'Metadata-Flavor': 'Google' },
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });
    if (!tokenResponse.ok) return null;
    const tokenPayload = await tokenResponse.json() as { access_token?: string };
    if (!tokenPayload.access_token) return null;
    const queueResponse = await fetch(`https://cloudtasks.googleapis.com/v2/${queuePath}`, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    });
    if (!queueResponse.ok) return null;
    return {
      id: 'agent_queue',
      label: 'Agent task queue',
      status: 'ok',
      latencyMs: Date.now() - startedAt,
      detail: queuePath,
    };
  } catch {
    return null;
  }
}

function redactPublicRuntimeString(value: string): string {
  return value
    .replace(/https?:\/\/[^\s"')]+/gi, '[redacted-url]')
    .replace(/[A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL|SERVICE_ACCOUNT)[A-Z0-9_]*/gi, '[redacted-env]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]*gserviceaccount\.com/gi, '[redacted-service-account]')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/gi, '[redacted-secret]')
    .replace(/\b(stack\s+trace|traceback|exception)\b/gi, '[redacted-runtime-detail]')
    .replace(/\b[a-z0-9-]+\.run\.app\b/gi, '[redacted-url]');
}
