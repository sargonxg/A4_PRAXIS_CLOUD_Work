import { describe, expect, it } from 'vitest';

import { buildTacitusRoutingDecision } from '@/lib/ai/tacitus-routing-policy';

describe('TACITUS routing policy', () => {
  it('routes simple capsule questions to fast direct answers and ignores saved user model choices', () => {
    const decision = buildTacitusRoutingDecision({
      prompt: 'What should I look at next?',
      intent: 'normal_answer',
      userSelectedModelId: 'gemini-2.5-pro',
      capsuleHealth: 'ready',
      sourcePreviewCount: 2,
      activeGapCount: 0,
    });

    expect(decision.modelTier).toBe('fast');
    expect(decision.workerMode).toBe('direct-answer');
    expect(decision.userSelectedModelIgnored).toBe(true);
    expect(decision.userSafeLabels.modelTier).toBe('TACITUS selected fast reasoning');
    expect(decision.reasons).toEqual(expect.arrayContaining(['user model preference ignored for Ask PRAXIS']));
  });

  it.each([
    ['Do a deep current multi-source memo on access restrictions.', 'research_memo', 'research-memo', 'research-memo', 'deep'],
    ['Source-check this answer before export.', 'sourceability_review', 'sourceability-reviewer', 'sourceability-reviewer', 'sourceability'],
    ['Red-team the assumptions and risks.', 'red_team_review', 'red-team-analyst', 'red-team-analyst', 'deep'],
    ['Build a handover package for the next analyst.', 'handover', 'handover-builder', 'handover-builder', 'deep'],
    ['Build a ContextCapsule from these notes and attached sources.', 'normal_answer', 'capsule-factory', 'capsule-factory', 'deep'],
    ['Format this into a memo-ready PDF and Markdown export.', 'normal_answer', 'output-formatter', 'output-formatter', 'standard'],
  ] as const)('routes %s', (prompt, intent, policyAgentId, workerMode, modelTier) => {
    const decision = buildTacitusRoutingDecision({
      prompt,
      intent,
      capsuleHealth: 'thin',
      sourcePreviewCount: 1,
      activeGapCount: 2,
    });

    expect(decision.policyAgentId).toBe(policyAgentId);
    expect(decision.workerMode).toBe(workerMode);
    expect(decision.modelTier).toBe(modelTier);
    expect(decision.fallbackChain.length).toBeGreaterThan(0);
  });
});
