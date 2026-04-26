import { describe, it, expect } from 'vitest';
import { HumanitarianSnapshotSchema } from '@/app/api/ai/humanitarian/route';

const baseValid = {
  bluf: 'Eastern provinces at IPC Phase 4 with rising displacement; immediate food and protection cluster reinforcement is warranted.',
  region: 'Demoland — East',
  asOfDate: '2026-04-26',
  ipcPhases: [
    {
      area: 'East',
      phase: '4' as const,
      population: 100000,
      pct: 12.5,
      trend: 'worsening' as const,
      source: { name: 'IPC' },
    },
  ],
  displacement: {
    idps: 50000,
    refugees: 1000,
    asOf: '2026-04-20',
    source: { name: 'UNHCR' },
  },
  funding: {
    requirementUsd: 100000000,
    fundedUsd: 40000000,
    gapPercent: 60,
    appealName: 'Demoland HRP 2026',
    source: { name: 'OCHA FTS' },
  },
  protection: [
    {
      category: 'civilians' as const,
      description: 'Buffer-zone violations.',
      severity: 'high' as const,
      source: { name: 'OHCHR' },
    },
  ],
  accessConstraints: [
    {
      description: 'Convoy access blocked at corridor.',
      type: 'security' as const,
      severity: 'high' as const,
      affectedAreas: ['East'],
      source: { name: 'OCHA Access Monitor' },
    },
  ],
  intelligenceGaps: ['No fresh OCHA sitrep this week.'],
  recommendedActions: [
    {
      action: 'Brief donor cluster on funding gap.',
      urgency: 'short-term' as const,
      audience: 'donor' as const,
    },
  ],
  confidence: 'medium' as const,
  primarySources: ['UNHCR', 'OCHA FTS'],
};

describe('HumanitarianSnapshotSchema', () => {
  it('accepts a fully populated, well-formed snapshot', () => {
    const parsed = HumanitarianSnapshotSchema.safeParse(baseValid);
    expect(parsed.success).toBe(true);
  });

  it('accepts empty arrays for non-evidence-backed sections', () => {
    const minimalSnapshot = {
      ...baseValid,
      ipcPhases: [],
      protection: [],
      accessConstraints: [],
      intelligenceGaps: ['IPC data not yet available for this country.'],
    };
    const parsed = HumanitarianSnapshotSchema.safeParse(minimalSnapshot);
    expect(parsed.success).toBe(true);
  });

  it('rejects snapshots without bluf', () => {
    const bad = { ...baseValid, bluf: '' };
    const parsed = HumanitarianSnapshotSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });

  it('rejects invalid IPC phases (out of range)', () => {
    const bad = {
      ...baseValid,
      ipcPhases: [
        { ...baseValid.ipcPhases[0], phase: '7' as never },
      ],
    };
    const parsed = HumanitarianSnapshotSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });

  it('rejects negative displacement counts', () => {
    const bad = {
      ...baseValid,
      displacement: { ...baseValid.displacement, idps: -1 },
    };
    const parsed = HumanitarianSnapshotSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });

  it('rejects funding gapPercent over 100', () => {
    const bad = {
      ...baseValid,
      funding: { ...baseValid.funding, gapPercent: 150 },
    };
    const parsed = HumanitarianSnapshotSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });

  it('rejects unsupported protection categories', () => {
    const bad = {
      ...baseValid,
      protection: [
        { ...baseValid.protection[0], category: 'aliens' as never },
      ],
    };
    const parsed = HumanitarianSnapshotSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });

  it('rejects unsupported confidence values', () => {
    const bad = { ...baseValid, confidence: 'definitely' as never };
    const parsed = HumanitarianSnapshotSchema.safeParse(bad);
    expect(parsed.success).toBe(false);
  });
});
