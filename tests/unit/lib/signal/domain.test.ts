import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));
import { memorySignalStore } from '@/lib/signal/store';
import { approveBrief, capture, createDesk, draftBrief, editBrief, graph, hash, propose, reserve, review, validateSpan } from '@/lib/signal/domain';
import { DeskInputSchema, ProposalSchema, ScopeSchema } from '@/lib/signal/schema';
import { SIGNAL_COUNTRIES } from '@/lib/signal/geography';

const now = '2026-10-05T12:00:00.000Z';
const input = { name: 'Synthetic Brazil policy desk', question: 'Was the proposal adopted?', audience: 'Policy analyst', scope: { kind: 'country' as const, label: 'Brazil', countries: ['BR'] }, languages: ['en', 'pt'], windowDays: 7 };
const text = 'The minister did not adopt the proposal. It remains conditional.';
function setup() {
  const desk = createDesk('owner', input, now);
  const source = capture(desk, { title: 'Synthetic announcement', text, language: 'en', url: 'https://example.org/statement', synthetic: true, rights: { basis: 'Owned synthetic fixture', allowExport: true } }, now);
  const claim = propose(desk, { sourceRevisionId: source.id, proposition: 'The minister did not adopt the proposal.', speaker: 'Minister', quote: text.slice(0, 39), start: 0, end: 39, polarity: 'negative', modality: 'denied' }, now);
  return { desk, source, claim };
}
describe('SIGNAL canonical evidence and review invariants', () => {
  it('provides global selection and all five scope types without manufactured country coverage', () => {
    expect(SIGNAL_COUNTRIES).toHaveLength(250);
    for (const kind of ['region', 'theatre', 'thematic', 'administrative']) expect(ScopeSchema.parse({ kind, label: 'Cross-border question', countries: [] }).countries).toEqual([]);
    expect(() => ScopeSchema.parse({ kind: 'country', label: 'Invalid', countries: ['BR', 'JP'] })).toThrow();
    expect(() => ScopeSchema.parse({ kind: 'theatre', label: 'Invalid', countries: ['ZZ'] })).toThrow();
  });
  it('rejects owner identity and unsupported fields in request configuration', () => {
    expect(() => DeskInputSchema.parse({ ...input, ownerUid: 'other' })).toThrow();
  });
  it('never replaces publication time with discovery or capture time', () => {
    const { source } = setup(); expect(source.publicationTime).toBeNull(); expect(source.publicationTimeReason).toBeTruthy(); expect(source.capturedAt).toBe(now); expect(source.discoveredAt).toBe(now);
  });
  it('deduplicates tracking URL variants but preserves separate later capture occurrences', () => {
    const { desk, source } = setup();
    const duplicate = capture(desk, { title: source.title, text, language: 'en', url: 'https://example.org/statement?utm_source=ads#fragment', synthetic: true, rights: source.rights }, now);
    expect(duplicate.id).toBe(source.id); expect(desk.sources).toHaveLength(1); expect(desk.captures).toHaveLength(1);
    capture(desk, { title: source.title, text, language: 'en', url: source.url, synthetic: true, rights: source.rights }, '2026-10-05T13:00:00.000Z'); expect(desk.captures).toHaveLength(2);
  });
  it('pins rights/language changes as separate revisions without widening previous entitlements', () => {
    const { desk, source } = setup(); const next = capture(desk, { title: source.title, text, language: 'en', url: source.url, synthetic: true, rights: { basis: 'Restricted', allowExport: false } }, now);
    expect(next.id).not.toBe(source.id); expect(source.rights.allowExport).toBe(true); expect(next.supersedes).toBe(source.id);
  });
  it('reopens A after A→B→A with a new activation and proposal while preserving old revisions', () => {
    const { desk, source: a, claim: oldA } = setup();
    review(desk, 'owner', { claimId: oldA.id, digest: oldA.digest, decision: 'accepted', rationale: 'Original reading.' }, now);
    const bText = 'A revised proposal may be considered.';
    const b = capture(desk, { title: a.title, text: bText, language: 'en', url: a.url, synthetic: true, rights: a.rights }, '2026-10-05T13:00:00.000Z');
    const bClaim = propose(desk, { sourceRevisionId: b.id, speaker: 'Minister', proposition: bText, quote: bText, start: 0, end: bText.length }, now);
    review(desk, 'owner', { claimId: bClaim.id, digest: bClaim.digest, decision: 'accepted', rationale: 'Revised reading.' }, now);
    const bBrief = draftBrief(desk, now);
    const oldAInput = { sourceRevisionId: a.id, proposition: oldA.proposition, speaker: oldA.speaker, quote: oldA.quote, start: oldA.start, end: oldA.end, polarity: oldA.polarity, modality: oldA.modality };
    expect(() => propose(desk, oldAInput, now)).toThrow('current source revision');
    // A replay of the original occurrence does not undo the subsequent capture.
    capture(desk, { title: a.title, text, language: 'en', url: a.url, synthetic: true, rights: a.rights }, now);
    expect(desk.sourceHeads?.[a.sourceId]).toEqual({ revisionId: b.id, epoch: 2 });
    const reopened = capture(desk, { title: a.title, text, language: 'en', url: a.url, synthetic: true, rights: a.rights }, '2026-10-05T14:00:00.000Z');
    expect(reopened.id).toBe(a.id); expect(desk.sources).toHaveLength(2);
    expect(desk.sourceHeads?.[a.sourceId]).toEqual({ revisionId: a.id, epoch: 3 });
    expect(oldA.stale).toBe(true); expect(bClaim.stale).toBe(true); expect(bBrief.stale).toBe(true);
    expect(() => review(desk, 'owner', { claimId: bClaim.id, digest: bClaim.digest, decision: 'accepted', rationale: 'Old revision.' }, now)).toThrow();
    expect(() => draftBrief(desk, now)).toThrow();
    const newA = propose(desk, oldAInput, '2026-10-05T14:01:00.000Z');
    expect(newA.id).not.toBe(oldA.id); expect(newA.activationEpoch).toBe(3); expect(newA.stale).toBeUndefined();
    review(desk, 'owner', { claimId: newA.id, digest: newA.digest, decision: 'accepted', rationale: 'Reopened original text reviewed anew.' }, now);
    expect(draftBrief(desk, now).manifest.claimIds).toEqual([newA.id]);
    capture(desk, { title: a.title, text, language: 'en', url: a.url, synthetic: true, rights: a.rights }, '2026-10-05T15:00:00.000Z');
    expect(desk.sourceHeads?.[a.sourceId]?.epoch).toBe(3); expect(newA.stale).toBeUndefined();
  });
  it('rejects fabricated quotations and headline-only grounding', () => {
    const { desk, source } = setup(); expect(() => validateSpan(source, { quote: 'The proposal was adopted.', start: 0, end: 25 })).toThrow();
    const head = capture(desk, { title: 'Discovery', text: 'A policy announcement', language: 'en', kind: 'headline', rights: { basis: 'Discovery metadata', allowExport: false } }, now);
    expect(() => validateSpan(head, { quote: head.text, start: 0, end: head.text.length })).toThrow();
  });
  it('keeps selected repeated quote occurrence and does not split a Unicode surrogate pair', () => {
    const { desk } = setup(); const s = capture(desk, { title: 'Unicode', text: '😀 repeat repeat', language: 'en', rights: { basis: 'Synthetic', allowExport: true } }, now);
    expect(() => validateSpan(s, { quote: 'repeat', start: 9, end: 15 })).toThrow();
    validateSpan(s, { quote: 'repeat', start: 10, end: 16 });
    expect(() => validateSpan(s, { quote: s.text.slice(0, 1), start: 0, end: 1 })).toThrow();
  });
  it('creates append-only human review decisions and binds exact evidence digests', () => {
    const { desk, claim } = setup(); expect(() => review(desk, 'owner', { claimId: claim.id, digest: 'wrong', decision: 'accepted', rationale: 'Source supports only denial.' }, now)).toThrow();
    review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'accepted', rationale: 'Negation preserved.' }, now);
    review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'rejected', rationale: 'Reconsidered after source examination.' }, now);
    expect(desk.reviews.map(r => r.decision)).toEqual(['accepted', 'rejected']); expect(claim.status).toBe('rejected');
  });
  it('requires a fresh proposal after context changes instead of reviewing an old digest under new context', () => {
    const { desk, claim } = setup();
    expect(claim.contextDigest).toBeNull();
    desk.contextReceipt = { capsuleId: 'new-context', version: '2' };
    expect(() => review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'accepted', rationale: 'New contextual distinction.' }, now)).toThrow('context');
    const replacement = propose(desk, { sourceRevisionId: claim.sourceRevisionId, proposition: claim.proposition, speaker: claim.speaker, quote: claim.quote, start: claim.start, end: claim.end, polarity: claim.polarity, modality: claim.modality }, now);
    expect(replacement.id).not.toBe(claim.id); expect(replacement.contextDigest).toHaveLength(64);
    review(desk, 'owner', { claimId: replacement.id, digest: replacement.digest, decision: 'accepted', rationale: 'Reviewed with current context.' }, now);
    expect(desk.reviews.at(-1)?.contextDigest).toBe(replacement.contextDigest);
  });
  it('invalidates revised evidence without rewriting an approved historical artifact', () => {
    const { desk, source, claim } = setup(); review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'accepted', rationale: 'The denial is quoted exactly.' }, now);
    const brief = draftBrief(desk, now); approveBrief(desk, 'owner', { briefId: brief.id, digest: brief.digest, rationale: 'Approve as an attributed reading, with qualifications.' }, now); const original = brief.text;
    capture(desk, { title: source.title, url: source.url, text: 'A revised proposal may be considered.', language: 'en', synthetic: true, rights: source.rights }, '2026-10-06T12:00:00.000Z');
    expect(claim.stale).toBe(true); expect(brief.stale).toBe(true); expect(brief.text).toBe(original); expect(brief.status).toBe('approved');
    expect(() => review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'accepted', rationale: 'Try stale review' }, now)).toThrow();
  });
  it('excludes rejected/unresolved claims from accepted brief findings and labels synthetic output', () => {
    const { desk, claim } = setup(); expect(() => draftBrief(desk, now)).toThrow(); review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'accepted', rationale: 'Original denial.' }, now);
    const b = draftBrief(desk, now); expect(b.manifest.synthetic).toBe(true); expect(b.text).toContain('SYNTHETIC'); expect(b.text).toContain('do not establish event truth'); expect(b.manifest.claims[0].digest).toBe(claim.digest);
  });
  it('creates a new draft after human editing and preserves approved text and input manifest', () => {
    const { desk, claim } = setup(); review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'accepted', rationale: 'Reviewed.' }, now); const b = draftBrief(desk, now); approveBrief(desk, 'owner', { briefId: b.id, digest: b.digest, rationale: 'Approved.' }, now);
    editBrief(desk, b.id, `${b.text}\nHuman clarification`, now); expect(desk.briefs).toHaveLength(2); expect(b.status).toBe('approved'); expect(desk.briefs[1].status).toBe('draft'); expect(desk.briefs[1].digest).toBe(hash(desk.briefs[1].text));
  });
  it('rejects unreviewed brief edits or changed context at approval', () => {
    const { desk, claim } = setup(); review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'accepted', rationale: 'Reviewed.' }, now); const b = draftBrief(desk, now); b.text += 'tampered'; expect(() => approveBrief(desk, 'owner', { briefId: b.id, digest: b.digest, rationale: 'Approved.' }, now)).toThrow();
  });
  it('provides a reproducible noncausal relationship graph', () => { const { desk } = setup(); expect(graph(desk)).toEqual(graph(structuredClone(desk))); expect(graph(desk).edges.map(e => e.predicate)).toEqual(['reports_claim']); });
  it('bounds daily allowances transactionally and resets on a new day', () => { const { desk } = setup(); desk.budget.maxAnalysesPerDay = 1; reserve(desk, 'analyses', now); expect(() => reserve(desk, 'analyses', now)).toThrow(); reserve(desk, 'analyses', '2026-10-06T12:00:00.000Z'); expect(desk.usage.analyses).toBe(1); });
  it('enforces cross-owner read/write denial and compare-and-swap versions', async () => { const store = memorySignalStore(); const d = await store.create('owner', input); await expect(store.get('other', d.id)).rejects.toThrow(); await expect(store.mutate('other', d.id, d.version, () => {})).rejects.toThrow(); await store.mutate('owner', d.id, d.version, x => { x.name = 'Updated'; }); await expect(store.mutate('owner', d.id, d.version, () => {})).rejects.toThrow(); expect((await store.get('owner', d.id)).name).toBe('Updated'); expect((await store.list('other')).desks).toEqual([]); });
  it('rolls back partial aggregate changes when a transaction fails', async () => { const store = memorySignalStore(); const d = await store.create('owner', input); await expect(store.mutate('owner', d.id, d.version, x => { x.name = 'Uncommitted'; throw new Error('Crash'); })).rejects.toThrow(); expect((await store.get('owner', d.id)).name).toBe(input.name); });
  it('retains modality and polarity without coercing a proposal into adoption', () => { const p = ProposalSchema.parse({ sourceRevisionId: 'revision', speaker: 'Minister', proposition: 'A proposal may be considered.', quote: 'may be considered', start: 0, end: 17, modality: 'conditional', polarity: 'affirmative' }); expect(p.modality).toBe('conditional'); });
});
