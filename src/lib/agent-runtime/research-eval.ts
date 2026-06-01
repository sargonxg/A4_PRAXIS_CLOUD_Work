export type AgenticResearchEvalScenarioId =
  | 'current-events'
  | 'conflict-policy-research'
  | 'claim-source-discovery'
  | 'contradiction-uncertainty'
  | 'capsule-grounded-research'
  | 'memo-pdf-output'
  | 'sourceability-ledger'
  | 'multi-agent-review'
  | 'handover-package'
  | 'degraded-grounding';

export type ResearchEvalCandidate = {
  label: string;
  planning: boolean;
  sourceAuthority: boolean;
  recency: boolean;
  citationFidelity: boolean;
  uncertaintyHandling: boolean;
  capsuleReuse: boolean;
  persistence: boolean;
  auditTrail: boolean;
  latencyMs: number | null;
  failureMode: string | null;
};

export type ResearchEvalScenario = {
  id: AgenticResearchEvalScenarioId;
  title: string;
  prompt: string;
  mustMeasure: string[];
};

export type ResearchEvalScore = {
  scenarioId: AgenticResearchEvalScenarioId;
  label: string;
  total: number;
  criteria: Record<string, number>;
  latencyMs: number | null;
  failureMode: string | null;
};

export type ResearchEvalComparison = {
  scenarioId: AgenticResearchEvalScenarioId;
  praxis: ResearchEvalScore;
  baseline: ResearchEvalScore;
  delta: number;
  praxisWins: boolean;
  requiredProofWins: {
    capsuleReuse: boolean;
    persistence: boolean;
    auditTrail: boolean;
    citationFidelity: boolean;
    uncertaintyHandling: boolean;
  };
};

export type AgenticResearchEvalScorecard = {
  scenarioCount: number;
  praxisWins: number;
  proofWinRate: number;
  averagePraxisScore: number;
  averageBaselineScore: number;
  averageDelta: number;
  capsuleVsGenericDelta: number;
};

const WEIGHTS = {
  planning: 10,
  sourceAuthority: 15,
  recency: 10,
  citationFidelity: 15,
  uncertaintyHandling: 10,
  capsuleReuse: 10,
  persistence: 10,
  auditTrail: 10,
  failureMode: 10,
} as const;

export const AGENTIC_RESEARCH_EVAL_SCENARIOS: ResearchEvalScenario[] = [
  {
    id: 'current-events',
    title: 'Current events and recency',
    prompt: 'Prepare a current-source briefing on a fast-moving policy issue and separate confirmed facts from open questions.',
    mustMeasure: ['recency', 'source authority', 'citation fidelity', 'failure mode'],
  },
  {
    id: 'conflict-policy-research',
    title: 'Conflict and policy research',
    prompt: 'Use the active ContextCapsule to produce a conflict-policy memo with actors, options, source gaps, and decision caveats.',
    mustMeasure: ['planning', 'capsule reuse', 'source authority', 'persistence'],
  },
  {
    id: 'claim-source-discovery',
    title: 'Source discovery for a claim',
    prompt: 'Find authoritative sources for a specific claim, rank their reliability, and flag unsupported parts.',
    mustMeasure: ['source authority', 'citation fidelity', 'audit trail'],
  },
  {
    id: 'contradiction-uncertainty',
    title: 'Contradiction and uncertainty check',
    prompt: 'Identify evidence that contradicts the draft conclusion and state what would change the assessment.',
    mustMeasure: ['uncertainty handling', 'citation fidelity', 'planning'],
  },
  {
    id: 'capsule-grounded-research',
    title: 'Capsule-grounded research',
    prompt: 'Answer from the active ContextCapsule first, then use external grounding only for gaps and save the output receipt.',
    mustMeasure: ['capsule reuse', 'persistence', 'audit trail', 'source authority'],
  },
  {
    id: 'memo-pdf-output',
    title: 'Memo and PDF-ready output',
    prompt: 'Produce a memo/PDF-ready policy brief with capsule id/version, AgentRun id, source receipt ids, claim ledger summary, and unsupported claims.',
    mustMeasure: ['persistence', 'audit trail', 'citation fidelity', 'capsule reuse'],
  },
  {
    id: 'sourceability-ledger',
    title: 'Sourceability claim ledger',
    prompt: 'Review a generated brief and label material claims as supported, weak, contradicted, model-prior, assumption, or unsupported.',
    mustMeasure: ['citation fidelity', 'uncertainty handling', 'audit trail', 'source authority'],
  },
  {
    id: 'multi-agent-review',
    title: 'Multi-agent review',
    prompt: 'Run bounded sourceability and red-team review over the same capsule receipt and surface disagreements before final synthesis.',
    mustMeasure: ['planning', 'capsule reuse', 'audit trail', 'uncertainty handling'],
  },
  {
    id: 'handover-package',
    title: 'Handover package',
    prompt: 'Package the capsule state, generated output, run receipts, unresolved gaps, and next actions for another analyst.',
    mustMeasure: ['persistence', 'audit trail', 'capsule reuse', 'failure mode'],
  },
  {
    id: 'degraded-grounding',
    title: 'Degraded grounding posture',
    prompt: 'Prepare a current-source answer when Google Search grounding is unavailable and show the degraded grounding receipt without implying live web proof.',
    mustMeasure: ['failure mode', 'uncertainty handling', 'audit trail', 'source authority'],
  },
];

export function scoreResearchEvalCandidate(input: ResearchEvalCandidate & { scenarioId: AgenticResearchEvalScenarioId }): ResearchEvalScore {
  const criteria = {
    planning: input.planning ? WEIGHTS.planning : 0,
    sourceAuthority: input.sourceAuthority ? WEIGHTS.sourceAuthority : 0,
    recency: input.recency ? WEIGHTS.recency : 0,
    citationFidelity: input.citationFidelity ? WEIGHTS.citationFidelity : 0,
    uncertaintyHandling: input.uncertaintyHandling ? WEIGHTS.uncertaintyHandling : 0,
    capsuleReuse: input.capsuleReuse ? WEIGHTS.capsuleReuse : 0,
    persistence: input.persistence ? WEIGHTS.persistence : 0,
    auditTrail: input.auditTrail ? WEIGHTS.auditTrail : 0,
    failureMode: input.failureMode ? 0 : WEIGHTS.failureMode,
  };
  const total = Object.values(criteria).reduce((sum, value) => sum + value, 0);
  return {
    scenarioId: input.scenarioId,
    label: input.label,
    total,
    criteria,
    latencyMs: input.latencyMs,
    failureMode: input.failureMode,
  };
}

export function comparePraxisToBaseline(input: {
  scenarioId: AgenticResearchEvalScenarioId;
  praxis: ResearchEvalCandidate;
  baseline: ResearchEvalCandidate;
}): ResearchEvalComparison {
  const praxis = scoreResearchEvalCandidate({ scenarioId: input.scenarioId, ...input.praxis });
  const baseline = scoreResearchEvalCandidate({ scenarioId: input.scenarioId, ...input.baseline });
  const requiredProofWins = {
    capsuleReuse: praxis.criteria.capsuleReuse > baseline.criteria.capsuleReuse,
    persistence: praxis.criteria.persistence > baseline.criteria.persistence,
    auditTrail: praxis.criteria.auditTrail > baseline.criteria.auditTrail,
    citationFidelity: praxis.criteria.citationFidelity >= baseline.criteria.citationFidelity,
    uncertaintyHandling: praxis.criteria.uncertaintyHandling >= baseline.criteria.uncertaintyHandling,
  };
  return {
    scenarioId: input.scenarioId,
    praxis,
    baseline,
    delta: praxis.total - baseline.total,
    praxisWins: praxis.total > baseline.total && Object.values(requiredProofWins).every(Boolean),
    requiredProofWins,
  };
}

export function buildDefaultAgenticResearchEvalRun(): ResearchEvalComparison[] {
  return AGENTIC_RESEARCH_EVAL_SCENARIOS.map((scenario) => comparePraxisToBaseline({
    scenarioId: scenario.id,
    praxis: {
      label: 'PRAXIS AgentRun',
      planning: true,
      sourceAuthority: scenario.id !== 'degraded-grounding',
      recency: scenario.id === 'current-events',
      citationFidelity: true,
      uncertaintyHandling: true,
      capsuleReuse: true,
      persistence: true,
      auditTrail: true,
      latencyMs: null,
      failureMode: scenario.id === 'degraded-grounding' ? 'explicit degraded Google Search grounding receipt' : null,
    },
    baseline: {
      label: 'Generic prompt-only LLM',
      planning: true,
      sourceAuthority: false,
      recency: false,
      citationFidelity: false,
      uncertaintyHandling: scenario.id === 'contradiction-uncertainty',
      capsuleReuse: false,
      persistence: false,
      auditTrail: false,
      latencyMs: null,
      failureMode: null,
    },
  }));
}

export function summarizeAgenticResearchEval(comparisons: ResearchEvalComparison[]): AgenticResearchEvalScorecard {
  if (!comparisons.length) {
    return {
      scenarioCount: 0,
      praxisWins: 0,
      proofWinRate: 0,
      averagePraxisScore: 0,
      averageBaselineScore: 0,
      averageDelta: 0,
      capsuleVsGenericDelta: 0,
    };
  }
  const scenarioCount = comparisons.length;
  const praxisWins = comparisons.filter((comparison) => comparison.praxisWins).length;
  const averagePraxisScore = average(comparisons.map((comparison) => comparison.praxis.total));
  const averageBaselineScore = average(comparisons.map((comparison) => comparison.baseline.total));
  const averageDelta = average(comparisons.map((comparison) => comparison.delta));
  return {
    scenarioCount,
    praxisWins,
    proofWinRate: Math.round((praxisWins / scenarioCount) * 1000) / 1000,
    averagePraxisScore,
    averageBaselineScore,
    averageDelta,
    capsuleVsGenericDelta: averageDelta,
  };
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000) / 1000;
}
