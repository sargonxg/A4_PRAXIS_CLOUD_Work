import { describe, expect, it } from 'vitest';
import { executeAgentRun, executeNoopAgentRun, type ExecuteAgentRunPayload } from '@/lib/agent-runtime/worker';
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

function makeRun(status: AgentRun['status'], metadata: Record<string, unknown> = {}): AgentRun {
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
      situationCoreId: 'sit-1',
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
    metadata,
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

  it('routes research-memo runs into memo and output capsule receipts', async () => {
    const transitions: AgentRun['status'][] = [];
    const mirrored: string[] = [];
    const toolCalls: string[] = [];
    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId: 'research-memo' }),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus, { policyAgentId: 'research-memo' });
      },
      appendToolCall: async (toolCall) => {
        toolCalls.push(`${toolCall.toolId}:${toolCall.status}`);
        return toolCall;
      },
      appendApproval: async (approval) => approval,
      buildEvidencePack: async () => ({
        packId: 'evidence-1',
        ownerUid: 'user-1',
        capsuleId: 'cap-1',
        objective: 'No-op run',
        builtAt: '2026-05-15T12:00:00.000Z',
        activeCapsule: { capsuleId: 'cap-1', version: 1 } as never,
        knowledgeDocuments: [{ documentId: 'doc-1', title: 'Doc' } as never],
        sourceReceiptIds: ['src-1'],
        sourcedParagraphs: [{
          id: 'para-1',
          documentId: 'doc-1',
          chunkId: 'chunk-1',
          sourceReceiptId: 'src-1',
          pageRef: 'p.1',
          paragraphRef: 'para-1',
          charStart: 0,
          charEnd: 20,
          excerpt: 'Evidence paragraph.',
          score: 0.8,
          confidence: 0.8,
          citationLabel: '[D1:p.1]',
        }],
        documentDigests: [],
        outputHistory: [],
        memories: [],
        openGaps: ['Time Core is unset; freshness assumptions need review.'],
        receipts: {
          sourcesUsed: 1,
          paragraphsUsed: 1,
          unsupportedGaps: ['Time Core is unset; freshness assumptions need review.'],
          outputHistoryCount: 0,
          memoryCount: 0,
        },
      }),
      appendEvent: async (event) => {
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      saveMemoDraft: async (_uid, input) => {
        expect(input.templateId).toBe('policy-memo');
        expect(input.blocks.some((block) => block.id === 'source-receipt')).toBe(true);
        expect(input.blocks.some((block) => block.id === 'sourced-paragraphs')).toBe(true);
        expect(input.blocks.some((block) => block.id === 'gap-receipt')).toBe(true);
        return { memo: { id: 'memo-1' } };
      },
      saveOutputCapsule: async (_uid, input) => {
        expect(input.templateId).toBe('options-memo');
        expect(input.citations).toHaveLength(1);
        expect(input.gaps).toHaveLength(1);
        return { id: 'output-1' };
      },
    });

    expect(transitions).toEqual(['running', 'succeeded']);
    expect(result).toMatchObject({
      status: 'succeeded',
      executionMode: 'research-memo',
      memoId: 'memo-1',
      outputCapsuleId: 'output-1',
      outputHref: '/app?panel=memo&memoId=memo-1&outputCapsuleId=output-1',
    });
    expect(toolCalls).toContain('capsule-evidence-pack:succeeded');
    expect(toolCalls).toContain('policy-memo:succeeded');
    expect(toolCalls).toContain('output-capsule-save:succeeded');
    expect(mirrored).toContain('context_resolved');
    expect(mirrored).toContain('reasoning.plan');
    expect(mirrored).toContain('reasoning.act');
    expect(mirrored).toContain('reasoning.reflect');
    expect(mirrored).toContain('reasoning.complete');
    expect(mirrored).toContain('memo_output_created');
  });

  it('routes output-formatter runs into an export-ready memo draft', async () => {
    const transitions: AgentRun['status'][] = [];
    const mirrored: string[] = [];
    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId: 'output-formatter' }),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus, { policyAgentId: 'output-formatter' });
      },
      appendEvent: async (event) => {
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      saveMemoDraft: async (_uid, input) => {
        expect(input.templateId).toBe('policy-memo');
        expect(input.blocks.some((block) => block.id === 'structure')).toBe(true);
        expect(input.blocks.some((block) => block.id === 'export-readiness')).toBe(true);
        return { memo: { id: 'memo-format-1' } };
      },
    });

    expect(transitions).toEqual(['running', 'succeeded']);
    expect(result).toMatchObject({ status: 'succeeded', executionMode: 'output-formatter', memoId: 'memo-format-1', outputHref: '/app?panel=memo&memoId=memo-format-1' });
    expect(mirrored).toContain('formatted_output_created');
  });

  it('routes sourceability, red-team, and handover agents into reviewable receipts', async () => {
    for (const policyAgentId of ['sourceability-reviewer', 'red-team-analyst', 'handover-builder'] as const) {
      const transitions: AgentRun['status'][] = [];
      const toolCalls: string[] = [];
      const mirrored: string[] = [];
      const result = await executeAgentRun(payload, {
        getRun: async () => makeRun('queued', { policyAgentId }),
        updateStatus: async (input) => {
          transitions.push(input.toStatus);
          return makeRun(input.toStatus, { policyAgentId });
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
          expect(input.blocks.some((block) => block.id === 'receipt')).toBe(true);
          return { memo: { id: `memo-${policyAgentId}` } };
        },
      });

      expect(transitions).toEqual(['running', 'succeeded']);
      expect(result.status).toBe('succeeded');
      expect(result.executionMode).toBe(policyAgentId);
      expect(toolCalls.length).toBe(1);
      expect(mirrored).toContain(`${policyAgentId}_receipt_created`);
    }
  });
});
