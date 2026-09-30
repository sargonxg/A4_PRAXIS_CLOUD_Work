import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: () => ({ collection: () => ({ doc: () => ({ get: mocks.get }) }) }) }));
import { assertAgentOwnerWritable } from '@/lib/agent-runtime/owner-state';
describe('agent owner state', () => {
  beforeEach(() => { mocks.get.mockReset(); });
  it('allows an existing active owner', async () => {
    mocks.get.mockResolvedValue({ exists: true, data: () => ({}) });
    await expect(assertAgentOwnerWritable('owner')).resolves.toBeUndefined();
  });
  it.each(['deleting', 'deleted'])('blocks %s owners before persistence', async (accountDeletionStatus) => {
    mocks.get.mockResolvedValue({ exists: true, data: () => ({ accountDeletionStatus }) });
    await expect(assertAgentOwnerWritable('owner')).rejects.toThrow(/cleanup/i);
  });
  it('blocks absent owners and unavailable account storage', async () => {
    mocks.get.mockResolvedValue({ exists: false, data: () => undefined });
    await expect(assertAgentOwnerWritable('owner')).rejects.toThrow(/unavailable/i);
    mocks.get.mockImplementation(async () => { throw new Error('storage unavailable'); });
    const failed = await assertAgentOwnerWritable('owner').catch((error: Error) => error);
    expect(failed).toBeInstanceOf(Error);
    expect((failed as Error).message).toMatch(/could not be verified/i);
  });
});
