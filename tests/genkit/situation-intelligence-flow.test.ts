import { describe, expect, it, vi } from 'vitest';
import type { SituationIntelligence } from '@/lib/ai/schemas/situation-intelligence';

const mocks = vi.hoisted(() => ({
  prompt: vi.fn(),
  defineFlow: vi.fn((_config, fn) => fn),
}));

vi.mock('@/lib/genkit', () => ({
  ai: {
    defineFlow: mocks.defineFlow,
    prompt: mocks.prompt,
  },
  gemini25Pro: { name: 'googleai/gemini-2.5-pro' },
}));

function fixture(): SituationIntelligence {
  return {
    executivePanel: {
      diagnosis: 'The situation is a constrained bargaining contest with rising implementation and messaging risks.',
      keyInsights: [
        'Actor A and Actor B both need verification before they can safely soften public commitments.',
        'The operational constraint is less about intent than the absence of a trusted implementation channel.',
        'Risk will move fastest around public deadlines and allied pressure signals.',
      ],
      biggestRisk: 'Public deadline pressure could turn a manageable verification dispute into a broader escalation cycle.',
      bestAction: 'Stand up a technical verification channel and pair it with restraint language for both actors.',
    },
    strategicInsight: {
      insight: 'Actor A and Actor B are using public firmness to manage credibility, but both are blocked by the same verification-channel constraint.',
      actors: ['Actor A', 'Actor B'],
      constraint: 'No mutually credible verification channel exists.',
      rationale: 'A verification channel changes the cost of restraint by giving both actors a defensible way to explain slower movement.',
    },
    causalTimeline: [{
      date: '2026-05-14',
      event: 'Verification language became the central blocker in the talks.',
      cause: 'The draft did not specify who monitors compliance or how disputes are resolved.',
      effect: 'Both actors shifted toward public pressure while preserving technical room.',
      actors: ['Actor A', 'Actor B'],
      sourceFragmentIds: ['p1'],
    }],
    actorDossiers: [
      {
        actor: 'Actor A',
        goals: ['Preserve credibility while keeping implementation control'],
        leverage: ['Controls timing and public framing of implementation'],
        vulnerabilities: ['Can be punished domestically if compromise appears unilateral'],
      },
      {
        actor: 'Actor B',
        goals: ['Secure verifiable commitments before reducing pressure'],
        leverage: ['Can sustain allied pressure and delay milestones'],
        vulnerabilities: ['Depends on outside support and coalition patience'],
      },
    ],
    scenarios: [
      {
        type: 'best',
        summary: 'A verification channel is accepted and lowers public pressure enough to restart technical bargaining.',
        drivers: ['Named monitors are accepted', 'Public language becomes less maximalist'],
        probabilityEstimate: 25,
        earlyWarningSignals: ['Technical meeting announced', 'Deadline language softens'],
      },
      {
        type: 'likely',
        summary: 'Talks continue with friction while both actors protect leverage and avoid full breakdown.',
        drivers: ['Collapse remains costly', 'Verification remains unresolved'],
        probabilityEstimate: 50,
        earlyWarningSignals: ['Procedural extensions continue', 'Selective leaks shape expectations'],
      },
      {
        type: 'worst',
        summary: 'A public trigger collapses talks and turns verification ambiguity into escalation.',
        drivers: ['No monitoring channel emerges', 'Domestic pressure rewards defiance'],
        probabilityEstimate: 25,
        earlyWarningSignals: ['Ultimatums increase', 'Allies prepare punitive steps'],
      },
    ],
    riskScoring: {
      score: 70,
      drivers: ['Deadline pressure', 'Weak verification channel'],
      explanation: 'Risk is elevated because public commitments and weak verification can make tactical incidents strategically sticky.',
    },
    actions: [
      {
        action: 'Name one technical contact per actor and schedule a verification design meeting.',
        expectedOutcome: 'Creates a lower-risk channel for factual disputes before public escalation.',
        urgency: 'now',
      },
      {
        action: 'Draft shared restraint language tied to the verification meeting.',
        expectedOutcome: 'Reduces the chance that public remarks foreclose technical compromise.',
        urgency: 'next',
      },
      {
        action: 'Track deadline statements and allied mobilization as early warning signals.',
        expectedOutcome: 'Shows when contingency planning should start.',
        urgency: 'watch',
      },
    ],
    memory: {
      reusableSummary: 'Reopen when verification language, deadline posture, or allied mobilization changes.',
      reopenLabel: 'Verification review',
    },
    liveGraph: {
      nodes: [
        { id: 'actor-a', type: 'Actor', label: 'Actor A', summary: 'Principal actor managing credibility.', evidence: 'p1' },
        { id: 'actor-b', type: 'Actor', label: 'Actor B', summary: 'Principal actor seeking verification.', evidence: 'p1' },
        { id: 'constraint-verification', type: 'Constraint', label: 'Verification gap', summary: 'No trusted monitoring channel exists.', evidence: 'p1' },
      ],
      edges: [
        { id: 'e1', source: 'actor-a', target: 'constraint-verification', type: 'constrained-by', evidence: 'Actor A needs defensible monitoring.' },
        { id: 'e2', source: 'actor-b', target: 'constraint-verification', type: 'constrained-by', evidence: 'Actor B requires verification.' },
      ],
    },
    provenance: {
      sourceFragments: [{ id: 'p1', label: 'Input paragraph 1', excerpt: 'Actor A and Actor B are deadlocked over verification.' }],
      derivationNote: 'Derived from the supplied source fragment and calibrated context.',
    },
    confidence: {
      level: 'medium',
      note: 'Confidence is medium because the actors and constraint are clear but the source base is compact.',
      inputWeaknesses: ['Limited chronology'],
    },
  };
}

describe('situationIntelligenceFlow', () => {
  it('runs the dotprompt and returns schema-valid output', async () => {
    const promptRunner = vi.fn(async () => ({ output: fixture() }));
    mocks.prompt.mockReturnValue(promptRunner);

    const { situationIntelligenceFlow } = await import('@/lib/genkit/flows/situation-intelligence');
    const output = await situationIntelligenceFlow({
      systemPromptBlock: '<path-frame>conflict-path</path-frame>',
      toolContext: 'Situation context',
      webContext: 'Web context',
      crossToolContext: 'Prior analysis',
      sourceBlock: '[p1] Input\nActor A and Actor B are deadlocked over verification.',
    });

    expect(mocks.defineFlow).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'situationIntelligence' }),
      expect.any(Function),
    );
    expect(mocks.prompt).toHaveBeenCalledWith('situation-intelligence');
    expect(promptRunner).toHaveBeenCalledWith(
      expect.objectContaining({ sourceBlock: expect.stringContaining('[p1]') }),
      expect.objectContaining({ config: { temperature: 0.4 } }),
    );
    expect(output.executivePanel.keyInsights).toHaveLength(3);
  }, 15000);
});
