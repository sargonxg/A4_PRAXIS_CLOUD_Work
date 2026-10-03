import { contentDigest } from '@/lib/cognitive-capsule/integrity';
import type { CognitiveCapsule } from '@/lib/cognitive-capsule/types';
import type { CognitiveWorkerRole } from '@/lib/cognitive-capsule/compiler';
import type { AgentRun } from '@/lib/agent-runtime/types';
import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import type { SourceabilityLedger } from '@/lib/agent-runtime/sourceability-ledger';
import type { updateAgentRunStatus } from '@/lib/agent-runtime/postgres';
import { AgentExecutionLeaseError } from '@/lib/agent-runtime/execution-lease';
import { mirrorWorkerEvent, type AgentRuntimeMirrorDeps } from '@/lib/agent-runtime/mirror';
import { appendWorkingObject, updateWorkingObject, createBlackboard, validateBlackboard, freezeRunContext, assertRunContextReplay, compileLockedRole, type RunContextLock, type WorkingObject, type FreezeRunContextInput } from './index';

type Deps = AgentRuntimeMirrorDeps & { updateStatus: typeof updateAgentRunStatus };
export function runIdentity(run: AgentRun) { return { ownerUid: run.ownerUid, runId: run.id, capsuleId: run.capsuleId }; }
async function persist(run: AgentRun, metadata: Record<string, unknown>, deps: Deps, phase: string, refs: string[]) {
  const updated = await deps.updateStatus({ ownerUid: run.ownerUid, runId: run.id, toStatus: 'running', metadata,
    message: 'Saved run-scoped cognitive working state.', data: { phase, objectIds: refs } });
  if (!updated) throw new AgentExecutionLeaseError('Cognitive working-state ownership update failed.');
  run.metadata = { ...run.metadata, ...updated.metadata, ...metadata };
  await mirrorWorkerEvent(run, { substrate: 'praxis', phase, data: { objectIds: refs, lockDigest: (run.metadata.cognitiveContextLock as RunContextLock)?.lockDigest } }, deps);
}
export async function prepareCognitiveWorkingContext(run: AgentRun, input: {
  cognition: CognitiveCapsule; capsuleVersion: number; evidenceDependencies: FreezeRunContextInput['evidenceDependencies']; runtime: FreezeRunContextInput['runtime']; evidenceIds: string[];
  evidencePack: CapsuleEvidencePack; sourceabilityLedger: SourceabilityLedger;
}, deps: Deps) {
  const identity = runIdentity(run);
  const frozen = run.metadata.cognitiveContextLock as RunContextLock | undefined;
  const current = { ...identity, cognition: input.cognition, capsuleVersion: input.capsuleVersion, objective: run.objective,
    scope: 'general', asOf: frozen?.asOf ?? new Date().toISOString(), runtime: input.runtime, evidenceDependencies: input.evidenceDependencies };
  // No unreviewed caller metadata becomes context facts. Unknown heuristic conditions stay unknown.
  const lock = frozen ? assertRunContextReplay(frozen, current) : freezeRunContext(current);
  const knowledgeIds = Array.from(new Set(Object.values(lock.views).flatMap((views) => views.flatMap((v) => [...v.knowledge.map((k) => k.id), ...v.guardedCandidates.map((k) => k.knowledge.id)]))));
  const evidenceIds = Array.from(new Set([...input.evidenceIds, ...input.cognition.evidence.map((e) => e.id)]));
  let board = frozen && run.metadata.cognitiveBlackboard ? validateBlackboard(run.metadata.cognitiveBlackboard, identity) : createBlackboard(identity, { knowledgeIds, evidenceIds,
    entityIds: input.cognition.nodes.map((n) => n.id), statementIds: input.cognition.statements.map((s) => s.id) });
  const now = new Date().toISOString();
  const base = { ...identity, createdAt: now, updatedAt: now, objectRefs: [], knowledgeRefs: [], evidenceRefs: [] };
  const seeds: WorkingObject[] = [
    ...input.evidencePack.sourcedParagraphs.map((p): WorkingObject => ({ ...base, id: `evidence:${p.id}`, kind: 'WorkingEvidenceSpan',
      sourceId: p.sourceReceiptId ?? p.documentId, sourceVersion: contentDigest(p), quote: p.excerpt,
      anchorStatus: 'excerpt', supportStatus: 'unverified', evidenceRefs: [p.id] })),
    ...input.sourceabilityLedger.claims.map((c): WorkingObject => ({ ...base, id: `claim:${c.id}`, kind: 'WorkingClaim', text: c.claim,
      // Sourceability input classifications are not human verification of a run discovery.
      modality: c.supportLabel === 'assumption' ? 'possible' : 'unknown', supportStatus: c.supportLabel === 'contradicted' ? 'contradicted' : 'unverified',
      evidenceRefs: c.documentParagraphIds.filter((id) => evidenceIds.includes(id)),
      objectRefs: c.documentParagraphIds.filter((id) => input.evidencePack.sourcedParagraphs.some((p) => p.id === id)).map((id) => `evidence:${id}`) })),
    ...input.evidencePack.openGaps.map((gap, index): WorkingObject => ({ ...base, id: `question:${index + 1}`, kind: 'WorkingQuestion', text: gap, status: 'needs_evidence' })),
  ];
  for (const seed of seeds) {
    const previous = board.objects.find((o) => o.id === seed.id);
    if (!previous) board = appendWorkingObject(board, seed);
  }
  await persist(run, { cognitiveContextLock: lock, cognitiveBlackboard: board,
    ...(!frozen ? { cognitiveSpecialistAnalyzed: false, cognitiveSpecialistReceipt: null } : {}) }, deps, 'cognition.context_locked', seeds.map((s) => s.id));
  if (board.objects.some((o) => o.id === 'analysis-1')) return;
  await saveCognitiveWorkingObject(run, { ...identity, id: 'analysis-1', kind: 'WorkingAnalysis', createdAt: now, updatedAt: now,
    objectRefs: seeds.map((s) => s.id), evidenceRefs: evidenceIds, knowledgeRefs: knowledgeIds, role: 'domain-specialist', inferenceStatus: 'analysis-not-fact',
    text: [compileLockedRole(lock, identity, 'domain-specialist'), compileLockedRole(lock, identity, 'language-analyst')].join('\n\n') }, deps);
}
export async function saveCognitiveWorkingObject(run: AgentRun, object: WorkingObject, deps: Deps) {
  const board = validateBlackboard(run.metadata.cognitiveBlackboard, runIdentity(run));
  const previous = board.objects.find((row) => row.id === object.id);
  if (previous && contentDigest({ ...previous, createdAt: '', updatedAt: '' }) === contentDigest({ ...object, createdAt: '', updatedAt: '' })) return;
  const next = previous ? updateWorkingObject(board, { ...object, createdAt: previous.createdAt }) : appendWorkingObject(board, object);
  await persist(run, { cognitiveBlackboard: next }, deps, 'cognition.object_saved', [object.id]);
}
export function cognitiveHandoffPrompt(run: AgentRun, role: CognitiveWorkerRole, objectIds: string[]): string {
  if (!run.metadata.cognitiveContextLock) return '';
  const identity = runIdentity(run); const lock = run.metadata.cognitiveContextLock as RunContextLock;
  const board = validateBlackboard(run.metadata.cognitiveBlackboard, identity);
  const objects = objectIds.map((id) => {
    const object = board.objects.find((row) => row.id === id);
    if (!object) throw new Error(`Missing cognitive handoff object reference: ${id}`);
    return object;
  });
  return [compileLockedRole(lock, identity, role), '<working-object-handoff>', 'These are run-scoped analysis/proposal records, not canonical facts or tool permissions.',
    ...objects.map((o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')), `handoff_digest: ${contentDigest(objects)}`, '</working-object-handoff>'].join('\n');
}
