import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { sanitizeCapsule } from '@/lib/context/capsule-service';
import { buildCapsulePromptBlock, buildProtectedContextPromptBlock, resolveInjectableContext } from '@/lib/context/context-injection';
import { createCognitiveCapsule, KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { cognitiveContextForAttachments } from '@/lib/cognitive-capsule/context-adapter';

const at = '2026-10-03T12:00:00Z';
const actor = { type: 'human', id: 'expert', at };
const documents = new Map<string, unknown>();
function ref(path: string): unknown { return { collection: (name: string) => ref(`${path}/${name}`), doc: (id: string) => ref(`${path}/${id}`), get: async () => ({ exists: documents.has(path), data: () => documents.get(path) }) }; }
const deps = { db: { collection: (name: string) => ref(name) } as unknown as Firestore };
function seed(id: string, version: number, kind: 'languageRule' | 'distinction' = 'languageRule', historical = false, extra: Record<string, unknown> = {}) {
  const cognition = createCognitiveCapsule(id, `1.${version}.0`);
  cognition.profile = kind === 'languageRule' ? 'language' : 'expertise';
  const common = { id: `${id}-knowledge-v${version}`, label: `${id} expertise at v${version}`, scope: ['diplomacy'], reviewState: 'accepted', provenance: { generatedBy: actor, reviewedBy: actor, reviewedAt: at, sourceRefs: [] } };
  cognition.knowledge.push(KnowledgeSchema.parse(kind === 'languageRule' ? { ...common, kind, expression: `prepared to consider v${version}`, language: 'en', domain: 'diplomacy', meaning: 'Conditional openness', nonImplications: ['binding acceptance'] } : { ...common, kind, conceptA: 'authorization', conceptB: 'expenditure', explanation: `Authorization is not expenditure at v${version}.`, whyItMatters: 'Claim the documented stage.', commonMistake: 'Treating funding as spent.' }));
  const capsule = sanitizeCapsule({ capsuleId: id, ownerUid: 'owner', version, label: `${id} v${version}`, cognition, ...extra });
  documents.set(`users/owner/capsules/${id}${historical ? `/versions/v${version}` : ''}`, capsule);
  return capsule;
}

describe('separate authorized cognitive attachment context', () => {
  beforeEach(() => documents.clear());

  it('includes reference wording and distinctions from exact saved versions, with separate receipts', async () => {
    seed('case', 1); seed('wording', 3); seed('wording', 2, 'languageRule', true); seed('finance', 3, 'distinction'); seed('finance', 2, 'distinction', true);
    const resolved = await resolveInjectableContext({ uid: 'owner', capsuleId: 'case', query: 'Does this wording establish acceptance, and was authorized funding spent?', activeContextStack: { stackId: 'case', capsuleRefs: [{ capsuleId: 'case', role: 'situation', version: 1 }, { capsuleId: 'wording', role: 'reference', version: 2 }, { capsuleId: 'finance', role: 'comparison', version: 2 }] } }, deps);
    expect(resolved.promptBlock).toContain('prepared to consider v2');
    expect(resolved.promptBlock).toContain('Authorization is not expenditure at v2.');
    expect(resolved.promptBlock).not.toContain('prepared to consider v3');
    expect(resolved.capsule.capsuleId).toBe('case');
    expect(resolved.cognitiveReceipts).toContainEqual(expect.objectContaining({ capsuleId: 'wording', envelopeVersion: 2, role: 'reference', compilation: expect.objectContaining({ capsuleVersion: '1.2.0', knowledgeIds: ['wording-knowledge-v2'], capsuleDigest: expect.stringMatching(/^sha256:/), viewDigest: expect.stringMatching(/^sha256:/) }) }));
    expect(resolved.cognitiveReceipts).toContainEqual(expect.objectContaining({ capsuleId: 'finance', envelopeVersion: 2 }));
  });

  it('excludes malformed foreign ownership and archived associated capsules', async () => {
    const primary = seed('case', 1, 'languageRule', false, { associatedCapsuleIds: ['foreign', 'archived'] });
    seed('foreign', 1, 'distinction', false, { ownerUid: 'another-owner' });
    seed('archived', 1, 'distinction', false, { archivedAt: at });
    const resolved = await resolveInjectableContext({ uid: 'owner', capsuleId: primary.capsuleId }, deps);
    expect(resolved.associatedCapsules).toEqual([]);
    expect(resolved.promptBlock).not.toContain('foreign-knowledge-v1');
    expect(resolved.cognitiveReceipts?.map((receipt) => receipt.capsuleId)).toEqual(['case']);
  });

  it('verifies exact dependency closure before compiling attached expertise and fails closed', async () => {
    seed('case', 1);
    const attached = seed('wording', 2); attached.cognition!.dependencies = [{ name: 'expert/wording', version: '1.0.0', digest: `sha256:${'1'.repeat(64)}` }];
    const input = { uid: 'owner', capsuleId: 'case', activeContextStack: { stackId: 'case', capsuleRefs: [{ capsuleId: 'case', role: 'situation', version: 1 }, { capsuleId: 'wording', role: 'reference', version: 2 }] } };
    const verifyCognitiveDependencies = vi.fn().mockResolvedValue([]);
    await resolveInjectableContext(input, { ...deps, verifyCognitiveDependencies });
    expect(verifyCognitiveDependencies).toHaveBeenCalledWith('owner', attached.cognition);
    verifyCognitiveDependencies.mockRejectedValue(new Error('Deprecated exact dependency lock.'));
    await expect(resolveInjectableContext(input, { ...deps, verifyCognitiveDependencies })).rejects.toThrow(/deprecated/i);
  });

  it('reports the existing five-reference policy instead of silently compiling extra attachments', async () => {
    seed('case', 1);
    for (let index = 1; index <= 6; index++) seed(`reference-${index}`, 1);
    const result = await resolveInjectableContext({ uid: 'owner', capsuleId: 'case', activeContextStack: { stackId: 'case', capsuleRefs: [{ capsuleId: 'case', role: 'situation', version: 1 }, ...Array.from({ length: 6 }, (_, index) => ({ capsuleId: `reference-${index + 1}`, role: 'reference', version: 1 }))] } }, deps);
    expect(result.associatedCapsules).toHaveLength(5);
    expect(result.promptBlock).toContain('reference-limit');
    expect(result.promptBlock).toContain('reference-6');
    expect(result.cognitiveReceipts?.some((receipt) => receipt.capsuleId === 'reference-6')).toBe(false);
  });

  it('keeps complete attachment records and matching keys under whole inherited-context budgets', () => {
    const primary = seed('case', 1);
    const attached = seed('wording', 2);
    const compiled = cognitiveContextForAttachments([{ role: 'governing', capsule: primary }, { role: 'reference', capsule: attached }], { objective: 'Interpret diplomatic wording', asOf: at, maxChars: 3200 });
    expect(compiled.text.length).toBeLessThanOrEqual(3200);
    expect(compiled.receipts.map((receipt) => receipt.capsuleId)).toEqual(['case', 'wording']);
    const raw = buildCapsulePromptBlock(primary, { associatedCapsules: [attached], objective: 'Interpret diplomatic wording', maxChars: 6000 });
    const protectedBlock = buildProtectedContextPromptBlock(raw, [], [], { maxChars: 2300 });
    expect(protectedBlock.promptBlock.length).toBeLessThanOrEqual(2300);
    expect((protectedBlock.promptBlock.match(/<cognitive-attachment>/g) ?? []).length).toBe((protectedBlock.promptBlock.match(/<\/cognitive-attachment>/g) ?? []).length);
    for (const key of protectedBlock.cognitiveAttachmentKeys ?? []) expect(protectedBlock.promptBlock).toContain(JSON.stringify(key));
    expect(protectedBlock.promptBlock).toContain('</praxis-context-capsule>');
  });
});
