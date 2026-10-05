import { describe, expect, it } from 'vitest';
import { CaptureSchema } from '@/lib/signal/schema';
import { capture, createDesk, digest, draftBrief, hash, isCurrentSignalClaim, propose, review } from '@/lib/signal/domain';

const now = '2026-10-05T12:00:00.000Z';
const later = '2026-10-05T13:00:00.000Z';
const text = 'SYNTHETIC: Brazil and Japan may discuss a conditional agreement.';
const input = { title: 'Synthetic source geography', text, url: 'https://example.org/signal-geography', language: 'en', kind: 'original_text' as const, publicationTime: null, synthetic: true, rights: { basis: 'Self-authored fixture', allowExport: true } };
function desk() { return createDesk('owner', { name: 'Synthetic theatre', question: 'What does this bounded source cover?', audience: 'Private fixture reviewer', scope: { kind: 'theatre', label: 'Brazil and Japan', countries: ['BR', 'JP'] }, languages: ['en'] }, now); }
function accept(d: ReturnType<typeof desk>, sourceRevisionId: string) {
  const c = propose(d, { sourceRevisionId, proposition: 'The source reports conditional talks', speaker: 'Synthetic spokesperson', quote: text, start: 0, end: text.length, modality: 'conditional' }, now);
  review(d, 'owner', { claimId: c.id, digest: c.digest, decision: 'accepted', rationale: 'Exact synthetic reading' }, now); return c;
}

describe('analyst-declared source coverage country', () => {
  it('validates registry codes without inventing a country for legacy or collector text', () => {
    expect(CaptureSchema.parse(input).coverageCountry).toBeUndefined();
    expect(CaptureSchema.parse({ ...input, coverageCountry: 'BR' }).coverageCountry).toBe('BR');
    for (const coverageCountry of ['ZZ', 'br', 'Brazil', '', 'US,JP', null, 1]) expect(CaptureSchema.safeParse({ ...input, coverageCountry }).success).toBe(false);
    const d = desk(); const source = capture(d, input, now);
    expect(source.coverageCountry).toBeUndefined();
    expect(source).not.toHaveProperty('coverageCountry');
  });
  it('keeps the exact original unmapped revision digest and source text hash', () => {
    const d = desk(); const source = capture(d, input, now);
    const sourceId = hash(input.url).slice(0, 32);
    const originalRevisionId = digest({ sourceId, contentHash: hash(text), language: input.language, kind: input.kind, rights: input.rights, publicationTime: input.publicationTime, synthetic: input.synthetic }).slice(0, 40);
    expect(source.id).toBe(originalRevisionId); expect(source.hash).toBe(hash(text));
    expect(capture(d, { ...input, coverageCountry: undefined }, later).id).toBe(originalRevisionId);
    expect(d.sources).toHaveLength(1);
  });
  it('maps a source in a new immutable revision, reopening its previous accepted reading and brief', () => {
    const d = desk(); const original = capture(d, input, now); const claim = accept(d, original.id); const brief = draftBrief(d, now);
    const originalMetadata = structuredClone(original);
    const mapped = capture(d, { ...input, coverageCountry: 'BR' }, later);
    expect(mapped.id).not.toBe(original.id); expect(mapped.supersedes).toBe(original.id);
    expect(mapped.sourceId).toBe(original.sourceId); expect(mapped.hash).toBe(original.hash); expect(mapped.text).toBe(original.text);
    expect(mapped.coverageCountry).toBe('BR'); expect(original).toEqual(originalMetadata);
    expect(claim.stale).toBe(true); expect(isCurrentSignalClaim(d, claim)).toBe(false); expect(brief.stale).toBe(true);
    expect(d.sourceHeads?.[mapped.sourceId]).toEqual({ revisionId: mapped.id, epoch: 2 });
  });
  it('preserves earlier mapped geography when country changes and keeps text hashes constant', () => {
    const d = desk(); const brazil = capture(d, { ...input, coverageCountry: 'BR' }, now); const prior = structuredClone(brazil);
    const japan = capture(d, { ...input, coverageCountry: 'JP' }, later);
    expect(japan.id).not.toBe(brazil.id); expect(japan.hash).toBe(brazil.hash); expect(japan.sourceId).toBe(brazil.sourceId);
    expect(japan.coverageCountry).toBe('JP'); expect(japan.supersedes).toBe(brazil.id); expect(brazil).toEqual(prior);
    expect(capture(d, { ...input, coverageCountry: 'JP' }, '2026-10-05T14:00:00.000Z').id).toBe(japan.id); expect(d.sources).toHaveLength(2);
  });
  it('retains mapped historical metadata after withdrawal without reactivating its reviewed reading', () => {
    const d = desk(); const source = capture(d, { ...input, coverageCountry: 'BR' }, now); const claim = accept(d, source.id);
    source.withdrawn = true;
    expect(source.coverageCountry).toBe('BR'); expect(source.hash).toBe(hash(text)); expect(isCurrentSignalClaim(d, claim)).toBe(false);
    expect(() => propose(d, { sourceRevisionId: source.id, proposition: 'Withdrawn reading', speaker: 'Synthetic spokesperson', quote: text, start: 0, end: text.length }, later)).toThrow('Capture permitted original text');
  });
});
