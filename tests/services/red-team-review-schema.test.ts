import { describe, it, expect } from 'vitest';
import { RedTeamReviewSchema } from '@/app/api/ai/red-team-review/route';

const baseValid = {
  reviewedToolId: 'briefing_room',
  reviewedAt: '2026-04-26T12:00:00.000Z',
  bluf: 'The brief leans on a single OCHA flag without independent verification; treat as low-confidence until ICRC corroborates.',
  unstatedAssumptions: [
    {
      claim: 'AFN field commander will accept a 72-hour pause',
      whyFlagged: 'No source-backed evidence of his current posture; inferred only.',
      severity: 'high' as const,
    },
  ],
  sourceDiversityIssues: ['All three citations come from OCHA-family sources.'],
  motivatedReasoningRedFlags: ['Recommendation favours the analyst\'s prior framing without testing the alternative.'],
  missingIntelligenceGaps: ['No casualty verification by ICRC or local health cluster.'],
  confidenceAdjustment: {
    originalConfidence: 'medium' as const,
    suggestedConfidence: 'low' as const,
    rationale: 'Single-source corroboration on the central claim plus motivated-reasoning indicator on the recommendation.',
  },
  whatWouldChangeMyMind: 'An ICRC sitrep within 48 hours that confirms or contradicts the casualty figure.',
  recommendedFollowUps: [
    { action: 'Request ICRC verification.', tool: 'source-scout', urgency: 'immediate' as const },
  ],
};

describe('RedTeamReviewSchema', () => {
  it('accepts a fully populated review', () => {
    expect(RedTeamReviewSchema.safeParse(baseValid).success).toBe(true);
  });

  it('accepts empty arrays when nothing was flagged', () => {
    const minimal = {
      ...baseValid,
      unstatedAssumptions: [],
      sourceDiversityIssues: [],
      motivatedReasoningRedFlags: [],
      missingIntelligenceGaps: [],
    };
    expect(RedTeamReviewSchema.safeParse(minimal).success).toBe(true);
  });

  it('requires whatWouldChangeMyMind even when nothing else is flagged', () => {
    const bad = { ...baseValid, whatWouldChangeMyMind: 'short' };
    expect(RedTeamReviewSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unsupported severity on flagged assumptions', () => {
    const bad = {
      ...baseValid,
      unstatedAssumptions: [
        { ...baseValid.unstatedAssumptions[0], severity: 'spicy' as never },
      ],
    };
    expect(RedTeamReviewSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unsupported confidence values', () => {
    const bad = {
      ...baseValid,
      confidenceAdjustment: { ...baseValid.confidenceAdjustment, suggestedConfidence: 'eh' as never },
    };
    expect(RedTeamReviewSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects too-short BLUF', () => {
    const bad = { ...baseValid, bluf: 'too short' };
    expect(RedTeamReviewSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects too-short rationale on confidence adjustment', () => {
    const bad = {
      ...baseValid,
      confidenceAdjustment: { ...baseValid.confidenceAdjustment, rationale: 'short' },
    };
    expect(RedTeamReviewSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects unsupported follow-up urgency', () => {
    const bad = {
      ...baseValid,
      recommendedFollowUps: [{ action: 'x', urgency: 'whenever' as never }],
    };
    expect(RedTeamReviewSchema.safeParse(bad).success).toBe(false);
  });
});
