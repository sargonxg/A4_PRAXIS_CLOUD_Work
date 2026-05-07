import type { OntologyId } from '@/lib/ontology/types';
import type { UserRole } from '@/types/situation';
import type { WorkbenchTabId } from '@/types/workbench';

export type EmptyStateActionKind = 'open_tab' | 'run_tool' | 'create_memo' | 'convene_boardroom' | 'add_context';

export interface EmptyStateAction {
  kind: EmptyStateActionKind;
  label: string;
  why: string;
  target?: string;
}

type GuidedTabId = Extract<WorkbenchTabId, 'graph' | 'ach' | 'tools' | 'memos' | 'boardroom' | 'ontology'>;

interface RoleActionProfile {
  noun: string;
  firstQuestion: string;
  boardroomFrame: string;
}

interface OntologyActionProfile {
  toolId: string;
  memoId: string;
  contextSeed: string;
  graphSeed: string;
  ontologyQuestion: string;
}

export const EMPTY_STATE_REVIEW_ROLES = ['analyst', 'mediator', 'advisor', 'researcher'] as const satisfies readonly UserRole[];
export const EMPTY_STATE_REVIEW_ONTOLOGIES = ['conflict', 'mediation', 'governance', 'narrative', 'humanitarian'] as const satisfies readonly OntologyId[];
export const EMPTY_STATE_GUIDED_TABS = ['graph', 'ach', 'tools', 'memos', 'boardroom', 'ontology'] as const satisfies readonly GuidedTabId[];

const PURPOSE: Partial<Record<WorkbenchTabId, string>> = {
  graph: 'The graph is where PRAXIS turns sources, actors, claims, evidence, and verdicts into an inspectable operating picture.',
  ach: 'ACH helps compare competing hypotheses before the case hardens around the first plausible story.',
  tools: 'Tools are ranked from your role, ontology lenses, and current case material so the first run has enough context.',
  memos: 'Memos turn case graph state into cited work products that can later be assembled in Draft.',
  boardroom: 'Boardroom convenes structured advisors over locked case context when you need a deliberate second read.',
  ontology: 'Ontology shows the active grammar, validator coverage, and which graph primitives are strong or missing.',
};

const ROLE_ACTION_PROFILES = {
  observer: {
    noun: 'observer',
    firstQuestion: 'what changed and which sources prove it',
    boardroomFrame: 'monitoring posture',
  },
  analyst: {
    noun: 'analyst',
    firstQuestion: 'which claim is most decision-relevant',
    boardroomFrame: 'analytic confidence',
  },
  mediator: {
    noun: 'mediator',
    firstQuestion: 'which interests sit behind the stated positions',
    boardroomFrame: 'negotiation pathway',
  },
  party: {
    noun: 'party representative',
    firstQuestion: 'which commitments and constraints shape room for movement',
    boardroomFrame: 'party strategy',
  },
  advisor: {
    noun: 'advisor',
    firstQuestion: 'which option is defensible to the principal',
    boardroomFrame: 'policy option',
  },
  researcher: {
    noun: 'researcher',
    firstQuestion: 'which evidence gap would change the literature review',
    boardroomFrame: 'research design',
  },
  human_rights_officer: {
    noun: 'human rights officer',
    firstQuestion: 'which alleged violation needs corroboration first',
    boardroomFrame: 'protection and accountability',
  },
  sanctions_analyst: {
    noun: 'sanctions analyst',
    firstQuestion: 'which actor, asset, or network is sanction-relevant',
    boardroomFrame: 'designation risk',
  },
  humanitarian_coordinator: {
    noun: 'humanitarian coordinator',
    firstQuestion: 'which access or protection gap is operationally urgent',
    boardroomFrame: 'response prioritization',
  },
  treaty_lawyer: {
    noun: 'treaty lawyer',
    firstQuestion: 'which obligation or reservation controls the analysis',
    boardroomFrame: 'legal theory',
  },
  defense_analyst: {
    noun: 'defense analyst',
    firstQuestion: 'which capability or posture shift changes deterrence',
    boardroomFrame: 'security assessment',
  },
} satisfies Record<UserRole, RoleActionProfile>;

const ONTOLOGY_ACTION_PROFILES = {
  conflict: {
    toolId: 'conflict.leverage-trace',
    memoId: 'sit-rep',
    contextSeed: 'actors, incidents, claims, and commitments',
    graphSeed: 'actor-event-claim chains',
    ontologyQuestion: 'which conflict primitives still lack evidence',
  },
  mediation: {
    toolId: 'mediation.zopa-finder',
    memoId: 'mediation-summary',
    contextSeed: 'parties, positions, interests, and BATNAs',
    graphSeed: 'party-position-interest links',
    ontologyQuestion: 'which positions are not yet connected to interests',
  },
  governance: {
    toolId: 'governance.coalition-map',
    memoId: 'mandate-brief',
    contextSeed: 'institutions, veto players, mandates, and voting blocs',
    graphSeed: 'institution-veto-coalition links',
    ontologyQuestion: 'which mandate or coalition validators need evidence',
  },
  narrative: {
    toolId: 'narrative.frame-cascade',
    memoId: 'frame-analysis',
    contextSeed: 'frames, channels, audiences, and counter-frames',
    graphSeed: 'frame-channel-audience links',
    ontologyQuestion: 'which audience or frame primitives are thin',
  },
  'human-rights': {
    toolId: 'rights.violation-pattern',
    memoId: 'rights-brief',
    contextSeed: 'rights holders, duty bearers, allegations, and sources',
    graphSeed: 'violation-duty-bearer-evidence links',
    ontologyQuestion: 'which alleged violations lack corroborating evidence',
  },
  economic: {
    toolId: 'economic.impact-map',
    memoId: 'economic-risk-brief',
    contextSeed: 'markets, sectors, chokepoints, and exposure claims',
    graphSeed: 'sector-impact-exposure links',
    ontologyQuestion: 'which exposure primitives have no supporting source',
  },
  humanitarian: {
    toolId: 'humanitarian.access-map',
    memoId: 'humanitarian-snapshot',
    contextSeed: 'affected groups, access constraints, needs, and responders',
    graphSeed: 'need-access-response links',
    ontologyQuestion: 'which needs or access constraints are unverified',
  },
  legal: {
    toolId: 'legal.obligation-check',
    memoId: 'legal-options-note',
    contextSeed: 'obligations, jurisdiction, remedies, and precedents',
    graphSeed: 'obligation-fact-remedy links',
    ontologyQuestion: 'which obligations are not connected to facts',
  },
  security: {
    toolId: 'security.posture-shift',
    memoId: 'security-assessment',
    contextSeed: 'capabilities, posture, incidents, and warning indicators',
    graphSeed: 'capability-posture-indicator links',
    ontologyQuestion: 'which warning indicators are still missing',
  },
} satisfies Record<OntologyId, OntologyActionProfile>;

export const EMPTY_STATE_ACTION_MATRIX_REVIEW_SET = EMPTY_STATE_REVIEW_ROLES.flatMap((role) => (
  EMPTY_STATE_REVIEW_ONTOLOGIES.flatMap((ontologyId) => (
    EMPTY_STATE_GUIDED_TABS.map((tabId) => `${role}:${ontologyId}:${tabId}`)
  ))
));

const TAB_ACTION_BUILDERS: Record<GuidedTabId, (input: {
  role: RoleActionProfile;
  ontology: OntologyActionProfile;
}) => EmptyStateAction[]> = {
  graph: ({ ontology }) => [
    { kind: 'add_context', label: `Seed ${ontology.graphSeed}`, why: `The graph needs ${ontology.contextSeed} before paths are trustworthy.`, target: 'context' },
    { kind: 'run_tool', label: `Run ${ontology.toolId}`, why: 'A first structured run can propose graph candidates for review.', target: ontology.toolId },
    { kind: 'open_tab', label: 'Check ontology coverage', why: ontology.ontologyQuestion, target: 'ontology' },
  ],
  ach: ({ role, ontology }) => [
    { kind: 'add_context', label: 'Add competing explanations', why: `Frame at least two explanations around ${role.firstQuestion}.`, target: 'context' },
    { kind: 'run_tool', label: `Run ${ontology.toolId}`, why: 'Use the first tool output as evidence rows for the ACH matrix.', target: ontology.toolId },
    { kind: 'open_tab', label: 'Open Graph first', why: 'Graph claims make ACH evidence easier to audit and cite.', target: 'graph' },
  ],
  tools: ({ role, ontology }) => [
    { kind: 'run_tool', label: `Start with ${ontology.toolId}`, why: `This is a strong first run for a ${role.noun} asking ${role.firstQuestion}.`, target: ontology.toolId },
    { kind: 'add_context', label: `Attach ${ontology.contextSeed}`, why: 'Tool output improves when the case frame is explicit.', target: 'context' },
    { kind: 'create_memo', label: `Prepare ${ontology.memoId}`, why: 'Preserve the result as a citable decision product.', target: ontology.memoId },
  ],
  memos: ({ ontology }) => [
    { kind: 'create_memo', label: `Draft ${ontology.memoId}`, why: 'This template fits the active ontology and can become the first export package.', target: ontology.memoId },
    { kind: 'run_tool', label: `Run ${ontology.toolId} first`, why: 'A tool output gives the memo stronger structured content.', target: ontology.toolId },
    { kind: 'open_tab', label: 'Assemble in Draft', why: 'Draft packages selected memos with appendices and redaction settings.', target: 'draft' },
  ],
  boardroom: ({ role, ontology }) => [
    { kind: 'convene_boardroom', label: `Convene ${role.boardroomFrame} review`, why: 'Use multiple advisor personas to stress-test the early case frame.', target: 'boardroom' },
    { kind: 'add_context', label: 'Lock the decision question', why: `Boardroom works best when it deliberates on ${role.firstQuestion}.`, target: 'context' },
    { kind: 'run_tool', label: `Bring in ${ontology.toolId}`, why: 'A concrete tool output gives the deliberation a citable anchor.', target: ontology.toolId },
  ],
  ontology: ({ ontology }) => [
    { kind: 'open_tab', label: 'Check primitive coverage', why: ontology.ontologyQuestion, target: 'ontology' },
    { kind: 'add_context', label: `Add ${ontology.contextSeed}`, why: 'Validators become useful once the case has a small graph seed.', target: 'context' },
    { kind: 'run_tool', label: `Run ${ontology.toolId}`, why: 'The recommended tool can create the first structured output for this ontology.', target: ontology.toolId },
  ],
};

export function getEmptyStatePurpose(tabId: WorkbenchTabId) {
  return PURPOSE[tabId] ?? 'Use this surface after the case has enough context to support a reliable first pass.';
}

export function getEmptyStateActions(input: {
  tabId: WorkbenchTabId;
  role: UserRole;
  ontologyId?: OntologyId;
}): EmptyStateAction[] {
  const role = ROLE_ACTION_PROFILES[input.role];
  const ontology = ONTOLOGY_ACTION_PROFILES[input.ontologyId ?? 'conflict'];
  if (isGuidedTabId(input.tabId)) return TAB_ACTION_BUILDERS[input.tabId]({ role, ontology });

  return [
    { kind: 'open_tab', label: 'Start from Desk', why: 'Desk shows what changed and the next case-aware action.', target: 'desk' },
    { kind: 'add_context', label: `Add ${ontology.contextSeed}`, why: 'Every surface improves once the case has a small evidence-backed seed.', target: 'context' },
    { kind: 'run_tool', label: `Run ${ontology.toolId}`, why: `Useful first tool for a ${role.noun} working this ontology.`, target: ontology.toolId },
  ];
}

function isGuidedTabId(tabId: WorkbenchTabId): tabId is GuidedTabId {
  return (EMPTY_STATE_GUIDED_TABS as readonly WorkbenchTabId[]).includes(tabId);
}
