import { describe, expect, it } from 'vitest';
import { bumpCapsuleVersion, createCapsule, sanitizeCapsule } from '@/lib/context/capsule-service';
import { buildCapsulePromptBlock, resolveInjectableContext } from '@/lib/context/context-injection';
import { CapsuleBuilderDraftSchema, saveCapsuleBuilderDraft } from '@/lib/context/capsule-builder-draft';

describe('canonical capsule builder author instructions', () => {
  const authorInput = (overrides: Record<string, unknown> = {}) => CapsuleBuilderDraftSchema.parse({
    action: 'save-builder-draft', capsuleId: 'saved-author-draft',
    purpose: 'Compare transit alternatives for the synthetic committee exercise.',
    systemFrame: 'Use an options table and flag unsupported claims.', outputFormat: 'json',
    responseJsonSchema: { type: 'object', properties: { recommendation: { type: 'string' } } },
    propertyOrdering: ['recommendation'], ...overrides,
  });

  it('saves a private canonical capsule that a later Ask resolves without falling back to default', async () => {
    const db = new FakeFirestore();
    const deps = { service: { db: db as never } };
    const saved = await saveCapsuleBuilderDraft('owner', authorInput(), deps);
    const resolved = await resolveInjectableContext({ uid: 'owner', capsuleId: saved.capsule.capsuleId }, deps.service);

    expect(saved.created).toBe(true);
    expect(saved.capsule.access.visibility).toBe('private');
    expect(saved.capsule.claimLedger).toBeUndefined();
    expect(saved.capsule.embeddedGraph).toBeUndefined();
    expect(resolved.capsule.capsuleId).toBe('saved-author-draft');
    expect(resolved.promptBlock).toContain('Compare transit alternatives for the synthetic committee exercise.');
    expect(resolved.promptBlock).toContain('Use an options table and flag unsupported claims.');
    expect(resolved.promptBlock).toContain('output_format: json');
    expect(resolved.promptBlock).toContain('recommendation');
    expect(db.data.has('capsules/saved-author-draft')).toBe(false);

    const retry = await saveCapsuleBuilderDraft('owner', authorInput(), deps);
    expect(retry.created).toBe(false);
    expect(retry.capsule.version).toBe(saved.capsule.version);
  });

  it('updates an architect capsule without replacing its evidence, gates, review decisions or previous author metadata', async () => {
    const db = new FakeFirestore();
    const service = { db: db as never };
    const existing = await createCapsule('owner', {
      capsuleId: 'saved-author-draft', coreRefs: { situationCoreId: 'case', documentCoreIds: ['Source_Original'] },
      sourceRefs: [{ sourceId: 'original', label: 'Previously reviewed' }],
      latestGateState: 'applied', memoryPosture: { originalReviewerNote: 'Keep the source caveat.' },
      outputContracts: [{ outputId: 'reviewed-output', label: 'Original brief', artifactType: 'brief', reviewRequired: true, citationRequired: true }],
    }, service);
    db.data.set('users/owner/capsules/saved-author-draft/reviewCards/reviewed-card', { state: 'applied', applyMetadata: { reviewerUid: 'owner' } });
    const saved = await saveCapsuleBuilderDraft('owner', authorInput(), { service });

    expect(saved.capsule.coreRefs).toEqual(existing.coreRefs);
    expect(saved.capsule.sourceRefs).toEqual(existing.sourceRefs);
    expect(saved.capsule.latestGateState).toBe('applied');
    expect(saved.capsule.memoryPosture).toMatchObject({ originalReviewerNote: 'Keep the source caveat.' });
    expect(saved.capsule.outputContracts).toMatchObject([{ outputId: 'reviewed-output' }, { outputId: 'builder-output' }]);
    expect(db.data.get('users/owner/capsules/saved-author-draft/reviewCards/reviewed-card')).toEqual({ state: 'applied', applyMetadata: { reviewerUid: 'owner' } });
  });

  it('verifies owner-scoped source receipts and appends them without replacing existing source references', async () => {
    const db = new FakeFirestore();
    const service = { db: db as never };
    await createCapsule('owner', { capsuleId: 'saved-author-draft', coreRefs: { situationCoreId: 'case', documentCoreIds: ['Source_Original'] } }, service);
    const input = authorInput({ situationId: 'case', documentIds: ['Source_New'] });
    const saved = await saveCapsuleBuilderDraft('owner', input, {
      service,
      readDocument: async (uid, situationId, documentId) => {
        expect([uid, situationId, documentId]).toEqual(['owner', 'case', 'Source_New']);
        return { id: documentId, ownerUid: uid } as never;
      },
    });
    expect(saved.capsule.coreRefs.documentCoreIds).toEqual(['Source_Original', 'Source_New']);
    expect(saved.capsule.coreRefs.situationCoreId).toBe('case');
  });

  it('rejects missing or foreign document receipts before writing a draft', async () => {
    for (const document of [null, { id: 'Source_New', ownerUid: 'other-user' }]) {
      const db = new FakeFirestore();
      await expect(saveCapsuleBuilderDraft('owner', authorInput({ situationId: 'case', documentIds: ['Source_New'] }), {
        service: { db: db as never }, readDocument: async () => document as never,
      })).rejects.toMatchObject({ status: 404 });
      expect(db.data.size).toBe(0);
    }
  });

  it('rejects archived targets and cross-workspace evidence instead of silently replacing their state', async () => {
    const db = new FakeFirestore();
    const service = { db: db as never };
    await createCapsule('owner', { capsuleId: 'saved-author-draft', coreRefs: { situationCoreId: 'original-case' } }, service);
    await expect(saveCapsuleBuilderDraft('owner', authorInput({ situationId: 'other-case', documentIds: ['new-source'] }), { service }))
      .rejects.toMatchObject({ status: 409 });
    const path = 'users/owner/capsules/saved-author-draft';
    const archived = { ...db.data.get(path)!, archivedAt: '2026-09-29T00:00:00Z' };
    db.data.set(path, archived);
    await expect(saveCapsuleBuilderDraft('owner', authorInput(), { service })).rejects.toMatchObject({ status: 409 });
    expect(db.data.get(path)).toEqual(archived);
  });

  it('persists author purpose and output while retaining reviewed facts and document references', async () => {
    const db = new FakeFirestore();
    const deps = { db: db as never };
    const initial = await createCapsule('owner', {
      capsuleId: 'builder-capsule', label: 'Reviewed case',
      coreRefs: { situationCoreId: 'evidence-case', documentCoreIds: ['Source_AbC'] },
      sourceRefs: [{ sourceId: 'reviewed-source', label: 'Reviewed original' }],
      latestGateState: 'applied',
    }, deps);
    const changed = await bumpCapsuleVersion('owner', initial.capsuleId, {
      outputContracts: [{ outputId: 'builder-output', label: 'JSON recommendation', artifactType: 'other', citationRequired: true, reviewRequired: true }],
      memoryPosture: { builderDraft: { purpose: 'Compare the transit options for the committee.', outputFormat: 'json' } },
    }, deps);

    expect(changed?.outputContracts).toMatchObject([{ label: 'JSON recommendation' }]);
    expect(changed?.memoryPosture).toMatchObject({ builderDraft: { purpose: 'Compare the transit options for the committee.' } });
    expect(changed?.coreRefs).toEqual(initial.coreRefs);
    expect(changed?.sourceRefs).toEqual(initial.sourceRefs);
    expect(changed?.latestGateState).toBe('applied');
    const resolved = await resolveInjectableContext({ uid: 'owner', capsuleId: initial.capsuleId }, deps);
    expect(resolved.promptBlock).toContain('Compare the transit options for the committee.');
    expect(resolved.promptBlock).toContain('output_format: json');
  });

  it('labels saved author instructions as preferences rather than verified evidence and bounds prompt size', () => {
    const capsule = sanitizeCapsule({ capsuleId: 'draft', ownerUid: 'owner',
      memoryPosture: { builderDraft: {
        purpose: 'Synthetic committee exercise.', outputFormat: 'brief',
        systemFrame: 'Use scenario assumptions, which have not been verified. '.repeat(500),
      } },
    });
    const prompt = buildCapsulePromptBlock(capsule);
    expect(prompt).toContain('Synthetic committee exercise.');
    expect(prompt).toContain('author-supplied working preferences');
    expect(prompt).toContain('not independently verified evidence');
    expect(prompt.length).toBeLessThan(20000);
  });
});

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();
  sequence = 0;
  collection(path: string) { return new FakeCollection(this, path); }
  batch() {
    const writes: Array<() => Promise<void>> = [];
    return {
      set: (ref: FakeDoc, value: Record<string, unknown>, options?: { merge?: boolean }) => { writes.push(() => ref.set(value, options)); },
      commit: async () => { for (const write of writes) await write(); },
    };
  }
}
class FakeCollection {
  constructor(private db: FakeFirestore, private path: string) {}
  doc(id?: string) { const key = id ?? `document-${++this.db.sequence}`; return new FakeDoc(this.db, `${this.path}/${key}`, key); }
  async get() {
    const prefix = `${this.path}/`;
    return { docs: [...this.db.data.entries()]
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([path, value]) => ({ id: path.split('/').pop()!, exists: true, data: () => value })) };
  }
}
class FakeDoc {
  constructor(private db: FakeFirestore, private path: string, public id: string) {}
  collection(name: string) { return new FakeCollection(this.db, `${this.path}/${name}`); }
  async get() { const value = this.db.data.get(this.path); return { exists: Boolean(value), id: this.id, data: () => value }; }
  async set(value: Record<string, unknown>, options?: { merge?: boolean }) {
    this.db.data.set(this.path, options?.merge ? { ...this.db.data.get(this.path), ...value } : value);
  }
}
