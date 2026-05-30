import { describe, expect, it } from 'vitest';
import { buildCapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';

const capsule = {
  capsuleId: 'cap-ai-governance',
  label: 'Federal AI Governance File',
  scope: 'user' as const,
  version: 7,
  summary: 'Tracks federal AI governance sources, claims, agency actors, and memo outputs.',
  updatedAt: '2026-05-29T12:00:00.000Z',
  activeForSituationIds: ['sit-ai'],
  activeOntologyStackId: 'aco:base/us-federal-ai',
  latestGateState: 'proposed',
  coreRefs: {
    userCoreId: 'user-policy-lead',
    situationCoreId: 'sit-ai-governance',
    pathCoreId: 'domestic-policy-analysis',
    sourceCoreIds: ['src-omb-memo', 'src-nist-rmf'],
    documentCoreIds: ['doc-eo-14110'],
    graphCoreId: 'graph-ai-governance',
    timeCoreId: 'time-2026-rulemaking',
    toolCoreIds: ['sourceability', 'stakeholder-map'],
    objectiveCoreIds: ['objective-options'],
    outputCoreIds: ['out-options-memo'],
    productCoreIds: ['product-policy-memo'],
    memoryCoreId: 'memory-reviewer-caveats',
  },
  health: {
    score: 72,
    warnings: ['Date-check agency guidance before external use.', 'Unsupported claim: procurement timing remains thin.'],
    blockers: ['Missing primary source for one procurement claim.'],
  },
  trust: { level: 'review', score: 68, label: 'Review before export' },
  community: {
    tags: ['domain:domestic-policy-analysis', 'policy-team:legal-compliance', 'type:policy-memo'],
    favorite: true,
  },
  access: { visibility: 'private' as const, allowDownload: true, allowClone: true },
  readinessSummary: {
    sourceBacked: true,
    graphLinked: true,
    advisoryMemoryHitCount: 2,
    graphProposalCount: 1,
    reviewCardCount: 3,
    reviewRequired: true,
  },
};

describe('buildCapsuleWorkbenchViewModel', () => {
  it('turns a capsule into a structured workbench with graph, ontology, tacit knowledge, agents, and review posture', () => {
    const model = buildCapsuleWorkbenchViewModel({
      capsule,
      repositoryDocuments: [
        { id: 'doc-eo-14110', title: 'Executive Order 14110', status: 'indexed', chunkCount: 18, fileType: 'pdf' },
      ],
      agentRuns: [
        {
          runId: 'run-sourceability',
          status: 'completed',
          objective: 'Check sourceability before opening the policy memo draft.',
          policyAgentLabel: 'Sourceability reviewer',
          createdAt: '2026-05-29T13:00:00.000Z',
          outputHref: '/app/write?memoId=memo-1',
        },
      ],
      tacitMemories: [
        {
          id: 'mem-reviewer',
          type: 'working_assumption',
          summary: 'Reviewer prefers primary-source caveats before recommendations.',
          detail: 'Use agency source posture before making procurement claims.',
          confidence: 0.82,
          tags: ['reviewer-caveat'],
          lastUsedAt: null,
        },
      ],
      reviewCards: [
        { id: 'review-graph', title: 'Review proposed procurement timing edge', target: 'graphProposal', state: 'proposed' },
      ],
    });

    expect(model.title).toBe('Federal AI Governance File');
    expect(model.readiness.score).toBe(72);
    expect(model.summaryFacts.nextAction).toContain('Date-check agency guidance');
    expect(model.anatomy.map((core) => core.kind)).toEqual([
      'user',
      'situation',
      'path',
      'source',
      'document',
      'graph',
      'time',
      'tool',
      'objective',
      'product',
      'output',
      'memory',
    ]);
    expect(model.evidence.sourceCount).toBe(3);
    expect(model.evidence.unsupportedClaims).toContain('procurement timing remains thin.');
    expect(model.graph.nodes.some((node) => node.type === 'agent' && node.label === 'Sourceability reviewer')).toBe(true);
    expect(model.graph.nodes.some((node) => node.reviewState === 'proposed')).toBe(true);
    expect(model.ontology.active.some((item) => item.id === 'domestic-policy-analysis')).toBe(true);
    expect(model.tacitKnowledge.items[0]?.summary).toContain('primary-source caveats');
    expect(model.agents.recentRuns[0]?.status).toBe('completed');
    expect(model.reviewQueue[0]).toMatchObject({ target: 'graphProposal', state: 'proposed' });
  });

  it('keeps sparse capsules legible and review-gated instead of rendering an empty mess', () => {
    const model = buildCapsuleWorkbenchViewModel({
      capsule: {
        capsuleId: 'cap-empty',
        label: 'No Source File',
        scope: 'user' as const,
        version: 1,
        updatedAt: '2026-05-29T12:00:00.000Z',
        coreRefs: {},
        health: { warnings: [] },
      },
    });

    expect(model.evidence.sourcePosture).toBe('No source receipts attached yet.');
    expect(model.anatomy.filter((core) => core.status === 'missing').length).toBeGreaterThan(0);
    expect(model.graph.nodes.some((node) => node.type === 'gap')).toBe(true);
    expect(model.reviewQueue.some((item) => item.target === 'sourceGap')).toBe(true);
    expect(model.summaryFacts.nextAction).toBe('Attach sources or create a source-gap review card.');
  });
});
