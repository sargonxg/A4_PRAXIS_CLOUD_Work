import { describe, expect, it } from 'vitest';
import { proposeAssessment, proposeNarrative, reviewInterpretation } from '@/lib/signal/assessments';
import { approveBrief, capture, createDesk, draftBrief, propose, review } from '@/lib/signal/domain';

const now = '2026-10-05T12:00:00.000Z';
const text = 'The minister did not adopt the proposal.';
function setup() {
  const desk = createDesk('owner', { name: 'Synthetic policy desk', question: 'Was the policy adopted?', audience: 'Analyst', scope: { kind: 'country', label: 'Brazil', countries: ['BR'] }, languages: ['en'] }, now);
  const source = capture(desk, { title: 'Synthetic source', text, language: 'en', url: 'https://example.org/policy', synthetic: true, rights: { basis: 'Owned fixture', allowExport: true } }, now);
  const claim = propose(desk, { sourceRevisionId: source.id, quote: text, start: 0, end: text.length, speaker: 'Minister', proposition: text, polarity: 'negative', modality: 'denied' }, now);
  review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'accepted', rationale: 'Literal negation preserved.' }, now);
  const assessment = { conclusion: 'The monitored statement denies adoption; actual adoption remains unverified.', changeReason: 'A new attributed denial narrows the source reading.', claimIds: [claim.id], alternatives: ['The statement may omit later developments.'], uncertainty: 'Independent event verification is unavailable.', invalidators: ['An authenticated later adoption record appears.'] };
  const narrative = { title: 'Policy remains proposed', frame: 'A source denial frames adoption as premature.', claimIds: [claim.id], alternatives: ['The denial may reflect a temporary position.'] };
  return { desk, source, claim, assessment, narrative };
}
function accept(desk: ReturnType<typeof setup>['desk'], target: { id: string; digest: string }) {
  reviewInterpretation(desk, 'owner', { targetId: target.id, digest: target.digest, decision: 'accepted', rationale: 'Reviewed attributed interpretation with alternatives.' }, now);
}

describe('SIGNAL reviewed interpretations and pinned briefs', () => {
  it('requires distinct accepted claims with exact current review evidence', () => {
    const { desk, claim, assessment } = setup();
    expect(() => proposeAssessment(desk, { ...assessment, claimIds: [claim.id, claim.id] }, now)).toThrow();
    desk.reviews[0].evidenceHash = 'tampered';
    expect(() => proposeAssessment(desk, assessment, now)).toThrow('current accepted');
    desk.reviews[0].evidenceHash = claim.evidenceHash;
    desk.reviews[0].decision = 'rejected';
    expect(() => proposeAssessment(desk, assessment, now)).toThrow();
  });
  it('rejects withdrawn, superseded, or altered literal source evidence', () => {
    for (const change of ['withdrawn', 'superseded', 'altered'] as const) {
      const { desk, source, assessment } = setup();
      if (change === 'withdrawn') source.withdrawn = true;
      if (change === 'superseded') capture(desk, { title: source.title, text: 'A later announcement changes the record.', url: source.url, language: 'en', synthetic: true, rights: source.rights }, '2026-10-05T13:00:00.000Z');
      if (change === 'altered') source.text = 'Tampered text';
      expect(() => proposeAssessment(desk, assessment, now)).toThrow();
    }
  });
  it('does not promote proposed assessments or narratives into brief findings', () => {
    const { desk, assessment, narrative } = setup();
    proposeAssessment(desk, assessment, now); proposeNarrative(desk, narrative, now);
    const brief = draftBrief(desk, now);
    expect(brief.manifest.assessment).toBeUndefined(); expect(brief.manifest.narratives).toEqual([]);
    expect(brief.text).toContain('No reviewed analytical conclusion');
  });
  it('requires the exact interpretation digest and a rationale, without appending failed reviews', () => {
    const { desk, assessment } = setup(); const target = proposeAssessment(desk, assessment, now); const before = desk.reviews.length;
    expect(() => reviewInterpretation(desk, 'owner', { targetId: target.id, digest: 'wrong', decision: 'accepted', rationale: 'Reviewed.' }, now)).toThrow();
    expect(() => reviewInterpretation(desk, 'owner', { targetId: target.id, digest: target.digest, decision: 'accepted', rationale: ' ' }, now)).toThrow();
    expect(desk.reviews).toHaveLength(before); expect(target.status).toBe('proposed');
    target.conclusion += ' Mutated claim.'; expect(() => accept(desk, target)).toThrow('content');
  });
  it('binds assessment context and refuses old-context claims after a change', () => {
    const { desk, assessment, narrative } = setup();
    const target = proposeAssessment(desk, assessment, now); const dossier = proposeNarrative(desk, narrative, now);
    desk.contextReceipt = { capsuleId: 'different', version: 2 };
    expect(() => accept(desk, target)).toThrow(); expect(() => accept(desk, dossier)).toThrow();
    expect(() => proposeAssessment(desk, assessment, now)).toThrow();
    expect(target.contextReceipt).toBeNull();
  });
  it('rejects changed source panels for both assessment and narrative review', () => {
    const { desk, assessment, narrative } = setup();
    const target = proposeAssessment(desk, assessment, now); const dossier = proposeNarrative(desk, narrative, now);
    desk.sourcePack.version++;
    expect(() => accept(desk, target)).toThrow('source panel'); expect(() => accept(desk, dossier)).toThrow('source panel');
  });
  it('keeps an immutable accepted predecessor while retaining rejected and unresolved history', () => {
    const { desk, assessment } = setup(); const first = proposeAssessment(desk, assessment, now); accept(desk, first);
    const firstSnapshot = structuredClone(first);
    const unresolved = proposeAssessment(desk, { ...assessment, conclusion: 'A contrary interpretation remains unresolved.' }, now);
    reviewInterpretation(desk, 'owner', { targetId: unresolved.id, digest: unresolved.digest, decision: 'unresolved', rationale: 'Contrary evidence is incomplete.' }, now);
    const next = proposeAssessment(desk, { ...assessment, conclusion: 'The later assessment retains the denial with greater uncertainty.' }, now);
    expect(next.previousId).toBe(first.id); expect(first).toEqual(firstSnapshot);
    const initialPrevious = next.previousId; next.previousId = unresolved.id;
    expect(() => accept(desk, next)).toThrow('predecessor'); next.previousId = initialPrevious; accept(desk, next);
    expect(desk.assessments?.map(a => a.status)).toEqual(['accepted', 'unresolved', 'accepted']);
  });
  it('versions narratives only through an existing desk predecessor', () => {
    const { desk, narrative } = setup(); const first = proposeNarrative(desk, narrative, now);
    expect(() => proposeNarrative(desk, { ...narrative, previousId: 'other-desk-record' }, now)).toThrow('predecessor');
    const next = proposeNarrative(desk, { ...narrative, previousId: first.id }, now);
    expect(next.version).toBe(2); expect(first.version).toBe(1); expect(next.previousId).toBe(first.id);
  });
  it('pins approved claim/review/assessment/narrative snapshots through later reopenings', () => {
    const { desk, claim, assessment, narrative } = setup(); const target = proposeAssessment(desk, assessment, now); const dossier = proposeNarrative(desk, narrative, now); accept(desk, target); accept(desk, dossier);
    const brief = draftBrief(desk, now); approveBrief(desk, 'owner', { briefId: brief.id, digest: brief.digest, rationale: 'Approve attributed source readings and reviewed interpretation.' }, now);
    const pinned = structuredClone(brief.manifest); const textBefore = brief.text;
    reviewInterpretation(desk, 'owner', { targetId: target.id, digest: target.digest, decision: 'rejected', rationale: 'Reopened interpretation after further scrutiny.' }, now);
    expect(brief.stale).toBe(true); expect(brief.manifest).toEqual(pinned); expect(brief.manifest.assessment?.status).toBe('accepted');
    review(desk, 'owner', { claimId: claim.id, digest: claim.digest, decision: 'rejected', rationale: 'Reopened source reading.' }, now);
    expect(brief.text).toBe(textBefore); expect(brief.manifest.snapshots?.claims[0].status).toBe('accepted'); expect(brief.manifest.snapshots?.reviews).toEqual(pinned.snapshots?.reviews);
  });
  it('prevents approval when an interpretation referenced by a draft is reopened', () => {
    const { desk, assessment } = setup(); const target = proposeAssessment(desk, assessment, now); accept(desk, target); const brief = draftBrief(desk, now);
    reviewInterpretation(desk, 'owner', { targetId: target.id, digest: target.digest, decision: 'unresolved', rationale: 'Interpretation requires new evidence.' }, now);
    expect(() => approveBrief(desk, 'owner', { briefId: brief.id, digest: brief.digest, rationale: 'Approve.' }, now)).toThrow();
  });
  it('enforces the append-only review ledger capacity without changing interpretation status', () => {
    const { desk, assessment } = setup(); const target = proposeAssessment(desk, assessment, now);
    desk.reviews = Array.from({ length: 400 }, () => structuredClone(desk.reviews[0]));
    expect(() => accept(desk, target)).toThrow('capacity'); expect(target.status).toBe('proposed'); expect(desk.reviews).toHaveLength(400);
  });
});
