import { describe, expect, it } from 'vitest';

import {
  buildWorkIntentPlan,
  resolvePolicyContextPreset,
} from '@/lib/ai/work-intent-router';

describe('Ask PRAXIS work intent router', () => {
  it('resolves U.S. federal AI governance perspective requests into policy context', () => {
    const plan = buildWorkIntentPlan({
      prompt: 'Analyze this from a U.S. federal AI governance perspective.',
      contextHealth: 'ready',
      activeCapsules: [{ capsuleId: 'starter-situation-ai-governance-procurement', tags: ['ai-governance'] }],
      attachedSourceCount: 2,
    });

    expect(plan.intent).toBe('legal_policy_context');
    expect(plan.policyContext).toMatchObject({
      presetId: 'us_federal',
      subPresetId: 'ai_governance',
      jurisdiction: 'United States',
      level: 'federal',
    });
    expect(plan.recommendedCapsuleIds).toEqual(expect.arrayContaining([
      'starter-situation-us-federal-ai-governance-baseline',
      'starter-tool-sourceability-audit-reviewer',
    ]));
    expect(plan.recommendedTools).toEqual(expect.arrayContaining([
      'sourceability-reviewer',
      'policy-memo',
    ]));
    expect(plan.humanReviewPosture.required).toBe(true);
    expect(plan.suggestedNextActions).toHaveLength(3);
  });

  it('honors explicit PDF report mode and caps visible next actions to three', () => {
    const plan = buildWorkIntentPlan({
      prompt: 'Turn this into a polished export with citations.',
      explicitMode: 'pdf_report',
      contextHealth: 'thin',
      selectedSourceIds: ['source-1'],
    });

    expect(plan.intent).toBe('pdf_report');
    expect(plan.outputTarget).toBe('pdf_report');
    expect(plan.recommendedCapsuleIds).toContain('starter-output-pdf-policy-memo-style');
    expect(plan.humanReviewPosture.gate).toMatch(/PDF|export|source/i);
    expect(plan.suggestedNextActions).toHaveLength(3);
  });

  it('falls back to a direct general answer for ambiguous prompts', () => {
    const plan = buildWorkIntentPlan({
      prompt: 'What should I consider next?',
      contextHealth: 'ready',
    });

    expect(plan.intent).toBe('general_answer');
    expect(plan.outputTarget).toBe('ask_answer');
    expect(plan.confidence).toBeLessThan(0.75);
    expect(plan.policyContext).toBeNull();
    expect(plan.suggestedNextActions).toHaveLength(3);
  });

  it('matches policy presets from capsule metadata as well as prompt language', () => {
    const resolution = resolvePolicyContextPreset({
      prompt: 'Review the source pack before drafting.',
      capsuleMetadata: [{
        capsuleId: 'cap-eu',
        label: 'EU AI Act capsule',
        tags: ['eu', 'ai-governance'],
        domain: 'ai-governance',
      }],
    });

    expect(resolution).toMatchObject({
      presetId: 'eu',
      subPresetId: 'ai_governance',
      jurisdiction: 'European Union',
    });
  });
});
