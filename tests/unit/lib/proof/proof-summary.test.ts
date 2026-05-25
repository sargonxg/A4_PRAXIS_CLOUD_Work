import { describe, expect, it } from 'vitest';
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
    expect(modelPolicyLabelFor({ lifecycleTier: 'stable_fallback', selectedModelId: 'gemini-2.5-flash' })).toBe('standard policy reasoning (fallback)');
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
});
