import { describe, expect, it, vi } from 'vitest';
import { attachSavedCapsuleForAsk } from '@/lib/capsules/ask-handoff';
import { assignCapsuleToDockSlot, defaultActiveContextStack, sanitizeActiveContextStack } from '@/lib/context/active-context-stack';

const capsule = { capsuleId: 'saved-context', ownerUid: 'analyst-a', label: 'Reviewed policy context', version: 3, archivedAt: null };

describe('saved capsule Use in Ask handoff', () => {
  it('makes the saved capsule govern Ask, keeps unrelated dock slots, and accepts canonical source refs from the server', async () => {
    const previous = assignCapsuleToDockSlot(defaultActiveContextStack(), 'user', { capsuleId: 'analyst-posture', version: 2 });
    const serverStack = sanitizeActiveContextStack({
      capsuleId: capsule.capsuleId,
      sourceIds: ['source-1'], documentIds: ['document-1'],
      capsuleRefs: [{ capsuleId: capsule.capsuleId, label: capsule.label, role: 'situation', version: 3 }, ...previous.capsuleRefs],
    });
    const saveStack = vi.fn().mockResolvedValue(serverStack);
    const fetcher = vi.fn().mockResolvedValue(Response.json({ capsule }));
    const controller = new AbortController();
    const saved = await attachSavedCapsuleForAsk({ capsuleId: capsule.capsuleId, ownerId: capsule.ownerUid, signal: controller.signal }, {
      fetch: fetcher, getStack: () => previous, saveStack,
    });
    expect(fetcher).toHaveBeenCalledWith('/api/context/capsules/saved-context', { credentials: 'include', signal: controller.signal });
    expect(saveStack).toHaveBeenCalledWith({
      stackId: capsule.capsuleId, capsuleId: capsule.capsuleId,
      capsuleRefs: [
        expect.objectContaining({ capsuleId: capsule.capsuleId, label: capsule.label, role: 'situation', primary: true, version: 3 }),
        expect.objectContaining({ capsuleId: 'analyst-posture', role: 'user', version: 2 }),
      ],
    });
    expect(saved).toBe(serverStack);
    expect(saved.sourceIds).toEqual(['source-1']);
    expect(saved.documentIds).toEqual(['document-1']);
    expect(previous.capsuleId).toBe('analyst-posture');
  });

  it.each([
    { capsule: { ...capsule, ownerUid: 'another-owner' } },
    { capsule: { ...capsule, capsuleId: 'different-id' } },
    { capsule: { ...capsule, archivedAt: '2026-09-29T12:00:00Z' } },
    { capsule: undefined },
  ])('does not save an unauthorized, mismatched, archived, or missing capsule: %j', async (body) => {
    const saveStack = vi.fn();
    await expect(attachSavedCapsuleForAsk({ capsuleId: capsule.capsuleId, ownerId: capsule.ownerUid, signal: new AbortController().signal }, {
      fetch: vi.fn().mockResolvedValue(Response.json(body)), getStack: defaultActiveContextStack, saveStack,
    })).rejects.toThrow(/unavailable/i);
    expect(saveStack).not.toHaveBeenCalled();
  });

  it('does not save a stale capsule GET response after query/account cancellation', async () => {
    const controller = new AbortController();
    const saveStack = vi.fn();
    const fetcher = vi.fn(async () => {
      controller.abort();
      return Response.json({ capsule });
    });
    await expect(attachSavedCapsuleForAsk({ capsuleId: capsule.capsuleId, ownerId: capsule.ownerUid, signal: controller.signal }, {
      fetch: fetcher, getStack: defaultActiveContextStack, saveStack,
    })).rejects.toThrow();
    expect(saveStack).not.toHaveBeenCalled();
  });

  it('reports load and save failures without mutating previous context or confirming attachment', async () => {
    const previous = sanitizeActiveContextStack({ capsuleId: 'previous' });
    const saveStack = vi.fn().mockRejectedValue(new Error('Previous capsule is still attached'));
    const input = { capsuleId: capsule.capsuleId, ownerId: capsule.ownerUid, signal: new AbortController().signal };
    await expect(attachSavedCapsuleForAsk(input, {
      fetch: vi.fn().mockResolvedValue(new Response(null, { status: 404 })), getStack: () => previous, saveStack,
    })).rejects.toThrow(/unavailable/i);
    expect(saveStack).not.toHaveBeenCalled();
    await expect(attachSavedCapsuleForAsk(input, {
      fetch: vi.fn().mockResolvedValue(Response.json({ capsule })), getStack: () => previous, saveStack,
    })).rejects.toThrow(/previous capsule/i);
    expect(previous.capsuleId).toBe('previous');
  });
});
