import { getCaseModule, listExampleCases } from '@/lib/cases/registry';
import type { CaseModule } from '@/types/case-module';

export type DraftTemplateId =
  | 'un-one-pager'
  | 'country-card'
  | 'talking-points'
  | 'mediation-brief'
  | 'corporate-risk-brief';

export type DraftStatus = 'new' | 'working' | 'review' | 'export-ready';

export interface DraftTemplateShell {
  id: DraftTemplateId;
  label: string;
  buyerPath: 'Foreign Policy Analyst' | 'Domestic Policy Analyst' | 'Corporate Strategic Analyst';
  description: string;
  phase: 'phase-4e-shell' | 'phase-6-generation';
  sections: Array<{ id: string; title: string; prompt: string }>;
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
    id: 'un-one-pager',
    label: 'UN 1-pager',
    buyerPath: 'Foreign Policy Analyst',
    description: 'Decision-ready brief for a principal who needs the issue, stakes, options, and source posture on one page.',
    phase: 'phase-4e-shell',
    sections: [
      { id: 'bluf', title: 'Bottom line', prompt: 'State the decision-relevant answer in one paragraph.' },
      { id: 'stakes', title: 'Stakes', prompt: 'Name the strategic, humanitarian, and diplomatic stakes.' },
      { id: 'options', title: 'Options', prompt: 'Compare two to three plausible courses of action.' },
      { id: 'source-posture', title: 'Source posture', prompt: 'Summarize confidence, citations, and uncertainty.' },
    ],
  },
  {
    id: 'country-card',
    label: 'Country card',
    buyerPath: 'Foreign Policy Analyst',
    description: 'Compact country or theater card with actors, recent movement, leverage, risk, and watchpoints.',
    phase: 'phase-4e-shell',
    sections: [
      { id: 'snapshot', title: 'Snapshot', prompt: 'Summarize the theater and why it matters now.' },
      { id: 'actors', title: 'Actors and leverage', prompt: 'List actors, incentives, and leverage.' },
      { id: 'risk', title: 'Risk and watchpoints', prompt: 'Name near-term risk indicators.' },
    ],
  },
  {
    id: 'talking-points',
    label: 'Talking points',
    buyerPath: 'Domestic Policy Analyst',
    description: 'Briefing lines for meetings, public affairs, or stakeholder engagement.',
    phase: 'phase-4e-shell',
    sections: [
      { id: 'context', title: 'Context', prompt: 'Frame the audience and meeting purpose.' },
      { id: 'messages', title: 'Key messages', prompt: 'Draft concise lines with source backing.' },
      { id: 'if-pressed', title: 'If pressed', prompt: 'Prepare careful fallback lines for uncertainty.' },
    ],
  },
  {
    id: 'mediation-brief',
    label: 'Mediation brief',
    buyerPath: 'Foreign Policy Analyst',
    description: 'Negotiation support brief that separates positions, interests, possible packages, and commitments.',
    phase: 'phase-4e-shell',
    sections: [
      { id: 'parties', title: 'Parties', prompt: 'Identify parties and their roles.' },
      { id: 'positions', title: 'Positions and interests', prompt: 'Separate stated positions from likely interests.' },
      { id: 'packages', title: 'Possible packages', prompt: 'Outline practical package space.' },
      { id: 'commitments', title: 'Commitments', prompt: 'List commitments to verify or pursue.' },
    ],
  },
  {
    id: 'corporate-risk-brief',
    label: 'Corporate risk brief',
    buyerPath: 'Corporate Strategic Analyst',
    description: 'Board-ready risk note connecting regulation, market exposure, sustainability pressure, and options.',
    phase: 'phase-4e-shell',
    sections: [
      { id: 'exposure', title: 'Exposure', prompt: 'Name direct and indirect exposures.' },
      { id: 'signals', title: 'Signals', prompt: 'Summarize regulatory and market signals.' },
      { id: 'actions', title: 'Actions', prompt: 'Recommend actions with assumptions and evidence.' },
    ],
  },
];

const DEFAULT_CASE_ID = listExampleCases()[0]?.id ?? 'syria-2026';

const DEMO_DRAFTS: DraftShellRecord[] = [
  buildDraftRecord({
    id: 'demo-brief',
    caseId: DEFAULT_CASE_ID,
    templateId: 'un-one-pager',
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
    summary: `${template.description} Phase 4E provides the workspace shell; generated templates and section actions are owned by Phase 6.`,
    blocks: template.sections.map((section, index) => ({
      id: section.id,
      title: section.title,
      body: index === 0
        ? `${caseModule.manifest.summary} This section is ready for analyst editing and source-grounded generation in Phase 6.`
        : section.prompt,
      evidenceState: index === 0 ? 'grounded' : 'placeholder',
    })),
  };
}
