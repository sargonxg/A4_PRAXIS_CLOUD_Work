import { describe, expect, it } from 'vitest';
import { AgentWorkerError, executeAgentRun, type ExecuteAgentRunPayload } from '@/lib/agent-runtime/worker';
import type { AgentRun } from '@/lib/agent-runtime/types';
import type { BoardroomOutput } from '@/lib/boardroom/schema';

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
    const liveRunnerCalls: string[] = [];

    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued'),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus);
      },
      buildEvidencePack: async (input) => {
        expect(input).toMatchObject({
          ownerUid: 'user-1',
          capsuleId: 'cap-1',
          objective: 'Should the board approve the operating posture?',
        });
        return makeEvidencePack();
      },
      runBoardroomDiscussion: async (input) => {
        liveRunnerCalls.push(input.run.id);
        expect(input.evidencePack.packId).toBe('pack-boardroom-1');
        expect(input.payload.dispatchId).toBe('dispatch-boardroom-1');
        return makeBoardroomOutput();
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
    expect(liveRunnerCalls).toEqual(['run-boardroom-1']);
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
      'capsule.read_receipt_created',
      'sourceability.ledger_created',
      'boardroom.brief_created',
      'boardroom.turn.legal',
      'boardroom.turn.security',
      'boardroom.synthesis_created',
      'boardroom.artifact_created',
    ]));
  });

  it('streams boardroom turn and synthesis events from the live runner callbacks', async () => {
    const phases: string[] = [];
    const output = makeBoardroomOutput();

    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued'),
      updateStatus: async (input) => makeRun(input.toStatus),
      buildEvidencePack: async () => makeEvidencePack(),
      runBoardroomDiscussion: async (input) => {
        await input.onTurn?.({
          turn: output.transcript[0],
          participantId: output.transcript[0].participantId,
          participant: {
            id: 'legal',
            label: 'Legal Analyst',
            lens: 'Authority',
            role: 'reviewer',
            rolePrompt: 'Checks mandate and defensibility.',
            critic: false,
          },
          round: output.transcript[0].round,
          rejectedEvidenceRefs: [],
        });
        await input.onSynthesis?.({ output });
        return output;
      },
      appendToolCall: async (toolCall) => toolCall,
      appendEvent: async (event) => {
        phases.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      saveMemoDraft: async () => ({ memo: { id: 'memo-boardroom-1' } }),
      saveOutputCapsule: async () => ({ id: 'output-boardroom-1' }),
    });

    expect(result.status).toBe('succeeded');
    expect(phases.filter((phase) => phase === 'boardroom.turn.legal')).toHaveLength(1);
    expect(phases.indexOf('boardroom.turn.legal')).toBeGreaterThan(-1);
    expect(phases.indexOf('boardroom.synthesis_created')).toBeGreaterThan(phases.indexOf('boardroom.turn.legal'));
    expect(phases.filter((phase) => phase.startsWith('boardroom.turn.'))).toEqual(['boardroom.turn.legal']);
  });

  it('fails the AgentRun visibly when the live boardroom runner fails', async () => {
    const transitions: Array<{ status: AgentRun['status']; data: Record<string, unknown> | undefined }> = [];

    try {
      await executeAgentRun(payload, {
        getRun: async () => makeRun('queued'),
        updateStatus: async (input) => {
          transitions.push({ status: input.toStatus, data: input.data });
          return makeRun(input.toStatus);
        },
        appendEvent: async (event) => event,
        appendToolCall: async (toolCall) => toolCall,
        buildEvidencePack: async () => makeEvidencePack(),
        runBoardroomDiscussion: async () => {
          throw new Error('live model unavailable api_key=secret');
        },
      });
      throw new Error('expected boardroom worker to fail');
    } catch (err) {
      expect(err).toBeInstanceOf(AgentWorkerError);
      expect((err as AgentWorkerError).diagnostic).toMatchObject({
        executionMode: 'boardroom-discussion',
        failedPhase: 'boardroom-live-discussion',
        runId: 'run-boardroom-1',
      });
    }

    const failed = transitions.find((event) => event.status === 'failed');
    expect(failed?.data?.failure).toMatchObject({
      executionMode: 'boardroom-discussion',
      failedPhase: 'boardroom-live-discussion',
    });
    expect(JSON.stringify(failed?.data)).not.toContain('api_key=secret');
  });
});

function makeBoardroomOutput(): BoardroomOutput {
  return {
    meetingBrief: 'Boardroom brief for cap-1.',
    agenda: ['Context brief', 'Participant turns', 'Chair synthesis'],
    roster: [
      { participantId: 'synthesis-chair', label: 'Synthesis Chair', lens: 'Chair' },
      { participantId: 'legal', label: 'Legal Analyst', lens: 'Authority' },
      { participantId: 'security', label: 'Security/Risk Analyst', lens: 'Risk' },
    ],
    transcript: [
      {
        turnId: 'run-boardroom-1:r1:legal',
        round: 1,
        participantId: 'legal',
        state: 'speaking',
        claim: 'The posture needs a legal review gate.',
        evidenceRefs: ['receipt-1'],
        confidence: 'medium',
        recommendation: 'Keep authorization constraints visible.',
      },
      {
        turnId: 'run-boardroom-1:r1:security',
        round: 1,
        participantId: 'security',
        state: 'speaking',
        claim: 'The posture needs risk sequencing.',
        evidenceRefs: ['document:doc-1'],
        confidence: 'medium',
        recommendation: 'Stage the decision with monitoring triggers.',
      },
    ],
    topicClusters: [{ topic: 'Decision posture', mentions: 2, participantIds: ['legal', 'security'] }],
    consensus: ['Proceed only with review gates attached.'],
    divergences: ['Legal wants authorization first; security wants phased execution.'],
    risks: ['Source coverage still needs human review.'],
    openQuestions: ['Who signs off on the final pack?'],
    evidenceStats: { sourceCount: 1, documentCount: 1, sourcedParagraphCount: 1, unsupportedClaimCount: 0 },
    confidenceDistribution: { high: 0, medium: 2, low: 0 },
    nextActions: [{ action: 'Review the board pack.', owner: 'chair', urgency: 'short-term' }],
    finalSynthesis: 'Proceed with a reviewable board pack and preserve dissent.',
  };
}

function makeEvidencePack() {
  return {
    packId: 'pack-boardroom-1',
    ownerUid: 'user-1',
    capsuleId: 'cap-1',
    objective: 'Should the board approve the operating posture?',
    builtAt: '2026-05-24T12:00:00.000Z',
    activeCapsule: {
      capsuleId: 'cap-1',
      label: 'Crisis posture capsule',
      version: 3,
      coreRefs: { sourceCoreIds: ['src-1'], documentCoreIds: ['doc-1'] },
    },
    knowledgeDocuments: [],
    sourceReceiptIds: ['receipt-1'],
    sourcedParagraphs: [{
      id: 'p1',
      documentId: 'doc-1',
      chunkId: 'chunk-1',
      sourceReceiptId: 'receipt-1',
      pageRef: null,
      paragraphRef: 'para-1',
      charStart: 0,
      charEnd: 120,
      excerpt: 'Board wants a decision by Friday.',
      score: 0.8,
      confidence: 0.8,
      citationLabel: '[D1:para-1]',
    }],
    documentDigests: [],
    outputHistory: [],
    memories: [],
    openGaps: [],
    receipts: {
      sourcesUsed: 1,
      paragraphsUsed: 1,
      unsupportedGaps: [],
      outputHistoryCount: 0,
      memoryCount: 0,
    },
  } as never;
}
