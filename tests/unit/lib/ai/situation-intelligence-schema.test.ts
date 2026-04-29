import { describe, expect, it } from 'vitest';
import {
  validateSituationIntelligence,
  type SituationIntelligence,
} from '@/lib/ai/schemas/situation-intelligence';

function baseFixture(overrides: Partial<SituationIntelligence> = {}): SituationIntelligence {
  const fixture: SituationIntelligence = {
    executivePanel: {
      diagnosis: 'The situation is constrained by rival incentives and a closing diplomatic window.',
      keyInsights: [
        'The main pressure point is the mismatch between public claims and private room for compromise.',
        'Operational leverage sits with actors that can slow implementation without formally rejecting talks.',
        'The next durable move is a narrow verification mechanism rather than a broad settlement push.',
      ],
      biggestRisk: 'A symbolic incident could force public escalation before private bargaining space is protected.',
      bestAction: 'Open a short verification track with named principals and a deadline tied to observable steps.',
    },
    strategicInsight: {
      insight: 'Actor A and Actor B both need public firmness, but the shared budget and timing constraint makes a narrow implementation bargain more realistic than a headline agreement.',
      actors: ['Actor A', 'Actor B'],
      constraint: 'Budget and timing constraint',
      rationale: 'The actors gain more from controlling sequencing than from maximal public concessions, so leverage should focus on process guarantees.',
    },
    causalTimeline: [
      {
        date: '2026-04-01',
        event: 'Actor A hardened its position after talks stalled.',
        cause: 'The prior proposal lacked credible monitoring.',
        effect: 'Actor B shifted resources toward a defensive posture.',
        actors: ['Actor A', 'Actor B'],
        sourceFragmentIds: ['p1'],
      },
    ],
    actorDossiers: [
      {
        actor: 'Actor A',
        goals: ['Preserve public credibility while keeping negotiation space open'],
        leverage: ['Controls implementation timing and public messaging'],
        vulnerabilities: ['Faces backlash if concessions appear unilateral'],
      },
      {
        actor: 'Actor B',
        goals: ['Secure verifiable commitments before reducing pressure'],
        leverage: ['Can mobilize allies and delay procedural milestones'],
        vulnerabilities: ['Depends on external support that may weaken over time'],
      },
    ],
    scenarios: [
      {
        type: 'best',
        summary: 'A limited verification deal lowers escalation pressure and creates space for deeper talks.',
        drivers: ['Third-party monitoring becomes acceptable', 'Both sides need visible progress'],
        probabilityEstimate: 25,
        earlyWarningSignals: ['Joint technical meeting announced', 'Public language shifts toward verification'],
      },
      {
        type: 'likely',
        summary: 'Talks continue with periodic friction while actors preserve leverage and avoid irreversible moves.',
        drivers: ['Neither side can absorb a breakdown', 'Core constraints remain unresolved'],
        probabilityEstimate: 50,
        earlyWarningSignals: ['Procedural extensions', 'Selective leaks without formal withdrawal'],
      },
      {
        type: 'worst',
        summary: 'A public trigger collapses the process and pushes both actors into escalatory commitments.',
        drivers: ['Monitoring remains absent', 'Domestic pressure rewards visible defiance'],
        probabilityEstimate: 25,
        earlyWarningSignals: ['Deadline threats', 'Allied actors begin preparing punitive measures'],
      },
    ],
    riskScoring: {
      score: 68,
      drivers: ['High public commitment costs', 'Weak monitoring channel', 'External pressure on timelines'],
      explanation: 'The score reflects elevated tension because actors retain incentives to escalate publicly while lacking trusted verification mechanisms.',
    },
    actions: [
      {
        action: 'Define one verifiable step each actor can take within seven days.',
        expectedOutcome: 'Creates a low-cost proof point that reduces pressure for public escalation.',
        urgency: 'now',
      },
      {
        action: 'Assign a single contact for technical monitoring questions.',
        expectedOutcome: 'Reduces misinterpretation and speeds correction of disputed facts.',
        urgency: 'next',
      },
      {
        action: 'Track public statements for shifts from claims to implementation details.',
        expectedOutcome: 'Provides early warning that bargaining space is opening or closing.',
        urgency: 'watch',
      },
    ],
    memory: {
      reusableSummary: 'This analysis should be reopened when the verification channel changes or public deadlines move.',
      reopenLabel: 'Verification leverage review',
    },
    liveGraph: {
      nodes: [
        {
          id: 'actor-a',
          type: 'Actor',
          label: 'Actor A',
          summary: 'Principal actor seeking credibility and sequencing control.',
          evidence: 'Derived from source paragraph p1.',
        },
        {
          id: 'claim-a',
          type: 'Claim',
          label: 'Credible monitoring is missing',
          summary: 'The core claim concerns lack of trusted monitoring.',
          evidence: 'Derived from source paragraph p1.',
        },
        {
          id: 'constraint-budget',
          type: 'Constraint',
          label: 'Budget and timing constraint',
          summary: 'Limits the feasibility of broad commitments.',
          evidence: 'Derived from source paragraph p1.',
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'actor-a',
          target: 'claim-a',
          type: 'raises',
          evidence: 'Actor A hardened its position after monitoring concerns.',
        },
        {
          id: 'e2',
          source: 'claim-a',
          target: 'constraint-budget',
          type: 'constrained-by',
          evidence: 'The claim is difficult to resolve under timing limits.',
        },
      ],
    },
    provenance: {
      sourceFragments: [
        {
          id: 'p1',
          label: 'Input paragraph 1',
          excerpt: 'Actor A and Actor B remain in talks, but monitoring, budget, and timing constraints are unresolved.',
        },
      ],
      derivationNote: 'The analysis is derived from the input paragraph and named actors, with uncertainty noted where details are sparse.',
    },
    confidence: {
      level: 'medium',
      note: 'Confidence is medium because actors and constraints are clear, but source detail is limited.',
      inputWeaknesses: ['No full chronology', 'Limited evidence on external actors'],
    },
  };

  return { ...fixture, ...overrides };
}

describe('SituationIntelligenceSchema', () => {
  it('validates a geopolitical situation output', () => {
    const parsed = validateSituationIntelligence(baseFixture({
      strategicInsight: {
        insight: 'Nordalia and Sudralia are publicly contesting sovereignty, but the port access constraint makes maritime inspection sequencing more valuable than status language.',
        actors: ['Nordalia', 'Sudralia'],
        constraint: 'Port access and inspection sequencing',
        rationale: 'Both actors can claim firmness while using inspection timing to reduce immediate security risk.',
      },
    }));

    expect(parsed.scenarios.map((scenario) => scenario.type)).toEqual(['best', 'likely', 'worst']);
  });

  it('validates a corporate conflict output', () => {
    const parsed = validateSituationIntelligence(baseFixture({
      actorDossiers: [
        {
          actor: 'Product',
          goals: ['Protect launch credibility and customer commitments'],
          leverage: ['Controls release scope and customer roadmap language'],
          vulnerabilities: ['Launch delay will reduce trust with enterprise accounts'],
        },
        {
          actor: 'Security',
          goals: ['Prevent release of unreviewed access-control changes'],
          leverage: ['Can block security signoff and incident acceptance'],
          vulnerabilities: ['May be blamed for revenue delay without a concrete remediation plan'],
        },
      ],
    }));

    expect(parsed.actorDossiers).toHaveLength(2);
  });

  it('validates a policy memo output', () => {
    const parsed = validateSituationIntelligence(baseFixture({
      executivePanel: {
        diagnosis: 'The policy choice is viable only if implementation risk is made explicit before approval.',
        keyInsights: [
          'The memo needs a narrower objective because current authority and funding do not support the full proposal.',
          'The decisive constraint is operational capacity, not political demand for the policy objective.',
          'A staged rollout gives decision-makers a way to approve direction without overpromising delivery.',
        ],
        biggestRisk: 'Approving the full policy without capacity gates would create a credibility failure during implementation.',
        bestAction: 'Approve a staged pilot with capacity gates, public reporting, and a stop/go decision date.',
      },
    }));

    expect(parsed.riskScoring.score).toBeGreaterThanOrEqual(0);
  });

  it('rejects strategic insights that do not combine at least two actors', () => {
    expect(() => validateSituationIntelligence(baseFixture({
      strategicInsight: {
        insight: 'Actor A has a useful path forward but no second actor is included in the claim.',
        actors: ['Actor A'],
        constraint: 'Timing constraint',
        rationale: 'This should fail because the schema requires at least two actors.',
      },
    }))).toThrow();
  });
});
