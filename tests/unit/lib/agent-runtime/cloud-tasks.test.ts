import { describe, expect, it } from 'vitest';
import {
  buildAgentRunTask,
  getAgentRunTasksCreateUrl,
  getAgentRunTasksQueuePath,
  makeAgentRunDispatchPayload,
} from '@/lib/agent-runtime/cloud-tasks';

describe('agent runtime Cloud Tasks dispatch', () => {
  it('builds a normalized retry-safe dispatch payload', () => {
    const payload = makeAgentRunDispatchPayload({
      runId: ' run/one ',
      ownerUid: 'user-1',
      capsuleId: 'cap?one',
      traceId: 'trace-1',
      dispatchId: 'dispatch-1',
      attempt: 0,
      requestedAt: new Date('2026-05-15T12:00:00.000Z'),
    });

    expect(payload).toEqual({
      runId: 'run/one',
      ownerUid: 'user-1',
      capsuleId: 'cap-one',
      traceId: 'trace-1',
      dispatchId: 'dispatch-1',
      attempt: 1,
      requestedAt: '2026-05-15T12:00:00.000Z',
    });
  });

  it('uses the canonical agent-runs queue by default', () => {
    expect(getAgentRunTasksQueuePath()).toBe('projects/praxisbytacitus/locations/us-central1/queues/agent-runs');
  });

  it('targets the Cloud Tasks REST create endpoint without the Node client package', () => {
    expect(getAgentRunTasksCreateUrl('projects/p/locations/l/queues/q')).toBe(
      'https://cloudtasks.googleapis.com/v2/projects/p/locations/l/queues/q/tasks',
    );
  });

  it('creates an HTTP task with OIDC and base64 JSON payload', () => {
    const payload = makeAgentRunDispatchPayload({
      runId: 'run-1',
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      traceId: 'trace-1',
      dispatchId: 'dispatch-1',
      requestedAt: new Date('2026-05-15T12:00:00.000Z'),
    });
    const task = buildAgentRunTask({
      payload,
      targetUrl: 'https://praxis.tacitus.me/api/agents/runs/run-1/execute',
      serviceAccountEmail: 'praxis-agent-worker@praxisbytacitus.iam.gserviceaccount.com',
      audience: 'https://praxis.tacitus.me/api/agents/runs/run-1/execute',
    });

    expect(task.httpRequest?.url).toBe('https://praxis.tacitus.me/api/agents/runs/run-1/execute');
    expect(task.httpRequest?.headers?.['X-PRAXIS-Agent-Run']).toBe('run-1');
    expect(task.httpRequest?.oidcToken?.serviceAccountEmail).toBe('praxis-agent-worker@praxisbytacitus.iam.gserviceaccount.com');
    const decoded = JSON.parse(Buffer.from(String(task.httpRequest?.body), 'base64').toString('utf8'));
    expect(decoded).toMatchObject({ runId: 'run-1', dispatchId: 'dispatch-1' });
  });
});
