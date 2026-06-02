import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQuickContextFromDomain } from '@/lib/context/quick-context-builder-client';
import { getStarterContextDomain } from '@/lib/context/starter-context-domains';

describe('createQuickContextFromDomain', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates situation, capsule, package, attaches stack, and resolves context in order', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({
        url,
        body: init?.body ? JSON.parse(String(init.body)) : null,
      });
      if (url === '/api/situations') {
        return jsonResponse({ situation: { id: 'sit-1', name: 'Policy Situation Core' } });
      }
      if (url === '/api/context/capsules') {
        return jsonResponse({
          capsule: {
            capsuleId: 'cap-1',
            label: 'Policy Capsule',
            version: 4,
            health: { score: 78, warnings: ['Attach source receipts.'] },
          },
        });
      }
      if (url === '/api/context/packages') {
        return jsonResponse({
          package: {
            id: 'pkg-1',
            health: { score: 74, missingCores: ['sources'] },
          },
        });
      }
      if (url === '/api/context/resolve') {
        return jsonResponse({ ok: true });
      }
      throw new Error(`unexpected fetch ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const addSituation = vi.fn();
    const setActiveSituation = vi.fn();
    const saveStack = vi.fn(async (patch) => patch);

    const result = await createQuickContextFromDomain({
      domain: getStarterContextDomain('policy'),
      addSituation,
      setActiveSituation,
      saveStack,
    });

    expect(calls.map((call) => call.url)).toEqual([
      '/api/situations',
      '/api/context/capsules',
      '/api/context/packages',
      '/api/context/resolve',
    ]);
    expect(addSituation).toHaveBeenCalledWith(expect.objectContaining({ id: 'sit-1' }));
    expect(setActiveSituation).toHaveBeenCalledWith('sit-1');
    expect(saveStack).toHaveBeenCalledWith(expect.objectContaining({
      stackId: 'cap-1',
      capsuleId: 'cap-1',
      contextPackageId: 'pkg-1',
      situationId: 'sit-1',
      outputGoal: 'policy memo',
      capsuleRefs: [expect.objectContaining({ capsuleId: 'cap-1', role: 'primary', primary: true })],
      contextBlocks: expect.objectContaining({
        userCore: [expect.objectContaining({ label: expect.stringContaining('Policy') })],
        situation: [expect.objectContaining({ id: 'sit-1' })],
        thinkingDevices: expect.arrayContaining([expect.objectContaining({ id: 'sourceability-reviewer' })]),
        output: expect.arrayContaining([expect.objectContaining({ id: 'policy memo' })]),
      }),
    }));
    expect(result).toMatchObject({
      capsuleId: 'cap-1',
      contextPackageId: 'pkg-1',
      situationId: 'sit-1',
      resolved: true,
      coreLite: {
        title: 'Policy Context Core Lite',
        askResolvable: true,
        capsuleVersion: 4,
      },
    });
  });
});

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}
