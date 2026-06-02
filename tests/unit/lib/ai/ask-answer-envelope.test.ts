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

  it('turns approved capsule source refs into citation-ready source cards for Ask answers', () => {
    const cards = buildSourcePreviewCards({
      evidencePack: {
        ...evidencePack(),
        activeCapsule: {
          ...evidencePack().activeCapsule,
          sourceRefs: [
            {
              sourceId: 'receipt-1',
              label: 'OHCHR access update',
              title: 'OHCHR access update',
              url: 'https://example.org/ohchr-access',
              publisher: 'OHCHR',
              date: '2026-06-01',
              reliabilityTier: 1,
              citation: 'OHCHR, Access Update, 1 June 2026',
            },
          ],
        },
      } as CapsuleEvidencePack,
    });

    expect(cards).toContainEqual(expect.objectContaining({
      id: 'receipt:receipt-1',
      title: 'OHCHR access update',
      sourceType: 'source-receipt',
      url: 'https://example.org/ohchr-access',
      citationLabel: 'OHCHR, Access Update, 1 June 2026',
      locatorLabel: 'OHCHR / 2026-06-01 / tier 1',
      sourceReceiptId: 'receipt-1',
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
    expect(envelope.sourceabilityVerdicts).toContainEqual(expect.objectContaining({
      verdict: 'supported',
      sourceIds: ['doc-1:chunk-1'],
    }));
    expect(envelope.followUps).toContain('Check the weakest claim against attached sources.');
    expect(envelope.documentPackCandidate.provenance.capsuleId).toBe('cap-1');
    expect(envelope.contextProvenanceChips).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'capsule',
        label: 'ContextCapsule',
        href: '/app/capsules?capsuleId=cap-1',
      }),
      expect.objectContaining({
        kind: 'source',
        label: expect.stringContaining('source'),
        href: '/app/library?receiptId=receipt-1',
      }),
      expect.objectContaining({
        kind: 'output',
      }),
    ]));
    expect(envelope.contextDiagnostics).toMatchObject({
      activeCapsule: 'cap-1',
      unsupportedClaimCount: 0,
      modelPriorClaimCount: 1,
      cogneeStatus: 'disabled',
      graphProposalStatus: 'not_proposed',
      outputReadiness: 'artifact_candidate',
    });
    expect(envelope.contextDiagnostics.sourceLanesUsed).toContain('uploaded-document');
  });

  it('returns a capsule grounding receipt, detailed claim ledger, memory receipt, refresh docket, and review-card suggestions', () => {
    const sourceCards = buildSourcePreviewCards({ evidencePack: evidencePack() });
    const envelope = buildAskAnswerEnvelope({
      prompt: 'What changed and what should we do?',
      answer: 'Access restrictions are the immediate operational issue. A separate claim about telecom outages is not in the attached sources. The monitoring cell should verify whether these restrictions are temporary or becoming routine.',
      intent: 'normal_answer',
      sourceCards,
      gaps: ['No current field confirmation.'],
      provenance: {
        capsuleId: 'starter-situation-eu-ai-act-2026-implementation-simplification',
        capsuleVersion: 12,
        catalogVersion: '2026-05-23-human-gated-workflows-v12',
        intelligenceProfileId: 'starter-situation-eu-ai-act-2026-implementation-simplification-intelligence-v1',
        cogneeProfileId: 'starter-situation-eu-ai-act-2026-implementation-simplification-cognee-v1',
      },
      contextEnrichment: {
        firestore: 'ready',
        canonicalStatus: 'firestore-canonical',
        cognee: 'enabled',
        trustgraph: 'disabled',
        graphlite: 'disabled',
        graphiti: 'deferred',
        memoryItemIds: ['cognee:hit-1'],
        usedMemoryItemIds: ['cognee:hit-1'],
        ignoredMemoryItemIds: ['cognee:ignored-no-source'],
        memoryHitCount: 1,
        trustgraphItemIds: [],
        usedTrustGraphItemIds: [],
        ignoredTrustGraphItemIds: [],
        trustgraphHitCount: 0,
        graphliteItemIds: [],
        usedGraphLiteItemIds: [],
        ignoredGraphLiteItemIds: [],
        graphliteHitCount: 0,
        graphCandidateIds: [],
        explainabilityIds: [],
        writebackProposalIds: ['review-card:cognee:hit-1'],
        warnings: [],
      },
    });

    expect(envelope.groundingReceipt).toMatchObject({
      capsuleId: 'starter-situation-eu-ai-act-2026-implementation-simplification',
      capsuleVersion: 12,
      catalogVersion: '2026-05-23-human-gated-workflows-v12',
      sourceExcerptCount: sourceCards.length,
      cogneeStatus: 'enabled',
      memoryHitCount: 1,
      intelligenceProfileId: 'starter-situation-eu-ai-act-2026-implementation-simplification-intelligence-v1',
      cogneeProfileId: 'starter-situation-eu-ai-act-2026-implementation-simplification-cognee-v1',
      usedCapsuleIntelligenceProfile: true,
      usedCogneeAdvisoryMemory: true,
      humanReviewRequired: true,
    });
    expect(envelope.claimLedger.map((claim) => claim.status)).toEqual(expect.arrayContaining([
      'supported',
      'unsupported',
      'model_prior',
      'advisory_memory',
    ]));
    expect(envelope.claimLedger.find((claim) => claim.status === 'advisory_memory')).toMatchObject({
      sourceIds: [],
      memoryIds: ['cognee:hit-1'],
      reviewState: 'proposed',
    });
    expect(envelope.memoryReceipt).toMatchObject({
      cogneeStatus: 'enabled',
      memoryHitCount: 1,
      advisoryOnly: true,
      promotionRequired: 'review-card',
      cogneeProfileId: 'starter-situation-eu-ai-act-2026-implementation-simplification-cognee-v1',
      usedCogneeAdvisoryMemory: true,
      ignoredMemoryIds: ['cognee:ignored-no-source'],
    });
    expect(envelope.contextDiagnostics).toMatchObject({
      activeCapsule: 'starter-situation-eu-ai-act-2026-implementation-simplification',
      cogneeStatus: 'enabled',
      memoryPosture: 'advisory_used',
      graphProposalStatus: 'review_gated',
      outputReadiness: 'artifact_candidate',
    });
    expect(envelope.sourceRefreshDocket).toMatchObject({
      capsuleId: 'starter-situation-eu-ai-act-2026-implementation-simplification',
      needsRefresh: true,
    });
    expect(envelope.sourceRefreshDocket.missingEvidenceGaps).toContain('No current field confirmation.');
    expect(envelope.reviewCardSuggestions.map((suggestion) => suggestion.action)).toEqual(expect.arrayContaining([
      'promote_supported_claim',
      'mark_disputed',
      'create_source_gap',
      'save_as_memo',
      'create_output_capsule',
    ]));
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

  it('derives a compact answer-quality summary and context repair actions for weak context', () => {
    const envelope = buildAskAnswerEnvelope({
      prompt: 'What is the latest state of the ceasefire? Please be current.',
      answer: 'The ceasefire appears fragile and a current field confirmation is needed before relying on this answer.',
      intent: 'normal_answer',
      sourceCards: [],
      gaps: ['No current field confirmation.'],
      orchestrationReceipt: buildAskConversationOrchestrationReceipt({
        prompt: 'What is the latest state of the ceasefire? Please be current.',
        intent: 'normal_answer',
        contextReceipt: contextReceipt({
          health: 'thin',
          evidenceCount: 0,
          coreRefs: {
            ...contextReceipt().coreRefs,
            sourceDocumentCoreIds: [],
          },
          warnings: ['No current field confirmation.'],
        }),
        sourcePreviewCount: 0,
        activeGapCount: 1,
      }),
    });

    expect(envelope.answerQualitySummary).toMatchObject({
      contextReadiness: 'missing_sources',
      sourceCount: 0,
      sourceGapCount: 1,
      confidencePosture: 'low',
      memoHandoffReady: true,
    });
    expect(envelope.answerQualitySummary.recommendedNextAction).toMatch(/Attach|source/i);
    expect(envelope.contextRepairActions.map((action) => action.id)).toEqual(expect.arrayContaining([
      'check-sources',
      'create-source-gap',
      'run-deeper-agent',
      'send-to-memo',
    ]));
    expect(envelope.contextRepairActions.map((action) => action.id)).not.toContain('create-output-capsule');
    expect(envelope.contextRepairActions.map((action) => action.id)).toHaveLength(4);
    expect(envelope.contextRepairActions.filter((action) => action.priority === 'primary')).toHaveLength(1);
    expect(envelope.contextRepairActions[0]).toMatchObject({
      id: 'check-sources',
      priority: 'primary',
    });
  });

  it('keeps queued, degraded, and unnecessary deep-agent posture honest', () => {
    const sourceCards = buildSourcePreviewCards({ evidencePack: evidencePack() });
    const queuedReceipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Do a deep current multi-source memo.',
      intent: 'research_memo',
      contextReceipt: contextReceipt({ health: 'thin', evidenceCount: 1, warnings: ['Needs current source.'] }),
      sourcePreviewCount: sourceCards.length,
      activeGapCount: 1,
    });
    const queuedEnvelope = buildAskAnswerEnvelope({
      prompt: 'Do a deep current multi-source memo.',
      answer: 'Access restrictions are the immediate issue.',
      intent: 'research_memo',
      sourceCards,
      orchestrationReceipt: {
        ...queuedReceipt,
        supervisor: {
          ...queuedReceipt.supervisor,
          status: 'dispatch_enqueued',
          queuedRun: {
            runId: 'run-1',
            status: 'dispatch_enqueued',
            outputHref: '/app?agentRunId=run-1',
          },
        },
      },
    });

    expect(queuedEnvelope.agenticDepthRecommendation).toMatchObject({
      mode: 'queued',
      runId: 'run-1',
      label: 'Deeper agent queued',
    });
    expect(queuedEnvelope.answerQualitySummary.queuedDeepRunStatus).toBe('queued');

    const degradedEnvelope = buildAskAnswerEnvelope({
      prompt: 'Do a deep current multi-source memo.',
      answer: 'Access restrictions are the immediate issue.',
      intent: 'research_memo',
      sourceCards,
      orchestrationReceipt: {
        ...queuedReceipt,
        supervisor: {
          ...queuedReceipt.supervisor,
          status: 'failed',
          queuedRun: {
            runId: 'unavailable',
            status: 'ledger_failed',
            error: 'ledger unavailable',
          },
        },
      },
    });
    expect(degradedEnvelope.agenticDepthRecommendation).toMatchObject({
      mode: 'degraded',
      label: 'Deep runtime unavailable',
    });
    expect(degradedEnvelope.answerQualitySummary.queuedDeepRunStatus).toBe('degraded');
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

  it('marks a source contradiction as a first-class contradicted verdict', () => {
    const envelope = buildAskAnswerEnvelope({
      prompt: 'Check the access posture.',
      answer: 'The monitoring cell reported unrestricted access near the northern crossing.',
      intent: 'normal_answer',
      sourceCards: [
        {
          id: 'doc-access:chunk-contradiction',
          title: 'Monitoring cell access log',
          label: 'Uploaded Document',
          sourceType: 'uploaded-document',
          quotePreview: 'The monitoring cell reported access restrictions near the northern crossing.',
          documentId: 'doc-access',
          chunkId: 'chunk-contradiction',
          sourceReceiptId: 'receipt-access',
          pageRef: 'p.7',
          confidence: 0.91,
        },
      ],
    });

    expect(envelope.sourceabilityVerdicts).toContainEqual(expect.objectContaining({
      claim: 'The monitoring cell reported unrestricted access near the northern crossing.',
      verdict: 'contradicted',
      sourceIds: ['doc-access:chunk-contradiction'],
    }));
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
        outputTarget: 'policy-memo',
      },
    });

    const blocks = conversationDocumentPackToMemoBlocks(pack);

    expect(blocks.map((block) => block.id)).toEqual([
      'pack-heading',
      'pack-output-target',
      'pack-target-1',
      'pack-target-2',
      'pack-target-3',
      'pack-target-4',
      'pack-target-5',
      'pack-sources',
      'pack-gaps',
      'pack-provenance',
    ]);
    expect(blocks[1].content).toContain('Policy memo');
    expect(blocks[2].title).toBe('Bottom line');
    expect(blocks[2].content).toBe('Access restrictions are the immediate operational issue.');
    expect(blocks[2].citations[0].sourceReceiptIds).toEqual(['receipt-1']);
    expect(blocks[3].title).toBe('Decision context');
    expect(blocks[7].items?.[0]).toContain('p.4');
    expect(blocks[7].items?.[0]).toContain('Source receipt: receipt-1');
    });

  it('infers a first-class policy output target when Ask does not specify one', () => {
    const pack = buildConversationDocumentPack({
      title: 'Options analysis',
      prompt: 'Prepare an options memo with tradeoffs and a recommendation.',
      answer: 'Option A is faster, while option B has lower legal risk.',
      sourceCards: [],
      gaps: [],
      provenance: {
        capsuleId: 'cap-options',
      },
    });

    expect(pack.provenance.outputTarget).toBe('options-memo');
    expect(conversationDocumentPackToMemoBlocks(pack).map((block) => block.title)).toContain('Decision question');
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
