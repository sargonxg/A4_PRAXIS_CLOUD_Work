import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FieldValue } from 'firebase-admin/firestore';

vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));

import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { listAskThreadTurns, omitUndefinedMetadata, persistAskThreadTurn } from '@/lib/firebase/ask-thread-service';
import { askHistoryCapsuleId, DIRECT_ASK_HISTORY_CAPSULE_ID } from '@/lib/ai/ask-conversation';

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

  it('persists direct turns in the same owner history and reloads them without ephemeral context IDs', async () => {
    const writes: Array<{ path: string; data: unknown }> = [];
    vi.mocked(getAdminDbOrThrow).mockReturnValue(createDb({ onSet: (path, data) => writes.push({ path, data }), threadData: null }) as never);
    for (const [index, contextId] of ['instant-first', 'instant-second'].entries()) {
      await persistAskThreadTurn({
        uid: 'analyst-a',
        capsuleId: askHistoryCapsuleId({ instantContextMode: true, resolvedCapsuleId: contextId }),
        threadId: 'home-direct', turnId: `direct-${index}`, prompt: `Question ${index}`, output: `Answer ${index}`,
        runtime: { contextCapsuleId: contextId },
        now: new Date(`2026-09-29T12:0${index}:00.000Z`),
      });
    }
    expect(writes[0].path).toBe('users/analyst-a/capsules/thin-capsule-fallback/askThreads/home-direct');
    expect(writes[2].path).toBe(writes[0].path);
    const turnDocs = [writes[1], writes[3]]
      .map((write, index) => ({ id: `direct-${index}`, data: write.data as Record<string, unknown> }))
      .reverse(); // Firestore returns createdAt descending; the service resumes oldest first.
    vi.mocked(getAdminDbOrThrow).mockReturnValue(createDb({ threadData: writes[2].data as Record<string, unknown>, turnDocs }) as never);
    const resumed = await listAskThreadTurns({ uid: 'analyst-a', capsuleId: DIRECT_ASK_HISTORY_CAPSULE_ID, threadId: 'home-direct' });
    expect(resumed.turns.map((turn) => turn.prompt)).toEqual(['Question 0', 'Question 1']);
    expect(resumed.turns[0].runtime).toMatchObject({ contextCapsuleId: 'instant-first' });
    expect(resumed.turns[1].runtime).toMatchObject({ contextCapsuleId: 'instant-second' });

    vi.mocked(getAdminDbOrThrow).mockReturnValue(createDb({ onSet: (path, data) => writes.push({ path, data }), threadData: null }) as never);
    await persistAskThreadTurn({ uid: 'analyst-b', capsuleId: DIRECT_ASK_HISTORY_CAPSULE_ID, threadId: 'home-direct', prompt: 'Separate user question', output: 'Separate answer' });
    expect(writes[4].path).toBe('users/analyst-b/capsules/thin-capsule-fallback/askThreads/home-direct');
  });

  it('removes undefined optional metadata before persisting without losing defined values or array positions', async () => {
    const writes: Array<{ path: string; data: unknown }> = [];
    vi.mocked(getAdminDbOrThrow).mockReturnValue(createDb({
      onSet: (path, data) => writes.push({ path, data }),
    }) as never);
    const timestamp = new Date('2026-09-22T12:00:00.000Z');
    const runtime = {
      provider: undefined,
      model: 'gemini-test',
      nested: { missing: undefined, disabled: false, zero: 0, empty: '', nullable: null },
      timestamp,
    };

    const turn = await persistAskThreadTurn({
      uid: 'user-1', capsuleId: 'capsule-one', prompt: 'Question', output: 'Answer',
      runtime,
      frameworkSteps: [{ id: 'step-1', optional: undefined }, undefined],
      toolInvocations: [{ result: { missing: undefined, sources: ['source-1', undefined] } }],
    });

    expect(turn?.runtime).toStrictEqual({
      model: 'gemini-test',
      nested: { disabled: false, zero: 0, empty: '', nullable: null },
      timestamp,
    });
    expect(turn?.runtime.timestamp).toBe(timestamp);
    expect(turn?.frameworkSteps).toStrictEqual([{ id: 'step-1' }, null]);
    expect(turn?.toolInvocations).toStrictEqual([{ result: { sources: ['source-1', null] } }]);
    expect(writes[1].data).toStrictEqual(turn);
    expect(runtime).toHaveProperty('provider', undefined);
    expect(runtime.nested).toHaveProperty('missing', undefined);
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

  it('keeps source provenance in both saved answer envelopes when source page locators are absent', () => {
    const envelope = {
      sourceCards: [{
        id: 'document-1:paragraph-2',
        documentId: 'document-1',
        sourceReceiptId: 'receipt-1',
        quotePreview: 'Example Council has not confirmed the funding.',
        pageRef: undefined,
        paragraphRef: 'paragraph-2',
        confidence: 0,
      }],
      workflow: { optional: undefined, approved: false },
    };
    const increment = FieldValue.increment(1);
    const timestamp = new Date('2026-09-29T23:32:00.000Z');
    const input = {
      answerEnvelope: envelope,
      runtime: { answerEnvelope: envelope },
      toolInvocations: [{ sources: ['receipt-1', undefined, 'receipt-2'] }],
      nullable: null,
      empty: '',
      turnCount: increment,
      timestamp,
    };

    const saved = omitUndefinedMetadata(input);
    const expectedCard = {
      id: 'document-1:paragraph-2',
      documentId: 'document-1',
      sourceReceiptId: 'receipt-1',
      quotePreview: 'Example Council has not confirmed the funding.',
      paragraphRef: 'paragraph-2',
      confidence: 0,
    };
    expect(saved.answerEnvelope.sourceCards).toStrictEqual([expectedCard]);
    expect(saved.runtime.answerEnvelope.sourceCards).toStrictEqual([expectedCard]);
    expect(saved.answerEnvelope.workflow).toStrictEqual({ approved: false });
    expect(saved.toolInvocations).toStrictEqual([{ sources: ['receipt-1', null, 'receipt-2'] }]);
    expect(saved.nullable).toBeNull();
    expect(saved.empty).toBe('');
    expect(saved.turnCount).toBe(increment);
    expect(saved.timestamp).toBe(timestamp);
    expect(envelope.sourceCards[0]).toHaveProperty('pageRef', undefined);
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
