import { describe, expect, it } from 'vitest';
import { composeCoreLibrary } from '@/lib/cores/core-library';
import { createCapsule } from '@/lib/context/capsule-service';

describe('context core library composition', () => {
  it('merges template cores with owner-scoped situations, documents, sources, capsules, and visible memory', async () => {
    const db = new FakeFirestore();
    await db.collection('users').doc('u1').collection('situations').doc('sit-1').set({
      name: 'Ceasefire monitoring',
      summary: 'A live user-owned situation.',
      documentCount: 1,
      updatedAt: '2026-05-14T00:00:00.000Z',
    });
    await db.collection('users').doc('u1').collection('situations').doc('sit-1').collection('documents').doc('doc-1').set({
      title: 'Monitoring report.txt',
      status: 'extracted',
      chunkCount: 3,
      uploadedAt: '2026-05-14T01:00:00.000Z',
      ingestionRunId: 'ing-1',
    });
    await db.collection('users').doc('u1').collection('situations').doc('sit-1').collection('sources').doc('src-receipt-1').set({
      name: 'Monitoring report',
      sourceType: 'text',
      uploadedAt: '2026-05-14T01:00:00.000Z',
      extracted: true,
      documentId: 'doc-1',
      sourceCoreId: 'source-core:sit-1:report',
      ingestionRunId: 'ing-1',
    });
    await db.collection('users').doc('u1').collection('situations').doc('sit-1').collection('graph-delta-review').doc('delta-1').set({
      documentId: 'doc-1',
      status: 'review',
    });
    await db.collection('users').doc('u1').collection('working-memory').doc('mem-visible').set({
      text: 'Keep monitoring caveats visible.',
      updatedAt: '2026-05-14T02:00:00.000Z',
      deletedAt: null,
    });
    await db.collection('users').doc('u1').collection('working-memory').doc('mem-deleted').set({
      text: 'Deleted assumption.',
      updatedAt: '2026-05-14T02:00:00.000Z',
      deletedAt: '2026-05-14T03:00:00.000Z',
    });
    await createCapsule('u1', {
      capsuleId: 'default',
      coreRefs: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['source-core:sit-1:report'],
        documentCoreIds: ['doc-1'],
      },
      activeForSituationIds: ['sit-1'],
    }, { db: db as never, now: () => new Date('2026-05-14T00:00:00.000Z') });

    const cores = await composeCoreLibrary('u1', { limit: 160 }, { db: db as never });
    const document = cores.find((core) => core.kind === 'document' && core.id === 'doc-1');
    const source = cores.find((core) => core.kind === 'source' && core.id === 'source-core:sit-1:report');
    const memory = cores.find((core) => core.kind === 'memory' && core.id === 'mem-working-visible');

    expect(cores.some((core) => core.template && core.kind === 'user')).toBe(true);
    expect(cores.some((core) => core.kind === 'situation' && core.id === 'sit-1' && !core.template)).toBe(true);
    expect(document?.status).toBe('needs_review');
    expect(document?.chunkCount).toBe(3);
    expect(document?.capsuleIds).toEqual(['default']);
    expect(source?.documentId).toBe('doc-1');
    expect(source?.capsuleIds).toEqual(['default']);
    expect(memory?.status).toBe('ready');
    expect(cores.some((core) => core.id === 'mem-deleted')).toBe(false);
    expect(new Set(cores.map((core) => `${core.kind}:${core.id}`)).size).toBe(cores.length);
  });

  it('filters by core kind, status, owner scope, and attachment state', async () => {
    const db = new FakeFirestore();
    await db.collection('users').doc('u1').collection('situations').doc('sit-1').set({ name: 'Situation', documentCount: 0 });
    await db.collection('users').doc('u1').collection('situations').doc('sit-1').collection('documents').doc('doc-queued').set({
      title: 'Queued.txt',
      status: 'uploaded',
      chunkCount: 0,
      uploadedAt: '2026-05-14T01:00:00.000Z',
    });

    const queuedDocuments = await composeCoreLibrary('u1', {
      kind: 'document',
      status: 'queued',
      ownerScope: 'artifact',
      attached: 'attached',
      situationId: 'sit-1',
    }, { db: db as never });

    expect(queuedDocuments.map((core) => core.id)).toEqual(['doc-queued']);
  });
});

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();

  collection(path: string) {
    return new FakeCollection(this, path);
  }
}

class FakeCollection {
  constructor(private db: FakeFirestore, private path: string) {}

  doc(id = `doc-${this.db.data.size + 1}`) {
    return new FakeDoc(this.db, `${this.path}/${id}`, id);
  }

  limit() {
    return this;
  }

  orderBy() {
    return this;
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, value]) => new FakeSnapshot(true, value, path.split('/').pop() ?? 'unknown'));
    return { docs };
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
}

class FakeSnapshot {
  constructor(public exists: boolean, private value: Record<string, unknown>, public id: string) {}

  data() {
    return this.value;
  }
}
