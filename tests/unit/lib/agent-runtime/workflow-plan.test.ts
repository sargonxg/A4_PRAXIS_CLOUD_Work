import { describe, expect, it } from 'vitest';

import { buildAgentWorkflowPlan } from '@/lib/agent-runtime/workflow-plan';
import type { CapsuleReadReceipt } from '@/lib/agent-runtime/capsule-read-receipt';

describe('agent workflow plan', () => {
  it('threads v3 capsule governance agents through Capsule AI as review-card-only lanes', () => {
    const plan = buildAgentWorkflowPlan({
      prompt: 'Improve this ContextCapsule with better tacit knowledge, sources, memory, and marketplace readiness.',
      runIntent: 'capsule_factory',
      policyAgentId: 'capsule-factory',
      selectedToolIds: ['context-resolve', 'capsule-evidence-pack', 'sourceability-reviewer'],
      capsuleReadReceipt: receipt(),
    });

    expect(plan.workflowKind).toBe('capsule_governance');
    expect(plan.requiredPolicyAgentIds).toContain('capsule-factory');
    expect(plan.reviewCardOnlyAgentIds).toEqual([
      'capsule-editor-agent',
      'tacit-knowledge-interviewer',
      'source-spine-agent',
      'claim-ledger-agent',
      'cognee-memory-agent',
      'agent-operability-agent',
      'marketplace-curator-agent',
      'human-review-agent',
    ]);
    expect(plan.reviewCardTargets).toEqual([
      'advisoryMemory',
      'sourceGap',
      'graphProposal',
      'claimLedger',
      'agentInstructions',
    ]);
    expect(plan.canonicalMutationPolicy).toBe('review-card-only');
    expect(plan.processRail).toContain('Preparing review cards');
  });
});

function receipt(): CapsuleReadReceipt {
  return {
    version: 2,
    receiptId: 'receipt-1',
    readContractId: 'read-contract-1',
    capsuleId: 'cap-1',
    capsuleVersion: 3,
    evidencePackId: 'pack-1',
    builtAt: '2026-05-25T00:00:00.000Z',
    selectedCoreRefs: {
      userCoreId: null,
      situationCoreId: 'sit-1',
      graphCoreId: null,
      timeCoreId: null,
      memoryCoreId: 'memory-1',
      sourceCoreIds: ['src-1'],
      documentCoreIds: [],
      outputCoreIds: ['memo'],
      toolCoreIds: ['sourceability-reviewer'],
    },
    sourceCount: 1,
    documentCount: 0,
    sourcedParagraphCount: 0,
    memoryCount: 1,
    outputHistoryCount: 0,
    outputTarget: 'library',
    selectedTools: ['context-resolve'],
    contextGaps: ['Need source spine review.'],
    groundingPosture: 'Source review requested',
    constraints: [],
    ontologyStack: null,
    advisoryLabels: ['Cognee advisory'],
    humanGates: ['Human review required'],
    rejectedProposalWarnings: [],
    stopConditions: ['Stop before canonical mutation.'],
    outputRestrictions: ['No publish without review.'],
    allowedTools: ['context-resolve'],
  };
}
