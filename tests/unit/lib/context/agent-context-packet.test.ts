import { describe, expect, it } from 'vitest';
import {
  buildAgentContextPacket,
  shouldEnableAgentContextPacket,
} from '@/lib/context/agent-context-packet';
import { selectAgentContextSubgraph } from '@/lib/context/agent-context-salience';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

const requestTime = '2026-06-24T12:00:00.000Z';

describe('agent context graph packet', () => {
  it('emits deterministic Packet v1 text with the exact ten sections in order', () => {
    const capsule = makeCapsule();

    const first = buildAgentContextPacket({
      capsule,
      userQuery: 'Draft an options memo on humanitarian access constraints.',
      budgetTier: 'standard',
      requestTime,
      turnId: 'trace-1',
    });
    const second = buildAgentContextPacket({
      capsule,
      userQuery: 'Draft an options memo on humanitarian access constraints.',
      budgetTier: 'standard',
      requestTime,
      turnId: 'trace-1',
    });

    expect(first.packetText).toBe(second.packetText);
    expect(sectionHeadings(first.packetText)).toEqual([
      '### 1. Task Lens',
      '### 2. Active Ontology Contract',
      '### 3. Salience Ledger',
      '### 4. Source Receipt Index',
      '### 5. Claim Cards',
      '### 6. Incident Neighborhoods',
      '### 7. Reasoning Paths',
      '### 8. Temporal Frame',
      '### 9. Causal Chains',
      '### 10. Agent Use Instructions',
    ]);
    expect(first.packetText).toContain('packet_id: capsule:cap-agent-context:turn:trace-1:graph-packet-v1');
    expect(first.packetText).toContain('[CL-1] text=Humanitarian access is constrained by checkpoint delays.');
    expect(first.packetText).toContain('allowed_edge_types:');
  });

  it('enforces budget tiers with omitted-context receipts instead of silent truncation', () => {
    const capsule = makeCapsule({
      claimLedger: Array.from({ length: 16 }, (_, index) => ({
        claimId: `claim-${index + 1}`,
        text: `Checkpoint delay claim ${index + 1}`,
        support: 'supported',
        sourceRefIds: ['src-reliefweb'],
        receipts: [{ sourceId: 'src-reliefweb', snippet: `Receipt for claim ${index + 1}` }],
      })),
    });

    const result = buildAgentContextPacket({
      capsule,
      userQuery: 'Which checkpoint claims matter for access?',
      budgetTier: 'standard',
      requestTime,
      turnId: 'trace-budget',
    });

    expect(result.selected.claims).toHaveLength(12);
    expect(result.omitted.some((item) => item.reason === 'budget' && item.id.includes('claim-13'))).toBe(true);
    expect(result.packetText).toContain('selected_counts:');
    expect(result.packetText).toContain('reason=budget');
  });

  it('caps inferred causal confidence unless directly source-stated and reviewed', () => {
    const result = buildAgentContextPacket({
      capsule: makeCapsule({
        embeddedGraph: {
          nodes: baseNodes(),
          edges: [{
            id: 'edge-inferred-cause',
            source: 'event-checkpoint-delay',
            target: 'claim-access-constrained',
            label: 'causes',
            relationshipType: 'causes',
            reviewState: 'reviewed',
            confidence: 0.94,
            confidenceKind: 'INFERRED',
            sourceReceiptIds: ['src-reliefweb'],
          }],
        },
        causality: {
          causalLinks: [{
            id: 'causal-inferred',
            cause: 'event-checkpoint-delay',
            effect: 'claim-access-constrained',
            relation: 'causes',
            evidenceRefs: ['src-reliefweb'],
            confidence: 0.94,
            caveat: 'Assessed from sequence, not directly stated.',
          }],
        },
      }),
      userQuery: 'What caused the access constraint?',
      budgetTier: 'standard',
      requestTime,
      turnId: 'trace-confidence',
    });

    expect(result.selected.edges.find((edge) => edge.id === 'edge-inferred-cause')?.confidence).toBe(0.75);
    expect(result.packetText).toContain('[C-1] relation=causes; confidence=0.75');
    expect(result.packetText).toContain('caveat: Assessed from sequence, not directly stated.');
  });

  it('omits unsupported rows lacking receipts unless they are advisory, missing, schema, or user-provided', () => {
    const selection = selectAgentContextSubgraph({
      capsule: makeCapsule({
        embeddedGraph: {
          nodes: [
            ...baseNodes(),
            {
              id: 'claim-unsourced',
              label: 'Unsourced operational claim',
              entityType: 'Claim',
              reviewState: 'reviewed',
              confidence: 0.8,
              sourceReceiptIds: [],
            },
            {
              id: 'claim-advisory-gap',
              label: 'Advisory evidence gap',
              entityType: 'EvidenceGap',
              reviewState: 'advisory',
              confidence: 0.4,
              sourceReceiptIds: [],
            },
          ],
          edges: [],
        },
      }),
      userQuery: 'Review access evidence gaps.',
      budgetTier: 'standard',
      requestTime,
    });

    expect(selection.nodes.map((node) => node.id)).not.toContain('claim-unsourced');
    expect(selection.nodes.map((node) => node.id)).toContain('claim-advisory-gap');
    expect(selection.omitted).toContainEqual(expect.objectContaining({
      id: 'claim-unsourced',
      reason: 'unsupported',
    }));
  });

  it('prioritizes contradictions and negative evidence before low-value duplicates', () => {
    const selection = selectAgentContextSubgraph({
      capsule: makeCapsule({
        embeddedGraph: {
          nodes: baseNodes(),
          edges: [
            {
              id: 'edge-duplicate-support',
              source: 'event-checkpoint-delay',
              target: 'claim-access-constrained',
              label: 'supports claim',
              relationshipType: 'supports_claim',
              reviewState: 'reviewed',
              confidence: 0.91,
              sourceReceiptIds: ['src-reliefweb'],
            },
            {
              id: 'edge-contradiction',
              source: 'claim-counterevidence',
              target: 'claim-access-constrained',
              label: 'contradicts claim',
              relationshipType: 'contradicts_claim',
              reviewState: 'reviewed',
              confidence: 0.82,
              sourceReceiptIds: ['src-ocha'],
            },
          ],
        },
      }),
      userQuery: 'What conflicts with the access claim?',
      budgetTier: 'tiny',
      requestTime,
    });

    expect(selection.edges[0]?.id).toBe('edge-contradiction');
  });

  it('falls back gracefully when the capsule has no embedded graph', () => {
    const result = buildAgentContextPacket({
      capsule: makeCapsule({ embeddedGraph: { nodes: [], edges: [] }, claimLedger: [] }),
      userQuery: 'Summarize the capsule.',
      budgetTier: 'tiny',
      requestTime,
      turnId: 'trace-empty',
    });

    expect(result.packetText).toContain('no graph evidence yet');
    expect(result.packetText).toContain('### 2. Active Ontology Contract');
    expect(result.selected.nodes).toEqual([]);
    expect(result.selected.edges).toEqual([]);
  });

  it('defaults the injection flag on and accepts explicit disable values', () => {
    expect(shouldEnableAgentContextPacket(undefined)).toBe(true);
    expect(shouldEnableAgentContextPacket('')).toBe(true);
    expect(shouldEnableAgentContextPacket('0')).toBe(false);
    expect(shouldEnableAgentContextPacket('false')).toBe(false);
    expect(shouldEnableAgentContextPacket('off')).toBe(false);
  });
});

function sectionHeadings(packetText: string): string[] {
  return packetText.split('\n').filter((line) => /^### \d+\./.test(line));
}

function makeCapsule(overrides: Record<string, unknown> = {}): PraxisCapsule {
  return {
    capsuleId: 'cap-agent-context',
    ownerUid: 'u1',
    scope: 'user',
    summary: 'Humanitarian access capsule.',
    parentCapsuleId: null,
    forkedFromVersion: null,
    associatedCapsuleIds: [],
    coreRefs: {
      userCoreId: 'user-policy-director',
      teamCoreId: null,
      situationCoreId: 'sit-humanitarian-access',
      pathCoreId: null,
      sourceCoreIds: ['src-reliefweb', 'src-ocha'],
      documentCoreIds: [],
      graphCoreId: 'graph-access',
      timeCoreId: 'time-access',
      outputCoreIds: ['options-memo'],
      toolCoreIds: ['sourceability'],
      objectiveCoreIds: ['draft-options'],
      productCoreIds: [],
      memoryCoreId: null,
    },
    retrievalPolicy: { layers: ['capsules'], limit: 8, checkFreshness: true, freshnessWindowDays: 90 },
    health: { score: 84, warnings: [] },
    activeForSituationIds: ['sit-humanitarian-access'],
    lockedCoreKinds: [],
    provenance: { createdBy: 'u1', updatedBy: 'u1', source: 'test' },
    access: { visibility: 'private', canShare: false },
    community: { forkCount: 0, reuseCount: 0, rating: null },
    trust: { level: 'green', reasons: [] },
    activeOntologyStackId: 'ontology-stack-humanitarian',
    activeReadContractId: 'read-contract-1',
    latestGateState: 'owner_review',
    readinessSummary: {
      advisoryMemoryHitCount: 0,
      graphProposalCount: 0,
      reviewCardCount: 1,
      reviewRequired: true,
    },
    sourceRefs: [
      {
        sourceId: 'src-reliefweb',
        label: 'ReliefWeb access update',
        url: 'https://reliefweb.int/report/example',
        publisher: 'ReliefWeb',
        date: '2026-06-20',
        reliabilityTier: 1,
        stale: false,
      },
      {
        sourceId: 'src-ocha',
        label: 'OCHA access note',
        url: 'https://www.unocha.org/example',
        publisher: 'OCHA',
        date: '2026-06-18',
        reliabilityTier: 1,
        stale: false,
      },
    ],
    claimLedger: [{
      claimId: 'claim-access-constrained',
      text: 'Humanitarian access is constrained by checkpoint delays.',
      support: 'supported',
      sourceRefIds: ['src-reliefweb'],
      receipts: [{
        sourceId: 'src-reliefweb',
        snippet: 'Checkpoint delays continue to constrain aid movement.',
        stance: 'supports',
        confidence: 0.88,
      }],
      validFrom: '2026-06-18',
      validUntil: null,
      asOf: '2026-06-20',
    }],
    temporality: {
      asOf: '2026-06-20T00:00:00.000Z',
      validFrom: '2026-06-18T00:00:00.000Z',
      validUntil: null,
      timelineAnchors: [{
        id: 'timeline-delay',
        label: 'Checkpoint delays reported',
        date: '2026-06-20',
        kind: 'event',
        sourceRefs: ['src-reliefweb'],
        confidence: 0.88,
      }],
    },
    causality: {
      causalLinks: [{
        id: 'causal-access',
        cause: 'event-checkpoint-delay',
        effect: 'claim-access-constrained',
        relation: 'causes',
        evidenceRefs: ['src-reliefweb'],
        confidence: 0.72,
        caveat: 'Reported sequence supports causality but needs review.',
      }],
    },
    ontologyBinding: {
      domainId: 'humanitarian',
      taxonomyPath: ['access', 'constraints'],
      ontologyIds: ['humanitarian', 'governance'],
      acoPrimitives: ['Actor', 'Claim', 'Event', 'Constraint', 'Commitment'],
      bindingRationale: 'Use humanitarian ontology for access constraints.',
    },
    embeddedGraph: {
      nodes: baseNodes(),
      edges: [{
        id: 'edge-supports-access',
        source: 'event-checkpoint-delay',
        target: 'claim-access-constrained',
        label: 'supports claim',
        relationshipType: 'supports_claim',
        reviewState: 'reviewed',
        confidence: 0.88,
        confidenceKind: 'EXTRACTED',
        sourceReceiptIds: ['src-reliefweb'],
        recordedAt: '2026-06-20T12:00:00.000Z',
      }],
    },
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T12:00:00.000Z',
    archivedAt: null,
    schemaVersion: 3,
    version: 4,
    label: 'Humanitarian Access Watch',
    ...overrides,
  } as unknown as PraxisCapsule;
}

function baseNodes() {
  return [
    {
      id: 'actor-ocha',
      label: 'OCHA',
      entityType: 'Actor',
      reviewState: 'canonical',
      confidence: 0.93,
      confidenceKind: 'EXTRACTED',
      sourceReceiptIds: ['src-ocha'],
      recordedAt: '2026-06-18T00:00:00.000Z',
    },
    {
      id: 'event-checkpoint-delay',
      label: 'Checkpoint delays reported',
      entityType: 'Event',
      reviewState: 'reviewed',
      confidence: 0.88,
      confidenceKind: 'EXTRACTED',
      sourceReceiptIds: ['src-reliefweb'],
      recordedAt: '2026-06-20T00:00:00.000Z',
    },
    {
      id: 'claim-access-constrained',
      label: 'Humanitarian access is constrained by checkpoint delays.',
      entityType: 'Claim',
      reviewState: 'reviewed',
      confidence: 0.88,
      confidenceKind: 'EXTRACTED',
      sourceReceiptIds: ['src-reliefweb'],
      recordedAt: '2026-06-20T00:00:00.000Z',
    },
    {
      id: 'claim-counterevidence',
      label: 'Some corridors remained open during the same period.',
      entityType: 'Claim',
      reviewState: 'reviewed',
      confidence: 0.82,
      confidenceKind: 'EXTRACTED',
      sourceReceiptIds: ['src-ocha'],
      recordedAt: '2026-06-20T00:00:00.000Z',
    },
  ];
}
