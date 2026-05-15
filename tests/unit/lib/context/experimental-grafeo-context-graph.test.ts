import { describe, expect, it } from 'vitest';
import {
  buildExperimentalContextGraph,
  mirrorContextGraphToGrafeo,
  renderExperimentalContextGraphPromptBlock,
} from '@/lib/context/experimental-grafeo-context-graph';

const baseInput = {
  contextCoreId: 'policy-core-1',
  title: 'Port Access Policy Review',
  domain: 'defense_policy',
  pipeline: 'policy_analysis' as const,
  summary: 'Review port access controls for partner-state logistics.',
  rawText: '',
  actors: ['Port Authority', 'Defense Ministry'],
  sourceReceipts: [
    {
      id: 'src-1',
      title: 'Port access circular',
      citation: 'doc://port-access',
      excerpt: 'Defense Ministry confirms the port access review.',
    },
  ],
  claims: [
    {
      id: 'claim-1',
      text: 'Defense Ministry confirms the port access review.',
      kind: 'sourced_fact' as const,
      sourceIds: ['src-1'],
      actorIds: ['Defense Ministry'],
    },
    {
      id: 'claim-2',
      text: 'Port Authority has no customs dependency.',
      kind: 'inferred_claim' as const,
      sourceIds: [],
      actorIds: ['Port Authority'],
    },
  ],
  events: [
    {
      id: 'event-1',
      label: 'Policy review opened',
      date: '2026-05-15',
      actorIds: ['Defense Ministry'],
      sourceIds: ['src-1'],
    },
  ],
  constraints: ['Do not recommend operational action without legal review.'],
  assumptions: ['Customs data remains incomplete.'],
  evidenceGaps: ['Missing customs authority source receipt.'],
};

describe('experimental Grafeo context graph', () => {
  it('builds a deterministic policy graph with standard query results', () => {
    const graph = buildExperimentalContextGraph(baseInput, {
      backend: 'grafeo_experimental',
      now: () => new Date('2026-05-15T12:00:00.000Z'),
    });

    expect(graph.schemaVersion).toBe('praxis-context-graph-v0');
    expect(graph.backend).toBe('grafeo_experimental');
    expect(graph.nodes.some((node) => node.kind === 'context_core')).toBe(true);
    expect(graph.nodes.some((node) => node.kind === 'source_receipt')).toBe(true);
    expect(graph.edges.some((edge) => edge.type === 'SUPPORTED_BY')).toBe(true);
    expect(graph.queryResults.find((query) => query.id === 'claims_without_sources')?.count).toBe(1);
    expect(graph.queryResults.find((query) => query.id === 'policy_constraint_readiness')?.count).toBe(1);
    expect(graph.promptBlock).toContain('Experimental PRAXIS Context Graph');
  });

  it('captures lite structured text for conflict analysis without AI extraction', () => {
    const graph = buildExperimentalContextGraph({
      contextCoreId: 'conflict-core-1',
      title: 'Ceasefire Friction Review',
      domain: 'conflict_analysis',
      pipeline: 'conflict_analysis',
      summary: 'Review ceasefire friction around corridor access.',
      rawText: [
        'Actor: Monitoring Cell',
        'Actor: Armed Group A',
        'Source: Field report 12',
        'Claim: Armed Group A commits to corridor access.',
        'Claim: Armed Group A rejects corridor access.',
        'Event: 2026-05-14 corridor checkpoint incident',
        'Constraint: Legal review required before public attribution.',
        'Assumption: Monitoring reports are incomplete.',
        'Gap: Missing independent checkpoint source.',
      ].join('\n'),
      actors: [],
      claims: [],
      events: [],
      constraints: [],
      assumptions: [],
      evidenceGaps: [],
      sourceReceipts: [],
    });

    expect(graph.pipeline).toBe('conflict_analysis');
    expect(graph.nodes.filter((node) => node.kind === 'actor')).toHaveLength(2);
    expect(graph.edges.some((edge) => edge.type === 'CONFLICTS_WITH')).toBe(true);
    expect(graph.queryResults.find((query) => query.id === 'conflicting_claims')?.count).toBe(1);
    expect(renderExperimentalContextGraphPromptBlock(graph)).toContain('conflict_analysis');
  });

  it('keeps Grafeo mirroring optional when the backend flag is off', async () => {
    const graph = buildExperimentalContextGraph(baseInput);
    const mirror = await mirrorContextGraphToGrafeo(graph, { backend: 'firestore_lite' });

    expect(mirror.enabled).toBe(false);
    expect(mirror.ok).toBe(true);
    expect(mirror.nodeCount).toBe(graph.nodes.length);
  });
});
