import { describe, expect, it, vi } from 'vitest';
import { approveMemoBody, loadMemoById, memoDocumentId, saveMemoDraft } from '@/lib/firebase/memo-service';
import { buildMemoOutputReview } from '@/lib/memo/output-review';

type MemoTestRef = {
  path: string;
  collection: (name: string) => MemoTestRef;
  doc: (id: string) => MemoTestRef;
  get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
  set: (data: Record<string, unknown>, options?: { merge: boolean }) => Promise<void>;
  orderBy: () => { get: () => Promise<{ docs: Array<{ data: () => Record<string, unknown> }> }> };
};

describe('memo service helpers', () => {
  it('records approval only for the current saved body and invalidates it after an edit', async () => {
    const fixture = createMemoDb({});
    const input = { caseId: 'case-1', templateId: 'policy-memo' as const, title: 'Memo', graphSnapshotId: 'graph-1',
      blocks: [{ id: 'memo-body', type: 'paragraph' as const, content: 'Expenditure is unknown.', citations: [], metadata: {} }] };
    const record = await saveMemoDraft('user-1', input, fixture.db as never);
    const review = await buildMemoOutputReview({ body: input.blocks[0].content, report: null, verifierStatus: 'disabled' });
    await expect(approveMemoBody('user-1', record.memo.id, { versionId: 'wrong-version', bodyHash: review.bodyHash,
      intendedUse: 'internal-analysis', limitations: 'Missing spending record.' }, fixture.db as never)).rejects.toThrow(/newer memo version/i);
    const approved = await approveMemoBody('user-1', record.memo.id, { versionId: record.memo.currentVersionId,
      bodyHash: review.bodyHash, intendedUse: 'internal-analysis', limitations: 'Missing spending record.' }, fixture.db as never);
    expect(approved?.memo).toMatchObject({ status: 'final', humanApproval: { reviewerUid: 'user-1', bodyHash: review.bodyHash } });
    await saveMemoDraft('user-1', { ...input, blocks: [{ ...input.blocks[0], content: 'Spending remains unsubstantiated.' }] }, fixture.db as never);
    expect((await loadMemoById('user-1', record.memo.id, fixture.db as never))?.memo.humanApproval).toBeNull();
  });

  it('replays an agent operation without adding a version or replacing later human edits', async () => {
    const fixture = createMemoDb({});
    const input = { caseId: 'case-1', templateId: 'policy-memo' as const, title: 'Memo', graphSnapshotId: 'graph-1', operationId: 'agent:run-1:policy-memo',
      blocks: [{ id: 'memo-body', type: 'paragraph' as const, content: 'Original.', citations: [], metadata: {} }] };
    await saveMemoDraft('user-1', input, fixture.db as never);
    await saveMemoDraft('user-1', { ...input, operationId: undefined, blocks: [{ ...input.blocks[0], content: 'Reviewed edit.' }] }, fixture.db as never);
    const replay = await saveMemoDraft('user-1', input, fixture.db as never);
    expect(replay.versions).toHaveLength(2);
    expect(replay.versions.at(-1)?.blocks[0].content).toBe('Reviewed edit.');
  });
  it('round-trips the same generated review receipt through memo, version, and primary block', async () => {
    const body = 'The policy was approved.';
    const outputReview = await buildMemoOutputReview({ body, report: null, verifierStatus: 'disabled' });
    const fixture = createMemoDb({});
    const record = await saveMemoDraft('user-1', { caseId: 'case-1', templateId: 'policy-memo', title: 'Memo',
      graphSnapshotId: 'graph-1', outputReview, blocks: [{ id: 'live-memo-draft', type: 'paragraph', content: body,
        citations: [], metadata: {} }] }, fixture.db as never);
    const loaded = await loadMemoById('user-1', record.memo.id, fixture.db as never);
    expect(loaded?.memo).toMatchObject({ status: 'review', outputReview });
    expect(loaded?.versions[0]).toMatchObject({ outputReview, blocks: [{ metadata: { outputReview } }] });
    expect(JSON.parse(JSON.stringify(loaded)).memo.outputReview).toEqual(outputReview);
  });

  it('keeps the original receipt stale and review-required when an edited primary block is saved through the existing API shape', async () => {
    const body = 'The policy was approved.';
    const outputReview = await buildMemoOutputReview({ body, verifierStatus: 'checked', report: {
      groundedClaims: [{ text: body, start: 0, end: body.length, claimCardIds: [], sourceReceiptIds: ['receipt-1'],
        graphPathIds: [], matchReasons: ['source_text_overlap'] }], ungroundedSpans: [], contradictedSpans: [], coverageScore: 1, notes: [],
    } });
    const fixture = createMemoDb({});
    const record = await saveMemoDraft('user-1', { caseId: 'case-1', templateId: 'policy-memo', title: 'Edited memo',
      graphSnapshotId: 'graph-1', status: 'final', blocks: [{ id: 'memo-body', type: 'paragraph', content: 'The policy was rejected.',
        citations: [], metadata: { artifactMetadata: { outputReview } } }] }, fixture.db as never);
    const loaded = await loadMemoById('user-1', record.memo.id, fixture.db as never);
    const stale = { ...outputReview, reviewRequired: true, exportReady: false };
    expect(loaded?.memo).toMatchObject({ status: 'review', outputReview: stale });
    expect(loaded?.versions[0]).toMatchObject({ outputReview: stale,
      blocks: [{ metadata: { outputReview: stale, artifactMetadata: { outputReview: stale } } }] });
  });

  it('builds stable Firestore document ids for case/template drafts', () => {
    expect(memoDocumentId('case/with#unsafe', 'policy-memo')).toBe('case_with_unsafe__policy-memo');
  });

  it('opens a canonical agent memo with its versions and evidence without a collection-group index', async () => {
    const memoId = 'DuWekjcCOUFF2tMyI1lq__policy-memo';
    const path = `users/user-1/situations/DuWekjcCOUFF2tMyI1lq/memos/${memoId}`;
    const fixture = createMemoDb({
      [path]: {
        id: memoId, caseId: 'DuWekjcCOUFF2tMyI1lq', templateId: 'policy-memo', ownerUid: 'user-1',
        title: 'Reviewed policy methods memo', currentVersionId: 'version-1', runId: 'run-1',
        sourceReceiptIds: ['receipt-document-1', 'receipt-web-1'],
      },
    }, { [path]: [{ id: 'version-1', memoId, versionNumber: 1, blocks: [{ id: 'finding-1', type: 'paragraph', content: 'Funding remains unconfirmed.' }] }] });

    const result = await loadMemoById('user-1', memoId, fixture.db as never);

    expect(result?.memo).toMatchObject({
      id: memoId, ownerUid: 'user-1', caseId: 'DuWekjcCOUFF2tMyI1lq', title: 'Reviewed policy methods memo',
      currentVersionId: 'version-1', runId: 'run-1', sourceReceiptIds: ['receipt-document-1', 'receipt-web-1'],
    });
    expect(result?.versions[0]).toMatchObject({ id: 'version-1', memoId, blocks: [{ id: 'finding-1', type: 'paragraph', content: 'Funding remains unconfirmed.' }] });
    expect(fixture.readPaths).toEqual([`users/user-1/memos/${memoId}`, path]);
    expect(fixture.db.collectionGroup).not.toHaveBeenCalled();
  });

  it('uses the final template delimiter when a canonical case ID contains underscores', async () => {
    const memoId = memoDocumentId('case__with_segment', 'frame-analysis');
    const fixture = createMemoDb({
      [`users/user-1/situations/case__with_segment/memos/${memoId}`]: {
        id: memoId, ownerUid: 'user-1', caseId: 'case__with_segment', templateId: 'frame-analysis', title: 'Narrative analysis',
      },
    });

    expect((await loadMemoById('user-1', memoId, fixture.db as never))?.memo.title).toBe('Narrative analysis');
    expect(fixture.db.collectionGroup).not.toHaveBeenCalled();
  });

  it.each([
    { ownerUid: 'user-2' },
    { id: 'different-id' },
    { caseId: 'different-case' },
    { templateId: 'sit-rep' },
  ])('refuses a canonical memo whose stored identity disagrees with its scoped address: %j', async (mismatch) => {
    const memoId = 'case-1__policy-memo';
    const fixture = createMemoDb({
      [`users/user-1/situations/case-1/memos/${memoId}`]: {
        id: memoId, ownerUid: 'user-1', caseId: 'case-1', templateId: 'policy-memo', ...mismatch,
      },
    });

    await expect(loadMemoById('user-1', memoId, fixture.db as never)).resolves.toBeNull();
    expect(fixture.db.collectionGroup).not.toHaveBeenCalled();
  });

  it('returns not found for an absent canonical memo without querying other users', async () => {
    const fixture = createMemoDb({});
    await expect(loadMemoById('user-1', 'missing__policy-memo', fixture.db as never)).resolves.toBeNull();
    expect(fixture.db.collectionGroup).not.toHaveBeenCalled();
  });

  it('retains root legacy memo support while rejecting an explicit different owner', async () => {
    const fixture = createMemoDb({
      'users/user-1/memos/legacy-root': { title: 'Legacy draft' },
      'users/user-1/memos/poisoned-root': { ownerUid: 'user-2', id: 'poisoned-root', title: 'Other owner' },
    });
    expect((await loadMemoById('user-1', 'legacy-root', fixture.db as never))?.memo.title).toBe('Legacy draft');
    await expect(loadMemoById('user-1', 'poisoned-root', fixture.db as never)).resolves.toBeNull();
    expect(fixture.db.collectionGroup).not.toHaveBeenCalled();
  });

  it('retains owner-filtered lookup for noncanonical historical memo IDs', async () => {
    const path = 'users/user-1/situations/historical/memos/old-id';
    const fixture = createMemoDb({ [path]: { id: 'old-id', ownerUid: 'user-1', title: 'Historical draft' } }, {}, path);

    expect((await loadMemoById('user-1', 'old-id', fixture.db as never))?.memo.title).toBe('Historical draft');
    expect(fixture.where).toHaveBeenCalledWith('ownerUid', '==', 'user-1');
    expect(fixture.where).toHaveBeenCalledWith('id', '==', 'old-id');
  });

  it('rejects a historical query result located under another user even if its owner field claims the caller', async () => {
    const path = 'users/user-2/situations/historical/memos/old-id';
    const fixture = createMemoDb({ [path]: { id: 'old-id', ownerUid: 'user-1', title: 'Wrong user path' } }, {}, path);
    await expect(loadMemoById('user-1', 'old-id', fixture.db as never)).resolves.toBeNull();
  });
});

function createMemoDb(
  records: Record<string, Record<string, unknown>>,
  versions: Record<string, Array<Record<string, unknown>>> = {},
  historicalMatchPath?: string,
) {
  records['users/user-1'] ??= { uid: 'user-1' };
  const readPaths: string[] = [];
  const refFor = (path: string): MemoTestRef => ({
    path,
    collection: (name: string) => refFor(`${path}/${name}`),
    doc: (id: string) => refFor(`${path}/${id}`),
    get: async () => {
      readPaths.push(path);
      return { exists: Boolean(records[path]), data: () => records[path] };
    },
    set: async (data, options) => {
      records[path] = JSON.parse(JSON.stringify(options?.merge ? { ...records[path], ...data } : data));
    },
    orderBy: () => ({
      get: async () => ({ docs: (versions[path.replace(/\/versions$/, '')]
        ?? Object.entries(records).filter(([key]) => key.startsWith(`${path}/`)).map(([, value]) => value))
        .map((data) => ({ data: () => data })) }),
    }),
  });
  const query: {
    where: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    get: () => Promise<{ docs: Array<{ ref: MemoTestRef; data: () => Record<string, unknown> | undefined }> }>;
  } = {
    where: vi.fn(() => query),
    limit: vi.fn(() => query),
    get: async () => {
      if (!historicalMatchPath) throw new Error('FAILED_PRECONDITION: The query requires an index');
      return { docs: [{ ref: refFor(historicalMatchPath), data: () => records[historicalMatchPath] }] };
    },
  };
  return {
    db: { collection: (name: string) => refFor(name), collectionGroup: vi.fn(() => query),
      runTransaction: async (work: (transaction: { get: (ref: MemoTestRef) => ReturnType<MemoTestRef['get']>; set: (ref: MemoTestRef, data: Record<string, unknown>, options?: { merge: boolean }) => void }) => Promise<void>) => {
        const writes: Array<() => Promise<void>> = [];
        await work({ get: (ref) => ref.get(), set: (ref, data, options) => { writes.push(() => ref.set(data, options)); } });
        for (const write of writes) await write();
      } },
    readPaths,
    where: query.where,
  };
}
