import { z } from 'genkit';

export const GenkitSourceFragmentSchema = z.object({
  id: z.string(),
  label: z.string(),
  excerpt: z.string(),
});

export const GenkitIntelligenceNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['Actor', 'Claim', 'Interest', 'Constraint', 'Event']),
  label: z.string(),
  summary: z.string(),
  evidence: z.string(),
});

export const GenkitIntelligenceEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string(),
  evidence: z.string(),
});

export const GenkitSituationIntelligenceSchema = z.object({
  executivePanel: z.object({
    diagnosis: z.string(),
    keyInsights: z.array(z.string()),
    biggestRisk: z.string(),
    bestAction: z.string(),
  }),
  strategicInsight: z.object({
    insight: z.string(),
    actors: z.array(z.string()),
    constraint: z.string(),
    rationale: z.string(),
  }),
  causalTimeline: z.array(z.object({
    date: z.string(),
    event: z.string(),
    cause: z.string(),
    effect: z.string(),
    actors: z.array(z.string()),
    sourceFragmentIds: z.array(z.string()),
  })),
  actorDossiers: z.array(z.object({
    actor: z.string(),
    goals: z.array(z.string()),
    leverage: z.array(z.string()),
    vulnerabilities: z.array(z.string()),
  })),
  scenarios: z.array(z.object({
    type: z.enum(['best', 'likely', 'worst']),
    summary: z.string(),
    drivers: z.array(z.string()),
    probabilityEstimate: z.number(),
    earlyWarningSignals: z.array(z.string()),
  })),
  riskScoring: z.object({
    score: z.number(),
    drivers: z.array(z.string()),
    explanation: z.string(),
  }),
  actions: z.array(z.object({
    action: z.string(),
    expectedOutcome: z.string(),
    urgency: z.enum(['now', 'next', 'watch']),
  })),
  memory: z.object({
    reusableSummary: z.string(),
    reopenLabel: z.string(),
  }),
  liveGraph: z.object({
    nodes: z.array(GenkitIntelligenceNodeSchema),
    edges: z.array(GenkitIntelligenceEdgeSchema),
  }),
  provenance: z.object({
    sourceFragments: z.array(GenkitSourceFragmentSchema),
    derivationNote: z.string(),
  }),
  confidence: z.object({
    level: z.enum(['high', 'medium', 'low']),
    note: z.string(),
    inputWeaknesses: z.array(z.string()),
  }),
});
