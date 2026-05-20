import { describe, expect, it, vi } from 'vitest';

import {
  AppSearchResultSchema,
  normalizeAppSearchQuery,
  normalizeCapsuleSearchResult,
  searchApp,
} from '@/lib/app-search/app-search';

describe('app search service', () => {
  it('normalizes result shape and ranks exact labels before tag matches and type priority', async () => {
    const result = await searchApp({
      uid: 'user-1',
      isDemo: false,
      query: 'Crisis brief',
      limit: 5,
    }, {
      listCapsules: vi.fn().mockResolvedValue([
        {
          capsuleId: 'cap-1',
          label: 'Crisis brief',
          updatedAt: '2026-05-20T10:00:00.000Z',
          archivedAt: null,
          trust: { score: 91, level: 'green' },
          coreRefs: { sourceCoreIds: ['src-1', 'src-2'], documentCoreIds: ['doc-1'], outputCoreIds: ['brief'] },
          community: { tags: ['humanitarian'] },
          starterSnapshot: null,
        },
        {
          capsuleId: 'cap-2',
          label: 'Humanitarian access',
          updatedAt: '2026-05-20T11:00:00.000Z',
          archivedAt: null,
          trust: { score: 75, level: 'amber' },
          coreRefs: { sourceCoreIds: [], documentCoreIds: [], outputCoreIds: [] },
          community: { tags: ['crisis brief'] },
          starterSnapshot: null,
        },
      ]),
      listMemos: vi.fn().mockResolvedValue([]),
      listKnowledgeDocuments: vi.fn().mockResolvedValue([]),
      listRecentAgentRuns: vi.fn().mockResolvedValue([]),
    });

    expect(result.groups.capsules.map((item) => item.id)).toEqual(['cap-1', 'cap-2']);
    expect(result.groups.capsules[0]).toMatchObject({
      id: 'cap-1',
      type: 'capsule',
      label: 'Crisis brief',
      href: '/app/capsules?capsuleId=cap-1',
      sourcePosture: '2 sources',
    });
    expect(AppSearchResultSchema.safeParse(result.groups.capsules[0]).success).toBe(true);
  });

  it('returns safe default actions for empty queries', async () => {
    const result = await searchApp({
      uid: 'user-1',
      isDemo: false,
      query: '',
    }, {
      listCapsules: vi.fn(),
      listMemos: vi.fn(),
      listKnowledgeDocuments: vi.fn(),
      listRecentAgentRuns: vi.fn(),
    });

    expect(result.query).toBe('');
    expect(result.groups.actions.length).toBeGreaterThan(0);
    expect(result.groups.capsules).toEqual([]);
    expect(result.diagnostics.degradedLanes).toEqual([]);
  });

  it('degrades unavailable lanes without failing the whole search', async () => {
    const result = await searchApp({
      uid: 'user-1',
      isDemo: false,
      query: 'brief',
    }, {
      listCapsules: vi.fn().mockResolvedValue([]),
      listMemos: vi.fn().mockRejectedValue(new Error('Firestore unavailable')),
      listKnowledgeDocuments: vi.fn().mockResolvedValue([]),
      listRecentAgentRuns: vi.fn().mockRejectedValue(new Error('Agent run ledger is not configured')),
    });

    expect(result.groups.actions.length).toBeGreaterThan(0);
    expect(result.diagnostics.degradedLanes).toEqual(['memos', 'agent_runs']);
  });

  it('rejects invalid query params before lane search', () => {
    expect(() => normalizeAppSearchQuery({ q: 'x'.repeat(201) })).toThrow();
    expect(normalizeAppSearchQuery({ q: ' memo ', types: 'memo,capsule', limit: '99' })).toEqual({
      q: 'memo',
      types: ['memo', 'capsule'],
      limit: 25,
    });
  });

  it('exposes the capsule normalizer for repository and top-bar search reuse', () => {
    const item = normalizeCapsuleSearchResult({
      capsuleId: 'cap-1',
      label: 'Options memo',
      updatedAt: '2026-05-20T12:00:00.000Z',
      trust: { score: 80, level: 'green' },
      coreRefs: { sourceCoreIds: ['src-1'], documentCoreIds: [], outputCoreIds: ['memo'] },
      community: { tags: ['output'] },
    } as never, 'options');

    expect(item).toMatchObject({
      id: 'cap-1',
      type: 'capsule',
      badges: expect.arrayContaining(['health 80', '1 source', 'output target']),
    });
  });
});
