import { getCaseModule, listExampleCases } from '@/lib/cases/registry';
import type { CaseModule } from '@/types/case-module';

export type DraftTemplateId =
  | 'un-1-pager'
  | 'country-card'
  | 'talking-points'
  | 'mediation-brief'
  | 'executive-summary';

export type DraftStatus = 'new' | 'working' | 'review' | 'export-ready';

export interface DraftTemplateShell {
  id: DraftTemplateId;
  label: string;
  buyerPath: 'Foreign Policy Analyst' | 'Domestic Policy Analyst' | 'Corporate Strategic Analyst';
  description: string;
  phase: 'phase-4e-shell' | 'phase-6-generation';
  header: string;
  footer: string;
  sections: Array<{ id: string; title: string; prompt: string; required: boolean; maxLength: number; citationPolicy: 'required' | 'recommended' | 'optional' }>;
}

export interface DraftShellBlock {
  id: string;
  title: string;
  body: string;
  evidenceState: 'grounded' | 'needs-context' | 'placeholder';
}

export interface DraftShellRecord {
  id: string;
  caseId: string;
  templateId: DraftTemplateId;
  title: string;
  status: DraftStatus;
  workEpisode: string;
  updatedAt: string;
  ownerScope: 'demo' | 'private-workspace';
  exportState: 'manifest-ready' | 'local-only' | 'phase-6';
  summary: string;
  blocks: DraftShellBlock[];
}

export const DRAFTING_TEMPLATES: DraftTemplateShell[] = [
  {
    id: 'un-1-pager',
    label: 'UN 1-pager',
    buyerPath: 'Foreign Policy Analyst',
    description: 'Decision-ready brief for a principal who needs the issue, stakes, options, and source posture on one page.',
    phase: 'phase-6-generation',
    header: 'PRAXIS sourced one-page brief',
    footer: 'Citations and uncertainty must remain visible before export.',
    sections: [
      section('title', 'Title', 'Write a concise brief title.', 120, 'optional'),
      section('date', 'Date', 'Set the as-of date.', 80, 'optional'),
      section('bluf', 'BLUF', 'State the decision-relevant bottom line in one paragraph.', 500, 'required'),
      section('background', 'Background', 'Summarize the essential context and source base.', 900, 'required'),
      section('current-dynamics', 'Current Dynamics', 'Explain what is changing now.', 900, 'required'),
      section('key-actors', 'Key Actors', 'Name key actors and their role.', 700, 'recommended'),
      section('risks', 'Risks', 'List the most important risks and uncertainty.', 700, 'recommended'),
      section('recommendation', 'Recommendation', 'State a bounded recommendation or next action.', 600, 'required'),
    ],
  },
  {
    id: 'country-card',
    label: 'Country card',
    buyerPath: 'Foreign Policy Analyst',
    description: 'Compact country or theater card with actors, recent movement, leverage, risk, and watchpoints.',
    phase: 'phase-6-generation',
    header: 'PRAXIS country card',
    footer: 'Use concise fields and source receipts.',
    sections: [
      section('title', 'Title', 'Write the country or theater card title.', 120, 'optional'),
      section('snapshot', 'Snapshot', 'Summarize why this case matters now.', 700, 'required'),
      section('demographics', 'Demographics', 'Add population or social factors only when sourced.', 500, 'recommended'),
      section('political-landscape', 'Political Landscape', 'Summarize political actors and constraints.', 800, 'required'),
      section('economic-indicators', 'Economic Indicators', 'List relevant economic signals and uncertainty.', 600, 'recommended'),
      section('security', 'Security', 'Summarize security dynamics and risk.', 700, 'required'),
      section('sources', 'Sources', 'List the source posture and citation gaps.', 500, 'required'),
    ],
  },
  {
    id: 'talking-points',
    label: 'Talking points',
    buyerPath: 'Domestic Policy Analyst',
    description: 'Briefing lines for meetings, public affairs, or stakeholder engagement.',
    phase: 'phase-6-generation',
    header: 'PRAXIS talking points',
    footer: 'Keep lines source-grounded and audience-appropriate.',
    sections: [
      section('title', 'Title', 'Write the talking-points title.', 120, 'optional'),
      section('audience-note', 'Audience Note', 'Frame the audience and meeting purpose.', 350, 'required'),
      section('headline-points', 'Headline Points', 'Draft three to five short source-backed lines.', 700, 'required'),
      section('qa-anticipations', 'Q&A Anticipations', 'Prepare three to five careful responses.', 800, 'recommended'),
      section('closing', 'Closing', 'End with a restrained closing line or next step.', 250, 'optional'),
    ],
  },
  {
    id: 'mediation-brief',
    label: 'Mediation brief',
    buyerPath: 'Foreign Policy Analyst',
    description: 'Negotiation support brief that separates positions, interests, possible packages, and commitments.',
    phase: 'phase-6-generation',
    header: 'PRAXIS mediation brief',
    footer: 'Separate stated positions from inferred interests.',
    sections: [
      section('title', 'Title', 'Write the session brief title.', 120, 'optional'),
      section('session-goal', 'Session Goal', 'State the immediate mediation objective.', 450, 'required'),
      section('parties', 'Parties', 'Identify parties and roles.', 700, 'required'),
      section('positions-interests', 'Positions vs Interests', 'Separate demands from likely interests.', 900, 'required'),
      section('batna', 'BATNA Analysis', 'Name alternatives and leverage risks.', 700, 'recommended'),
      section('suggested-sequence', 'Suggested Sequence', 'Propose a practical conversation sequence.', 700, 'recommended'),
      section('risks', 'Risks', 'Name process and implementation risks.', 600, 'required'),
    ],
  },
  {
    id: 'executive-summary',
    label: 'Executive summary',
    buyerPath: 'Corporate Strategic Analyst',
    description: 'Board-ready executive summary connecting findings, implications, and recommendation.',
    phase: 'phase-6-generation',
    header: 'PRAXIS executive summary',
    footer: 'Recommendations must preserve assumptions and source posture.',
    sections: [
      section('title', 'Title', 'Write the executive summary title.', 120, 'optional'),
      section('bottom-line', 'Bottom Line', 'State the conclusion and decision relevance.', 450, 'required'),
      section('context', 'Context', 'Summarize the evidence base and scope.', 700, 'required'),
      section('findings', 'Findings', 'List three to five findings with citation posture.', 1000, 'required'),
      section('implications', 'Implications', 'Explain operational or strategic implications.', 800, 'required'),
      section('recommendation', 'Recommendation', 'Recommend a bounded next action.', 550, 'required'),
    ],
  },
];

const DEFAULT_CASE_ID = listExampleCases()[0]?.id ?? 'syria-2026';

const DEMO_DRAFTS: DraftShellRecord[] = [
  buildDraftRecord({
    id: 'demo-brief',
    caseId: DEFAULT_CASE_ID,
    templateId: 'un-1-pager',
    status: 'working',
    workEpisode: 'Current assessment',
    updatedAt: '2026-05-10T16:20:00.000Z',
    ownerScope: 'demo',
    exportState: 'local-only',
  }),
  buildDraftRecord({
    id: 'mediation-session-note',
    caseId: DEFAULT_CASE_ID,
    templateId: 'mediation-brief',
    status: 'review',
    workEpisode: 'Package review',
    updatedAt: '2026-05-10T12:10:00.000Z',
    ownerScope: 'demo',
    exportState: 'manifest-ready',
  }),
];

export function listDraftTemplates(): DraftTemplateShell[] {
  return DRAFTING_TEMPLATES;
}

export function getDraftTemplate(templateId: string | undefined): DraftTemplateShell {
  return DRAFTING_TEMPLATES.find((template) => template.id === templateId) ?? DRAFTING_TEMPLATES[0];
}

export function listDraftShells(): DraftShellRecord[] {
  return DEMO_DRAFTS;
}

export function getDraftShell(draftId: string, input?: { caseId?: string; templateId?: string }): DraftShellRecord | null {
  if (draftId === 'new') {
    return buildDraftRecord({
      id: 'new',
      caseId: input?.caseId ?? DEFAULT_CASE_ID,
      templateId: getDraftTemplate(input?.templateId).id,
      status: 'new',
      workEpisode: 'Unassigned episode',
      updatedAt: new Date().toISOString(),
      ownerScope: 'private-workspace',
      exportState: 'phase-6',
    });
  }
  return DEMO_DRAFTS.find((draft) => draft.id === draftId) ?? null;
}

export function getDraftCase(caseId: string): CaseModule {
  return getCaseModule(caseId) ?? listExampleCases()[0];
}

function buildDraftRecord(input: {
  id: string;
  caseId: string;
  templateId: DraftTemplateId;
  status: DraftStatus;
  workEpisode: string;
  updatedAt: string;
  ownerScope: DraftShellRecord['ownerScope'];
  exportState: DraftShellRecord['exportState'];
}): DraftShellRecord {
  const template = getDraftTemplate(input.templateId);
  const caseModule = getDraftCase(input.caseId);
  return {
    ...input,
    templateId: template.id,
    title: `${template.label}: ${caseModule.manifest.name}`,
    summary: `${template.description} Phase 6 adds source-aware auto-fill proposals and section refinements that remain review-required before export.`,
    blocks: template.sections.map((section, index) => ({
      id: section.id,
      title: section.title,
      body: index === 0
        ? `${caseModule.manifest.summary} This section is ready for analyst editing, source-grounded generation, and section-level refinement.`
        : section.prompt,
      evidenceState: index === 0 || section.citationPolicy === 'required' ? 'grounded' : 'placeholder',
    })),
  };
}

function section(
  id: string,
  title: string,
  prompt: string,
  maxLength: number,
  citationPolicy: DraftTemplateShell['sections'][number]['citationPolicy'],
  required = true,
): DraftTemplateShell['sections'][number] {
  return { id, title, prompt, maxLength, citationPolicy, required };
}
