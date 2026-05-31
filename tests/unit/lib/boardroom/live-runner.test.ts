import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentRun } from '@/lib/agent-runtime/types';
import type { ExecuteAgentRunPayload } from '@/lib/agent-runtime/worker';
import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';

const generateTextMock = vi.hoisted(() => vi.fn());

vi.mock('ai', () => ({
  Output: {
    object: vi.fn((input) => input),
  },
  generateText: generateTextMock,
}));

vi.mock('@/lib/ai/providers', () => ({
  getProModel: vi.fn(() => 'test-pro-model'),
  hasServerAiProvider: vi.fn(() => true),
}));

describe('runLiveBoardroomDiscussion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateTextMock.mockReset();
  });

  it('emits live turn callbacks and rejects hallucinated evidence refs without substitution', async () => {
    const { runLiveBoardroomDiscussion } = await import('@/lib/boardroom/live-runner');
    const turnOutputs = [
      {
        claim: 'Legal needs the written authorization in the board pack.',
        evidenceRefs: ['receipt-1', 'invented-ref'],
        recommendation: 'Attach the authorization caveat.',
        confidence: 'medium',
      },
      {
        claim: 'Security posture is not sourced strongly enough yet.',
        evidenceRefs: ['made-up-source'],
        critique: 'No valid source receipt supports the operational claim.',
        recommendation: 'Hold confidence low until a receipt is attached.',
        confidence: 'medium',
      },
      {
        consensus: ['Keep authorization and evidence limits visible.'],
        divergences: ['Security confidence remains conditional.'],
        risks: ['A source gap could make the pack overconfident.'],
        openQuestions: ['Who can provide the missing operational receipt?'],
        nextActions: [{ action: 'Attach a valid source receipt.', owner: 'analyst', urgency: 'short-term' }],
        finalSynthesis: 'Proceed only with the weakly sourced security point flagged.',
        topicClusters: [{ topic: 'Evidence posture', mentions: 2, participantIds: ['legal', 'security'] }],
      },
    ];
    generateTextMock.mockImplementation(async () => ({ output: turnOutputs.shift() }));

    const turnEvents: Array<{
      turn: { participantId: string; evidenceRefs: string[]; state: string; confidence: string; unsupportedEvidenceRefs?: string[] };
      rejectedEvidenceRefs: string[];
    }> = [];
    const synthesisEvents: string[] = [];
    const output = await runLiveBoardroomDiscussion({
      run: makeRun(),
      payload,
      evidencePack: makeEvidencePack(),
      onTurn: async (event) => {
        turnEvents.push(event);
      },
      onSynthesis: async (event) => {
        synthesisEvents.push(event.output.finalSynthesis);
      },
    });

    expect(turnEvents.map((event) => event.turn.participantId)).toEqual(['legal', 'security']);
    expect(turnEvents[0].turn.evidenceRefs).toEqual(['receipt-1']);
    expect(turnEvents[0].rejectedEvidenceRefs).toEqual(['invented-ref']);
    expect(turnEvents[0].turn.unsupportedEvidenceRefs).toEqual(['invented-ref']);
    expect(turnEvents[1].turn.evidenceRefs).toEqual([]);
    expect(turnEvents[1].turn.unsupportedEvidenceRefs).toEqual(['made-up-source']);
    expect(turnEvents[1].turn.state).toBe('unsupported');
    expect(turnEvents[1].turn.confidence).toBe('low');
    expect(output.evidenceStats.unsupportedClaimCount).toBe(1);
    expect(synthesisEvents).toEqual(['Proceed only with the weakly sourced security point flagged.']);
    expect(JSON.stringify(output.transcript)).not.toContain('document:doc-1');
  });
});

const payload: ExecuteAgentRunPayload = {
  runId: 'run-boardroom-live',
  ownerUid: 'user-1',
  capsuleId: 'cap-1',
  traceId: 'trace-live',
  dispatchId: 'dispatch-live',
  attempt: 1,
  requestedAt: '2026-05-31T12:00:00.000Z',
};

function makeRun(): AgentRun {
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
      situationCoreId: null,
      pathCoreId: null,
      sourceCoreIds: [],
      documentCoreIds: ['doc-1'],
      graphCoreId: null,
      timeCoreId: null,
      outputCoreIds: [],
      toolCoreIds: [],
      objectiveCoreIds: [],
      productCoreIds: [],
      memoryCoreId: null,
    },
    status: 'running',
    triggerType: 'manual',
    objective: 'Should the board approve the posture?',
    traceId: payload.traceId,
    parentRunId: null,
    idempotencyKey: 'boardroom:test',
    maxStep: 24,
    maxSessionMinutes: 45,
    internalEstimatedCostCents: null,
    internalSpendCents: 0,
    metadata: {
      boardroomSpec: {
        question: 'Should the board approve the posture?',
        participantIds: ['synthesis-chair', 'legal', 'security'],
        maxRounds: 1,
        outputTarget: 'board_executive_pack',
      },
    },
    createdAt: '2026-05-31T12:00:00.000Z',
    updatedAt: '2026-05-31T12:00:00.000Z',
    queuedAt: '2026-05-31T12:00:00.000Z',
    startedAt: '2026-05-31T12:00:01.000Z',
    completedAt: null,
    expiresAt: null,
  };
}

function makeEvidencePack(): CapsuleEvidencePack {
  return {
    packId: 'pack-1',
    ownerUid: 'user-1',
    capsuleId: 'cap-1',
    objective: 'Should the board approve the posture?',
    builtAt: '2026-05-31T12:00:01.000Z',
    activeCapsule: {
      capsuleId: 'cap-1',
      label: 'Board capsule',
      version: 1,
      coreRefs: { sourceCoreIds: [], documentCoreIds: ['doc-1'] },
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
      charEnd: 80,
      excerpt: 'The board needs a written authorization caveat.',
      score: 0.9,
      confidence: 0.9,
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
