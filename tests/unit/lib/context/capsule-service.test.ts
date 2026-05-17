import { describe, expect, it } from 'vitest';
import {
  activateCapsule,
  archiveCapsule,
  attachCapsuleRefs,
  bumpCapsuleVersion,
  combineCapsules,
  createCapsule,
  detachCapsuleRefs,
  exportCapsuleCorePackage,
  forkCapsule,
  getCapsule,
  getOrMigrateDefaultCapsule,
  listCapsules,
  rateCapsule,
  saveContextStackCompat,
  seedStarterCapsules,
  setCapsuleAccessPolicy,
  setCapsuleCoreLock,
  setCapsuleFavorite,
  swapCapsuleCore,
} from '@/lib/context/capsule-service';
import { parseCorePackage } from '@/lib/context/core-package';
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

  it('combines capsules by deduping refs and recording single-slot conflicts', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'cap-a',
      label: 'Policy frame',
      coreRefs: {
        userCoreId: 'user-1',
        situationCoreId: 'sit-1',
        sourceCoreIds: ['src-1', 'src-2'],
        documentCoreIds: ['doc-1'],
        outputCoreIds: ['memo'],
      },
      activeForSituationIds: ['sit-1'],
    }, deps(db));
    await createCapsule('u1', {
      capsuleId: 'cap-b',
      label: 'Legal frame',
      coreRefs: {
        userCoreId: 'user-2',
        situationCoreId: 'sit-1',
        sourceCoreIds: ['src-2', 'src-3'],
        documentCoreIds: ['doc-2'],
        graphCoreId: 'graph-1',
        outputCoreIds: ['brief'],
      },
      activeForSituationIds: ['sit-1'],
    }, deps(db));

    const result = await combineCapsules('u1', {
      capsuleIds: ['cap-a', 'cap-b'],
      capsuleId: 'cap-combined',
      label: 'Working combined capsule',
    }, deps(db));

    expect(result?.capsule.capsuleId).toBe('cap-combined');
    expect(result?.parentCapsuleIds).toEqual(['cap-a', 'cap-b']);
    expect(result?.capsule.provenance.source).toBe('combine');
    expect(result?.capsule.provenance.notes).toContain('cap-a@v1, cap-b@v1');
    expect(result?.capsule.coreRefs.sourceCoreIds).toEqual(['src-1', 'src-2', 'src-3']);
    expect(result?.capsule.coreRefs.documentCoreIds).toEqual(['doc-1', 'doc-2']);
    expect(result?.capsule.coreRefs.outputCoreIds).toEqual(['memo', 'brief']);
    expect(result?.capsule.coreRefs.graphCoreId).toBe('graph-1');
    expect(result?.conflicts).toEqual([{ slot: 'userCoreId', kept: 'user-1', alternatives: ['user-2'] }]);
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

  it('associates reference capsules without adding the active capsule to itself', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-main', coreRefs: { situationCoreId: 'sit-1' } }, deps(db));
    await createCapsule('u1', { capsuleId: 'cap-source', coreRefs: { sourceCoreIds: ['src-1'] } }, deps(db));
    await createCapsule('u1', { capsuleId: 'cap-output', coreRefs: { outputCoreIds: ['memo'] } }, deps(db));

    const updated = await bumpCapsuleVersion('u1', 'cap-main', {
      associatedCapsuleIds: ['cap-source', 'cap-main', 'cap-output', 'cap-source'],
    }, deps(db));

    expect(updated?.associatedCapsuleIds).toEqual(['cap-source', 'cap-output']);
    expect(updated?.version).toBe(2);
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
    expect(resolved.sharePath).toBe('/app?capsuleId=default');
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

  it('archives capsules without deleting lineage and omits them from normal lists', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-archive', coreRefs: { situationCoreId: 'sit-1' }, activeForSituationIds: ['sit-1'] }, deps(db));

    const archived = await archiveCapsule('u1', 'cap-archive', deps(db));
    const visible = await listCapsules('u1', {}, deps(db));
    const withArchived = await listCapsules('u1', { includeArchived: true }, deps(db));

    expect(archived?.archivedAt).toBe('2026-05-14T00:00:00.000Z');
    expect(archived?.activeForSituationIds).toEqual([]);
    expect(visible.map((capsule) => capsule.capsuleId)).not.toContain('cap-archive');
    expect(withArchived.map((capsule) => capsule.capsuleId)).toContain('cap-archive');
    expect(db.data.has('users/u1/capsules/cap-archive/versions/v2')).toBe(true);
  });

  it('attaches source and document receipts into capsule slots', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'cap-attach',
      coreRefs: { sourceCoreIds: ['src-1'], documentCoreIds: ['doc-1'] },
    }, deps(db));

    const updated = await attachCapsuleRefs('u1', 'cap-attach', {
      sourceIds: ['src-1', 'src-2'],
      documentIds: ['doc-2'],
    }, deps(db));

    expect(updated?.coreRefs.sourceCoreIds).toEqual(['src-1', 'src-2']);
    expect(updated?.coreRefs.documentCoreIds).toEqual(['doc-1', 'doc-2']);
    expect(updated?.version).toBe(2);
  });

  it('swaps single slots and adds or removes multi-core slots without clobbering peers', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'cap-swap',
      coreRefs: {
        userCoreId: 'user-a',
        sourceCoreIds: ['src-1'],
        outputCoreIds: ['out-1'],
      },
    }, deps(db));

    const replaced = await swapCapsuleCore('u1', 'cap-swap', {
      slotKind: 'user',
      coreId: 'user-b',
    }, deps(db));
    const added = await swapCapsuleCore('u1', 'cap-swap', {
      slotKind: 'source',
      coreId: 'src-2',
      mode: 'add',
    }, deps(db));
    const removed = await swapCapsuleCore('u1', 'cap-swap', {
      slotKind: 'output',
      coreId: 'out-1',
      mode: 'remove',
    }, deps(db));

    expect(replaced?.coreRefs.userCoreId).toBe('user-b');
    expect(added?.coreRefs.sourceCoreIds).toEqual(['src-1', 'src-2']);
    expect(removed?.coreRefs.outputCoreIds).toEqual([]);
  });

  it('mirrors default capsule swaps into contextStacks/default', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'default',
      coreRefs: { situationCoreId: 'sit-1', sourceCoreIds: ['src-1'] },
    }, deps(db));

    await swapCapsuleCore('u1', 'default', {
      slotKind: 'source',
      coreId: 'src-2',
      mode: 'add',
    }, deps(db));

    const stack = await db.collection('users').doc('u1').collection('contextStacks').doc('default').get();
    expect(stack.data().sourceIds).toEqual(['src-1', 'src-2']);
    expect(stack.data().capsuleId).toBe('default');
  });

  it('detaches selected source and document receipts without losing the remaining refs', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'cap-detach',
      coreRefs: { sourceCoreIds: ['src-1', 'src-2'], documentCoreIds: ['doc-1', 'doc-2'] },
    }, deps(db));

    const updated = await detachCapsuleRefs('u1', 'cap-detach', {
      sourceIds: ['src-1'],
      documentIds: ['doc-2'],
    }, deps(db));

    expect(updated?.coreRefs.sourceCoreIds).toEqual(['src-2']);
    expect(updated?.coreRefs.documentCoreIds).toEqual(['doc-1']);
    expect(updated?.version).toBe(2);
  });

  it('computes a trust semaphore and carries private-by-default marketplace metadata', async () => {
    const db = new FakeFirestore();
    const thin = await createCapsule('u1', { capsuleId: 'thin' }, deps(db));
    const strong = await createCapsule('u1', {
      capsuleId: 'strong',
      coreRefs: {
        userCoreId: 'user-1',
        situationCoreId: 'sit-1',
        pathCoreId: 'path-policy',
        sourceCoreIds: ['src-1'],
        documentCoreIds: ['doc-1'],
        graphCoreId: 'graph-1',
        outputCoreIds: ['memo'],
        toolCoreIds: ['ask-praxis'],
        objectiveCoreIds: ['options'],
        productCoreIds: ['memo'],
        memoryCoreId: 'mem-1',
      },
    }, deps(db));

    expect(thin.trust.level).toBe('red');
    expect(thin.access.visibility).toBe('private');
    expect(strong.trust.level).toBe('amber');
    expect(strong.trust.score).toBeGreaterThanOrEqual(65);
    expect(strong.health.blockers).toEqual([]);
  });

  it('publishes, favorites, rates, and exports capsules as .core packages', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'ChinaEconomy',
      label: 'ChinaEconomy',
      coreRefs: { situationCoreId: 'china-economy', sourceCoreIds: ['src-1'] },
    }, deps(db));

    const publicCapsule = await setCapsuleAccessPolicy('u1', 'ChinaEconomy', { visibility: 'public' }, deps(db));
    const favorite = await setCapsuleFavorite('u1', 'ChinaEconomy', true, deps(db));
    const rated = await rateCapsule('u1', 'ChinaEconomy', 5, deps(db));
    const exported = await exportCapsuleCorePackage('u1', 'ChinaEconomy', deps(db));

    expect(publicCapsule?.access.visibility).toBe('public');
    expect(publicCapsule?.community.listedInMarketplace).toBe(true);
    expect(favorite?.community.favorite).toBe(true);
    expect(rated?.community.userRating).toBe(5);
    expect(exported?.filename).toBe('ChinaEconomy.core');
    expect(exported?.mimeType).toBe('application/praxis-core+json');
    expect(parseCorePackage(exported?.package)?.capsule.capsuleId).toBe('ChinaEconomy');
  });

  it('seeds the starter capsule library once per owner without duplicating records', async () => {
    const db = new FakeFirestore();

    const first = await seedStarterCapsules('u1', deps(db));
    const second = await seedStarterCapsules('u1', deps(db));
    const capsules = await listCapsules('u1', { includeArchived: true }, deps(db));

    expect(first.created).toBe(20);
    expect(first.existing).toBe(0);
    expect(second.created).toBe(0);
    expect(second.existing).toBe(20);
    expect(capsules.filter((capsule) => capsule.community.tags.includes('starter'))).toHaveLength(20);
    expect(capsules.filter((capsule) => capsule.community.favorite && (capsule.community.averageRating ?? 0) >= 4.8)).toHaveLength(20);
    expect(capsules.filter((capsule) => capsule.community.ratingCount >= 10)).toHaveLength(20);
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-source-pack-builder')?.coreRefs.toolCoreIds).toContain('grounded-research');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-output-diplomatic-options-memo')?.coreRefs.outputCoreIds).toContain('diplomatic-cable');

    const resolved = await resolveInjectableContext({ uid: 'u1', capsuleId: 'starter-tool-source-pack-builder' }, deps(db));
    expect(resolved.promptBlock).toContain('[starter_capsule_definition]');
    expect(resolved.promptBlock).toContain('starter_category: tool');
    expect(resolved.promptBlock).toContain('recommended_tools: grounded-research, sourceability, ask-praxis');
    expect(resolved.promptBlock).toContain('source_pack:');
  });

  it('does not overwrite an edited starter capsule during reseeding', async () => {
    const db = new FakeFirestore();
    await seedStarterCapsules('u1', deps(db));
    await bumpCapsuleVersion('u1', 'starter-situation-diplomatic-options', {
      label: 'Edited diplomatic options capsule',
      community: { tags: ['starter', 'situation', 'custom-tag'] },
    }, deps(db));

    const result = await seedStarterCapsules('u1', deps(db));
    const capsule = await getCapsule('u1', 'starter-situation-diplomatic-options', deps(db));

    expect(result.created).toBe(0);
    expect(result.existing).toBe(20);
    expect(capsule?.label).toBe('Edited diplomatic options capsule');
    expect(capsule?.community.tags).toContain('custom-tag');
    expect(capsule?.version).toBe(2);
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
