import { describe, expect, it, vi } from 'vitest';
import { CAPSULE_LIBRARY_ENTRIES } from '@/lib/capsules/library';
import { tryLibraryCapsule } from '@/lib/capsules/library-try';
import { sanitizeActiveContextStack } from '@/lib/context/active-context-stack';

describe('tryLibraryCapsule', () => {
  it('seeds starter capsules and attaches one for a new user with no existing capsules', async () => {
    const entry = CAPSULE_LIBRARY_ENTRIES[0];
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ capsules: [], persisted: true }))
      .mockResolvedValueOnce(Response.json({ created: 211 }, { status: 201 }));
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

  it('returns needs-auth instead of surfacing a forbidden attach state', async () => {
    const entry = CAPSULE_LIBRARY_ENTRIES[2];
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 403 }));
    const saveStack = vi.fn(async (patch) => sanitizeActiveContextStack(patch));

    const result = await tryLibraryCapsule(entry, { fetch: fetcher, saveStack });

    expect(result).toEqual({ status: 'needs-auth', capsuleId: entry.id });
    expect(saveStack).not.toHaveBeenCalled();
  });
});
