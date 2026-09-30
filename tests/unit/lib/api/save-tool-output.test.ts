import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));

import { saveToolOutput } from '@/lib/api/save-tool-output';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { DocumentOwnerUnavailableError } from '@/lib/documents/owner-write';
import { buildCapsuleArchitectProposal } from '@/lib/context/capsule-architect';

describe('saveToolOutput', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes canonical tool-data and legacy tools documents with profile version', async () => {
    const legacySetMock = vi.fn().mockResolvedValue(undefined);
    const canonicalSetMock = vi.fn().mockResolvedValue(undefined);
    const versionSetMock = vi.fn().mockResolvedValue(undefined);
    const versionDocMock = vi.fn(() => ({ set: versionSetMock }));
    const versionsCollMock = vi.fn(() => ({ doc: versionDocMock }));
    const toolsDocMock = vi.fn(() => ({ set: legacySetMock }));
    const toolDataDocMock = vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ exists: false }),
      set: canonicalSetMock,
      collection: versionsCollMock,
    }));
    const toolsCollMock = vi.fn(() => ({ doc: toolsDocMock }));
    const toolDataCollMock = vi.fn(() => ({ doc: toolDataDocMock }));
    const situationsDocMock = vi.fn(() => ({
      collection: vi.fn((name: string) => {
        if (name === 'tools') return toolsCollMock();
        if (name === 'tool-data') return toolDataCollMock();
        throw new Error(`Unexpected collection ${name}`);
      }),
    }));
    const situationsCollMock = vi.fn(() => ({ doc: situationsDocMock }));
    const usersDocMock = vi.fn(() => ({ collection: situationsCollMock }));
    const db = { collection: vi.fn(() => ({ doc: usersDocMock })) };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    await saveToolOutput({
      uid: 'u1', situationId: 's1', toolId: 'risk-monitor',
      profileVersion: 3, output: { score: 8 },
    });
    expect(canonicalSetMock).toHaveBeenCalledWith(expect.objectContaining({
      data: { score: 8 }, profileVersion: 3, version: 1,
    }), expect.any(Object));
    expect(versionSetMock).toHaveBeenCalledWith(expect.objectContaining({
      data: { score: 8 }, profileVersion: 3, version: 1,
    }));
    expect(legacySetMock).toHaveBeenCalledWith(expect.objectContaining({
      output: { score: 8 }, profileVersion: 3, version: 1,
    }), expect.any(Object));
  });

  it('is a no-op when situationId is absent', async () => {
    const db = { collection: vi.fn() };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    await saveToolOutput({ uid: 'u1', situationId: undefined, toolId: 'chat', profileVersion: 0, output: 'hi' });
    expect(db.collection).not.toHaveBeenCalled();
  });

  it('atomically saves actual architect output without undefined optional dates or metadata', async () => {
    const fixture = guardedReceiptDb();
    vi.mocked(getAdminDbOrThrow).mockReturnValue(fixture.db as never);
    const proposal = buildCapsuleArchitectProposal({ jobPrompt: 'Inspect supplied notes.', documents: [
      { documentId: 'source-A', title: 'Notes', text: 'Actor: Example Council.' },
    ], normalizedAt: '2026-09-30T12:00:00Z' });
    expect(proposal.temporality).toHaveProperty('validFrom', undefined);
    await saveToolOutput({ uid: 'u1', situationId: 's1', toolId: 'capsule-builder-architect', profileVersion: 0,
      output: { proposal, patch: { temporality: proposal.temporality } },
      metadata: { optional: undefined, steps: ['first', undefined, 'last'], enabled: false }, requireWritableOwner: true });
    const canonicalPath = 'users/u1/situations/s1/tool-data/capsule-builder-architect';
    const envelope = fixture.records.get(canonicalPath);
    expect(envelope).toMatchObject({ version: 1, profileVersion: 0,
      metadata: { steps: ['first', null, 'last'], enabled: false } });
    expect(envelope?.metadata).not.toHaveProperty('optional');
    expect(envelope?.data).not.toHaveProperty('proposal.temporality.validFrom');
    expect(envelope?.data).not.toHaveProperty('patch.temporality.validUntil');
    expect(fixture.records.get(`${canonicalPath}/versions/1`)).toEqual(envelope);
    expect(fixture.records.get('users/u1/situations/s1/tools/capsule-builder-architect')).toMatchObject({
      version: 1, metadata: { canonicalVersion: 1 }, output: envelope?.data,
    });
    expect(fixture.directWrites).toEqual([]);
    expect(proposal.temporality).toHaveProperty('validFrom', undefined);
  });

  it.each(['deleting', 'deleted', 'missing', 'unreadable'])('fails closed for a %s owner before any guarded receipt write', async (state) => {
    const fixture = guardedReceiptDb();
    if (state === 'missing') fixture.records.delete('users/u1');
    else fixture.records.set('users/u1', { accountDeletionStatus: state });
    fixture.unreadableOwner = state === 'unreadable';
    vi.mocked(getAdminDbOrThrow).mockReturnValue(fixture.db as never);
    await expect(saveToolOutput({ uid: 'u1', situationId: 's1', toolId: 'capsule-builder-persona',
      profileVersion: 0, output: { patch: {} }, requireWritableOwner: true })).rejects.toMatchObject({
      code: 'ACCOUNT_UNAVAILABLE', status: state === 'unreadable' ? 503 : 409,
    });
    expect(Array.from(fixture.records.keys()).filter((path) => path.startsWith('users/u1/'))).toEqual([]);
    expect(fixture.directWrites).toEqual([]);
  });

  it('retries an invalidated owner read and cannot recreate receipts during concurrent erasure', async () => {
    const fixture = guardedReceiptDb();
    fixture.eraseBeforeCommit = true;
    vi.mocked(getAdminDbOrThrow).mockReturnValue(fixture.db as never);
    await expect(saveToolOutput({ uid: 'u1', situationId: 's1', toolId: 'capsule-builder-persona',
      profileVersion: 0, output: { patch: {} }, requireWritableOwner: true })).rejects.toBeInstanceOf(DocumentOwnerUnavailableError);
    expect(fixture.attempts).toBe(2);
    expect(Array.from(fixture.records.keys()).filter((path) => path.startsWith('users/u1/'))).toEqual([]);
    expect(fixture.directWrites).toEqual([]);
  });
});

type ReceiptRef = { path: string; collection: (name: string) => ReceiptRef; doc: (id: string) => ReceiptRef;
  get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
  set: (data: Record<string, unknown>, options?: { merge?: boolean }) => Promise<void> };

function guardedReceiptDb() {
  const records = new Map<string, Record<string, unknown>>([['users/u1', { uid: 'u1', credits: 0 }]]);
  const fixture = { records, directWrites: [] as string[], unreadableOwner: false, eraseBeforeCommit: false, attempts: 0 };
  const persist = (ref: ReceiptRef, data: Record<string, unknown>, options?: { merge?: boolean }) => {
    records.set(ref.path, options?.merge ? { ...records.get(ref.path), ...data } : data);
  };
  const refFor = (path: string): ReceiptRef => ({ path,
    collection: (name) => refFor(`${path}/${name}`), doc: (id) => refFor(`${path}/${id}`),
    get: async () => {
      if (path === 'users/u1' && fixture.unreadableOwner) throw new Error('owner read unavailable');
      return { exists: records.has(path), data: () => records.get(path) };
    }, set: async (data, options) => { fixture.directWrites.push(path); assertDefined(data); persist(refFor(path), data, options); },
  });
  return Object.assign(fixture, { db: { collection: refFor,
    runTransaction: async <T>(work: (transaction: { get: (ref: ReceiptRef) => ReturnType<ReceiptRef['get']>;
      set: (ref: ReceiptRef, data: Record<string, unknown>, options?: { merge?: boolean }) => void }) => Promise<T>) => {
      for (let attempt = 0; attempt < 5; attempt++) {
        fixture.attempts++;
        const reads = new Map<string, string | undefined>();
        const writes: Array<() => void> = [];
        const result = await work({ get: async (ref) => {
          reads.set(ref.path, JSON.stringify(records.get(ref.path))); return ref.get();
        }, set: (ref, data, options) => { assertDefined(data); writes.push(() => persist(ref, data, options)); } });
        if (fixture.eraseBeforeCommit) {
          fixture.eraseBeforeCommit = false;
          records.set('users/u1', { accountDeletionStatus: 'deleting' });
          for (const path of records.keys()) if (path.startsWith('users/u1/')) records.delete(path);
        }
        if (Array.from(reads).some(([path, snapshot]) => snapshot !== JSON.stringify(records.get(path)))) continue;
        writes.forEach((write) => write());
        return result;
      }
      throw new Error('Transaction could not commit.');
    } } });
}

function assertDefined(value: unknown): void {
  if (value === undefined) throw new Error('Firestore cannot persist undefined');
  if (Array.isArray(value)) for (let index = 0; index < value.length; index++) assertDefined(value[index]);
  else if (value !== null && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    for (const entry of Object.values(value)) assertDefined(entry);
  }
}
