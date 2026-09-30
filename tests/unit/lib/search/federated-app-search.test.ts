import { describe, expect, it, vi } from 'vitest';
import {
  buildFederatedSearchResults,
  fetchFederatedSearchData,
  type StaticSearchCommand,
} from '@/lib/search/federated-app-search';

const commands: StaticSearchCommand[] = [
  { id: 'open-home', label: 'Open PRAXIS', description: 'Ask from the active capsule.', href: '/app' },
  { id: 'open-capsules', label: 'Open Capsules', description: 'Manage capsules.', href: '/app/capsules' },
];

describe('federated app search', () => {
  it('keeps Ask first, commands next, then federated app entities', () => {
    const results = buildFederatedSearchResults({
      query: 'climate brief',
      commands,
      conversations: [
        { conversationId: 'thread-1', title: 'Climate security brief', capsuleId: 'cap-1', updatedAt: '2026-05-20T12:00:00.000Z' },
      ],
      capsules: [
        { capsuleId: 'cap-1', label: 'Climate risk capsule', health: { warnings: ['stale source'], blockers: [] }, coreRefs: { sourceCoreIds: ['s1'] } },
      ],
      repositories: [
        { id: 'repo-1', name: 'Climate source library', documentCount: 4, sourceCount: 2 },
      ],
      diagnostics: {
        runtime: { status: 'ok', summary: 'Systems ready', checkedAt: '2026-05-20T12:00:00.000Z' },
        agenticSearch: { status: 'ready', summary: 'Agentic search ready', checkedAt: '2026-05-20T12:00:00.000Z' },
      },
    });

    expect(results.map((result) => result.group).slice(0, 6)).toEqual([
      'Ask',
      'Commands',
      'Commands',
      'Conversations',
      'Capsules',
      'Sources',
    ]);
    expect(results[0]).toMatchObject({ id: 'ask-praxis', label: 'Ask PRAXIS: climate brief' });
    expect(results.find((result) => result.group === 'Diagnostics')).toMatchObject({
      href: '/app/settings?tab=system',
      status: 'ok',
    });
  });

  it('keeps Ask PRAXIS available for empty queries and routes repository through the capsule lane', () => {
    const results = buildFederatedSearchResults({ query: '', commands });

    expect(results[0]).toMatchObject({ group: 'Ask', label: 'Ask PRAXIS with current context' });
    expect(results.some((result) => result.href === '/app/repository')).toBe(false);
    expect(results.some((result) => result.href === '/app/capsules?lane=sources')).toBe(true);
  });

  it('returns degraded rows when network-backed groups fail', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === '/api/conversations') throw new Error('offline');
      if (url === '/api/context/capsules') return response({ capsules: [] });
      if (url === '/api/knowledge/repositories') return response({ repositories: [] });
      return response({ status: 'ok', summary: 'ready', checkedAt: '2026-05-20T12:00:00.000Z' });
    });

    const data = await fetchFederatedSearchData(fetchImpl);
    const results = buildFederatedSearchResults({ query: 'anything', commands, ...data });

    expect(results).toContainEqual(expect.objectContaining({
      id: 'degraded-conversations',
      group: 'Conversations',
      status: 'degraded',
    }));
  });
});

function response(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  } as Response;
}
