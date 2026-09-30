import { describe, expect, it } from 'vitest';
import { buildMemoOutputReview } from '@/lib/memo/output-review';
import { buildAskConversationOrchestrationReceipt } from '@/lib/ai/ask-orchestrator';
import type { AskContextReceipt } from '@/lib/ai/ask-conversation';
import {
  buildProofSummaryFromAgentRun,
  buildProofSummaryFromAskEnvelope,
  modelPolicyLabelFor,
} from '@/lib/proof/proof-summary';

describe('proof summary normalization', () => {
  it('maps raw model ids into PRAXIS model-policy labels', () => {
    expect(modelPolicyLabelFor({ modelTier: 'standard', selectedModelId: 'gemini-3.5-flash' })).toBe('standard policy reasoning');
    expect(modelPolicyLabelFor({ modelTier: 'deep', selectedModelId: 'gemini-3.1-pro-preview' })).toBe('deep policy reasoning');
    expect(modelPolicyLabelFor({ modelPolicy: 'praxis_frontier_deep_model_policy' })).toBe('deep policy reasoning');
    expect(modelPolicyLabelFor({ modelTier: 'standard', lifecycleTier: 'stable_fallback', selectedModelId: 'gemini-2.5-flash' })).toBe('standard policy reasoning');
    expect(JSON.stringify(modelPolicyLabelFor({ selectedModelId: 'gemini-2.5-pro' }))).not.toMatch(/gemini|vertex|google|gpt|claude/i);
  });

  it('builds an Ask proof summary from capsule read and sourceability receipts', () => {
    const summary = buildProofSummaryFromAskEnvelope({
      orchestrationReceipt: {
        capsule: {
          capsuleId: 'cap-1',
          contextHealth: 'partial',
          sourcePreviewCount: 2,
          activeGapCount: 1,
          warnings: ['Attach the field cable.'],
        },
        routingDecision: {
          modelTier: 'deep',
          userSafeLabels: { modelTier: 'TACITUS selected deep reasoning' },
        },
        supervisor: {
          outputDestination: 'memo_studio',
          queuedRun: { runId: 'run-1', outputHref: '/agents/run-1', status: 'queued' },
        },
        grounding: {
          groundingPosture: 'Grounding unavailable',
          degradedReason: 'Google Search grounding is not configured.',
        },
        capsuleReadReceipt: {
          capsuleId: 'cap-1',
          sourceCount: 2,
          documentCount: 1,
          outputTarget: 'memo_studio',
          contextGaps: ['Attach the field cable.'],
          groundingPosture: 'Grounding unavailable',
        },
      },
      claimLedgerSummary: {
        totalClaims: 4,
        supportedClaims: 1,
        weakClaims: 1,
        unsupportedClaims: 1,
        contradictedClaims: 0,
        modelPriorClaims: 1,
        assumptionClaims: 0,
      },
      sourceAudit: {
        sourceCount: 2,
        unsupportedClaimCount: 1,
      },
      generationReceipt: {
        selectedModel: 'gemini-3.1-pro-preview',
      },
    });

    expect(summary).toMatchObject({
      contextHealth: 'review',
      sourceCount: 2,
      documentCount: 1,
      unsupportedClaimCount: 1,
      outputHref: '/agents/run-1',
      modelPolicyLabel: 'deep policy reasoning',
      outputTarget: 'memo_studio',
      exportBlocked: true,
    });
    expect(summary.degradedStates).toEqual(expect.arrayContaining([
      'no live grounding',
      'worker queued',
      '1 unsupported claim',
    ]));
    expect(summary.improvementActions).toContain('Attach stronger source receipts for unsupported claims.');
    expect(JSON.stringify(summary)).not.toMatch(/gemini|GOOGLE|Vertex/i);
  });

  it('builds an AgentRun proof summary with artifact and boardroom evidence metadata', () => {
    const summary = buildProofSummaryFromAgentRun({
      runId: 'run-boardroom',
      status: 'succeeded',
      capsuleId: 'cap-1',
      outputHref: '/app/boardroom?runId=run-boardroom&memoId=memo-1&outputCapsuleId=out-1',
      memoId: 'memo-1',
      outputCapsuleId: 'out-1',
      contextReceipt: {
        activeCapsuleOrChain: 'Somalia Humanitarian Corridor',
        selectedTools: ['context-resolve', 'boardroom-deliberation'],
        outputDestination: 'library',
        sourceCount: 3,
        groundingPosture: 'Source review requested',
        degradedReason: null,
      },
      sourceabilityLedgerSummary: {
        totalClaims: 5,
        supportedClaims: 2,
        weakClaims: 1,
        unsupportedClaims: 1,
        contradictedClaims: 0,
        modelPriorClaims: 1,
        assumptionClaims: 0,
      },
      modelPolicy: 'praxis_frontier_deep_model_policy',
    }, {
      evidenceStats: {
        sourceCount: 3,
        documentCount: 2,
        unsupportedClaimCount: 1,
      },
      confidenceDistribution: { high: 1, medium: 3, low: 1 },
      openQuestions: ['Who signs the exception?'],
    });

    expect(summary).toMatchObject({
      activeCapsule: 'Somalia Humanitarian Corridor',
      sourceCount: 3,
      documentCount: 2,
      unsupportedClaimCount: 1,
      memoId: 'memo-1',
      outputCapsuleId: 'out-1',
      modelPolicyLabel: 'deep policy reasoning',
      confidenceDistribution: { high: 1, medium: 3, low: 1 },
    });
    expect(summary.degradedStates).toContain('1 unsupported claim');
    expect(summary.improvementActions).toContain('Resolve boardroom open questions before sharing externally.');
  });

  it('labels an executed economical route without treating fallback availability as execution', () => {
    const orchestration = buildAskConversationOrchestrationReceipt({
      prompt: 'Recall the funding status using only the supplied notes. Answer directly; do not use tools or web sources.',
      intent: 'normal_answer', sourcePreviewCount: 1, activeGapCount: 0,
      contextReceipt: {
        capsuleId: 'cap-1', capsuleVersion: 2, health: 'ready', evidenceCount: 1,
        threadId: 'thread-1', traceId: 'trace-1', historyTurnCount: 0, memoryPersistence: 'firestore',
        coreRefs: { userCoreId: null, situationCoreId: null, graphCoreId: null, memoryCoreId: null, sourceDocumentCoreIds: ['doc-1'], outputCoreIds: [] }, warnings: [],
        referenceCapsuleIds: [], referenceCapsuleCount: 0, missingReferenceCapsuleIds: [], retrievalLayers: [], stages: [],
      } satisfies AskContextReceipt,
    });
    expect(orchestration.routingDecision.modelTier).toBe('fast');
    expect(orchestration.generationBudget.taskKind).toBe('cheap_classify');
    expect(modelPolicyLabelFor({
      modelTier: orchestration.routingDecision.modelTier,
      selectedModelId: orchestration.generationBudget.selectedModelId,
      lifecycleTier: 'stable_fallback', fallbackPosture: 'Stable fallback ready',
    })).toBe('economical recall and extraction');
  });

  it.each([
    ['fast', 'economical recall and extraction'],
    ['standard', 'standard policy reasoning'],
    ['deep', 'deep policy reasoning'],
    ['sourceability', 'sourceability review'],
  ])('preserves the effective %s tier for primary and actual fallback execution', (modelTier, label) => {
    expect(modelPolicyLabelFor({ modelTier, lifecycleTier: 'stable_fallback' })).toBe(label);
    expect(modelPolicyLabelFor({ modelTier, fallbackPosture: 'fallback' })).toBe(`${label} (fallback)`);
  });

  it('uses the executed fallback receipt in an Ask proof summary', () => {
    const summary = buildProofSummaryFromAskEnvelope({
      orchestrationReceipt: { routingDecision: { modelTier: 'deep' } },
      generationReceipt: { selectedModel: 'gemini-2.5-pro', fallbackModel: 'gemini-3.1-pro-preview' },
    });
    expect(summary.modelPolicyLabel).toBe('deep policy reasoning (fallback)');
  });

  it('preserves actual fallback proof for historical turns without a generation receipt', () => {
    expect(buildProofSummaryFromAskEnvelope({}, {
      selectedModelId: 'gemini-2.5-pro', fallbackPosture: 'fallback',
    }).modelPolicyLabel).toBe('deep policy reasoning (fallback)');
    expect(buildProofSummaryFromAskEnvelope({}, {
      selectedModelId: 'gemini-2.5-pro', lifecycleTier: 'stable_fallback',
    }).modelPolicyLabel).toBe('deep policy reasoning');
  });

  it('uses effective economical routing when its actual fallback model also serves deep tasks', () => {
    expect(modelPolicyLabelFor({
      selectedModelId: 'gemini-2.5-flash', modelTier: 'fast', fallbackPosture: 'fallback',
    })).toBe('economical recall and extraction (fallback)');
  });

  it('includes grounding verifier coverage and flagged spans in proof metadata', () => {
    const summary = buildProofSummaryFromAgentRun({
      runId: 'run-grounding',
      status: 'succeeded',
      capsuleId: 'cap-1',
      groundingVerification: {
        groundedClaims: [{
          text: 'Supported claim.',
          start: 0,
          end: 16,
          claimCardIds: ['CL-1'],
          sourceReceiptIds: ['SR-1'],
          graphPathIds: [],
          matchReasons: ['explicit_claim_id'],
        }],
        ungroundedSpans: [{
          text: 'Unsupported claim.',
          start: 17,
          end: 35,
          reason: 'no_packet_binding',
          claimCardIds: [],
          sourceReceiptIds: [],
          graphPathIds: [],
        }],
        contradictedSpans: [{
          text: 'Contradicted claim.',
          start: 36,
          end: 55,
          reason: 'contradicted_by_capsule',
          claimCardIds: ['CL-2'],
          sourceReceiptIds: ['SR-2'],
          graphPathIds: [],
        }],
        coverageScore: 0.333,
        notes: ['1 of 3 decision-relevant claim spans grounded.'],
      },
    });

    expect(summary.groundingVerification).toMatchObject({
      coverageScore: 0.333,
      groundedClaimCount: 1,
      totalClaimCount: 3,
      ungroundedSpanCount: 1,
      contradictedSpanCount: 1,
      flaggedSpans: [
        { text: 'Unsupported claim.', reason: 'no_packet_binding' },
        { text: 'Contradicted claim.', reason: 'contradicted_by_capsule', claimCardIds: ['CL-2'] },
      ],
    });
    expect(summary.degradedStates).toContain('2 grounding verifier flags');
    expect(summary.exportBlocked).toBe(true);
    expect(summary.unsupportedClaimCount).toBe(0);
  });

  it('blocks unknown generated review without inflating the input-evidence unsupported count', async () => {
    const outputReview = await buildMemoOutputReview({ body: 'A draft.', report: null, verifierStatus: 'disabled' });
    const summary = buildProofSummaryFromAgentRun({ status: 'succeeded', memoId: 'memo-1',
      sourceabilityLedgerSummary: { totalClaims: 3, supportedClaims: 3, unsupportedClaims: 0 }, outputReview });
    expect(summary).toMatchObject({ outputReview, exportBlocked: true, unsupportedClaimCount: 0,
      sourceabilityScope: 'input_evidence' });
    expect(summary.degradedStates).toContain('generated memo review required');
  });

  it('blocks legacy generated memos with missing or empty verification', () => {
    for (const groundingVerification of [undefined, { groundedClaims: [], ungroundedSpans: [], contradictedSpans: [], coverageScore: 1 }]) {
      expect(buildProofSummaryFromAgentRun({ policyAgentId: 'research-memo', memoId: 'memo-old',
        groundingVerification, sourceabilityLedgerSummary: { unsupportedClaims: 0 } }).exportBlocked).toBe(true);
    }
  });
});
