import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prompt: vi.fn(),
  defineFlow: vi.fn((_config, fn) => fn),
}));

vi.mock('@/lib/genkit', () => ({
  ai: {
    defineFlow: mocks.defineFlow,
    prompt: mocks.prompt,
  },
  gemini25Flash: { name: 'googleai/gemini-2.5-flash' },
}));

describe('classifyPathFlow', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.prompt.mockReturnValue(vi.fn(async () => {
      throw new Error('model unavailable');
    }));
  });

  it('runs the classify-path dotprompt and normalizes capsule defaults', async () => {
    const promptRunner = vi.fn(async () => ({
      output: {
        policyPathId: 'foreign-policy',
        confidence: 0.87,
        rationale: 'The seed text is about diplomatic briefings and sanctions posture.',
        suggestedUserCore: {
          role: 'Foreign policy analyst',
          audience: 'Principal',
          workingStyle: 'Use diplomatic language and source caveats.',
          evidencePosture: 'Prefer primary sources and preserve uncertainty.',
        },
        suggestedSituationCore: {
          problemFrame: 'Diplomatic response to sanctions escalation.',
          actors: ['foreign ministry', 'sanctions office'],
          geography: 'Eastern Europe',
          decisionContext: 'Prepare options for a senior briefing.',
          timeHorizon: 'Next two weeks',
        },
        suggestedTools: ['Source Scout', 'Policy Memo'],
        suggestedOutputs: ['Diplomatic brief'],
        missingInformationQuestions: ['Which sources should be treated as authoritative?'],
        alternates: [
          { id: 'legal-compliance', confidence: 0.55 },
          { id: 'foreign-policy', confidence: 0.4 },
        ],
      },
    }));
    mocks.prompt.mockReturnValue(promptRunner);

    const { classifyPathFlow } = await import('@/lib/genkit/flows/classify-path');
    const result = await classifyPathFlow({
      domainId: 'diplomacy-negotiation',
      name: 'Sanctions options',
      description: 'Prepare a diplomatic options memo on sanctions and multilateral posture.',
      sourceUrls: [],
    });

    expect(mocks.defineFlow).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'classifyPath' }),
      expect.any(Function),
    );
    expect(mocks.prompt).toHaveBeenCalledWith('classify-path');
    expect(promptRunner).toHaveBeenCalledWith(
      expect.objectContaining({
        domainId: 'diplomacy-negotiation',
        pathCatalogue: expect.stringContaining('foreign-policy'),
      }),
      expect.objectContaining({ config: { temperature: 0 } }),
    );
    expect(result).toMatchObject({
      policyPathId: 'foreign-policy',
      confidence: 0.87,
      alternates: [{ id: 'legal-compliance', confidence: 0.55 }],
    });
    expect(result.suggestedTools).toEqual(expect.arrayContaining(['Source Scout', 'Policy Memo']));
  // Includes a cold import of the Genkit dependency graph on Windows; the
  // model itself is mocked, so this is not a model-latency acceptance limit.
  }, 60_000);

  it('classifies a foreign policy prompt deterministically', async () => {
    const { classifyPathFlow } = await import('@/lib/genkit/flows/classify-path');
    const result = await classifyPathFlow({
      name: 'Diplomatic brief',
      description: 'Prepare a foreign policy memo on multilateral diplomacy, sanctions posture, and talking points for the minister.',
      sourceUrls: [],
    });

    expect(result.policyPathId).toBe('foreign-policy');
    expect(result.suggestedOutputs).toContain('Diplomatic brief');
    expect(result.missingInformationQuestions.length).toBeGreaterThan(0);
  });

  it('classifies an HR policy prompt deterministically', async () => {
    const { classifyPathFlow } = await import('@/lib/genkit/flows/classify-path');
    const result = await classifyPathFlow({
      name: 'Remote work update',
      description: 'Review an HR policy change for affected employee groups, legal review, approvals, and rollout communications.',
      sourceUrls: [],
    });

    expect(result.policyPathId).toBe('hr-policy');
    expect(result.suggestedOutputs).toContain('Policy rollout note');
  });

  it('classifies a compliance prompt deterministically', async () => {
    const { classifyPathFlow } = await import('@/lib/genkit/flows/classify-path');
    const result = await classifyPathFlow({
      name: 'Vendor sanctions review',
      description: 'Check entity exposure, source receipts, sanctions rules, contradictions, and compliance sign-off posture.',
      sourceUrls: [],
    });

    expect(result.policyPathId).toBe('legal-compliance');
    expect(result.suggestedTools).toContain('Sanctions Check');
  });

  it('classifies a crisis prompt deterministically', async () => {
    const { classifyPathFlow } = await import('@/lib/genkit/flows/classify-path');
    const result = await classifyPathFlow({
      name: 'Morning crisis update',
      description: 'Build a crisis brief with fresh episodes, changing actors, escalation risk, deadlines, and executive updates.',
      sourceUrls: [],
    });

    expect(result.policyPathId).toBe('crisis-management');
    expect(result.suggestedOutputs).toContain('Situation brief');
  });

  it('keeps an unclear prompt generic and asks for missing information', async () => {
    const { classifyPathFlow } = await import('@/lib/genkit/flows/classify-path');
    const result = await classifyPathFlow({
      name: 'Help',
      description: 'I need to figure something out soon.',
      sourceUrls: [],
    });

    expect(result.policyPathId).toBe('generic-policy');
    expect(result.confidence).toBeLessThan(0.4);
    expect(result.missingInformationQuestions).toContain('Which policy domain or working path best describes this work?');
  });
});
