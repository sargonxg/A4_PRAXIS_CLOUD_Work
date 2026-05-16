import { describe, expect, it } from 'vitest';
import {
  buildAskPraxisAnswerPolicyBlock,
  buildAskPraxisSituationSourcePosture,
  formatAskPraxisCorpusBlock,
  summarizeAskPraxisGraphSnapshot,
} from '@/lib/ai/ask-praxis-context';
import type { CorpusSearchResponse } from '@/types/corpus';
import type { Situation } from '@/types/situation';

const situation = {
  id: 'sit-1',
  name: 'User transition file',
  type: 'international',
  description: 'Transition case.',
  region: 'User-defined',
  actors: ['Lead ministry', 'Regional partner'],
  userRole: 'analyst',
  status: 'active',
  riskScore: 78,
  glaslStage: 5,
  escalationTrend: 'volatile',
  actorCount: 2,
  graphEntities: 46,
  documentCount: 3,
  sourceUrls: ['https://example.org/un-briefing'],
  customSources: [{ id: 'custom-1', url: 'https://example.org/source', name: 'Field source', categoryId: 'un' }],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-05-08T00:00:00.000Z',
} satisfies Situation;

describe('Ask PRAXIS context pack', () => {
  it('defines a top-answer evidence hierarchy', () => {
    const block = buildAskPraxisAnswerPolicyBlock();
    expect(block).toContain('active Situation record');
    expect(block).toContain('Retrieved situation corpus items');
    expect(block).toContain('Bottom line');
    expect(block).toContain('Gaps');
  });

  it('summarizes source posture without hiding attached sources', () => {
    const block = buildAskPraxisSituationSourcePosture(situation);
    expect(block).toContain('actors=2');
    expect(block).toContain('graphEntities=46');
    expect(block).toContain('https://example.org/un-briefing');
    expect(block).toContain('Field source');
  });

  it('formats corpus items as citation-ready evidence', () => {
    const corpus: CorpusSearchResponse = {
      items: [
        {
          sourceType: 'documents',
          sourceId: 'doc-1#chunk-1',
          title: 'UN briefing',
          excerpt: 'Implementation planning remains fragile.',
          citation: 'users/u/situations/s/documents/doc-1/chunks/chunk-1',
          confidence: 'high',
          freshness: '2026-05-08T00:00:00.000Z',
          reason: 'Top-K hybrid match',
        },
      ],
      trace: {
        query: 'what changed',
        layersSearched: ['documents', 'graph'],
        ranking: 'keyword + recency now; vector search pilot next',
        layerCounts: { documents: 1, graph: 0 },
        totalCandidates: 1,
        durationMs: 12,
      },
    };

    const block = formatAskPraxisCorpusBlock(corpus);
    expect(block).toContain('[#1] (documents) UN briefing');
    expect(block).toContain('citation=users/u/situations/s/documents/doc-1/chunks/chunk-1');
    expect(block).toContain('why=Top-K hybrid match');
  });

  it('summarizes graph structure and asks for lower confidence when sparse', () => {
    const block = summarizeAskPraxisGraphSnapshot({
      nodes: [
        { id: 'a1', type: 'actor', label: 'Lead ministry' },
        { id: 'c1', type: 'claim', label: 'Integration track remains stabilizing' },
      ],
      edges: [{ source: 'a1', target: 'c1', type: 'asserts' }],
    });

    expect(block).toContain('Nodes: 2');
    expect(block).toContain('actor: Lead ministry');
    expect(block).toContain('[graph]');
  });
});
