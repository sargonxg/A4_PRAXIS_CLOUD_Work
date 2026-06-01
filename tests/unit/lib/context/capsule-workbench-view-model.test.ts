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

  it('keeps the full living graph model instead of truncating to a preview subset', () => {
    const sourceRefs = Array.from({ length: 90 }, (_, index) => ({
      id: `source-${index + 1}`,
      title: `Source ${index + 1}`,
    }));
    const claimLedger = Array.from({ length: 90 }, (_, index) => ({
      id: `claim-${index + 1}`,
      text: `Claim ${index + 1}`,
      status: index % 3 === 0 ? 'unsupported' : index % 3 === 1 ? 'weak' : 'supported',
      sourceIds: [`source-${index + 1}`],
    }));

    const model = buildCapsuleWorkbenchViewModel({
      capsule: {
        capsuleId: 'cap-living-graph',
        label: 'Living graph capsule',
        summary: 'A capsule with enough sources and claims to require graph exploration.',
        version: 3,
        sourceRefs,
        claimLedger,
        coreRefs: {
          situationCoreId: 'situation-core',
          sourceCoreIds: sourceRefs.map((source) => source.id),
          graphCoreId: 'graph-core',
          outputCoreIds: ['policy-memo'],
        },
        readiness: {
          score: 82,
          tier: 'green',
          diagnostics: ['Ready for sourced drafting.'],
        },
        trust: {
          level: 'green',
          score: 82,
          label: 'Source-backed',
        },
      },
      repositoryDocuments: Array.from({ length: 12 }, (_, index) => ({
        id: `doc-${index + 1}`,
        title: `Document ${index + 1}`,
        status: 'ready',
      })),
      agentRuns: Array.from({ length: 8 }, (_, index) => ({
        runId: `run-${index + 1}`,
        status: 'succeeded',
        policyAgentLabel: 'Research memo agent',
        objective: `Run objective ${index + 1}`,
      })),
    });

    expect(model.graph.nodes.length).toBeGreaterThan(150);
    expect(model.graph.edges.length).toBeGreaterThan(150);
    expect(model.graph.nodes.some((node) => node.id === 'source:source-72')).toBe(true);
    expect(model.graph.nodes.some((node) => node.id === 'claim:claim-73')).toBe(true);
    expect(model.graph.edges.some((edge) => edge.source === 'claim:claim-73' && edge.target === 'source:source-73')).toBe(true);
  });

  it('reads GraphLite advisory projections into the capsule embedded graph display', () => {
    const capsuleWithProjection = {
      ...capsule,
      graphLiteProjection: {
        provider: 'graphlite',
        projectionId: 'cap-ai-governance-graphlite-starter-projection',
        status: 'compiled-advisory',
        namedGraph: 'capsule_cap_ai_governance',
        advisoryOnly: true,
        canonicalStore: 'Firestore ContextCapsules',
        promotionGate: 'Human review-card approval required before canonical graph promotion.',
        nodeCount: 2,
        edgeCount: 1,
        nodes: [
          { id: 'actor-omb', label: 'OMB', entityType: 'Actor', reviewState: 'proposed', sourceReceiptIds: ['src-omb-memo'] },
          { id: 'claim-review', label: 'Review gate required', entityType: 'Claim', reviewState: 'proposed', sourceReceiptIds: ['src-omb-memo'] },
        ],
        edges: [
          { id: 'omb-review', source: 'actor-omb', target: 'claim-review', label: 'supports', relationshipType: 'supports_claim', reviewState: 'proposed' },
        ],
      },
    };

    const model = buildCapsuleWorkbenchViewModel({ capsule: capsuleWithProjection });

    expect(model.graph.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'graphlite:cap-ai-governance-graphlite-starter-projection',
        label: 'GraphLite advisory projection',
        reviewState: 'advisory',
      }),
      expect.objectContaining({
        id: 'graphlite:actor-omb',
        label: 'OMB',
        provenance: 'GraphLite advisory projection',
      }),
    ]));
    expect(model.graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'graphlite-edge:omb-review',
        source: 'graphlite:actor-omb',
        target: 'graphlite:claim-review',
        reviewState: 'advisory',
      }),
    ]));
  });

  it('reads v3 grounding embeddedGraph projections into the capsule graph display', () => {
    const capsuleWithGroundingProjection = {
      ...capsule,
      grounding: {
        embeddedGraph: {
          provider: 'graphlite',
          projectionId: 'cap-ai-governance-grounding-projection',
          status: 'compiled-advisory',
          namedGraph: 'capsule_cap_ai_governance',
          advisoryOnly: true,
          canonicalStore: 'Firestore ContextCapsules',
          promotionGate: 'Human review-card approval required before canonical graph promotion.',
          nodeCount: 2,
          edgeCount: 1,
          nodes: [
            { id: 'domain:governance-rule-of-law', label: 'Governance & Rule of Law', entityType: 'Ontology', reviewState: 'advisory' },
            { id: 'timeline-anchor:primary', label: 'Review window', entityType: 'Event', reviewState: 'advisory' },
          ],
          edges: [
            {
              id: 'capsule-timeline-anchor',
              source: 'domain:governance-rule-of-law',
              target: 'timeline-anchor:primary',
              label: 'frames review window',
              relationshipType: 'has_timeline_anchor',
              reviewState: 'advisory',
            },
          ],
        },
      },
    };

    const model = buildCapsuleWorkbenchViewModel({ capsule: capsuleWithGroundingProjection });

    expect(model.graph.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'graphlite:cap-ai-governance-grounding-projection',
        label: 'GraphLite advisory projection',
        reviewState: 'advisory',
      }),
      expect.objectContaining({
        id: 'graphlite:domain:governance-rule-of-law',
        label: 'Governance & Rule of Law',
        reviewState: 'advisory',
      }),
    ]));
    expect(model.graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'graphlite-edge:capsule-timeline-anchor',
        relationshipType: 'has_timeline_anchor',
        reviewState: 'advisory',
      }),
    ]));
  });
});
