import { describe, expect, it } from 'vitest';

import { buildTacitusRoutingDecision } from '@/lib/ai/tacitus-routing-policy';
import { getModelMatrixEntry } from '@/lib/ai/model-matrix';

describe('TACITUS routing policy', () => {
  it('routes simple capsule questions to fast direct answers and ignores saved user model choices', () => {
    const decision = buildTacitusRoutingDecision({
      prompt: 'Recall the actor names from the supplied capsule.',
      intent: 'normal_answer',
      userSelectedModelId: 'gemini-2.5-pro',
      capsuleHealth: 'ready',
      sourcePreviewCount: 2,
      activeGapCount: 0,
    });

    expect(decision.modelTier).toBe('fast');
    expect(decision.workerMode).toBe('direct-answer');
    expect(decision.userSelectedModelIgnored).toBe(true);
    expect(decision.userSafeLabels.modelTier).toBe('Economical recall and extraction');
    expect(decision.reasons).toEqual(expect.arrayContaining(['user model preference ignored for Ask PRAXIS']));
  });
  it('defaults substantive analytical prose to balanced rather than economical recall', () => {
    const decision = buildTacitusRoutingDecision({ prompt: 'Explain why these actors adopted this position and give its policy implications.', intent: 'normal_answer', capsuleHealth: 'ready', sourcePreviewCount: 2, activeGapCount: 0 });
    expect(decision.modelTier).toBe('standard');
    expect(decision.modelTaskKind).toBe('balanced');
    expect(decision.selectedModelId).toBe('gemini-3.5-flash');
    expect(decision.modelBudget.maxOutputTokens).toBe(8192);
  });

  it.each([
    'Using only the supplied notes, recall the authorized allocation and deadline. Do not run agents or web research.',
    'Extract the actor names and dates from the attached document.',
    'Classify these supplied claims by actor.',
    'Summarize this document in three bullets.',
  ])('uses a genuinely economical, bounded model for %s', (prompt) => {
    const decision = buildTacitusRoutingDecision({ prompt, intent: 'normal_answer', capsuleHealth: 'ready', sourcePreviewCount: 2, activeGapCount: 0 });
    expect(decision.modelTaskKind).toBe('cheap_classify');
    expect(decision.selectedModelId).toBe('gemini-3.1-flash-lite');
    expect(decision.modelBudget.maxOutputTokens).toBe(1024);
    expect(decision.fallbackChain.length).toBeLessThanOrEqual(3);
  });

  it('reserves capable synthesis for contradictory evidence without enabling prohibited tools', () => {
    const decision = buildTacitusRoutingDecision({
      prompt: 'Reconcile contradictory supplied evidence and assess alternative policy options. Do not use web sources or run agents.',
      intent: 'normal_answer', capsuleHealth: 'ready', sourcePreviewCount: 2, activeGapCount: 0,
    });
    expect(decision.modelTaskKind).toBe('complex_reasoning');
    expect(decision.selectedModelId).toBe('gemini-3.1-pro-preview');
    expect(decision.selectedModelId).not.toBe(getModelMatrixEntry('cheap_classify').model);
    expect(decision.workerMode).toBe('direct-answer');
    expect(decision.toolRoute.selectedToolIds).not.toContain('grounded-search');
    expect(decision.toolRoute.selectedToolIds).not.toContain('deep-search-agent');
    expect(decision.modelBudget.maxOutputTokens).toBeLessThanOrEqual(16384);
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
