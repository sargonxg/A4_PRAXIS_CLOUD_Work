import { makeAgentRunEvent, normalizePointer } from '@/lib/agent-runtime/state';
import { appendAgentRunEvent, getAgentRun } from '@/lib/agent-runtime/postgres';
import { publishPraxisEvent } from '@/lib/events/praxis-events';

type CloudTasksClientLike = {
  createTask(input: { parent: string; task: AgentRunTask }): Promise<[{ name?: string | null }, ...unknown[]]>;
};

let tasksClient: CloudTasksClientLike | null = null;

export type AgentRunDispatchPayload = {
  runId: string;
  ownerUid: string;
  capsuleId: string;
  traceId: string;
  dispatchId: string;
  attempt: number;
  requestedAt: string;
};

export type AgentRunDispatchResult = {
  mode: 'cloud-tasks';
  queuePath: string;
  taskName: string | null;
  targetUrl: string;
  payload: AgentRunDispatchPayload;
};

export function makeAgentRunDispatchPayload(input: {
  runId: string;
  ownerUid: string;
  capsuleId: string;
  traceId: string;
  dispatchId?: string;
  attempt?: number;
  requestedAt?: Date;
}): AgentRunDispatchPayload {
  return {
    runId: normalizePointer(input.runId, 'run'),
    ownerUid: input.ownerUid.trim(),
    capsuleId: normalizePointer(input.capsuleId, 'default'),
    traceId: input.traceId.trim(),
    dispatchId: input.dispatchId?.trim() || cryptoRandomDispatchId(input.runId, input.traceId),
    attempt: Math.max(1, Math.floor(input.attempt ?? 1)),
    requestedAt: (input.requestedAt ?? new Date()).toISOString(),
  };
}

export function getAgentRunTasksQueuePath(): string {
  const project = process.env.AGENT_RUN_TASKS_PROJECT
    || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.GCLOUD_PROJECT
    || 'praxisbytacitus';
  const location = process.env.AGENT_RUN_TASKS_LOCATION
    || process.env.GOOGLE_CLOUD_LOCATION
    || process.env.GCP_REGION
    || 'us-central1';
  const queue = process.env.AGENT_RUN_TASKS_QUEUE || 'agent-runs';
  return `projects/${project}/locations/${location}/queues/${queue}`;
}

export function getAgentRunExecuteUrl(runId: string): string {
  const configured = process.env.AGENT_RUN_WORKER_BASE_URL
    || process.env.NEXT_PUBLIC_APP_URL
    || process.env.APP_URL
    || process.env.VERCEL_PROJECT_PRODUCTION_URL
    || '';
  const base = configured.startsWith('http') ? configured : configured ? `https://${configured}` : '';
  if (!base) {
    throw new Error('Agent run dispatch is not configured: set AGENT_RUN_WORKER_BASE_URL or APP_URL for the worker route.');
  }
  return `${base.replace(/\/+$/, '')}/api/agents/runs/${encodeURIComponent(runId)}/execute`;
}

export function buildAgentRunTask(input: {
  payload: AgentRunDispatchPayload;
  targetUrl: string;
  serviceAccountEmail?: string | null;
  audience?: string | null;
}): AgentRunTask {
  const body = Buffer.from(JSON.stringify(input.payload)).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    'X-PRAXIS-Agent-Run': input.payload.runId,
    'X-PRAXIS-Trace-Id': input.payload.traceId,
  };
  const httpRequest: AgentRunTask['httpRequest'] = {
    httpMethod: 'POST',
    url: input.targetUrl,
    headers,
    body,
  };
  if (input.serviceAccountEmail) {
    httpRequest.oidcToken = {
      serviceAccountEmail: input.serviceAccountEmail,
      audience: input.audience || input.targetUrl,
    };
  }
  return { httpRequest };
}

export async function enqueueAgentRunDispatch(input: {
  ownerUid: string;
  runId: string;
  attempt?: number;
}): Promise<AgentRunDispatchResult> {
  const run = await getAgentRun(input.ownerUid, input.runId);
  if (!run) {
    throw new Error('Agent run not found for dispatch.');
  }
  if (run.status !== 'queued') {
    throw new Error(`Agent run dispatch requires queued status, received ${run.status}.`);
  }

  const payload = makeAgentRunDispatchPayload({
    runId: run.id,
    ownerUid: run.ownerUid,
    capsuleId: run.capsuleId,
    traceId: run.traceId,
    attempt: input.attempt,
  });
  const queuePath = getAgentRunTasksQueuePath();
  const targetUrl = getAgentRunExecuteUrl(run.id);
  const task = buildAgentRunTask({
    payload,
    targetUrl,
    serviceAccountEmail: process.env.AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL || null,
    audience: process.env.AGENT_RUN_WORKER_OIDC_AUDIENCE || targetUrl,
  });

  const client = await getCloudTasksClient();
  const [created] = await client.createTask({ parent: queuePath, task });

  await appendAgentRunEvent(makeAgentRunEvent({
    runId: run.id,
    ownerUid: run.ownerUid,
    capsuleId: run.capsuleId,
    eventType: 'dispatch_enqueued',
    message: 'Agent run dispatch task enqueued.',
    data: {
      mode: 'cloud-tasks',
      queuePath,
      taskName: created.name ?? null,
      targetUrl,
      dispatchId: payload.dispatchId,
      attempt: payload.attempt,
    },
    traceId: run.traceId,
  }));
  void publishPraxisEvent({
    eventType: 'agent_run.dispatched',
    ownerUid: run.ownerUid,
    capsuleId: run.capsuleId,
    runId: run.id,
    traceId: run.traceId,
    source: 'agent',
    data: {
      mode: 'cloud-tasks',
      queuePath,
      taskName: created.name ?? null,
      targetUrl,
      dispatchId: payload.dispatchId,
      attempt: payload.attempt,
    },
  });

  return {
    mode: 'cloud-tasks',
    queuePath,
    taskName: created.name ?? null,
    targetUrl,
    payload,
  };
}

type AgentRunTask = {
  httpRequest: {
    httpMethod: 'POST';
    url: string;
    headers: Record<string, string>;
    body: string;
    oidcToken?: {
      serviceAccountEmail: string;
      audience: string;
    };
  };
};

async function getCloudTasksClient(): Promise<CloudTasksClientLike> {
  if (!tasksClient) {
    const { CloudTasksClient } = await import('@google-cloud/tasks');
    tasksClient = new CloudTasksClient() as unknown as CloudTasksClientLike;
  }
  return tasksClient!;
}

function cryptoRandomDispatchId(runId: string, traceId: string): string {
  const seed = `${normalizePointer(runId, 'run')}:${traceId}:${Date.now()}:${Math.random()}`;
  return `dispatch_${Buffer.from(seed).toString('base64url').slice(0, 32)}`;
}
