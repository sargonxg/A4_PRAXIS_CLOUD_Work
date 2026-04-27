import { describe, it, expect } from 'vitest';
import { BriefBuilderSchema } from '@/app/api/ai/brief-builder/route';

const baseValid = {
  briefId: 'brief-1',
  generatedAt: '2026-04-26T12:00:00.000Z',
  audience: 'UNSC informal consultations',
  bluf: 'Corridor closure + casualty signal warrants a 72-hour quiet pause; public attribution is premature until ICRC verifies.',
  sections: [
    { id: 'summary', heading: 'Summary', body: 'Eastern provinces remain at IPC Phase 4 with rising IDP outflows.', provenance: ['#1'] },
    { id: 'risk', heading: 'Risk', body: 'Glasl 7. INFORM composite 78. 90-day forecast escalating.', provenance: ['#2'] },
    { id: 'options', heading: 'Options', body: 'Quiet pause vs public attribution.', provenance: ['#3'] },
  ],
  decisionPoints: [
    {
      question: 'Public attribution now or quiet pause?',
      options: ['Quiet 72-hour pause', 'Public attribution + UNSC briefing'],
      recommendation: 'Quiet 72-hour pause until ICRC verifies.',
      preferredBy: 'mediator + humanitarian',
    },
  ],
  intelligenceGaps: ['No ICRC casualty verification yet.'],
  recommendedSources: ['source-scout for ICRC briefings'],
  locked: false,
  version: 1,
};

describe('BriefBuilderSchema', () => {
  it('accepts a well-formed brief', () => {
    expect(BriefBuilderSchema.safeParse(baseValid).success).toBe(true);
  });

  it('requires at least 3 sections', () => {
    const bad = { ...baseValid, sections: baseValid.sections.slice(0, 2) };
    expect(BriefBuilderSchema.safeParse(bad).success).toBe(false);
  });

  it('caps sections at 10', () => {
    const tooMany = Array(11).fill(baseValid.sections[0]).map((s, i) => ({ ...s, id: `s${i}` }));
    expect(BriefBuilderSchema.safeParse({ ...baseValid, sections: tooMany }).success).toBe(false);
  });

  it('rejects too-short BLUF', () => {
    expect(BriefBuilderSchema.safeParse({ ...baseValid, bluf: 'short' }).success).toBe(false);
  });

  it('rejects sections with too-short body', () => {
    const bad = {
      ...baseValid,
      sections: [{ id: 's1', heading: 'h', body: 'short', provenance: [] }, baseValid.sections[1], baseValid.sections[2]],
    };
    expect(BriefBuilderSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects decision points with fewer than 2 options', () => {
    const bad = {
      ...baseValid,
      decisionPoints: [{ ...baseValid.decisionPoints[0], options: ['only one'] }],
    };
    expect(BriefBuilderSchema.safeParse(bad).success).toBe(false);
  });

  it('caps decision points at 8', () => {
    const tooMany = Array(9).fill(baseValid.decisionPoints[0]);
    expect(BriefBuilderSchema.safeParse({ ...baseValid, decisionPoints: tooMany }).success).toBe(false);
  });

  it('defaults provenance to empty array per section', () => {
    const minimal = {
      ...baseValid,
      sections: [{ id: 's1', heading: 'Summary', body: 'A short but valid summary.', provenance: [] }, baseValid.sections[1], baseValid.sections[2]],
    };
    const parsed = BriefBuilderSchema.parse(minimal);
    expect(parsed.sections[0].provenance).toEqual([]);
  });

  it('defaults locked to false and version to 1', () => {
    const minimal = { ...baseValid };
    delete (minimal as Partial<typeof minimal>).locked;
    delete (minimal as Partial<typeof minimal>).version;
    const parsed = BriefBuilderSchema.parse(minimal);
    expect(parsed.locked).toBe(false);
    expect(parsed.version).toBe(1);
  });
});
