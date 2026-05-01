import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SituationIntelligence } from '@/lib/ai/schemas/situation-intelligence';

const mocks = vi.hoisted(() => ({
  withCalibration: vi.fn(),
  callProModel: vi.fn(),
  saveToolData: vi.fn(),
  saveToolOutput: vi.fn(),
}));

vi.mock('@/lib/api/with-calibration', () => ({
  withCalibration: mocks.withCalibration,
}));

vi.mock('@/lib/ai/providers', () => ({
  callProModel: mocks.callProModel,
}));

vi.mock('@/lib/firebase/tool-data-service', () => ({
  saveToolData: mocks.saveToolData,
}));

vi.mock('@/lib/api/save-tool-output', () => ({
  saveToolOutput: mocks.saveToolOutput,
}));

vi.mock('@/lib/ai/situation-context', () => ({
  buildToolContext: () => 'minimal situation context',
  buildCrossToolContext: vi.fn(async () => 'prior saved analysis context'),
  buildWebGroundedContext: vi.fn(async () => 'web-grounded situation context'),
}));

vi.mock('ai', () => ({
  Output: { object: (input: unknown) => input },
}));

function fixture(): SituationIntelligence {
  return {
    executivePanel: {
      diagnosis: 'The dispute is entering a high-friction bargaining window shaped by leverage and timing constraints.',
      keyInsights: [
        'Actor A and Actor B both need visible firmness while quietly preserving room for process concessions.',
        'The most actionable pressure point is monitoring design rather than a final-status bargain.',
        'Escalation risk is concentrated around deadlines that force public statements before verification exists.',
      ],
      biggestRisk: 'A public deadline could force both actors into irreversible positions before technical monitoring is agreed.',
      bestAction: 'Convene a technical verification channel with named contacts, a seven-day workplan, and public language restraint.',
    },
    strategicInsight: {
      insight: 'Actor A and Actor B are less constrained by disagreement over the endpoint than by the absence of a verification channel both can defend publicly.',
      actors: ['Actor A', 'Actor B'],
      constraint: 'Absence of a mutually credible verification channel',
      rationale: 'A verification channel lets both actors protect credibility while reducing the risk that tactical incidents become strategic commitments.',
    },
    causalTimeline: [{
      date: '2026-04-20',
      event: 'Talks stalled after monitoring language was rejected.',
      cause: 'The draft lacked named monitors and implementation deadlines.',
      effect: 'Both actors shifted to public pressure and reduced technical contact.',
      actors: ['Actor A', 'Actor B'],
      sourceFragmentIds: ['p1'],
    }],
    actorDossiers: [
      {
        actor: 'Actor A',
        goals: ['Protect credibility while keeping bargaining space open'],
        leverage: ['Controls implementation timing and public messaging'],
        vulnerabilities: ['Faces backlash if concessions look unilateral'],
      },
      {
        actor: 'Actor B',
        goals: ['Secure verifiable commitments before reducing pressure'],
        leverage: ['Can mobilize allied support and delay procedural milestones'],
        vulnerabilities: ['Depends on external support that may weaken over time'],
      },
    ],
    scenarios: [
      {
        type: 'best',
        summary: 'A limited verification arrangement lowers public pressure and reopens technical bargaining.',
        drivers: ['Named monitors are accepted', 'Public language becomes less maximalist'],
        probabilityEstimate: 25,
        earlyWarningSignals: ['Joint technical meeting announced', 'Deadline language softens'],
      },
      {
        type: 'likely',
        summary: 'The process continues with friction while both actors preserve leverage and avoid full breakdown.',
        drivers: ['Neither side benefits from collapse', 'Verification remains unresolved'],
        probabilityEstimate: 50,
        earlyWarningSignals: ['Procedural extensions continue', 'Selective leaks shape expectations'],
      },
      {
        type: 'worst',
        summary: 'A public trigger collapses talks and converts procedural disagreement into escalation.',
        drivers: ['No monitoring channel emerges', 'Domestic pressure rewards defiance'],
        probabilityEstimate: 25,
        earlyWarningSignals: ['Ultimatums increase', 'Allies prepare punitive steps'],
      },
    ],
    riskScoring: {
      score: 70,
      drivers: ['Deadline pressure', 'Weak verification channel', 'High public commitment costs'],
      explanation: 'Risk is high because tactical ambiguity and public commitments can turn manageable disputes into escalation.',
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
        expectedOutcome: 'Gives the team a live indicator for when contingency planning should start.',
        urgency: 'watch',
      },
    ],
    memory: {
      reusableSummary: 'Reopen this analysis when verification language, deadline posture, or allied mobilization changes.',
      reopenLabel: 'Verification channel review',
    },
    liveGraph: {
      nodes: [
        {
          id: 'actor-a',
          type: 'Actor',
          label: 'Actor A',
          summary: 'Principal actor managing credibility and timing.',
          evidence: 'Derived from p1.',
        },
        {
          id: 'actor-b',
          type: 'Actor',
          label: 'Actor B',
          summary: 'Principal actor seeking verifiable commitments.',
          evidence: 'Derived from p1.',
        },
        {
          id: 'constraint-verification',
          type: 'Constraint',
          label: 'Verification channel gap',
          summary: 'No mutually credible monitoring process exists.',
          evidence: 'Derived from p1.',
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'actor-a',
          target: 'constraint-verification',
          type: 'constrained-by',
          evidence: 'Actor A needs a defensible mechanism.',
        },
        {
          id: 'e2',
          source: 'actor-b',
          target: 'constraint-verification',
          type: 'constrained-by',
          evidence: 'Actor B requires verification before reducing pressure.',
        },
      ],
    },
    provenance: {
      sourceFragments: [{
        id: 'p1',
        label: 'Input paragraph 1',
        excerpt: 'Actor A and Actor B are deadlocked over verification, deadlines, and public messaging.',
      }],
      derivationNote: 'Derived from the supplied situation paragraph, actors, and prior calibrated context.',
    },
    confidence: {
      level: 'medium',
      note: 'Confidence is medium because the main actors and constraint are clear but source detail is limited.',
      inputWeaknesses: ['Limited chronology', 'Few direct source fragments'],
    },
  };
}

describe('situation-intelligence route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.withCalibration.mockImplementation((_toolId, _op, _opts) => (
      handler: (req: Request, ctx: {
        uid: string;
        calibration: { systemPromptBlock: string; provenance: { profileVersion: number } };
      }) => Promise<Response>,
    ) => async (req: Request) => handler(req, {
      uid: 'u1',
      calibration: {
        systemPromptBlock: '<analyst-profile/>',
        provenance: { profileVersion: 3 },
      },
    }));
    mocks.callProModel.mockResolvedValue({ output: fixture() });
    mocks.saveToolData.mockResolvedValue({ generatedAt: '2026-04-29T00:00:00Z', version: 1 });
    mocks.saveToolOutput.mockResolvedValue(undefined);
  });

  it('uses the explicit situation-intelligence calibration and credit operation', async () => {
    await import('@/app/api/ai/situation-intelligence/route');

    expect(mocks.withCalibration).toHaveBeenCalledWith(
      'situation-intelligence',
      'ai_situation_intelligence',
      expect.objectContaining({ retrievalQuery: expect.any(Function) }),
    );
  });

  it('returns schema-valid intelligence and saves canonical tool data', async () => {
    const { POST } = await import('@/app/api/ai/situation-intelligence/route');
    const res = await POST(new Request('http://localhost/api/ai/situation-intelligence', {
      method: 'POST',
      body: JSON.stringify({
        situation: {
          id: 's1',
          name: 'Verification Dispute',
          type: 'international',
          description: 'Actor A and Actor B are deadlocked over verification, deadlines, and public messaging in a fragile negotiation process.',
          region: 'Test Region',
          actors: ['Actor A', 'Actor B'],
          userRole: 'analyst',
          status: 'active',
          riskScore: 60,
          glaslStage: 4,
          escalationTrend: 'escalating',
          actorCount: 2,
          graphEntities: 0,
          documentCount: 0,
          createdAt: '2026-04-29T00:00:00Z',
          updatedAt: '2026-04-29T00:00:00Z',
        },
      }),
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.executivePanel.diagnosis).toContain('bargaining window');
    expect(json.persistence.toolDataSaved).toBe(true);
    expect(mocks.saveToolData).toHaveBeenCalledWith('u1', 's1', 'situation-intelligence', expect.objectContaining({
      toolId: 'situation-intelligence',
    }));
  });

  it('refuses thin input before calling the model', async () => {
    const { POST } = await import('@/app/api/ai/situation-intelligence/route');
    const res = await POST(new Request('http://localhost/api/ai/situation-intelligence', {
      method: 'POST',
      body: JSON.stringify({ situation: { id: 's1', name: 'Thin', description: '', actors: [] } }),
    }));

    expect(res.status).toBe(422);
    expect(mocks.callProModel).not.toHaveBeenCalled();
  });

  it('returns a controlled 502 when the model output violates schema', async () => {
    mocks.callProModel.mockResolvedValueOnce({ output: { executivePanel: { diagnosis: 'too thin' } } });
    const { POST } = await import('@/app/api/ai/situation-intelligence/route');
    const res = await POST(new Request('http://localhost/api/ai/situation-intelligence', {
      method: 'POST',
      body: JSON.stringify({
        situation: {
          id: 's1',
          name: 'Invalid Output Case',
          description: 'Actor A and Actor B have enough context to call the model, but the mocked output is invalid.',
          actors: ['Actor A', 'Actor B'],
        },
      }),
    }));

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ kind: 'schema_validation_failed' });
  });
});
