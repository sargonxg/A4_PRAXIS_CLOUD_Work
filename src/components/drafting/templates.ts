export type DraftingOutputTargetId =
  | 'brief'
  | 'memo'
  | 'sitrep'
  | 'talking-points'
  | 'decision-memo';

export interface DraftingTemplate {
  id: DraftingOutputTargetId;
  label: string;
  headings: string[];
  qualityGate: string;
  requiresSourceabilityBeforeExport: boolean;
  starterMarkdown: string;
}

export const DRAFTING_OUTPUT_TARGETS: Array<{ id: DraftingOutputTargetId; label: string }> = [
  { id: 'brief', label: 'Brief' },
  { id: 'memo', label: 'Policy memo' },
  { id: 'sitrep', label: 'SITREP' },
  { id: 'talking-points', label: 'Talking points' },
  { id: 'decision-memo', label: 'Decision memo' },
];

const TEMPLATES: Record<DraftingOutputTargetId, Omit<DraftingTemplate, 'id'>> = {
  brief: {
    label: 'Brief',
    headings: ['Bottom Line', 'Context', 'Evidence', 'Risks', 'Open Questions'],
    qualityGate: 'Every factual paragraph should carry at least one source card or an explicit gap.',
    requiresSourceabilityBeforeExport: false,
    starterMarkdown: [
      '# Brief',
      '',
      '## Bottom Line',
      '',
      '## Context',
      '',
      '## Evidence',
      '',
      '## Risks',
      '',
      '## Open Questions',
    ].join('\n'),
  },
  memo: {
    label: 'Policy memo',
    headings: ['Question Presented', 'Recommendation', 'Analysis', 'Sourceability Notes', 'Next Actions'],
    qualityGate: 'Run sourceability before export-ready state.',
    requiresSourceabilityBeforeExport: true,
    starterMarkdown: [
      '# Policy Memo',
      '',
      '## Question Presented',
      '',
      '## Recommendation',
      '',
      '## Analysis',
      '',
      '## Sourceability Notes',
      '',
      '## Next Actions',
    ].join('\n'),
  },
  sitrep: {
    label: 'SITREP',
    headings: ['Latest Developments', 'Actors', 'Humanitarian / Political Effects', 'Outlook', 'Source Gaps'],
    qualityGate: 'Date-sensitive claims must be checked against current source receipts.',
    requiresSourceabilityBeforeExport: false,
    starterMarkdown: [
      '# SITREP',
      '',
      '## Latest Developments',
      '',
      '## Actors',
      '',
      '## Humanitarian / Political Effects',
      '',
      '## Outlook',
      '',
      '## Source Gaps',
    ].join('\n'),
  },
  'talking-points': {
    label: 'Talking points',
    headings: ['Opening Line', 'Key Points', 'Evidence Anchors', 'Questions To Expect', 'Do Not Overstate'],
    qualityGate: 'Claims should be phrased for oral use and tied to evidence anchors.',
    requiresSourceabilityBeforeExport: false,
    starterMarkdown: [
      '# Talking Points',
      '',
      '## Opening Line',
      '',
      '## Key Points',
      '',
      '## Evidence Anchors',
      '',
      '## Questions To Expect',
      '',
      '## Do Not Overstate',
    ].join('\n'),
  },
  'decision-memo': {
    label: 'Decision memo',
    headings: ['Decision Needed', 'Options', 'Tradeoffs', 'Recommendation', 'Implementation Watchpoints'],
    qualityGate: 'Options and tradeoffs must distinguish evidence, judgment, and assumptions.',
    requiresSourceabilityBeforeExport: true,
    starterMarkdown: [
      '# Decision Memo',
      '',
      '## Decision Needed',
      '',
      '## Options',
      '',
      '## Tradeoffs',
      '',
      '## Recommendation',
      '',
      '## Implementation Watchpoints',
    ].join('\n'),
  },
};

export function buildDraftingTemplate(target: DraftingOutputTargetId): DraftingTemplate {
  const template = TEMPLATES[target] ?? TEMPLATES.brief;
  return { id: target, ...template };
}
