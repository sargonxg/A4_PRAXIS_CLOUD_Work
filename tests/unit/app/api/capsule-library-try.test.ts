import { describe, expect, it, vi } from 'vitest';
import { CAPSULE_LIBRARY_ENTRIES } from '@/lib/capsules/library';
import { activeContextPatchForLibraryEntry, tryLibraryCapsule } from '@/lib/capsules/library-try';
import { sanitizeActiveContextStack, type ActiveContextStackState } from '@/lib/context/active-context-stack';
import { buildCalibratedContext } from '@/lib/context/profile-context';

vi.mock('@/lib/firebase/analyst-profile-admin', () => ({ getAnalystProfile: vi.fn(async () => null) }));
vi.mock('@/lib/firebase/preferences-service', () => ({ getPreferences: vi.fn(async () => ({ citationStyle: 'inline', dailyBrief: { enabled: false, capsuleId: null } })) }));
vi.mock('@/lib/firebase/situations', () => ({ getSituationById: vi.fn(async () => null) }));
vi.mock('@/lib/firebase/episodes', () => ({ listEpisodes: vi.fn(async () => []) }));
vi.mock('@/lib/firebase/advisor-history-service', () => ({ readRecentTurns: vi.fn(async () => []) }));
vi.mock('@/lib/knowledge/profile-weighted-retrieval', () => ({ retrieveForProfile: vi.fn(async () => []) }));
vi.mock('@/lib/context/capsule-service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/context/capsule-service')>();
  return {
    ...actual,
    getCapsule: vi.fn(async (_uid: string, capsuleId: string) => (
      capsuleId === 'starter-context'
        ? actual.sanitizeCapsule({
            capsuleId,
            ownerUid: 'user-1',
            label: 'Starter context',
            summary: 'Context the next Ask turn must read.',
            coreRefs: {
              userCoreId: 'user-core',
              situationCoreId: 'situation-core',
              sourceCoreIds: ['source-a'],
              outputCoreIds: ['output-brief'],
            },
            community: { tags: ['mediation'] },
            claimLedger: [{ claimId: 'claim-a', text: 'This attached claim should appear.', sourceRefIds: [] }],
          })
        : null
    )),
  };
});

describe('tryLibraryCapsule', () => {
  it('seeds starter capsules and attaches one for a new user with no existing capsules', async () => {
    const entry = CAPSULE_LIBRARY_ENTRIES[0];
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ capsules: [], persisted: true }))
      .mockResolvedValueOnce(Response.json({ created: 221 }, { status: 201 }));
    const saveStack = vi.fn(async (patch) => sanitizeActiveContextStack(patch));

    const result = await tryLibraryCapsule(entry, { fetch: fetcher, saveStack });

    expect(result).toEqual({ status: 'attached', capsuleId: entry.id, seeded: true });
    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/context/capsules', { credentials: 'include' });
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/context/capsules', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ action: 'seed-starters' }),
    }));
    expect(saveStack).toHaveBeenCalledWith(expect.objectContaining({
      stackId: entry.id,
      capsuleId: entry.id,
      sourceIds: entry.coreRefs.sourceCoreIds,
      documentIds: entry.coreRefs.documentCoreIds,
      outputGoal: entry.coreRefs.outputCoreIds[0] ?? entry.coreRefs.productCoreIds[0] ?? null,
    }));
    expect(saveStack.mock.calls[0][0].capsuleRefs).toEqual([
      expect.objectContaining({ capsuleId: entry.id, role: 'primary', primary: true }),
    ]);
  });

  it('attaches an existing starter capsule for a returning user without reseeding', async () => {
    const entry = CAPSULE_LIBRARY_ENTRIES[1];
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ capsules: [{ capsuleId: entry.id }], persisted: true }));
    const saveStack = vi.fn(async (patch) => sanitizeActiveContextStack(patch));

    const result = await tryLibraryCapsule(entry, { fetch: fetcher, saveStack });

    expect(result).toEqual({ status: 'attached', capsuleId: entry.id, seeded: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(saveStack).toHaveBeenCalledWith(expect.objectContaining({
      stackId: entry.id,
      capsuleId: entry.id,
    }));
  });

  it('builds the active stack patch that the next chat calibration turn resolves into capsule context', async () => {
    const entry = {
      ...CAPSULE_LIBRARY_ENTRIES[0],
      id: 'starter-context',
      title: 'Starter context',
      coreRefs: {
        ...CAPSULE_LIBRARY_ENTRIES[0].coreRefs,
        userCoreId: 'user-core',
        situationCoreId: 'situation-core',
        sourceCoreIds: ['source-a'],
        documentCoreIds: [],
        toolCoreIds: [],
        outputCoreIds: ['output-brief'],
        productCoreIds: [],
      },
    };

    const stack = sanitizeActiveContextStack(activeContextPatchForLibraryEntry(entry) as Partial<ActiveContextStackState>);
    const context = await buildCalibratedContext({
      uid: 'user-1',
      toolId: 'ask',
      capsuleId: stack.capsuleId,
      activeContextStack: stack,
    });

    expect(stack.capsuleId).toBe('starter-context');
    expect(stack.contextBlocks.sources.map((item) => item.id)).toEqual(['source-a']);
    expect(context.toolContext.capsules?.map((capsule) => capsule.capsuleId)).toEqual(['starter-context']);
    expect(context.systemPromptBlock).toContain('<capsule-frame count="1"');
    expect(context.systemPromptBlock).toContain('Starter context');
  });

  it('returns needs-auth instead of surfacing a forbidden attach state', async () => {
    const entry = CAPSULE_LIBRARY_ENTRIES[2];
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 403 }));
    const saveStack = vi.fn(async (patch) => sanitizeActiveContextStack(patch));

    const result = await tryLibraryCapsule(entry, { fetch: fetcher, saveStack });

    expect(result).toEqual({ status: 'needs-auth', capsuleId: entry.id });
    expect(saveStack).not.toHaveBeenCalled();
  });
});
