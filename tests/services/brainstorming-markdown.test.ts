import { describe, it, expect } from 'vitest';
import { brainstormingTableToMarkdown, brainstormingTableFilename } from '@/lib/exports/brainstorming-markdown';

const sample = {
  question: 'Should the mission publicly attribute the corridor closure?',
  generatedAt: '2026-04-26T12:00:00.000Z',
  personas: ['mediator', 'humanitarian', 'red-team'],
  turns: [
    {
      turnId: 't-1',
      persona: 'humanitarian',
      claim: 'Convoy access blocked since 2026-04-18; civilian casualties reported.',
      evidence: [
        { sourceType: 'argus', sourceId: 'argus#alert#xyz', excerpt: 'OCHA flag noted at 09:14.' },
      ],
      recommendation: 'Brief donor cluster on funding gap.',
      confidence: 'medium' as const,
      status: 'proposed' as const,
    },
    {
      turnId: 't-2',
      persona: 'red-team',
      claim: 'Source diversity is too low; treat as unconfirmed until ICRC verifies.',
      evidence: [],
      critique: 'Anchored on one OCHA flag; need second source.',
      confidence: 'high' as const,
      status: 'challenged' as const,
    },
  ],
  synthesis: {
    bluf: 'Pursue a quiet 72-hour pause; do not publicly attribute until ICRC verifies.',
    consensusPoints: ['Civilians are at risk.'],
    divergences: ['Whether to attribute publicly.'],
    optionsForDecision: [
      {
        label: 'Quiet 72-hour pause',
        tradeoffs: 'Lower escalation risk; less public pressure.',
        preferredBy: ['mediator', 'humanitarian'],
      },
    ],
    openQuestions: ['Can ICRC verify within 48 hours?'],
    nextActions: [
      { action: 'Open back-channel with AFN field commander.', owner: 'mission', urgency: 'immediate' as const },
    ],
  },
  retrievalTrace: { layersSearched: ['argus', 'documents'], itemCount: 7, durationMs: 412 },
  situationName: 'User Case',
  analystName: 'Giulio',
};

describe('brainstormingTableToMarkdown', () => {
  it('renders YAML frontmatter with question, situation, analyst, personas, turns', () => {
    const md = brainstormingTableToMarkdown(sample);
    expect(md.startsWith('---\n')).toBe(true);
    expect(md).toMatch(/title: "Brainstorming Table — /);
    expect(md).toMatch(/situation: "User Case"/);
    expect(md).toMatch(/analyst: "Giulio"/);
    expect(md).toMatch(/personas: \["mediator", "humanitarian", "red-team"\]/);
    expect(md).toMatch(/turns: 2/);
  });

  it('renders BLUF as a blockquote', () => {
    const md = brainstormingTableToMarkdown(sample);
    expect(md).toMatch(/> \*\*BLUF\.\*\* Pursue a quiet 72-hour pause/);
  });

  it('renders one section per turn with persona label, status, confidence', () => {
    const md = brainstormingTableToMarkdown(sample);
    expect(md).toMatch(/### Humanitarian Lead — proposed · confidence medium/);
    expect(md).toMatch(/### Red Team Critic — challenged · confidence high/);
  });

  it('marks reasoning-only turns when evidence is empty', () => {
    const md = brainstormingTableToMarkdown(sample);
    expect(md).toMatch(/_No corpus evidence cited \(sourceType=reasoning\)\._/);
  });

  it('renders synthesis sub-sections only when populated', () => {
    const md = brainstormingTableToMarkdown(sample);
    expect(md).toMatch(/### Consensus\n- Civilians are at risk\./);
    expect(md).toMatch(/### Divergences\n- Whether to attribute publicly\./);
    expect(md).toMatch(/### Options for decision/);
    expect(md).toMatch(/Quiet 72-hour pause/);
    expect(md).toMatch(/preferred by Mediator, Humanitarian Lead/);
    expect(md).toMatch(/### Open questions\n- Can ICRC verify within 48 hours\?/);
    expect(md).toMatch(/### Next actions\n- \*\*immediate\*\* — Open back-channel with AFN field commander\. _\(owner: mission\)_/);
  });

  it('skips empty synthesis sections cleanly', () => {
    const trimmed = {
      ...sample,
      synthesis: {
        ...sample.synthesis,
        consensusPoints: [],
        divergences: [],
        openQuestions: [],
      },
    };
    const md = brainstormingTableToMarkdown(trimmed);
    expect(md).not.toMatch(/### Consensus/);
    expect(md).not.toMatch(/### Divergences/);
    expect(md).not.toMatch(/### Open questions/);
    // BLUF and options remain.
    expect(md).toMatch(/> \*\*BLUF/);
    expect(md).toMatch(/### Options for decision/);
  });

  it('records corpus retrieval trace in provenance footer', () => {
    const md = brainstormingTableToMarkdown(sample);
    expect(md).toMatch(/Corpus retrieval: 7 items across argus, documents \(412ms\)/);
  });

  it('falls back to "not recorded" when retrievalTrace missing', () => {
    const noTrace = { ...sample, retrievalTrace: undefined };
    const md = brainstormingTableToMarkdown(noTrace);
    expect(md).toMatch(/Corpus retrieval: not recorded/);
  });
});

describe('brainstormingTableFilename', () => {
  it('slugifies situation name and prepends date', () => {
    expect(brainstormingTableFilename(sample)).toBe('brainstorming-user-case-alt-04-26');
  });

  it('falls back to "situation" when no situation name', () => {
    const noSit = { ...sample, situationName: undefined };
    expect(brainstormingTableFilename(noSit)).toBe('brainstorming-situation-2026-04-26');
  });

  it('falls back to today when no generatedAt', () => {
    const noDate = { ...sample, generatedAt: '' };
    const today = new Date().toISOString().slice(0, 10);
    expect(brainstormingTableFilename(noDate)).toBe(`brainstorming-User Case-${today}`);
  });
});
