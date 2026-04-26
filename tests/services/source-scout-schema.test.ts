import { describe, it, expect } from 'vitest';
import { SourceScoutSchema } from '@/app/api/ai/source-scout/route';

const baseValid = {
  question: 'What primary sources cover the Kessara corridor closure this week?',
  generatedAt: '2026-04-26T12:00:00.000Z',
  searchPlan: {
    keywords: ['Kessara', 'corridor', 'humanitarian access'],
    timeframe: '7d' as const,
  },
  proposedSources: [
    {
      name: 'OCHA Situation Report',
      url: 'https://reliefweb.int/example',
      reason: 'OCHA publishes per-corridor access figures and tracks the convoy denial pattern.',
      reliability: 'tier_a' as const,
      publishedAt: '2026-04-25',
      corroborated: false,
      format: 'report' as const,
    },
    {
      name: 'Crisis Group Briefing',
      url: 'https://crisisgroup.org/example',
      reason: 'Crisis Group has a Nordalia analyst with a recent briefing on AFN field-commander politics.',
      reliability: 'tier_a' as const,
      corroborated: true,
      format: 'report' as const,
    },
    {
      name: 'Reuters wire',
      url: 'https://reuters.com/example',
      reason: 'Reuters wire ran an on-the-ground stringer report from Kessara town this morning.',
      reliability: 'tier_c' as const,
      corroborated: false,
      format: 'article' as const,
    },
  ],
  duplicatesAvoided: ['ARGUS demo entry — already in the corpus'],
  intelligenceGaps: ['No direct ICRC source on civilian casualty verification.'],
};

describe('SourceScoutSchema', () => {
  it('accepts a well-formed scout output', () => {
    expect(SourceScoutSchema.safeParse(baseValid).success).toBe(true);
  });

  it('requires at least 3 proposed sources', () => {
    const bad = { ...baseValid, proposedSources: [baseValid.proposedSources[0]] };
    expect(SourceScoutSchema.safeParse(bad).success).toBe(false);
  });

  it('caps proposed sources at 8', () => {
    const bad = { ...baseValid, proposedSources: Array(9).fill(baseValid.proposedSources[0]) };
    expect(SourceScoutSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects invalid URL format', () => {
    const bad = {
      ...baseValid,
      proposedSources: [
        { ...baseValid.proposedSources[0], url: 'not-a-url' },
        baseValid.proposedSources[1],
        baseValid.proposedSources[2],
      ],
    };
    expect(SourceScoutSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown reliability tiers', () => {
    const bad = {
      ...baseValid,
      proposedSources: [
        { ...baseValid.proposedSources[0], reliability: 'tier_xx' as never },
        baseValid.proposedSources[1],
        baseValid.proposedSources[2],
      ],
    };
    expect(SourceScoutSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown timeframes', () => {
    const bad = { ...baseValid, searchPlan: { ...baseValid.searchPlan, timeframe: 'forever' as never } };
    expect(SourceScoutSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects too-short reason text', () => {
    const bad = {
      ...baseValid,
      proposedSources: [
        { ...baseValid.proposedSources[0], reason: 'too short' },
        baseValid.proposedSources[1],
        baseValid.proposedSources[2],
      ],
    };
    expect(SourceScoutSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown source formats', () => {
    const bad = {
      ...baseValid,
      proposedSources: [
        { ...baseValid.proposedSources[0], format: 'cuneiform' as never },
        baseValid.proposedSources[1],
        baseValid.proposedSources[2],
      ],
    };
    expect(SourceScoutSchema.safeParse(bad).success).toBe(false);
  });
});
