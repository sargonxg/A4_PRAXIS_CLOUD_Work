import { describe, expect, it } from 'vitest';
import {
  activateCapsule,
  bumpCapsuleVersion,
  createCapsule,
  forkCapsule,
  getCapsule,
  getOrMigrateDefaultCapsule,
  saveContextStackCompat,
  setCapsuleCoreLock,
} from '@/lib/context/capsule-service';
import { buildCapsuleInjectionKey, resolveInjectableContext } from '@/lib/context/context-injection';
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
    expect(db.data.has('users/u1/capsules/cap-2/versions/v1')).toBe(true);
    expect(db.data.has('users/u1/capsules/cap-2/versions/v2')).toBe(true);
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

  it('resolves an injectable prompt block from the active stack and persists it as a capsule', async () => {
    const db = new FakeFirestore();

    const resolved = await resolveInjectableContext({
      uid: 'u1',
      activeContextStack: {
        stackId: 'default',
        userModelId: 'policy-analyst',
        situationId: 'indo-pacific-2026',
        sourceIds: ['src-1', 'src-2'],
        documentIds: ['doc-1'],
        outputGoal: 'options-memo',
      },
      situationId: 'indo-pacific-2026',
    }, deps(db));

    expect(resolved.capsule.capsuleId).toBe('default');
    expect(resolved.stack.situationId).toBe('indo-pacific-2026');
    expect(resolved.injectionKey).toBe(buildCapsuleInjectionKey(resolved.capsule));
    expect(resolved.promptBlock).toContain('<praxis-context-capsule>');
    expect(resolved.promptBlock).toContain('user_core: policy-analyst');
    expect(resolved.promptBlock).toContain('situation_core: indo-pacific-2026');
    expect(resolved.promptBlock).toContain('source_cores: src-1, src-2');
    expect(resolved.promptBlock).toContain('document_cores: doc-1');
    expect(resolved.sharePath).toBe('/app/contexts?capsuleId=default');
  });

  it('stores tool, objective, product, time, and memory cores on the capsule', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-rich', coreRefs: { situationCoreId: 'sit-1' } }, deps(db));

    const updated = await bumpCapsuleVersion('u1', 'cap-rich', {
      coreRefs: {
        toolCoreIds: ['ask-praxis'],
        objectiveCoreIds: ['obj-decision-options'],
        productCoreIds: ['prd-options-memo'],
        timeCoreId: 'tim-quarterly-policy',
        memoryCoreId: 'mem-working-assumptions',
      },
    }, deps(db));
    const resolved = await resolveInjectableContext({ uid: 'u1', capsuleId: 'cap-rich' }, deps(db));

    expect(updated?.coreRefs.toolCoreIds).toEqual(['ask-praxis']);
    expect(updated?.coreRefs.objectiveCoreIds).toEqual(['obj-decision-options']);
    expect(updated?.coreRefs.productCoreIds).toEqual(['prd-options-memo']);
    expect(updated?.coreRefs.timeCoreId).toBe('tim-quarterly-policy');
    expect(updated?.coreRefs.memoryCoreId).toBe('mem-working-assumptions');
    expect(resolved.promptBlock).toContain('tool_cores: ask-praxis');
    expect(resolved.promptBlock).toContain('objective_cores: obj-decision-options');
    expect(resolved.promptBlock).toContain('product_cores: prd-options-memo');
  });

  it('locks capsule core kinds and includes the lock in injected context', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-lock', coreRefs: { situationCoreId: 'sit-1' } }, deps(db));

    const locked = await setCapsuleCoreLock('u1', 'cap-lock', { kind: 'situation', locked: true }, deps(db));
    const resolved = await resolveInjectableContext({ uid: 'u1', capsuleId: 'cap-lock' }, deps(db));
    const unlocked = await setCapsuleCoreLock('u1', 'cap-lock', { kind: 'situation', locked: false }, deps(db));

    expect(locked?.lockedCoreKinds).toEqual(['situation']);
    expect(resolved.promptBlock).toContain('locked_cores: situation');
    expect(unlocked?.lockedCoreKinds).toEqual([]);
    expect(db.data.has('users/u1/capsules/cap-lock/versions/v1')).toBe(true);
    expect(db.data.has('users/u1/capsules/cap-lock/versions/v2')).toBe(true);
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
