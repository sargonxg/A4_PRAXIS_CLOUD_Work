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

import { getDocumentById, listDocuments, saveDocument } from '@/lib/firebase/documents-service';

describe('documents-service owner isolation', () => {
  beforeEach(() => {
    mocks.db = new FakeFirestore();
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
});

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();

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
  constructor(private db: FakeFirestore, private path: string, public id: string) {}

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
