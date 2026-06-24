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
    expect(model.graph.nodes.some((node) => node.type === 'boundary' && /unsupported claims/i.test(node.label))).toBe(true);
    expect(model.graph.stats).toMatchObject({
      totalNodes: model.graph.nodes.length,
      totalEdges: model.graph.edges.length,
      sourceBackedClaims: 0,
      unsupportedClaims: 1,
      boundaryNodes: expect.any(Number),
      reviewGatedNodes: expect.any(Number),
      provenanceCoveragePct: expect.any(Number),
    });
    expect(model.graph.stats.boundaryNodes).toBeGreaterThanOrEqual(3);
    expect(model.graph.stats.provenanceCoveragePct).toBeGreaterThan(70);
    expect(model.ontology.active.some((item) => item.id === 'domestic-policy-analysis')).toBe(true);
    expect(model.ontology.active.find((item) => item.id === 'domestic-policy-analysis')).toMatchObject({
      primitiveCoverage: expect.arrayContaining(['Actor', 'Claim', 'Interest', 'Constraint', 'Leverage', 'Commitment', 'Event', 'Narrative']),
      missingPrimitives: [],
      coverageRatio: 1,
      validatorSummary: expect.objectContaining({
        warnings: 0,
        total: expect.any(Number),
      }),
    });
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
    expect(model.coreSourceability.find((gate) => gate.kind === 'source')).toMatchObject({
      sourceCoverageScore: 0,
      readyBlocked: true,
      evidenceGapCount: expect.any(Number),
    });
    expect(model.coreSourceability.find((gate) => gate.kind === 'output')?.unsupportedClaimCount).toBeGreaterThanOrEqual(0);
    expect(model.graph.nodes.some((node) => node.type === 'gap')).toBe(true);
    expect(model.reviewQueue.some((item) => item.target === 'sourceGap')).toBe(true);
    expect(model.summaryFacts.nextAction).toBe('Attach sources or create a source-gap review card.');
  });

  it('surfaces per-core sourceability gates for the five editable capsule cores', () => {
    const model = buildCapsuleWorkbenchViewModel({
      capsule: {
        ...capsule,
        sourceRefs: [{ sourceId: 'src-omb-memo', label: 'OMB memo' }],
        claimLedger: [
          { claimId: 'claim-supported', text: 'OMB issued guidance.', support: 'supported', sourceRefIds: ['src-omb-memo'] },
          { claimId: 'claim-unsupported', text: 'Procurement timing is resolved.', support: 'unsupported', sourceRefIds: [] },
        ],
      },
      repositoryDocuments: [{ id: 'doc-eo-14110', title: 'Executive Order 14110', status: 'indexed' }],
    });

    expect(model.coreSourceability.map((gate) => gate.kind)).toEqual(['user', 'situation', 'source', 'document', 'output']);
    expect(model.coreSourceability.find((gate) => gate.kind === 'source')).toMatchObject({
      sourceCoverageScore: expect.any(Number),
      unsupportedClaimCount: 1,
      readyBlocked: true,
      unsupportedClaims: expect.arrayContaining(['Procurement timing is resolved.']),
    });
    expect(model.coreSourceability.find((gate) => gate.kind === 'document')).toMatchObject({
      evidenceGapCount: 0,
      sourceCoverageScore: expect.any(Number),
    });
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
    expect(model.graph.stats.sourceBackedClaims).toBe(90);
    expect(model.graph.stats.temporalNodes).toBeGreaterThanOrEqual(1);
    expect(model.graph.stats.densityLabel).toMatch(/living graph|dense/i);
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

  it('builds the four-pillar legibility model with timeline, causal chains, quality fixes, and receipted claims', () => {
    const model = buildCapsuleWorkbenchViewModel({
      capsule: {
        ...capsule,
        capsuleId: 'cap-access-legibility',
        label: 'Humanitarian Access Decision Capsule',
        summary: 'Tracks access claims, validity, causal drivers, and donor memo outputs.',
        sourceRefs: [
          {
            sourceId: 'access-note',
            label: 'Access constraints note',
            url: 'https://example.org/access-note',
            publisher: 'Relief coordination unit',
            date: '2026-06-01',
            reliabilityTier: 2,
          },
        ],
        claimLedger: [
          {
            claimId: 'access-required',
            text: 'A current deconfliction channel is required before convoy movement.',
            support: 'supported',
            sourceRefIds: ['access-note'],
            validFrom: '2026-06-01',
            validUntil: '2026-06-15',
            asOf: '2026-06-01',
            causalLinks: {
              escalates: ['route-clearance-risk'],
            },
            receipts: [
              {
                sourceId: 'access-note',
                url: 'https://example.org/access-note',
                publisher: 'Relief coordination unit',
                date: '2026-06-01',
                reliabilityTier: 2,
                snippet: 'The current deconfliction channel is required.',
                page: 4,
                confidence: 0.86,
                stance: 'supports',
              },
            ],
          },
        ],
        temporality: {
          timelineAnchors: [
            {
              id: 'decision-window-open',
              label: 'Decision window opens',
              date: '2026-06-01',
              kind: 'validity-start',
              sourceRefs: ['access-note'],
              confidence: 0.8,
            },
          ],
          asOf: '2026-06-01',
          validFrom: '2026-06-01',
          validUntil: '2026-06-15',
        },
        causality: {
          causalLinks: [
            {
              id: 'late-notification-risk',
              cause: 'Late notification',
              effect: 'Route clearance risk increases',
              relation: 'escalates',
              evidenceRefs: ['access-note'],
              confidence: 0.74,
            },
          ],
        },
      },
    });

    expect(model.pillars.map((pillar) => pillar.id)).toEqual(['situation', 'users', 'tools', 'output']);
    expect(model.pillars.find((pillar) => pillar.id === 'situation')?.sections).toEqual(expect.arrayContaining([
      'Claim ledger',
      'Timeline',
      'Causal chain',
    ]));
    expect(model.timeline.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'decision-window-open',
        label: 'Decision window opens',
        start: '2026-06-01',
        group: 'validity-start',
        nodeIds: expect.arrayContaining(['source:access-note']),
      }),
      expect.objectContaining({
        id: 'claim-validity-access-required',
        label: 'A current deconfliction channel is required before convoy movement.',
        start: '2026-06-01',
        end: '2026-06-15',
        nodeIds: expect.arrayContaining(['claim:access-required']),
      }),
    ]));
    expect(model.causalChains).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'late-notification-risk',
        cause: 'Late notification',
        effect: 'Route clearance risk increases',
        relation: 'escalates',
        direction: 'escalation',
        nodeIds: expect.arrayContaining(['source:access-note']),
      }),
    ]));
    expect(model.quality.sections).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'source_support',
        fixTarget: expect.objectContaining({ target: 'claimLedger', label: 'Fix this' }),
      }),
      expect.objectContaining({
        id: 'freshness',
        fixTarget: expect.objectContaining({ target: 'sourceGap', label: 'Fix this' }),
      }),
    ]));
    expect(model.claims[0]).toMatchObject({
      claimId: 'access-required',
      support: 'supported',
      validFrom: '2026-06-01',
      validUntil: '2026-06-15',
      receipts: [
        {
          sourceId: 'access-note',
          snippet: 'The current deconfliction channel is required.',
          date: '2026-06-01',
          reliabilityTier: 2,
          confidence: 0.86,
          stance: 'supports',
        },
      ],
    });
  });
});
