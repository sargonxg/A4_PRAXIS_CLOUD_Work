import { describe, expect, it, vi } from 'vitest';

import {
  buildCapsuleSourcingPlan,
  retrieveCapsuleContext,
} from '@/lib/capsules/sourcing';
import type { ContextCapsule } from '@/types/context-capsule';

const capsule = {
  id: 'policy-brief',
  version: '1.0.0',
  contentHash: 'sha256:test',
  sourcing: {
    mode: 'hybrid',
    minSourcesPerClaim: 2,
    allowedDomains: ['un.org', 'worldbank.org'],
    blockedDomains: ['example.net'],
    recencyWindowDays: 30,
    requiredSourceTypes: ['official', 'news'],
    citationStyle: 'inline',
    sourceTrust: { 'un.org': 0.95, 'worldbank.org': 0.9 },
  },
  retrieval: {
    mode: 'hybrid',
    corpora: ['projects/p/locations/us-central1/ragCorpora/policy'],
    graphExpansionDepth: 2,
    topK: 7,
    trustRank: 'strict',
    vectorIndex: 'policy-index',
  },
  guardrails: {
    maxUngroundedClaims: 0,
  },
} as unknown as ContextCapsule;

describe('capsule sourcing plan', () => {
  it('turns SourcingPolicy and RetrievalConfig into explicit retrieval lanes', () => {
    const plan = buildCapsuleSourcingPlan(capsule);

    expect(plan.lanes.map((lane) => lane.id)).toEqual([
      'google-search-grounding',
      'situation-knowledge-corpus',
      'vertex-rag-corpus',
    ]);
    expect(plan.minSourcesPerClaim).toBe(2);
    expect(plan.maxUngroundedClaims).toBe(0);
    expect(plan.trustRank).toBe('strict');
    expect(plan.corpora).toEqual(['projects/p/locations/us-central1/ragCorpora/policy']);
    expect(plan.allowedDomains).toEqual(['un.org', 'worldbank.org']);
  });

  it('retrieves only from caller-provided lanes and returns fused source receipts', async () => {
    const groundedSearch = vi.fn().mockResolvedValue([
      {
        id: 'g-1',
        title: 'UN update',
        url: 'https://news.un.org/example',
        description: 'A sourced update',
        date: '2026-05-29T00:00:00.000Z',
        source: 'grounded_search',
        type: 'article',
        severity: 'medium',
        actors: ['UN'],
      },
    ]);
    const searchCorpus = vi.fn().mockResolvedValue({
      items: [
        {
          sourceType: 'documents',
          sourceId: 'doc-1#chunk-1',
          title: 'Uploaded memo',
          excerpt: 'An uploaded source excerpt',
          citation: 'users/u/situations/s/documents/doc-1/chunks/chunk-1',
          confidence: 'high',
          freshness: '2026-05-28T00:00:00.000Z',
          reason: 'hybrid match',
          score: 1,
        },
      ],
      trace: { durationMs: 1 },
    });
    const retrieveVertexRag = vi.fn().mockResolvedValue([
      {
        id: 'rag-1',
        title: 'RAG corpus excerpt',
        url: 'gs://policy/source.pdf',
        snippet: 'A RAG context',
        provider: 'vertex-rag',
        trustScore: 0.85,
      },
    ]);

    const result = await retrieveCapsuleContext({
      uid: 'u',
      situationId: 's',
      query: 'policy issue',
      capsule,
      deps: { groundedSearch, searchCorpus, retrieveVertexRag },
    });

    expect(groundedSearch).toHaveBeenCalledWith(expect.objectContaining({
      query: 'policy issue',
      limit: 7,
    }));
    expect(searchCorpus).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'u',
      situationId: 's',
      query: 'policy issue',
      limit: 7,
    }));
    expect(retrieveVertexRag).toHaveBeenCalledWith(expect.objectContaining({
      query: 'policy issue',
      corpusNames: ['projects/p/locations/us-central1/ragCorpora/policy'],
      topK: 7,
    }));
    expect(result.receipts.map((receipt) => receipt.provider)).toEqual([
      'skc',
      'vertex-rag',
      'google-search-grounding',
    ]);
    expect(result.receipts[0]).toMatchObject({
      id: 'skc:documents:doc-1#chunk-1',
      title: 'Uploaded memo',
      trustScore: 0.95,
    });
  });
});
