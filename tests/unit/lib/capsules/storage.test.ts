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
    expect(fork.status).toBe('draft');
    expect(fork.immutable).toBe(false);
    expect(fork.forkedFrom).toEqual({
      id: 'mediation-sudan',
      version: published.version,
      hash: published.contentHash,
    });

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
});

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();

  collection(path: string) {
    return new FakeCollection(this, path);
  }
}

class FakeCollection {
  constructor(private db: FakeFirestore, private path: string) {}

  doc(id: string) {
    return new FakeDoc(this.db, `${this.path}/${id}`, id);
  }

  limit() {
    return this;
  }

  where() {
    return this;
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, data]) => new FakeSnapshot(true, data, path.split('/').pop() ?? 'unknown'));
    return { docs };
  }
}

class FakeDoc {
  constructor(private db: FakeFirestore, private path: string, public id: string) {}

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
  }
}

class FakeSnapshot {
  constructor(public exists: boolean, private value: Record<string, unknown>, public id: string) {}

  data() {
    return this.value;
  }
}
