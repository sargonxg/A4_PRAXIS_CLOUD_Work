import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));

import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { listAskThreadTurns, persistAskThreadTurn } from '@/lib/firebase/ask-thread-service';

type TestRef = {
  path: string;
  doc: ReturnType<typeof vi.fn>;
  collection: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

describe('ask-thread-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('persists Ask turns under a capsule-scoped thread', async () => {
    const writes: Array<{ path: string; data: unknown }> = [];
    const db = createDb({
      onSet: (path, data) => writes.push({ path, data }),
      threadData: null,
    });
    vi.mocked(getAdminDbOrThrow).mockReturnValue(db as never);

    const turn = await persistAskThreadTurn({
      uid: 'user-1',
      capsuleId: 'capsule/one',
      threadId: 'thread#one',
      situationId: 'situation-1',
      prompt: 'What changed?',
      output: 'A concise answer.',
      capsuleVersion: 4,
      runtime: { model: 'gemini-test' },
      now: new Date('2026-05-15T12:00:00.000Z'),
    });

    expect(turn).toEqual(expect.objectContaining({
      uid: 'user-1',
      capsuleId: 'capsule-one',
      threadId: 'thread-one',
      situationId: 'situation-1',
      capsuleVersion: 4,
    }));
    expect(writes[0]).toEqual(expect.objectContaining({
      path: 'users/user-1/capsules/capsule-one/askThreads/thread-one',
    }));
    expect(writes[0].data).toEqual(expect.objectContaining({ turnCount: 1 }));
    expect(writes[1].path).toContain('/turns/turn-');
  });

  it('lists resumable turns oldest first', async () => {
    const db = createDb({
      threadData: {
        situationId: 'situation-1',
        capsuleVersion: 2,
        lastPrompt: 'latest',
        lastOutputPreview: 'answer',
        turnCount: 2,
        createdAt: '2026-05-15T11:00:00.000Z',
        updatedAt: '2026-05-15T12:00:00.000Z',
      },
      turnDocs: [
        { id: 'turn-2', data: { prompt: 'second', output: 'answer 2', createdAt: '2026-05-15T12:00:00.000Z' } },
        { id: 'turn-1', data: { prompt: 'first', output: 'answer 1', createdAt: '2026-05-15T11:00:00.000Z' } },
      ],
    });
    vi.mocked(getAdminDbOrThrow).mockReturnValue(db as never);

    const result = await listAskThreadTurns({
      uid: 'user-1',
      capsuleId: 'capsule-one',
      threadId: 'thread-one',
    });

    expect(result.thread).toEqual(expect.objectContaining({ turnCount: 2 }));
    expect(result.turns.map((turn) => turn.id)).toEqual(['turn-1', 'turn-2']);
  });

  it('skips persistence when no capsule is active', async () => {
    const db = createDb({});
    vi.mocked(getAdminDbOrThrow).mockReturnValue(db as never);

    const turn = await persistAskThreadTurn({
      uid: 'user-1',
      prompt: 'hello',
      output: 'world',
    });

    expect(turn).toBeNull();
    expect(db.collection).not.toHaveBeenCalled();
  });
});

function createDb(options: {
  onSet?: (path: string, data: unknown) => void;
  threadData?: Record<string, unknown> | null;
  turnDocs?: Array<{ id: string; data: Record<string, unknown> }>;
}) {
  const refs = new Map<string, ReturnType<typeof createRef>>();
  const refFor = (path: string) => {
    if (!refs.has(path)) refs.set(path, createRef(path, options, refFor));
    return refs.get(path)!;
  };
  return {
    collection: vi.fn((name: string) => refFor(name)),
    batch: vi.fn(() => {
      const queued: Array<{ ref: { path: string }; data: unknown }> = [];
      const batch = {
        set: vi.fn((ref: { path: string }, data: unknown) => {
          queued.push({ ref, data });
          return batch;
        }),
        commit: vi.fn(async () => {
          queued.forEach((write) => options.onSet?.(write.ref.path, write.data));
        }),
      };
      return batch;
    }),
  };
}

function createRef(
  path: string,
  options: {
    threadData?: Record<string, unknown> | null;
    turnDocs?: Array<{ id: string; data: Record<string, unknown> }>;
  },
  refFor: (path: string) => TestRef,
): TestRef {
  const isThread = path.includes('/askThreads/') && !path.includes('/turns');
  const isTurnsCollection = path.endsWith('/turns');
  return {
    path,
    doc: vi.fn((id: string) => refFor(`${path}/${id}`)),
    collection: vi.fn((name: string) => refFor(`${path}/${name}`)),
    get: vi.fn(async () => {
      if (isThread && options.threadData !== undefined) {
        return { exists: options.threadData !== null, data: () => options.threadData ?? undefined };
      }
      return { exists: false, data: () => undefined };
    }),
    orderBy: vi.fn(() => refFor(path)),
    limit: vi.fn(() => ({
      get: vi.fn(async () => ({
        docs: isTurnsCollection
          ? (options.turnDocs ?? []).map((doc) => ({ id: doc.id, data: () => doc.data }))
          : [],
      })),
    })),
  };
}
