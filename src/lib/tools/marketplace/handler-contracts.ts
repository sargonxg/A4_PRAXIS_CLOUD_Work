export type MarketplaceHandlerStage = 'prompt-contract' | 'model-backed';

export interface MarketplaceHandlerContract {
  toolId: string;
  executionStage: MarketplaceHandlerStage;
  objective: string;
  requiredContext: string[];
  analysisMoves: string[];
  outputSections: string[];
  modelInstructions: string[];
  qualityChecks: string[];
  nextActions: string[];
}

function contract(input: MarketplaceHandlerContract): MarketplaceHandlerContract {
  return input;
}

export const MARKETPLACE_HANDLER_CONTRACTS: Record<string, MarketplaceHandlerContract> = {
  'conflict.leverage-trace': contract({
    toolId: 'conflict.leverage-trace',
    executionStage: 'prompt-contract',
    objective: 'Trace credible leverage pathways from actors through constraints, dependencies, and possible concessions.',
    requiredContext: ['actor graph', 'interests and constraints', 'recent events', 'source receipts'],
    analysisMoves: [
      'Identify the actor whose behavior is being influenced and the actor applying pressure.',
      'Map each pressure point to the constraint, dependency, or incentive that makes it plausible.',
      'Separate demonstrated leverage from speculative leverage and label confidence.',
      'List concessions, counter-pressure, and likely failure modes for each pathway.',
    ],
    outputSections: ['Leverage map', 'Evidence table', 'Confidence notes', 'Risks and counter-pressure', 'Recommended follow-up'],
    modelInstructions: [
      'Keep generated text advisory and preserve uncertainty.',
      'Do not invent actors, receipts, or concessions that are absent from context.',
      'Return both prose and structured claim objects when a model-backed handler is added.',
    ],
    qualityChecks: [
      'Every leverage claim names an actor, target, pressure point, and evidence status.',
      'Weak or missing receipts are called out instead of hidden.',
      'At least one counter-pressure or failure condition is included.',
    ],
    nextActions: ['Request missing receipts for weak pathways.', 'Chain into Commitment Check or Scenario Projector when appropriate.'],
  }),
  'conflict.commitment-check': contract({
    toolId: 'conflict.commitment-check',
    executionStage: 'prompt-contract',
    objective: 'Assess whether proposed commitments are specific, monitorable, enforceable, and tied to credible incentives.',
    requiredContext: ['draft commitments', 'party obligations', 'monitoring mechanisms', 'enforcement context'],
    analysisMoves: [
      'Extract each promised action, responsible party, timeline, and verification condition.',
      'Check whether observers can measure compliance without relying on private intent.',
      'Flag vague verbs, missing thresholds, and asymmetric enforcement.',
      'Suggest tighter commitment wording where the evidence supports it.',
    ],
    outputSections: ['Commitment inventory', 'Monitorability score', 'Enforcement gaps', 'Rewrite suggestions', 'Open verification needs'],
    modelInstructions: [
      'Prefer concrete operational language over legal generalities.',
      'Keep rejected commitments as advisory warnings, not hard blocks.',
      'Preserve raw draft text in artifacts for later review.',
    ],
    qualityChecks: [
      'Each commitment has a named party and observable condition.',
      'Unmonitorable language is quoted or paraphrased precisely.',
      'Suggested rewrites do not add obligations that were not requested.',
    ],
    nextActions: ['Ask for missing monitoring data.', 'Chain into Mediation Brief for packaged review.'],
  }),
  'conflict.escalation-timeline': contract({
    toolId: 'conflict.escalation-timeline',
    executionStage: 'prompt-contract',
    objective: 'Build a time-ordered escalation and de-escalation chronology with source gaps and causal cautions visible.',
    requiredContext: ['dated events', 'actor claims', 'source timestamps', 'incident severity markers'],
    analysisMoves: [
      'Normalize event dates and keep unknown dates explicitly marked.',
      'Order events by observed time, not narrative importance.',
      'Label escalation, de-escalation, and ambiguous events separately.',
      'Avoid causal claims unless the source path supports them.',
    ],
    outputSections: ['Chronology', 'Escalation inflection points', 'De-escalation signals', 'Evidence gaps', 'Causal cautions'],
    modelInstructions: [
      'Use cautious language for causality.',
      'Preserve uncertain or conflicting dates in the structured output.',
      'Surface stale context as an advisory rather than suppressing the run.',
    ],
    qualityChecks: [
      'Every timeline item has a date status and provenance status.',
      'Conflicting dates or sources are retained.',
      'Causal language is backed by explicit evidence.',
    ],
    nextActions: ['Request source fragments for undated events.', 'Chain into Scenario Projector for future paths.'],
  }),
  'mediation.position-vs-interest': contract({
    toolId: 'mediation.position-vs-interest',
    executionStage: 'prompt-contract',
    objective: 'Separate stated positions from likely underlying interests while preserving evidence confidence.',
    requiredContext: ['party statements', 'negotiation issues', 'actor incentives', 'prior concessions'],
    analysisMoves: [
      'Extract stated demands without softening them.',
      'Infer possible interests only when context gives a basis.',
      'Distinguish red lines from negotiable preferences.',
      'Identify missing information that would change the interest map.',
    ],
    outputSections: ['Position inventory', 'Interest hypotheses', 'Confidence by party', 'Red lines and trade space', 'Collection gaps'],
    modelInstructions: [
      'Do not treat inferred interests as facts.',
      'Keep party labels and issue labels stable for downstream ZOPA analysis.',
      'Allow free-form notes to remain in the context dump.',
    ],
    qualityChecks: [
      'Every inferred interest is labeled as inferred and given a basis.',
      'At least one uncertainty or alternative explanation is included.',
      'No party is assigned a motive without evidence.',
    ],
    nextActions: ['Chain into ZOPA Finder after interests are reviewed.', 'Ask for party statements where positions are missing.'],
  }),
  'mediation.zopa-finder': contract({
    toolId: 'mediation.zopa-finder',
    executionStage: 'prompt-contract',
    objective: 'Estimate possible agreement zones from interests, red lines, guarantees, and sequencing options.',
    requiredContext: ['party interests', 'red lines', 'available guarantees', 'sequencing constraints'],
    analysisMoves: [
      'List issue dimensions and each party minimum acceptable position.',
      'Find overlaps, conditional overlaps, and no-overlap zones.',
      'Map guarantees or sequencing moves that could widen the zone.',
      'Flag assumptions that would invalidate the ZOPA.',
    ],
    outputSections: ['Issue matrix', 'Likely ZOPA', 'Conditional trades', 'Guarantees and sequencing', 'Invalidating assumptions'],
    modelInstructions: [
      'Avoid numeric precision that the evidence does not support.',
      'Keep no-agreement findings visible when the context points there.',
      'Return trade suggestions as options, not recommendations.',
    ],
    qualityChecks: [
      'Each possible agreement zone names the parties and issue dimension.',
      'No-overlap areas are preserved.',
      'Guarantees are tied to a specific risk or trust deficit.',
    ],
    nextActions: ['Chain into Mediation Brief for packaging.', 'Collect additional red-line evidence for low-confidence overlaps.'],
  }),
  'mediation.mediation-brief': contract({
    toolId: 'mediation.mediation-brief',
    executionStage: 'prompt-contract',
    objective: 'Produce a mediator-ready brief with parties, issues, options, risks, and receipt gaps.',
    requiredContext: ['party profiles', 'issue map', 'recent timeline', 'options and risks', 'source receipts'],
    analysisMoves: [
      'Summarize the dispute frame and active negotiation context.',
      'Organize parties, issues, options, and risks into a usable brief.',
      'Keep evidence gaps visible beside the affected section.',
      'Separate operational next steps from analytical observations.',
    ],
    outputSections: ['Situation frame', 'Parties and interests', 'Issue table', 'Options and risks', 'Questions for the next session'],
    modelInstructions: [
      'Write for an operator who needs a concise brief.',
      'Do not hide weak receipts in polished prose.',
      'Preserve sections for Memo Studio export.',
    ],
    qualityChecks: [
      'Every option has a stated risk or dependency.',
      'Source gaps remain visible in the brief.',
      'The brief can be exported without losing claim provenance.',
    ],
    nextActions: ['Send accepted sections to Memo Studio.', 'Chain into Brief Exporter for trust metadata packaging.'],
  }),
  'governance.veto-probability': contract({
    toolId: 'governance.veto-probability',
    executionStage: 'prompt-contract',
    objective: 'Estimate likely veto points and explain the mandate, coalition, and procedural drivers.',
    requiredContext: ['decision process', 'veto actors', 'mandate evidence', 'coalition signals'],
    analysisMoves: [
      'Identify formal and informal veto actors.',
      'Tie each veto pathway to mandate, procedure, coalition, or resource constraints.',
      'Score likelihood in coarse bands and explain the evidence basis.',
      'List monitoring indicators that would update the probability.',
    ],
    outputSections: ['Veto map', 'Probability bands', 'Driver explanations', 'Monitoring indicators', 'Evidence gaps'],
    modelInstructions: [
      'Use coarse bands instead of false precision.',
      'Distinguish legal veto from political blocking power.',
      'Keep dissenting evidence visible.',
    ],
    qualityChecks: [
      'Each veto pathway names the actor and mechanism.',
      'Probability bands include evidence and uncertainty.',
      'At least one update indicator is provided.',
    ],
    nextActions: ['Chain into Coalition Map for actor alignment.', 'Request mandate documents for legal veto claims.'],
  }),
  'governance.mandate-traceback': contract({
    toolId: 'governance.mandate-traceback',
    executionStage: 'prompt-contract',
    objective: 'Trace an action or authority claim back to legal, procedural, or political mandate evidence.',
    requiredContext: ['authority claim', 'mandate documents', 'procedural history', 'actor roles'],
    analysisMoves: [
      'Extract the specific authority or mandate claim.',
      'Map supporting documents and procedural steps.',
      'Identify missing approvals, expired mandates, or disputed interpretations.',
      'Separate legal authority from political legitimacy.',
    ],
    outputSections: ['Claim under review', 'Mandate path', 'Procedural status', 'Disputes and gaps', 'Confidence notes'],
    modelInstructions: [
      'Do not provide legal advice.',
      'State evidence limits clearly.',
      'Preserve raw authority text when supplied.',
    ],
    qualityChecks: [
      'The traced claim is specific enough to verify.',
      'Every mandate link has a provenance status.',
      'Legal and political findings are not conflated.',
    ],
    nextActions: ['Collect missing authority documents.', 'Chain into Veto Probability if mandate weakness affects implementation.'],
  }),
  'governance.coalition-map': contract({
    toolId: 'governance.coalition-map',
    executionStage: 'prompt-contract',
    objective: 'Map supportive, blocking, and swing actors around a mandate, policy action, or negotiation outcome.',
    requiredContext: ['actor graph', 'public positions', 'voting or support signals', 'relationship edges'],
    analysisMoves: [
      'Classify actors as support, block, swing, unknown, or conditional.',
      'Tie each classification to source signals and relationship evidence.',
      'Identify coalition bridges, blockers, and leverage channels.',
      'Flag stale or ambiguous actor positions.',
    ],
    outputSections: ['Coalition table', 'Bridge actors', 'Blockers and swing actors', 'Evidence status', 'Update indicators'],
    modelInstructions: [
      'Keep unknown positions as unknown.',
      'Avoid implying formal coalition membership from weak affinity evidence.',
      'Return graph-change suggestions only as proposals.',
    ],
    qualityChecks: [
      'Every actor classification includes evidence status.',
      'Conditional support is not collapsed into support.',
      'At least one stale-position warning appears when dates are old or absent.',
    ],
    nextActions: ['Review proposed graph changes before accepting them.', 'Chain into Veto Probability for blocking paths.'],
  }),
  'narrative.frame-cascade': contract({
    toolId: 'narrative.frame-cascade',
    executionStage: 'prompt-contract',
    objective: 'Track how a narrative frame moves across claims, messengers, audiences, channels, and events.',
    requiredContext: ['claims', 'messengers', 'audiences', 'publication times', 'source receipts'],
    analysisMoves: [
      'Identify the frame and its recurring language.',
      'Order appearances across messengers, channels, and audiences.',
      'Differentiate adoption, amplification, mutation, and rebuttal.',
      'Flag missing timestamps or unsupported propagation links.',
    ],
    outputSections: ['Frame definition', 'Cascade timeline', 'Messenger and audience map', 'Mutations and rebuttals', 'Evidence gaps'],
    modelInstructions: [
      'Do not infer coordination from sequence alone.',
      'Use precise frame language supplied by sources.',
      'Keep disputed frame interpretations visible.',
    ],
    qualityChecks: [
      'Each cascade step has a timestamp status.',
      'Propagation claims are separated from mere similarity.',
      'At least one alternative interpretation is considered when evidence is thin.',
    ],
    nextActions: ['Chain into Counter-Narrative Finder for response options.', 'Request timestamps for undated claims.'],
  }),
  'narrative.counter-narrative-finder': contract({
    toolId: 'narrative.counter-narrative-finder',
    executionStage: 'prompt-contract',
    objective: 'Find credible counter-frames and identify the evidence needed before they are used.',
    requiredContext: ['target frame', 'audiences', 'trusted messengers', 'evidence constraints', 'risk context'],
    analysisMoves: [
      'Summarize the frame being answered and the audience affected.',
      'Generate counter-frame options grounded in available evidence.',
      'Assess credibility, backlash, and evidence requirements for each option.',
      'Reject options that require unsupported claims.',
    ],
    outputSections: ['Target frame', 'Counter-frame options', 'Credibility and risk table', 'Evidence needed before use', 'Recommended tests'],
    modelInstructions: [
      'Do not produce manipulative or deceptive messaging.',
      'Keep counter-frames evidence-grounded and audience-specific.',
      'Flag when no responsible counter-frame can be supported.',
    ],
    qualityChecks: [
      'Every counter-frame lists required evidence.',
      'Backlash or credibility risks are visible.',
      'Unsupported response options are marked as not ready.',
    ],
    nextActions: ['Collect missing evidence for promising options.', 'Chain into Fact-Check Traceback before external use.'],
  }),
  'narrative.fact-check-traceback': contract({
    toolId: 'narrative.fact-check-traceback',
    executionStage: 'prompt-contract',
    objective: 'Trace a claim to source receipts, conflicts, uncertainty, and unresolved verification gaps.',
    requiredContext: ['claim text', 'source receipts', 'conflicting claims', 'publication metadata'],
    analysisMoves: [
      'Restate the exact claim under review.',
      'Map supporting, contradicting, and irrelevant receipts.',
      'Assess source proximity, freshness, and independence.',
      'Return a cautious finding with open gaps.',
    ],
    outputSections: ['Claim under review', 'Receipt traceback', 'Supporting and conflicting evidence', 'Finding', 'Open gaps'],
    modelInstructions: [
      'Do not turn absence of evidence into disproof.',
      'Keep raw claim text and source ids in the output.',
      'Avoid categorical verdicts when receipts are weak.',
    ],
    qualityChecks: [
      'The exact claim is preserved.',
      'Supporting and conflicting receipts are separated.',
      'The finding includes uncertainty and provenance.',
    ],
    nextActions: ['Request original source fragments.', 'Chain into Contradiction Finder for broader corpus conflicts.'],
  }),
  'cross.contradiction-finder': contract({
    toolId: 'cross.contradiction-finder',
    executionStage: 'prompt-contract',
    objective: 'Find contradictory claims across context, graph, sources, and generated artifacts without suppressing ambiguity.',
    requiredContext: ['claims', 'source receipts', 'graph facts', 'generated artifacts'],
    analysisMoves: [
      'Normalize comparable claims before judging contradiction.',
      'Separate direct contradictions from tension, stale data, or different scope.',
      'Group contradictions by entity, time, place, and issue.',
      'Suggest reconciliation questions or data to collect.',
    ],
    outputSections: ['Contradiction groups', 'Direct conflicts', 'Scope or timing tensions', 'Reconciliation questions', 'Suggested fixes'],
    modelInstructions: [
      'Do not delete or overwrite conflicting claims.',
      'Keep both sides of a contradiction visible.',
      'Prefer reconciliation questions over forced resolution.',
    ],
    qualityChecks: [
      'Each contradiction names both claims and why they conflict.',
      'Scope and timing mismatches are not mislabeled as direct conflicts.',
      'Suggested fixes preserve provenance.',
    ],
    nextActions: ['Open source fragments for contested claims.', 'Create graph dispute proposals where supported.'],
  }),
  'cross.ach': contract({
    toolId: 'cross.ach',
    executionStage: 'prompt-contract',
    objective: 'Open and maintain an Analysis of Competing Hypotheses matrix using Heuer disconfirmation logic.',
    requiredContext: ['competing claims', 'evidence items', 'source receipts', 'case graph'],
    analysisMoves: [
      'Define three to seven mutually distinguishable hypotheses.',
      'Pull evidence from graph claims, events, documents, and analyst free text.',
      'Score every evidence-hypothesis cell as consistent, inconsistent, irrelevant, or unknown.',
      'Rank hypotheses by inconsistency count and weighted diagnosticity, not support count.',
    ],
    outputSections: ['Hypotheses', 'Evidence table', 'ACH matrix', 'Ranking by inconsistency', 'Review queue candidates'],
    modelInstructions: [
      'Treat ranked hypotheses as synthesized and advisory.',
      'Do not promote claims to Verdict layer without explicit user review.',
      'Prominently attribute ACH to Heuer and the Heuer-Pherson SAT canon.',
    ],
    qualityChecks: [
      'Ranking uses least disconfirming evidence.',
      'Every promoted claim routes through the review queue.',
      'Evidence weights and diagnosticity remain visible.',
    ],
    nextActions: ['Open the ACH workbench surface.', 'Append the matrix to Memo Studio as an annex after review.'],
  }),
  'cross.kac': contract({
    toolId: 'cross.kac',
    executionStage: 'prompt-contract',
    objective: 'Surface stated and unstated assumptions underlying an analysis and let the user verdict each one.',
    requiredContext: ['memo or analysis text', 'case graph', 'supporting claims', 'user confidence tolerance'],
    analysisMoves: [
      'Extract explicit assumptions and infer likely unstated assumptions.',
      'Classify support level using visible graph and source evidence.',
      'Limit output to the highest-value assumptions for analyst review.',
      'Preserve user verdicts for memo annex export.',
    ],
    outputSections: ['Assumption inventory', 'Support classification', 'User verdict table', 'Collection gaps', 'Memo annex block'],
    modelInstructions: [
      'Cite Claim or Event nodes when assigning support levels.',
      'Cap synthesized confidence at 0.6.',
      'Prominently attribute KAC to Heuer-Pherson Structured Analytic Techniques.',
    ],
    qualityChecks: [
      'Stated and unstated assumptions are separated.',
      'Unsupported assumptions remain visible.',
      'No assumption is converted into a graph assertion without user action.',
    ],
    nextActions: ['Flag or reject weak assumptions.', 'Append accepted results to the active memo as a KAC annex.'],
  }),
  'cross.red-team': contract({
    toolId: 'cross.red-team',
    executionStage: 'prompt-contract',
    objective: 'Model a target actor perspective for analytical challenge without endorsement or operational advice.',
    requiredContext: ['target Actor', 'actor interests and constraints', 'recent events', 'case frame'],
    analysisMoves: [
      'Gather the target actor one-hop subgraph and recent events.',
      'Model how the actor may perceive interests, constraints, and other actors.',
      'Generate likely moves in coarse probability bands.',
      'Run safety checks against operational or advocacy content.',
    ],
    outputSections: ['Framing disclaimer', 'Perceived interests', 'Constraints', 'Likely moves', 'Views of other actors'],
    modelInstructions: [
      'Always include the modeling adversary perspective disclaimer.',
      'Do not produce specific operational planning, targeting, or calls for harm.',
      'Cap synthesized confidence at 0.6 and route claims through review.',
    ],
    qualityChecks: [
      'No output advocates for the modeled actor.',
      'Likely moves are strategic and non-operational.',
      'Every promotable claim is review-queue only.',
    ],
    nextActions: ['Review individual claims before graph promotion.', 'Append the safe perspective summary as a memo annex.'],
  }),
  'cross.premortem': contract({
    toolId: 'cross.premortem',
    executionStage: 'prompt-contract',
    objective: 'Assume a recommendation failed and work backward to identify failure pathways, triggers, and mitigations.',
    requiredContext: ['memo recommendation or free text proposal', 'case constraints', 'actors', 'risks'],
    analysisMoves: [
      'Restate the recommendation or proposal under stress test.',
      'Generate five to ten plausible failure pathways.',
      'Classify severity and likelihood in coarse bands.',
      'List triggering conditions and mitigations for each pathway.',
    ],
    outputSections: ['Recommendation under test', 'Failure pathways', 'Trigger conditions', 'Mitigations', 'Memo annex block'],
    modelInstructions: [
      'Use the Klein 2007 premortem framing.',
      'Keep pathways advisory and synthesized with confidence capped at 0.6.',
      'Avoid false certainty or invented evidence.',
    ],
    qualityChecks: [
      'Each pathway has severity, likelihood, triggers, and mitigations.',
      'Catastrophic pathways are visible when plausible.',
      'The output can append cleanly to Memo Studio as an annex.',
    ],
    nextActions: ['Sort pathways by severity and likelihood.', 'Append the premortem to the active memo before export.'],
  }),
  'cross.context-health-explainer': contract({
    toolId: 'cross.context-health-explainer',
    executionStage: 'prompt-contract',
    objective: 'Explain missing context, stale receipts, weak graph coverage, and the next collection moves.',
    requiredContext: ['context health dimensions', 'case snapshot', 'source coverage', 'graph coverage'],
    analysisMoves: [
      'Identify the weakest context dimensions.',
      'Explain operational impact in plain language.',
      'Prioritize collection moves by expected value and effort.',
      'Keep advisory posture visible so low context does not hide data capture.',
    ],
    outputSections: ['Health summary', 'Weakest dimensions', 'Operational impact', 'Collection priorities', 'Rerun guidance'],
    modelInstructions: [
      'Use clear explanations instead of internal scoring jargon.',
      'Do not block the run because context is weak.',
      'Preserve low-health snapshots for auditability.',
    ],
    qualityChecks: [
      'The weakest layer and score are named.',
      'Each recommendation maps to a missing or stale context dimension.',
      'The output explains that context warnings are advisory by default.',
    ],
    nextActions: ['Run targeted ingestion for the weakest dimension.', 'Rerun affected tools after context improves.'],
  }),
  'cross.brief-exporter': contract({
    toolId: 'cross.brief-exporter',
    executionStage: 'prompt-contract',
    objective: 'Package selected tool outputs into a decision brief with visible claim-level trust metadata.',
    requiredContext: ['selected artifacts', 'claims and trust scores', 'citations', 'memo destination'],
    analysisMoves: [
      'Collect accepted sections and preserve their source artifact ids.',
      'Normalize headings and remove duplicate claims.',
      'Attach trust metadata and citation placeholders to each claim.',
      'Prepare Memo Studio handoff blocks without losing provenance.',
    ],
    outputSections: ['Brief outline', 'Selected sections', 'Claim trust table', 'Citation gaps', 'Memo Studio handoff'],
    modelInstructions: [
      'Do not polish away provenance or uncertainty.',
      'Keep citation gaps visible in exported blocks.',
      'Prefer concise operator-ready language.',
    ],
    qualityChecks: [
      'Every exported claim keeps provenance or a visible citation gap.',
      'Duplicate claims are merged with source references retained.',
      'Memo Studio blocks are stable enough to persist.',
    ],
    nextActions: ['Send accepted sections to Memo Studio.', 'Request citations for unresolved gaps before final export.'],
  }),
  'cross.scenario-projector': contract({
    toolId: 'cross.scenario-projector',
    executionStage: 'prompt-contract',
    objective: 'Project plausible scenario paths from graph state, claims, leverage, constraints, and uncertainties.',
    requiredContext: ['current graph state', 'drivers', 'constraints', 'uncertainties', 'recent events'],
    analysisMoves: [
      'Identify driving forces and constraints from the current context.',
      'Build distinct scenario branches with triggers and signposts.',
      'Explain confidence and uncertainty for each branch.',
      'Avoid treating projection output as prediction.',
    ],
    outputSections: ['Current baseline', 'Scenario branches', 'Triggers and signposts', 'Confidence and uncertainty', 'Monitoring plan'],
    modelInstructions: [
      'Label scenarios as plausible paths, not forecasts.',
      'Keep low-probability high-impact branches visible when evidence supports them.',
      'Return monitoring indicators for future updates.',
    ],
    qualityChecks: [
      'Each scenario has triggers, assumptions, and signposts.',
      'The baseline is separated from projected paths.',
      'Uncertainty is explicit and tied to missing context or contested evidence.',
    ],
    nextActions: ['Set monitoring indicators for key signposts.', 'Chain into Mediation Brief or Coalition Map depending on branch risk.'],
  }),
};

export function getMarketplaceHandlerContract(toolId: string): MarketplaceHandlerContract | null {
  return MARKETPLACE_HANDLER_CONTRACTS[toolId] ?? null;
}
