import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentRun } from '@/lib/agent-runtime/types';
import type { ExecuteAgentRunPayload } from '@/lib/agent-runtime/worker';
import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import { BRAINSTORMING_PERSONA_IDS } from '@/lib/boardroom/brainstorming-table';

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
        decisionOptions: [
          {
            label: 'Approve with caveats',
            tradeoffs: 'Moves the board forward while keeping weak operational evidence visible.',
            preferredBy: ['legal'],
          },
        ],
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
    expect(output.decisionOptions).toEqual([
      expect.objectContaining({
        label: 'Approve with caveats',
        preferredBy: ['legal'],
      }),
    ]);
    expect(synthesisEvents).toEqual(['Proceed only with the weakly sourced security point flagged.']);
    expect(JSON.stringify(output.transcript)).not.toContain('document:doc-1');
    const prompts = generateTextMock.mock.calls.map((call) => String(call[0]?.prompt ?? ''));
    expect(prompts[0]).toContain('capsule: cap-1 v1');
    expect(prompts[0]).toContain('receipt-1');
    expect(prompts[0]).toContain('The board needs a written authorization caveat.');
  });

  it('runs the six brainstorming personas against active capsule evidence by default', async () => {
    const { runLiveBoardroomDiscussion } = await import('@/lib/boardroom/live-runner');
    const turnOutputs = BRAINSTORMING_PERSONA_IDS.map((id) => ({
      claim: `${id} grounds the decision in the active capsule receipt.`,
      evidenceRefs: ['receipt-1'],
      critique: `${id} critique stays attached to the capsule source.`,
      recommendation: `${id} recommends keeping the source citation visible.`,
      confidence: 'medium',
    }));
    generateTextMock.mockImplementation(async () => ({
      output: turnOutputs.shift() ?? {
        consensus: ['Every board persona cited the active capsule receipt.'],
        divergences: ['Personas differ on speed and risk posture.'],
        decisionOptions: [
          {
            label: 'Proceed with cited caveats',
            tradeoffs: 'Keeps the decision moving while retaining capsule-source caveats.',
            preferredBy: ['mediator', 'legal'],
          },
        ],
        risks: ['Do not overstate the single source receipt.'],
        openQuestions: ['Which second source should corroborate the receipt?'],
        nextActions: [{ action: 'Add a second corroborating source.', owner: 'analyst', urgency: 'short-term' }],
        finalSynthesis: 'Proceed only with the active capsule receipt and caveats visible.',
        topicClusters: [{ topic: 'Capsule evidence', mentions: 6, participantIds: ['mediator', 'humanitarian', 'legal', 'media', 'security', 'red-team'] }],
      },
    }));

    const output = await runLiveBoardroomDiscussion({
      run: makeDefaultRun(),
      payload,
      evidencePack: makeEvidencePack(),
    });

    expect(output.transcript.map((turn) => turn.participantId)).toEqual(BRAINSTORMING_PERSONA_IDS);
    expect(output.transcript).toHaveLength(6);
    expect(output.transcript.every((turn) => turn.evidenceRefs.includes('receipt-1'))).toBe(true);
    expect(output.decisionOptions[0]).toMatchObject({
      label: 'Proceed with cited caveats',
      preferredBy: ['mediator', 'legal'],
    });
    expect(generateTextMock).toHaveBeenCalledTimes(7);
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

function makeDefaultRun(): AgentRun {
  return {
    ...makeRun(),
    metadata: {
      boardroomSpec: {
        question: 'Should the board approve the posture?',
        maxRounds: 1,
        outputTarget: 'board_executive_pack',
      },
    },
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
