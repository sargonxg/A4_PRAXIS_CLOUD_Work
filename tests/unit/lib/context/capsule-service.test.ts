import { describe, expect, it } from 'vitest';
import {
  activateCapsule,
  archiveCapsule,
  applyCapsuleReviewCard,
  attachCapsuleRefs,
  bumpCapsuleVersion,
  buildCapsuleInventorySummary,
  combineCapsules,
  approveAdvisoryMemoryCandidate,
  createCapsuleReviewCard,
  createCapsuleIntakeReviewCards,
  createEmptyCapsuleInventorySummary,
  createCapsule,
  detachCapsuleRefs,
  exportCapsuleCorePackage,
  forkCapsule,
  buildContextCapsuleV3,
  getCapsule,
  getOrMigrateDefaultCapsule,
  listCapsuleInventory,
  listCapsules,
  promoteCapsuleSourceGaps,
  promoteCapsuleOntologyExtensionToGlobalAco,
  proposeCogneeSeedReviewCards,
  proposeCapsuleGraphNodeChange,
  rateCapsule,
  recordCapsuleReadReceiptUsage,
  rejectAdvisoryMemoryCandidate,
  resolveCapsuleOntologyStack,
  saveContextStackCompat,
  seedStarterCapsules,
  setCapsuleAccessPolicy,
  setCapsuleCoreLock,
  setCapsuleFavorite,
  sanitizeCapsule,
  swapCapsuleCore,
  validateOntologyStack,
} from '@/lib/context/capsule-service';
import { parseCorePackage } from '@/lib/context/core-package';
import { buildCapsuleInjectionKey, buildCapsulePromptBlock, resolveInjectableContext } from '@/lib/context/context-injection';
import { deriveCapsuleQuality } from '@/lib/context/capsule-quality';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';
import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
  CAPSULE_WOW_DEMO_STARTER_IDS,
} from '@/lib/product/context-capsules';
import {
  buildUserFeedbackLearningReviewCardInput,
  proposeCapsuleDocumentLearningReviewCards,
} from '@/lib/context/capsule-closed-loop-learning';

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

  it('omits absent provenance notes instead of storing Firestore-rejected undefined values', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', {
      capsuleId: 'cap-no-notes',
      provenance: { source: 'api', createdBy: 'u1' },
    }, deps(db));

    expect(capsule.provenance).not.toHaveProperty('notes');
    expect(db.data.get('users/u1/capsules/cap-no-notes')?.provenance).not.toHaveProperty('notes');
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

  it('resolves owned reference capsules and reports missing or archived references', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'cap-main',
      label: 'Primary capsule',
      coreRefs: { situationCoreId: 'sit-1', sourceCoreIds: ['src-primary'] },
      associatedCapsuleIds: ['cap-ref', 'cap-archived', 'cap-missing'],
    }, deps(db));
    await createCapsule('u1', {
      capsuleId: 'cap-ref',
      label: 'Reference capsule',
      coreRefs: { sourceCoreIds: ['src-reference'], documentCoreIds: ['doc-reference'] },
    }, deps(db));
    await createCapsule('u1', {
      capsuleId: 'cap-archived',
      label: 'Archived capsule',
      coreRefs: { sourceCoreIds: ['src-archived'] },
    }, deps(db));
    await archiveCapsule('u1', 'cap-archived', deps(db));
    await createCapsule('u2', {
      capsuleId: 'cap-ref',
      label: 'Other owner capsule',
      coreRefs: { sourceCoreIds: ['src-other-owner'] },
    }, deps(db));

    const resolved = await resolveInjectableContext({ uid: 'u1', capsuleId: 'cap-main' }, deps(db));

    expect(resolved.associatedCapsules.map((capsule) => capsule.capsuleId)).toEqual(['cap-ref']);
    expect(resolved.missingAssociatedCapsuleIds).toEqual(['cap-archived', 'cap-missing']);
    expect(resolved.promptBlock).toContain('[associated_capsules]');
    expect(resolved.promptBlock).toContain('id: cap-ref');
    expect(resolved.promptBlock).toContain('label: Reference capsule');
    expect(resolved.promptBlock).toContain('role: reference');
    expect(resolved.promptBlock).not.toContain('src-archived');
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
        contextBlocks: {
          userCore: [{ id: 'policy-analyst', label: 'Policy analyst' }],
          situation: [{ id: 'indo-pacific-2026', label: 'Indo-Pacific watch' }],
          sources: [
            { id: 'src-1', label: 'Official source pack' },
            { id: 'src-2', label: 'Newswire source pack' },
            { id: 'doc-1', label: 'Uploaded brief' },
          ],
          thinkingDevices: [{ id: 'sourceability-matrix', label: 'Sourceability matrix' }],
          output: [{ id: 'options-memo', label: 'Options memo' }],
        },
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
    expect(resolved.promptBlock).toContain('[context_chain_blocks]');
    expect(resolved.promptBlock).toContain('thinking_devices: sourceability-matrix [primary] Sourceability matrix');
    expect(resolved.promptBlock).toContain('[llm_generation_contract]');
    expect(resolved.promptBlock).toContain('primary_capsule_governs: yes');
    expect(resolved.promptBlock).toContain('Separate capsule-grounded facts, retrieved evidence, outside model knowledge, and user-provided assumptions');
    expect(resolved.promptBlock).toContain('recommend or queue a capsule-bound AgentRun');
    expect(resolved.promptBlock).toContain('Outside model knowledge, online reading, and retrieval are supplemental only.');
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

  it('builds an active inventory summary while keeping archived capsules separately counted', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'cap-active',
      label: 'Active public capsule',
      access: { visibility: 'public' },
      community: { tags: ['type:situation', 'domain:diplomacy', 'team:diplomatic'] },
      coreRefs: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['src-1', 'src-1'],
        documentCoreIds: ['doc-1'],
        toolCoreIds: ['ask-praxis', 'ask-praxis'],
        outputCoreIds: ['options-memo'],
        productCoreIds: ['options-memo'],
      },
    }, deps(db));
    await createCapsule('u1', {
      capsuleId: 'cap-archived',
      label: 'Archived capsule',
      access: { visibility: 'private' },
      community: { tags: ['type:tool', 'domain:audit-review', 'team:research-strategy'] },
      coreRefs: {
        sourceCoreIds: ['archived-src'],
        documentCoreIds: ['archived-doc'],
        toolCoreIds: ['sourceability'],
        outputCoreIds: ['archived-output'],
      },
    }, deps(db));
    await archiveCapsule('u1', 'cap-archived', deps(db));

    const inventory = await listCapsuleInventory('u1', {}, deps(db));
    const withArchived = await listCapsuleInventory('u1', { includeArchived: true }, deps(db));

    expect(inventory.capsules.map((capsule) => capsule.capsuleId)).toEqual(['cap-active']);
    expect(withArchived.capsules.map((capsule) => capsule.capsuleId)).toEqual(['cap-active', 'cap-archived']);
    expect(inventory.summary).toMatchObject({
      storedCapsules: 2,
      activeCapsules: 1,
      archivedCapsules: 1,
      publicCapsules: 1,
      privateCapsules: 0,
      sourceReferences: 1,
      documentReferences: 1,
      toolReferences: 1,
      outputReferences: 1,
    });
    expect(inventory.summary.byType.find((item) => item.id === 'situation')?.count).toBe(1);
    expect(inventory.summary.byDomain.find((item) => item.id === 'audit-review')).toBeUndefined();
    expect(inventory.summary.integrityWarnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ capsuleId: 'cap-active', reason: 'core_refs_normalized' }),
    ]));
  });

  it('reports advisory inventory integrity warnings without mutating stored capsules', () => {
    const empty = createEmptyCapsuleInventorySummary();
    expect(empty).toMatchObject({
      storedCapsules: 0,
      activeCapsules: 0,
      archivedCapsules: 0,
      sourceReferences: 0,
      documentReferences: 0,
      toolReferences: 0,
      outputReferences: 0,
    });

    const rawLegacyStarter = {
      schemaVersion: 1,
      capsuleId: 'legacy-starter',
      ownerUid: 'u1',
      label: 'Legacy starter',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      version: 1,
      archivedAt: '2026-05-13T00:00:00.000Z',
      activeForSituationIds: ['sit-legacy'],
      community: { tags: ['starter', 'type:situation', 'domain:diplomacy'] },
      coreRefs: {
        sourceCoreIds: ['src-1', 'src-1', ''],
        documentCoreIds: ['doc-1', 'doc-1'],
      },
    };
    const summary = buildCapsuleInventorySummary([sanitizeCapsule(rawLegacyStarter)], {
      rawCapsules: [rawLegacyStarter],
    });

    expect(summary).toMatchObject({
      storedCapsules: 1,
      activeCapsules: 0,
      archivedCapsules: 1,
      starterCapsules: 0,
      sourceReferences: 0,
      documentReferences: 0,
    });
    expect(summary.integrityWarnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ capsuleId: 'legacy-starter', reason: 'legacy_v1_normalized_to_v2' }),
      expect.objectContaining({ capsuleId: 'legacy-starter', reason: 'core_refs_normalized' }),
      expect.objectContaining({ capsuleId: 'legacy-starter', reason: 'archived_capsule_has_active_situations' }),
      expect.objectContaining({ capsuleId: 'legacy-starter', reason: 'starter_missing_snapshot' }),
    ]));
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

    expect(first.created).toBe(CAPSULE_STARTER_DEFINITIONS.length);
    expect(first.existing).toBe(0);
    expect(second.created).toBe(0);
    expect(second.existing).toBe(first.created);
    expect(capsules.filter((capsule) => capsule.community.tags.includes('starter'))).toHaveLength(first.created);
    expect(capsules.filter((capsule) => capsule.community.favorite && (capsule.community.averageRating ?? 0) >= 4.8)).toHaveLength(first.created);
    expect(capsules.filter((capsule) => capsule.community.ratingCount >= 10)).toHaveLength(first.created);
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-source-pack-builder')?.coreRefs.toolCoreIds).toContain('grounded-research');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-assumption-audit')?.community.tags).toEqual(expect.arrayContaining([
      'type:tool',
      'domain:audit-review',
      'real-work',
      'v2-context',
      'human-gated',
      'review-card',
      'sourceable-workflow',
      'no-affiliation',
      'thinking-device',
      'review-gated',
    ]));
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-assumption-audit')?.starterSnapshot?.deviceProfile?.humanReviewGate).toMatch(/human|review|approval/i);
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-assumption-audit')?.starterSnapshot?.aiUseGuidance).toContain('no-affiliation boundaries visible before external use');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-assumption-audit')?.starterSnapshot?.agentWorkflow.approvalNotes).toContain('SQL projection writes');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-output-two-page-brief')?.coreRefs.outputCoreIds).toContain('options-memo');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-mediation-track')?.community.tags).toContain('team:diplomatic');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-output-diplomatic-options-memo')?.coreRefs.outputCoreIds).toContain('diplomatic-cable');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-ai-governance-procurement')?.starterSnapshot?.domain).toBe('ai-governance');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-statistical-baseline-builder')?.community.tags).toEqual(expect.arrayContaining(['type:tool', 'domain:exposure-mapping']));
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-indicator-shift-detector')?.coreRefs.toolCoreIds).toEqual(expect.arrayContaining(['scenario-projector', 'sourceability']));
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-output-statistical-annex')?.coreRefs.outputCoreIds).toContain('governance-index');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-output-evidence-dashboard-brief')?.coreRefs.productCoreIds).toContain('risk-monitor-card');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-data-quality-statistics')?.community.tags).toContain('team:research-strategy');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-haiti-gang-mss-access-watch')?.starterSnapshot?.humanReview?.status).toBe('human-reviewed');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-us-federal-ai-governance-baseline')?.starterSnapshot?.humanReview).toMatchObject({
      jurisdiction: 'United States federal',
      humanReviewGate: expect.stringMatching(/review|approval|human/i),
      sourcePackSummary: expect.stringMatching(/federal|NIST|OMB/i),
    });
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-ai-governance-procurement')?.starterSnapshot?.researchDossier).toMatchObject({
      dossierId: 'starter-situation-ai-governance-procurement-starter-dossier',
      status: 'starter-research-dossier',
      sourceSpine: expect.arrayContaining([
        expect.objectContaining({
          role: 'primary-authoritative',
          publisher: expect.any(String),
          nonAffiliationSafe: true,
        }),
      ]),
    });
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-ai-governance-procurement')?.starterSnapshot?.claimLedgerSeeds).toMatchObject({
      ledgerId: 'starter-situation-ai-governance-procurement-starter-claims',
      supported: expect.any(Array),
      weak: expect.any(Array),
      missing: expect.any(Array),
      stale: expect.any(Array),
    });
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-ai-governance-procurement')?.starterSnapshot?.humanWorkflowExample?.steps.length).toBeGreaterThanOrEqual(3);
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-ai-governance-procurement')?.starterSnapshot?.sourceRefreshDocket).toMatchObject({
      docketId: 'starter-refresh',
      sourceIds: expect.arrayContaining(['nist-ai-rmf']),
      humanReviewRequired: true,
    });
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-ai-governance-procurement')?.starterSnapshot?.graphLiteProjection).toMatchObject({
      provider: 'graphlite',
      status: 'compiled-advisory',
      advisoryOnly: true,
      canonicalStore: 'Firestore ContextCapsules',
      sourceIds: expect.arrayContaining(['nist-ai-rmf']),
    });
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-mediator-batna-zopa-ripeness-map')?.starterSnapshot?.deviceProfile?.deviceKind).toBe('mediator-ripeness-map');
    const sudanStarter = capsules.find((capsule) => capsule.capsuleId === 'starter-situation-sudan-darfur-atrocity-access');
    expect(sudanStarter?.starterSnapshot?.sourcePack?.some((source) => source.id === 'un-sudan-atrocity-famine-risk')).toBe(true);
    expect(sudanStarter?.starterSnapshot?.excerpts?.length).toBeGreaterThanOrEqual(2);
    expect(sudanStarter?.starterSnapshot?.aiUseGuidance).toMatch(/verify|source/i);
    expect(sudanStarter?.starterSnapshot?.agentWorkflow?.outputGoal).toBe('scenario-risk-dashboard-card');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-sourceability-matrix')?.starterSnapshot?.outputProductIds).toContain('evidence-sourceability-annex');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-output-principals-decision-memo')?.starterSnapshot?.outputProductIds).toContain('principals-decision-memo');
    expect(db.data.has('users/u1/capsules/starter-situation-ai-governance-procurement/sources/nist-ai-rmf')).toBe(true);
    expect(db.data.get('users/u1/capsules/starter-situation-ai-governance-procurement/sources/nist-ai-rmf')).toMatchObject({
      ontologyIds: expect.arrayContaining(['governance']),
      expectedClaims: expect.arrayContaining([expect.stringMatching(/rule|requirement|claim|source/i)]),
      forbiddenInferences: expect.arrayContaining([expect.stringMatching(/unsupported|stale|single-source|Cognee|canonical/i)]),
    });
    expect(db.data.has('users/u1/capsules/starter-situation-ai-governance-procurement/evaluations/starter-readiness')).toBe(true);
    expect(db.data.get('users/u1/capsules/starter-situation-ai-governance-procurement/evaluations/starter-readiness')).toMatchObject({
      contextCaptureProfileId: 'starter-situation-ai-governance-procurement-context-capture-v1',
      graphCaptureReviewState: 'proposed',
      graphPromotionGate: expect.stringMatching(/human|review-card|canonical/i),
    });
    const aiGovernanceOntologyGraph = db.data.get('users/u1/capsules/starter-situation-ai-governance-procurement/ontologyGraphs/starter-seed') as Record<string, unknown> | undefined;
    expect(aiGovernanceOntologyGraph).toMatchObject({
      graphId: 'starter-seed',
      ownerUid: 'u1',
      capsuleId: 'starter-situation-ai-governance-procurement',
      reviewState: 'proposed',
      proposalOnly: true,
      canonicalTruth: 'Firestore ContextCapsules',
      nodeCount: expect.any(Number),
      edgeCount: expect.any(Number),
    });
    expect(aiGovernanceOntologyGraph?.nodeCount).toBeGreaterThanOrEqual(64);
    expect(aiGovernanceOntologyGraph?.edgeCount).toBeGreaterThanOrEqual(64);
    expect((aiGovernanceOntologyGraph?.nodeTemplates as unknown[])?.length).toBeGreaterThanOrEqual(64);
    expect((aiGovernanceOntologyGraph?.edgeTemplates as unknown[])?.length).toBeGreaterThanOrEqual(64);
    expect(db.data.get('users/u1/capsules/starter-situation-ai-governance-procurement/researchDossiers/starter-dossier')).toMatchObject({
      dossierId: 'starter-situation-ai-governance-procurement-starter-dossier',
      capsuleId: 'starter-situation-ai-governance-procurement',
      ownerUid: 'u1',
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      status: 'starter-research-dossier',
      sourceIds: expect.arrayContaining(['nist-ai-rmf']),
      graphNodeCount: expect.any(Number),
      graphEdgeCount: expect.any(Number),
    });
    expect(db.data.get('users/u1/capsules/starter-situation-ai-governance-procurement/claimLedgers/starter-claims')).toMatchObject({
      ledgerId: 'starter-situation-ai-governance-procurement-starter-claims',
      capsuleId: 'starter-situation-ai-governance-procurement',
      ownerUid: 'u1',
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      reviewGate: expect.stringMatching(/human|review|source/i),
    });
    expect(db.data.get('users/u1/capsules/starter-situation-ai-governance-procurement/humanWorkflowExamples/starter-workflow')).toMatchObject({
      workflowId: 'starter-situation-ai-governance-procurement-starter-workflow',
      capsuleId: 'starter-situation-ai-governance-procurement',
      ownerUid: 'u1',
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      humanReviewGate: expect.stringMatching(/human|review|approval/i),
    });
    expect(db.data.get('users/u1/capsules/starter-situation-ai-governance-procurement/sourceRefreshDockets/starter-refresh')).toMatchObject({
      docketId: 'starter-refresh',
      capsuleId: 'starter-situation-ai-governance-procurement',
      ownerUid: 'u1',
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      humanReviewRequired: true,
      sourceIds: expect.arrayContaining(['nist-ai-rmf']),
    });
    expect(db.data.get('users/u1/capsules/starter-situation-ai-governance-procurement/graphProjections/graphlite-starter-projection')).toMatchObject({
      projectionId: 'starter-situation-ai-governance-procurement-graphlite-starter-projection',
      provider: 'graphlite',
      capsuleId: 'starter-situation-ai-governance-procurement',
      ownerUid: 'u1',
      status: 'compiled-advisory',
      advisoryOnly: true,
      canonicalStore: 'Firestore ContextCapsules',
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      sourceIds: expect.arrayContaining(['nist-ai-rmf']),
    });
    expect(db.data.has('users/u1/capsules/starter-situation-sudan-darfur-atrocity-access/sources/un-sudan-atrocity-famine-risk')).toBe(true);
    expect(db.data.has('users/u1/capsules/starter-situation-sudan-darfur-atrocity-access/evaluations/starter-readiness')).toBe(true);
    expect(db.data.has('users/u1/capsules/starter-situation-sudan-darfur-atrocity-access/notes/starter-guidance')).toBe(true);
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-tool-sanctions-exposure-triage-matrix')?.starterSnapshot?.deviceProfile?.deviceKind).toBe('sanctions-exposure-triage');
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-situation-corporate-ai-procurement-assurance')?.starterSnapshot?.humanReview?.humanReviewGate).toMatch(/human|review|approval/i);
    expect(capsules.find((capsule) => capsule.capsuleId === 'starter-output-corporate-board-risk-committee-pack')?.starterSnapshot?.tags).toContain('drafting-style');
    expect(db.data.has('users/u1/capsules/starter-tool-sanctions-exposure-triage-matrix/sources/ofac-sanctions-list-service')).toBe(true);
    expect(db.data.has('users/u1/capsules/starter-situation-corporate-ai-procurement-assurance/sources/nist-ai-rmf')).toBe(true);
    expect(db.data.has('users/u1/capsules/starter-output-corporate-board-risk-committee-pack/notes/starter-guidance')).toBe(true);
    const starterAdvisoryMemory = db.data.get('users/u1/capsules/starter-tool-sanctions-exposure-triage-matrix/advisoryMemoryHits/starter-advisory-context') as Record<string, unknown> | undefined;
    expect(starterAdvisoryMemory).toMatchObject({
      capsuleId: 'starter-tool-sanctions-exposure-triage-matrix',
      advisoryOnly: true,
      cogneeMode: 'not-ingested',
      promotionRequired: 'review-card',
      postgresProjection: 'capsule-plus-proposals-only',
      usedMemoryReceiptField: 'usedMemoryItemIds',
      ignoredMemoryReceiptField: 'ignoredMemoryItemIds',
    });
    expect(starterAdvisoryMemory?.memoryUseCases).toEqual(expect.arrayContaining([
      expect.stringMatching(/recall|brief|review|similar/i),
    ]));
    expect(starterAdvisoryMemory?.cogneeRememberPolicy).toMatch(/remember|approved|review/i);
    expect(starterAdvisoryMemory?.cogneeRecallPolicy).toMatch(/advisory|review/i);
    expect(starterAdvisoryMemory?.sqlProjectionTargets).toEqual(expect.arrayContaining([
      'capsule_plus.graph_proposals',
      'capsule_plus.model_mappings',
    ]));
    expect(starterAdvisoryMemory?.realityCheck).toMatch(/real|work|review|decision|expert/i);
    const realWorkStarterAdvisory = db.data.get('users/u1/capsules/starter-situation-red-sea-maritime-logistics-risk/advisoryMemoryHits/starter-advisory-context') as Record<string, unknown> | undefined;
    expect(realWorkStarterAdvisory).toMatchObject({
      capsuleId: 'starter-situation-red-sea-maritime-logistics-risk',
      advisoryOnly: true,
      cogneeMode: 'not-ingested',
      promotionRequired: 'review-card',
    });
    expect(realWorkStarterAdvisory?.sqlProjectionTargets).toEqual(expect.arrayContaining([
      'capsule_plus.graph_proposals',
      'agent_runtime.capsule_read_receipts',
    ]));
    expect(db.data.has('users/u1/capsules/starter-situation-red-sea-maritime-logistics-risk/sources/unctad-trade-development-foresights-2026')).toBe(true);
    expect(db.data.has('users/u1/capsules/starter-user-sanctions-compliance-counsel/sources/ofac-framework-compliance')).toBe(true);
    const currentAffairsAiAct = capsules.find((capsule) => capsule.capsuleId === 'starter-situation-eu-ai-act-2026-implementation-simplification');
    expect(currentAffairsAiAct?.starterSnapshot?.humanReview?.humanReviewGate).toMatch(/human|review|approval/i);
    expect(currentAffairsAiAct?.starterSnapshot?.sourcePack?.some((source) => source.id === 'ec-ai-act-framework')).toBe(true);
    expect(db.data.has('users/u1/capsules/starter-situation-eu-ai-act-2026-implementation-simplification/sources/ec-ai-act-framework')).toBe(true);
    expect(db.data.has('users/u1/capsules/starter-situation-eu-ai-act-2026-implementation-simplification/advisoryMemoryHits/starter-advisory-context')).toBe(true);
    for (const starterId of CAPSULE_WOW_DEMO_STARTER_IDS) {
      const sourceRefreshDocket = db.data.get(`users/u1/capsules/${starterId}/sourceRefreshDockets/wow-demo`);
      expect(sourceRefreshDocket, `${starterId} source refresh docket`).toMatchObject({
        capsuleId: starterId,
        docketId: 'wow-demo',
        catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
        needsRefresh: true,
        humanReviewRequired: true,
      });
      expect((sourceRefreshDocket?.items as unknown[])?.length).toBeGreaterThanOrEqual(2);
      expect(sourceRefreshDocket?.nextRepairActions).toEqual(expect.arrayContaining([
        expect.stringMatching(/refresh|source|gap/i),
      ]));
    }
    const currentAffairsTool = capsules.find((capsule) => capsule.capsuleId === 'starter-tool-legislative-authority-deadline-tracker');
    expect(currentAffairsTool?.starterSnapshot?.deviceProfile?.deviceKind).toBe('legislative-authority-deadline-tracker');
    expect(db.data.has('users/u1/capsules/starter-tool-legislative-authority-deadline-tracker/sources/congress-119-appropriations-source')).toBe(true);

    const resolved = await resolveInjectableContext({ uid: 'u1', capsuleId: 'starter-tool-source-pack-builder' }, deps(db));
    expect(resolved.promptBlock).toContain('[starter_capsule_definition]');
    expect(resolved.promptBlock).toContain('starter_category: tool');
    expect(resolved.promptBlock).toContain('recommended_tools: grounded-research, sourceability, ask-praxis');
    expect(resolved.promptBlock).toContain('source_pack:');
    expect(resolved.promptBlock).toContain('embedded_graph_seed_counts: nodes=');
    expect(resolved.promptBlock).toContain('embedded_graph_seed_sample_nodes:');
    expect(resolved.promptBlock).toContain('embedded_graph_seed_sample_edges:');
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
    expect(result.existing).toBe(CAPSULE_STARTER_DEFINITIONS.length);
    expect(capsule?.label).toBe('Edited diplomatic options capsule');
    expect(capsule?.community.tags).toContain('custom-tag');
    expect(capsule?.community.tags).toContain('type:situation');
    expect(capsule?.community.tags).toContain('domain:diplomacy');
    expect(capsule?.community.tags).toContain('team:diplomatic');
    expect(capsule?.version).toBe(2);
    expect(capsule?.starterSnapshot?.starterId).toBe('starter-situation-diplomatic-options');
  });

  it('backfills old starter snapshots while preserving user edits and detail records', async () => {
    const db = new FakeFirestore();
    await seedStarterCapsules('u1', deps(db));
    const path = 'users/u1/capsules/starter-situation-diplomatic-options';
    const existing = db.data.get(path) ?? {};
    db.data.set(path, {
      ...existing,
      version: 7,
      label: 'Custom diplomatic label',
      archivedAt: '2026-05-13T00:00:00.000Z',
      associatedCapsuleIds: ['user-added-related-capsule'],
      coreRefs: {
        ...((existing.coreRefs ?? {}) as Record<string, unknown>),
        sourceCoreIds: ['user-added-source'],
        documentCoreIds: ['user-added-document'],
      },
      community: {
        ...((existing.community ?? {}) as Record<string, unknown>),
        userRating: 2,
        tags: ['starter', 'situation', 'user-added-tag'],
      },
      starterSnapshot: {
        ...((existing.starterSnapshot ?? {}) as Record<string, unknown>),
        catalogVersion: '2026-05-18-capsule-inspection-v3',
        richProfile: undefined,
      },
    });

    const result = await seedStarterCapsules('u1', deps(db));
    const capsule = await getCapsule('u1', 'starter-situation-diplomatic-options', deps(db));
    const sourceRecords = Array.from(db.data.keys()).filter((key) => key.startsWith(`${path}/sources/`));

    expect(result.created).toBe(0);
    expect(result.existing).toBe(CAPSULE_STARTER_DEFINITIONS.length);
    expect(capsule?.label).toBe('Custom diplomatic label');
    expect(capsule?.archivedAt).toBe('2026-05-13T00:00:00.000Z');
    expect(capsule?.associatedCapsuleIds).toContain('user-added-related-capsule');
    expect(capsule?.coreRefs.sourceCoreIds).toContain('user-added-source');
    expect(capsule?.coreRefs.documentCoreIds).toContain('user-added-document');
    expect(capsule?.community.userRating).toBe(2);
    expect(capsule?.community.tags).toEqual(expect.arrayContaining(['user-added-tag', 'type:situation', 'domain:diplomacy']));
    expect(capsule?.starterSnapshot?.catalogVersion).toBe(CAPSULE_STARTER_CATALOG_VERSION);
    expect(capsule?.starterSnapshot?.richProfile?.decisionPrompts.length).toBeGreaterThanOrEqual(3);
    expect(capsule?.starterSnapshot?.intelligenceProfile?.humanWorkflow.decisionMoment).toMatch(/decision|brief|review|workflow/i);
    expect(capsule?.starterSnapshot?.cogneeProfile?.advisoryOnly).toBe(true);
    expect(capsule?.starterSnapshot?.cogneeProfile?.seedDocuments.every((document) => document.advisoryOnly)).toBe(true);
    expect(capsule?.starterSnapshot?.researchDossier?.sourceSpine.length).toBeGreaterThanOrEqual(4);
    expect(capsule?.starterSnapshot?.claimLedgerSeeds?.missing.length).toBeGreaterThanOrEqual(1);
    expect(capsule?.starterSnapshot?.humanWorkflowExample?.steps.length).toBeGreaterThanOrEqual(3);
    expect(capsule?.starterSnapshot?.sourceRefreshDocket?.docketId).toBe('starter-refresh');
    expect(capsule?.starterSnapshot?.graphLiteProjection?.status).toBe('compiled-advisory');
    expect(capsule?.version).toBe(8);
    expect(db.data.get(`${path}/evaluations/starter-readiness`)?.evidenceRequirements).toEqual(expect.arrayContaining([
      expect.stringContaining('Attach at least one current source'),
    ]));
    expect(db.data.get(`${path}/notes/starter-guidance`)?.body).toEqual(expect.stringContaining('Best next action:'));
    expect(db.data.get(`${path}/advisoryMemoryHits/starter-cognee-seed-pack`)?.advisoryOnly).toBe(true);
    expect(db.data.get(`${path}/advisoryMemoryHits/starter-cognee-seed-pack`)?.promotionRequired).toBe('review-card');
    expect(db.data.get(`${path}/advisoryMemoryHits/starter-cognee-seed-pack`)?.contextCaptureProfileId).toBe('starter-situation-diplomatic-options-context-capture-v1');
    expect(db.data.get(`${path}/researchDossiers/starter-dossier`)?.sourceIds).toEqual(expect.arrayContaining([
      expect.stringMatching(/un-|eeas|praxis|jhu|gpo|plain/i),
    ]));
    expect(db.data.get(`${path}/claimLedgers/starter-claims`)?.missing).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'missing' }),
    ]));
    expect(db.data.get(`${path}/humanWorkflowExamples/starter-workflow`)?.steps).toEqual(expect.arrayContaining([
      expect.stringMatching(/source|review|output|claim/i),
    ]));
    expect(db.data.get(`${path}/sourceRefreshDockets/starter-refresh`)?.nextRepairActions).toEqual(expect.arrayContaining([
      expect.stringMatching(/refresh|source|gap/i),
    ]));
    expect(db.data.get(`${path}/graphProjections/graphlite-starter-projection`)).toMatchObject({
      provider: 'graphlite',
      storageScope: 'owner-workspace-named-graph',
      promotionGate: expect.stringMatching(/human|review|canonical/i),
    });

    await seedStarterCapsules('u1', deps(db));
    const afterSecondRun = await getCapsule('u1', 'starter-situation-diplomatic-options', deps(db));
    const sourceRecordsAfterSecondRun = Array.from(db.data.keys()).filter((key) => key.startsWith(`${path}/sources/`));
    expect(afterSecondRun?.version).toBe(8);
    expect(sourceRecordsAfterSecondRun).toEqual(sourceRecords);
  });

  it('backfills intellectual-device profiles without overwriting user-authored state', async () => {
    const db = new FakeFirestore();
    await seedStarterCapsules('u1', deps(db));
    const path = 'users/u1/capsules/starter-tool-assumption-stress-test';
    const existing = db.data.get(path) ?? {};
    db.data.set(path, {
      ...existing,
      version: 4,
      label: 'Custom stress-test label',
      lockedCoreKinds: ['tool'],
      trust: {
        ...((existing.trust ?? {}) as Record<string, unknown>),
        level: 'red',
        score: 41,
        label: 'User review pending',
      },
      starterSnapshot: {
        ...((existing.starterSnapshot ?? {}) as Record<string, unknown>),
        catalogVersion: '2026-05-19-capsule-depth-v4',
        deviceProfile: undefined,
        intelligenceProfile: undefined,
        cogneeProfile: undefined,
      },
    });

    await seedStarterCapsules('u1', deps(db));
    const capsule = await getCapsule('u1', 'starter-tool-assumption-stress-test', deps(db));

    expect(capsule?.label).toBe('Custom stress-test label');
    expect(capsule?.lockedCoreKinds).toContain('tool');
    expect(capsule?.trust.label).toBe('User review pending');
    expect(capsule?.starterSnapshot?.deviceProfile?.methodSteps.length).toBeGreaterThanOrEqual(4);
    expect(capsule?.starterSnapshot?.deviceProfile?.humanReviewGate).toMatch(/review|approval|human/i);
    expect(capsule?.starterSnapshot?.intelligenceProfile?.reasoningScaffold.steps.length).toBeGreaterThanOrEqual(4);
    expect(capsule?.starterSnapshot?.cogneeProfile?.datasetScope).toBe('owner-capsule');
    expect(capsule?.version).toBe(5);
  });

  it('promotes Ask source gaps into review-gated capsule repository notes', async () => {
    const db = new FakeFirestore();
    await seedStarterCapsules('u1', deps(db));

    const result = await promoteCapsuleSourceGaps('u1', 'starter-situation-diplomatic-options', {
      gaps: [
        'Need a current opposition negotiating position before drafting external options.',
        'Need a current opposition negotiating position before drafting external options.',
        'Confirm the latest mediator mandate date with a primary source.',
      ],
      sourceIds: ['ask-source-1'],
      runId: 'run-123',
      generatedBy: 'ask-praxis',
    }, deps(db));

    expect(result?.reviewRequired).toBe(true);
    expect(result?.proposals).toHaveLength(2);
    expect(result?.proposals.every((proposal) => proposal.reviewStatus === 'proposed')).toBe(true);
    expect(result?.proposals.every((proposal) => proposal.target === 'sourcePack')).toBe(true);
    const proposal = result!.proposals[0];
    const notePath = `users/u1/capsules/starter-situation-diplomatic-options/notes/${proposal.proposalId}`;
    const note = db.data.get(notePath);
    expect(note?.type).toBe('gap');
    expect(note?.reviewStatus).toBe('proposed');
    expect(note?.body).toEqual(expect.stringContaining('proposed source-pack update'));
    expect((note?.links as { sourceIds: string[]; runId: string }).runId).toBe('run-123');
    expect((note?.links as { sourceIds: string[] }).sourceIds).toContain('ask-source-1');
    expect(result?.capsule.trust.level).toBe('amber');
    expect(result?.capsule.trust.recommendations).toContain('Review proposed source-pack gaps before the next external handoff.');
  });

  it('turns intake source, table, graph, memory, and artifact candidates into review cards without applying them', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', {
      capsuleId: 'cap-intake',
      label: 'Intake capsule',
      coreRefs: { situationCoreId: 'sit-1', sourceCoreIds: ['src-existing'] },
    }, deps(db));

    const result = await createCapsuleIntakeReviewCards('u1', 'cap-intake', {
      sourceLane: 'official',
      jurisdiction: 'UN',
      outputTarget: 'policy-memo',
      sourceGaps: ['Need a second dated access source.'],
      graphCandidateHints: ['Actor relation candidate: mediator -> access guarantee'],
      memoryWritebackCandidates: ['Remember that access status must be caveated by date.'],
      tableExtractionCandidates: ['Extract access constraints table.'],
      artifactLinks: [{ artifactId: 'memo-1', kind: 'memo', title: 'Draft memo', href: '/app/write?memoId=memo-1' }],
      attachments: [{
        attachmentId: 'doc-1',
        attachmentType: 'pdf',
        title: 'Access update',
        originalUri: 'gs://bucket/access.pdf',
        extractionStatus: 'parsed',
        documentId: 'doc-1',
        sourceReceiptId: 'src-1',
        hasTables: true,
      }],
    }, deps(db));

    expect(result?.reviewRequired).toBe(true);
    expect(result?.intake.reviewGate).toBe('human_review');
    expect(result?.proposals.map((proposal) => proposal.type)).toEqual([
      'source-gap',
      'graph-candidate',
      'memory-writeback',
      'table-extraction',
      'artifact-link',
    ]);
    expect(result?.cards).toHaveLength(5);
    expect(result?.cards.every((card) => card.state === 'proposed')).toBe(true);
    expect(result?.cards.map((card) => card.target)).toEqual(expect.arrayContaining([
      'sourceGap',
      'graphProposal',
      'advisoryMemory',
      'tableCandidate',
      'artifactLink',
    ]));
    expect(db.data.get('users/u1/capsules/cap-intake')?.latestGateState).toBe('proposed');
    expect((db.data.get('users/u1/capsules/cap-intake')?.coreRefs as { sourceCoreIds: string[] }).sourceCoreIds).toEqual(['src-existing']);
    const cardPath = `users/u1/capsules/cap-intake/reviewCards/${result!.cards[0].reviewCardId}`;
    expect(db.data.get(cardPath)?.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ advisory: true }),
    ]));
  });

  it('keeps v3 review-card targets service-compatible without promoting canonical writes', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', {
      capsuleId: 'cap-v3',
      label: 'V3 capsule',
      coreRefs: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['src-1'],
        outputCoreIds: ['memo'],
      },
    }, deps(db));

    const v3 = buildContextCapsuleV3(capsule);
    expect(v3.schemaVersion).toBe(3);
    expect(v3.governance.canonicalStore).toBe('Firestore ContextCapsules');
    expect(v3.governance.agentsMayMutateCanonical).toBe(false);

    const claimCard = await createCapsuleReviewCard('u1', capsule.capsuleId, {
      title: 'Claim ledger review',
      sourceType: 'agent',
      target: 'claimLedger',
      evidence: [{ id: 'claim-1', label: 'Weak claim', advisory: true }],
    }, deps(db));
    const instructionCard = await createCapsuleReviewCard('u1', capsule.capsuleId, {
      title: 'Agent instruction review',
      sourceType: 'agent',
      target: 'agentInstructions',
      evidence: [{ id: 'agent-contract', label: 'Stop condition', advisory: true }],
    }, deps(db));

    expect(claimCard.target).toBe('claimLedger');
    expect(instructionCard.target).toBe('agentInstructions');
    expect(claimCard.proposedEnvelopePatch).toEqual({});
    expect(db.data.get('users/u1/capsules/cap-v3')?.version).toBe(1);
  });

  it('normalizes v1 capsules into compact v3 envelopes without carrying append-heavy payloads', () => {
    const normalized = sanitizeCapsule({
      schemaVersion: 1,
      capsuleId: 'cap-v1',
      ownerUid: 'u1',
      label: 'Legacy capsule',
      version: 4,
      coreRefs: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['src-1'],
        graphCoreId: 'graph-1',
      },
      proposalQueue: [{ id: 'too-large' }],
      graphProposals: [{ id: 'graph-large' }],
      advisoryMemoryHits: [{ id: 'mem-large' }],
      ontologyHistory: [{ id: 'history-large' }],
    });

    expect(normalized.schemaVersion).toBe(3);
    expect(normalized.v3?.schemaVersion).toBe(3);
    expect(normalized.version).toBe(4);
    expect(normalized.coreRefs.sourceCoreIds).toEqual(['src-1']);
    expect(normalized.activeOntologyStackId).toBe('ontology-stack-default');
    expect(normalized.activeReadContractId).toBe('read-contract-default');
    expect(normalized.readinessSummary).toMatchObject({
      sourceBacked: true,
      graphLinked: true,
      reviewRequired: false,
    });
    expect(Object.prototype.hasOwnProperty.call(normalized, 'proposalQueue')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(normalized, 'graphProposals')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(normalized, 'advisoryMemoryHits')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(normalized, 'ontologyHistory')).toBe(false);
  });

  it('keeps review-card proposals in a subcollection and requires explicit apply metadata', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', { capsuleId: 'cap-review', label: 'Review card capsule' }, deps(db));
    const card = await createCapsuleReviewCard('u1', capsule.capsuleId, {
      title: 'Clarify source posture',
      sourceType: 'source-gap',
      state: 'owner_review',
      target: 'capsuleEnvelope',
      proposedEnvelopePatch: {
        summary: 'Source posture clarified after review.',
        latestGateState: 'owner_review',
      },
      evidence: [{ id: 'gap-1', label: 'Gap record', advisory: true }],
    }, deps(db));

    expect(card.state).toBe('owner_review');
    expect(card.evidence.every((item) => item.advisory)).toBe(true);
    expect(db.data.has(`users/u1/capsules/cap-review/reviewCards/${card.reviewCardId}`)).toBe(true);
    await expect(applyCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, {
      reviewerUid: 'reviewer-1',
      targetVersion: capsule.version + 1,
      diffHash: 'diff:clarify',
    }, deps(db))).rejects.toThrow(/confirmation reason/i);

    const applied = await applyCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, {
      reviewerUid: 'reviewer-1',
      appliedAt: '2026-05-14T01:00:00.000Z',
      targetVersion: capsule.version + 1,
      diffHash: 'diff:clarify',
      confirmationReason: 'Owner accepted the source posture clarification.',
    }, deps(db));

    expect(applied?.card.state).toBe('applied');
    expect(applied?.capsule.summary).toBe('Source posture clarified after review.');
    expect(applied?.capsule.latestGateState).toBe('owner_review');
    expect(applied?.capsule.version).toBe(2);
    expect(db.data.get(`users/u1/capsules/cap-review/reviewCards/${card.reviewCardId}`)?.applyMetadata).toMatchObject({
      reviewerUid: 'reviewer-1',
      confirmationReason: 'Owner accepted the source posture clarification.',
    });
  });

  it('applies user feedback learning review cards with a version bump', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', { capsuleId: 'cap-feedback-learning', label: 'Feedback learning capsule' }, deps(db));
    const cardInput = buildUserFeedbackLearningReviewCardInput(capsule, {
      situationId: 'sit-1',
      toolId: 'ask-praxis',
      answerId: 'answer-1',
      confidence: 1,
      issues: ['inaccurate'],
      suggestion: 'The corridor is closed; keep this as disputed until the next UN access bulletin.',
      createdAt: '2026-06-01T10:00:00.000Z',
    });
    const card = await createCapsuleReviewCard('u1', capsule.capsuleId, cardInput, deps(db));

    expect(card.sourceType).toBe('user');
    expect(card.state).toBe('owner_review');

    const applied = await applyCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, {
      reviewerUid: 'reviewer-1',
      diffHash: 'diff:feedback-learning',
      confirmationReason: 'Owner approved the feedback correction as a capsule learning patch.',
    }, deps(db));

    expect(applied?.capsule.version).toBe(capsule.version + 1);
    expect(applied?.capsule.claimLedger).toEqual(expect.arrayContaining([
      expect.objectContaining({
        support: 'disputed',
        text: expect.stringMatching(/corridor is closed/i),
      }),
    ]));
    expect(applied?.card.applyMetadata).toMatchObject({
      targetVersion: capsule.version + 1,
      reviewerUid: 'reviewer-1',
    });
  });

  it('runs document learning as an authenticated review-card worker', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', { capsuleId: 'cap-document-learning', label: 'Document learning capsule' }, deps(db));

    await expect(proposeCapsuleDocumentLearningReviewCards('u1', capsule.capsuleId, {
      auth: {},
      document: {
        documentId: 'doc-1',
        title: 'UN access bulletin',
        claims: [{ text: 'The corridor remains closed.', sourceId: 'src-1' }],
        sources: [{ sourceId: 'src-1', label: 'UN access bulletin' }],
      },
    }, deps(db))).rejects.toThrow(/requires/i);

    const result = await proposeCapsuleDocumentLearningReviewCards('u1', capsule.capsuleId, {
      auth: {
        authorizationHeader: 'Bearer secret-1234567890',
        cronSecret: 'secret-1234567890',
      },
      document: {
        documentId: 'doc-1',
        title: 'UN access bulletin',
        claims: [{ text: 'The corridor remains closed.', sourceId: 'src-1' }],
        sources: [{ sourceId: 'src-1', label: 'UN access bulletin' }],
        graphProposals: ['Constraint -> blocks -> Relief access'],
      },
    }, deps(db));

    expect(result.cards.map((card) => card.target)).toEqual(['claimLedger', 'graphProposal']);
    expect(db.data.has(`users/u1/capsules/${capsule.capsuleId}/reviewCards/${result.cards[0]?.reviewCardId}`)).toBe(true);
    expect(db.data.get(`users/u1/capsules/${capsule.capsuleId}`)?.latestGateState).toBe('owner_review');
  });

  it('writes dependency invalidation notes to dependent capsules after claim/source review-card apply', async () => {
    const db = new FakeFirestore();
    const source = await createCapsule('u1', { capsuleId: 'source-cap', label: 'Source capsule' }, deps(db));
    await createCapsule('u1', {
      capsuleId: 'dependent-cap',
      label: 'Dependent capsule',
      associatedCapsuleIds: ['source-cap'],
    }, deps(db));
    const card = await createCapsuleReviewCard('u1', source.capsuleId, {
      title: 'Add sourced claim',
      sourceType: 'agent',
      target: 'claimLedger',
      proposedEnvelopePatch: {
        claimLedger: [{ claimId: 'claim-1', text: 'New claim', support: 'supported', sourceRefIds: ['src-1'] }],
      },
    }, deps(db));

    await applyCapsuleReviewCard('u1', source.capsuleId, card.reviewCardId, {
      reviewerUid: 'reviewer-1',
      diffHash: 'diff:claim',
      confirmationReason: 'Owner approved the sourced claim.',
    }, deps(db));

    const notes = Array.from(db.data.entries()).filter(([path]) => path.startsWith('users/u1/capsules/dependent-cap/notes/dependency-invalidation-'));
    expect(notes).toHaveLength(1);
    expect(notes[0]?.[1]).toMatchObject({
      type: 'dependencyInvalidation',
      sourceCapsuleId: 'source-cap',
      reviewCardId: card.reviewCardId,
    });
  });

  it('turns Cognee seed packs and advisory candidates into review-gated capsule memory updates', async () => {
    const db = new FakeFirestore();
    const seeded = await seedStarterCapsules('u1', deps(db));
    const starter = seeded.capsules.find((item) => item.capsuleId === 'starter-situation-us-federal-ai-governance-baseline');
    expect(starter).toBeTruthy();
    if (!starter) throw new Error('starter fixture missing');

    const seed = await proposeCogneeSeedReviewCards('u1', starter.capsuleId, deps(db));
    expect(seed?.cards[0]).toMatchObject({
      sourceType: 'cognee',
      target: 'advisoryMemory',
      state: 'proposed',
    });

    const approved = await approveAdvisoryMemoryCandidate('u1', starter.capsuleId, {
      id: 'candidate-1',
      text: 'Procurement role classification needs counsel review.',
      confidence: 0.91,
      provenance: 'source-1',
    }, deps(db));

    expect(approved?.card.state).toBe('applied');
    expect(approved?.capsule.v3?.memoryPosture.canonicalCapsuleFacts.join('\n')).toContain('confidence 0.600');
    expect(approved?.capsule.v3?.memoryPosture.cogneeMode).toBe('advisory-only');
    expect(approved?.capsule.v3?.memoryPosture.graphProposals.join(' ')).not.toMatch(/candidate-1/);

    const rejected = await rejectAdvisoryMemoryCandidate('u1', starter.capsuleId, {
      id: 'candidate-2',
      text: 'Unsupported claim',
      reason: 'No provenance.',
    }, deps(db));
    expect(rejected?.card.state).toBe('rejected');
    expect(db.data.has(`users/u1/capsules/${starter.capsuleId}/reviewCards/${rejected?.card.reviewCardId}`)).toBe(true);
  });

  it('renders advisory Cognee recall as explicitly non-canonical prompt context', async () => {
    const capsule = sanitizeCapsule({
      capsuleId: 'cap-advisory',
      ownerUid: 'u1',
      memoryPosture: {
        advisoryCogneeRecall: ['Candidate memory requiring review.'],
        cogneeMode: 'advisory-only',
      },
    });

    const block = buildCapsulePromptBlock(capsule);
    expect(block).toContain('[advisory_memory_non_canonical]');
    expect(block).toContain('NOT canonical until a review card is applied');
    expect(block).toContain('Candidate memory requiring review.');
  });

  it('aggregates capsule read receipt usage and nudges readiness on degraded runtime signals', async () => {
    const db = new FakeFirestore();
    const seeded = await seedStarterCapsules('u1', deps(db));
    const capsule = seeded.capsules.find((item) => item.capsuleId === 'starter-situation-us-federal-ai-governance-baseline');
    expect(capsule).toBeTruthy();
    if (!capsule) throw new Error('starter fixture missing');
    const baseQuality = deriveCapsuleQuality(capsule).score;

    const first = await recordCapsuleReadReceiptUsage('u1', capsule.capsuleId, {
      readAt: '2026-05-14T01:00:00.000Z',
      thinFallback: false,
      droppedCoreIds: [],
      staleCoreIds: [],
    }, deps(db));
    const degraded = await recordCapsuleReadReceiptUsage('u1', capsule.capsuleId, {
      readAt: '2026-05-14T02:00:00.000Z',
      thinFallback: true,
      droppedCoreIds: ['source:src-1'],
      staleCoreIds: ['source:src-1'],
    }, deps(db));

    expect(first?.usage.readCount).toBe(1);
    expect(degraded?.usage).toMatchObject({
      readCount: 2,
      thinFallbackCount: 1,
      droppedCoreEventCount: 1,
      staleCoreHitCount: 1,
      fallbackRate: 0.5,
      droppedCoreRate: 0.5,
      staleCoreRate: 0.5,
    });
    expect(degraded?.usage.droppedCoreFrequency['source:src-1']).toBe(1);
    expect(deriveCapsuleQuality(degraded?.capsule).score).toBeLessThan(baseQuality);
    expect(db.data.get(`users/u1/capsules/${capsule.capsuleId}`)?.usage).toMatchObject({ readCount: 2 });
  });

  it('requires a public proposal flag and moderation state before owner review', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-public' }, deps(db));

    await expect(createCapsuleReviewCard('u1', 'cap-public', {
      title: 'Public source suggestion',
      sourceType: 'public',
      target: 'sourceGap',
      evidence: [{ id: 'pub-src-1', label: 'Public suggestion', advisory: true }],
    }, deps(db))).rejects.toThrow(/public capsule proposals are not enabled/i);

    const publicCard = await createCapsuleReviewCard('u1', 'cap-public', {
      title: 'Public source suggestion',
      sourceType: 'public',
      target: 'sourceGap',
      publicProposalsEnabled: true,
      evidence: [{ id: 'pub-src-1', label: 'Public suggestion', advisory: true }],
    }, deps(db));

    expect(publicCard.state).toBe('moderation_required');
  });

  it('records ontology diagnostics for dangling refs during review-card apply', async () => {
    const db = new FakeFirestore();
    db.data.set('users/u1/ontologyStacks/ontology-stack-default', { stackId: 'ontology-stack-default' });
    db.data.set('ontologyDocs/domain:known', { ontologyId: 'domain:known' });
    const capsule = await createCapsule('u1', { capsuleId: 'cap-ontology-apply' }, deps(db));

    const validation = await validateOntologyStack('u1', {
      stackId: 'ontology-stack-default',
      ontologyIds: ['domain:known'],
    }, deps(db));
    expect(validation.diagnostics).toEqual([]);

    const card = await createCapsuleReviewCard('u1', capsule.capsuleId, {
      title: 'Review ontology suggestion',
      sourceType: 'agent',
      target: 'ontologyStack',
      evidence: [
        { id: 'domain:known', label: 'Known ontology', advisory: true },
        { id: 'domain:missing', label: 'Missing ontology', advisory: true },
      ],
    }, deps(db));

    await applyCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, {
      reviewerUid: 'reviewer-1',
      diffHash: 'diff:ontology',
      confirmationReason: 'Owner approved ontology review diagnostics.',
    }, deps(db));

    const notes = Array.from(db.data.entries()).filter(([path]) => path.startsWith('users/u1/capsules/cap-ontology-apply/notes/ontology-diagnostic-'));
    expect(notes).toHaveLength(1);
    expect(notes[0]?.[1]).toMatchObject({
      type: 'ontologyDiagnostics',
      reviewCardId: card.reviewCardId,
      diagnostics: [
        {
          code: 'dangling_ontology_ref',
          ref: 'domain:missing',
        },
      ],
    });
  });

  it('resolves a capped ontology stack with candidate and rejection history', () => {
    const resolution = resolveCapsuleOntologyStack({
      capsuleId: 'cap-ontology',
      primaryDomainOntologyId: 'domain:humanitarian-rights',
      secondaryDomainOntologyId: 'domain:diplomacy',
      workOntologyId: 'work:sourceability-review',
      candidateSuggestions: [
        { ontologyId: 'domain:humanitarian-rights', label: 'Humanitarian rights', evidenceIds: ['src-1'] },
        { ontologyId: 'domain:diplomacy', label: 'Diplomacy', evidenceIds: ['src-2'] },
        { ontologyId: 'domain:finance', label: 'Finance', evidenceIds: ['src-3'] },
      ],
      rejectedSuggestions: [{ ontologyId: 'domain:legacy', reason: 'Old stack', rejectedAt: '2026-05-13T00:00:00.000Z' }],
      resolvedAt: '2026-05-14T00:00:00.000Z',
    });

    expect(resolution.activeOntologyIds).toEqual([
      'aco:base',
      'domain:humanitarian-rights',
      'domain:diplomacy',
      'work:sourceability-review',
    ]);
    expect(resolution.validation.maxActiveCaseOntologies).toBe(3);
    expect(resolution.validation.activeCaseOntologyCount).toBe(3);
    expect(resolution.validation.shaclStatus).toBe('valid');
    expect(resolution.rejectedSuggestions.map((item) => item.ontologyId)).toEqual(expect.arrayContaining([
      'domain:finance',
      'domain:legacy',
    ]));
  });

  it('surfaces off-ontology graph entity types as candidate-extension review cards', async () => {
    const db = new FakeFirestore();
    const starter = CAPSULE_STARTER_DEFINITIONS[0];
    const capsule = await createCapsule('u1', {
      capsuleId: 'cap-ontology-write',
      label: 'Ontology write capsule',
      starterSnapshot: {
        ...starter,
        catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      },
    }, deps(db));

    const card = await proposeCapsuleGraphNodeChange('u1', capsule.capsuleId, {
      operation: 'create',
      node: {
        id: 'field-mandate-risk',
        label: 'Field mandate risk',
        entityType: 'field_mandate_risk',
      },
      sourceReceiptIds: ['src-1'],
      reason: 'Analysts need a local subtype before graph promotion.',
    }, deps(db));

    expect(card.target).toBe('ontologyStack');
    expect(card.sourceType).toBe('ontology');
    expect(card.title).toMatch(/candidate ontology extension/i);
    expect(card.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'src-1', sourceType: 'source' }),
    ]));
    expect(db.data.has(`users/u1/capsules/${capsule.capsuleId}/reviewCards/${card.reviewCardId}`)).toBe(true);
  });

  it('applies approved capsule graph proposals into the embedded graph projection', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', {
      capsuleId: 'cap-graph-apply',
      label: 'Graph apply capsule',
      coreRefs: { sourceCoreIds: ['src-1'] },
    }, deps(db));
    const card = await proposeCapsuleGraphNodeChange('u1', capsule.capsuleId, {
      operation: 'create',
      node: {
        id: 'actor-ministry',
        label: 'Ministry',
        entityType: 'Actor',
        confidence: 0.74,
        sourceReceiptIds: ['src-1'],
      },
      reason: 'Promote reviewed actor into the capsule embedded graph.',
    }, deps(db));

    const applied = await applyCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, {
      reviewerUid: 'reviewer-1',
      diffHash: 'diff:graph:actor-ministry',
      confirmationReason: 'Owner approved the actor node as canonical capsule graph context.',
    }, deps(db));

    expect(applied?.card.state).toBe('applied');
    expect(applied?.capsule.version).toBe(capsule.version + 1);
    expect(applied?.capsule.embeddedGraph).toMatchObject({
      provider: 'graphlite',
      canonicalStore: 'Firestore ContextCapsules',
      advisoryOnly: true,
      nodes: expect.arrayContaining([
        expect.objectContaining({
          id: 'actor-ministry',
          label: 'Ministry',
          entityType: 'Actor',
          reviewState: 'reviewed',
          sourceReceiptIds: ['src-1'],
        }),
      ]),
    });
    expect(applied?.capsule.v3?.grounding.embeddedGraph.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'actor-ministry', label: 'Ministry', reviewState: 'reviewed' }),
    ]));
    expect(applied?.capsule.readinessSummary?.graphLinked).toBe(true);
  });

  it('gates capsule-local ontology extension promotion behind ADMIN_ALLOWLIST and writes a version snapshot', async () => {
    const db = new FakeFirestore();
    const previousAllowlist = process.env.ADMIN_ALLOWLIST;
    process.env.ADMIN_ALLOWLIST = 'admin-1';
    try {
      const starter = CAPSULE_STARTER_DEFINITIONS[0];
      const capsule = await createCapsule('u1', {
        capsuleId: 'cap-local-ontology',
        label: 'Local ontology capsule',
        starterSnapshot: {
          ...starter,
          catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
          contextCaptureProfile: {
            ...starter.contextCaptureProfile,
            ontologyBinding: {
              ...starter.contextCaptureProfile.ontologyBinding,
              localExtensions: [{
                extensionId: 'field-mandate-risk',
                kind: 'entity',
                subtypeId: 'field_mandate_risk',
                label: 'Field Mandate Risk',
                primitive: 'Constraint',
                description: 'A local subtype for mandate fragility in field teams.',
                status: 'approved-local',
                evidenceIds: ['src-1'],
                createdAt: '2026-05-14T00:00:00.000Z',
              }],
            },
          },
        },
      }, deps(db));
      db.data.set('acoExtensions/field-mandate-risk', {
        extensionId: 'field-mandate-risk',
        kind: 'entity',
        subtypeId: 'field_mandate_risk',
        label: 'Old Field Mandate Risk',
        primitive: 'Constraint',
        status: 'promoted',
        version: 1,
      });

      await expect(promoteCapsuleOntologyExtensionToGlobalAco('u1', capsule.capsuleId, 'field-mandate-risk', {
        uid: 'not-admin',
      }, deps(db))).rejects.toThrow(/ADMIN_ALLOWLIST/i);

      const result = await promoteCapsuleOntologyExtensionToGlobalAco('u1', capsule.capsuleId, 'field-mandate-risk', {
        uid: 'admin-1',
      }, deps(db));

      expect(result?.extension).toMatchObject({
        extensionId: 'field-mandate-risk',
        label: 'Field Mandate Risk',
        status: 'promoted',
        version: 2,
        promotedBy: 'admin-1',
      });
      expect(db.data.get('acoExtensionsHistory/field-mandate-risk_1')).toMatchObject({
        label: 'Old Field Mandate Risk',
        version: 1,
      });
      expect(db.data.get('acoExtensions/field-mandate-risk')).toMatchObject({
        label: 'Field Mandate Risk',
        version: 2,
      });
    } finally {
      if (previousAllowlist === undefined) delete process.env.ADMIN_ALLOWLIST;
      else process.env.ADMIN_ALLOWLIST = previousAllowlist;
    }
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
  constructor(private db: FakeFirestore, private path: string, private maxDocs?: number) {}

  doc(id = `doc-${this.db.data.size + 1}`) {
    return new FakeDoc(this.db, `${this.path}/${id}`, id);
  }

  limit(maxDocs: number) {
    return new FakeCollection(this.db, this.path, maxDocs);
  }

  orderBy() {
    return this;
  }

  async get() {
    const prefix = `${this.path}/`;
    const docs = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, value]) => new FakeSnapshot(true, value, path.split('/').pop() ?? 'unknown'));
    return { docs: typeof this.maxDocs === 'number' ? docs.slice(0, this.maxDocs) : docs };
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
