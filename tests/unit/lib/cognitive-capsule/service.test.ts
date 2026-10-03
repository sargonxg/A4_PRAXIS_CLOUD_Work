import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeContextCapsuleV3 } from '@/lib/context/capsule-v3';
import { createCognitiveCapsule, EvidenceSpanSchema } from '@/lib/cognitive-capsule/schema';

const storage = vi.hoisted(() => ({ getCapsule: vi.fn(), createCapsuleReviewCard: vi.fn(), decideCognitiveCapsuleReviewCard: vi.fn(), listCapsuleReviewCardsPage: vi.fn() }));
vi.mock('@/lib/context/capsule-service', () => storage);
import { CognitiveKnowledgeCaptureSchema, getCognitiveCapsuleInventory, proposeCognitiveKnowledge, proposeCognitiveInterview, decideCognitiveKnowledge } from '@/lib/cognitive-capsule/service';

const correction = { kind: 'distinction', label: 'Authorization is not expenditure', scope: ['budget'], body: 'Check actual payment records.', terms: ['authorization', 'expenditure'] };
function saved() {
  return { capsuleId: 'owned', ownerUid: 'owner', version: 1, v3: normalizeContextCapsuleV3({ capsuleId: 'owned', ownerUid: 'owner', humanTacitKnowledge: { practicalHeuristics: ['Keep legacy untouched.'] } }) };
}
describe('expertise capture service', () => {
  beforeEach(() => { vi.clearAllMocks(); storage.getCapsule.mockResolvedValue(saved()); storage.createCapsuleReviewCard.mockImplementation(async (_uid, _id, input) => ({ ...input, reviewCardId: 'review', cognitiveKnowledgeIds: input.proposedEnvelopePatch.cognition.knowledge.slice(-1).map((item: { id: string }) => item.id) })); });
  it('creates human-authored typed proposals and preserves unreviewed legacy knowledge', async () => {
    const result = await proposeCognitiveKnowledge('owner', 'owned', correction);
    expect(result?.knowledge).toMatchObject({ kind: 'distinction', reviewState: 'proposed', provenance: { generatedBy: { type: 'human', id: 'owner' } } });
    expect(result?.knowledge.provenance.reviewedBy).toBeUndefined();
    const call = storage.createCapsuleReviewCard.mock.calls[0];
    expect(call[3]).toMatchObject({ requireWritableOwner: true });
    expect(call[2].proposedEnvelopePatch.cognition.knowledge[0]).toMatchObject({ label: 'Keep legacy untouched.', reviewState: 'proposed', migrationStatus: 'needs_review' });
    expect(saved().v3.humanTacitKnowledge.practicalHeuristics).toEqual(['Keep legacy untouched.']);
  });
  it('preserves practice guards, procedure controls and non-transferable case dimensions', async () => {
    const condition = { kind: 'context', key: 'authority-missing', operator: 'present' };
    const procedure = await proposeCognitiveKnowledge('owner', 'owned', { kind: 'procedure', label: 'Authority check', scope: ['budget'], body: 'Review authority before publication.',
      inputs: ['Budget record'], outputs: ['Review finding'], escalationConditions: [condition],
      structuredSteps: [{ id: 'check', instruction: 'Inspect signing authority.', escalateIf: [condition] }] });
    expect(procedure?.knowledge).toMatchObject({ inputs: ['Budget record'], outputs: ['Review finding'], escalationConditions: [condition], steps: [{ id: 'check', escalateIf: [condition] }] });
    const precedent = await proposeCognitiveKnowledge('owner', 'owned', { kind: 'case', label: 'Reviewed case', scope: ['budget'], body: 'Similar funding stages.', situation: 'A synthetic authorization.', decision: 'Inspect payment records.', analogyDimensions: ['approval stage'], nonTransferableDimensions: ['enforcement mechanism'] });
    expect(precedent?.knowledge).toMatchObject({ nonTransferableDimensions: ['enforcement mechanism'] });
    const cue = await proposeCognitiveKnowledge('owner', 'owned', { kind: 'cue', label: 'Reassessment', scope: ['budget'], body: 'A review milestone.', falsePositiveConditions: [condition], nonImplications: ['termination'] });
    expect(cue?.knowledge).toMatchObject({ falsePositiveConditions: [condition], doNotInfer: ['termination'] });
  });
  it('stamps generated proposals with server model authorship rather than a human author', async () => {
    const result = await proposeCognitiveKnowledge('owner', 'owned', correction, undefined, { type: 'model', id: 'configured-model' });
    expect(result?.knowledge.provenance).toMatchObject({ generatedBy: { type: 'model', id: 'configured-model' }, confidenceKind: 'model-proposed' });
    expect(storage.createCapsuleReviewCard.mock.calls[0][2].sourceType).toBe('agent');
  });
  it('rejects a generated proposal if context changed before the capture service reads it', async () => {
    storage.getCapsule.mockResolvedValue({ ...saved(), version: 2 });
    await expect(proposeCognitiveKnowledge('owner', 'owned', correction, undefined, { type: 'model', id: 'configured-model', expectedCapsuleVersion: 1 })).rejects.toMatchObject({ status: 409 });
    expect(storage.createCapsuleReviewCard).not.toHaveBeenCalled();
  });
  it('maps a source ID to attached evidence anchors and rejects unresolved or missing references', async () => {
    const cognition = createCognitiveCapsule('owned');
    cognition.evidence.push(EvidenceSpanSchema.parse({ id: 'span', sourceId: 'source', sourceVersion: '1', quote: 'Payment was reported.', anchorStatus: 'exact' }));
    storage.getCapsule.mockResolvedValue({ ...saved(), cognition });
    const result = await proposeCognitiveKnowledge('owner', 'owned', { ...correction, sourceRefs: ['source'] });
    expect(result?.knowledge.provenance.sourceRefs).toEqual(['span']);
    await expect(proposeCognitiveKnowledge('owner', 'owned', { ...correction, sourceRefs: ['missing'] })).rejects.toThrow(/evidence excerpt/);
    cognition.evidence[0].anchorStatus = 'unresolved';
    await expect(proposeCognitiveKnowledge('owner', 'owned', { ...correction, sourceRefs: ['source'] })).rejects.toThrow(/evidence excerpt/);
  });
  it('refuses a foreign owner and requires explicit case facts and language', async () => {
    storage.getCapsule.mockResolvedValue({ ...saved(), ownerUid: 'someone-else' });
    expect(await proposeCognitiveKnowledge('owner', 'owned', correction)).toBeNull();
    expect(storage.createCapsuleReviewCard).not.toHaveBeenCalled();
    expect(CognitiveKnowledgeCaptureSchema.safeParse({ kind: 'case', label: 'Case', scope: ['diplomacy'], body: 'An interpretation.' }).success).toBe(false);
    expect(CognitiveKnowledgeCaptureSchema.safeParse({ kind: 'languageRule', label: 'prepared to consider', scope: ['diplomacy'], body: 'Conditional openness.' }).success).toBe(false);
  });
  it('delegates decisions to the owner-guarded transactional service', async () => {
    await decideCognitiveKnowledge('owner', 'owned', { reviewCardId: 'review', decision: 'need_evidence', reason: 'Check actual payment records.' });
    expect(storage.decideCognitiveCapsuleReviewCard).toHaveBeenCalledWith('owner', 'owned', 'review', expect.objectContaining({ decision: 'need_evidence' }), { requireWritableOwner: true });
  });
  it('projects only proposed changed knowledge when returning review cards', async () => {
    const proposed = await proposeCognitiveKnowledge('owner', 'owned', correction);
    storage.listCapsuleReviewCardsPage.mockResolvedValue({ cards: [proposed!.card], nextCursor: 'cursor', hasMore: true });
    const inventory = await getCognitiveCapsuleInventory('owner', 'owned');
    expect(inventory?.reviewCards[0].proposedEnvelopePatch.cognition.knowledge).toHaveLength(1);
    expect(inventory?.reviewCards[0].proposedEnvelopePatch.cognition.knowledge[0].kind).toBe('distinction');
    expect(inventory?.hasMore).toBe(true);
    expect(inventory?.nextCursor).toBe('cursor');
  });
  it('asks for missing interview answers without persisting and stamps ready proposals server side', async () => {
    const pending = await proposeCognitiveInterview('owner', 'owned', { mode: 'distinction', answers: { label: 'Budget stages' } });
    expect(pending?.status).toBe('needs_answers');
    expect(storage.createCapsuleReviewCard).not.toHaveBeenCalled();
    const ready = await proposeCognitiveInterview('owner', 'owned', { mode: 'distinction', answers: {
      label: 'Budget stages', scope: ['finance'], sourceRefs: [], conceptA: 'authorization', conceptB: 'expenditure',
      explanation: 'Check each stage.', whyItMatters: 'Prevents premature claims.', commonMistake: 'Calling authorization spending.', decisionTests: ['Ask for disbursement records.'],
    } });
    expect(ready?.status).toBe('ready');
    expect(ready?.proposals[0]).toMatchObject({ reviewState: 'proposed', provenance: { generatedBy: { type: 'human', id: 'owner' } } });
    expect(storage.createCapsuleReviewCard).toHaveBeenCalledTimes(1);
  });
});
