import { describe, it, expect } from 'vitest';
import { BrainstormingTableSchema } from '@/app/api/ai/brainstorming-table/route';

const baseValid = {
  question: 'Should the mission publicly attribute the corridor closure?',
  generatedAt: '2026-04-26T12:00:00.000Z',
  personas: ['mediator', 'humanitarian', 'red-team'] as const,
  turns: [
    {
      turnId: 't-1',
      persona: 'humanitarian' as const,
      claim: 'Convoy access blocked since 2026-04-18; civilian casualties reported.',
      evidence: [{ sourceType: 'argus' as const, sourceId: 'argus#alert#xyz', excerpt: 'OCHA flag' }],
      recommendation: 'Brief donor cluster.',
      confidence: 'medium' as const,
      status: 'proposed' as const,
    },
    {
      turnId: 't-2',
      persona: 'red-team' as const,
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
        preferredBy: ['mediator' as const, 'humanitarian' as const],
      },
    ],
    openQuestions: ['Can ICRC verify within 48 hours?'],
    nextActions: [
      { action: 'Open back-channel.', owner: 'mission' as const, urgency: 'immediate' as const },
    ],
  },
};

describe('BrainstormingTableSchema', () => {
  it('accepts a well-formed deliberation', () => {
    expect(BrainstormingTableSchema.safeParse(baseValid).success).toBe(true);
  });

  it('requires at least 2 turns', () => {
    const bad = { ...baseValid, turns: [baseValid.turns[0]] };
    expect(BrainstormingTableSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown persona ids', () => {
    const bad = {
      ...baseValid,
      turns: [{ ...baseValid.turns[0], persona: 'pundit' as never }, baseValid.turns[1]],
    };
    expect(BrainstormingTableSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unknown statuses', () => {
    const bad = {
      ...baseValid,
      turns: [{ ...baseValid.turns[0], status: 'maybe' as never }, baseValid.turns[1]],
    };
    expect(BrainstormingTableSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects empty BLUF in synthesis', () => {
    const bad = { ...baseValid, synthesis: { ...baseValid.synthesis, bluf: 'too short' } };
    expect(BrainstormingTableSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unsupported next-action urgency', () => {
    const bad = {
      ...baseValid,
      synthesis: {
        ...baseValid.synthesis,
        nextActions: [
          { action: 'x', urgency: 'whenever' as never },
        ],
      },
    };
    expect(BrainstormingTableSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unsupported confidence value on a turn', () => {
    const bad = {
      ...baseValid,
      turns: [{ ...baseValid.turns[0], confidence: 'guess' as never }, baseValid.turns[1]],
    };
    expect(BrainstormingTableSchema.safeParse(bad).success).toBe(false);
  });

  it('allows reasoning evidence sourceType when no corpus match', () => {
    const data = {
      ...baseValid,
      turns: [
        {
          ...baseValid.turns[0],
          evidence: [{ sourceType: 'reasoning' as const, excerpt: 'mediator inference' }],
        },
        baseValid.turns[1],
      ],
    };
    expect(BrainstormingTableSchema.safeParse(data).success).toBe(true);
  });
});
