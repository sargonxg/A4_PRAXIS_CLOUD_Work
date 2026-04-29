import { z } from 'zod';

export const SourceFragmentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  excerpt: z.string().min(1).max(800),
});

export const IntelligenceNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['Actor', 'Claim', 'Interest', 'Constraint', 'Event']),
  label: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  evidence: z.string().min(1).max(500),
});

export const IntelligenceEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.string().min(1).max(80),
  evidence: z.string().min(1).max(500),
});

export const SituationIntelligenceSchema = z.object({
  executivePanel: z.object({
    diagnosis: z.string().min(20).max(220),
    keyInsights: z.array(z.string().min(20).max(240)).length(3),
    biggestRisk: z.string().min(20).max(240),
    bestAction: z.string().min(20).max(240),
  }),
  strategicInsight: z.object({
    insight: z.string().min(40).max(360),
    actors: z.array(z.string().min(1).max(120)).min(2).max(5),
    constraint: z.string().min(10).max(220),
    rationale: z.string().min(40).max(500),
  }),
  causalTimeline: z.array(z.object({
    date: z.string().min(1).max(80),
    event: z.string().min(10).max(240),
    cause: z.string().min(10).max(240),
    effect: z.string().min(10).max(240),
    actors: z.array(z.string().min(1)).min(1).max(6),
    sourceFragmentIds: z.array(z.string()).default([]),
  })).min(1).max(8),
  actorDossiers: z.array(z.object({
    actor: z.string().min(1).max(120),
    goals: z.array(z.string().min(8).max(180)).min(1).max(4),
    leverage: z.array(z.string().min(8).max(180)).min(1).max(4),
    vulnerabilities: z.array(z.string().min(8).max(180)).min(1).max(4),
  })).min(1).max(8),
  scenarios: z.array(z.object({
    type: z.enum(['best', 'likely', 'worst']),
    summary: z.string().min(30).max(280),
    drivers: z.array(z.string().min(8).max(180)).min(2).max(5),
    probabilityEstimate: z.number().min(0).max(100),
    earlyWarningSignals: z.array(z.string().min(8).max(180)).min(2).max(5),
  })).length(3),
  riskScoring: z.object({
    score: z.number().int().min(0).max(100),
    drivers: z.array(z.string().min(10).max(180)).min(2).max(6),
    explanation: z.string().min(40).max(500),
  }),
  actions: z.array(z.object({
    action: z.string().min(20).max(220),
    expectedOutcome: z.string().min(20).max(220),
    urgency: z.enum(['now', 'next', 'watch']),
  })).min(3).max(5),
  memory: z.object({
    reusableSummary: z.string().min(30).max(360),
    reopenLabel: z.string().min(5).max(120),
  }),
  liveGraph: z.object({
    nodes: z.array(IntelligenceNodeSchema).min(3).max(30),
    edges: z.array(IntelligenceEdgeSchema).min(2).max(40),
  }),
  provenance: z.object({
    sourceFragments: z.array(SourceFragmentSchema).min(1).max(12),
    derivationNote: z.string().min(20).max(500),
  }),
  confidence: z.object({
    level: z.enum(['high', 'medium', 'low']),
    note: z.string().min(20).max(360),
    inputWeaknesses: z.array(z.string().min(5).max(180)).max(5),
  }),
});

export type SituationIntelligence = z.infer<typeof SituationIntelligenceSchema>;
export type SourceFragment = z.infer<typeof SourceFragmentSchema>;

export function splitSourceFragments(input: string): SourceFragment[] {
  const paragraphs = input
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const fragments = paragraphs.length > 0 ? paragraphs : [input.trim()].filter(Boolean);

  return fragments.slice(0, 12).map((excerpt, index) => ({
    id: `p${index + 1}`,
    label: `Input paragraph ${index + 1}`,
    excerpt: excerpt.slice(0, 800),
  }));
}

export function validateSituationIntelligence(value: unknown): SituationIntelligence {
  return SituationIntelligenceSchema.parse(value);
}
