import { describe, expect, it, vi } from 'vitest';
import { createCognitiveCapsule, KnowledgeSchema, CognitiveNodeSchema, CognitiveStatementSchema, EvidenceSpanSchema } from '@/lib/cognitive-capsule/schema';
import { proposeCognitiveKnowledge, proposeCognitiveInterview, proposeCognitiveGraph, stageRegistryCapsuleInstallation } from '@/lib/cognitive-capsule/service';
import { decideCognitiveCapsuleReviewCard } from '@/lib/context/capsule-service';
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
  createCapsuleArchitectReviewCards,
  createCapsuleIntakeReviewCards,
  createEmptyCapsuleInventorySummary,
  createCapsule,
  deriveCapsuleGraphStats,
  detachCapsuleRefs,
  exportCapsuleCorePackage,
  forkCapsule,
  buildContextCapsuleV3,
  getCapsule,
  getOrMigrateDefaultCapsule,
  capsuleToStack,
  listCapsuleInventory,
  listCapsules,
  listCapsuleReviewCards,
  listCapsuleReviewCardsPage,
  rejectCapsuleReviewCard,
  promoteCapsuleSourceGaps,
  promoteCapsuleOntologyExtensionToGlobalAco,
  proposeCogneeSeedReviewCards,
  proposeCapsuleGraphEdgeChange,
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
  it('demotes changed graph records and only stamps them through a human decision', async () => {
    const db = architectDb(); db.rejectUndefined = true;
    await createCapsule('u1', { capsuleId: 'graph-review' }, deps(db));
    const cognition = createCognitiveCapsule('graph-review');
    const actor = { type: 'model' as const, id: 'extraction-model', at: '2026-05-14T00:00:00Z' };
    const fakeReviewer = { type: 'human' as const, id: 'caller-claimed-reviewer', at: actor.at };
    const provenance = { generatedBy: actor, sourceRefs: ['e'], reviewedBy: fakeReviewer, reviewedAt: actor.at };
    cognition.evidence.push(EvidenceSpanSchema.parse({ id: 'e', sourceId: 'source', sourceVersion: 'hash-1', quote: 'State A may consider the proposal.', anchorStatus: 'exact' }));
    cognition.nodes.push(CognitiveNodeSchema.parse({ id: 'a', type: 'aco:Actor', label: 'State A', layer: 'world', reviewState: 'accepted', provenance }));
    cognition.statements.push(CognitiveStatementSchema.parse({ id: 's', subject: 'a', predicate: 'MAY_CONSIDER', object: { literal: 'proposal' }, layer: 'world', polarity: 'positive', modality: 'possible', reviewState: 'accepted', sourceRefs: ['e'], provenance }));
    const card = await createCapsuleReviewCard('u1', 'graph-review', { title: 'Graph proposal', target: 'graphProposal', sourceType: 'agent', proposedEnvelopePatch: { cognition } }, deps(db));
    expect(card.cognitiveNodeIds).toEqual(['a']); expect(card.cognitiveStatementIds).toEqual(['s']);
    expect(card.proposedEnvelopePatch.cognition?.nodes[0]).toMatchObject({ reviewState: 'proposed', provenance: { generatedBy: actor } });
    expect(card.proposedEnvelopePatch.cognition?.nodes[0].provenance.reviewedBy).toBeUndefined();
    expect(card.proposedEnvelopePatch.cognition?.statements[0].reviewState).toBe('proposed');
    expect((await getCapsule('u1', 'graph-review', deps(db)))?.cognition).toBeUndefined();
    const result = await decideCognitiveCapsuleReviewCard('u1', 'graph-review', card.reviewCardId, { decision: 'edit_accept', reason: 'Checked exact wording and actor.',
      edited: { ...card.proposedEnvelopePatch.cognition!.nodes[0], label: 'State A government', provenance: { ...card.proposedEnvelopePatch.cognition!.nodes[0].provenance, generatedBy: fakeReviewer } } }, deps(db));
    expect(result?.capsule.cognition?.nodes[0]).toMatchObject({ label: 'State A government', reviewState: 'accepted', provenance: { generatedBy: actor, reviewedBy: { type: 'human', id: 'u1' } } });
    expect(result?.capsule.cognition?.statements[0]).toMatchObject({ reviewState: 'proposed', provenance: { generatedBy: actor } });
    const final = await decideCognitiveCapsuleReviewCard('u1', 'graph-review', card.reviewCardId, { decision: 'accept', reason: 'Now reviewed the statement and remaining profile.', selectedRecordIds: ['s'], selectProfile: true, expectedCapsuleVersion: 2 }, deps(db));
    expect(final?.capsule.cognition?.statements[0]).toMatchObject({ reviewState: 'accepted', provenance: { reviewedBy: { id: 'u1' } } });
  });
  it('preserves omitted canonical records and requires an explicit reviewed supersession', async () => {
    const db = architectDb();
    const cognition = createCognitiveCapsule('supersession', '1.0.0'); const actor = { type: 'human' as const, id: 'original', at: '2026-05-14T00:00:00Z' };
    cognition.knowledge.push(KnowledgeSchema.parse({ id: 'old', kind: 'distinction', label: 'Old distinction', scope: ['budget'], conceptA: 'A', conceptB: 'B', explanation: 'Keep distinct.', whyItMatters: 'Avoid confusion.', commonMistake: 'Equating A with B.', reviewState: 'accepted', provenance: { generatedBy: actor, sourceRefs: [], reviewedBy: actor, reviewedAt: actor.at } }));
    await createCapsule('u1', { capsuleId: 'supersession', cognition }, deps(db));
    const replacement = createCognitiveCapsule('supersession'); replacement.knowledge.push(KnowledgeSchema.parse({ ...cognition.knowledge[0], id: 'new', label: 'New distinction', reviewState: 'proposed' }));
    const additive = await createCapsuleReviewCard('u1', 'supersession', { title: 'Add replacement', sourceType: 'user', target: 'capsuleEnvelope', proposedEnvelopePatch: { cognition: replacement } }, deps(db));
    expect(additive.proposedEnvelopePatch.cognition?.knowledge.map((k) => k.id)).toEqual(['old', 'new']);
    const added = await decideCognitiveCapsuleReviewCard('u1', 'supersession', additive.reviewCardId, { decision: 'accept', reason: 'Add the new rule without deleting the old.' }, deps(db));
    const supersede = { ...added!.capsule.cognition!, knowledge: added!.capsule.cognition!.knowledge.map((k) => k.id === 'old' ? { ...k, reviewState: 'superseded' as const } : k) };
    const card = await createCapsuleReviewCard('u1', 'supersession', { title: 'Retire old rule', sourceType: 'user', target: 'capsuleEnvelope', proposedEnvelopePatch: { cognition: supersede } }, deps(db));
    expect(card.cognitiveSupersededIds).toEqual(['old']);
    expect((await getCapsule('u1', 'supersession', deps(db)))?.cognition?.knowledge[0].reviewState).toBe('accepted');
    const result = await decideCognitiveCapsuleReviewCard('u1', 'supersession', card.reviewCardId, { decision: 'accept', reason: 'Explicitly retired the old distinction.' }, deps(db));
    expect(result?.capsule.cognition?.knowledge.find((k) => k.id === 'old')?.reviewState).toBe('superseded');
    expect(result?.capsule.cognition?.version).toBe('2.0.0');
  });
  it('keeps invalid graph acceptance and rejected graph proposals out of canonical cognition', async () => {
    const db = architectDb(); await createCapsule('u1', { capsuleId: 'invalid-graph' }, deps(db));
    const cognition = createCognitiveCapsule('invalid-graph'); const actor = { type: 'model' as const, id: 'model', at: '2026-05-14T00:00:00Z' };
    cognition.nodes.push(CognitiveNodeSchema.parse({ id: 'a', type: 'aco:Actor', label: 'A', layer: 'world', provenance: { generatedBy: actor, sourceRefs: [] } }));
    cognition.evidence.push(EvidenceSpanSchema.parse({ id: 'e', sourceId: 'source', sourceVersion: 'unknown', quote: 'Unresolved excerpt.', anchorStatus: 'unresolved' }));
    cognition.statements.push(CognitiveStatementSchema.parse({ id: 's', subject: 'a', predicate: 'ACCEPTED', object: { literal: 'proposal' }, layer: 'world', polarity: 'positive', sourceRefs: ['e'], provenance: { generatedBy: actor, sourceRefs: ['e'] } }));
    const card = await createCapsuleReviewCard('u1', 'invalid-graph', { title: 'Unresolved assertion', target: 'graphProposal', sourceType: 'agent', proposedEnvelopePatch: { cognition } }, deps(db));
    await expect(decideCognitiveCapsuleReviewCard('u1', 'invalid-graph', card.reviewCardId, { decision: 'accept', reason: 'Claim needs an anchored source.' }, deps(db))).rejects.toThrow(/unresolved evidence/i);
    expect((await getCapsule('u1', 'invalid-graph', deps(db)))?.cognition).toBeUndefined();
    const rejected = await decideCognitiveCapsuleReviewCard('u1', 'invalid-graph', card.reviewCardId, { decision: 'reject', reason: 'The source has not been resolved.' }, deps(db));
    expect(rejected?.card.proposedEnvelopePatch.cognition?.nodes[0].reviewState).toBe('rejected');
    expect(rejected?.card.proposedEnvelopePatch.cognition?.statements[0].reviewState).toBe('rejected');
    expect(rejected?.capsule.cognition).toBeUndefined();
  });
  it('persists correction and interview proposals with strict Firestore values', async () => {
    const db = architectDb();
    db.rejectUndefined = true;
    const capsule = await createCapsule('u1', { capsuleId: 'strict-capture' }, deps(db));
    const correction = await proposeCognitiveKnowledge('u1', capsule.capsuleId, {
      kind: 'distinction', label: 'Budget stages', scope: ['budget'], terms: ['authorization', 'expenditure'], body: 'Approval does not prove payment.',
    }, deps(db));
    const interview = await proposeCognitiveInterview('u1', capsule.capsuleId, { mode: 'distinction', answers: {
      label: 'Interview budget stages', scope: ['budget'], sourceRefs: [], conceptA: 'authorization', conceptB: 'expenditure',
      explanation: 'Approval does not prove payment.', whyItMatters: 'Avoid unsupported claims.', commonMistake: 'Calling approval spending.', decisionTests: ['Check payment records.'],
    } }, deps(db));
    expect(correction?.card.reviewCardId).toBeTruthy();
    expect(interview?.status).toBe('ready');
    const cards = await listCapsuleReviewCards('u1', capsule.capsuleId, deps(db));
    expect(cards).toHaveLength(2);
    expect(cards.every((card) => card.proposedEnvelopePatch.cognition?.knowledge.every((item) => item.reviewState === 'proposed'))).toBe(true);
    expect((await getCapsule('u1', capsule.capsuleId, deps(db)))?.cognition).toBeUndefined();
    // The non-transactional compatibility write must serialize the same payload.
    const directDb = new FakeFirestore();
    directDb.rejectUndefined = true;
    await createCapsule('u1', { capsuleId: capsule.capsuleId }, deps(directDb));
    await createCapsuleReviewCard('u1', capsule.capsuleId, {
      title: 'Direct proposal', target: 'capsuleEnvelope', sourceType: 'user', proposedEnvelopePatch: correction!.card.proposedEnvelopePatch,
    }, deps(directDb));
    expect(await listCapsuleReviewCards('u1', capsule.capsuleId, deps(directDb))).toHaveLength(1);
  });

  it('edits only one interview item without approving other records or the profile through direct calls', async () => {
    const db = architectDb();
    const capsule = await createCapsule('u1', { capsuleId: 'interview-group' }, deps(db));
    const cognition = createCognitiveCapsule(capsule.capsuleId);
    for (const id of ['first', 'second']) cognition.knowledge.push(KnowledgeSchema.parse({ id, kind: 'distinction', label: `Distinction ${id}`, scope: ['budget'], conceptA: 'authorization', conceptB: 'expenditure', explanation: 'Approval is not payment.', whyItMatters: 'Avoid unsupported claims.', commonMistake: 'Treating approval as payment.', provenance: { generatedBy: { type: 'human', id: `original-${id}`, at: '2026-10-03T00:00:00Z' }, sourceRefs: [] } }));
    const card = await createCapsuleReviewCard('u1', capsule.capsuleId, { title: 'Interview group', target: 'capsuleEnvelope', sourceType: 'user', proposedEnvelopePatch: { cognition } }, deps(db));
    await expect(decideCognitiveCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, { decision: 'edit_accept', reason: 'Reviewed every item.', edited: { ...cognition.knowledge[1], id: 'unselected' } }, deps(db))).rejects.toThrow(/proposed by this review card/);
    await expect(decideCognitiveCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, { decision: 'edit_accept', reason: 'Do not approve two through one edit.', edited: cognition.knowledge[1], selectedRecordIds: ['first', 'second'], selectProfile: false, expectedCapsuleVersion: 1 }, deps(db))).rejects.toMatchObject({ status: 400 });
    await expect(decideCognitiveCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, { decision: 'edit_accept', reason: 'Do not approve a profile through one edit.', edited: cognition.knowledge[1], selectedRecordIds: ['second'], selectProfile: true, expectedCapsuleVersion: 1 }, deps(db))).rejects.toMatchObject({ status: 400 });
    const result = await decideCognitiveCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, { decision: 'edit_accept', reason: 'Inspected every interview item; corrected the second label.', edited: { ...cognition.knowledge[1], label: 'Edited second distinction', provenance: { ...cognition.knowledge[1].provenance, generatedBy: { type: 'human', id: 'forged-author', at: '2026-10-03T00:00:00Z' } } } }, deps(db));
    expect(result?.capsule.cognition?.knowledge.filter((item) => card.cognitiveKnowledgeIds?.includes(item.id)).map((item) => item.reviewState)).toEqual(['proposed', 'accepted']);
    expect(result?.capsule.cognition?.knowledge.find((item) => item.id === 'first')).toMatchObject({ label: 'Distinction first', provenance: { generatedBy: { id: 'original-first' } } });
    expect(result?.capsule.cognition?.knowledge.find((item) => item.id === 'first')?.provenance.reviewedBy).toBeUndefined();
    expect(result?.card).toMatchObject({ state: 'owner_review', cognitiveKnowledgeIds: ['first'], cognitiveProfileChanged: true });
    expect(result?.capsule.cognition?.knowledge.find((item) => item.id === 'second')).toMatchObject({ label: 'Edited second distinction', provenance: { generatedBy: { id: 'original-second' }, reviewedBy: { id: 'u1' } } });
  });
  it('forks expertise with a new capsule identity while preserving reviewed content and provenance', async () => {
    const db = new FakeFirestore();
    const cognition = createCognitiveCapsule('expert-parent', '2.1.0');
    const actor = { type: 'human' as const, id: 'expert', at: '2026-10-03T00:00:00Z' };
    cognition.knowledge.push(KnowledgeSchema.parse({ id: 'distinction', kind: 'distinction', label: 'Authorization versus expenditure', scope: ['budget'], conceptA: 'authorization', conceptB: 'expenditure', explanation: 'Approval is not payment.', whyItMatters: 'Avoid unsupported spending claims.', commonMistake: 'Treating stages as equivalent.', reviewState: 'accepted', provenance: { generatedBy: actor, sourceRefs: [], reviewedBy: actor, reviewedAt: actor.at } }));
    await createCapsule('u1', { capsuleId: 'expert-parent', cognition }, deps(db));
    const fork = await forkCapsule('u1', 'expert-parent', { capsuleId: 'expert-fork' }, deps(db));
    expect(fork?.cognition?.capsuleId).toBe('expert-fork');
    expect(fork?.cognition?.version).toBe('2.1.0');
    expect(fork?.cognition?.knowledge).toEqual(cognition.knowledge);
    expect(fork?.provenance.parentCapsuleId).toBe('expert-parent');
    expect((await getCapsule('u1', 'expert-parent', deps(db)))?.cognition?.capsuleId).toBe('expert-parent');
    expect((await getCapsule('u1', 'expert-fork', deps(db)))?.cognition?.knowledge).toEqual(cognition.knowledge);
    const unnamed = await forkCapsule('u1', 'expert-parent', {}, deps(db));
    expect(unnamed?.cognition?.capsuleId).toBe(unnamed?.capsuleId);
  });
  it('creates cognitive combinations as private inactive review drafts with exact parent locks', async () => {
    const db = architectDb(); db.rejectUndefined = true;
    await createCapsule('u1', { capsuleId: 'cognitive-parent', cognition: createCognitiveCapsule('cognitive-parent') }, deps(db));
    await createCapsule('u1', { capsuleId: 'legacy-parent', humanTacitKnowledge: { caveats: ['Check the actual case.'] } }, deps(db));
    const result = await combineCapsules('u1', { capsuleIds: ['cognitive-parent', 'legacy-parent'], capsuleId: 'reviewed-combination', activateForSituationIds: ['case-1'] }, deps(db));
    expect(result?.capsule.cognition).toBeUndefined();
    expect(result?.capsule.access.visibility).toBe('private');
    expect(result?.capsule.activeForSituationIds).toEqual([]);
    expect(result?.reviewCard?.proposedEnvelopePatch.cognition?.knowledge[0].reviewState).toBe('proposed');
    expect(result?.capsule.memoryPosture).toMatchObject({ cognitiveComposition: { parentLocks: [{ capsuleId: 'cognitive-parent', capsuleVersion: 1 }, { capsuleId: 'legacy-parent', capsuleVersion: 1 }] } });
    expect(await getCapsule('u1', 'reviewed-combination', deps(db))).toMatchObject({ latestGateState: 'proposed' });
    await expect(combineCapsules('u1', { capsuleIds: ['cognitive-parent', 'legacy-parent'], capsuleId: 'reviewed-combination' }, deps(db))).rejects.toThrow(/already exists/);
  });
  it.each(['situation', 'expertise', 'method', 'language', 'organization', 'role', 'casebook', 'output'])('reviews a profile-only %s proposal before saving canonical cognition', async (profile) => {
    const db = architectDb(); await createCapsule('u1', { capsuleId: 'profile-only' }, deps(db));
    const proposal = await proposeCognitiveGraph('u1', 'profile-only', { operation: 'graph-proposal', baseVersion: 1, profile }, deps(db));
    expect(proposal?.card).toMatchObject({ cognitiveProfileChanged: true, cognitiveNodeIds: [], cognitiveStatementIds: [], cognitiveKnowledgeIds: [] });
    expect((await getCapsule('u1', 'profile-only', deps(db)))?.cognition).toBeUndefined();
    const approved = await decideCognitiveCapsuleReviewCard('u1', 'profile-only', proposal!.card.reviewCardId, { decision: 'accept', reason: 'Reviewed this initial cognitive profile.' }, deps(db));
    expect(approved?.capsule.cognition).toMatchObject({ profile, version: '1.1.0' });
    const inventory = await listCapsuleInventory('u1', { metadataOnly: true }, deps(db));
    expect(inventory.capsules[0]).toMatchObject({ cognitiveProfile: profile, cognitiveStatementCount: 0 });
    expect(inventory.capsules[0].cognition).toBeUndefined();
    await expect(proposeCognitiveGraph('u1', 'profile-only', { operation: 'graph-proposal', baseVersion: 1, profile: 'method' }, deps(db))).rejects.toMatchObject({ status: 409 });
    const changedProfile = profile === 'method' ? 'expertise' : 'method';
    const change = await proposeCognitiveGraph('u1', 'profile-only', { operation: 'graph-proposal', baseVersion: 2, profile: changedProfile }, deps(db));
    const changed = await decideCognitiveCapsuleReviewCard('u1', 'profile-only', change!.card.reviewCardId, { decision: 'accept', reason: 'Reviewed the changed profile.' }, deps(db));
    expect(changed?.capsule.cognition).toMatchObject({ profile: changedProfile, version: '2.0.0' });
    if (profile === 'language') {
      const graph = await proposeCognitiveGraph('u1', 'profile-only', { operation: 'graph-proposal', baseVersion: 3, nodes: [{ id: 'actor', type: 'aco:Actor', label: 'Actor', layer: 'world' }] }, deps(db));
      expect(graph?.card.proposedEnvelopePatch.cognition?.profile).toBe('method');
      expect(graph?.card.cognitiveProfileChanged).toBe(false);
    }
  });
  it('rejects composition approval when an exact parent lock changed after draft creation', async () => {
    const db = architectDb();
    for (const id of ['lock-a', 'lock-b']) await createCapsule('u1', { capsuleId: id, cognition: createCognitiveCapsule(id) }, deps(db));
    const result = await combineCapsules('u1', { capsuleIds: ['lock-a', 'lock-b'], capsuleId: 'locked-draft' }, deps(db));
    await bumpCapsuleVersion('u1', 'lock-a', { label: 'Changed parent' }, deps(db));
    await expect(decideCognitiveCapsuleReviewCard('u1', 'locked-draft', result!.reviewCard!.reviewCardId, { decision: 'accept', reason: 'Inspect the parent locks.' }, deps(db))).rejects.toThrow(/parent changed/i);
    expect((await getCapsule('u1', 'locked-draft', deps(db)))?.cognition).toBeUndefined();
  });
  it('partially reviews an ordinary composition while retaining and rebasing multiple incomplete migrations', async () => {
    const db = architectDb(); db.rejectUndefined = true;
    for (const id of ['ordinary-a', 'ordinary-b']) {
      await createCapsule('u1', { capsuleId: id, label: id }, deps(db));
      const capture = await proposeCognitiveKnowledge('u1', id, { kind: 'distinction', label: `Native ${id}`, scope: ['budget'], body: 'Approval is not payment.', terms: ['approval', 'payment'] }, deps(db));
      await decideCognitiveCapsuleReviewCard('u1', id, capture!.card.reviewCardId, { decision: 'accept', reason: 'Reviewed the native distinction.' }, deps(db));
    }
    const composed = await combineCapsules('u1', { capsuleIds: ['ordinary-a', 'ordinary-b'], capsuleId: 'ordinary-composition' }, deps(db));
    const card = composed!.reviewCard!;
    const nativeIds = card.proposedEnvelopePatch.cognition!.knowledge.filter((item) => card.cognitiveKnowledgeIds?.includes(item.id) && item.migrationStatus === 'native').map((item) => item.id);
    const migrated = card.proposedEnvelopePatch.cognition!.knowledge.filter((item) => card.cognitiveKnowledgeIds?.includes(item.id) && item.migrationStatus === 'needs_review');
    expect(nativeIds).toHaveLength(2); expect(migrated.length).toBeGreaterThanOrEqual(4);
    await expect(decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { decision: 'accept', reason: 'Incomplete rows must fail closed.' }, deps(db))).rejects.toThrow(/Complete the expert structure/);
    await expect(decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { decision: 'reject', reason: 'Do not close unselected items.', selectedRecordIds: nativeIds, selectProfile: false, expectedCapsuleVersion: 1 }, deps(db))).rejects.toMatchObject({ status: 400 });
    const scope = { decision: 'accept' as const, reason: 'Reviewed only the native distinctions and profile.', selectedRecordIds: nativeIds, selectProfile: true, expectedCapsuleVersion: 1 };
    const first = await decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, scope, deps(db));
    expect(first?.card.state).toBe('owner_review'); expect(first?.capsule.latestGateState).toBe('owner_review');
    expect(first?.capsule.readinessSummary?.reviewRequired).toBe(true);
    expect(first?.capsule.cognition).toMatchObject({ profile: 'situation', version: '1.1.0' });
    expect(first?.card.cognitiveKnowledgeIds).toEqual(migrated.map((item) => item.id));
    for (const item of migrated) expect(first?.capsule.cognition?.knowledge.find((row) => row.id === item.id)).toMatchObject({ reviewState: 'proposed', migrationStatus: 'needs_review', provenance: { generatedBy: item.provenance.generatedBy } });
    for (const id of nativeIds) expect(first?.capsule.cognition?.knowledge.find((row) => row.id === id)).toMatchObject({ reviewState: 'accepted', provenance: { reviewedBy: { id: 'u1' } } });
    const reload = (await listCapsuleReviewCards('u1', 'ordinary-composition', deps(db))).find((row) => row.reviewCardId === card.reviewCardId)!;
    expect(reload.cognitiveDecisionHistory).toHaveLength(1); expect(reload.cognitiveDecisionHistory?.[0]).toMatchObject({ selectedRecordIds: nativeIds, selectedProfile: true });
    expect(reload.cognitiveKnowledgeIds?.some((id) => nativeIds.includes(id))).toBe(false);
    await expect(applyCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { reviewerUid: 'u1', confirmationReason: 'A legacy endpoint must not bypass the rebased review.', diffHash: 'diff:legacy' }, deps(db))).rejects.toMatchObject({ status: 409 });
    await expect(rejectCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { reviewerUid: 'u1', confirmationReason: 'A legacy rejection endpoint must not close the rebased review.' }, deps(db))).rejects.toMatchObject({ status: 409 });
    for (const decision of ['reject', 'need_evidence'] as const) {
      await expect(decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { decision, reason: 'A stale tab must not decide the rebased proposal.', expectedCapsuleVersion: 1 }, deps(db))).rejects.toMatchObject({ status: 409 });
      await expect(decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { decision, reason: 'An older client must reload before deciding.' }, deps(db))).rejects.toMatchObject({ status: 409 });
    }
    await expect(decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, scope, deps(db))).rejects.toMatchObject({ status: 409 });
    await expect(decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { ...scope, expectedCapsuleVersion: 2, selectedRecordIds: ['forged'], selectProfile: false }, deps(db))).rejects.toMatchObject({ status: 400 });
    await expect(decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { ...scope, expectedCapsuleVersion: 2, selectProfile: false }, deps(db))).rejects.toMatchObject({ status: 400 });
    const legacy = migrated.find((item) => item.kind === 'unknown')!;
    const edited = { ...legacy, description: 'An explicit remaining evidence gap.', requiredEvidence: ['Inspect the original source and document its limits.'] };
    const second = await decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { decision: 'edit_accept', reason: 'Completed only this evidence-gap structure.', edited, selectedRecordIds: [legacy.id], selectProfile: false, expectedCapsuleVersion: 2 }, deps(db));
    expect(second?.capsule.cognition?.knowledge.find((row) => row.id === legacy.id)).toMatchObject({ reviewState: 'accepted', migrationStatus: 'native', provenance: { generatedBy: legacy.provenance.generatedBy } });
    expect(second?.card.cognitiveKnowledgeIds).toHaveLength(migrated.length - 1); expect(second?.card.cognitiveDecisionHistory).toHaveLength(2);
    for (const item of migrated.filter((row) => row.id !== legacy.id)) expect(second?.capsule.cognition?.knowledge.find((row) => row.id === item.id)).toMatchObject({ reviewState: 'proposed', migrationStatus: 'needs_review' });
    const profile = await proposeCognitiveGraph('u1', 'ordinary-composition', { operation: 'graph-proposal', baseVersion: 3, profile: 'method' }, deps(db));
    await decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', profile!.card.reviewCardId, { decision: 'accept', reason: 'Reviewed the independent profile proposal.', selectedRecordIds: [], selectProfile: true, expectedCapsuleVersion: 3 }, deps(db));
    await expect(decideCognitiveCapsuleReviewCard('u1', 'ordinary-composition', card.reviewCardId, { decision: 'accept', reason: 'Do not use a stale rebased card.', selectedRecordIds: [second!.card.cognitiveKnowledgeIds![0]], selectProfile: false, expectedCapsuleVersion: 4 }, deps(db))).rejects.toThrow(/changed/);
  });
  it('keeps unselected edits to accepted graph records out of canonical cognition until their own review', async () => {
    const db = architectDb(); const cognition = createCognitiveCapsule('scoped-graph', '1.0.0');
    const actor = { type: 'human' as const, id: 'author', at: '2026-05-14T00:00:00Z' };
    for (const id of ['a', 'b']) cognition.nodes.push(CognitiveNodeSchema.parse({ id, type: 'aco:Actor', label: id, layer: 'world', reviewState: 'accepted', provenance: { generatedBy: actor, sourceRefs: [], reviewedBy: actor, reviewedAt: actor.at } }));
    await createCapsule('u1', { capsuleId: cognition.capsuleId, cognition }, deps(db));
    const proposal = await proposeCognitiveGraph('u1', cognition.capsuleId, { operation: 'graph-proposal', baseVersion: 1, profile: 'language', nodes: cognition.nodes.map(({ provenance: _author, reviewState: _state, ...node }) => ({ ...node, label: `Updated ${node.id}` })) }, deps(db));
    const first = await decideCognitiveCapsuleReviewCard('u1', cognition.capsuleId, proposal!.card.reviewCardId, { decision: 'accept', reason: 'Only approve A.', selectedRecordIds: ['a'], selectProfile: false, expectedCapsuleVersion: 1 }, deps(db));
    expect(first?.capsule.cognition?.profile).toBe('expertise'); expect(first?.card.cognitiveProfileChanged).toBe(true);
    expect(first?.capsule.cognition?.nodes.find((node) => node.id === 'a')?.label).toBe('Updated a');
    expect(first?.capsule.cognition?.nodes.find((node) => node.id === 'b')).toEqual(cognition.nodes[1]);
    expect(first?.card.proposedEnvelopePatch.cognition?.nodes.find((node) => node.id === 'b')).toMatchObject({ label: 'Updated b', reviewState: 'proposed' });
    const second = await decideCognitiveCapsuleReviewCard('u1', cognition.capsuleId, proposal!.card.reviewCardId, { decision: 'accept', reason: 'Now approve B and the profile.', selectedRecordIds: ['b'], selectProfile: true, expectedCapsuleVersion: 2 }, deps(db));
    expect(second?.card.state).toBe('applied'); expect(second?.card.cognitiveDecisionHistory).toHaveLength(2);
    expect(second?.capsule.cognition).toMatchObject({ profile: 'language', version: '3.0.0' });
  });
  it('stages native registry drafts in the caller transaction and preserves idempotent owner edits', async () => {
    const db = architectDb(); db.rejectUndefined = true;
    const cognition = createCognitiveCapsule('publisher/native', '1.0.0');
    const input = { cognition, registryName: cognition.capsuleId, registryVersion: cognition.version, artifactDigest: `sha256:${'a'.repeat(64)}` };
    const transactionSpy = vi.spyOn(db, 'runTransaction');
    let rolledBackId = '';
    await expect(db.runTransaction(async (transaction) => {
      const draft = await stageRegistryCapsuleInstallation('u1', input, deps(db), transaction as never);
      rolledBackId = draft.draftCapsuleId;
      throw new Error('Registry compare-and-swap failed.');
    })).rejects.toThrow(/compare-and-swap/);
    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(await getCapsule('u1', rolledBackId, deps(db))).toBeNull();
    const first = await stageRegistryCapsuleInstallation('u1', input, deps(db));
    const saved = await getCapsule('u1', first.draftCapsuleId, deps(db));
    expect(saved).toMatchObject({ access: { visibility: 'private' }, activeForSituationIds: [] });
    expect(saved?.cognition).toBeUndefined();
    await bumpCapsuleVersion('u1', first.draftCapsuleId, { label: 'Owner edited draft label' }, deps(db));
    const second = await stageRegistryCapsuleInstallation('u1', { ...input, sourceEnvelopeVersion: 12 }, deps(db));
    expect(second).toEqual(first);
    expect((await getCapsule('u1', second.draftCapsuleId, deps(db)))?.label).toBe('Owner edited draft label');
  });
  it('enforces fork rights and preserves restricted download permission', async () => {
    const db = architectDb();
    await createCapsule('u1', { capsuleId: 'no-clone', access: { allowClone: false } }, deps(db));
    await expect(forkCapsule('u1', 'no-clone', {}, deps(db))).rejects.toMatchObject({ status: 403 });
    for (const mode of ['organization', 'licensed'] as const) {
      const cognition = { ...createCognitiveCapsule(`rights-${mode}`), rights: { mode } };
      await createCapsule('u1', { capsuleId: cognition.capsuleId, cognition }, deps(db));
      await expect(forkCapsule('u1', cognition.capsuleId, {}, deps(db))).rejects.toMatchObject({ status: 403 });
    }
    const privateCognition = createCognitiveCapsule('private-fork');
    await createCapsule('u1', { capsuleId: privateCognition.capsuleId, cognition: privateCognition, access: { allowDownload: false } }, deps(db));
    expect(await forkCapsule('u1', privateCognition.capsuleId, { capsuleId: 'private-child' }, deps(db))).toMatchObject({ access: { visibility: 'private', allowDownload: false }, cognition: { rights: { mode: 'private' } } });
    await expect(combineCapsules('u1', { capsuleIds: ['no-clone', 'private-fork'] }, deps(db))).rejects.toMatchObject({ status: 403 });
    const combination = await combineCapsules('u1', { capsuleIds: ['private-fork', 'private-child'], capsuleId: 'restricted-composition' }, deps(db));
    expect(combination?.capsule.access.allowDownload).toBe(false);
  });
  it('keeps cognitive knowledge additive, server review-stamped, and stale-gated', async () => {
    const db = architectDb();
    const capsule = await createCapsule('u1', { capsuleId: 'cognitive', humanTacitKnowledge: { practicalHeuristics: ['Keep legacy.'] } }, deps(db));
    const cognition = createCognitiveCapsule(capsule.capsuleId);
    const actor = { type: 'human' as const, id: 'u1', at: '2026-10-03T00:00:00Z' };
    cognition.knowledge.push(KnowledgeSchema.parse({ id: 'rule', kind: 'heuristic', label: 'Check before inferring expenditure', scope: ['budget'], interpretation: 'Authorization alone is insufficient.', rationale: 'Separate approval and actual spending.', when: [{ kind: 'context', key: 'budget-analysis', operator: 'present' }], provenance: { generatedBy: actor, sourceRefs: [] } }));
    const proposal = await createCapsuleReviewCard('u1', capsule.capsuleId, { title: 'Expert lesson', target: 'capsuleEnvelope', sourceType: 'user', proposedEnvelopePatch: { cognition } }, deps(db));
    const older = await createCapsuleReviewCard('u1', capsule.capsuleId, { title: 'Older lesson', target: 'capsuleEnvelope', sourceType: 'user', proposedEnvelopePatch: { cognition } }, deps(db));
    expect((await getCapsule('u1', capsule.capsuleId, deps(db)))?.cognition).toBeUndefined();
    const result = await applyCapsuleReviewCard('u1', capsule.capsuleId, proposal.reviewCardId, { reviewerUid: 'u1', diffHash: 'diff:expertise-review', confirmationReason: 'Checked budget terminology.' }, deps(db));
    expect(result?.capsule.cognition?.knowledge.find((item) => item.id === 'rule')).toMatchObject({ reviewState: 'accepted', provenance: { reviewedBy: { type: 'human', id: 'u1' } } });
    expect(result?.capsule.cognition?.knowledge.find((item) => item.id.startsWith('legacy:'))?.reviewState).toBe('proposed');
    expect(result?.capsule.cognition?.version).toBe('1.1.0');
    expect(result?.capsule.humanTacitKnowledge).toEqual({ practicalHeuristics: ['Keep legacy.'] });
    expect((await getCapsule('u1', capsule.capsuleId, deps(db)))?.cognition).toEqual(result?.capsule.cognition);
    await expect(applyCapsuleReviewCard('u1', capsule.capsuleId, older.reviewCardId, { reviewerUid: 'u1', diffHash: 'diff:expertise-stale', confirmationReason: 'Checked stale proposal.' }, deps(db))).rejects.toThrow(/changed/);
    const bumped = await bumpCapsuleVersion('u1', capsule.capsuleId, { label: 'Updated label' }, deps(db));
    expect(bumped?.cognition).toEqual(result?.capsule.cognition);
    const editedCognition = { ...result!.capsule.cognition!, knowledge: [{ ...result!.capsule.cognition!.knowledge.find((item) => item.id === 'rule')!, label: 'Require disbursement evidence before claiming expenditure' }] };
    const edit = await createCapsuleReviewCard('u1', capsule.capsuleId, { title: 'Revised budget distinction', target: 'capsuleEnvelope', sourceType: 'user', proposedEnvelopePatch: { cognition: editedCognition } }, deps(db));
    const revised = await applyCapsuleReviewCard('u1', capsule.capsuleId, edit.reviewCardId, { reviewerUid: 'u1', diffHash: 'diff:revised-budget-rule', confirmationReason: 'Reviewed changed interpretation.' }, deps(db));
    expect(revised?.capsule.cognition?.version).toBe('2.0.0');
    expect((db.data.get(`users/u1/capsules/${capsule.capsuleId}/versions/v${bumped!.version}`) as { cognition: { version: string } }).cognition.version).toBe('1.1.0');
  });

  it('records need evidence and edit acceptance atomically through the owner review card', async () => {
    const db = architectDb();
    // Match the real Firestore SDK: nested undefined values must never reach a write.
    db.rejectUndefined = true;
    const capsule = await createCapsule('u1', { capsuleId: 'evidence-needed' }, deps(db));
    const cognition = createCognitiveCapsule(capsule.capsuleId);
    cognition.knowledge.push(KnowledgeSchema.parse({ id: 'lesson', kind: 'heuristic', label: 'Contact may continue', scope: ['diplomacy'], interpretation: 'Do not assume rejection terminates contact.', rationale: 'Private contacts can persist after public rejection.', when: [{ kind: 'context', key: 'technical-contact', operator: 'present' }], provenance: { generatedBy: { type: 'human', id: 'u1', at: '2026-10-03T00:00:00Z' }, sourceRefs: [] } }));
    const card = await createCapsuleReviewCard('u1', capsule.capsuleId, { title: 'Expert lesson', sourceType: 'user', target: 'capsuleEnvelope', proposedEnvelopePatch: { cognition } }, deps(db));
    const pending = await decideCognitiveCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, { decision: 'need_evidence', reason: 'Check private contact records.' }, deps(db));
    expect(pending?.card.proposedEnvelopePatch.cognition?.knowledge.find((item) => item.id === 'lesson')).toMatchObject({ reviewState: 'proposed', reviewDecision: 'need_evidence' });
    expect(pending?.capsule.cognition).toBeUndefined();
    const accepted = await decideCognitiveCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, { decision: 'edit_accept', reason: 'Reviewed wording.', edited: { ...cognition.knowledge[0], label: 'Check whether private contact continues' } }, deps(db));
    expect(accepted?.capsule.cognition?.knowledge.find((item) => item.id === 'lesson')).toMatchObject({ label: 'Check whether private contact continues', reviewState: 'accepted', provenance: { reviewedBy: { type: 'human', id: 'u1' } } });
    await expect(decideCognitiveCapsuleReviewCard('u2', capsule.capsuleId, card.reviewCardId, { decision: 'accept', reason: 'Wrong owner.' }, deps(db))).resolves.toBeNull();
  });
  it('pages light inventory without losing rows and rejects a cursor from another owner or filter', async () => {
    const db = new FakeFirestore();
    for (let i = 0; i < 5; i++) await createCapsule('u1', { capsuleId: `page-${i}`, label: `Source ${i}` }, deps(db));
    const first = await listCapsuleInventory('u1', { metadataOnly: true, limit: 2 }, deps(db));
    const second = await listCapsuleInventory('u1', { metadataOnly: true, limit: 2, cursor: first.nextCursor! }, deps(db));
    const third = await listCapsuleInventory('u1', { metadataOnly: true, limit: 2, cursor: second.nextCursor! }, deps(db));
    expect([...first.capsules, ...second.capsules, ...third.capsules].map((row) => row.capsuleId)).toEqual(['page-0', 'page-1', 'page-2', 'page-3', 'page-4']);
    expect(first).toMatchObject({ hasMore: true, summaryScope: 'page', summary: { activeCapsules: 2 } });
    expect(third).toMatchObject({ hasMore: false, nextCursor: null });
    expect(first.capsules.every((row) => !row.v3 && !row.readiness && !row.usage)).toBe(true);
    await expect(listCapsuleInventory('u2', { limit: 2, cursor: first.nextCursor! }, deps(db))).rejects.toThrow(/cursor/i);
    await expect(listCapsuleInventory('u1', { limit: 2, cursor: first.nextCursor!, situationId: 'other' }, deps(db))).rejects.toThrow(/cursor/i);
  });

  it('pages review cards beyond the legacy 100-card window', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', { capsuleId: 'review-pages' }, deps(db));
    for (let i = 0; i < 105; i++) db.data.set(`users/u1/capsules/review-pages/reviewCards/card-${String(i).padStart(3, '0')}`, {
      reviewCardId: `card-${i}`, ownerUid: 'u1', capsuleId: capsule.capsuleId, title: `Card ${i}`, state: 'proposed',
      sourceType: 'source-gap', target: 'capsuleEnvelope', proposedEnvelopePatch: {}, evidence: [],
    });
    const first = await listCapsuleReviewCardsPage('u1', capsule.capsuleId, { limit: 100 }, deps(db));
    const second = await listCapsuleReviewCardsPage('u1', capsule.capsuleId, { limit: 100, cursor: first.nextCursor! }, deps(db));
    expect(first.cards).toHaveLength(100);
    expect(second.cards).toHaveLength(5);
    expect(second.hasMore).toBe(false);
  });

  it('projects only the builder domain without transferring private draft instructions', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'domain-draft', memoryPosture: {
      builderDraft: { domain: 'diplomacy', systemFrame: 'Private instructions', purpose: 'Private purpose' },
      privateNotes: 'Do not transfer to the library list',
    } }, deps(db));
    const inventory = await listCapsuleInventory('u1', { metadataOnly: true, limit: 50 }, deps(db));
    expect(inventory.capsules[0].memoryPosture).toEqual({ builderDraft: { domain: 'diplomacy' } });
    expect(JSON.stringify(inventory)).not.toContain('Private instructions');
  });

  it('rejects a stale whole-field proposal but permits independent reviewed changes', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', { capsuleId: 'stale-proposal', label: 'Original' }, deps(db));
    const proposal = (reviewCardId: string, patch: Record<string, unknown>) => createCapsuleReviewCard('u1', capsule.capsuleId, {
      reviewCardId, title: reviewCardId, sourceType: 'source-gap', target: 'capsuleEnvelope',
      state: 'owner_review', proposedEnvelopePatch: patch,
    }, deps(db));
    const older = await proposal('older-summary', { summary: 'Old proposal' });
    const newer = await proposal('newer-summary', { summary: 'Newly reviewed summary' });
    const independent = await proposal('independent-label', { label: 'Better label' });
    const metadata = { reviewerUid: 'u1', diffHash: 'review-diff', confirmationReason: 'Reviewed the source and approved this change.' };
    await applyCapsuleReviewCard('u1', capsule.capsuleId, newer.reviewCardId, metadata, deps(db));
    await expect(applyCapsuleReviewCard('u1', capsule.capsuleId, older.reviewCardId, metadata, deps(db))).rejects.toThrow(/changed.*proposal|stale/i);
    await applyCapsuleReviewCard('u1', capsule.capsuleId, independent.reviewCardId, metadata, deps(db));
    expect(await getCapsule('u1', capsule.capsuleId, deps(db))).toMatchObject({ summary: 'Newly reviewed summary', label: 'Better label' });
  });

  it('keeps new source documents attached when rebuilding an existing architect capsule', async () => {
    const db = architectDb();
    const input = { capsuleId: 'architect-rebuild', situationId: 'case-a', jobPrompt: 'Inspect synthetic commitments.', domainId: 'generic', documents: [
      { documentId: 'Source_A', title: 'First source', text: 'Actor: Example Council\nThe proposal remains unconfirmed.' },
    ] };
    await createCapsuleArchitectReviewCards('u1', input, deps(db));
    const rebuilt = await createCapsuleArchitectReviewCards('u1', { ...input, documents: [
      ...input.documents, { documentId: 'Source_B', title: 'Second source', text: 'Actor: Example Assembly\nFunding remains unconfirmed.' },
    ] }, deps(db));
    expect(rebuilt.capsule.coreRefs.documentCoreIds).toEqual(['Source_A', 'Source_B']);
    expect(rebuilt.capsule.coreRefs.situationCoreId).toBe('case-a');
  });

  it('retains an architect decision on an unchanged rebuild and reviews materially changed input separately', async () => {
    const db = architectDb();
    const input = { capsuleId: 'architect-decisions', jobPrompt: 'Inspect synthetic commitments.', documents: [
      { documentId: 'Source_A', title: 'First source', text: 'Actor: Example Council\nThe proposal remains unconfirmed.' },
    ] };
    const first = await createCapsuleArchitectReviewCards('u1', input, deps(db));
    const firstCard = first.cards.find((card) => card.target === 'sourceGap')!;
    await applyCapsuleReviewCard('u1', first.capsule.capsuleId, firstCard.reviewCardId, { reviewerUid: 'u1', diffHash: 'reviewed', confirmationReason: 'Checked source.' }, deps(db));
    const repeated = await createCapsuleArchitectReviewCards('u1', input, deps(db));
    expect(repeated.cards.find((card) => card.target === 'sourceGap')).toMatchObject({ reviewCardId: firstCard.reviewCardId, state: 'applied', applyMetadata: { reviewerUid: 'u1' } });
    const changed = await createCapsuleArchitectReviewCards('u1', { ...input, documents: [
      { ...input.documents[0], text: 'Actor: Example Council\nThe proposal is now funded.' },
    ] }, deps(db));
    const changedCard = changed.cards.find((card) => card.target === 'sourceGap')!;
    expect(changedCard.reviewCardId).not.toBe(firstCard.reviewCardId);
    expect(changedCard.state).toBe('proposed');
    expect((await listCapsuleReviewCards('u1', first.capsule.capsuleId, deps(db))).find((card) => card.reviewCardId === firstCard.reviewCardId)?.state).toBe('applied');
  });

  it('does not erase an applied review decision when extraction proposes the same card again', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', { capsuleId: 'repeat-extraction' }, deps(db));
    const input = { reviewCardId: 'stable-review', title: 'Review supplied constraints', sourceType: 'user' as const, target: 'capsuleEnvelope' as const, proposedEnvelopePatch: { summary: 'Reviewed constraints.' } };
    const card = await createCapsuleReviewCard('u1', capsule.capsuleId, input, deps(db));
    await applyCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, { reviewerUid: 'u1', diffHash: 'reviewed', confirmationReason: 'Checked source.' }, deps(db));
    const repeated = await createCapsuleReviewCard('u1', capsule.capsuleId, input, deps(db));
    expect(repeated.state).toBe('applied');
    expect(repeated.applyMetadata).toMatchObject({ reviewerUid: 'u1', confirmationReason: 'Checked source.' });
  });

  it('reads lightweight inventory at the database boundary and retains full evidence on individual reads', async () => {
    const db = new FakeFirestore();
    const largeEvidence = 'private source paragraph '.repeat(6000);
    for (let index = 0; index < 20; index++) {
      await createCapsule('u1', { capsuleId: `large-${index}`, coreRefs: { documentCoreIds: [`doc-${index}`] } }, deps(db));
      const path = `users/u1/capsules/large-${index}`;
      db.data.set(path, { ...db.data.get(path), humanTacitKnowledge: { notes: largeEvidence }, embeddedGraph: { notes: largeEvidence } });
    }

    const inventory = await listCapsuleInventory('u1', { metadataOnly: true }, deps(db));
    expect(inventory.capsules).toHaveLength(20);
    expect(inventory.summary.documentReferences).toBe(20);
    expect(JSON.stringify(inventory).length).toBeLessThan(200_000);
    expect(inventory.capsules.every((capsule) => !capsule.humanTacitKnowledge && !capsule.embeddedGraph && !capsule.v3)).toBe(true);
    expect(db.projections).toHaveLength(1);
    expect(db.projections[0]).toContain('coreRefs');
    expect(db.projections[0]).not.toContain('humanTacitKnowledge');
    expect((await getCapsule('u1', 'large-0', deps(db)))?.humanTacitKnowledge).toEqual({ notes: largeEvidence });
  });

  it('never shares a projected inventory with a request for full details', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'scope-detail', humanTacitKnowledge: { notes: 'Private instructions.' } }, deps(db));
    const [metadata, full] = await Promise.all([
      listCapsuleInventory('u1', { metadataOnly: true }, deps(db)),
      listCapsuleInventory('u1', {}, deps(db)),
    ]);
    expect(metadata.capsules[0].humanTacitKnowledge).toBeUndefined();
    expect(full.capsules[0].humanTacitKnowledge).toEqual({ notes: 'Private instructions.' });
  });

  it('persists review evidence without optional undefined fields', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', { capsuleId: 'evidence-review' }, deps(db));
    db.rejectUndefined = true;
    await expect(createCapsuleReviewCard('u1', capsule.capsuleId, {
      title: 'Review source', sourceType: 'agent', target: 'sourceGap',
      evidence: [{ id: 'source-1', label: 'Source', advisory: true }],
      proposedEnvelopePatch: { summary: 'Inspected source' },
    }, deps(db))).resolves.toMatchObject({ state: 'proposed' });
  });

  it.each(['batch', 'transaction'])('approves a new review card with Firestore-valid writes through %s', async (mode) => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', { capsuleId: 'approval-review' }, deps(db));
    const card = await createCapsuleReviewCard('u1', capsule.capsuleId, {
      title: 'Review summary', sourceType: 'agent', target: 'sourceGap', evidence: [],
      proposedEnvelopePatch: { summary: 'Human-reviewed summary' },
    }, deps(db));
    db.rejectUndefined = true;
    if (mode === 'transaction') {
      Object.assign(db, { runTransaction: async (callback: (tx: {
        get: (ref: FakeDoc) => ReturnType<FakeDoc['get']>;
        set: ReturnType<FakeFirestore['batch']>['set'];
      }) => Promise<unknown>) => {
        const batch = db.batch();
        const result = await callback({ get: (ref) => ref.get(), set: batch.set });
        await batch.commit();
        return result;
      } });
    }
    const result = await applyCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, {
      reviewerUid: 'u1', diffHash: 'review-diff', confirmationReason: 'Inspected the source.',
    }, deps(db));
    expect(result?.card.state).toBe('applied');
    expect(result?.card).not.toHaveProperty('rejectionMetadata');
    expect((await getCapsule('u1', capsule.capsuleId, deps(db)))?.version).toBe(capsule.version + 1);
  });

  it('shares pending inventory work while preserving per-request archive visibility and fresh later reads', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'active' }, deps(db));
    await createCapsule('u1', { capsuleId: 'archived' }, deps(db));
    await archiveCapsule('u1', 'archived', deps(db));
    const read = vi.spyOn(FakeCollection.prototype, 'get');
    try {
      const [active, all] = await Promise.all([
        listCapsuleInventory('u1', {}, deps(db)),
        listCapsuleInventory('u1', { includeArchived: true }, deps(db)),
      ]);
      expect(read).toHaveBeenCalledTimes(1);
      expect(active.capsules.map((capsule) => capsule.capsuleId)).toEqual(['active']);
      expect(all.capsules.map((capsule) => capsule.capsuleId).sort()).toEqual(['active', 'archived']);
      expect(active.summary).toEqual(all.summary);
      await createCapsule('u1', { capsuleId: 'new' }, deps(db));
      const fresh = await listCapsuleInventory('u1', {}, deps(db));
      expect(read).toHaveBeenCalledTimes(2);
      expect(fresh.capsules.map((capsule) => capsule.capsuleId)).toContain('new');
    } finally { read.mockRestore(); }
  });

  it('isolates concurrent inventories by owner, database identity, and situation', async () => {
    const db = new FakeFirestore();
    const otherDb = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'first', coreRefs: { situationCoreId: 'case-a' } }, deps(db));
    await createCapsule('u1', { capsuleId: 'second', coreRefs: { situationCoreId: 'case-b' } }, deps(db));
    await createCapsule('u2', { capsuleId: 'other-owner' }, deps(db));
    await createCapsule('u1', { capsuleId: 'other-database' }, deps(otherDb));
    const results = await Promise.all([
      listCapsuleInventory('u1', { situationId: 'case-a' }, deps(db)),
      listCapsuleInventory('u1', { situationId: 'case-b' }, deps(db)),
      listCapsuleInventory('u2', {}, deps(db)),
      listCapsuleInventory('u1', {}, deps(db)),
      listCapsuleInventory('u1', {}, deps(otherDb)),
    ]);
    expect(results.map((result) => result.capsules.map((capsule) => capsule.capsuleId).sort()))
      .toEqual([['first'], ['second'], ['other-owner'], ['first', 'second'], ['other-database']]);
  });

  it('cleans up a shared failed inventory read so a later request can retry', async () => {
    const db = new FakeFirestore();
    const read = vi.spyOn(FakeCollection.prototype, 'get').mockRejectedValueOnce(new Error('temporary read failure'));
    try {
      const results = await Promise.allSettled([
        listCapsuleInventory('u1', {}, deps(db)),
        listCapsuleInventory('u1', { includeArchived: true }, deps(db)),
      ]);
      expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected']);
      expect(read).toHaveBeenCalledTimes(1);
      await expect(listCapsuleInventory('u1', {}, deps(db))).resolves.toMatchObject({ capsules: [] });
      expect(read).toHaveBeenCalledTimes(2);
    } finally { read.mockRestore(); }
  });

  it('queries only capsules linked to the case, retaining active links and deduplicating matches', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'direct', coreRefs: { situationCoreId: 'case-a' }, activeForSituationIds: ['case-a'] }, deps(db));
    await createCapsule('u1', { capsuleId: 'attached', coreRefs: { situationCoreId: 'case-b' }, activeForSituationIds: ['case-a'] }, deps(db));
    await createCapsule('u1', { capsuleId: 'unrelated', coreRefs: { situationCoreId: 'case-b' } }, deps(db));
    const capsules = await listCapsules('u1', { situationId: 'case-a' }, deps(db));
    expect(capsules.map((capsule) => capsule.capsuleId).sort()).toEqual(['attached', 'direct']);
    expect(db.queries).toEqual([
      ['coreRefs.situationCoreId', '==', 'case-a'],
      ['activeForSituationIds', 'array-contains', 'case-a'],
    ]);
  });
  it('seeds just one requested starter and preserves an existing user snapshot', async () => {
    const db = new FakeFirestore();
    const id = CAPSULE_STARTER_DEFINITIONS[0].starterId;
    const first = await seedStarterCapsules('u1', deps(db), { starterId: id });
    expect(first.created).toBe(1);
    expect(first.capsules).toHaveLength(1);
    expect(await listCapsules('u1', {}, deps(db))).toHaveLength(1);
    await db.collection('users').doc('u1').collection('capsules').doc(id).set({ label: 'My edited capsule' }, { merge: true });
    const second = await seedStarterCapsules('u1', deps(db), { starterId: id });
    expect(second.existing).toBe(1);
    expect(second.capsules[0].label).toBe('My edited capsule');
    await expect(seedStarterCapsules('u1', deps(db), { starterId: 'nonexistent-starter' })).rejects.toThrow('Unknown starter');
  });
  it('lists owner-scoped proposals and prevents overwriting a completed review decision', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', { capsuleId: 'review-safety', label: 'Review safety' }, deps(db));
    const card = await createCapsuleReviewCard('u1', capsule.capsuleId, {
      title: 'Proposed summary', sourceType: 'user', target: 'capsuleEnvelope',
      proposedEnvelopePatch: { summary: 'Reviewed summary' },
    }, deps(db));
    expect((await listCapsuleReviewCards('u1', capsule.capsuleId, deps(db))).map((item) => item.reviewCardId)).toEqual([card.reviewCardId]);
    expect(await listCapsuleReviewCards('u2', capsule.capsuleId, deps(db))).toEqual([]);
    const metadata = { reviewerUid: 'u1', confirmationReason: 'Checked against the source', diffHash: 'diff:test' };
    await applyCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, metadata, deps(db));
    await expect(applyCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, metadata, deps(db))).rejects.toThrow(/already decided/i);
    await expect(rejectCapsuleReviewCard('u1', capsule.capsuleId, card.reviewCardId, metadata, deps(db))).rejects.toThrow(/already decided/i);
    expect((await getCapsule('u1', capsule.capsuleId, deps(db)))?.version).toBe(2);
  });
  it('derives embedded graph stats from reviewed nodes and edges', () => {
    const stats = deriveCapsuleGraphStats({
      embeddedGraph: {
        nodes: [
          { id: 'n1', entityType: 'Actor' },
          { id: 'n2', entityType: 'Claim' },
          { id: 'n3', type: 'Actor' },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2' },
          { id: 'e2', source: 'n3', target: 'n2' },
        ],
      },
    }, '2026-06-11T00:00:00.000Z');

    expect(stats).toEqual({
      nodeCount: 3,
      edgeCount: 2,
      entityTypeCounts: { Actor: 2, Claim: 1 },
      updatedAt: '2026-06-11T00:00:00.000Z',
    });
  });

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

  it('loads a legacy default capsule with missing coreRefs without throwing', async () => {
    const db = new FakeFirestore();
    db.data.set('users/u1/capsules/default', {
      capsuleId: 'default',
      ownerUid: 'u1',
      label: 'Legacy default capsule',
      activeForSituationIds: ['workspace'],
      version: 1,
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    });

    const result = await getOrMigrateDefaultCapsule('u1', deps(db));

    expect(result.migrated).toBe(false);
    expect(result.persisted).toBe(true);
    expect(result.capsule.coreRefs.situationCoreId).toBeNull();
    expect(result.capsule.coreRefs.sourceCoreIds).toEqual([]);
    expect(() => capsuleToStack(result.capsule)).not.toThrow();
    expect(capsuleToStack(result.capsule).sourceIds).toEqual([]);
  });

  it('keeps owner isolation by storing capsules under each user document', async () => {
    const db = new FakeFirestore();
    await createCapsule('u1', { capsuleId: 'cap-1', coreRefs: { situationCoreId: 'sit-1' } }, deps(db));
    db.data.set('users/u1/capsules/poisoned-cap', {
      capsuleId: 'poisoned-cap',
      ownerUid: 'u2',
      label: 'Other user capsule',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      version: 1,
    });

    expect(await getCapsule('u1', 'cap-1', deps(db))).not.toBeNull();
    expect(await getCapsule('u2', 'cap-1', deps(db))).toBeNull();
    expect(await getCapsule('u1', 'poisoned-cap', deps(db))).toBeNull();
    expect((await listCapsules('u1', {}, deps(db))).map((capsule) => capsule.capsuleId)).toEqual(['cap-1']);
    expect((await listCapsuleInventory('u1', {}, deps(db))).capsules.map((capsule) => capsule.capsuleId)).toEqual(['cap-1']);
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
      access: { visibility: 'public', allowClone: true, allowCommunityRating: true },
      latestGateState: 'applied',
      readinessSummary: { reviewRequired: false, reviewCardCount: 2 },
    }, deps(db));
    const fork = await forkCapsule('u1', parent.capsuleId, { capsuleId: 'cap-2' }, deps(db));

    expect(fork?.parentCapsuleId).toBe(parent.capsuleId);
    expect(fork?.forkedFromVersion).toBe(parent.version);
    expect(fork?.version).toBe(1);
    expect(fork?.access.visibility).toBe('private');
    expect(fork?.latestGateState).toBe('none');
    expect(fork?.readinessSummary?.reviewRequired).toBe(false);
    expect(fork?.readinessSummary?.reviewCardCount).toBe(0);
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
    expect(capsules.every((capsule) => capsule.community.averageRating === null && capsule.community.userRating === null)).toBe(true);
    expect(capsules.every((capsule) => capsule.community.ratingCount === 0)).toBe(true);
    expect(capsules.every((capsule) => !capsule.community.listedInMarketplace && !capsule.community.favorite)).toBe(true);
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

  it('promotes Ask source gaps into review-gated capsule review cards', async () => {
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
    expect(result?.reviewCards).toHaveLength(2);
    expect(result?.proposals.every((proposal) => proposal.reviewStatus === 'proposed')).toBe(true);
    expect(result?.proposals.every((proposal) => proposal.target === 'sourcePack')).toBe(true);
    const proposal = result!.proposals[0];
    const cardPath = `users/u1/capsules/starter-situation-diplomatic-options/reviewCards/${proposal.reviewCardId}`;
    const card = db.data.get(cardPath);
    expect(card).toMatchObject({
      state: 'proposed',
      sourceType: 'source-gap',
      target: 'sourceGap',
      title: proposal.title,
    });
    expect((card?.proposedEnvelopePatch as { sourcePosture?: { sourceGaps?: string[] } }).sourcePosture?.sourceGaps).toContain(proposal.gap);
    expect((card?.proposedEnvelopePatch as { sourcePosture?: { sourceGapPromotion?: { generatedBy?: string; runId?: string | null; source?: string } } }).sourcePosture?.sourceGapPromotion).toMatchObject({
      generatedBy: 'ask-praxis',
      runId: 'run-123',
      source: 'source-gap-promotion',
    });
    expect(result?.capsule.trust.level).toBe('amber');
    expect(result?.capsule.trust.recommendations).toContain('Review proposed source-pack gaps before the next external handoff.');
  });

  it('upserts Ask gap promotions with deterministic review-card ids and origin metadata', async () => {
    const db = new FakeFirestore();
    await seedStarterCapsules('u1', deps(db));

    const input = {
      kind: 'sourcing' as const,
      title: 'Source gap: opposition negotiating position',
      rationale: 'Ask PRAXIS found no current source for the opposition negotiating position.',
      suggestedChange: 'Attach a current primary source for the opposition negotiating position.',
      origin: {
        type: 'ask_gap' as const,
        threadId: 'ask-thread-1',
        turnId: 'turn-1',
        gapIndex: 0,
        gapHash: 'gap-hash-1',
      },
    };

    const first = await promoteCapsuleSourceGaps('u1', 'starter-situation-diplomatic-options', input, deps(db));
    const second = await promoteCapsuleSourceGaps('u1', 'starter-situation-diplomatic-options', input, deps(db));

    expect(first?.proposals).toHaveLength(1);
    expect(second?.proposals).toHaveLength(1);
    expect(second?.proposals[0].proposalId).toBe(first?.proposals[0].proposalId);
    expect(second?.reviewCards[0].reviewCardId).toBe(first?.reviewCards[0].reviewCardId);

    const reviewCardPaths = Array.from(db.data.keys()).filter((path) =>
      path.startsWith('users/u1/capsules/starter-situation-diplomatic-options/reviewCards/'),
    );
    expect(reviewCardPaths).toHaveLength(1);

    const card = db.data.get(reviewCardPaths[0]);
    expect(card).toMatchObject({
      state: 'proposed',
      sourceType: 'source-gap',
      target: 'sourceGap',
    });
    expect((card?.proposedEnvelopePatch as { sourcePosture?: { sourceGapPromotion?: { source?: string; origin?: Record<string, unknown> } } }).sourcePosture?.sourceGapPromotion).toMatchObject({
      source: 'ask-gap-promotion',
      origin: {
        type: 'ask_gap',
        threadId: 'ask-thread-1',
        turnId: 'turn-1',
        gapIndex: 0,
        gapHash: 'gap-hash-1',
      },
    });
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
    expect(applied?.capsule.graphStats).toMatchObject({
      nodeCount: 1,
      edgeCount: 0,
      entityTypeCounts: { Actor: 1 },
      updatedAt: '2026-05-14T00:00:00.000Z',
    });
    expect(db.data.get(`users/u1/capsules/${capsule.capsuleId}`)?.graphStats).toMatchObject({
      nodeCount: 1,
      entityTypeCounts: { Actor: 1 },
    });
  });

  it('invalidates reviewed graph elements for approved replacements and human override deletes', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', {
      capsuleId: 'cap-graph-invalidation',
      label: 'Graph invalidation capsule',
      embeddedGraph: {
        provider: 'graphlite',
        projectionId: 'cap-graph-invalidation-projection',
        status: 'reviewed',
        namedGraph: 'capsule_cap_graph_invalidation',
        advisoryOnly: true,
        canonicalStore: 'Firestore ContextCapsules',
        promotionGate: 'Human review-card approval required before canonical graph promotion.',
        nodes: [
          {
            id: 'claim-old',
            label: 'Old claim',
            entityType: 'Claim',
            reviewState: 'reviewed',
            confidence: 0.82,
            confidenceKind: 'ASSESSED',
            recordedAt: '2026-05-01T00:00:00.000Z',
          },
          {
            id: 'claim-human',
            label: 'Human-reviewed claim',
            entityType: 'Claim',
            reviewState: 'reviewed',
            confidence: 0.7,
            confidenceKind: 'INFERRED',
            recordedAt: '2026-05-02T00:00:00.000Z',
          },
        ],
        edges: [],
      },
    } as Parameters<typeof createCapsule>[1], deps(db));

    const replacementCard = await proposeCapsuleGraphNodeChange('u1', capsule.capsuleId, {
      operation: 'create',
      node: {
        id: 'claim-new',
        label: 'New claim',
        entityType: 'Claim',
        confidence: 0.9,
        confidenceKind: 'ASSESSED',
        sourceReceiptIds: ['claim-new-source'],
      },
      supersedesElementId: 'claim-old',
      invalidationReason: 'CONTRADICTED',
      derivedFrom: ['claim-new-source'],
      rationale: 'The new reviewed source contradicts the prior claim.',
      reason: 'Replace the contradicted claim after review.',
    } as Parameters<typeof proposeCapsuleGraphNodeChange>[2], deps(db));

    const replaced = await applyCapsuleReviewCard('u1', capsule.capsuleId, replacementCard.reviewCardId, {
      reviewerUid: 'reviewer-1',
      diffHash: 'diff:graph:replacement',
      confirmationReason: 'Owner selected the replacement claim after reviewing the contradiction.',
    }, deps(db));
    const replacedGraph = replaced?.capsule.embeddedGraph as { nodes?: Array<Record<string, unknown>> } | undefined;
    const replacedNodes = replacedGraph?.nodes ?? [];
    expect(replacedNodes.find((node) => node.id === 'claim-old')).toMatchObject({
      id: 'claim-old',
      invalidatedAt: '2026-05-14T00:00:00.000Z',
      invalidationReason: 'CONTRADICTED',
      supersededBy: 'claim-new',
    });
    expect(replacedNodes.find((node) => node.id === 'claim-new')).toMatchObject({
      id: 'claim-new',
      recordedAt: '2026-05-14T00:00:00.000Z',
      rationale: 'The new reviewed source contradicts the prior claim.',
      derivedFrom: ['claim-new-source'],
    });

    const deleteCard = await proposeCapsuleGraphNodeChange('u1', capsule.capsuleId, {
      operation: 'delete',
      nodeId: 'claim-human',
      node: { id: 'claim-human', entityType: 'Claim' },
      reason: 'Human reviewer rejected the approved claim.',
    } as Parameters<typeof proposeCapsuleGraphNodeChange>[2], deps(db));
    const deleted = await applyCapsuleReviewCard('u1', capsule.capsuleId, deleteCard.reviewCardId, {
      reviewerUid: 'reviewer-1',
      diffHash: 'diff:graph:human-override',
      confirmationReason: 'Owner rejected this approved graph element.',
    }, deps(db));
    const deletedGraph = deleted?.capsule.embeddedGraph as { nodes?: Array<Record<string, unknown>> } | undefined;
    const deletedNode = (deletedGraph?.nodes ?? []).find((node) => node.id === 'claim-human');
    expect(deletedNode).toMatchObject({
      id: 'claim-human',
      invalidatedAt: '2026-05-14T00:00:00.000Z',
      invalidationReason: 'HUMAN_OVERRIDE',
    });

    const secondDeleteCard = await proposeCapsuleGraphNodeChange('u1', capsule.capsuleId, {
      operation: 'delete',
      nodeId: 'claim-human',
      node: { id: 'claim-human', entityType: 'Claim' },
      invalidationReason: 'SOURCE_RETRACTED',
      reason: 'Second invalidation attempt should keep the first reason.',
    } as Parameters<typeof proposeCapsuleGraphNodeChange>[2], deps(db));
    const secondDeleted = await applyCapsuleReviewCard('u1', capsule.capsuleId, secondDeleteCard.reviewCardId, {
      reviewerUid: 'reviewer-1',
      diffHash: 'diff:graph:second-human-override',
      confirmationReason: 'Second invalidation attempt.',
    }, deps(db));
    const secondDeletedGraph = secondDeleted?.capsule.embeddedGraph as { nodes?: Array<Record<string, unknown>> } | undefined;
    const secondDeletedNode = (secondDeletedGraph?.nodes ?? []).find((node) => node.id === 'claim-human');
    expect(secondDeletedNode).toMatchObject({
      id: 'claim-human',
      invalidatedAt: '2026-05-14T00:00:00.000Z',
      invalidationReason: 'HUMAN_OVERRIDE',
    });
  });

  it('files contradiction review cards for inferred AI graph proposals and leaves both elements live until decision', async () => {
    const db = new FakeFirestore();
    const capsule = await createCapsule('u1', {
      capsuleId: 'cap-graph-contradiction',
      label: 'Graph contradiction capsule',
      embeddedGraph: {
        provider: 'graphlite',
        projectionId: 'cap-graph-contradiction-projection',
        status: 'reviewed',
        namedGraph: 'capsule_cap_graph_contradiction',
        advisoryOnly: true,
        canonicalStore: 'Firestore ContextCapsules',
        promotionGate: 'Human review-card approval required before canonical graph promotion.',
        nodes: [{
          id: 'claim-existing',
          label: 'Existing claim',
          entityType: 'Claim',
          reviewState: 'reviewed',
          confidence: 0.76,
          confidenceKind: 'INFERRED',
          recordedAt: '2026-05-01T00:00:00.000Z',
        }],
        edges: [],
      },
    } as Parameters<typeof createCapsule>[1], deps(db));

    const contradictionCard = await proposeCapsuleGraphEdgeChange('u1', capsule.capsuleId, {
      operation: 'create',
      edge: {
        id: 'edge-contradiction-1',
        source: 'claim-new',
        target: 'claim-existing',
        label: 'contradicts',
        relationshipType: 'CONTRADICTS',
        confidence: 0.81,
        confidenceKind: 'INFERRED',
        judgeRationale: 'The proposed claim and existing claim cannot both be true for the same period.',
        sourceReceiptIds: ['claim-new-source'],
        generatedBy: {
          actorType: 'model',
          actorId: 'model-matrix:test',
          at: '2026-05-14T00:00:00.000Z',
          activity: 'proposal',
        },
      },
      derivedFrom: ['claim-new-source'],
      rationale: 'AI contradiction pass found mutually exclusive claim wording.',
      reason: 'Queue human contradiction review.',
    } as Parameters<typeof proposeCapsuleGraphEdgeChange>[2], deps(db));

    expect(contradictionCard.title).toMatch(/contradiction/i);
    const graphProposals = ((contradictionCard.proposedEnvelopePatch.memoryPosture as Record<string, unknown>).graphProposals ?? []) as Array<Record<string, unknown>>;
    expect(graphProposals.at(-1)).toMatchObject({
      kind: 'edge',
      contradictionReviewRequired: true,
      payload: expect.objectContaining({
        relationshipType: 'CONTRADICTS',
        judgeRationale: 'The proposed claim and existing claim cannot both be true for the same period.',
        rationale: 'AI contradiction pass found mutually exclusive claim wording.',
        derivedFrom: ['claim-new-source'],
      }),
    });
    const persisted = await getCapsule('u1', capsule.capsuleId, deps(db));
    const persistedGraph = persisted?.embeddedGraph as {
      nodes?: Array<Record<string, unknown>>;
      edges?: Array<Record<string, unknown>>;
    } | undefined;
    expect((persistedGraph?.nodes ?? []).find((node) => node.id === 'claim-existing')).not.toHaveProperty('invalidatedAt');
    expect(persistedGraph?.edges ?? []).toEqual([]);
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

function architectDb() {
  const db = new FakeFirestore();
  db.data.set('users/u1', { uid: 'u1' });
  return Object.assign(db, { runTransaction: async <T>(work: (transaction: {
    get: (ref: FakeDoc) => ReturnType<FakeDoc['get']>;
    set: (ref: FakeDoc, value: Record<string, unknown>, options?: { merge?: boolean }) => void;
  }) => Promise<T>): Promise<T> => {
    const writes: Array<() => void> = [];
    const result = await work({ get: (ref) => ref.get(), set: (ref, value, options) => {
      writes.push(() => ref.setSync(value, options));
    } });
    writes.forEach((write) => write());
    return result;
  } });
}

class FakeFirestore {
  data = new Map<string, Record<string, unknown>>();
  queries: unknown[][] = [];
  projections: string[][] = [];
  rejectUndefined = false;

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
  constructor(private db: FakeFirestore, private path: string, private maxDocs?: number, private selectedFields?: string[], private afterId?: string, private byId = false) {}

  select(...fields: string[]) {
    this.db.projections.push(fields);
    return new FakeCollection(this.db, this.path, this.maxDocs, fields, this.afterId, this.byId);
  }

  doc(id = `doc-${this.db.data.size + 1}`) {
    return new FakeDoc(this.db, `${this.path}/${id}`, id);
  }

  limit(maxDocs: number) {
    return new FakeCollection(this.db, this.path, maxDocs, this.selectedFields, this.afterId, this.byId);
  }

  orderBy(field?: unknown) {
    return new FakeCollection(this.db, this.path, this.maxDocs, this.selectedFields, this.afterId, typeof field === 'object');
  }

  startAfter(id: string) {
    return new FakeCollection(this.db, this.path, this.maxDocs, this.selectedFields, id, this.byId);
  }

  where(field: string, operation: string, value: string) {
    this.db.queries.push([field, operation, value]);
    return { get: async () => {
      const snapshot = await this.get();
      return { docs: snapshot.docs.filter((doc) => {
        const fieldValue = field.split('.').reduce<unknown>((parent, key) => (parent as Record<string, unknown>)?.[key], doc.data());
        return operation === 'array-contains' ? Array.isArray(fieldValue) && fieldValue.includes(value) : fieldValue === value;
      }) };
    } };
  }

  async get() {
    const prefix = `${this.path}/`;
    let entries = Array.from(this.db.data.entries())
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .filter(([path]) => !this.afterId || path.slice(prefix.length) > this.afterId);
    if (this.byId) entries = entries.sort(([a], [b]) => a.localeCompare(b));
    const docs = entries
      .map(([path, value]) => new FakeSnapshot(true, this.selectedFields
        ? projectedFields(value, this.selectedFields)
        : value, path.split('/').pop() ?? 'unknown'));
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
    if (this.db.rejectUndefined) assertFirestoreDefined(value, this.path);
    const current = this.db.data.get(this.path) ?? {};
    this.db.data.set(this.path, options?.merge ? { ...current, ...value } : value);
  }
}

function projectedFields(value: Record<string, unknown>, fields: string[]) {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const keys = field.split('.');
    const selected = keys.reduce<unknown>((parent, key) => (parent as Record<string, unknown>)?.[key], value);
    if (selected === undefined) continue;
    let target = result;
    for (const key of keys.slice(0, -1)) {
      target[key] ??= {};
      target = target[key] as Record<string, unknown>;
    }
    target[keys[keys.length - 1]] = selected;
  }
  return result;
}

function assertFirestoreDefined(value: unknown, path: string): void {
  if (value === undefined) throw new Error(`Firestore rejects undefined at ${path}`);
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) assertFirestoreDefined(child, `${path}.${key}`);
  }
}

class FakeSnapshot {
  constructor(public exists: boolean, private value: Record<string, unknown>, public id: string) {}

  data() {
    return this.value;
  }
}
