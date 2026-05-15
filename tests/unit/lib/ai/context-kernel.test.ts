import { describe, expect, it } from 'vitest';
import { buildTurnCapsule, persistSuggestedActionReceipt, runCapability, suggestNextActions } from '@/lib/ai/context-kernel';

describe('context kernel', () => {
  it('builds a turn capsule and excludes deleted memory from the next capsule', async () => {
    const db = new FakeFirestore();
    const capsule = await buildTurnCapsule({
      uid: 'u1',
      traceId: 'trace-1',
      activeContextStack: {
        stackId: 'default',
        userModelId: 'user-core-1',
        situationId: 'situation-core-1',
        sourceIds: ['source-1'],
        documentIds: ['doc-1'],
        outputGoal: 'memo',
      },
      memoryItems: [
        { id: 'mem-1', type: 'semantic', text: 'Use concise ministerial prose.', capsuleId: '__global__' },
        { id: 'mem-2', type: 'episodic', text: 'Deleted old assumption.', capsuleId: 'default', deletedAt: '2026-05-14T00:00:00.000Z' },
        { id: 'mem-3', type: 'procedural', text: 'Prefer options memo format.', capsuleId: 'default' },
      ],
    }, deps(db));

    expect(capsule.traceId).toBe('trace-1');
    expect(capsule.capsuleId).toBe('default');
    expect(capsule.capsuleVersion).toBe(2);
    expect(capsule.stack.label).toBe('Default capsule');
    expect(capsule.userCore).toBe('user-core-1');
    expect(capsule.situationCore).toBe('situation-core-1');
    expect(capsule.sourceDocumentCore).toEqual(['source-1', 'doc-1']);
    expect(capsule.injectableContext.promptBlock).toContain('<praxis-context-capsule>');
    expect(capsule.memory.semantic.map((item) => item.id)).toEqual(['mem-1']);
    expect(capsule.memory.episodic).toEqual([]);
    expect(capsule.memory.procedural.map((item) => item.id)).toEqual(['mem-3']);
  });

  it('plans capability runs through canonical route families', async () => {
    const db = new FakeFirestore();
    const capsule = await buildTurnCapsule({
      uid: 'u1',
      traceId: 'trace-2',
      activeContextStack: {
        stackId: 'default',
        situationId: 'sit-2',
        sourceIds: ['source-2'],
      },
    }, deps(db));

    const plan = runCapability({
      capabilityId: 'evidence-critique',
      capsule,
      payload: { claim: 'The ceasefire compliance mechanism is working.' },
    });

    expect(plan.routeFamily).toBe('critique');
    expect(plan.canonicalPath).toBe('/api/ai/critique');
    expect(plan.persistenceTarget).toBe('tool_run');
    expect(plan.payload).toMatchObject({
      claim: 'The ceasefire compliance mechanism is working.',
      capsuleId: 'default',
      capsuleVersion: 2,
      traceId: 'trace-2',
      capabilityId: 'evidence-critique',
      actionLabel: 'evidence-critique',
    });
    expect(plan.receipt).toMatchObject({
      capabilityId: 'evidence-critique',
      capsuleId: 'default',
      capsuleVersion: 2,
      routeFamily: 'critique',
      traceId: 'trace-2',
      status: 'planned',
    });
  });

  it('suggests natural next actions instead of route names', async () => {
    const db = new FakeFirestore();
    const capsule = await buildTurnCapsule({
      uid: 'u1',
      activeContextStack: { stackId: 'default', situationId: 'sit-3' },
      activeGaps: ['No current source receipts attached.'],
    }, deps(db));

    const actions = suggestNextActions(capsule);
    expect(actions).toHaveLength(3);
    expect(actions.map((action) => action.label)).toContain('Find sources');
    expect(actions.every((action) => action.capabilityId)).toBe(true);
    expect(actions.map((action) => action.label).join(' ')).not.toContain('/api/ai/search');
  });

  it('persists suggested action receipts under the owner scope', async () => {
    const db = new FakeFirestore();
    const capsule = await buildTurnCapsule({
      uid: 'u1',
      traceId: 'trace-4',
      activeContextStack: { stackId: 'default', situationId: 'sit-4' },
    }, deps(db));
    const plan = runCapability({ capabilityId: 'source-search', capsule, actionLabel: 'Find sources' });

    await persistSuggestedActionReceipt('u1', plan.receipt, deps(db));

    expect(db.data.has(`users/u1/capability_action_receipts/${plan.receipt.actionId}`)).toBe(true);
    expect(db.data.has(`users/u2/capability_action_receipts/${plan.receipt.actionId}`)).toBe(false);
  });
});

function deps(db: FakeFirestore) {
  return {
    db: db as never,
    now: () => new Date('2026-05-14T00:00:00.000Z'),
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
