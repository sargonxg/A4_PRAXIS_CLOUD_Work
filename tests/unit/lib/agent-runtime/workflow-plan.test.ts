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

  it('makes triage and source-check lanes explicit for current research workflows', () => {
    const plan = buildAgentWorkflowPlan({
      prompt: 'Prepare a current multi-source policy memo.',
      runIntent: 'research_memo',
      policyAgentId: 'research-memo',
      selectedToolIds: ['context-resolve', 'grounded-search', 'sourceability-reviewer', 'policy-memo'],
      capsuleReadReceipt: receipt(),
    });

    expect(plan.workflowKind).toBe('current_research_brief');
    expect(plan.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'triage-decision',
        label: 'Triage decision',
        status: 'complete',
        lane: 'triage',
      }),
      expect.objectContaining({
        id: 'source-check',
        label: 'Source check',
        status: 'pending',
        agentId: 'source-checker',
        toolId: 'sourceability-reviewer',
        lane: 'sourceability',
      }),
    ]));
  });

  it('shows selected specialist roster agents as workflow steps', () => {
    const plan = buildAgentWorkflowPlan({
      prompt: 'Compare these two positions and surface ACO conflict dynamics.',
      runIntent: 'difference_check',
      policyAgentId: 'difference-checker',
      selectedToolIds: ['context-resolve', 'capsule-evidence-pack', 'document-retrieve', 'sourceability-reviewer', 'red-team-review'],
      capsuleReadReceipt: receipt(),
    });

    expect(plan.workflowKind).toBe('multi_agent_review');
    expect(plan.requiredPolicyAgentIds).toEqual(expect.arrayContaining([
      'difference-checker',
      'sourceability-reviewer',
      'red-team-analyst',
    ]));
    expect(plan.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'agent-difference-checker',
        label: 'Difference Checker',
        agentId: 'difference-checker',
        lane: 'agent',
      }),
    ]));
  });

  it('routes media summarization through long-context document workflow planning', () => {
    const plan = buildAgentWorkflowPlan({
      prompt: 'Summarize this transcript into source-cited claims.',
      runIntent: 'media_summary',
      policyAgentId: 'media-summarizer',
      selectedToolIds: ['context-resolve', 'capsule-evidence-pack', 'document-retrieve', 'sourceability-reviewer'],
      capsuleReadReceipt: receipt(),
    });

    expect(plan.workflowKind).toBe('current_research_brief');
    expect(plan.requiredPolicyAgentIds).toEqual(expect.arrayContaining([
      'media-summarizer',
      'sourceability-reviewer',
    ]));
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
