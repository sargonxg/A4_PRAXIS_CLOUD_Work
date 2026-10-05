import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import { buildSignalNativeCapsule, signalSourceReceipt, signalNativeEnvelope, attachSignalContext } from '@/lib/signal/capsules';
import { compileContext } from '@/lib/cognitive-capsule/compiler';
import { packCapsule, readCapsulePackage } from '@/lib/cognitive-capsule/package';
import { KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { createCapsule, getCapsule, sanitizeCapsule } from '@/lib/context/capsule-service';
import type { SignalDesk } from '@/lib/signal/schema';

vi.mock('@/lib/context/capsule-service', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/context/capsule-service')>();
  return { ...actual, getCapsule: vi.fn(), createCapsule: vi.fn() };
});
const at = '2026-10-05T12:00:00.000Z';
const text = '😀 The minister said talks may resume.';
const hash = `sha256:${createHash('sha256').update(text).digest('hex')}`;
function desk(): SignalDesk {
  return {
    id: 'desk1', ownerUid: 'owner', schemaVersion: 'signal/0.2', version: 1, name: 'Diplomacy', question: 'What did the minister report?', audience: 'Analysts', languages: ['en'], windowDays: 7,
    scope: { kind: 'country', label: 'Italy', countries: ['IT'] }, sourcePack: { id: 'supplied', version: 1, feeds: [], allowGdelt: false }, createdAt: at, updatedAt: at, watched: false,
    budget: { maxCollectionsPerDay: 1, maxAnalysesPerDay: 1 }, usage: { day: '2026-10-05', collections: 0, analyses: 0, tokens: 0 }, captures: [], briefs: [], runs: [],
    sources: [{ id: 'rev1', sourceId: 'source1', title: 'Statement', text, hash, language: 'en', kind: 'original_text', publicationTime: null, publicationTimeReason: 'Not supplied', capturedAt: at, discoveredAt: at, synthetic: false, rights: { basis: 'User supplied', allowExport: true } }],
    claims: [{ id: 'claim1', sourceRevisionId: 'rev1', proposition: 'Talks may resume', speaker: 'Minister', quote: text.slice(3), start: 3, end: text.length, polarity: 'affirmative', modality: 'conditional', conditions: '', time: 'unknown', place: 'unknown', frame: 'unassessed', digest: 'claim-digest', evidenceHash: hash, offsetUnit: 'utf16_code_unit', status: 'accepted', createdAt: at }],
    reviews: [{ id: 'review1', targetId: 'claim1', digest: 'claim-digest', evidenceHash: hash, contextDigest: null, decision: 'accepted', rationale: 'Faithful reading', reviewerUid: 'owner', createdAt: at }],
  };
}
function compile(d: SignalDesk) {
  const input = buildSignalNativeCapsule('owner', d);
  return { input, view: compileContext(input.cognition!, { objective: d.question, role: 'capsule-curator', scope: 'Italy', asOf: at, maxChars: 16000 }) };
}

describe('SIGNAL native capsule adapter', () => {
  beforeEach(() => vi.clearAllMocks());
  it('preserves exact UTF-16 offsets, immutable version and original source ID', () => {
    const d = desk(); const r = signalSourceReceipt(d.sources[0], d.claims[0]);
    expect(r.span).toEqual({ start: 3, end: text.length, quote: text.slice(3) });
    expect(r.sourceId).toBe('source1'); expect(r.contentHash).toBe(hash);
    expect(r.originalPassages?.[0].locator).toBe(`revision:rev1;utf16:3-${text.length}`);
    expect(() => signalSourceReceipt(d.sources[0], { ...d.claims[0], start: 2 })).toThrow('span mismatch');
    expect(() => signalSourceReceipt({ ...d.sources[0], text: 'changed' }, d.claims[0])).toThrow('hash mismatch');
  });
  it('compiles accepted source readings with native receipt without inventing expert rules or event facts', () => {
    const { input, view } = compile(desk());
    expect(view.statements).toHaveLength(1); expect(view.statements[0].predicate).toBe('SOURCE_REPORTS');
    expect(view.statements[0].layer).toBe('epistemic'); expect(view.knowledge).toEqual([]);
    expect(view.receipt.compilerVersion).toBe('cognitive-compiler/0.3.0');
    expect(view.receipt.evidenceSpans[0]).toMatchObject({ sourceId: 'source1', sourceVersion: hash });
    expect(view.evidence[0]).toMatchObject({ anchorStatus: 'exact', start: 3, sourceHash: hash });
    expect(input.latestGateState).toBe('draft');
    expect(input.claimLedger?.[0]).toMatchObject({ caveat: expect.stringContaining('Event truth') });
  });
  it.each(['proposed', 'rejected', 'unresolved'] as const)('retains %s history while excluding it from applied context', status => {
    const d = desk(); d.claims[0].status = status; d.reviews[0].decision = status;
    const { input, view } = compile(d);
    expect(input.cognition?.statements).toHaveLength(1); expect(view.statements).toEqual([]); expect(input.claimLedger).toEqual([]);
  });
  it('does not accept stale reviews, evidence or withdrawn sources', () => {
    const d = desk(); d.reviews[0].digest = 'old'; expect(compile(d).view.statements).toEqual([]);
    d.claims[0].stale = true; expect(compile(d).input.cognition?.statements).toEqual([]);
    d.claims[0].stale = false; d.sources[0].withdrawn = true; expect(compile(d).input.sourceRefs).toEqual([]);
  });
  it('binds accepted readings to their reviewed context digest', () => {
    const d = desk(); d.contextReceipt = { capsuleVersion: '2.0.0' };
    expect(compile(d).view.statements).toEqual([]);
    d.reviews[0].contextDigest = createHash('sha256').update(JSON.stringify(d.contextReceipt)).digest('hex');
    expect(compile(d).view.statements).toHaveLength(1);
    d.contextReceipt = { capsuleVersion: '3.0.0' };
    expect(compile(d).view.statements).toEqual([]);
  });
  it('round-trips native package evidence and human reviews', async () => {
    const { input } = compile(desk());
    const { capsule } = await readCapsulePackage(await packCapsule(input.cognition));
    expect(capsule).toEqual(input.cognition);
    expect(capsule.statements[0].provenance.reviewedBy?.id).toBe('owner');
  });
  it('preserves native User, Situation, Tool and Output refs and legacy envelope', () => {
    const native = sanitizeCapsule({ capsuleId: 'legacy', ownerUid: 'owner', schemaVersion: 1, coreRefs: { userCoreId: 'user', situationCoreId: 'situation', toolCoreIds: ['tool'], outputCoreIds: ['output'] } });
    const roundTrip = signalNativeEnvelope(JSON.parse(JSON.stringify(native)));
    expect(roundTrip.coreRefs).toEqual(native.coreRefs);
    const input = buildSignalNativeCapsule('owner', desk(), roundTrip);
    expect(input.coreRefs).toEqual(native.coreRefs);
    expect(() => buildSignalNativeCapsule('other', desk(), native)).toThrow('owner mismatch');
  });
  it('preserves attached distinctions, language rules and unknowns without flattening expertise', () => {
    const d = desk(); const { input } = compile(d);
    const provenance = { generatedBy: { type: 'human', id: 'expert', at }, reviewedBy: { type: 'human', id: 'expert', at }, reviewedAt: at, sourceRefs: [], confidenceKind: 'human-authored' };
    const common = { scope: ['Italy'], provenance, reviewState: 'accepted' };
    input.cognition!.knowledge = [
      KnowledgeSchema.parse({ ...common, id: 'distinction', label: 'Offer and commitment', kind: 'distinction', conceptA: 'Offer', conceptB: 'Commitment', explanation: 'An offer can be conditional.', whyItMatters: 'Avoid overstating commitments.', commonMistake: 'Treating possibility as commitment' }),
      KnowledgeSchema.parse({ ...common, id: 'language', label: 'May resume', kind: 'languageRule', expression: 'may resume', language: 'en', domain: 'Diplomacy', meaning: 'A possibility', nonImplications: ['A firm commitment'] }),
      KnowledgeSchema.parse({ ...common, id: 'unknown', label: 'Timing', kind: 'unknown', description: 'Timing is not known.' }),
    ];
    const native = sanitizeCapsule({ ...input, ownerUid: 'owner', schemaVersion: 3 });
    const next = buildSignalNativeCapsule('owner', d, native);
    expect(next.cognition?.knowledge).toEqual(input.cognition?.knowledge);
    const view = compileContext(next.cognition!, { objective: d.question, role: 'capsule-curator', scope: 'Italy', asOf: at });
    expect(view.knowledge.map(k => k.kind).sort()).toEqual(['distinction', 'languageRule', 'unknown']);
  });
  it('never broadens restricted inherited context download rights or drops source entitlements', () => {
    const d = desk(); const { input } = compile(d);
    const inheritedReceipt = { sourceId: 'licensed-expert-source', label: 'Licensed report', rights: { allowExport: false, basis: 'Licensed private context' } };
    const native = sanitizeCapsule({ ...input, ownerUid: 'owner', schemaVersion: 3, sourceRefs: [inheritedReceipt], access: { visibility: 'private', allowDownload: false } });
    const next = buildSignalNativeCapsule('owner', d, native);
    expect(next.access?.allowDownload).toBe(false);
    expect(next.access?.visibility).toBe('private');
    expect(next.sourceRefs).toContainEqual(inheritedReceipt);
    expect(next.sourceRefs).toHaveLength(2);
  });
  it('reuses the deterministic capsule snapshot on repeated attachments', async () => {
    const d = desk(); const input = buildSignalNativeCapsule('owner', d);
    const native = sanitizeCapsule({ ...input, ownerUid: 'owner', schemaVersion: 3 });
    vi.mocked(getCapsule).mockResolvedValue(null); vi.mocked(createCapsule).mockResolvedValue(native);
    const first = await attachSignalContext('owner', d);
    d.capsuleId = first.capsuleId; vi.mocked(getCapsule).mockResolvedValue(native);
    const second = await attachSignalContext('owner', d);
    expect(second.capsuleId).toBe(first.capsuleId); expect(createCapsule).toHaveBeenCalledTimes(1);
    expect(second.receipt).toEqual(first.receipt);
  });
});
