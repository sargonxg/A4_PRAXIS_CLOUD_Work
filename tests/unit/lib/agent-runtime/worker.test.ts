import { describe, expect, it } from 'vitest';
import { executeNoopAgentRun, type ExecuteAgentRunPayload } from '@/lib/agent-runtime/worker';
import type { AgentRun } from '@/lib/agent-runtime/types';

const payload: ExecuteAgentRunPayload = {
  runId: 'run-1',
  ownerUid: 'user-1',
  capsuleId: 'cap-1',
  traceId: 'trace-1',
  dispatchId: 'dispatch-1',
  attempt: 1,
  requestedAt: '2026-05-15T12:00:00.000Z',
};

function makeRun(status: AgentRun['status']): AgentRun {
  return {
    id: payload.runId,
    agentSpecId: null,
    ownerUid: payload.ownerUid,
    capsuleId: payload.capsuleId,
    contextStackId: 'default',
    contextPackageId: null,
    selectedCoreIds: {
      userCoreId: null,
      teamCoreId: null,
      situationCoreId: null,
      pathCoreId: null,
      sourceCoreIds: [],
      documentCoreIds: [],
      graphCoreId: null,
      timeCoreId: null,
      outputCoreIds: [],
      toolCoreIds: [],
      objectiveCoreIds: [],
      productCoreIds: [],
      memoryCoreId: null,
    },
    status,
    triggerType: 'manual',
    objective: 'No-op run',
    traceId: payload.traceId,
    parentRunId: null,
    idempotencyKey: 'idem-1',
    maxStep: 20,
    maxSessionMinutes: 30,
    internalEstimatedCostCents: null,
    internalSpendCents: 0,
    metadata: {},
    createdAt: '2026-05-15T12:00:00.000Z',
    updatedAt: '2026-05-15T12:00:00.000Z',
    queuedAt: '2026-05-15T12:00:00.000Z',
    startedAt: null,
    completedAt: null,
    expiresAt: null,
  };
}

describe('agent runtime no-op worker', () => {
  it('runs queued dispatch through running and succeeded', async () => {
    const transitions: AgentRun['status'][] = [];
    const result = await executeNoopAgentRun(payload, {
      getRun: async () => makeRun('queued'),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus);
      },
      appendEvent: async (event) => event,
    });

    expect(transitions).toEqual(['running', 'succeeded']);
    expect(result).toMatchObject({ runId: 'run-1', status: 'succeeded', executionMode: 'noop' });
  });

  it('treats repeated terminal execution as idempotent', async () => {
    const transitions: AgentRun['status'][] = [];
    const result = await executeNoopAgentRun(payload, {
      getRun: async () => makeRun('succeeded'),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus);
      },
      appendEvent: async (event) => event,
    });

    expect(transitions).toEqual([]);
    expect(result).toMatchObject({ status: 'succeeded', idempotent: true });
  });

  it('marks a running worker failure as failed', async () => {
    const transitions: AgentRun['status'][] = [];

    await expect(executeNoopAgentRun(payload, {
      getRun: async () => makeRun('queued'),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus);
      },
      appendEvent: async (event) => event,
      runNoopStep: async () => {
        throw new Error('synthetic worker failure');
      },
    })).rejects.toThrow('Agent run execution failed');

    expect(transitions).toEqual(['running', 'failed']);
  });
});
