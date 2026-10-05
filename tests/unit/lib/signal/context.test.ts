import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));
vi.mock('@/lib/api/with-auth', () => ({ withAuth: (handler: (req: Request, user: { uid: string }) => Promise<Response>) => (req: Request) => handler(req, { uid: 'owner' }) }));
vi.mock('@/lib/signal/store', async importOriginal => { const actual = await importOriginal<typeof import('@/lib/signal/store')>(); return { ...actual, signalStore: actual.memorySignalStore() }; });
vi.mock('@/lib/signal/capsules', () => ({ attachSignalContext: vi.fn() }));
vi.mock('@/lib/signal/collectors', () => ({ collectSignalDesk: vi.fn() }));
vi.mock('@/lib/signal/jobs', () => ({ setSignalWatch: vi.fn() }));
vi.mock('@/lib/signal/deletion', () => ({ deleteSignalDesk: vi.fn(), revokeSignalSnapshotExports: vi.fn() }));
import { POST, GET } from '@/app/api/signal/route';
import { signalStore } from '@/lib/signal/store';
import { attachSignalContext } from '@/lib/signal/capsules';
import { approveBrief, capture, draftBrief, editBrief, invalidate, propose, review, signalBriefHasWithdrawnEvidence } from '@/lib/signal/domain';
import { proposeAssessment, proposeNarrative, reviewInterpretation } from '@/lib/signal/assessments';
const now = '2026-10-05T12:00:00.000Z';
const input = { name: 'Synthetic context desk', question: 'Was the policy adopted?', audience: 'Analyst', scope: { kind: 'country', label: 'Brazil', countries: ['BR'] }, languages: ['en'], windowDays: 7, sourcePack: { id: 'owned', version: 1, allowGdelt: false, feeds: [] } };
const text = 'The minister did not adopt the proposal.';
async function setup() {
 const desk = await signalStore.create('owner', input); let sourceId = ''; let claimId = '';
 const current = await signalStore.mutate('owner', desk.id, null, d => { const source = capture(d, { title: 'Synthetic source', text, language: 'en', synthetic: true, url: 'https://example.org/source', rights: { basis: 'Owned fixture', allowExport: true } }, now); sourceId = source.id; d.contextReceipt = { pinned: 'reviewed' }; d.contextText = 'Previously compiled accepted source context'; d.capsuleId = 'signal-history'; const claim = propose(d, { sourceRevisionId: source.id, quote: text, start: 0, end: text.length, speaker: 'Minister', proposition: text }, now); claimId = claim.id; review(d, 'owner', { claimId, digest: claim.digest, decision: 'accepted', rationale: 'Faithful reading' }, now); });
 return { desk: current, sourceId, claimId };
}
const post = (body: unknown) => POST(new Request('https://praxis.tacitus.me/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
describe('SIGNAL active context invalidation and rebuild', () => {
 it('preserves old compiled context but blocks every new interpretation and brief after source invalidation', async () => {
  const { desk, sourceId, claimId } = await setup(); const claim = desk.claims.find(c => c.id === claimId)!; const brief = draftBrief(desk, now); approveBrief(desk, 'owner', { briefId: brief.id, digest: brief.digest, rationale: 'Reviewed artifact' }, now); const historical = structuredClone(brief); invalidate(desk, sourceId);
  expect(desk.contextStale).toBe(true); expect(desk.contextText).toBe('Previously compiled accepted source context'); expect(desk.contextReceipt).toEqual({ pinned: 'reviewed' });
  for (const attempt of [() => propose(desk, claim, now), () => review(desk, 'owner', { claimId, digest: claim.digest, decision: 'accepted', rationale: 'Retry' }, now), () => draftBrief(desk, now), () => approveBrief(desk, 'owner', { briefId: brief.id, digest: brief.digest, rationale: 'Retry' }, now), () => editBrief(desk, brief.id, 'New draft', now), () => proposeAssessment(desk, {}, now), () => proposeNarrative(desk, {}, now), () => reviewInterpretation(desk, 'owner', { targetId: 'missing', digest: '', decision: 'accepted', rationale: 'Retry' }, now)]) expect(attempt).toThrow(/stale/);
  expect(brief.text).toBe(historical.text); expect(brief.manifest).toEqual(historical.manifest); expect(brief.status).toBe('approved');
 });
 it.each(['rejected', 'unresolved'] as const)('revoking an accepted reading to %s requires context rebuild', async decision => { const { desk, claimId } = await setup(); const claim = desk.claims.find(c => c.id === claimId)!; review(desk, 'owner', { claimId, digest: claim.digest, decision, rationale: 'Review reversed' }, now); expect(desk.contextStale).toBe(true); expect(desk.contextReceipt).toEqual({ pinned: 'reviewed' }); });
 it('rebuild clears stale even for identical receipt and gives fresh proposals distinct activation identity', async () => {
  const { desk, sourceId, claimId } = await setup(); const stale = await signalStore.mutate('owner', desk.id, desk.version, d => { invalidate(d, sourceId); });
  vi.mocked(attachSignalContext).mockResolvedValue({ capsuleId: 'signal-recompiled', receipt: { pinned: 'reviewed' }, text: 'Fresh compiled current context', exportAllowed: true, sourceRefs: [] } as never);
  const rebuilt = await post({ action: 'context', deskId: desk.id, expectedVersion: stale.version }); expect(rebuilt.status).toBe(200); const d = (await rebuilt.json()).desk;
  expect(d.contextStale).toBe(false); expect(d.contextEpoch).toBe(1); expect(d.claims.find((c: { id: string }) => c.id === claimId).stale).toBe(true);
  const next = await post({ action: 'propose', deskId: desk.id, expectedVersion: d.version, sourceRevisionId: sourceId, quote: text, start: 0, end: text.length, proposition: text, speaker: 'Minister' }); expect(next.status).toBe(200); const updated = (await next.json()).desk; const fresh = updated.claims.at(-1); expect(fresh.id).not.toBe(claimId); expect(fresh.stale).not.toBe(true); expect(fresh.contextEpoch).toBe(1);
  const accepted = await post({ action: 'review', deskId: desk.id, expectedVersion: updated.version, claimId: fresh.id, digest: fresh.digest, decision: 'accepted', rationale: 'Reviewed current context' }); expect(accepted.status).toBe(200);
 });
 it('semantic configuration changes stale context while name-only changes preserve validity', async () => {
  const { desk } = await setup(); const renamed = await post({ action: 'configure', deskId: desk.id, expectedVersion: desk.version, ...input, name: 'Renamed desk' }); expect(renamed.status).toBe(200); const current = (await renamed.json()).desk; expect(current.contextStale).not.toBe(true);
  const configured = await post({ action: 'configure', deskId: desk.id, expectedVersion: current.version, ...input, question: 'A different decision question?' }); expect(configured.status).toBe(200); expect((await configured.json()).desk.contextStale).toBe(true);
 });
 it('retains historical approved exports while active context is stale', async () => {
  const { desk } = await setup(); const saved = await signalStore.mutate('owner', desk.id, desk.version, d => { const brief = draftBrief(d, now); approveBrief(d, 'owner', { briefId: brief.id, digest: brief.digest, rationale: 'Approved historical artifact' }, now); d.contextStale = true; });
  const brief = saved.briefs[0]; const response = await GET(new Request(`https://praxis.tacitus.me/api/signal?deskId=${saved.id}&export=brief&briefId=${brief.id}`)); expect(response.status).toBe(200); expect(await response.text()).toContain(brief.text);
 });
 it.each(['brief', 'bundle'] as const)('suspends %s historical export for withdrawn context-only evidence after a new context is compiled', async format => {
  const { desk, claimId } = await setup(); let contextSourceId = '';
  const saved = await signalStore.mutate('owner', desk.id, desk.version, d => {
    const contextSource = capture(d, { title: 'Context-only source', text: 'A contextual statement precedes the current report.', language: 'en', synthetic: true, url: 'https://example.org/context-only', rights: { basis: 'Owned fixture', allowExport: true } }, now); contextSourceId = contextSource.id;
    const contextClaim = propose(d, { sourceRevisionId: contextSource.id, quote: contextSource.text, start: 0, end: contextSource.text.length, speaker: 'Official', proposition: contextSource.text }, now);
    // The pinned compiled receipt selects this source, but the brief's own accepted readings do not.
    const receipt = { evidenceSpans: [{ id: `signal-span-${contextClaim.id}`, sourceId: contextSource.sourceId, sourceVersion: contextSource.hash, digest: 'pinned-span' }] };
    review(d, 'owner', { claimId: contextClaim.id, digest: contextClaim.digest, decision: 'accepted', rationale: 'Reviewed context source' }, now);
    // Simulate a successful compile activation, preserving its old claim references in the pinned receipt.
    d.contextReceipt = receipt; d.contextEpoch = 1; d.claims.forEach(c => { c.stale = true; });
    const ownSource = d.sources.find(s => s.id === d.claims.find(c => c.id === claimId)!.sourceRevisionId)!;
    const fresh = propose(d, { sourceRevisionId: ownSource.id, quote: ownSource.text, start: 0, end: ownSource.text.length, speaker: 'Minister', proposition: ownSource.text }, now);
    review(d, 'owner', { claimId: fresh.id, digest: fresh.digest, decision: 'accepted', rationale: 'Reviewed current source under compiled context' }, now);
    const brief = draftBrief(d, now); approveBrief(d, 'owner', { briefId: brief.id, digest: brief.digest, rationale: 'Approved historical output' }, now);
    expect(brief.manifest.claimIds).toEqual([fresh.id]); contextSource.withdrawn = true; invalidate(d, contextSource.id);
    expect(brief.stale).toBe(true); expect(brief.status).toBe('approved'); expect(signalBriefHasWithdrawnEvidence(d, brief)).toBe(true);
    d.contextReceipt = { evidenceSpans: [] }; d.contextText = 'New current context omits withdrawn source'; d.contextStale = false; d.contextExportAllowed = true;
  });
  const response = await GET(new Request(`https://praxis.tacitus.me/api/signal?deskId=${saved.id}&export=${format}&briefId=${saved.briefs[0].id}`)); expect(response.status).toBe(403); expect(contextSourceId).not.toBe(saved.briefs[0].manifest.claims[0].sourceRevisionId);
 });
 it('uses exact SIGNAL source revision fallback without revoking unrelated external evidence', async () => {
  const { desk } = await setup(); const brief = draftBrief(desk, now); const source = desk.sources[0]; source.withdrawn = true; brief.manifest.claims = [];
  brief.manifest.contextReceipt = { evidenceSpans: [{ id: 'signal-span-historical-missing-claim', sourceId: source.sourceId, sourceVersion: `sha256:${source.hash}` }] }; expect(signalBriefHasWithdrawnEvidence(desk, brief)).toBe(true);
  brief.manifest.contextReceipt = { evidenceSpans: [{ id: 'signal-span-historical-missing-claim', sourceId: source.sourceId, sourceVersion: 'different-hash' }] }; expect(signalBriefHasWithdrawnEvidence(desk, brief)).toBe(false);
  brief.manifest.contextReceipt = { evidenceSpans: [{ id: 'external-span', sourceId: source.sourceId, sourceVersion: source.hash }] }; expect(signalBriefHasWithdrawnEvidence(desk, brief)).toBe(false);
 });

});
