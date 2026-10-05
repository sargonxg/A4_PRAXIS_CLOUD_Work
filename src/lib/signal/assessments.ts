import { z } from 'zod';
import { pointer, type SignalDesk, type SignalNarrative, type SignalAssessment } from './schema';
import { assertCurrentSignalContext, digest, isCurrentSignalClaim, newId, SignalError, validateSpan } from './domain';

const linkedClaims = z.array(pointer).min(1).max(30);
const alternatives = z.array(z.string().trim().min(1).max(1000)).min(1).max(8);
export const NarrativeInputSchema = z.object({ title: z.string().trim().min(3).max(240), frame: z.string().trim().min(5).max(2000), claimIds: linkedClaims, alternatives, previousId: pointer.optional() }).strict();
export const AssessmentInputSchema = z.object({ conclusion: z.string().trim().min(10).max(3000), changeReason: z.string().trim().min(5).max(2000), claimIds: linkedClaims, alternatives, uncertainty: z.string().trim().min(5).max(2000), invalidators: alternatives }).strict();
function checkClaims(desk: SignalDesk, ids: string[]) {
  assertCurrentSignalContext(desk);
  const contextDigest = desk.contextReceipt ? digest(desk.contextReceipt) : null;
  if (new Set(ids).size !== ids.length || ids.some(id => {
    const claim = desk.claims.find(c => c.id === id);
    const review = [...desk.reviews].reverse().find(r => r.targetId === id);
    if (!claim || claim.status !== 'accepted' || (claim.contextEpoch ?? 0) !== (desk.contextEpoch ?? 0) || !isCurrentSignalClaim(desk, claim) || (claim.contextDigest ?? null) !== contextDigest || !review || review.decision !== 'accepted' || review.digest !== claim.digest || review.evidenceHash !== claim.evidenceHash || review.contextDigest !== contextDigest || !review.reviewerUid) return true;
    const source = desk.sources.find(s => s.id === claim.sourceRevisionId)!;
    try { validateSpan(source, claim); return false; } catch { return true; }
  })) throw new SignalError(422, 'Choose distinct current accepted source readings for this interpretation.');
}
export function proposeNarrative(desk: SignalDesk, input: unknown, now: string) {
  assertCurrentSignalContext(desk);
  const parsed = NarrativeInputSchema.parse(input); checkClaims(desk, parsed.claimIds);
  const previous = parsed.previousId ? desk.narratives?.find(n => n.id === parsed.previousId) : undefined;
  if (parsed.previousId && !previous) throw new SignalError(404, 'Narrative predecessor unavailable.');
  const records = desk.narratives ??= []; if (records.length >= 30) throw new SignalError(413, 'Narrative history capacity reached.');
  const record: SignalNarrative = { ...parsed, id: newId(), version: (previous?.version ?? 0) + 1, status: 'proposed', createdAt: now, digest: digest({ ...parsed, claimDigests: parsed.claimIds.map(id => desk.claims.find(c => c.id === id)!.digest), panel: desk.sourcePack.version }) };
  records.push(record); return record;
}
export function proposeAssessment(desk: SignalDesk, input: unknown, now: string) {
  assertCurrentSignalContext(desk);
  const parsed = AssessmentInputSchema.parse(input); checkClaims(desk, parsed.claimIds);
  const records = desk.assessments ??= []; if (records.length >= 30) throw new SignalError(413, 'Assessment history capacity reached.');
  const previous = [...records].reverse().find(a => a.status === 'accepted');
  const record: SignalAssessment = { ...parsed, id: newId(), status: 'proposed', createdAt: now, previousId: previous?.id ?? null, contextReceipt: structuredClone(desk.contextReceipt ?? null), sourcePackVersion: desk.sourcePack.version, digest: digest({ ...parsed, previousId: previous?.id ?? null, claimDigests: parsed.claimIds.map(id => desk.claims.find(c => c.id === id)!.digest), panel: desk.sourcePack.version, context: desk.contextReceipt ?? null }) };
  records.push(record); return record;
}
export function reviewInterpretation(desk: SignalDesk, uid: string, input: { targetId: string; digest: string; decision: 'accepted' | 'rejected' | 'unresolved'; rationale: string }, now: string) {
  assertCurrentSignalContext(desk);
  const target = desk.assessments?.find(a => a.id === input.targetId) ?? desk.narratives?.find(n => n.id === input.targetId);
  if (!target) throw new SignalError(404, 'Interpretation unavailable.');
  if (target.digest !== input.digest || target.stale) throw new SignalError(409, 'Interpretation changed. Reopen it for review.');
  checkClaims(desk, target.claimIds);
  if (!('contextReceipt' in target)) {
    const parsed = NarrativeInputSchema.parse({ title: target.title, frame: target.frame, claimIds: target.claimIds, alternatives: target.alternatives, ...(target.previousId ? { previousId: target.previousId } : {}) });
    if (target.digest !== digest({ ...parsed, claimDigests: target.claimIds.map(id => desk.claims.find(c => c.id === id)!.digest), panel: desk.sourcePack.version })) throw new SignalError(409, 'Narrative inputs or source panel changed.');
  }
  if ('contextReceipt' in target && (digest(target.contextReceipt) !== digest(desk.contextReceipt ?? null) || target.sourcePackVersion !== desk.sourcePack.version)) throw new SignalError(409, 'Assessment context or source panel changed.');
  if ('contextReceipt' in target) {
    const parsed = AssessmentInputSchema.parse({ conclusion: target.conclusion, changeReason: target.changeReason, claimIds: target.claimIds, alternatives: target.alternatives, uncertainty: target.uncertainty, invalidators: target.invalidators });
    if (target.digest !== digest({ ...parsed, previousId: target.previousId, claimDigests: target.claimIds.map(id => desk.claims.find(c => c.id === id)!.digest), panel: target.sourcePackVersion, context: target.contextReceipt })) throw new SignalError(409, 'Assessment content or predecessor changed.');
  }
  if (!input.rationale.trim()) throw new SignalError(422, 'Review rationale required.');
  if (desk.reviews.length >= 400) throw new SignalError(413, 'Review history capacity reached.');
  desk.reviews.push({ id: newId(), targetId: target.id, digest: target.digest, evidenceHash: digest(target.claimIds.map(id => desk.claims.find(c => c.id === id)?.evidenceHash)), contextDigest: desk.contextReceipt ? digest(desk.contextReceipt) : null, decision: input.decision, rationale: input.rationale, reviewerUid: uid, createdAt: now });
  if (target.status !== input.decision) desk.briefs.filter(b => b.manifest.assessment?.id === target.id || b.manifest.narratives?.some(n => n.id === target.id)).forEach(b => { b.stale = true; });
  target.status = input.decision;
}
