import { describe, expect, it } from 'vitest';

import {
  createCapsule,
  forkCapsule,
  getCapsule,
  listCapsules,
  publishCapsule,
  updateDraftCapsule,
} from '@/lib/capsules/storage';

describe('capsule/v2 Firestore storage lifecycle', () => {
  it('rejects create collisions with another owner without changing their private capsule', async () => {
    const db = new FakeFirestore();
    const deps = { db: db as never };
    const original = await createCapsule('owner', { id: 'private-capsule' }, deps);

    await expect(createCapsule('other-user', {
      id: 'private-capsule', capsule: { persona: { systemFrame: 'Replacement.' } },
    }, deps)).rejects.toMatchObject({ status: 403 });
    expect(db.data.get('capsules/private-capsule')).toEqual(original);
  });

  it.each([
    { status: 'published', immutable: true },
    { status: 'draft', immutable: true },
    { status: 'published', immutable: false },
  ])('refuses to reset an owned $status capsule with immutable=$immutable through create', async (state) => {
    const db = new FakeFirestore();
    const deps = { db: db as never };
    const original = await createCapsule('owner', { id: 'locked-capsule' }, deps);
    const locked = { ...original, ...state };
    db.data.set('capsules/locked-capsule', locked);

    await expect(createCapsule('owner', { id: 'locked-capsule' }, deps))
      .rejects.toMatchObject({ status: 409, message: expect.stringMatching(/fork/i) });
    expect(db.data.get('capsules/locked-capsule')).toEqual(locked);
  });

  it('lets an owner save their draft again while preserving its creation metadata and existing fields', async () => {
    const db = new FakeFirestore();
    const original = await createCapsule('owner', {
      id: 'retry-draft', capsule: { persona: { domain: 'humanitarian' } },
    }, { db: db as never, now: () => new Date('2026-09-28T12:00:00Z') });
    const saved = await createCapsule('owner', {
      id: 'retry-draft', capsule: { persona: { systemFrame: 'Updated working draft.' } },
    }, { db: db as never, now: () => new Date('2026-09-29T12:00:00Z') });

    expect(saved.createdAt).toBe(original.createdAt);
    expect(saved.provenance.createdAt).toBe(original.provenance.createdAt);
    expect(saved.updatedAt).toBe('2026-09-29T12:00:00.000Z');
    expect(saved.persona).toMatchObject({ domain: 'humanitarian', systemFrame: 'Updated working draft.' });
  });

  it('assigns independent identifiers when callers create new capsules without an id', async () => {
    const db = new FakeFirestore();
    let sequence = 0;
    const deps = { db: db as never, idFactory: () => `new-capsule-${++sequence}` };
    const first = await createCapsule('owner', {}, deps);
    const second = await createCapsule('owner', {}, deps);

    expect(first.id).not.toBe(second.id);
    expect(db.data.size).toBe(2);
  });

  it('applies the owner filter before the list limit so other users cannot hide saved drafts', async () => {
    const db = new FakeFirestore();
    const deps = { db: db as never };
    for (let index = 0; index < 3; index++) {
      await createCapsule('other-user', { id: `other-draft-${index}` }, deps);
    }
    const mine = await createCapsule('owner', { id: 'my-new-draft' }, deps);

    const listed = await listCapsules('owner', { scope: 'mine', limit: 2 }, deps);
    expect(listed.map((record) => record.id)).toContain(mine.id);
  });

  it('allows only one owner when concurrent creates choose the same identifier', async () => {
    const db = new FakeFirestore();
    const results = await Promise.allSettled([
      createCapsule('first-owner', { id: 'shared-identifier' }, { db: db as never }),
      createCapsule('second-owner', { id: 'shared-identifier' }, { db: db as never }),
    ]);
    const successful = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.status === 'rejected' && rejected[0].reason).toMatchObject({ status: 403 });
    expect(db.data.get('capsules/shared-identifier')?.ownerUid)
      .toBe(successful[0]?.status === 'fulfilled' && successful[0].value.ownerUid);
  });

  it('creates, updates, publishes immutable versions, lists, and forks capsules', async () => {
    const db = new FakeFirestore();
    const deps = {
      db: db as never,
      now: () => new Date('2026-05-30T13:00:00.000Z'),
      idFactory: () => 'uuid-1234',
    };

    const draft = await createCapsule('u1', {
      id: 'Mediation Sudan!',
      capsule: {
        persona: {
          systemFrame: 'Draft Sudan mediation analyst.',
          domain: 'diplomacy-negotiation',
          frameworks: ['zartman-ripeness'],
        },
        market: { visibility: 'private', category: 'diplomacy-negotiation', tags: ['sudan'] },
        temporality: {
          timelineAnchors: [{
            id: 'anchor-review',
            label: 'Ceasefire review date',
            date: '2026-06-15',
            kind: 'review',
            sourceRefs: ['src-un'],
          }],
        },
        causality: {
          causalLinks: [{
            id: 'causal-access',
            cause: 'Access restrictions remain in place',
            effect: 'Humanitarian delivery slows',
            relation: 'causes',
            evidenceRefs: ['src-un'],
            confidence: 0.7,
          }],
        },
        ontologyBinding: {
          domainId: 'diplomacy-negotiation',
          taxonomyPath: ['generic', 'diplomacy-negotiation'],
          ontologyIds: ['conflict', 'mediation'],
          acoPrimitives: ['Actor', 'Claim', 'Event'],
          bindingRationale: 'Mediation capsules need actor, claim, event, and constraint extraction.',
        },
        embeddedGraph: {
          provider: 'graphlite',
          projectionId: 'mediation-sudan-graphlite-builder-projection',
          status: 'compiled-advisory',
          namedGraph: 'capsule_mediation_sudan',
          advisoryOnly: true,
          canonicalStore: 'Firestore ContextCapsules',
          promotionGate: 'Human review-card approval required before canonical graph promotion.',
          nodes: [{ id: 'actor-un', label: 'UN mediator', entityType: 'Actor', reviewState: 'proposed' }],
          edges: [],
        },
      },
    }, deps);

    expect(draft.id).toBe('mediation-sudan');
    expect(draft.ownerUid).toBe('u1');
    expect(draft.status).toBe('draft');
    expect(draft.temporality.timelineAnchors[0]?.label).toBe('Ceasefire review date');
    expect(draft.causality.causalLinks).toHaveLength(1);
    expect(draft.ontologyBinding.ontologyIds).toEqual(['conflict', 'mediation']);
    expect(draft.embeddedGraph).toMatchObject({
      provider: 'graphlite',
      advisoryOnly: true,
      canonicalStore: 'Firestore ContextCapsules',
    });
    expect(db.data.has('capsules/mediation-sudan')).toBe(true);

    const updated = await updateDraftCapsule('u1', 'mediation-sudan', {
      capsule: {
        persona: { frameworks: ['zartman-ripeness', 'stedman-spoilers'] },
        version: '2.0.0',
        eval: {
          lastRun: {
            runId: 'eval-pass',
            scores: {
              faithfulness: 0.92,
              citationCoverage: 0.91,
              contextRecall: 0.84,
              schemaConformance: 1,
              redTeamPassRate: 0.99,
              safetyScore: 0.99,
            },
            passedAt: '2026-05-30T13:05:00.000Z',
          },
        },
      },
    }, deps);

    expect(updated.persona.frameworks).toEqual(['zartman-ripeness', 'stedman-spoilers']);
    expect(updated.contentHash).toMatch(/^sha256:/);

    const published = await publishCapsule('u1', 'mediation-sudan', deps);
    expect(published.status).toBe('published');
    expect(published.immutable).toBe(true);
    expect(published.publishedVersionHash).toBe(published.contentHash);
    expect(db.data.get(`capsules/mediation-sudan/versions/${published.contentHash}`)?.immutable).toBe(true);

    await expect(updateDraftCapsule('u1', 'mediation-sudan', {
      capsule: { persona: { systemFrame: 'Attempted edit.' } },
    }, deps)).rejects.toThrow(/published or immutable/i);

    const mine = await listCapsules('u1', { scope: 'mine' }, deps);
    expect(mine.map((capsule) => capsule.id)).toEqual(['mediation-sudan']);

    const fork = await forkCapsule('u1', 'mediation-sudan', deps);
    expect(fork.id).toBe('mediation-sudan-fork-uuid-1234');
    expect(fork.version).toBe('0.1.0');
    expect(fork.status).toBe('draft');
    expect(fork.immutable).toBe(false);
    expect(fork.ownerUid).toBe('u1');
    expect(fork.forkedFrom).toEqual({
      id: 'mediation-sudan',
      version: published.version,
      hash: published.contentHash,
    });
    expect(fork.market.visibility).toBe('private');
    expect(fork.market.installs).toBe(0);
    expect(fork.market.rating).toBe(0);
    expect(fork.publishedVersionHash).toBeNull();
    expect(fork.provenance.publishedAt).toBeUndefined();
    expect(fork.provenance.signature).toBeUndefined();
    expect(fork.provenance.attestation).toBeUndefined();
    expect(fork.provenance.certification).toBeUndefined();
    expect(fork.eval.lastRun).toBeUndefined();

    const loaded = await getCapsule('u1', 'mediation-sudan', deps);
    expect(loaded?.publishedVersionHash).toBe(published.contentHash);
  });

  it('refuses publication when the eval gate has not passed', async () => {
    const db = new FakeFirestore();
    const deps = {
      db: db as never,
      now: () => new Date('2026-05-30T13:00:00.000Z'),
      idFactory: () => 'uuid-1234',
    };

    await createCapsule('u1', { id: 'thin-capsule' }, deps);

    await expect(publishCapsule('u1', 'thin-capsule', deps)).rejects.toThrow(/eval gate/i);
  });

  it('does not expose another owner capsule through direct reads or list scopes', async () => {
    const db = new FakeFirestore();
    const deps = {
      db: db as never,
      now: () => new Date('2026-05-30T13:00:00.000Z'),
      idFactory: () => 'uuid-1234',
    };

    await createCapsule('u2', {
      id: 'other-public-capsule',
      capsule: {
        market: { visibility: 'public', category: 'diplomacy-negotiation', tags: ['shared'] },
      },
    }, deps);

    await expect(getCapsule('u1', 'other-public-capsule', deps)).resolves.toBeNull();
    await expect(listCapsules('u1', { scope: 'public' }, deps)).resolves.toEqual([]);
    await expect(listCapsules('u1', { scope: 'org' }, deps)).resolves.toEqual([]);
  });
});

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();
  revisions = new Map<string, number>();

  collection(path: string) {
    return new FakeCollection(this, path);
  }

  async runTransaction<T>(callback: (transaction: {
    get: (ref: FakeDoc) => Promise<FakeSnapshot>;
    set: (ref: FakeDoc, value: Record<string, unknown>) => void;
  }) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const reads = new Map<string, number>();
      const writes: Array<{ ref: FakeDoc; value: Record<string, unknown> }> = [];
      const result = await callback({
        get: async (ref) => {
          reads.set(ref.path, this.revisions.get(ref.path) ?? 0);
          return ref.get();
        },
        set: (ref, value) => { writes.push({ ref, value }); },
      });
      if ([...reads].some(([path, revision]) => (this.revisions.get(path) ?? 0) !== revision)) continue;
      for (const { ref, value } of writes) await ref.set(value);
      return result;
    }
    throw new Error('Transaction contention exceeded test retry limit.');
  }
}

class FakeCollection {
  constructor(
    private db: FakeFirestore,
    private path: string,
    private maxDocs?: number,
    private filters: Array<{ field: string; value: unknown }> = [],
  ) {}

  doc(id: string) {
    return new FakeDoc(this.db, `${this.path}/${id}`, id);
  }

  limit(count: number) {
    return new FakeCollection(this.db, this.path, count, this.filters);
  }

  where(field: string, _operator: string, value: unknown) {
    return new FakeCollection(this.db, this.path, this.maxDocs, [...this.filters, { field, value }]);
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .filter(([, data]) => this.filters.every(({ field, value }) => data[field] === value))
      .slice(0, this.maxDocs)
      .map(([path, data]) => new FakeSnapshot(true, data, path.split('/').pop() ?? 'unknown'));
    return { docs };
  }
}

class FakeDoc {
  constructor(private db: FakeFirestore, public path: string, public id: string) {}

  collection(name: string) {
    return new FakeCollection(this.db, `${this.path}/${name}`);
  }

  async get() {
    const data = this.db.data.get(this.path);
    return new FakeSnapshot(Boolean(data), data ?? {}, this.id);
  }

  async set(value: Record<string, unknown>, options?: { merge?: boolean }) {
    const current = this.db.data.get(this.path) ?? {};
    this.db.data.set(this.path, options?.merge ? { ...current, ...value } : value);
    this.db.revisions.set(this.path, (this.db.revisions.get(this.path) ?? 0) + 1);
  }
}

class FakeSnapshot {
  constructor(public exists: boolean, private value: Record<string, unknown>, public id: string) {}

  data() {
    return this.value;
  }
}
