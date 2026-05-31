import { describe, expect, it, vi } from 'vitest';
import {
  buildContextEnrichmentReceipt,
  buildEnrichedTurnCapsule,
  createDisabledTemporalGraphProvider,
} from '@/lib/knowledge/context-enrichment-adapter';

describe('context enrichment adapter', () => {
  it('keeps Firestore-only context usable when Cognee is disabled', async () => {
    const capsule = await buildEnrichedTurnCapsule({
      uid: 'u1',
      traceId: 'trace-firestore-only',
      activeContextStack: { stackId: 'default', situationId: 'sit-1' },
      query: 'What changed?',
    }, {
      ...deps(new FakeFirestore()),
      cognee: { enabled: false, recall: vi.fn() },
    });

    expect(capsule.capsuleId).toBe('default');
    expect(capsule.enrichment.receipt).toMatchObject({
      firestore: 'ready',
      cognee: 'disabled',
      trustgraph: 'disabled',
      graphlite: 'disabled',
      graphiti: 'deferred',
    });
    expect(capsule.enrichment.memoryHitCount).toBe(0);
    expect(capsule.memory.semantic).toEqual([]);
  });

  it('adds TrustGraph recall hits as advisory context without mutating canonical capsules', async () => {
    const db = new FakeFirestore();
    const recall = vi.fn(async () => ({
      status: 'enabled' as const,
      hits: [
        { id: 'tg-1', text: 'TrustGraph path connects actor leverage to a deadline.', score: 0.91, sourceId: 'src-graph-1' },
        { id: 'tg-ignored', text: 'TrustGraph hit without provenance.', score: 0.7 },
      ],
      graphCandidateIds: ['proposal:actor-deadline'],
      explainabilityIds: ['path:actor->deadline'],
    }));

    const capsule = await buildEnrichedTurnCapsule({
      uid: 'u1',
      traceId: 'trace-trustgraph',
      activeContextStack: { stackId: 'default', situationId: 'sit-1' },
      query: 'Which context path matters?',
    }, {
      ...deps(db),
      cognee: { enabled: false, recall: vi.fn() },
      trustgraph: { enabled: true, recall },
    });

    expect(recall).toHaveBeenCalledWith({
      uid: 'u1',
      capsuleId: 'default',
      query: 'Which context path matters?',
      limit: 6,
    });
    expect(capsule.memory.semantic.map((item) => item.id)).toEqual(['trustgraph:tg-1']);
    expect(capsule.enrichment.receipt).toMatchObject({
      cognee: 'disabled',
      trustgraph: 'enabled',
      trustgraphItemIds: ['trustgraph:tg-1'],
      usedTrustGraphItemIds: ['trustgraph:tg-1'],
      ignoredTrustGraphItemIds: ['trustgraph:tg-ignored'],
      graphCandidateIds: ['proposal:actor-deadline'],
      explainabilityIds: ['path:actor->deadline'],
      writebackProposalIds: ['review-card:trustgraph:tg-1', 'proposal:actor-deadline'],
    });
    expect(db.data.has('users/u1/capsules/default')).toBe(true);
    expect(db.data.has('users/u1/capsules/default/memories/trustgraph:tg-1')).toBe(false);
  });

  it('adds GraphLite recall hits as advisory embedded graph context without mutating canonical capsules', async () => {
    const db = new FakeFirestore();
    const recall = vi.fn(async () => ({
      status: 'enabled' as const,
      hits: [
        { id: 'gl-1', text: 'GraphLite path connects actor leverage to a deadline.', score: 0.91, sourceId: 'src-graph-1' },
        { id: 'gl-ignored', text: 'GraphLite hit without provenance.', score: 0.7 },
      ],
      graphCandidateIds: ['proposal:actor-deadline'],
      explainabilityIds: ['path:actor->deadline'],
    }));

    const capsule = await buildEnrichedTurnCapsule({
      uid: 'u1',
      traceId: 'trace-graphlite',
      activeContextStack: { stackId: 'default', situationId: 'sit-1' },
      query: 'Which embedded graph path matters?',
    }, {
      ...deps(db),
      cognee: { enabled: false, recall: vi.fn() },
      graphlite: { enabled: true, recall },
    });

    expect(recall).toHaveBeenCalledWith({
      uid: 'u1',
      capsuleId: 'default',
      query: 'Which embedded graph path matters?',
      limit: 6,
    });
    expect(capsule.memory.semantic.map((item) => item.id)).toEqual(['graphlite:gl-1']);
    expect(capsule.enrichment.receipt).toMatchObject({
      cognee: 'disabled',
      graphlite: 'enabled',
      graphliteItemIds: ['graphlite:gl-1'],
      usedGraphLiteItemIds: ['graphlite:gl-1'],
      ignoredGraphLiteItemIds: ['graphlite:gl-ignored'],
      graphCandidateIds: ['proposal:actor-deadline'],
      explainabilityIds: ['path:actor->deadline'],
      writebackProposalIds: ['review-card:graphlite:gl-1', 'proposal:actor-deadline'],
    });
    expect(db.data.has('users/u1/capsules/default')).toBe(true);
    expect(db.data.has('users/u1/capsules/default/memories/graphlite:gl-1')).toBe(false);
  });

  it('records degraded TrustGraph status without failing context construction', async () => {
    const capsule = await buildEnrichedTurnCapsule({
      uid: 'u1',
      traceId: 'trace-trustgraph-degraded',
      activeContextStack: { stackId: 'default', situationId: 'sit-1' },
      query: 'Will TrustGraph fail?',
    }, {
      ...deps(new FakeFirestore()),
      cognee: { enabled: false, recall: vi.fn() },
      trustgraph: {
        enabled: true,
        recall: vi.fn(async () => {
          throw new Error('trustgraph unavailable');
        }),
      },
    });

    expect(capsule.enrichment.receipt.trustgraph).toBe('degraded');
    expect(capsule.enrichment.receipt.warnings.join(' ')).toContain('trustgraph unavailable');
    expect(capsule.memory.semantic).toEqual([]);
  });

  it('adds Cognee recall hits to memory items and receipts without mutating canonical capsules', async () => {
    const db = new FakeFirestore();
    const recall = vi.fn(async () => ({
      status: 'enabled' as const,
      hits: [
        { id: 'hit-1', text: 'Prior reviewed assumption from memory.', score: 0.86, sourceId: 'src-1' },
        { id: 'hit-ignored', text: 'Unproven memory without provenance.', score: 0.55 },
      ],
    }));

    const capsule = await buildEnrichedTurnCapsule({
      uid: 'u1',
      traceId: 'trace-cognee',
      activeContextStack: { stackId: 'default', situationId: 'sit-1' },
      query: 'Recall the prior assumption.',
    }, {
      ...deps(db),
      cognee: { enabled: true, recall },
    });

    expect(recall).toHaveBeenCalledWith({
      uid: 'u1',
      capsuleId: 'default',
      query: 'Recall the prior assumption.',
      limit: 6,
    });
    expect(capsule.memory.semantic.map((item) => item.id)).toEqual(['cognee:hit-1']);
    expect(capsule.enrichment.receipt.cognee).toBe('enabled');
    expect(capsule.enrichment.receipt.memoryItemIds).toEqual(['cognee:hit-1']);
    expect(capsule.enrichment.receipt.usedMemoryItemIds).toEqual(['cognee:hit-1']);
    expect(capsule.enrichment.receipt.ignoredMemoryItemIds).toEqual(['cognee:hit-ignored']);
    expect(capsule.enrichment.receipt.writebackProposalIds).toEqual(['review-card:cognee:hit-1']);
    expect(db.data.has('users/u1/capsules/default')).toBe(true);
    expect(db.data.has('users/u1/capsules/default/memories/cognee:hit-1')).toBe(false);
  });

  it('records degraded Cognee status without failing context construction', async () => {
    const capsule = await buildEnrichedTurnCapsule({
      uid: 'u1',
      traceId: 'trace-degraded',
      activeContextStack: { stackId: 'default', situationId: 'sit-1' },
      query: 'Will recall fail?',
    }, {
      ...deps(new FakeFirestore()),
      cognee: {
        enabled: true,
        recall: vi.fn(async () => {
          throw new Error('backend unavailable');
        }),
      },
    });

    expect(capsule.enrichment.receipt.cognee).toBe('degraded');
    expect(capsule.enrichment.receipt.warnings.join(' ')).toContain('backend unavailable');
    expect(capsule.memory.semantic).toEqual([]);
  });

  it('keeps the temporal graph provider deferred and non-callable', async () => {
    const provider = createDisabledTemporalGraphProvider();

    expect(provider.status()).toEqual({ status: 'deferred', enabled: false });
    await expect(provider.getTemporalDeltas()).rejects.toThrow('Graphiti temporal provider is deferred');
  });

  it('builds the public enrichment receipt shape used by health and runtime receipts', () => {
    expect(buildContextEnrichmentReceipt({ cogneeEnabled: false })).toMatchObject({
      firestore: 'ready',
      cognee: 'disabled',
      trustgraph: 'disabled',
      graphiti: 'deferred',
      canonicalStatus: 'firestore-canonical',
      memoryHitCount: 0,
      writebackProposalIds: [],
      usedMemoryItemIds: [],
      ignoredMemoryItemIds: [],
      trustgraphHitCount: 0,
      trustgraphItemIds: [],
      usedTrustGraphItemIds: [],
      ignoredTrustGraphItemIds: [],
      graphliteHitCount: 0,
      graphliteItemIds: [],
      usedGraphLiteItemIds: [],
      ignoredGraphLiteItemIds: [],
      graphCandidateIds: [],
      explainabilityIds: [],
    });
    expect(buildContextEnrichmentReceipt({ cogneeEnabled: true })).toMatchObject({
      firestore: 'ready',
      cognee: 'enabled',
      trustgraph: 'disabled',
      graphlite: 'disabled',
      graphiti: 'deferred',
      canonicalStatus: 'firestore-canonical',
      memoryHitCount: 0,
      writebackProposalIds: [],
      usedMemoryItemIds: [],
      ignoredMemoryItemIds: [],
    });
  });
});

function deps(db: FakeFirestore) {
  return {
    db: db as never,
    now: () => new Date('2026-05-19T00:00:00.000Z'),
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
  constructor(private db: FakeFirestore, private path: string, public id: string) {}

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
