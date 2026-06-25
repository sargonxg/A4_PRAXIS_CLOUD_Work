import { describe, expect, it } from 'vitest';
import {
  buildTemporalTimeline,
  isTemporalIntent,
  toCapsuleTemporalViewerItems,
} from '@/lib/context/temporal-timeline';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

describe('temporal timeline builder', () => {
  it('orders sourced events, commitments, and claims without inventing dates', () => {
    const timeline = buildTemporalTimeline({
      capsule: temporalCapsule(),
      requestTime: '2026-06-24T12:00:00.000Z',
    });

    expect(timeline.items.map((item) => item.id)).toEqual([
      'claim:claim-ceasefire-active',
      'node:event-ceasefire-signed',
      'anchor:deadline-monitoring-report',
      'node:commitment-access-window',
      'node:event-access-violation',
      'claim:claim-access-violation',
    ]);
    expect(timeline.items.find((item) => item.id === 'claim:claim-ceasefire-active')).toMatchObject({
      date: '2026-06-01',
      kind: 'claim',
      sourceReceiptIds: ['src-treaty'],
      validFrom: '2026-06-01',
      validTo: '2026-06-30',
      advisory: false,
    });
    expect(timeline.items.find((item) => item.id === 'node:event-access-violation')).toMatchObject({
      date: '2026-06-19',
      kind: 'event',
      sourceReceiptIds: ['src-monitor'],
    });
  });

  it('keeps every item receipt-grounded or explicitly advisory', () => {
    const timeline = buildTemporalTimeline({
      capsule: temporalCapsule({
        temporality: {
          timelineAnchors: [{
            id: 'unsourced-anchor',
            label: 'Analyst-entered review point',
            date: '2026-06-05',
            kind: 'review',
          }],
        },
      }),
      requestTime: '2026-06-24T12:00:00.000Z',
    });

    expect(timeline.items.every((item) => item.sourceReceiptIds.length > 0 || item.advisory)).toBe(true);
    expect(timeline.items.find((item) => item.id === 'anchor:unsourced-anchor')).toMatchObject({
      advisory: true,
      grounding: 'advisory_uncertain',
    });
  });

  it('emits ontology temporal and causal edges between timeline items', () => {
    const timeline = buildTemporalTimeline({
      capsule: temporalCapsule(),
      requestTime: '2026-06-24T12:00:00.000Z',
    });

    expect(timeline.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'edge:edge-precedes',
        source: 'node:event-ceasefire-signed',
        target: 'node:event-access-violation',
        relation: 'precedes',
        sourceReceiptIds: ['src-monitor'],
      }),
      expect.objectContaining({
        id: 'edge:causal-access-violation',
        source: 'node:event-access-violation',
        target: 'claim:claim-access-violation',
        relation: 'causes',
        sourceReceiptIds: ['src-monitor'],
      }),
    ]));
  });

  it('returns existing temporal viewer item shape for knowledge product rendering', () => {
    const timeline = buildTemporalTimeline({
      capsule: temporalCapsule(),
      requestTime: '2026-06-24T12:00:00.000Z',
    });

    expect(toCapsuleTemporalViewerItems(timeline)[0]).toMatchObject({
      id: 'claim:claim-ceasefire-active',
      start: '2026-06-01',
      end: '2026-06-30',
      group: 'claim',
      sourceIds: ['src-treaty'],
    });
  });

  it('normalizes heterogeneous date formats before sorting and places unparseable dates last', () => {
    const timeline = buildTemporalTimeline({
      capsule: temporalCapsule({
        temporality: {
          timelineAnchors: [
            { id: 'year-only', label: 'Year only', date: '2026', sourceRefs: ['src-treaty'] },
            { id: 'full-iso', label: 'Full ISO', date: '2026-02-10T00:00:00.000Z', sourceRefs: ['src-treaty'] },
            { id: 'partial-month', label: 'Partial month', date: '2026-02', sourceRefs: ['src-treaty'] },
            { id: 'slash-date', label: 'Slash date', date: '03/05/2026', sourceRefs: ['src-monitor'] },
            { id: 'unparseable', label: 'Unparseable', date: 'late monsoon season', sourceRefs: ['src-monitor'] },
          ],
        },
        claimLedger: [],
        embeddedGraph: { nodes: [], edges: [] },
        causality: { causalLinks: [] },
      }),
      requestTime: '2026-06-24T12:00:00.000Z',
    });

    expect(timeline.items.map((item) => item.id)).toEqual([
      'anchor:year-only',
      'anchor:partial-month',
      'anchor:full-iso',
      'anchor:slash-date',
      'anchor:unparseable',
    ]);
    expect(timeline.items.map((item) => item.date)).toEqual([
      '2026-01-01',
      '2026-02-01',
      '2026-02-10',
      '2026-03-05',
      'late monsoon season',
    ]);
    expect(timeline.warnings).toContain('Some timeline dates could not be normalized and were placed at the end.');
  });

  it('falls back to an empty deterministic timeline when no dated facts exist', () => {
    const timeline = buildTemporalTimeline({
      capsule: temporalCapsule({
        temporality: { timelineAnchors: [] },
        claimLedger: [],
        embeddedGraph: { nodes: [], edges: [] },
        causality: { causalLinks: [] },
      }),
      requestTime: '2026-06-24T12:00:00.000Z',
    });

    expect(timeline).toMatchObject({
      items: [],
      edges: [],
      warnings: ['No dated capsule events, commitments, claims, or timeline anchors were available.'],
    });
  });

  it('detects temporal intent in sequence, timeline, and over-time questions', () => {
    expect(isTemporalIntent('Build a timeline of how restrictions escalated over time.')).toBe(true);
    expect(isTemporalIntent('When did the commitment expire?')).toBe(true);
    expect(isTemporalIntent('Summarize the source posture.')).toBe(false);
  });
});

function temporalCapsule(overrides: Record<string, unknown> = {}): PraxisCapsule {
  return {
    capsuleId: 'cap-temporal',
    ownerUid: 'u1',
    scope: 'user',
    parentCapsuleId: null,
    forkedFromVersion: null,
    associatedCapsuleIds: [],
    coreRefs: {
      userCoreId: 'user-1',
      teamCoreId: null,
      situationCoreId: 'sit-1',
      pathCoreId: null,
      sourceCoreIds: ['src-treaty', 'src-monitor'],
      documentCoreIds: [],
      graphCoreId: 'graph-1',
      timeCoreId: 'time-1',
      outputCoreIds: [],
      toolCoreIds: [],
      objectiveCoreIds: [],
      productCoreIds: [],
      memoryCoreId: null,
    },
    retrievalPolicy: { layers: ['capsules'], limit: 8, checkFreshness: true, freshnessWindowDays: 90 },
    health: { score: 90, warnings: [] },
    activeForSituationIds: [],
    lockedCoreKinds: [],
    provenance: { createdBy: 'u1', updatedBy: 'u1', source: 'test' },
    access: { visibility: 'private', canShare: false },
    community: { forkCount: 0, reuseCount: 0, rating: null },
    trust: { level: 'green', reasons: [] },
    sourceRefs: [
      { sourceId: 'src-treaty', label: 'Ceasefire text', date: '2026-06-01', reliabilityTier: 1 },
      { sourceId: 'src-monitor', label: 'Monitoring report', date: '2026-06-19', reliabilityTier: 1 },
    ],
    claimLedger: [
      {
        claimId: 'claim-ceasefire-active',
        text: 'The ceasefire commitment was active through June.',
        validFrom: '2026-06-01',
        validUntil: '2026-06-30',
        sourceRefIds: ['src-treaty'],
        receipts: [{ sourceId: 'src-treaty', confidence: 0.91 }],
      },
      {
        claimId: 'claim-access-violation',
        text: 'Access restrictions violated the monitoring commitment.',
        recordedAt: '2026-06-20T00:00:00.000Z',
        sourceRefIds: ['src-monitor'],
        receipts: [{ sourceId: 'src-monitor', confidence: 0.78 }],
      },
    ],
    temporality: {
      asOf: '2026-06-24T00:00:00.000Z',
      validFrom: '2026-06-01',
      timelineAnchors: [{
        id: 'deadline-monitoring-report',
        label: 'Monitoring report deadline',
        date: '2026-06-15',
        kind: 'deadline',
        sourceRefs: ['src-treaty'],
        confidence: 0.9,
      }],
    },
    causality: {
      causalLinks: [{
        id: 'causal-access-violation',
        cause: 'event-access-violation',
        effect: 'claim-access-violation',
        relation: 'causes',
        evidenceRefs: ['src-monitor'],
        confidence: 0.72,
      }],
    },
    embeddedGraph: {
      nodes: [
        {
          id: 'event-ceasefire-signed',
          label: 'Ceasefire signed',
          entityType: 'Event',
          validFrom: '2026-06-01T00:00:00.000Z',
          sourceReceiptIds: ['src-treaty'],
          confidence: 0.91,
        },
        {
          id: 'commitment-access-window',
          label: 'Access monitoring commitment',
          entityType: 'Commitment',
          validFrom: '2026-06-16',
          validTo: '2026-06-30',
          sourceReceiptIds: ['src-treaty'],
          confidence: 0.86,
        },
        {
          id: 'event-access-violation',
          label: 'Access restriction after monitoring window opened',
          entityType: 'Event',
          validFrom: '2026-06-19T00:00:00.000Z',
          sourceReceiptIds: ['src-monitor'],
          confidence: 0.78,
        },
      ],
      edges: [{
        id: 'edge-precedes',
        source: 'event-ceasefire-signed',
        target: 'event-access-violation',
        relationshipType: 'precedes',
        sourceReceiptIds: ['src-monitor'],
        confidence: 0.8,
      }],
    },
    createdAt: '2026-06-24T00:00:00.000Z',
    updatedAt: '2026-06-24T00:00:00.000Z',
    schemaVersion: 3,
    version: 1,
    label: 'Temporal capsule',
    ...overrides,
  } as unknown as PraxisCapsule;
}
