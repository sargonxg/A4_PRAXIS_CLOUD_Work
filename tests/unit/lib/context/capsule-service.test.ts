import { describe, expect, it } from 'vitest';
import {
  activateCapsule,
  bumpCapsuleVersion,
  createCapsule,
  forkCapsule,
  getCapsule,
  getOrMigrateDefaultCapsule,
  saveContextStackCompat,
} from '@/lib/context/capsule-service';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';

describe('capsule service', () => {
  it('migrates the legacy default context stack into the default capsule', async () => {
    const db = new FakeFirestore();
    const legacyStack: Partial<ActiveContextStackState> = {
      stackId: 'default',
      userModelId: 'foreign-policy-analyst',
      situationId: 'sit-1',
      sourceIds: ['src-1'],
      documentIds: ['doc-1'],
      outputGoal: 'memo',
    };
    await db.collection('users').doc('u1').collection('contextStacks').doc('default').set(legacyStack);

    const result = await getOrMigrateDefaultCapsule('u1', deps(db));

    expect(result.migrated).toBe(true);
    expect(result.capsule.capsuleId).toBe('default');
    expect(result.capsule.ownerUid).toBe('u1');
    expect(result.capsule.coreRefs.situationCoreId).toBe('sit-1');
    expect(result.capsule.coreRefs.sourceCoreIds).toEqual(['src-1']);
    expect(result.capsule.activeForSituationIds).toContain('sit-1');
    expect(await getCapsule('u1', 'default', deps(db))).not.toBeNull();
  });

  it('keeps owner isolation by storing capsules under each user document', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-1', coreRefs: { situationCoreId: 'sit-1' } }, deps(db));

    expect(await getCapsule('u1', 'cap-1', deps(db))).not.toBeNull();
    expect(await getCapsule('u2', 'cap-1', deps(db))).toBeNull();
  });

  it('records fork lineage without activating the fork', async () => {
    const db = new FakeFirestore();
    const parent = await createCapsule('u1', {
      capsuleId: 'cap-1',
      coreRefs: { situationCoreId: 'sit-1' },
      activeForSituationIds: ['sit-1'],
    }, deps(db));
    const fork = await forkCapsule('u1', parent.capsuleId, { capsuleId: 'cap-2' }, deps(db));

    expect(fork?.parentCapsuleId).toBe(parent.capsuleId);
    expect(fork?.forkedFromVersion).toBe(parent.version);
    expect(fork?.provenance.source).toBe('fork');
    expect(fork?.activeForSituationIds).toEqual([]);
  });

  it('bumps versions and can activate one capsule per situation', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'cap-1',
      coreRefs: { situationCoreId: 'sit-1' },
      activeForSituationIds: ['sit-1'],
    }, deps(db));
    await createCapsule('u1', { capsuleId: 'cap-2', coreRefs: { situationCoreId: 'sit-1' } }, deps(db));

    const bumped = await bumpCapsuleVersion('u1', 'cap-2', { coreRefs: { sourceCoreIds: ['src-2'] } }, deps(db));
    const activated = await activateCapsule('u1', 'cap-2', { situationId: 'sit-1' }, deps(db));
    const old = await getCapsule('u1', 'cap-1', deps(db));

    expect(bumped?.version).toBe(2);
    expect(bumped?.coreRefs.sourceCoreIds).toEqual(['src-2']);
    expect(activated?.activeForSituationIds).toEqual(['sit-1']);
    expect(old?.activeForSituationIds).toEqual([]);
  });

  it('keeps the context-stack compatibility adapter capsule-backed', async () => {
    const db = new FakeFirestore();
    const result = await saveContextStackCompat('u1', {
      userModelId: 'policy-director',
      situationId: 'sit-2',
      sourceIds: ['src-a'],
    }, deps(db));

    expect(result.persisted).toBe(true);
    expect(result.stack.situationId).toBe('sit-2');
    expect(result.capsule.coreRefs.userCoreId).toBe('policy-director');
    expect(result.capsule.coreRefs.situationCoreId).toBe('sit-2');
    expect(result.capsule.version).toBe(2);
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
