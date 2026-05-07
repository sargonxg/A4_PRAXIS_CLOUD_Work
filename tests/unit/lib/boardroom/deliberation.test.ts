import { describe, expect, it } from 'vitest';
import { buildBoardroomDeliberation } from '@/lib/boardroom/deterministic-boardroom';
import { DeliberationArtifactSchema } from '@/types/boardroom';

describe('deterministic boardroom deliberation', () => {
  it('builds a citable synthesized deliberation under the cost ceiling', () => {
    const deliberation = buildBoardroomDeliberation({
      id: 'd1',
      caseId: 'case-1',
      ownerUid: 'u1',
      now: '2026-05-06T12:00:00.000Z',
      config: {
        question: 'What is the defensible next move this week?',
        satIntegration: { redTeamRound: true, achScoring: true, kacAnnex: false, premortemRound: false },
      },
    });

    expect(() => DeliberationArtifactSchema.parse(deliberation)).not.toThrow();
    expect(deliberation.contributions.length).toBeGreaterThanOrEqual(5);
    expect(deliberation.cost.estimatedUsd).toBeLessThanOrEqual(deliberation.cost.ceilingUsd);
    expect(deliberation.synthesis?.consensusClaims.every((claim) => claim.synthesized && claim.confidence <= 0.6)).toBe(true);
    expect(deliberation.contributions.every((turn) => turn.citations.length > 0)).toBe(true);
  });
});
