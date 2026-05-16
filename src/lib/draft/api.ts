export type DraftTemplateId =
  | 'un-1-pager'
  | 'country-card'
  | 'talking-points'
  | 'mediation-brief'
  | 'executive-summary';

export interface DraftTemplateShell {
  id: DraftTemplateId;
  label: string;
  buyerPath: 'Foreign Policy Analyst' | 'Domestic Policy Analyst' | 'Corporate Strategic Analyst';
  description: string;
  phase: 'phase-6-generation';
  header: string;
  footer: string;
  sections: Array<{
    id: string;
    title: string;
    prompt: string;
    required: boolean;
    maxLength: number;
    citationPolicy: 'required' | 'recommended' | 'optional';
  }>;
}

const section = (
  id: string,
  title: string,
  prompt: string,
  maxLength: number,
  citationPolicy: DraftTemplateShell['sections'][number]['citationPolicy'],
): DraftTemplateShell['sections'][number] => ({
  id,
  title,
  prompt,
  required: citationPolicy === 'required',
  maxLength,
  citationPolicy,
});

export const DRAFTING_TEMPLATES: DraftTemplateShell[] = [
  {
    id: 'un-1-pager',
    label: 'One-page brief',
    buyerPath: 'Foreign Policy Analyst',
    description: 'Decision-ready brief grounded in the active user workspace.',
    phase: 'phase-6-generation',
    header: 'PRAXIS sourced one-page brief',
    footer: 'Citations and uncertainty must remain visible before export.',
    sections: [
      section('title', 'Title', 'Write a concise brief title for the active user case.', 120, 'optional'),
      section('bluf', 'BLUF', 'State the decision-relevant bottom line in one paragraph.', 500, 'required'),
      section('background', 'Background', 'Summarize essential context and source posture.', 900, 'required'),
      section('dynamics', 'Current dynamics', 'Explain what is changing now.', 900, 'recommended'),
      section('recommendation', 'Recommendation', 'State a bounded next action.', 600, 'required'),
    ],
  },
  {
    id: 'country-card',
    label: 'Context card',
    buyerPath: 'Foreign Policy Analyst',
    description: 'Compact theater or policy context card for the active user situation.',
    phase: 'phase-6-generation',
    header: 'PRAXIS context card',
    footer: 'Use concise fields and source receipts.',
    sections: [
      section('snapshot', 'Snapshot', 'Summarize why this context matters now.', 700, 'required'),
      section('actors', 'Actors', 'Identify actors and roles.', 700, 'recommended'),
      section('signals', 'Signals', 'List relevant signals and uncertainty.', 600, 'recommended'),
      section('risks', 'Risks', 'Summarize risk and confidence.', 700, 'required'),
      section('sources', 'Sources', 'List source posture and citation gaps.', 500, 'required'),
    ],
  },
  {
    id: 'talking-points',
    label: 'Talking points',
    buyerPath: 'Domestic Policy Analyst',
    description: 'Briefing lines for meetings or stakeholder engagement.',
    phase: 'phase-6-generation',
    header: 'PRAXIS talking points',
    footer: 'Keep lines source-grounded and audience-appropriate.',
    sections: [
      section('audience', 'Audience', 'Frame the audience and meeting purpose.', 350, 'required'),
      section('headline-points', 'Headline points', 'Draft three to five source-backed lines.', 700, 'required'),
      section('qa', 'Q&A', 'Prepare careful responses.', 800, 'recommended'),
      section('limits', 'Limits', 'Name evidence limits.', 400, 'required'),
      section('closing', 'Closing', 'End with a restrained next step.', 250, 'optional'),
    ],
  },
  {
    id: 'mediation-brief',
    label: 'Mediation brief',
    buyerPath: 'Foreign Policy Analyst',
    description: 'Negotiation support brief that separates positions, interests, and commitments.',
    phase: 'phase-6-generation',
    header: 'PRAXIS mediation brief',
    footer: 'Separate stated positions from inferred interests.',
    sections: [
      section('goal', 'Goal', 'State the immediate mediation objective.', 450, 'required'),
      section('parties', 'Parties', 'Identify parties and roles.', 700, 'required'),
      section('interests', 'Positions vs interests', 'Separate demands from likely interests.', 900, 'required'),
      section('sequence', 'Suggested sequence', 'Propose a practical sequence.', 700, 'recommended'),
      section('risks', 'Risks', 'Name process and implementation risks.', 600, 'required'),
    ],
  },
  {
    id: 'executive-summary',
    label: 'Executive summary',
    buyerPath: 'Corporate Strategic Analyst',
    description: 'Executive summary connecting findings, implications, and recommendation.',
    phase: 'phase-6-generation',
    header: 'PRAXIS executive summary',
    footer: 'Recommendations must preserve assumptions and source posture.',
    sections: [
      section('bottom-line', 'Bottom line', 'State the conclusion and decision relevance.', 450, 'required'),
      section('context', 'Context', 'Summarize the evidence base and scope.', 700, 'required'),
      section('findings', 'Findings', 'List findings with citation posture.', 1000, 'required'),
      section('implications', 'Implications', 'Explain strategic implications.', 800, 'required'),
      section('recommendation', 'Recommendation', 'Recommend a bounded next action.', 550, 'required'),
    ],
  },
];

export function getDraftTemplate(templateId: string | undefined): DraftTemplateShell {
  return DRAFTING_TEMPLATES.find((template) => template.id === templateId) ?? DRAFTING_TEMPLATES[0];
}

export function listDraftTemplates(): DraftTemplateShell[] {
  return DRAFTING_TEMPLATES;
}
