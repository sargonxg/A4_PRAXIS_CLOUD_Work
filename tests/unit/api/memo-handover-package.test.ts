import JSZip from 'jszip';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signMemoHumanApproval } from '@/lib/memo/human-review-server';
import { sha256, verifyHandoverIntegrity, type HandoverIntegrityManifest } from '@/lib/memo/handover-package';
import { recordMemoContextSnapshot } from '@/lib/memo/context-snapshot';

const mocks = vi.hoisted(() => ({ load: vi.fn(), capsule: vi.fn(), historical: vi.fn(), collection: vi.fn(), doc: vi.fn(),
  save: vi.fn(), signedUrl: vi.fn(), set: vi.fn(), filePath: vi.fn(), ownerGet: vi.fn(), deleteFile: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: unknown) => handler }));
vi.mock('@/lib/firebase/memo-service', () => ({ loadMemoById: mocks.load,
  primaryMemoBody: (blocks: Array<{ content: string }>) => blocks[0]?.content ?? '' }));
vi.mock('@/lib/firebase/admin', () => {
  type Reference = { path: string; get: () => Promise<unknown> };
  const ref = (path: string): unknown => ({ path,
    collection: (name: string) => { mocks.collection(name); return ref(path ? `${path}/${name}` : name); },
    doc: (id: string) => { mocks.doc(id); return ref(`${path}/${id}`); },
    get: () => path === 'users/owner' ? mocks.ownerGet()
      : path.startsWith('users/owner/capsules/') && !path.includes('/versions/')
        ? mocks.capsule().then((data: unknown) => ({ exists: Boolean(data), data: () => data })) : mocks.historical(),
    set: mocks.set,
  });
  const db = { ...ref('') as object, runTransaction: async (work: (transaction: unknown) => Promise<unknown>) => work({
    get: (reference: Reference) => reference.get(),
    set: (_reference: unknown, value: unknown, options: unknown) => mocks.set(value, options),
  }) };
  return { getAdminDbOrThrow: () => db, getDefaultBucketName: () => 'private-bucket',
    getAdminStorage: () => ({ bucket: () => ({ file: mocks.filePath }) }) };
});
import { GET, POST } from '@/app/api/memos/[id]/handover-package/route';

const user = { uid: 'owner', email: 'owner@example.test', name: 'Owner', isDemo: false };
const context = { params: Promise.resolve({ id: 'memo-1' }) };
type Handler = (request: Request, principal: typeof user, routeContext: typeof context) => Promise<Response>;
const get = (principal = user, id = 'memo-1') => (GET as unknown as Handler)(new Request('https://praxis.test/api/memos/memo-1/handover-package'), principal,
  { params: Promise.resolve({ id }) });
const post = (body?: unknown, headers: Record<string, string> = {}) => (POST as unknown as Handler)(new Request('https://praxis.test/api/memos/memo-1/handover-package', {
  method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } }),
}), user, context);

function loadedMemo() {
  const contextSnapshot = recordMemoContextSnapshot({ capsuleId: 'cap-1', capsuleVersion: 2,
    sourceReceipts: [{ id: 'source-1', title: '=SUM(A1:A2)', publisher: 'Publisher', url: 'https://example.test/report',
      secret: 'SECRET_SOURCE_TOKEN', excerpt: 'PRIVATE_SOURCE_TEXT' }], sourceReceiptIds: ['source-1'] }, undefined, false);
  return { memo: { id: 'memo-1', ownerUid: 'owner', title: 'A saved memo', currentVersionId: 'v1', caseId: 'case-1',
    capsuleId: 'cap-1', capsuleVersion: 2, humanApproval: null as unknown,
    sourceReceipts: [{ id: 'source-1', title: '=SUM(A1:A2)', publisher: 'Publisher', url: 'https://example.test/report',
      secret: 'SECRET_SOURCE_TOKEN', excerpt: 'PRIVATE_SOURCE_TEXT' }], sourceReceiptIds: ['source-1'] },
    versions: [{ id: 'v1', memoId: 'memo-1', contextSnapshot: contextSnapshot as unknown,
      blocks: [{ content: 'A saved body with caveats.' }] }] };
}

describe('owner-scoped preview-confirmed memo handover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.load.mockResolvedValue(loadedMemo());
    mocks.capsule.mockResolvedValue({ ownerUid: 'owner', capsuleId: 'cap-1', version: 2, schemaVersion: 3,
      label: 'Pinned context', purpose: 'A decision', coreRefs: { documentCoreIds: ['document-1'] }, privateNotes: 'PRIVATE_CAPSULE_NOTE' });
    mocks.historical.mockResolvedValue({ exists: false, data: () => undefined });
    mocks.ownerGet.mockResolvedValue({ exists: true, data: () => ({ uid: 'owner' }) });
    mocks.filePath.mockReturnValue({ save: mocks.save, getSignedUrl: mocks.signedUrl, delete: mocks.deleteFile });
    mocks.deleteFile.mockResolvedValue(undefined);
    mocks.save.mockResolvedValue(undefined); mocks.signedUrl.mockResolvedValue(['https://storage.test/temporary-download']); mocks.set.mockResolvedValue(undefined);
  });

  it('previews exact pinned context, limitations and dependencies without package writes', async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    const payload = await response.json();
    expect(payload.preview).toMatchObject({ mode: 'draft', memoVersionId: 'v1', capsule: { resolvedVersion: 2, status: 'pinned' } });
    expect(payload.preview.unresolvedDependencies).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'document-1' })]));
    expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.set).not.toHaveBeenCalled();
  });

  it('requires preview confirmation for legacy or changed requests, without writes', async () => {
    const first = await (await get()).json();
    const legacy = await post();
    expect(legacy.status).toBe(409); expect((await legacy.json()).previewRequired).toBe(true);
    const changed = loadedMemo(); changed.versions[0].blocks[0].content = 'A newer changed body.';
    mocks.load.mockResolvedValue(changed);
    const stale = await post({ previewHash: first.preview.previewHash });
    expect(stale.status).toBe(409); expect((await stale.json()).code).toBe('preview_changed');
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('uses only the saved version context even when the mutable memo envelope changes', async () => {
    const first = await (await get()).json();
    const changed = loadedMemo();
    changed.memo.capsuleId = 'new-envelope-cap'; changed.memo.capsuleVersion = 99;
    changed.memo.sourceReceiptIds = ['mutable-source']; changed.memo.sourceReceipts = [];
    mocks.load.mockResolvedValue(changed);
    const next = await (await get()).json();
    expect(next.preview.previewHash).toBe(first.preview.previewHash);
    expect(next.preview.capsule).toMatchObject({ capsuleId: 'cap-1', resolvedVersion: 2 });
    expect((await post({ previewHash: first.preview.previewHash })).status).toBe(200);
  });

  it('exports an explicit no-capsule marker instead of inheriting old mutable envelope references', async () => {
    const memo = loadedMemo();
    memo.versions[0].contextSnapshot = recordMemoContextSnapshot({ capsuleId: null, capsuleVersion: null }, undefined, false);
    mocks.load.mockResolvedValue(memo);
    const { preview } = await (await get()).json();
    expect(preview.capsule).toMatchObject({ capsuleId: null, requestedVersion: null, resolvedVersion: null, status: 'none' });
    expect(mocks.capsule).not.toHaveBeenCalled();
    expect((await post({ previewHash: preview.previewHash })).status).toBe(200);
    const zip = await JSZip.loadAsync(mocks.save.mock.calls[0][0]);
    expect(await zip.file('source-receipts.json')!.async('string')).toBe('[]');
    expect(await zip.file('capsule-snapshot.json')!.async('string')).not.toContain('cap-1');
  });

  it.each([undefined, { schemaVersion: 1, capsuleId: 'cap-1' }, recordMemoContextSnapshot({}, undefined, true)])(
    'blocks missing, malformed and explicitly unbound legacy snapshots: %j', async (contextSnapshot) => {
      const memo = loadedMemo(); memo.versions[0].contextSnapshot = contextSnapshot;
      mocks.load.mockResolvedValue(memo);
      const response = await get();
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ code: 'memo_context_unrecorded' });
      expect((await post({ previewHash: `sha256:${'0'.repeat(64)}` })).status).toBe(409);
      expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.set).not.toHaveBeenCalled();
    });

  it('uses an owner-scoped historical version instead of substituting newer context', async () => {
    mocks.capsule.mockResolvedValue({ ownerUid: 'owner', capsuleId: 'cap-1', version: 3, label: 'NEWER_CONTEXT' });
    mocks.historical.mockResolvedValue({ exists: true, data: () => ({ ownerUid: 'owner', capsuleId: 'cap-1', version: 2, label: 'Historical context' }) });
    const payload = await (await get()).json();
    expect(payload.preview.capsule).toMatchObject({ resolvedVersion: 2, label: 'Historical context' });
    expect(mocks.doc).toHaveBeenCalledWith('v2');
    mocks.historical.mockResolvedValue({ exists: true, data: () => ({ ownerUid: 'other', capsuleId: 'cap-1', version: 2 }) });
    expect((await get()).status).toBe(409);
    mocks.historical.mockResolvedValue({ exists: false });
    expect((await get()).status).toBe(409);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('preserves owner-scoped historical lineage after archival without reviving an active attachment', async () => {
    mocks.capsule.mockResolvedValue({ ownerUid: 'owner', capsuleId: 'cap-1', version: 3,
      archivedAt: '2026-09-30T12:00:00.000Z', label: 'Archived current context' });
    mocks.historical.mockResolvedValue({ exists: true, data: () => ({ ownerUid: 'owner', capsuleId: 'cap-1', version: 2,
      label: 'Original historical context' }) });
    const payload = await (await get()).json();
    expect(payload.preview.capsule).toMatchObject({ resolvedVersion: 2, label: 'Original historical context' });
    expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.set).not.toHaveBeenCalled();
  });

  it.each([{ ownerUid: undefined }, { ownerUid: 'other' }, { capsuleId: undefined }, { version: undefined }])(
    'does not infer raw current identity or exact version through normalization: %j', async (identity) => {
      mocks.capsule.mockResolvedValue({ ownerUid: 'owner', capsuleId: 'cap-1', version: 2, ...identity });
      expect((await get()).status).toBe(409);
      expect(mocks.save).not.toHaveBeenCalled();
    });

  it.each(['forged', 'changed-body', 'wrong-reviewer', 'stale-version'])('never certifies %s approval', async (caseName) => {
    const memo = loadedMemo();
    const approval = signMemoHumanApproval({ memoId: 'memo-1', versionId: 'v1', reviewerUid: caseName === 'wrong-reviewer' ? 'other' : 'owner',
      bodyHash: sha256('A saved body with caveats.'), approvedAt: '2026-09-30T12:00:00.000Z', intendedUse: 'internal-analysis', limitations: 'No independent verification.' });
    if (caseName === 'forged') approval.attestation = 'forged';
    if (caseName === 'changed-body') memo.versions[0].blocks[0].content = 'Edited body';
    if (caseName === 'stale-version') approval.versionId = 'old';
    memo.memo.humanApproval = approval; mocks.load.mockResolvedValue(memo);
    expect((await (await get()).json()).preview.mode).toBe('draft');
  });

  it('preserves body-bound review use without treating it as analytical verification', async () => {
    const memo = loadedMemo();
    memo.memo.humanApproval = signMemoHumanApproval({ memoId: 'memo-1', versionId: 'v1', reviewerUid: 'owner', bodyHash: sha256('A saved body with caveats.'),
      approvedAt: '2026-09-30T12:00:00.000Z', intendedUse: 'internal-analysis', limitations: 'Internal analysis only.' });
    mocks.load.mockResolvedValue(memo);
    expect((await (await get()).json()).preview).toMatchObject({ mode: 'human-reviewed', review: { intendedUse: 'internal-analysis', limitations: 'Internal analysis only.' } });
  });

  it('creates real files with verifiable hashes, sanitized metadata and distinct temporary download access', async () => {
    const { preview } = await (await get()).json();
    const response = await post({ previewHash: preview.previewHash });
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.signedUrl).toBe('https://storage.test/temporary-download');
    expect(payload.access).toMatchObject({ kind: 'temporary-bearer-download', contentSignature: false, grantsSourcePermissions: false, expiryDeletesStoredPackage: false });
    expect(payload.integrity).toMatchObject({ contentSignature: false, analyticalVerification: false });
    const bytes = mocks.save.mock.calls[0][0] as Buffer;
    expect(payload.integrity.packageHash).toBe(sha256(bytes));
    const zip = await JSZip.loadAsync(bytes);
    const manifestText = await zip.file('integrity-manifest.json')!.async('string');
    expect(payload.integrity.manifestHash).toBe(sha256(manifestText));
    const manifest = JSON.parse(manifestText) as HandoverIntegrityManifest;
    const fileBytes = Object.fromEntries(await Promise.all(manifest.files.map(async (file) => [file.path, await zip.file(file.path)!.async('uint8array')])));
    expect(verifyHandoverIntegrity(manifest, fileBytes).valid).toBe(true);
    const markdown = await zip.file('memo.md')!.async('string');
    expect(markdown).toContain('DRAFT — human review required');
    expect(markdown).toContain('A saved body with caveats.');
    const capsule = await zip.file('capsule-snapshot.json')!.async('string');
    const sources = await zip.file('source-receipts.json')!.async('string');
    expect(capsule).not.toContain('PRIVATE_CAPSULE_NOTE');
    expect(sources).not.toContain('SECRET_SOURCE_TOKEN'); expect(sources).not.toContain('PRIVATE_SOURCE_TEXT');
    expect(await zip.file('receipt-ledger.csv')!.async('string')).toContain("'=SUM(A1:A2)");
    expect((await zip.file('memo.pdf')!.async('nodebuffer')).subarray(0, 5).toString()).toBe('%PDF-');
    expect((await zip.file('memo.docx')!.async('nodebuffer')).subarray(0, 2).toString()).toBe('PK');
    expect(mocks.filePath.mock.calls[0][0]).toMatch(/^users\/owner\/handover-packages\/memo-1-/);
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ capsuleVersion: 2, memoVersionId: 'v1', reviewMode: 'draft' }), { merge: true });
  });

  it('blocks demo, foreign/missing records and malformed IDs', async () => {
    expect((await get({ ...user, isDemo: true })).status).toBe(403);
    const memo = loadedMemo(); memo.memo.ownerUid = 'other'; mocks.load.mockResolvedValue(memo);
    expect((await get()).status).toBe(404);
    mocks.load.mockResolvedValue(null); expect((await get()).status).toBe(404);
    expect((await get(user, '../memo')).status).toBe(400);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('checks account availability again after package preparation and before uploading', async () => {
    const { preview } = await (await get()).json();
    mocks.ownerGet.mockResolvedValue({ exists: true, data: () => ({ accountDeletionStatus: 'deleting' }) });
    const response = await post({ previewHash: preview.previewHash });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'ACCOUNT_UNAVAILABLE', retryable: false });
    expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.set).not.toHaveBeenCalled();
  });

  it('removes a late uploaded object if deletion starts before the guarded receipt transaction', async () => {
    const { preview } = await (await get()).json();
    mocks.save.mockImplementationOnce(async () => {
      mocks.ownerGet.mockResolvedValue({ exists: true, data: () => ({ accountDeletionStatus: 'deleting' }) });
    });
    const response = await post({ previewHash: preview.previewHash });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: 'ACCOUNT_UNAVAILABLE' });
    expect(mocks.ownerGet).toHaveBeenCalledTimes(2);
    expect(mocks.save).toHaveBeenCalledOnce(); expect(mocks.deleteFile).toHaveBeenCalledWith({ ignoreNotFound: true });
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it('fails closed and compensates upload if the commit-time account state cannot be read', async () => {
    const { preview } = await (await get()).json();
    mocks.save.mockImplementationOnce(async () => { mocks.ownerGet.mockRejectedValueOnce(new Error('read unavailable')); });
    const response = await post({ previewHash: preview.previewHash });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'ACCOUNT_UNAVAILABLE', retryable: true });
    expect(mocks.deleteFile).toHaveBeenCalledOnce(); expect(mocks.set).not.toHaveBeenCalled();
  });

  it('removes an incomplete object and leaves no receipt if temporary URL signing fails', async () => {
    const { preview } = await (await get()).json();
    mocks.signedUrl.mockRejectedValueOnce(new Error('signing unavailable'));
    const response = await post({ previewHash: preview.previewHash });
    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.deleteFile).toHaveBeenCalledWith({ ignoreNotFound: true }); expect(mocks.set).not.toHaveBeenCalled();
  });

  it('rejects oversized/malformed confirmation and cross-origin requests before export', async () => {
    expect((await post({ previewHash: 'bad' })).status).toBe(400);
    expect((await post({ padding: 'x'.repeat(2200) })).status).toBe(400);
    expect((await post({ previewHash: `sha256:${'0'.repeat(64)}` }, { origin: 'https://foreign.test' })).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
