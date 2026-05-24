import { describe, expect, it } from 'vitest';
import { executeAgentRun, type ExecuteAgentRunPayload } from '@/lib/agent-runtime/worker';
import type { AgentRun } from '@/lib/agent-runtime/types';

const payload: ExecuteAgentRunPayload = {
  runId: 'run-boardroom-1',
  ownerUid: 'user-1',
  capsuleId: 'cap-1',
  traceId: 'trace-boardroom-1',
  dispatchId: 'dispatch-boardroom-1',
  attempt: 1,
  requestedAt: '2026-05-24T12:00:00.000Z',
};

function makeRun(status: AgentRun['status'], metadata: Record<string, unknown> = {}): AgentRun {
  return {
    id: payload.runId,
    agentSpecId: null,
    ownerUid: payload.ownerUid,
    capsuleId: payload.capsuleId,
    contextStackId: 'default',
    contextPackageId: null,
    selectedCoreIds: {
      userCoreId: 'user-core',
      teamCoreId: null,
      situationCoreId: 'sit-1',
      pathCoreId: null,
      sourceCoreIds: ['src-1'],
      documentCoreIds: ['doc-1'],
      graphCoreId: null,
      timeCoreId: null,
      outputCoreIds: ['board-executive-pack'],
      toolCoreIds: [],
      objectiveCoreIds: [],
      productCoreIds: [],
      memoryCoreId: null,
    },
    status,
    triggerType: 'manual',
    objective: 'Should the board approve the operating posture?',
    traceId: payload.traceId,
    parentRunId: null,
    idempotencyKey: 'boardroom:test',
    maxStep: 24,
    maxSessionMinutes: 45,
    internalEstimatedCostCents: null,
    internalSpendCents: 0,
    metadata: {
      policyAgentId: 'boardroom-discussion',
      outputDestination: 'library',
      selectedToolIds: ['context-resolve', 'boardroom-deliberation', 'board-executive-pack'],
      boardroomSpec: {
        question: 'Should the board approve the operating posture?',
        directContext: 'Board wants a decision by Friday.',
        participantIds: ['synthesis-chair', 'legal', 'security'],
        selectedDocumentIds: ['doc-1'],
        maxRounds: 2,
        outputTarget: 'board_executive_pack',
      },
      ...metadata,
    },
    createdAt: '2026-05-24T12:00:00.000Z',
    updatedAt: '2026-05-24T12:00:00.000Z',
    queuedAt: '2026-05-24T12:00:00.000Z',
    startedAt: null,
    completedAt: null,
    expiresAt: null,
  };
}

describe('boardroom-discussion worker', () => {
  it('runs sequential participant turns and persists a board-executive artifact', async () => {
    const transitions: AgentRun['status'][] = [];
    const toolCalls: string[] = [];
    const mirrored: string[] = [];

    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued'),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus);
      },
      appendToolCall: async (toolCall) => {
        toolCalls.push(`${toolCall.toolId}:${toolCall.status}`);
        return toolCall;
      },
      appendEvent: async (event) => {
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      saveMemoDraft: async (_uid, input) => {
        expect(input.title).toContain('Boardroom pack');
        expect(input.blocks.some((block) => block.id === 'boardroom-transcript')).toBe(true);
        expect(input.blocks.some((block) => block.id === 'boardroom-synthesis')).toBe(true);
        expect(JSON.stringify(input)).not.toMatch(/\bgemini\b|\bclaude\b|\bgpt-\d/i);
        return { memo: { id: 'memo-boardroom-1' } };
      },
      saveOutputCapsule: async (_uid, input) => {
        expect(input.templateId).toBe('board-executive-pack');
        expect(input.payload).toMatchObject({
          title: 'Boardroom pack - Should the board approve the operating posture?',
        });
        return { id: 'output-boardroom-1' };
      },
    });

    expect(transitions).toEqual(['running', 'succeeded']);
    expect(result).toMatchObject({
      runId: 'run-boardroom-1',
      status: 'succeeded',
      executionMode: 'boardroom-discussion',
      memoId: 'memo-boardroom-1',
      outputCapsuleId: 'output-boardroom-1',
      outputHref: '/app/boardroom?runId=run-boardroom-1&memoId=memo-boardroom-1&outputCapsuleId=output-boardroom-1',
    });
    expect(toolCalls).toEqual(expect.arrayContaining([
      'boardroom-deliberation:succeeded',
      'board-executive-pack:succeeded',
      'output-capsule-save:succeeded',
    ]));
    expect(mirrored).toEqual(expect.arrayContaining([
      'context_resolved',
      'boardroom.brief_created',
      'boardroom.turn.legal',
      'boardroom.turn.security',
      'boardroom.synthesis_created',
      'boardroom.artifact_created',
    ]));
  });
});
