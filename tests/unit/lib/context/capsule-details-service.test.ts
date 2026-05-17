import { describe, expect, it } from 'vitest';
import { createCapsule } from '@/lib/context/capsule-service';
import {
  createCapsuleEvaluation,
  createCapsuleMemory,
  createCapsuleNote,
  listCapsuleEvaluations,
  listCapsuleMemories,
  listCapsuleNotes,
} from '@/lib/context/capsule-details-service';

describe('capsule details service', () => {
  it('stores notes, evaluations, and memories under the owner-scoped capsule', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-1', label: 'Policy capsule' }, deps(db));

    const note = await createCapsuleNote('u1', 'cap-1', {
      id: 'note-1',
      type: 'decision',
      body: 'Use the narrow sanctions frame until sourceability improves.',
      tags: ['sanctions', 'decision', 'sanctions'],
      starred: true,
      links: { runId: 'run-1', sourceIds: ['src-1'] },
    }, deps(db));
    const evaluation = await createCapsuleEvaluation('u1', 'cap-1', {
      id: 'eval-1',
      stars: 4,
      summary: 'Good working capsule, but source freshness needs review.',
      scorecard: { sourceCoverage: 0.7, freshness: 0.4, contradictionRisk: 0.2, actionability: 0.8, confidence: 0.6 },
    }, deps(db));
    const memory = await createCapsuleMemory('u1', 'cap-1', {
      id: 'mem-1',
      type: 'working_assumption',
      summary: 'Reviewer prefers explicit caveats before recommendations.',
      confidence: 0.75,
      createdFromRunId: 'run-1',
    }, deps(db));

    expect(note?.starred).toBe(true);
    expect(note?.tags).toEqual(['sanctions', 'decision']);
    expect(evaluation?.scorecard.sourceCoverage).toBe(0.7);
    expect(memory?.createdFromRunId).toBe('run-1');
    expect(await listCapsuleNotes('u1', 'cap-1', deps(db))).toHaveLength(1);
    expect(await listCapsuleEvaluations('u1', 'cap-1', deps(db))).toHaveLength(1);
    expect(await listCapsuleMemories('u1', 'cap-1', deps(db))).toHaveLength(1);
    expect(await listCapsuleNotes('u2', 'cap-1', deps(db))).toEqual([]);
    expect(db.data.has('users/u1/capsules/cap-1/notes/note-1')).toBe(true);
    expect(db.data.has('users/u1/capsules/cap-1/evaluations/eval-1')).toBe(true);
    expect(db.data.has('users/u1/capsules/cap-1/memories/mem-1')).toBe(true);
  });

  it('refuses details for missing capsules', async () => {
    const db = new FakeFirestore();

    await expect(createCapsuleNote('u1', 'missing', { body: 'note' }, deps(db))).resolves.toBeNull();
    await expect(createCapsuleEvaluation('u1', 'missing', { stars: 5, summary: 'ok' }, deps(db))).resolves.toBeNull();
    await expect(createCapsuleMemory('u1', 'missing', { summary: 'memory' }, deps(db))).resolves.toBeNull();
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
