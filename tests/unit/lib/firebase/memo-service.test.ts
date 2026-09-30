import { describe, expect, it, vi } from 'vitest';
import { FieldValue, Firestore, GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { approveMemoBody, loadMemoById, memoDocumentId, saveMemoDraft } from '@/lib/firebase/memo-service';
import { buildMemoOutputReview } from '@/lib/memo/output-review';
import { readMemoContextSnapshot } from '@/lib/memo/context-snapshot';

type MemoTestRef = {
  path: string;
  collection: (name: string) => MemoTestRef;
  doc: (id: string) => MemoTestRef;
  get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
  set: (data: Record<string, unknown>, options?: { merge: boolean }) => Promise<void>;
  orderBy: () => { get: () => Promise<{ docs: Array<{ data: () => Record<string, unknown> }> }> };
};

describe('memo service helpers', () => {
  it('persists optional source receipts without losing review lineage or replaying an agent write', async () => {
    const fixture = createMemoDb({});
    const body = 'Funding approval remains unconfirmed.';
    const outputReview = await buildMemoOutputReview({ body, report: null, verifierStatus: 'disabled' });
    const receipt = {
      sourceReceiptId: 'receipt-web-1', title: 'Synthetic council statement', url: 'https://example.invalid/statement',
      snippet: body, provider: 'google_search', publishedDate: undefined, publisher: undefined,
      confidence: 0, originalPassageStatus: 'captured',
      passage: { paragraphRef: 'paragraph-2', pageRef: undefined, quote: body },
      generatedGroundingSegments: [{ sourceIndices: [0, undefined, 2], optional: undefined, reviewRequired: false }],
    };
    const input = {
      caseId: 'case-1', templateId: 'policy-memo' as const, title: 'Source-linked memo', graphSnapshotId: 'graph-1',
      runId: 'run-1', capsuleId: 'capsule-1', capsuleVersion: 3, conversationId: 'conversation-1',
      sourceReceiptIds: ['receipt-web-1'], sourceReceipts: [receipt], outputReview,
      operationId: 'agent:run-1:policy-memo',
      blocks: [{ id: 'live-memo-draft', type: 'paragraph' as const, content: body,
        citations: [{ nodeIds: ['claim-1'], sourceReceiptIds: ['receipt-web-1'], surface: 'footnote' as const }],
        metadata: { sourceReceipts: [receipt], artifactMetadata: { runId: 'run-1', outputReview } } }],
    };
    const record = await saveMemoDraft('user-1', input, fixture.db as never);
    const loaded = await loadMemoById('user-1', record.memo.id, fixture.db as never);
    const expectedReceipt = {
      sourceReceiptId: 'receipt-web-1', title: receipt.title, url: receipt.url, snippet: body, provider: 'google_search',
      confidence: 0, originalPassageStatus: 'captured', passage: { paragraphRef: 'paragraph-2', quote: body },
      generatedGroundingSegments: [{ sourceIndices: [0, null, 2], reviewRequired: false }],
    };
    expect(loaded?.memo).toMatchObject({ runId: 'run-1', capsuleId: 'capsule-1', capsuleVersion: 3,
      conversationId: 'conversation-1', sourceReceiptIds: ['receipt-web-1'], sourceReceipts: [expectedReceipt],
      status: 'review', outputReview, humanApproval: null });
    expect(loaded?.versions[0]).toMatchObject({ operationId: input.operationId, outputReview,
      graphSnapshotId: 'graph-1', blocks: [{ citations: input.blocks[0].citations,
        metadata: { sourceReceipts: [expectedReceipt], outputReview, artifactMetadata: { runId: 'run-1', outputReview } } }] });
    expect(record.memo).toHaveProperty('sourceReceipts', [expectedReceipt]);
    expect(record.versions[0]).not.toHaveProperty('changeNote');
    expect(receipt).toHaveProperty('publishedDate', undefined);
    expect(receipt.generatedGroundingSegments[0].sourceIndices[1]).toBeUndefined();
    const replay = await saveMemoDraft('user-1', input, fixture.db as never);
    expect(replay.versions).toHaveLength(1);
    expect(fixture.writePayloads).toHaveLength(2);
    const reviewed = await approveMemoBody('user-1', record.memo.id, {
      versionId: record.memo.currentVersionId, bodyHash: outputReview.bodyHash,
      intendedUse: 'internal-analysis', limitations: 'Synthetic supplied source; its publication date remains unavailable.',
    }, fixture.db as never);
    expect(reviewed?.memo).toMatchObject({ status: 'final', sourceReceipts: [expectedReceipt],
      sourceReceiptIds: ['receipt-web-1'], runId: 'run-1', capsuleId: 'capsule-1',
      humanApproval: { versionId: record.memo.currentVersionId, bodyHash: outputReview.bodyHash, reviewerUid: 'user-1' } });
    expect(reviewed?.versions[0].blocks[0].metadata.sourceReceipts).toStrictEqual([expectedReceipt]);
    expect(fixture.writePayloads).toHaveLength(4);
  });

  it('cleans optional nested version metadata on updates while preserving earlier source snapshots', async () => {
    const fixture = createMemoDb({});
    const initial = { caseId: 'case-1', templateId: 'policy-memo' as const, title: 'Memo', graphSnapshotId: 'graph-1',
      sourceReceipts: [{ sourceReceiptId: 'receipt-1', publishedDate: '2026-09-20' }],
      blocks: [{ id: 'memo-body', type: 'paragraph' as const, content: 'Initial statement.', citations: [],
        metadata: { sourceReceipts: [{ sourceReceiptId: 'receipt-1', publishedDate: '2026-09-20' }] } }] };
    await saveMemoDraft('user-1', initial, fixture.db as never);
    const updated = await saveMemoDraft('user-1', { ...initial,
      sourceReceipts: [{ sourceReceiptId: 'receipt-2', publishedDate: undefined }],
      blocks: [{ ...initial.blocks[0], title: undefined, content: 'Funding remains unconfirmed.',
        metadata: { sourceReceipts: [{ sourceReceiptId: 'receipt-2', publishedDate: undefined }],
          claimChecks: [{ supported: false, unavailableReason: undefined, confidence: 0, passage: null }] } }] }, fixture.db as never);
    const loaded = await loadMemoById('user-1', updated.memo.id, fixture.db as never);
    expect(loaded?.memo.sourceReceipts).toStrictEqual([{ sourceReceiptId: 'receipt-2' }]);
    expect(loaded?.versions).toHaveLength(2);
    expect(loaded?.versions[0].blocks[0].metadata.sourceReceipts).toStrictEqual(initial.sourceReceipts);
    expect(loaded?.versions[1].blocks[0]).not.toHaveProperty('title');
    expect(loaded?.versions[1].blocks[0].metadata).toStrictEqual({
      sourceReceipts: [{ sourceReceiptId: 'receipt-2' }],
      claimChecks: [{ supported: false, confidence: 0, passage: null }],
    });
    expect(updated.versions[1].blocks).toStrictEqual(loaded?.versions[1].blocks);
    expect(fixture.writePayloads).toHaveLength(4);
  });

  it('preserves Firestore-native values and array positions in memo and version writes', async () => {
    const fixture = createMemoDb({});
    const firestore = new Firestore({ projectId: 'praxis-unit-tests' });
    const sourceRef = firestore.doc('sources/receipt-1');
    const capturedAt = Timestamp.fromDate(new Date('2026-09-30T12:00:00Z'));
    const observedAt = new Date('2026-09-29T12:00:00Z');
    const location = new GeoPoint(40.7, -74);
    const bytes = Buffer.from('source passage');
    const metadata = { sourceRef, capturedAt, observedAt, location, bytes, optional: undefined,
      positions: ['receipt-1', undefined, 'receipt-2'], missing: null, empty: '', enabled: false, confidence: 0 };
    const record = await saveMemoDraft('user-1', { caseId: 'case-1', templateId: 'policy-memo', title: 'Memo',
      graphSnapshotId: 'graph-1', sourceReceipts: [metadata],
      blocks: [{ id: 'memo-body', type: 'paragraph', content: 'Synthetic supplied note.', citations: [], metadata }] }, fixture.db as never);
    const [parentWrite, versionWrite] = fixture.writePayloads;
    const parentMetadata = (parentWrite.data.sourceReceipts as Array<typeof metadata>)[0];
    const versionMetadata = (versionWrite.data.blocks as Array<{ metadata: typeof metadata }>)[0].metadata;
    for (const saved of [parentMetadata, versionMetadata, record.versions[0].blocks[0].metadata]) {
      expect(saved.sourceRef).toBe(sourceRef);
      expect(saved.capturedAt).toBe(capturedAt);
      expect(saved.observedAt).toBe(observedAt);
      expect(saved.location).toBe(location);
      expect(saved.bytes).toBe(bytes);
      expect(saved).not.toHaveProperty('optional');
      expect(saved.positions).toStrictEqual(['receipt-1', null, 'receipt-2']);
      expect(saved).toMatchObject({ missing: null, empty: '', enabled: false, confidence: 0 });
    }
    expect(parentWrite.data.updatedAtServer).toBeInstanceOf(FieldValue);
    expect((parentWrite.data.updatedAtServer as FieldValue).isEqual(FieldValue.serverTimestamp())).toBe(true);
  });

  const contextDraft = { caseId: 'case-1', templateId: 'policy-memo' as const, title: 'Memo', graphSnapshotId: 'graph-1',
    blocks: [{ id: 'memo-body', type: 'paragraph' as const, content: 'A draft.', citations: [], metadata: {} }] };

  it('omits absent change notes and nested optional fields at the Firestore save boundary', async () => {
    const fixture = createMemoDb({});
    const record = await saveMemoDraft('user-1', { ...contextDraft, blocks: [{ ...contextDraft.blocks[0],
      title: undefined, items: undefined, metadata: { optional: undefined,
        nested: { absent: undefined, retained: null }, steps: ['first', undefined, 'last'],
        enabled: false, count: 0, empty: '' },
    }] }, fixture.db as never);
    const loaded = await loadMemoById('user-1', record.memo.id, fixture.db as never);
    const expectedMetadata = { nested: { retained: null }, steps: ['first', null, 'last'], enabled: false, count: 0, empty: '' };
    for (const version of [record.versions[0], loaded?.versions[0]]) {
      expect(version).not.toHaveProperty('changeNote');
      expect(version?.blocks[0]).not.toHaveProperty('title');
      expect(version?.blocks[0]).not.toHaveProperty('items');
      expect(version?.blocks[0].metadata).toEqual(expectedMetadata);
    }
    expect(loaded?.memo).toMatchObject(record.memo);
  });

  it('models Firestore rejection of undefined values rather than hiding them during JSON cloning', async () => {
    const fixture = createMemoDb({});
    const ref = fixture.db.collection('users').doc('user-1');
    await expect(ref.set({ changeNote: undefined })).rejects.toThrow('document.changeNote');
    await expect(fixture.db.runTransaction(async (transaction) => {
      transaction.set(ref, { metadata: { values: ['first', undefined] } });
    })).rejects.toThrow('document.metadata.values[1]');
    expect(fixture.records['users/user-1']).toEqual({ uid: 'user-1' });
  });

  it('preserves an explicit change note with the exact version-owned context snapshot', async () => {
    const fixture = createMemoDb({});
    const record = await saveMemoDraft('user-1', { ...contextDraft, changeNote: 'Reviewed the supplied source.',
      capsuleId: 'cap-1', capsuleVersion: 2, sourceReceiptIds: ['source-1'], sourceReceipts: [{ id: 'source-1' }] }, fixture.db as never);
    const loaded = await loadMemoById('user-1', record.memo.id, fixture.db as never);
    expect(loaded?.versions[0]).toMatchObject({ changeNote: 'Reviewed the supplied source.', contextSnapshot: {
      capsuleId: 'cap-1', capsuleVersion: 2, sourceReceiptIds: ['source-1'], sourceReceipts: [{ id: 'source-1' }],
    } });
    const savedVersion = fixture.records[`users/user-1/situations/case-1/memos/${record.memo.id}/versions/${record.versions[0].id}`];
    expect(readMemoContextSnapshot(savedVersion.contextSnapshot)).toMatchObject({ binding: 'recorded', capsuleId: 'cap-1', capsuleVersion: 2 });
    expect(loaded?.versions[0].contextSnapshot).toEqual(savedVersion.contextSnapshot);
  });

  it('records an explicit empty context for a first save without context', async () => {
    const fixture = createMemoDb({});
    const record = await saveMemoDraft('user-1', contextDraft, fixture.db as never);
    const loaded = await loadMemoById('user-1', record.memo.id, fixture.db as never);
    expect(loaded?.versions[0].contextSnapshot).toMatchObject({ schemaVersion: 1, binding: 'recorded',
      capsuleId: null, capsuleVersion: null, sourceReceipts: [], sourceReceiptIds: [] });
  });

  it('detaches new context and stale source references while preserving the prior immutable version', async () => {
    const fixture = createMemoDb({});
    const source = { id: 'source-1', title: 'Original source' };
    const first = await saveMemoDraft('user-1', { ...contextDraft, capsuleId: 'cap-1', capsuleVersion: 2,
      sourceReceiptIds: ['source-1'], sourceReceipts: [source], unsupportedClaims: ['Unverified'],
      claimChecks: [{ claim: 'Unverified' }], outputCapsuleId: 'output-cap' }, fixture.db as never);
    source.title = 'Caller mutation';
    await saveMemoDraft('user-1', { ...contextDraft, capsuleId: null, capsuleVersion: null }, fixture.db as never);
    const loaded = await loadMemoById('user-1', first.memo.id, fixture.db as never);
    expect(loaded?.memo).toMatchObject({ capsuleId: null, capsuleVersion: null, sourceReceipts: [], sourceReceiptIds: [],
      unsupportedClaims: [], claimChecks: [], outputCapsuleId: null });
    expect(loaded?.versions[0].contextSnapshot).toMatchObject({ binding: 'recorded', capsuleId: 'cap-1', capsuleVersion: 2,
      sourceReceipts: [{ id: 'source-1', title: 'Original source' }], sourceReceiptIds: ['source-1'] });
    expect(loaded?.versions[1].contextSnapshot).toMatchObject({ binding: 'recorded', capsuleId: null, capsuleVersion: null,
      sourceReceipts: [], sourceReceiptIds: [] });
  });

  it('inherits only the prior recorded version when ordinary edits omit context, even if the envelope was mutated', async () => {
    const fixture = createMemoDb({});
    const first = await saveMemoDraft('user-1', { ...contextDraft, capsuleId: 'cap-1', capsuleVersion: 2,
      sourceReceipts: [{ id: 'source-1' }], sourceReceiptIds: ['source-1'] }, fixture.db as never);
    const path = `users/user-1/situations/case-1/memos/${first.memo.id}`;
    fixture.records[path] = { ...fixture.records[path], capsuleId: 'new-cap', capsuleVersion: 99,
      sourceReceipts: [{ id: 'mutable-source' }], sourceReceiptIds: ['mutable-source'],
      contextSnapshot: { ...fixture.records[path].contextSnapshot as object, capsuleId: 'new-cap', capsuleVersion: 99 } };
    await saveMemoDraft('user-1', { ...contextDraft, blocks: [{ ...contextDraft.blocks[0], content: 'An edited draft.' }] }, fixture.db as never);
    const loaded = await loadMemoById('user-1', first.memo.id, fixture.db as never);
    expect(loaded?.versions[1].contextSnapshot).toEqual(loaded?.versions[0].contextSnapshot);
    expect(loaded?.memo).toMatchObject({ capsuleId: 'cap-1', capsuleVersion: 2, sourceReceiptIds: ['source-1'] });
  });

  it('preserves explicitly empty independent source lists instead of inheriting them', async () => {
    const fixture = createMemoDb({});
    const first = await saveMemoDraft('user-1', { ...contextDraft, capsuleId: 'cap-1', capsuleVersion: 2,
      sourceReceipts: [{ id: 'source-1' }], sourceReceiptIds: ['source-1'] }, fixture.db as never);
    await saveMemoDraft('user-1', { ...contextDraft, sourceReceiptIds: [], sourceReceipts: [] }, fixture.db as never);
    const loaded = await loadMemoById('user-1', first.memo.id, fixture.db as never);
    expect(loaded?.versions[1].contextSnapshot).toMatchObject({ capsuleId: 'cap-1', capsuleVersion: 2,
      sourceReceiptIds: [], sourceReceipts: [] });
    await saveMemoDraft('user-1', { ...contextDraft, capsuleId: null, capsuleVersion: null,
      sourceReceiptIds: ['independent'], sourceReceipts: [{ id: 'independent' }] }, fixture.db as never);
    const detached = await loadMemoById('user-1', first.memo.id, fixture.db as never);
    expect(detached?.versions[2].contextSnapshot).toMatchObject({ capsuleId: null, capsuleVersion: null,
      sourceReceiptIds: ['independent'], sourceReceipts: [{ id: 'independent' }] });
  });

  it.each([undefined, { schemaVersion: 1, binding: 'recorded', capsuleId: 'cap-1' }])(
    'keeps legacy or malformed context unbound until an explicit selection or detach: %j', async (contextSnapshot) => {
      const memoId = memoDocumentId('case-1', 'policy-memo');
      const path = `users/user-1/situations/case-1/memos/${memoId}`;
      const fixture = createMemoDb({ [path]: { id: memoId, caseId: 'case-1', templateId: 'policy-memo', ownerUid: 'user-1',
        currentVersionId: 'v1', title: 'Legacy', capsuleId: 'cap-1', capsuleVersion: 2 },
      [`${path}/versions/v1`]: { id: 'v1', memoId, versionNumber: 1, blocks: contextDraft.blocks,
        ...(contextSnapshot ? { contextSnapshot } : {}) } });
      await saveMemoDraft('user-1', contextDraft, fixture.db as never);
      let loaded = await loadMemoById('user-1', memoId, fixture.db as never);
      expect(loaded?.versions[1].contextSnapshot).toMatchObject({ binding: 'legacy-unbound', capsuleId: null,
        capsuleVersion: null, sourceReceiptIds: [], sourceReceipts: [] });
      await saveMemoDraft('user-1', { ...contextDraft, capsuleId: null, capsuleVersion: null }, fixture.db as never);
      loaded = await loadMemoById('user-1', memoId, fixture.db as never);
      expect(readMemoContextSnapshot(loaded?.versions[2].contextSnapshot)).toMatchObject({ binding: 'recorded', capsuleId: null });
    });

  it('refuses partial capsule pins and clears inherited sources when selecting a different exact version', async () => {
    const fixture = createMemoDb({});
    const first = await saveMemoDraft('user-1', { ...contextDraft, capsuleId: 'cap-1', capsuleVersion: 2,
      sourceReceipts: [{ id: 'source-1' }], sourceReceiptIds: ['source-1'] }, fixture.db as never);
    await expect(saveMemoDraft('user-1', { ...contextDraft, capsuleId: 'other-cap' }, fixture.db as never)).rejects.toThrow(/both its ID/i);
    await saveMemoDraft('user-1', { ...contextDraft, capsuleId: 'cap-1', capsuleVersion: 3 }, fixture.db as never);
    const loaded = await loadMemoById('user-1', first.memo.id, fixture.db as never);
    expect(loaded?.versions).toHaveLength(2);
    expect(loaded?.versions[1].contextSnapshot).toMatchObject({ binding: 'recorded', capsuleId: 'cap-1', capsuleVersion: 3,
      sourceReceipts: [], sourceReceiptIds: [] });
  });

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
  const writePayloads: Array<{ path: string; data: Record<string, unknown> }> = [];
  const refFor = (path: string): MemoTestRef => ({
    path,
    collection: (name: string) => refFor(`${path}/${name}`),
    doc: (id: string) => refFor(`${path}/${id}`),
    get: async () => {
      readPaths.push(path);
      return { exists: Boolean(records[path]), data: () => records[path] };
    },
    set: async (data, options) => {
      assertFirestoreWritable(data);
      writePayloads.push({ path, data });
      records[path] = options?.merge ? { ...records[path], ...data } : data;
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
    records,
    db: { collection: (name: string) => refFor(name), collectionGroup: vi.fn(() => query),
      runTransaction: async (work: (transaction: { get: (ref: MemoTestRef) => ReturnType<MemoTestRef['get']>; set: (ref: MemoTestRef, data: Record<string, unknown>, options?: { merge: boolean }) => void }) => Promise<void>) => {
        const writes: Array<() => Promise<void>> = [];
        await work({ get: (ref) => ref.get(), set: (ref, data, options) => {
          assertFirestoreWritable(data);
          writes.push(() => ref.set(data, options));
        } });
        for (const write of writes) await write();
      } },
    readPaths,
    writePayloads,
    where: query.where,
  };
}

/** Match Firestore's write-time rejection; JSON cloning used to hide this defect. */
function assertFirestoreWritable(value: unknown, path = 'document'): void {
  if (value === undefined) throw new Error(`Firestore rejects undefined at ${path}`);
  if (Array.isArray(value)) {
    Array.from(value).forEach((entry, index) => assertFirestoreWritable(entry, `${path}[${index}]`));
  } else if (value !== null && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      for (const [key, entry] of Object.entries(value)) assertFirestoreWritable(entry, `${path}.${key}`);
    }
  }
}
