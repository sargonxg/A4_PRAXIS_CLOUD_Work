import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  db: null as FakeFirestore | null,
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: () => {
    if (!mocks.db) throw new Error('Fake Firestore not configured');
    return mocks.db;
  },
}));

vi.mock('ai', () => ({
  embed: vi.fn(),
  embedMany: vi.fn(),
}));

vi.mock('@/lib/ai/providers', () => ({
  getEmbeddingModel: vi.fn(),
  hasServerAiProvider: vi.fn(() => false),
}));

import { chunkAndSaveDocument, getDocumentById, listDocuments, retrieveRelevantChunks, saveDocument, updateDocumentIngestionMetadata } from '@/lib/firebase/documents-service';
import { embedMany } from 'ai';
import { hasServerAiProvider, getEmbeddingModel } from '@/lib/ai/providers';

describe('documents-service owner isolation', () => {
  beforeEach(() => {
    mocks.db = new FakeFirestore();
    mocks.db.data.set('users/u1', { uid: 'u1' });
    mocks.db.data.set('users/u1/situations/s1', { documentCount: 0 });
  });

  it('writes ownerUid and refuses documents whose stored owner disagrees with the requested user', async () => {
    const db = mocks.db!;
    db.data.set('users/u1/situations/s1/documents/doc-poisoned', {
      id: 'doc-poisoned',
      ownerUid: 'u2',
      title: 'Other user document',
      fileType: 'text/plain',
      size: 12,
      text: 'other user text',
      status: 'uploaded',
      uploadedAt: '2026-05-24T10:00:00.000Z',
      entityCount: 0,
    });

    const saved = await saveDocument('u1', 's1', {
      title: 'Owned document',
      fileType: 'text/plain',
      size: 10,
      text: 'owned text',
      status: 'uploaded',
      uploadedAt: '2026-05-24T10:01:00.000Z',
      entityCount: 0,
    });

    expect(saved).toMatchObject({ ownerUid: 'u1', title: 'Owned document' });
    await expect(getDocumentById('u1', 's1', 'doc-poisoned')).resolves.toBeNull();
    const docs = await listDocuments('u1', 's1');
    expect(docs.map((doc) => doc.title)).toEqual(['Owned document']);
  });

  it('ranks only attached documents, including sources outside the newest 100', async () => {
    const db = mocks.db!;
    for (let i = 0; i < 101; i++) {
      db.data.set(`users/u1/situations/s1/documents/new-${i}`, document(`new-${i}`, 'u1'));
      db.data.set(`users/u1/situations/s1/documents/new-${i}/chunks/first`, {
        id: 'first', documentId: `new-${i}`, documentTitle: 'Unattached', text: 'deadline deadline deadline',
        index: 0, charStart: 0, charEnd: 26,
      });
    }
    db.data.set('users/u1/situations/s1/documents/older-selected', document('older-selected', 'u1'));
    db.data.set('users/u1/situations/s1/documents/older-selected/chunks/tail', {
      id: 'tail', documentId: 'older-selected', documentTitle: 'Selected source', text: 'The deadline is 12 November.',
      index: 40, charStart: 40000, charEnd: 40026,
    });
    const chunks = await retrieveRelevantChunks('u1', 's1', 'deadline', {
      documentIds: ['older-selected'], maxChunks: 1,
    });
    expect(chunks).toEqual([expect.objectContaining({ documentId: 'older-selected', id: 'tail', charStart: 40000 })]);
  });

  it('does not retrieve foreign-owner or poisoned chunk references from an explicit selection', async () => {
    const db = mocks.db!;
    db.data.set('users/u1/situations/s1/documents/foreign', document('foreign', 'u2'));
    db.data.set('users/u1/situations/s1/documents/owned', document('owned', 'u1'));
    for (const id of ['foreign', 'owned']) db.data.set(`users/u1/situations/s1/documents/${id}/chunks/poisoned`, {
      id: 'poisoned', documentId: 'another-document', documentTitle: 'Poisoned', text: 'deadline',
      index: 0, charStart: 0, charEnd: 8,
    });
    expect(await retrieveRelevantChunks('u1', 's1', 'deadline', { documentIds: ['foreign', 'owned'] })).toEqual([]);
  });

  it('creates one logical document and count when a stable upload is retried', async () => {
    const input = document('unused', 'u1');
    const first = await saveDocument('u1', 's1', input as never, { documentId: 'stable-upload' });
    mocks.db!.data.set('users/u1/situations/s1/documents/stable-upload', { ...first, chunkCount: 7 });
    const second = await saveDocument('u1', 's1', input as never, { documentId: 'stable-upload' });
    expect(first.id).toBe('stable-upload');
    expect(second.chunkCount).toBe(7);
    expect(mocks.db!.countUpdates).toBe(1);
    expect([...mocks.db!.data.keys()].filter((path) => path.includes('/documents/'))).toHaveLength(1);
  });

  it('bounds embedding and write batches and resumes indexed chunks after response loss', async () => {
    mocks.db!.data.set('users/u1/situations/s1/documents/doc-index', document('doc-index', 'u1'));
    vi.mocked(hasServerAiProvider).mockReturnValue(true);
    vi.mocked(getEmbeddingModel).mockReturnValue({} as never);
    vi.mocked(embedMany).mockImplementation(async ({ values }) => ({ embeddings: values.map(() => [1, 0]) }) as never);
    const text = 'evidence '.repeat(18000);
    const first = await chunkAndSaveDocument('u1', 's1', 'doc-index', 'Source', text);
    const calls = vi.mocked(embedMany).mock.calls.length;
    expect(first).toBeGreaterThan(100);
    expect(vi.mocked(embedMany).mock.calls.every(([input]) => input.values.length <= 32)).toBe(true);
    expect(mocks.db!.batchSizes.every((size) => size <= 100)).toBe(true);
    expect(await chunkAndSaveDocument('u1', 's1', 'doc-index', 'Source', text)).toBe(first);
    expect(vi.mocked(embedMany).mock.calls).toHaveLength(calls);
    expect([...mocks.db!.data.keys()].filter((path) => path.includes('/chunks/'))).toHaveLength(first);
    vi.mocked(hasServerAiProvider).mockReturnValue(false);
  });

  it('resumes a failed write batch without duplicating earlier committed chunks', async () => {
    const db = mocks.db!;
    db.data.set('users/u1/situations/s1/documents/interrupted', document('interrupted', 'u1'));
    db.failBatch = 2;
    const text = 'evidence '.repeat(18000);
    await expect(chunkAndSaveDocument('u1', 's1', 'interrupted', 'Source', text)).rejects.toThrow('write interrupted');
    expect(db.data.get('users/u1/situations/s1/documents/interrupted')?.indexing).toMatchObject({ status: 'failed', nextChunk: 32 });
    db.failBatch = null;
    const count = await chunkAndSaveDocument('u1', 's1', 'interrupted', 'Source', text);
    expect([...db.data.keys()].filter((path) => path.includes('/chunks/'))).toHaveLength(count);
    expect(db.data.get('users/u1/situations/s1/documents/interrupted')?.indexing).toMatchObject({ status: 'keyword_only', nextChunk: count });
  });

  it.each([null, 'deleting', 'deleted'])('refuses document creation/counts for a missing or %s owner', async (state) => {
    const db = mocks.db!;
    if (state === null) db.data.delete('users/u1');
    else db.data.set('users/u1', { accountDeletionStatus: state });
    await expect(saveDocument('u1', 's1', document('new', 'u1') as never, { documentId: 'new' })).rejects.toThrow(/account.*unavailable/i);
    await expect(saveDocument('u1', 's1', document('new', 'u1') as never)).rejects.toThrow(/account.*unavailable/i);
    expect(db.countUpdates).toBe(0);
    expect([...db.data.keys()].some((path) => path.includes('/documents/'))).toBe(false);
  });

  it('never recreates documents/checkpoints when erasure starts during an embedding request', async () => {
    const db = mocks.db!;
    db.data.set('users/u1/situations/s1/documents/in-flight', document('in-flight', 'u1'));
    vi.mocked(hasServerAiProvider).mockReturnValue(true);
    vi.mocked(embedMany).mockImplementationOnce(async ({ values }) => {
      db.data.set('users/u1', { accountDeletionStatus: 'deleting' });
      db.data.delete('users/u1/situations/s1/documents/in-flight');
      return { embeddings: values.map(() => [1, 0]) } as never;
    });
    await expect(chunkAndSaveDocument('u1', 's1', 'in-flight', 'Source', 'Evidence '.repeat(100))).rejects.toThrow(/account.*unavailable/i);
    expect([...db.data.keys()].some((path) => path.includes('/documents/'))).toBe(false);
    vi.mocked(hasServerAiProvider).mockReturnValue(false);
  });

  it('rejects final ingestion metadata for a deleted document or an unavailable owner', async () => {
    const db = mocks.db!;
    await expect(updateDocumentIngestionMetadata('u1', 's1', 'gone', { chunkCount: 4 })).rejects.toThrow(/document.*unavailable/i);
    db.data.set('users/u1/situations/s1/documents/existing', document('existing', 'u1'));
    db.data.set('users/u1', { accountDeletionStatus: 'deleting' });
    await expect(updateDocumentIngestionMetadata('u1', 's1', 'existing', { chunkCount: 4 })).rejects.toThrow(/account.*unavailable/i);
    expect(db.data.get('users/u1/situations/s1/documents/existing')?.chunkCount).toBeUndefined();
  });
});

function document(id: string, ownerUid: string) {
  return { id, ownerUid, title: id, fileType: 'txt', size: 30, text: 'Source text',
    status: 'extracted', uploadedAt: '2026-09-30', entityCount: 0 };
}

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();
  countUpdates = 0;
  batchSizes: number[] = [];
  failBatch: number | null = null;
  async runTransaction<T>(fn: (transaction: { get: (ref: FakeDoc) => Promise<FakeSnapshot>;
    set: (ref: FakeDoc, data: Record<string, unknown>, options?: { merge?: boolean }) => void;
    update: (ref: FakeDoc, data: Record<string, unknown>) => void }) => Promise<T>) {
    const writes: Array<{ ref: FakeDoc; apply: () => Promise<void> }> = [];
    const result = await fn({ get: (ref) => ref.get(), set: (ref, data, options) => { writes.push({ ref, apply: () => ref.set(data, options) }); },
      update: (ref, data) => { writes.push({ ref, apply: () => ref.update(data) }); } });
    const chunks = writes.filter(({ ref }) => ref.path.includes('/chunks/')).length;
    if (chunks) {
      this.batchSizes.push(chunks);
      if (this.failBatch === this.batchSizes.length) throw new Error('write interrupted');
    }
    for (const write of writes) await write.apply();
    return result;
  }
  batch() {
    let count = 0;
    const writes: (() => Promise<void>)[] = [];
    return { set: (ref: FakeDoc, value: Record<string, unknown>) => { count++; writes.push(() => ref.set(value)); },
      commit: async () => { this.batchSizes.push(count); if (this.failBatch === this.batchSizes.length) throw new Error('write interrupted');
        await Promise.all(writes.map((write) => write())); } };
  }

  collection(path: string) {
    return new FakeCollection(this, path);
  }
}

class FakeCollection {
  private maxDocs: number | null = null;

  constructor(private db: FakeFirestore, private path: string) {}

  doc(id = `doc-${this.db.data.size + 1}`) {
    return new FakeDoc(this.db, `${this.path}/${id}`, id);
  }

  orderBy() {
    return this;
  }

  limit(count: number) {
    this.maxDocs = count;
    return this;
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, value]) => new FakeSnapshot(Boolean(value), value, path.split('/').pop() ?? 'unknown'));
    return { docs: this.maxDocs ? docs.slice(0, this.maxDocs) : docs };
  }
}

class FakeDoc {
  constructor(private db: FakeFirestore, public path: string, public id: string) {}

  collection(name: string) {
    return new FakeCollection(this.db, `${this.path}/${name}`);
  }

  async get() {
    const value = this.db.data.get(this.path);
    return new FakeSnapshot(Boolean(value), value ?? {}, this.id);
  }

  async set(value: Record<string, unknown>, options?: { merge?: boolean }) {
    const current = this.db.data.get(this.path) ?? {};
    this.db.data.set(this.path, options?.merge ? { ...current, ...value } : value);
  }

  async update(value: Record<string, unknown>) {
    if ('documentCount' in value) this.db.countUpdates++;
    const current = this.db.data.get(this.path) ?? {};
    this.db.data.set(this.path, { ...current, ...value });
  }
}

class FakeSnapshot {
  constructor(public exists: boolean, private value: Record<string, unknown>, public id: string) {}

  data() {
    return this.value;
  }
}
