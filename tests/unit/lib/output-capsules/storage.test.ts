import { describe, expect, it } from 'vitest';
import { createCapsule } from '@/lib/context/capsule-service';
import { getOutputCapsule, listOutputCapsules, saveOutputCapsule } from '@/lib/output-capsules/storage';

describe('OutputCapsule storage', () => {
  it('persists owner-scoped OutputCapsules and mirrors capsule output refs', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-1', label: 'Working capsule' }, deps(db));

    const saved = await saveOutputCapsule('u1', {
      id: 'out-1',
      contextCapsuleId: 'cap-1',
      templateId: 'country-one-pager',
      payload: {
        title: 'Sudan country one-pager',
        summary: 'A compact country readout.',
        country: 'Sudan',
        sections: [{ heading: 'BLUF', body: 'Decision context.', citationIds: ['c1'] }],
      },
      citations: [{ id: 'c1', title: 'Source receipt', uri: 'https://example.test/source' }],
      provenance: { createdBy: 'test', toolIds: ['grounded-research'], agentIds: [] },
    }, deps(db));

    expect(saved?.id).toBe('out-1');
    expect(saved?.contextCapsuleId).toBe('cap-1');
    expect(await getOutputCapsule('u1', 'out-1', deps(db))).not.toBeNull();
    expect(await getOutputCapsule('u2', 'out-1', deps(db))).toBeNull();
    expect(await listOutputCapsules('u1', { contextCapsuleId: 'cap-1' }, deps(db))).toHaveLength(1);
    expect(db.data.has('users/u1/outputCapsules/out-1')).toBe(true);
    expect(db.data.has('users/u1/capsules/cap-1/outputs/out-1')).toBe(true);
  });

  it('refuses to bind an output to a missing ContextCapsule', async () => {
    const db = new FakeFirestore();
    const saved = await saveOutputCapsule('u1', {
      contextCapsuleId: 'missing',
      templateId: 'country-one-pager',
      payload: {
        title: 'Sudan country one-pager',
        summary: 'A compact country readout.',
        country: 'Sudan',
        sections: [{ heading: 'BLUF', body: 'Decision context.', citationIds: [] }],
      },
      provenance: { createdBy: 'test', toolIds: [], agentIds: [] },
    }, deps(db));

    expect(saved).toBeNull();
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
