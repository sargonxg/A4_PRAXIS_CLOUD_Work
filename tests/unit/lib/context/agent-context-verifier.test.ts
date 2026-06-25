import { describe, expect, it } from 'vitest';
import { verifyAgentContextGrounding } from '@/lib/context/agent-context-verifier';
import type { AgentContextGroundingMap } from '@/lib/context/agent-context-packet';
import type { SelectedAgentContext } from '@/lib/context/agent-context-salience';

describe('agent context grounding verifier', () => {
  it('grounds generated claims against packet claim cards, source receipts, and graph paths', () => {
    const report = verifyAgentContextGrounding({
      outputText: [
        'Humanitarian access is constrained by checkpoint delays [CL-1][SR-1].',
        'The access constraint follows the checkpoint event path [P-1].',
      ].join(' '),
      packet: makePacket(),
    });

    expect(report.groundedClaims).toHaveLength(2);
    expect(report.groundedClaims[0]).toMatchObject({
      claimCardIds: ['CL-1'],
      sourceReceiptIds: ['SR-1'],
      graphPathIds: [],
    });
    expect(report.groundedClaims[1]).toMatchObject({
      graphPathIds: ['P-1'],
      sourceReceiptIds: ['SR-1'],
    });
    expect(report.ungroundedSpans).toEqual([]);
    expect(report.contradictedSpans).toEqual([]);
    expect(report.coverageScore).toBe(1);
  });

  it('flags decision-relevant output sentences that do not bind to capsule evidence', () => {
    const report = verifyAgentContextGrounding({
      outputText: 'Humanitarian access is constrained by checkpoint delays. Border crossings fully reopened yesterday.',
      packet: makePacket(),
    });

    expect(report.groundedClaims).toHaveLength(1);
    expect(report.ungroundedSpans).toEqual([
      expect.objectContaining({
        text: 'Border crossings fully reopened yesterday.',
        reason: 'no_packet_binding',
      }),
    ]);
    expect(report.coverageScore).toBe(0.5);
  });

  it('flags assertions that match contradicted capsule claim cards', () => {
    const report = verifyAgentContextGrounding({
      outputText: 'Border crossings fully reopened yesterday.',
      packet: makePacket({
        claims: [
          makeClaim({
            id: 'claim-reopened',
            text: 'Border crossings fully reopened yesterday.',
            support: 'contradicted',
            contradicts: ['src-ocha'],
            sourceReceiptIds: ['src-reliefweb'],
          }),
        ],
      }),
    });

    expect(report.groundedClaims).toEqual([]);
    expect(report.ungroundedSpans).toEqual([]);
    expect(report.contradictedSpans).toEqual([
      expect.objectContaining({
        text: 'Border crossings fully reopened yesterday.',
        claimCardIds: ['CL-1'],
        sourceReceiptIds: ['SR-1', 'SR-2'],
        reason: 'contradicted_by_capsule',
      }),
    ]);
    expect(report.coverageScore).toBe(0);
  });

  it('returns a deterministic empty-capsule fallback without throwing', () => {
    const report = verifyAgentContextGrounding({
      outputText: 'Humanitarian access is constrained by checkpoint delays.',
      packet: {
        selected: emptySelected(),
        groundingMap: { nodes: {}, edges: {}, claims: {}, sources: {}, paths: {} },
      },
    });

    expect(report.groundedClaims).toEqual([]);
    expect(report.contradictedSpans).toEqual([]);
    expect(report.ungroundedSpans).toEqual([
      expect.objectContaining({ reason: 'no_packet_evidence' }),
    ]);
    expect(report.coverageScore).toBe(0);
    expect(report.notes).toContain('No packet evidence was available for grounding verification.');
  });

  it('treats empty output as fully covered because there are no claim spans', () => {
    const report = verifyAgentContextGrounding({
      outputText: '   ',
      packet: makePacket(),
    });

    expect(report.groundedClaims).toEqual([]);
    expect(report.ungroundedSpans).toEqual([]);
    expect(report.contradictedSpans).toEqual([]);
    expect(report.coverageScore).toBe(1);
  });
});

function makePacket(overrides: Partial<SelectedAgentContext> = {}): {
  selected: SelectedAgentContext;
  groundingMap: AgentContextGroundingMap;
} {
  return {
    selected: {
      ...emptySelected(),
      sources: [
        {
          id: 'src-reliefweb',
          title: 'ReliefWeb access update',
          url: 'https://example.test/reliefweb',
          publisher: 'ReliefWeb',
          date: '2026-06-20',
          reliabilityTier: 1,
          stale: false,
          excerpt: 'Checkpoint delays continue to constrain aid movement.',
          trust: 0.9,
          salienceScore: 0.9,
        },
        {
          id: 'src-ocha',
          title: 'OCHA access note',
          url: 'https://example.test/ocha',
          publisher: 'OCHA',
          date: '2026-06-21',
          reliabilityTier: 1,
          stale: false,
          excerpt: 'OCHA reported that some border crossings remained closed.',
          trust: 0.9,
          salienceScore: 0.8,
        },
      ],
      claims: [
        makeClaim({
          id: 'claim-access',
          text: 'Humanitarian access is constrained by checkpoint delays.',
          sourceReceiptIds: ['src-reliefweb'],
          linkedNodeIds: ['event-checkpoint-delay', 'claim-access'],
          linkedEdgeIds: ['edge-supports-access'],
        }),
      ],
      paths: [{
        id: 'path-access',
        purpose: 'provenance',
        nodeIds: ['event-checkpoint-delay', 'claim-access'],
        edgeIds: ['edge-supports-access'],
        whySelected: 'connects checkpoint delays to the access constraint claim',
        sourceReceiptIds: ['src-reliefweb'],
        salienceScore: 0.9,
      }],
      ...overrides,
    },
    groundingMap: {
      nodes: {
        'N-1': 'event-checkpoint-delay',
        'N-2': 'claim-access',
      },
      edges: {
        'E-1': 'edge-supports-access',
      },
      claims: {
        'CL-1': overrides.claims?.[0]?.id ?? 'claim-access',
      },
      sources: {
        'SR-1': 'src-reliefweb',
        'SR-2': 'src-ocha',
      },
      paths: {
        'P-1': ['event-checkpoint-delay', 'edge-supports-access', 'claim-access', 'src-reliefweb'],
      },
    },
  };
}

function makeClaim(overrides: Partial<SelectedAgentContext['claims'][number]> = {}): SelectedAgentContext['claims'][number] {
  return {
    id: 'claim-access',
    text: 'Humanitarian access is constrained by checkpoint delays.',
    type: 'claim',
    status: 'reviewed',
    confidence: 0.88,
    confidenceKind: 'EXTRACTED',
    validFrom: '2026-06-18',
    validTo: null,
    asOf: '2026-06-20',
    recordedAt: '2026-06-20T00:00:00.000Z',
    sourceReceiptIds: ['src-reliefweb'],
    contradicts: [],
    linkedNodeIds: [],
    linkedEdgeIds: [],
    support: 'supported',
    caveat: null,
    salienceScore: 0.9,
    salienceSignals: ['query_match'],
    ...overrides,
  };
}

function emptySelected(): SelectedAgentContext {
  return {
    nodes: [],
    edges: [],
    claims: [],
    sources: [],
    paths: [],
    timeline: [],
    causalLinks: [],
  };
}
