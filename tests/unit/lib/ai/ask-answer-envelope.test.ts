import { describe, expect, it } from 'vitest';
import {
  buildAskAnswerEnvelope,
  buildAskTraceabilitySummary,
  buildConversationDocumentPack,
  buildResearchGraphSourcePreviewCards,
  buildSourcePreviewCards,
  conversationDocumentPackToMemoBlocks,
} from '@/lib/ai/ask-answer-envelope';
import { buildAskConversationOrchestrationReceipt } from '@/lib/ai/ask-orchestrator';
import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import type { AskContextReceipt } from '@/lib/ai/ask-conversation';

describe('ask answer envelope', () => {
  it('normalizes evidence-pack paragraphs into always-visible source cards', () => {
    const cards = buildSourcePreviewCards({
      evidencePack: evidencePack(),
    });

    expect(cards).toContainEqual(
      expect.objectContaining({
        id: 'doc-1:chunk-1',
        title: 'Uploaded document doc-1',
        sourceType: 'uploaded-document',
        label: 'Uploaded Document',
        quotePreview: 'The ceasefire monitoring cell reported two access restrictions near the crossing.',
        documentId: 'doc-1',
        chunkId: 'chunk-1',
        pageRef: 'p.4',
        confidence: 0.82,
      }),
    );
    expect(cards).toContainEqual(expect.objectContaining({
      id: 'receipt:receipt-1',
      label: 'Source Receipt',
      sourceReceiptHref: '/app/library?receiptId=receipt-1',
    }));
  });

  it('normalizes corpus documents, source receipts, grounded fetches, and document digests into source cards', () => {
    const cards = buildSourcePreviewCards({
      evidencePack: {
        ...evidencePack(),
        knowledgeDocuments: [
          {
            documentId: 'doc-2',
            title: 'Crossing access corpus note',
            sourceType: 'briefing-note',
            sourceNote: 'Uploaded by access team',
            extractionStatus: 'extracted',
            retrievalStatus: 'indexed',
            chunkCount: 8,
            digest: {
              shortSummary: 'Digest says convoy access was restricted for two days.',
              keyClaims: ['Convoy access was restricted for two days.'],
              sourceabilityWarnings: ['Needs dated crossing log.'],
            },
          },
        ],
        sourceReceiptIds: ['receipt-1', 'receipt-2'],
        documentDigests: [
          {
            documentId: 'doc-3',
            title: 'Situation digest',
            shortSummary: 'The field office reports a repeat verification problem.',
            keyClaims: ['Verification remains incomplete.'],
            sourceabilityWarnings: ['Only text extraction is available.'],
          },
        ],
      } as CapsuleEvidencePack,
      groundedFetches: [
        {
          id: 'fetch-1',
          title: 'UN update',
          url: 'https://example.org/update',
          content: 'UN update reports renewed access restrictions near the same crossing.',
          confidence: 0.7,
        },
      ],
    });

    expect(cards.map((card) => card.sourceType)).toEqual(expect.arrayContaining([
      'uploaded-document',
      'corpus',
      'source-receipt',
      'document-digest',
      'grounded-search',
    ]));
    expect(cards.find((card) => card.id === 'corpus:doc-2')).toMatchObject({
      label: 'Corpus Result',
      documentId: 'doc-2',
      locatorLabel: '8 chunks indexed',
      quotePreview: 'Digest says convoy access was restricted for two days.',
    });
    expect(cards.find((card) => card.id === 'receipt:receipt-2')).toMatchObject({
      label: 'Source Receipt',
      sourceReceiptId: 'receipt-2',
      sourceReceiptHref: '/app/library?receiptId=receipt-2',
    });
    expect(cards.find((card) => card.id === 'digest:doc-3')).toMatchObject({
      label: 'Document Digest',
      documentId: 'doc-3',
      extractionFallbackLabel: 'Text extraction only',
    });
  });

  it('builds a conversational envelope with source-backed claims and follow-ups', () => {
    const sourceCards = buildSourcePreviewCards({ evidencePack: evidencePack() });
    const envelope = buildAskAnswerEnvelope({
      prompt: 'What matters now?',
      answer: 'Access restrictions are the immediate operational issue. The monitoring cell should verify whether these restrictions are temporary or becoming routine.',
      intent: 'normal_answer',
      sourceCards,
      gaps: ['No current field confirmation.'],
      generationReceipt: {
        selectedModel: 'gemini-3.5-flash',
        fallbackModel: null,
        budgetMode: 'standard',
        maxOutputTokens: 4096,
        finishReason: 'stop',
        usage: { inputTokens: 100, outputTokens: 240, totalTokens: 340 },
      },
      provenance: {
        capsuleId: 'cap-1',
        capsuleVersion: 2,
        threadId: 'ask-cap-1',
        model: 'vertex-test',
      },
    });

    expect(envelope.style.mode).toBe('claude_like_dialogue');
    expect(envelope.sourceCards.length).toBeGreaterThanOrEqual(1);
    expect(envelope.generationReceipt).toMatchObject({
      selectedModel: 'gemini-3.5-flash',
      budgetMode: 'standard',
      maxOutputTokens: 4096,
      finishReason: 'stop',
      usage: { inputTokens: 100, outputTokens: 240, totalTokens: 340 },
    });
    expect(envelope.sourceAudit).toMatchObject({
      sourceCount: sourceCards.length,
      gapCount: 1,
      unsupportedClaimCount: 0,
    });
    expect(envelope.claimLedgerSummary).toMatchObject({
      totalClaims: 2,
      supportedClaims: 1,
      unsupportedClaims: 0,
      assumptionClaims: 1,
    });
    expect(envelope.continuationActions.map((action) => action.id)).toEqual([
      'continue-as-memo',
      'expand-evidence-annex',
      'create-output-capsule',
    ]);
    expect(envelope.claimGrounding[0]).toMatchObject({
      grounding: 'source-backed',
      sourceCardIds: ['doc-1:chunk-1'],
    });
    expect(envelope.followUps).toContain('Check the weakest claim against attached sources.');
    expect(envelope.documentPackCandidate.provenance.capsuleId).toBe('cap-1');
  });

  it('summarizes intent, policy context, capsules, source posture, and review gate for traceability', () => {
    const sourceCards = buildSourcePreviewCards({ evidencePack: evidencePack() });
    const orchestrationReceipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Analyze this from a U.S. federal AI governance perspective and prepare a memo.',
      intent: 'research_memo',
      contextReceipt: contextReceipt({ health: 'thin', warnings: ['No current OMB source attached.'] }),
      sourcePreviewCount: sourceCards.length,
      activeGapCount: 1,
      activeCapsules: [
        { capsuleId: 'starter-situation-us-federal-ai-governance-baseline', label: 'U.S. federal AI governance baseline', tags: ['ai-governance', 'us-federal'] },
      ],
    });
    const envelope = buildAskAnswerEnvelope({
      prompt: 'Analyze this from a U.S. federal AI governance perspective and prepare a memo.',
      answer: 'Federal AI governance review should separate OMB guidance, NIST risk framing, procurement controls, and agency implementation gaps.',
      intent: 'research_memo',
      sourceCards,
      gaps: ['No current OMB source attached.'],
      orchestrationReceipt,
    });

    expect(envelope.traceabilitySummary).toEqual(buildAskTraceabilitySummary({
      sourceAudit: envelope.sourceAudit,
      claimLedgerSummary: envelope.claimLedgerSummary,
      orchestrationReceipt,
    }));
    expect(envelope.traceabilitySummary).toMatchObject({
      detectedIntent: 'legal_policy_context',
      selectedPolicyContext: 'U.S. federal / AI governance',
      activeCapsulesUsed: ['starter-situation-us-federal-ai-governance-baseline'],
      sourceCount: sourceCards.length,
      unsupportedClaimsCount: 0,
      humanReviewRecommendation: expect.stringMatching(/review/i),
    });
    expect(envelope.traceabilitySummary.assumptionsCount).toBeGreaterThanOrEqual(1);
    expect(envelope.traceabilitySummary.bestNextAction).toBeTruthy();
  });

  it('grounds claims against matching source previews instead of assigning the first three cards heuristically', () => {
    const sourceCards = buildSourcePreviewCards({
      evidencePack: {
        ...evidencePack(),
        sourcedParagraphs: [
          {
            id: 'para-1',
            documentId: 'doc-access',
            chunkId: 'chunk-access',
            sourceReceiptId: 'receipt-access',
            pageRef: 'p.2',
            paragraphRef: 'para-1',
            charStart: 0,
            charEnd: 40,
            excerpt: 'Access restrictions affected the northern crossing.',
            score: 0.9,
            confidence: 0.9,
            citationLabel: '[A:p.2]',
          },
          {
            id: 'para-2',
            documentId: 'doc-food',
            chunkId: 'chunk-food',
            sourceReceiptId: 'receipt-food',
            pageRef: 'p.9',
            paragraphRef: 'para-4',
            charStart: 0,
            charEnd: 40,
            excerpt: 'Food prices rose sharply in the southern market.',
            score: 0.88,
            confidence: 0.88,
            citationLabel: '[F:p.9]',
          },
        ],
      } as CapsuleEvidencePack,
    });

    const envelope = buildAskAnswerEnvelope({
      prompt: 'What changed?',
      answer: 'Access restrictions affected the northern crossing. A separate claim about telecom outages is not in the attached sources. Food prices rose sharply in the southern market.',
      intent: 'normal_answer',
      sourceCards,
    });

    expect(envelope.claimGrounding).toEqual([
      expect.objectContaining({
        claim: 'Access restrictions affected the northern crossing.',
        grounding: 'source-backed',
        sourceCardIds: ['doc-access:chunk-access'],
      }),
      expect.objectContaining({
        claim: 'A separate claim about telecom outages is not in the attached sources.',
        grounding: 'unsupported',
        sourceCardIds: [],
      }),
      expect.objectContaining({
        claim: 'Food prices rose sharply in the southern market.',
        grounding: 'source-backed',
        sourceCardIds: ['doc-food:chunk-food'],
      }),
    ]);
  });

  it('carries Research graph advisory receipts into source previews and follow-up actions', () => {
    const researchGraphReceipts = [
      {
        provider: 'gdelt-doc' as const,
        queryKind: 'current_media_pulse' as const,
        status: 'ready' as const,
        filters: { topic: 'Red Sea shipping' },
        generatedAt: '2026-05-22T12:00:00.000Z',
        citations: ['https://api.gdeltproject.org/api/v2/doc/doc'],
        sourceUrls: ['https://example.org/shipping'],
        entityMatches: [],
        mediaSeries: [{ date: '2026-05-21', value: 11 }],
        eventSeries: [],
        extractedSignals: [{ label: 'Media pulse', value: '11 matching articles', confidence: 0.6 }],
        confidence: 0.62,
        caveats: ['GDELT is advisory media signal, not canonical graph truth.'],
        costPosture: 'free_open_data' as const,
        advisoryOnly: true as const,
      },
    ];
    const sourceCards = buildResearchGraphSourcePreviewCards(researchGraphReceipts);
    const envelope = buildAskAnswerEnvelope({
      prompt: 'What changed in Red Sea shipping coverage?',
      answer: 'GDELT shows a media pulse around Red Sea shipping.',
      intent: 'normal_answer',
      sourceCards,
      researchGraphReceipts,
    });

    expect(sourceCards[0]).toMatchObject({
      label: 'Research Graph',
      sourceType: 'research-graph',
      url: 'https://example.org/shipping',
    });
    expect(envelope.researchGraphReceipts).toHaveLength(1);
    expect(envelope.followUps).toContain('Promote Research graph candidates to a review-gated graph proposal.');
  });

  it('converts a conversation document pack into citation-preserving memo blocks', () => {
    const sourceCards = buildSourcePreviewCards({ evidencePack: evidencePack() });
    const pack = buildConversationDocumentPack({
      title: 'Ask PRAXIS document pack',
      prompt: 'Prepare a pack',
      answer: 'Access restrictions are the immediate operational issue.',
      sourceCards,
      gaps: ['No current field confirmation.'],
      provenance: {
        capsuleId: 'cap-1',
        capsuleVersion: 2,
        threadId: 'ask-cap-1',
        model: 'vertex-test',
      },
    });

    const blocks = conversationDocumentPackToMemoBlocks(pack);

    expect(blocks.map((block) => block.id)).toEqual([
      'pack-heading',
      'pack-answer',
      'pack-sources',
      'pack-gaps',
      'pack-provenance',
    ]);
    expect(blocks[1].citations[0].sourceReceiptIds).toEqual(['receipt-1']);
    expect(blocks[2].items?.[0]).toContain('p.4');
    expect(blocks[2].items?.[0]).toContain('Source receipt: receipt-1');
    });
});

function evidencePack(): CapsuleEvidencePack {
  return {
    packId: 'pack-1',
    ownerUid: 'user-1',
    capsuleId: 'cap-1',
    objective: 'What matters now?',
    builtAt: '2026-05-17T12:00:00.000Z',
    activeCapsule: {
      capsuleId: 'cap-1',
      ownerUid: 'user-1',
      label: 'Test capsule',
      summary: '',
      coreRefs: {
        userCoreId: 'user-core',
        teamCoreId: null,
        situationCoreId: 'sit-1',
        sourceCoreIds: ['receipt-1'],
        documentCoreIds: ['doc-1'],
        graphCoreId: null,
        timeCoreId: null,
        toolCoreIds: [],
        objectiveCoreIds: [],
        productCoreIds: [],
        outputCoreIds: [],
        memoryCoreId: null,
      },
      activeForSituationIds: ['sit-1'],
      status: 'active',
      version: 2,
      lineage: { parentCapsuleId: null, forkedFromVersion: null, combinedFromCapsuleIds: [] },
      locks: {},
      health: { score: 70, missingCores: [], warnings: [], signals: [] },
      createdAt: '2026-05-17T12:00:00.000Z',
      updatedAt: '2026-05-17T12:00:00.000Z',
      archivedAt: null,
    },
    knowledgeDocuments: [],
    sourceReceiptIds: ['receipt-1'],
    sourcedParagraphs: [
      {
        id: 'para-1',
        documentId: 'doc-1',
        chunkId: 'chunk-1',
        sourceReceiptId: 'receipt-1',
        pageRef: 'p.4',
        paragraphRef: 'para-8',
        charStart: 10,
        charEnd: 92,
        excerpt: 'The ceasefire monitoring cell reported two access restrictions near the crossing.',
        score: 0.82,
        confidence: 0.82,
        citationLabel: '[D1:p.4]',
      },
    ],
    documentDigests: [],
    outputHistory: [],
    memories: [],
    openGaps: ['No current field confirmation.'],
    receipts: {
      sourcesUsed: 1,
      paragraphsUsed: 1,
      unsupportedGaps: ['No current field confirmation.'],
      outputHistoryCount: 0,
      memoryCount: 0,
    },
  } as unknown as CapsuleEvidencePack;
}

function contextReceipt(overrides: Partial<AskContextReceipt> = {}): AskContextReceipt {
  return {
    capsuleId: 'cap-1',
    capsuleVersion: 2,
    threadId: 'ask-cap-1',
    traceId: 'trace-1',
    health: 'ready',
    coreRefs: {
      userCoreId: 'user-core',
      situationCoreId: 'sit-1',
      sourceDocumentCoreIds: ['doc-1'],
      graphCoreId: null,
      memoryCoreId: null,
      outputCoreIds: ['memo-1'],
    },
    referenceCapsuleIds: [],
    referenceCapsuleCount: 0,
    missingReferenceCapsuleIds: [],
    retrievalLayers: ['capsule-core-refs', 'source-receipts'],
    evidenceCount: 1,
    historyTurnCount: 0,
    memoryPersistence: 'firestore',
    warnings: [],
    stages: [],
    ...overrides,
  };
}
