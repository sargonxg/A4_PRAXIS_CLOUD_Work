import type { CapsuleStarterDefinition, CapsuleStarterSource } from '@/lib/product/context-capsules';

/** PRAXIS adaptations of published methods, not institutional endorsements or empirical findings. */
interface AnalyticalMethod {
  school: string;
  inputs: string[];
  steps: string[];
  checks: string[];
  graph: string;
  source: CapsuleStarterSource;
}

const METHODS: Record<string, AnalyticalMethod> = {
  'starter-tool-institutional-logic-lens': {
    school: 'Institutional Analysis and Development (Ostrom / Bloomington school)',
    inputs: ['Actor register: actor_id, role, jurisdiction, source_id, passage and valid_at.', 'Rules register: rule_id, formal rule, observed practice, source_id; unknown practices stay unknown.', 'Action situation: participants, choices, information, incentives, outcomes and evaluation criteria.'],
    steps: ['Bound the action situation and decision being explained.', 'Map participants, positions, choices and information using attributed evidence.', 'Separate formal rules from evidenced rules-in-use and identify constraints.', 'Compare incentive mechanisms and rival explanations of observed outcomes.', 'Evaluate feasible rule changes against explicit criteria and affected participants.'],
    checks: ['Does observed practice contradict the formal rule?', 'Are incentives evidenced or inferred? Preserve rival explanations.', 'Do proposed changes shift costs or power to unrepresented participants?'],
    graph: 'Actor -> participates_in -> ActionSituation; Rule -> constrains -> Choice; Choice -> hypothesized_effect -> Outcome. Each edge needs source_id, passage, valid_at, assertion_status and review_state. These are local schema templates, not established causal edges.',
    source: { id: 'method-ostrom-iad', label: 'IAD Framework — Ostrom Workshop', url: 'https://ostromworkshop.indiana.edu/courses-teaching/teaching-tools/iad-framework/index.html', publisher: 'Indiana University, Ostrom Workshop', sourceType: 'public-library', relevance: 'Method reference for action situations, participants, rules and outcomes; not evidence about the user’s case.' },
  },
  'starter-tool-fiscal-distributional-impact-screen': {
    school: 'Conditional fiscal-multiplier and distributional scenario analysis',
    inputs: ['Fiscal shock: instrument, amount, currency, price_base, period, baseline, source_id and publication_date.', 'Multiplier: estimate or range, horizon, jurisdiction, model assumptions and source_id; never supply a default coefficient.', 'Distribution: population groups, incidence assumptions, coverage, weights and source_id; missing microdata blocks quantified incidence.'],
    steps: ['Define the counterfactual baseline, instrument and analysis horizon.', 'Align shock and outcome units, price basis and timing before calculation.', 'Select a sourced multiplier range appropriate to the stated conditions.', 'Report conditional output effects separately from budget cost and distributional incidence.', 'Vary assumptions and label missing evidence; do not convert scenarios into forecasts.'],
    checks: ['Are financing, monetary response, openness and economic conditions comparable to the estimate?', 'Are cumulative and first-year effects being mixed?', 'Does an aggregate benefit conceal losses to specific groups?'],
    graph: 'FiscalInstrument -> changes -> FiscalFlow; FiscalFlow -> conditional_effect -> Output; HouseholdGroup -> bears -> Incidence. Store currency, price_base, period, source_id and assumption_id on quantitative records. Multipliers and incidence links are reviewed assumptions, not universal constants.',
    source: { id: 'method-imf-fiscal-multipliers', label: 'Fiscal Multipliers: Size, Determinants, and Use in Macroeconomic Projections', url: 'https://www.imf.org/en/publications/tnm/issues/2016/12/31/fiscal-multipliers-size-determinants-and-use-in-macroeconomic-projections-41784', publisher: 'IMF Technical Notes and Manuals', date: '2014-10-02', sourceType: 'multilateral', relevance: 'Method reference for conditional multiplier selection; not a current country estimate or institutional endorsement of an analysis.' },
  },
  'starter-tool-temporal-causal-map': {
    school: 'Evidence chronology with counterfactual impact-evaluation checks',
    inputs: ['Event register: event_id, actor_id, event_start, event_end, date_precision, source_id and publication_date.', 'Causal question: intervention, population, outcome, comparison and time horizon.', 'Evidence table: observation, measurement unit, period, source_id, missingness and design limitations.'],
    steps: ['Separate event dates from publication dates; retain uncertain intervals.', 'Order only events with evidenced temporal relations; preserve conflicting accounts.', 'Name the intervention, outcome and counterfactual comparison.', 'List confounding, selection and competing mechanisms before considering a causal edge.', 'If no credible identification design exists, report chronology and hypotheses, not an effect estimate.'],
    checks: ['Could a common cause explain both the intervention and outcome?', 'Are comparison groups or periods genuinely comparable?', 'Does the evidence establish timing only, rather than causality?'],
    graph: 'Actor -> participates_in -> Event; Event -> precedes -> Event; Intervention -> hypothesized_effect -> Outcome; Confounder -> influences -> Intervention and Outcome. Keep source_id, date_precision, evidence_status and review_state per edge. Temporal order never automatically creates causality.',
    source: { id: 'method-wb-impact-evaluation', label: 'Impact Evaluation in Practice, Second Edition', url: 'https://www.worldbank.org/en/programs/sief-trust-fund/publication/impact-evaluation-in-practice', publisher: 'World Bank', sourceType: 'multilateral', relevance: 'Method reference for counterfactual reasoning and evaluation design, not empirical evidence about this case.' },
  },
};

export function applyAnalyticalMethod(starter: CapsuleStarterDefinition): CapsuleStarterDefinition {
  const method = METHODS[starter.starterId];
  if (!method || !starter.deviceProfile) return starter;
  const gate = 'Human review must verify sources, inputs, assumptions and method fit before use. Missing required data blocks quantitative or causal conclusions. A method is not evidence.';
  return {
    ...starter,
    aiUseGuidance: `${method.school}. ${gate}`,
    deviceProfile: {
      ...starter.deviceProfile,
      reasoningOperation: method.school,
      inputContract: method.inputs,
      methodSteps: method.steps,
      disconfirmingChecks: method.checks,
      sourceabilityRequirements: ['Bind every case assertion and parameter to a source_id and passage; method references do not support case facts.', `Method reference: ${method.source.label}. ${method.source.url}`],
      humanReviewGate: gate,
      agentInstructions: `${method.school}. ${method.steps.join(' ')} ${gate}`,
    },
    inspectionSections: [
      { label: 'Analytical framework', detail: `${method.school}. PRAXIS adaptation; no affiliation or endorsement. Method specification, not a validated assessment.` },
      { label: 'Method reference', detail: `${method.source.publisher}: ${method.source.label}. ${method.source.url} ${method.source.relevance}` },
      { label: 'Required data', detail: method.inputs.join('\n') },
      { label: 'Method graph and ontology', detail: method.graph },
      { label: 'Procedure', detail: method.steps.join('\n') },
      { label: 'Challenge and stop conditions', detail: `${method.checks.join('\n')}\n${gate}` },
      ...starter.inspectionSections,
    ],
    humanReview: starter.humanReview ? {
      ...starter.humanReview,
      status: 'draft',
      label: 'Method draft — review required',
      tooltip: gate,
      reviewedBy: 'Not yet reviewed',
      reviewedAt: '',
      notes: 'Published method references were consulted. This adaptation has not been human-validated for a specific case.',
      humanReviewGate: gate,
    } : undefined,
  };
}
