import { describe, expect, it } from 'vitest';
import { builderDraftFingerprint, clearBuilderWorkingDraft, readBuilderWorkingDraft, saveBuilderWorkingDraft, saveCurrentBuilderForUse, type BuilderWorkingDraft } from '@/lib/context/capsule-builder-session';

describe('builder current snapshot and recovery', () => {
  it('refuses to attach a save receipt when edits happened while saving', async () => {
    let current = 'before';
    const result = await saveCurrentBuilderForUse({ fingerprint: current, currentFingerprint: () => current, save: async () => { current = 'after'; return 'saved'; } });
    expect(result).toBeNull();
    expect(await saveCurrentBuilderForUse({ fingerprint: current, currentFingerprint: () => current, save: async () => 'saved-latest' })).toBe('saved-latest');
    expect(await saveCurrentBuilderForUse({ fingerprint: current, currentFingerprint: () => current, save: async () => null })).toBeNull();
  });

  it('bounds tab recovery, isolates accounts and rejects malformed or expired data', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const draft: BuilderWorkingDraft = { purpose: 'Private exercise', notes: '', documents: [], capsule: {} as BuilderWorkingDraft['capsule'], savedCapsuleId: null, savedFingerprint: null };
    // Invalid package structure must not be restored, even if its owner is correct.
    expect(saveBuilderWorkingDraft(storage, 'a', draft, 1000)).toBe(true);
    expect(readBuilderWorkingDraft(storage, 'b', 1000)).toBeNull();
    expect(readBuilderWorkingDraft(storage, 'a', 1000)).toBeNull();
    expect(readBuilderWorkingDraft(storage, 'a', 1000 + 25 * 60 * 60 * 1000)).toBeNull();
    clearBuilderWorkingDraft(storage);
    expect(values.size).toBe(0);
    expect(saveBuilderWorkingDraft({ ...storage, setItem: () => { throw new Error('denied'); } }, 'a', draft)).toBe(false);
  });

  it('changes the current snapshot for source edits while identity assignment alone is stable', () => {
    const draft = { purpose: 'Private exercise', notes: '', documents: [], capsule: { id: 'new', persona: { systemFrame: 'Purpose' } } } as unknown as BuilderWorkingDraft;
    const saved = builderDraftFingerprint(draft);
    expect(builderDraftFingerprint({ ...draft, capsule: { ...draft.capsule, id: 'private-id' } })).toBe(saved);
    expect(builderDraftFingerprint({ ...draft, notes: 'New fact needing review' })).not.toBe(saved);
    expect(builderDraftFingerprint({ ...draft, documents: [{ documentId: 'source-1' } as never] })).not.toBe(saved);
  });
});
