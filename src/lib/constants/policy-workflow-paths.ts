import type { SituationType, UserRole } from '@/types/situation';

export type PolicyWorkflowPathId =
  | 'political-officer'
  | 'country-desk'
  | 'mediator-envoy'
  | 'humanitarian-access'
  | 'legal-sanctions'
  | 'political-risk'
  | 'policy-research'
  | 'media-disinformation'
  | 'stabilization'
  | 'election-governance';

export interface PolicyWorkflowPath {
  id: PolicyWorkflowPathId;
  label: string;
  shortLabel: string;
  description: string;
  actualWorkflow: string;
  valuableUi: string;
  paidOutput: string;
  firstRunQuestion: string;
  requiredInputs: string[];
  situationType: SituationType;
  userRole: UserRole;
  domainHint: string;
  recommendedSourceIds: string[];
  firstToolIds: string[];
  deliverables: string[];
}

export const POLICY_WORKFLOW_PATHS: PolicyWorkflowPath[] = [
  {
    id: 'political-officer',
    label: 'UN / OSCE Political Officer',
    shortLabel: 'Political officer',
    description: 'Daily read, escalation monitoring, actor posture, and briefable political options.',
    actualWorkflow: 'Morning source triage, actor posture update, escalation read, political options, and a short brief for a senior desk or mission lead.',
    valuableUi: 'A case-file dashboard with source freshness, escalation shifts, actor movement, and one-click briefing outputs.',
    paidOutput: 'A cited daily political read with escalation watch, actor posture, assumptions, and recommended diplomatic next steps.',
    firstRunQuestion: 'What changed in this situation since the last brief, and what should a political affairs officer elevate today?',
    requiredInputs: ['Situation description', 'Region', 'Core actors', 'Official statements or reports', 'Recent media/open-source coverage'],
    situationType: 'international',
    userRole: 'analyst',
    domainHint: 'political-security',
    recommendedSourceIds: ['foundational', 'diplomatic-official', 'conflict-security', 'humanitarian', 'news-media', 'think-tanks'],
    firstToolIds: ['dashboard', 'early-warning', 'risk-monitor', 'actor-profiles', 'briefing'],
    deliverables: ['Daily read', 'Political briefing', 'Escalation watch', 'Actor posture note'],
  },
  {
    id: 'country-desk',
    label: 'Bilateral Diplomat / Country Desk',
    shortLabel: 'Country desk',
    description: 'Embassy-facing picture, talking points, policy asks, and diplomatic risk framing.',
    actualWorkflow: 'Prepare embassy-facing updates, policy asks, bilateral talking points, leader-readouts, and risk caveats before engagements.',
    valuableUi: 'A country-desk workspace that links actors, interests, leverage points, sensitive language, and draft-ready talking points.',
    paidOutput: 'A concise country note with recommended lines, policy options, risks, and source-grounded background.',
    firstRunQuestion: 'What should our country team say, avoid saying, and ask for in the next bilateral engagement?',
    requiredInputs: ['Country or region', 'Counterpart actors', 'Policy objective', 'Red lines', 'Recent official statements'],
    situationType: 'international',
    userRole: 'advisor',
    domainHint: 'diplomacy',
    recommendedSourceIds: ['foundational', 'diplomatic-official', 'news-media', 'think-tanks', 'economic-development'],
    firstToolIds: ['dashboard', 'briefing', 'talking-points', 'actor-profiles', 'sanctions'],
    deliverables: ['Country note', 'Talking points', 'Policy options', 'Risk brief'],
  },
  {
    id: 'mediator-envoy',
    label: 'Mediator / Envoy Support',
    shortLabel: 'Mediator',
    description: 'Party mapping, interests, spoilers, confidence-building measures, and negotiation design.',
    actualWorkflow: 'Map parties, interests, spoilers, leverage, confidence-building options, sequencing, and draft language for mediation support.',
    valuableUi: 'A negotiation workspace with stakeholder map, ZOPA/BATNA notes, spoiler risks, commitments, and process-design options.',
    paidOutput: 'A mediation prep pack with party interests, possible CBMs, risk controls, sequencing, and draft engagement language.',
    firstRunQuestion: 'Where is there viable negotiation space, who can block it, and what confidence-building move should be tested first?',
    requiredInputs: ['Parties', 'Known demands', 'Interests or grievances', 'Prior commitments', 'Mediator mandate'],
    situationType: 'international',
    userRole: 'mediator',
    domainHint: 'mediation',
    recommendedSourceIds: ['foundational', 'diplomatic-official', 'conflict-security', 'news-media', 'think-tanks'],
    firstToolIds: ['stakeholder-map', 'negotiation-prep', 'mediation-design', 'brainstorming-table', 'talking-points'],
    deliverables: ['Process design note', 'Stakeholder map', 'Negotiation prep', 'CBM options'],
  },
  {
    id: 'humanitarian-access',
    label: 'Humanitarian Access / Protection Lead',
    shortLabel: 'Humanitarian',
    description: 'Access constraints, protection risks, displacement signals, and coordination priorities.',
    actualWorkflow: 'Track access constraints, protection incidents, displacement, operating restrictions, and urgent coordination requirements.',
    valuableUi: 'An access/protection board with constraints, corridors, affected groups, source confidence, and action-ready coordination notes.',
    paidOutput: 'A humanitarian access snapshot with priority constraints, protection concerns, affected populations, and operational asks.',
    firstRunQuestion: 'What are the most important access and protection constraints right now, and what should coordination actors prioritize?',
    requiredInputs: ['Affected area', 'Population groups', 'Access constraints', 'Humanitarian sources', 'Security incidents'],
    situationType: 'civil',
    userRole: 'analyst',
    domainHint: 'humanitarian',
    recommendedSourceIds: ['foundational', 'humanitarian', 'diplomatic-official', 'news-media', 'conflict-security'],
    firstToolIds: ['humanitarian', 'risk-monitor', 'early-warning', 'actor-profiles', 'briefing'],
    deliverables: ['Access snapshot', 'Protection note', 'Displacement watch', 'Coordination brief'],
  },
  {
    id: 'legal-sanctions',
    label: 'IHL / Accountability / Sanctions Analyst',
    shortLabel: 'Legal / sanctions',
    description: 'Mandates, obligations, designation risks, evidence gaps, and legal follow-up.',
    actualWorkflow: 'Track legal obligations, alleged violations, mandates, designation criteria, evidence gaps, and follow-up recommendations.',
    valuableUi: 'A legal/sanctions matrix tying actors, conduct, obligations, evidence, source quality, and next collection needs.',
    paidOutput: 'An obligation or sanctions memo with evidence gaps, legal caveats, source receipts, and recommended follow-up.',
    firstRunQuestion: 'Which obligations or sanctions criteria may be engaged, and what evidence is still too weak to rely on?',
    requiredInputs: ['Relevant actors', 'Alleged conduct', 'Legal framework or mandate', 'Evidence sources', 'Dates and locations'],
    situationType: 'legal',
    userRole: 'analyst',
    domainHint: 'legal',
    recommendedSourceIds: ['foundational', 'diplomatic-official', 'humanitarian', 'economic-development', 'think-tanks'],
    firstToolIds: ['legal-tracker', 'sanctions', 'human-rights', 'treaty-analyzer', 'briefing'],
    deliverables: ['Legal memo', 'Sanctions scan', 'Obligation matrix', 'Evidence gap list'],
  },
  {
    id: 'political-risk',
    label: 'Political-Risk / Private-Sector Analyst',
    shortLabel: 'Political risk',
    description: 'Exposure, instability signals, economic impact, scenario branches, and executive briefings.',
    actualWorkflow: 'Monitor instability signals, exposure, policy shocks, sanctions risk, economic impact, and executive decision points.',
    valuableUi: 'An executive risk board with scenarios, exposure map, source freshness, triggers, and recommended mitigations.',
    paidOutput: 'An executive political-risk brief with scenarios, indicators, exposure, confidence, and recommended actions.',
    firstRunQuestion: 'What are the top political-risk scenarios, what indicators should we watch, and what mitigation choices are available?',
    requiredInputs: ['Business or policy exposure', 'Country/region', 'Actors', 'Assets or interests at risk', 'Recent risk signals'],
    situationType: 'political',
    userRole: 'analyst',
    domainHint: 'political-risk',
    recommendedSourceIds: ['foundational', 'news-media', 'economic-development', 'think-tanks', 'diplomatic-official'],
    firstToolIds: ['risk-monitor', 'economic-impact', 'scenario', 'briefing', 'source-scout'],
    deliverables: ['Risk brief', 'Scenario memo', 'Exposure map', 'Executive update'],
  },
  {
    id: 'policy-research',
    label: 'Think-Tank / Policy Researcher',
    shortLabel: 'Policy research',
    description: 'Research plans, source discovery, evidence synthesis, policy memos, and literature gaps.',
    actualWorkflow: 'Build a research question, discover sources, compare evidence, identify gaps, and produce a defensible policy memo.',
    valuableUi: 'A research workspace with query plan, source map, evidence table, competing claims, and memo/export path.',
    paidOutput: 'A source-grounded policy memo or literature synthesis with gaps, assumptions, citations, and options.',
    firstRunQuestion: 'What is the best research plan, source map, and evidence gap list for this policy question?',
    requiredInputs: ['Research question', 'Scope', 'Preferred source classes', 'Known sources', 'Audience'],
    situationType: 'custom',
    userRole: 'researcher',
    domainHint: 'research',
    recommendedSourceIds: ['foundational', 'think-tanks', 'diplomatic-official', 'news-media', 'economic-development'],
    firstToolIds: ['source-scout', 'deep-search-agent', 'policy-memo', 'brainstorming-table', 'briefing'],
    deliverables: ['Research plan', 'Source map', 'Policy memo', 'Evidence synthesis'],
  },
  {
    id: 'media-disinformation',
    label: 'Media / Disinformation Analyst',
    shortLabel: 'Media analyst',
    description: 'Narrative tracking, source diversity, information risks, and influence environment notes.',
    actualWorkflow: 'Track narratives, source clusters, amplification, audience risk, influence operations indicators, and countermessaging constraints.',
    valuableUi: 'An information-environment board with narrative frames, source diversity, amplification, contradictions, and risk notes.',
    paidOutput: 'A narrative and influence-risk brief with source diversity, claims, suspected amplification, and recommended monitoring.',
    firstRunQuestion: 'Which narratives are moving, who is amplifying them, and what evidence supports or weakens the influence-risk judgment?',
    requiredInputs: ['Narratives or keywords', 'Media/source set', 'Target audiences', 'Actors', 'Time window'],
    situationType: 'political',
    userRole: 'analyst',
    domainHint: 'media',
    recommendedSourceIds: ['foundational', 'news-media', 'think-tanks', 'diplomatic-official', 'conflict-security'],
    firstToolIds: ['media-roundup', 'info-environment', 'media-compass', 'source-scout', 'red-team-review'],
    deliverables: ['Narrative brief', 'Media roundup', 'Source-diversity note', 'Influence risk scan'],
  },
  {
    id: 'stabilization',
    label: 'Stabilization / Peacebuilding Program Lead',
    shortLabel: 'Stabilization',
    description: 'Program risk, conflict sensitivity, stakeholder incentives, and implementation constraints.',
    actualWorkflow: 'Assess program conflict sensitivity, local incentives, spoilers, delivery constraints, and risk mitigation before implementation.',
    valuableUi: 'A stabilization workspace with stakeholder incentives, commitments, program risks, conflict-sensitivity checks, and briefing outputs.',
    paidOutput: 'A conflict-sensitivity and stabilization risk note with actors, constraints, mitigation options, and assumptions.',
    firstRunQuestion: 'Which program choices could worsen conflict dynamics, and what mitigation design should be built into implementation?',
    requiredInputs: ['Program objective', 'Target area', 'Stakeholders', 'Known grievances', 'Implementation constraints'],
    situationType: 'civil',
    userRole: 'advisor',
    domainHint: 'peacebuilding',
    recommendedSourceIds: ['foundational', 'humanitarian', 'diplomatic-official', 'economic-development', 'think-tanks'],
    firstToolIds: ['peacebuilding-index', 'stakeholder-map', 'risk-monitor', 'commitments', 'briefing'],
    deliverables: ['Program risk note', 'Conflict sensitivity brief', 'Stakeholder map', 'Commitment tracker'],
  },
  {
    id: 'election-governance',
    label: 'Election / Governance Specialist',
    shortLabel: 'Election / governance',
    description: 'Electoral risk, institutional stress, violence indicators, and governance reform options.',
    actualWorkflow: 'Monitor election calendar, institutional stress, violence risks, disinformation, legal disputes, and governance reform options.',
    valuableUi: 'An election/governance board with milestones, risk indicators, actors, institutional constraints, and recommended interventions.',
    paidOutput: 'An election-risk or governance memo with warning indicators, actors, legal/institutional constraints, and response options.',
    firstRunQuestion: 'Where are the main election or governance stress points, and which indicators should trigger escalation?',
    requiredInputs: ['Election or governance process', 'Institutions', 'Political actors', 'Timeline', 'Recent incidents or disputes'],
    situationType: 'political',
    userRole: 'analyst',
    domainHint: 'governance',
    recommendedSourceIds: ['foundational', 'diplomatic-official', 'news-media', 'humanitarian', 'think-tanks'],
    firstToolIds: ['electoral-risk', 'early-warning', 'actor-profiles', 'briefing', 'talking-points'],
    deliverables: ['Election risk memo', 'Governance note', 'Violence indicator watch', 'Reform options'],
  },
];

export function getPolicyWorkflowPath(id?: string | null): PolicyWorkflowPath | null {
  if (!id) return null;
  return POLICY_WORKFLOW_PATHS.find((path) => path.id === id) ?? null;
}
