import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentApproval, AgentRun, AgentRunEvent, AgentToolCall } from '@/lib/agent-runtime/types';
const mocks = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), directSet: vi.fn() }));
const docRef = (path: string) => ({ path, set: mocks.directSet, collection: (name: string) => ({ doc: (id: string) => docRef(`${path}/${name}/${id}`) }) });
vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: () => ({
  doc: docRef, batch: () => ({ set: mocks.directSet, commit: async () => {} }),
  runTransaction: async (run: (tx: unknown) => unknown) => run({ get: mocks.get, set: mocks.set }),
}) }));
import { mirrorAgentApprovalToFirestore, mirrorAgentRunEventToFirestore, mirrorAgentRunToFirestore, mirrorAgentToolCallToFirestore } from '@/lib/agent-runtime/firestore-mirror';

const operations = [
  ['run', () => mirrorAgentRunToFirestore({ id: 'run', ownerUid: 'owner', metadata: {} } as AgentRun)],
  ['event', () => mirrorAgentRunEventToFirestore({ id: 'event', runId: 'run', ownerUid: 'owner', data: {} } as AgentRunEvent)],
  ['tool', () => mirrorAgentToolCallToFirestore({ id: 'tool', runId: 'run', ownerUid: 'owner' } as AgentToolCall)],
  ['approval', () => mirrorAgentApprovalToFirestore({ id: 'approval', runId: 'run', ownerUid: 'owner' } as AgentApproval)],
] as const;

describe('late agent mirrors after account erasure begins', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it.each(operations)('blocks %s mirror in the same transaction when owner is deleting', async (_name, run) => {
    mocks.get.mockResolvedValue({ exists: true, data: () => ({ accountDeletionStatus: 'deleting' }) });
    expect(await run()).toBe(false);
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.directSet).not.toHaveBeenCalled();
  });
  it.each(operations)('blocks %s mirror when the owner profile is missing', async (_name, run) => {
    mocks.get.mockResolvedValue({ exists: false, data: () => undefined });
    expect(await run()).toBe(false);
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it.each(operations)('writes %s mirror transactionally for an active owner', async (_name, run) => {
    mocks.get.mockResolvedValue({ exists: true, data: () => ({}) });
    expect(await run()).toBe(true);
    expect(mocks.get).toHaveBeenCalledWith(expect.objectContaining({ path: 'users/owner' }));
    expect(mocks.set).toHaveBeenCalled();
  });
});
