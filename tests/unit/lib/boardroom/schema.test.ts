import { describe, expect, it } from 'vitest';
import {
  BOARDROOM_DEFAULT_PARTICIPANT_IDS,
  BoardroomOutputSchema,
  BoardroomRunRequestSchema,
  buildBoardroomAgentRunInput,
  normalizeBoardroomParticipants,
} from '@/lib/boardroom/schema';

describe('boardroom schemas and AgentRun mapping', () => {
  it('defaults to the required chair-led PRAXIS boardroom roster', () => {
    const parsed = BoardroomRunRequestSchema.parse({
      question: 'Should we escalate this decision to the board?',
      capsuleId: 'cap-1',
    });

    expect(parsed.participantIds).toEqual(BOARDROOM_DEFAULT_PARTICIPANT_IDS);
    expect(parsed.maxRounds).toBe(2);
    expect(parsed.outputTarget).toBe('board_executive_pack');
  });

  it('prepends the required chair while enforcing 3-8 active participants', () => {
    expect(normalizeBoardroomParticipants(['legal', 'security'])).toEqual([
      'synthesis-chair',
      'legal',
      'security',
    ]);

    expect(() => normalizeBoardroomParticipants(['legal'])).toThrow(/at least 3/i);
    expect(() => normalizeBoardroomParticipants([
      'synthesis-chair',
      'mediator',
      'humanitarian',
      'legal',
      'media',
      'security',
      'red-team',
      'source-scout',
      'graph-cartographer' as never,
    ])).toThrow(/Unknown boardroom participant/i);
  });

  it('maps boardroom requests into a narrow AgentRun spec without raw model ids', () => {
    const spec = BoardroomRunRequestSchema.parse({
      question: 'Which operating posture should the crisis team recommend?',
      capsuleId: 'cap-1',
      directContext: 'The board needs a decision by Friday.',
      selectedDocumentIds: ['doc-1', 'doc-2'],
      selectedSources: [
        {
          documentId: 'doc-2',
          sourceCoreId: 'source-core-2',
          sourceReceiptId: 'receipt-2',
          label: 'Friday pasted brief',
          kind: 'pasted-text',
          fileType: 'txt',
        },
      ],
      participantIds: ['mediator', 'legal', 'security', 'red-team'],
      maxRounds: 3,
    });

    const input = buildBoardroomAgentRunInput({
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      contextStackId: 'default',
      selectedCoreIds: {
        situationCoreId: 'sit-1',
        documentCoreIds: ['existing-doc'],
        sourceCoreIds: ['src-1'],
      },
      request: spec,
      traceId: 'trace-boardroom-1',
      idempotencyKey: 'boardroom:test',
    });

    expect(input).toMatchObject({
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      contextStackId: 'default',
      triggerType: 'manual',
      objective: 'Which operating posture should the crisis team recommend?',
      traceId: 'trace-boardroom-1',
      idempotencyKey: 'boardroom:test',
      maxStep: 24,
      maxSessionMinutes: 45,
    });
    expect(input.selectedCoreIds).toMatchObject({
      situationCoreId: 'sit-1',
      documentCoreIds: ['existing-doc', 'doc-1', 'doc-2'],
      sourceCoreIds: ['src-1', 'source-core-2'],
    });
    expect(input.metadata).toMatchObject({
      policyAgentId: 'boardroom-discussion',
      outputDestination: 'library',
      selectedToolIds: expect.arrayContaining([
        'context-resolve',
        'capsule-evidence-pack',
        'boardroom-deliberation',
        'board-executive-pack',
        'output-capsule-save',
      ]),
      boardroomSpec: {
        question: 'Which operating posture should the crisis team recommend?',
        maxRounds: 3,
        participantIds: ['synthesis-chair', 'mediator', 'legal', 'security', 'red-team'],
        selectedDocumentIds: ['doc-1', 'doc-2'],
        selectedSources: [
          expect.objectContaining({
            documentId: 'doc-2',
            sourceReceiptId: 'receipt-2',
            label: 'Friday pasted brief',
            kind: 'pasted-text',
          }),
        ],
      },
      sourceReceiptIds: ['receipt-2'],
      selectedSources: [
        expect.objectContaining({
          documentId: 'doc-2',
          sourceCoreId: 'source-core-2',
          sourceReceiptId: 'receipt-2',
          label: 'Friday pasted brief',
        }),
      ],
      modelPolicy: 'praxis_frontier_deep_model_policy',
    });
    expect(JSON.stringify(input)).not.toMatch(/\bgemini\b|\bclaude\b|\bgpt-\d/i);
  });

  it('parses the durable boardroom output shape for transcripts and synthesis', () => {
    const parsed = BoardroomOutputSchema.parse({
      meetingBrief: 'Boardroom brief for cap-1.',
      agenda: ['Context brief', 'Participant turns', 'Synthesis'],
      roster: [
        { participantId: 'synthesis-chair', label: 'Synthesis Chair', lens: 'Chair' },
        { participantId: 'legal', label: 'Legal Analyst', lens: 'Legal' },
        { participantId: 'security', label: 'Security/Risk Analyst', lens: 'Risk' },
      ],
      transcript: [
        {
          turnId: 'turn-1',
          round: 1,
          participantId: 'legal',
          state: 'speaking',
          claim: 'The posture needs a legal review gate.',
          evidenceRefs: ['src-1'],
          confidence: 'medium',
        },
      ],
      topicClusters: [{ topic: 'Decision posture', mentions: 2, participantIds: ['legal', 'security'] }],
      consensus: ['Use a reviewed board pack before external action.'],
      divergences: ['Risk and legal differ on speed.'],
      risks: ['Source coverage is thin.'],
      openQuestions: ['Which authority signs off?'],
      evidenceStats: { sourceCount: 1, documentCount: 2, sourcedParagraphCount: 0, unsupportedClaimCount: 1 },
      confidenceDistribution: { high: 0, medium: 1, low: 0 },
      nextActions: [{ action: 'Run sourceability pass.', owner: 'analyst', urgency: 'short-term' }],
      finalSynthesis: 'Proceed with a human-reviewed board-executive pack.',
    });

    expect(parsed.transcript[0].participantId).toBe('legal');
    expect(parsed.confidenceDistribution.medium).toBe(1);
  });

  it('keeps unsupported boardroom turns explicit when evidence refs are rejected', () => {
    const parsed = BoardroomOutputSchema.parse({
      meetingBrief: 'Boardroom brief for cap-1.',
      agenda: ['Context brief', 'Participant turns', 'Synthesis'],
      roster: [
        { participantId: 'synthesis-chair', label: 'Synthesis Chair', lens: 'Chair' },
        { participantId: 'legal', label: 'Legal Analyst', lens: 'Legal' },
        { participantId: 'security', label: 'Security/Risk Analyst', lens: 'Risk' },
      ],
      transcript: [
        {
          turnId: 'turn-unsupported',
          round: 1,
          participantId: 'security',
          state: 'unsupported',
          claim: 'The posture needs a field guarantee.',
          evidenceRefs: [],
          unsupportedEvidenceRefs: ['invented-source'],
          confidence: 'low',
        },
      ],
      topicClusters: [{ topic: 'Evidence posture', mentions: 1, participantIds: ['security'] }],
      consensus: [],
      divergences: ['Security claim is unsupported.'],
      risks: ['Unsupported evidence ref was rejected.'],
      openQuestions: ['What source can verify the field guarantee?'],
      evidenceStats: { sourceCount: 0, documentCount: 0, sourcedParagraphCount: 0, unsupportedClaimCount: 1 },
      confidenceDistribution: { high: 0, medium: 0, low: 1 },
      nextActions: [{ action: 'Attach a valid source receipt.', owner: 'analyst', urgency: 'short-term' }],
      finalSynthesis: 'Keep the unsupported field guarantee out of the final decision posture until sourced.',
    });

    expect(parsed.transcript[0].state).toBe('unsupported');
    expect(parsed.transcript[0].unsupportedEvidenceRefs).toEqual(['invented-source']);
  });
});
