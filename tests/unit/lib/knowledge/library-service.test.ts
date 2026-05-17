import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCapsule, getCapsule } from '@/lib/context/capsule-service';
import {
  attachKnowledgeDocumentToCapsules,
  createKnowledgeRepository,
  ensureDefaultKnowledgeRepository,
  listKnowledgeDocuments,
  listKnowledgeRepositories,
  saveKnowledgeDocumentDigest,
  updateKnowledgeRepository,
  upsertKnowledgeDocument,
} from '@/lib/knowledge/library-service';

vi.mock('@/lib/firebase/documents-service', () => ({
  getDocumentById: vi.fn(async (_uid: string, _situationId: string, docId: string) => ({
    id: docId,
    title: 'Ceasefire monitoring note',
    fileType: 'pdf',
    size: 1200,
    text: 'The parties agreed a monitored pause with unresolved humanitarian access constraints.',
    status: 'extracted',
    uploadedAt: '2026-05-16T00:00:00.000Z',
    entityCount: 3,
    chunkCount: 4,
    bucketUri: 'gs://praxis-uploads/doc.pdf',
    structured: {
      sourceType: 'policy-note',
      actors: ['Government', 'Opposition'],
      keyClaims: ['A monitored pause was agreed.'],
      timelineCandidates: [],
    },
  })),
}));

describe('knowledge library service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates user repositories and knowledge document records around existing uploads', async () => {
    const db = new FakeFirestore();
    const repository = await createKnowledgeRepository('u1', {
      id: 'syria',
      name: 'Syria policy library',
      categoryId: 'conflict-analysis',
      tags: ['syria', 'ceasefire', 'syria'],
    }, deps(db));

    const document = await upsertKnowledgeDocument('u1', {
      documentId: 'doc-1',
      situationId: 'sit-1',
      repositoryIds: [repository.id],
      capsuleIds: ['cap-1'],
      tags: ['humanitarian'],
    }, deps(db));

    expect(repository.id).toBe('syria');
    expect(repository.tags).toEqual(['syria', 'ceasefire']);
    expect(document.repositoryIds).toEqual(['syria']);
    expect(document.capsuleIds).toEqual(['cap-1']);
    expect(document.retrievalStatus).toBe('indexed');
    expect(document.title).toBe('Ceasefire monitoring note');
    expect(await listKnowledgeRepositories('u1', {}, deps(db))).toHaveLength(1);
    expect(await listKnowledgeDocuments('u1', { repositoryId: 'syria' }, deps(db))).toHaveLength(1);
  });

  it('attaches knowledge documents to capsules and updates capsule document refs', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-1', label: 'Policy capsule' }, deps(db));
    await upsertKnowledgeDocument('u1', {
      documentId: 'doc-1',
      situationId: 'sit-1',
      repositoryIds: ['default'],
    }, deps(db));

    const updated = await attachKnowledgeDocumentToCapsules('u1', 'doc-1', {
      capsuleIds: ['cap-1'],
    }, deps(db));
    const capsule = await getCapsule('u1', 'cap-1', deps(db));

    expect(updated?.capsuleIds).toEqual(['cap-1']);
    expect(capsule?.coreRefs.documentCoreIds).toContain('doc-1');
  });

  it('persists structured digests and archives repositories without deleting documents', async () => {
    const db = new FakeFirestore();
    await ensureDefaultKnowledgeRepository('u1', deps(db));
    await upsertKnowledgeDocument('u1', {
      documentId: 'doc-1',
      situationId: 'sit-1',
      repositoryIds: ['default'],
    }, deps(db));

    const digested = await saveKnowledgeDocumentDigest('u1', 'doc-1', {
      shortSummary: 'A monitored pause with access constraints.',
      analystSummary: 'The document frames implementation risk around access and monitoring.',
      keyClaims: ['A pause was agreed.'],
      actors: ['Government'],
      institutions: ['UN'],
      dates: ['2026-05-16'],
      causalLinks: ['Access constraints may undermine compliance.'],
      humanFrictionSignals: ['Local mistrust'],
      policyRelevance: ['Useful for mediator briefing.'],
      sourceabilityWarnings: ['Single document only.'],
      suggestedCapsuleIds: ['cap-1'],
      suggestedTags: ['ceasefire', 'access'],
      followUpQuestions: ['Which monitors are accepted by both parties?'],
      model: 'vertex-gemini',
    }, deps(db));
    const archived = await updateKnowledgeRepository('u1', 'default', { archived: true }, deps(db));

    expect(digested?.summaryStatus).toBe('ready');
    expect(digested?.digest?.humanFrictionSignals).toEqual(['Local mistrust']);
    expect(digested?.tags).toContain('ceasefire');
    expect(archived?.archivedAt).toBe('2026-05-16T00:00:00.000Z');
    expect(await listKnowledgeDocuments('u1', { repositoryId: 'default' }, deps(db))).toHaveLength(1);
  });
});

function deps(db: FakeFirestore) {
  return {
    db: db as never,
    now: () => new Date('2026-05-16T00:00:00.000Z'),
  };
}

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();

  collection(path: string) {
    return new FakeCollection(this, path);
  }

  batch() {
    const writes: Array<() => void> = [];
    return {
      set: (ref: FakeDoc, value: Record<string, unknown>, options?: { merge?: boolean }) => {
        writes.push(() => ref.setSync(value, options));
      },
      delete: (ref: FakeDoc) => {
        writes.push(() => this.data.delete(ref.path));
      },
      commit: async () => {
        writes.forEach((write) => write());
      },
    };
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
  constructor(private db: FakeFirestore, public path: string, public id: string) {}

  collection(name: string) {
    return new FakeCollection(this.db, `${this.path}/${name}`);
  }

  async get() {
    const value = this.db.data.get(this.path);
    return new FakeSnapshot(Boolean(value), value ?? {}, this.id);
  }

  async set(value: Record<string, unknown>, options?: { merge?: boolean }) {
    this.setSync(value, options);
  }

  async update(value: Record<string, unknown>) {
    this.setSync(value, { merge: true });
  }

  setSync(value: Record<string, unknown>, options?: { merge?: boolean }) {
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
