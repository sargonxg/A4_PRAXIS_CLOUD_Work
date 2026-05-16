import type { MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';

export type MarketplaceHeroToolId =
  | 'dashboard'
  | 'situation-intelligence'
  | 'conflict-graph'
  | 'briefing'
  | 'scenarios'
  | 'negotiation-prep'
  | 'source-scout'
  | 'brainstorming-table'
  | 'treaty-analyzer'
  | 'policy-memo';

export type MarketplaceStageChapter = 'desk' | 'research' | 'draft' | 'tools';

export interface MarketplaceStageTarget {
  heroToolId: MarketplaceHeroToolId;
  promptTemplate: string;
  flags?: Record<string, unknown>;
  rationale: string;
  heroToolName: string;
  chapter: MarketplaceStageChapter;
}

const HERO_TARGETS: Record<MarketplaceHeroToolId, Pick<MarketplaceStageTarget, 'heroToolId' | 'heroToolName' | 'chapter'>> = {
  dashboard: {
    heroToolId: 'dashboard',
    heroToolName: 'Dashboard',
    chapter: 'desk',
  },
  'situation-intelligence': {
    heroToolId: 'situation-intelligence',
    heroToolName: 'Executive Intelligence',
    chapter: 'desk',
  },
  'conflict-graph': {
    heroToolId: 'conflict-graph',
    heroToolName: 'Conflict Graph',
    chapter: 'desk',
  },
  briefing: {
    heroToolId: 'briefing',
    heroToolName: 'Briefing Room',
    chapter: 'draft',
  },
  scenarios: {
    heroToolId: 'scenarios',
    heroToolName: 'Scenario Planner',
    chapter: 'tools',
  },
  'negotiation-prep': {
    heroToolId: 'negotiation-prep',
    heroToolName: 'Negotiation Prep',
    chapter: 'tools',
  },
  'source-scout': {
    heroToolId: 'source-scout',
    heroToolName: 'Source Scout',
    chapter: 'research',
  },
  'brainstorming-table': {
    heroToolId: 'brainstorming-table',
    heroToolName: 'Brainstorming Table',
    chapter: 'tools',
  },
  'treaty-analyzer': {
    heroToolId: 'treaty-analyzer',
    heroToolName: 'Treaty Analyzer',
    chapter: 'draft',
  },
  'policy-memo': {
    heroToolId: 'policy-memo',
    heroToolName: 'Policy Memo',
    chapter: 'draft',
  },
};

function stage(
  heroToolId: MarketplaceHeroToolId,
  promptTemplate: string,
  rationale: string,
  flags?: Record<string, unknown>,
): MarketplaceStageTarget {
  return {
    ...HERO_TARGETS[heroToolId],
    promptTemplate,
    rationale,
    ...(flags ? { flags } : {}),
  };
}

export const MARKETPLACE_STAGE_TARGETS: Record<string, MarketplaceStageTarget> = {
  'conflict.leverage-trace': stage(
    'negotiation-prep',
    'Trace the leverage structure in {{caseName}}. For each actor, identify pressure points, constraints, interests, likely concessions, and the evidence that supports each leverage claim.',
    'Leverage and concession analysis routed through Negotiation Prep.',
  ),
  'conflict.commitment-check': stage(
    'negotiation-prep',
    'Assess whether the proposed or implied commitments in {{caseName}} are monitorable. List each commitment, verification mechanism, enforcement condition, ambiguity, and actor with incentive to defect.',
    'Commitment monitorability routed through Negotiation Prep.',
  ),
  'conflict.escalation-timeline': stage(
    'situation-intelligence',
    'Build an escalation and de-escalation timeline for {{caseName}}. Identify dated trigger events, observed actor behavior, escalation direction, confidence, and source gaps.',
    'Escalation chronology routed through Executive Intelligence.',
  ),
  'mediation.position-vs-interest': stage(
    'negotiation-prep',
    'Separate stated positions from likely underlying interests in {{caseName}}. For each party, return stated demand, inferred interest, confidence, evidence, and a mediator question to test the inference.',
    'Position-interest mapping routed through Negotiation Prep.',
  ),
  'mediation.zopa-finder': stage(
    'negotiation-prep',
    'Estimate zones of possible agreement in {{caseName}}. Identify red lines, tradeable issues, guarantees, sequencing moves, and evidence gaps that could invalidate the ZOPA.',
    'ZOPA analysis routed through Negotiation Prep.',
  ),
  'mediation.mediation-brief': stage(
    'briefing',
    'Draft a mediator-ready brief for {{caseName}}: parties, issues, interests, leverage, possible package deals, risks, and immediate questions for shuttle diplomacy.',
    'Mediation synthesis routed through Briefing Room.',
  ),
  'governance.veto-probability': stage(
    'situation-intelligence',
    'Assess veto and blocking probability in {{caseName}}. Identify each veto player, trigger issue, motivation, bargaining chip, likelihood, and move that could reduce blockage.',
    'Veto-player analysis routed through Executive Intelligence.',
  ),
  'governance.mandate-traceback': stage(
    'policy-memo',
    'Trace the authority basis for possible action in {{caseName}}. List legal, procedural, political, and institutional mandates, then explain where authority is clear, contested, or missing.',
    'Mandate analysis routed through Policy Memo.',
  ),
  'governance.coalition-map': stage(
    'brainstorming-table',
    'Map coalition positions in {{caseName}}. For each actor, identify supportive, blocking, swing, or broker status; evidence; likely ask; and engagement priority.',
    'Coalition mapping routed through Brainstorming Table.',
  ),
  'narrative.frame-cascade': stage(
    'source-scout',
    'Investigate frame movement in {{caseName}}. Identify the claim, messenger, audience, channel, timeline, amplification pattern, and source receipts needed to verify each cascade.',
    'Narrative frame tracing routed through Source Scout.',
  ),
  'narrative.counter-narrative-finder': stage(
    'source-scout',
    'Find evidence-grounded counter-frames for {{caseName}}. For each, identify the current frame it challenges, source base, credibility risk, and audience fit.',
    'Counter-narrative sourcing routed through Source Scout.',
  ),
  'narrative.fact-check-traceback': stage(
    'source-scout',
    'Trace the contested claims in {{caseName}} back to source receipts. For each claim, identify original source, corroboration, contradiction, uncertainty, and collection gap.',
    'Claim traceback routed through Source Scout.',
  ),
  'cross.contradiction-finder': stage(
    'situation-intelligence',
    'Find contradictions inside {{caseName}} across actors, events, sources, and prior outputs. Group contradictions by consequence and recommend what evidence would resolve each one.',
    'Contradiction analysis routed through Executive Intelligence.',
  ),
  'cross.context-health-explainer': stage(
    'dashboard',
    'Explain the context health of {{caseName}}. Identify weak layers, missing sources, graph gaps, stale evidence, and the next three collection moves that would most improve analysis quality.',
    'Context-health explanation routed through Dashboard.',
  ),
  'extract.entities.gliner': stage(
    'source-scout',
    'Prepare an entity-extraction pass for {{caseName}}. Identify likely people, organizations, locations, dates, events, and ontology labels to verify from the active sources.',
    'Entity extraction planning routed through Source Scout.',
  ),
  'cross.community-synthesizer': stage(
    'conflict-graph',
    'Synthesize graph communities in {{caseName}}. Identify clusters, shared claims, bridge actors, isolated nodes, and low-confidence synthesized claims that need review before promotion.',
    'Graph community synthesis routed through Conflict Graph.',
  ),
  'analyze.network': stage(
    'conflict-graph',
    'Analyze the network structure in {{caseName}}. Identify brokers, central actors, cohesive clusters, structural holes, and graph operations that would improve the analyst view.',
    'Network analysis routed through Conflict Graph.',
  ),
  'match.sanctions': stage(
    'source-scout',
    'Check whether actors in {{caseName}} need sanctions or PEP screening. For each candidate, list identifiers, aliases, source receipts to collect, and confidence risks.',
    'Sanctions matching routed through Source Scout.',
  ),
  'simulate.policy_abm': stage(
    'scenarios',
    'Run an assumption-bound policy simulation for {{caseName}}. Define actors, behavioral assumptions, intervention choices, trajectory outputs, and warning signs that would change the scenario.',
    'Policy simulation framing routed through Scenario Planner.',
  ),
  'cross.brief-exporter': stage(
    'briefing',
    'Turn the strongest current findings in {{caseName}} into a decision brief. Include thesis, evidence-backed findings, assumptions, source gaps, options, and footnote-ready citations.',
    'Decision-brief export routed through Briefing Room.',
  ),
  'cross.memo-create': stage(
    'policy-memo',
    'Create a policy memo draft for {{caseName}} using current graph context, cited sources, analytical claims, assumptions, and review gaps. Keep synthesized claims clearly marked.',
    'Memo creation routed through Policy Memo.',
  ),
  'cross.memo-refresh': stage(
    'policy-memo',
    'Refresh an existing memo for {{caseName}} against current context. Identify stale claims, missing citations, new evidence, changed recommendations, and text that should be rewritten.',
    'Memo refresh routed through Policy Memo.',
  ),
  'cross.scenario-projector': stage(
    'scenarios',
    'Project plausible scenarios for {{caseName}}. Return best, likely, and worst paths with drivers, probabilities, warning indicators, and decision points.',
    'Scenario projection routed through Scenario Planner.',
  ),
  'conflict.escalation-ladder': stage(
    'situation-intelligence',
    "Apply Glasl's 9-stage escalation model to {{caseName}}. For each relevant stage, produce trigger conditions, observed indicators, recommended de-escalation moves, and confidence.",
    'Glasl escalation analysis routed through Executive Intelligence.',
  ),
  'conflict.cease-fire-monitor': stage(
    'situation-intelligence',
    'Assess any active or proposed cease-fire in {{caseName}}: parties, scope, monitoring mechanism, observed compliance, breaking-point indicators, and incentives to defect.',
    'Cease-fire structural analysis routed through Executive Intelligence.',
  ),
  'conflict.actor-alignment-shift': stage(
    'brainstorming-table',
    'For each actor in {{caseName}}, list current alignments, recent shifts with evidence, and the interest or constraint most likely to cause the next shift.',
    'Alignment-shift table routed through Brainstorming Table.',
  ),
  'cross.stakeholder-power-interest': stage(
    'brainstorming-table',
    'Map actors in {{caseName}} on a power-interest grid. For each actor return quadrant, evidence for placement, leverage notes, and engagement priority.',
    'Power-interest grid routed through Brainstorming Table.',
  ),
  'cross.causal-loop-diagram': stage(
    'conflict-graph',
    'Identify the dominant causal loops in {{caseName}}. For each loop list variables, polarity, activation trigger, affected actors, and policy lever that could weaken it.',
    'Causal-loop framing routed through Conflict Graph.',
  ),
  'cross.indicators-tracker': stage(
    'situation-intelligence',
    'Define 5 to 7 warning indicators for {{caseName}} over the next 90 days. For each include data source, baseline, threshold, interpretation, and collection owner.',
    'Early-warning indicators routed through Executive Intelligence.',
  ),
  'cross.timeline-comparator': stage(
    'situation-intelligence',
    "Compare the timeline of {{caseName}} against analogous historical cases. For each analogy, explain what matched, what diverged, and what the comparison implies for today's decisions.",
    'Comparative timeline analysis routed through Executive Intelligence.',
  ),
  'cross.assumption-mapper': stage(
    'situation-intelligence',
    'Identify the top implicit assumptions behind the dominant interpretation of {{caseName}}. For each state evidence, fragility, disconfirming signal, and analyst action.',
    'Assumption mapping routed through Executive Intelligence.',
  ),
  'cross.outside-in-thinking': stage(
    'situation-intelligence',
    'Generate outside-in framings of {{caseName}} from external-force perspectives such as demographic, fiscal, environmental, logistical, or information-system dynamics.',
    'Outside-in analysis routed through Executive Intelligence.',
  ),
  'cross.devils-advocate': stage(
    'situation-intelligence',
    'Argue the strongest case against the current dominant interpretation of {{caseName}}. Cite which sources or claims would have to be false and conclude with residual uncertainty.',
    'Red-team challenge routed through Executive Intelligence.',
    { redTeam: true },
  ),
  'human-rights.violation-tracker': stage(
    'source-scout',
    'Track reported violations in {{caseName}}. Classify incident types, alleged perpetrators, affected groups, obligations implicated, source receipts, and systematic-pattern indicators.',
    'Violation tracking routed through Source Scout.',
  ),
  'human-rights.upr-cycle-mapper': stage(
    'policy-memo',
    'Map review-cycle obligations relevant to {{caseName}}. Identify recommendations, implementation status, upcoming windows, responsible actors, and memo-ready implications.',
    'Review-cycle mapping routed through Policy Memo.',
  ),
  'human-rights.treaty-body-engagement': stage(
    'treaty-analyzer',
    'Prepare treaty-body engagement analysis for {{caseName}}. Identify obligations, observations, due reports, communications posture, and evidence needed for responsible drafting.',
    'Treaty-body analysis routed through Treaty Analyzer.',
  ),
  'human-rights.pattern-detector': stage(
    'source-scout',
    'Detect incident patterns in {{caseName}} by actor, type, place, time, and affected group. Distinguish isolated, repeated, systematic, and widespread patterns with evidence gaps.',
    'Human-rights pattern detection routed through Source Scout.',
  ),
  'economic.designation-tracer': stage(
    'treaty-analyzer',
    'Trace designation logic in {{caseName}}. Identify legal basis, listed entities, ownership or control links, evidence standard, companion-list exposure, and due-process risks.',
    'Designation tracing routed through Treaty Analyzer.',
  ),
  'economic.beneficial-ownership-map': stage(
    'conflict-graph',
    'Map beneficial ownership and control links in {{caseName}}. Identify companies, controllers, intermediaries, evidence receipts, confidence, and graph changes that need review.',
    'Ownership network mapping routed through Conflict Graph.',
  ),
  'economic.sanctions-impact-model': stage(
    'scenarios',
    'Model likely sanctions impact in {{caseName}}. Estimate exposure, substitution paths, humanitarian spillovers, confidence bands, monitoring indicators, and unintended consequences.',
    'Sanctions-impact modeling routed through Scenario Planner.',
  ),
  'economic.evasion-pattern-detector': stage(
    'source-scout',
    'Detect evasion patterns in {{caseName}}. Look for shell-company, shipping, banking, crypto, procurement, and logistics signatures, then list sources required to validate each lead.',
    'Evasion-pattern sourcing routed through Source Scout.',
  ),
  'humanitarian.needs-aggregator': stage(
    'briefing',
    'Aggregate humanitarian needs in {{caseName}} by sector, population, geography, severity, information gap, and priority action. Produce briefing-ready findings with source gaps.',
    'Humanitarian needs synthesis routed through Briefing Room.',
  ),
  'humanitarian.access-map': stage(
    'conflict-graph',
    'Map humanitarian access constraints in {{caseName}} by route, location, controlling actor, bottleneck, negotiation requirement, and risk to operations.',
    'Access mapping routed through Conflict Graph.',
  ),
  'humanitarian.cluster-coordinator': stage(
    'briefing',
    'Prepare cluster-coordination notes for {{caseName}}. Identify active sectors, response gaps, duplication risks, deconfliction needs, and memo-ready coordination actions.',
    'Cluster coordination routed through Briefing Room.',
  ),
  'humanitarian.aa-trigger-monitor': stage(
    'situation-intelligence',
    'Monitor anticipatory-action triggers in {{caseName}}. Define thresholds, current status, data sources, likely activation windows, and actions if thresholds fire.',
    'Anticipatory-action triggers routed through Executive Intelligence.',
  ),
  'legal.provision-tracer': stage(
    'treaty-analyzer',
    'Trace the legal provision network relevant to {{caseName}}. Identify treaty text, custom, soft-law, jurisprudence, interpretive disputes, and applicability limits.',
    'Provision tracing routed through Treaty Analyzer.',
  ),
  'legal.precedent-finder': stage(
    'treaty-analyzer',
    'Identify legal precedents relevant to {{caseName}}. Cite the precedent, explain factual similarity, jurisdictional weight, permission scope, and applicability limits.',
    'Precedent finding routed through Treaty Analyzer.',
  ),
  'legal.reservation-effect-mapper': stage(
    'treaty-analyzer',
    'Map the effect of reservations, derogations, and declarations in {{caseName}}. Explain which obligations remain, which are contested, and what evidence is needed.',
    'Reservation-effect mapping routed through Treaty Analyzer.',
  ),
  'legal.jurisdictional-analyzer': stage(
    'treaty-analyzer',
    'Analyze jurisdictional paths in {{caseName}}. Identify bases, admissibility risks, likely objections, counterarguments, and evidence required for each forum.',
    'Jurisdictional analysis routed through Treaty Analyzer.',
  ),
  'security.posture-tracker': stage(
    'situation-intelligence',
    'Track security posture in {{caseName}}. Separate observed posture, asserted capability, actor intent, escalation signal, and confidence for each relevant actor.',
    'Security posture tracking routed through Executive Intelligence.',
  ),
  'security.capability-assessor': stage(
    'situation-intelligence',
    'Assess demonstrated versus asserted capabilities in {{caseName}}. For each actor, list capability, evidence, confidence, limiting constraints, and plausible next use.',
    'Capability assessment routed through Executive Intelligence.',
  ),
  'security.escalation-modeler': stage(
    'scenarios',
    'Model security escalation paths in {{caseName}} using posture, doctrine, capability, rules of engagement, likely triggers, off-ramps, and warning indicators.',
    'Security escalation modeling routed through Scenario Planner.',
  ),
  'security.alliance-cohesion-map': stage(
    'brainstorming-table',
    'Map alliance cohesion in {{caseName}}. For each ally or partner, list public position, contribution, constraint, cohesion risk, likely ask, and diplomatic engagement priority.',
    'Alliance-cohesion mapping routed through Brainstorming Table.',
  ),
};

export function getStageTarget(recipeId: string): MarketplaceStageTarget | null {
  return MARKETPLACE_STAGE_TARGETS[recipeId] ?? null;
}

export function listStagedRecipeIds(): string[] {
  return Object.keys(MARKETPLACE_STAGE_TARGETS);
}

export function getMarketplaceStageTarget(
  tool: Pick<MarketplaceToolDefinition, 'id' | 'satCategory'>,
): MarketplaceStageTarget | null {
  if (tool.satCategory) return null;
  return getStageTarget(tool.id);
}

export function renderMarketplaceStagePrompt(target: MarketplaceStageTarget, caseName: string): string {
  return target.promptTemplate.replaceAll('{{caseName}}', caseName);
}

export function stageTargetHref(caseId: string, target: MarketplaceStageTarget): string {
  if (target.chapter === 'tools') {
    const params = new URLSearchParams({
      stagedTool: target.heroToolId,
      caseId,
    });
    return `/app/tools?${params.toString()}`;
  }

  const params = new URLSearchParams({
    stagedTool: target.heroToolId,
    openChapter: target.chapter,
  });
  return `/app/contexts?situationId=${encodeURIComponent(caseId)}&${params.toString()}`;
}
