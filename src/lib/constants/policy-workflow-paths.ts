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
