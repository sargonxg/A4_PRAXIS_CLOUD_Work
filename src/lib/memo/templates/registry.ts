import type { CaseModule } from '@/types/case-module';
import type { MemoBlock, MemoTemplate, MemoTemplateId } from '@/types/memo';

export const MEMO_TEMPLATES: MemoTemplate[] = [
  {
    id: 'mandate-brief',
    label: 'Mandate brief',
    description: 'A diplomatic mandate note covering authority, scope, recent action, risks, and recommendations.',
    recommendedFor: [{ persona: 'Diplomat', ontologyId: 'governance' }],
    sectionStructure: [
      { id: 'origins', title: 'Origins', description: 'Mandate roots and authority basis.', required: true },
      { id: 'scope', title: 'Current scope', description: 'Active mandate and constraints.', required: true },
      { id: 'recommendations', title: 'Recommendations', description: 'Decision-ready advice.', required: true },
    ],
  },
  {
    id: 'mediation-summary',
    label: 'Mediation summary',
    description: 'A session-ready summary of parties, positions, interests, possible packages, and next steps.',
    recommendedFor: [{ persona: 'Mediator', ontologyId: 'mediation' }],
    sectionStructure: [
      { id: 'parties', title: 'Parties', description: 'Parties and roles.', required: true },
      { id: 'positions', title: 'Positions and interests', description: 'Demands separated from underlying interests.', required: true },
      { id: 'next-steps', title: 'Next steps', description: 'Process actions and commitments.', required: true },
    ],
  },
  {
    id: 'policy-memo',
    label: 'Policy memo',
    description: 'A concise situation, complication, insight, recommendation memo for principals.',
    recommendedFor: [{ persona: 'Analyst' }],
    sectionStructure: [
      { id: 'situation', title: 'Situation', description: 'Current state and evidence base.', required: true },
      { id: 'complication', title: 'Complication', description: 'Escalation, contradiction, or constraint.', required: true },
      { id: 'recommendation', title: 'Recommendation', description: 'Recommended action.', required: true },
    ],
  },
  {
    id: 'sit-rep',
    label: 'Sit-rep',
    description: 'A dated situational report for conflict or crisis monitoring.',
    recommendedFor: [{ persona: 'Diplomat', ontologyId: 'conflict' }, { persona: 'Analyst', ontologyId: 'conflict' }],
    sectionStructure: [
      { id: 'headline', title: 'Headline', description: 'Single-sentence update.', required: true },
      { id: 'events', title: 'Recent events', description: 'Recent events ordered by time.', required: true },
      { id: 'watchpoints', title: 'Watchpoints', description: 'What to monitor next.', required: true },
    ],
  },
  {
    id: 'frame-analysis',
    label: 'Frame analysis',
    description: 'A narrative-analysis report covering frames, messengers, audiences, and implications.',
    recommendedFor: [{ persona: 'Researcher', ontologyId: 'narrative' }],
    sectionStructure: [
      { id: 'frames', title: 'Frames active', description: 'Dominant frames and claims.', required: true },
      { id: 'amplifiers', title: 'Amplifiers', description: 'Outlets and messengers.', required: true },
      { id: 'implications', title: 'Implications', description: 'Decision relevance.', required: true },
    ],
  },
  {
    id: 'talking-points',
    label: 'Talking points',
    description: 'A bullet-only diplomatic prep note for meetings or press lines.',
    recommendedFor: [{ persona: 'Diplomat' }],
    sectionStructure: [
      { id: 'context', title: 'Meeting context', description: 'Purpose and audience.', required: true },
      { id: 'messages', title: 'Key messages', description: 'Three to five lines to take.', required: true },
      { id: 'if-pressed', title: 'If pressed', description: 'Fallback lines.', required: false },
    ],
  },
];

export function listMemoTemplates(): MemoTemplate[] {
  return MEMO_TEMPLATES;
}

export function getMemoTemplate(id: MemoTemplateId): MemoTemplate {
  const template = MEMO_TEMPLATES.find((item) => item.id === id);
  if (!template) throw new Error(`Unknown memo template: ${id}`);
  return template;
}

export function buildMemoBlocksForCase(caseModule: CaseModule, templateId: MemoTemplateId): MemoBlock[] {
  const template = getMemoTemplate(templateId);
  const sourceIds = caseModule.sources.slice(0, 5).map((source) => source.receiptId);
  const actors = caseModule.situation.actors.slice(0, 5);
  const now = new Date().toISOString();

  const heading = (id: string, content: string): MemoBlock => ({
    id,
    type: 'heading',
    content,
    citations: [],
    metadata: { generatedAt: now },
  });

  const paragraph = (id: string, content: string): MemoBlock => ({
    id,
    type: 'paragraph',
    content,
    citations: [{ nodeIds: [], sourceReceiptIds: sourceIds, surface: 'footnote' }],
    metadata: { generatedAt: now },
  });

  const bullets = (id: string, title: string, items: string[]): MemoBlock => ({
    id,
    type: 'bullets',
    title,
    content: '',
    items,
    citations: [{ nodeIds: [], sourceReceiptIds: sourceIds, surface: 'footnote' }],
    metadata: { generatedAt: now },
  });

  const common = [
    heading('title', `${template.label}: ${caseModule.manifest.name}`),
    paragraph('basis', `${caseModule.manifest.summary} Source, claim, evidence, and verdict layers are available for citation review before export.`),
    bullets('actors', 'Actors involved', actors.length ? actors : ['No actors have been added to this case yet.']),
  ];

  if (templateId === 'talking-points') {
    return [
      ...common,
      bullets('key-messages', 'Key messages', ['Maintain evidence discipline.', 'Name uncertainty clearly.', 'Tie every line to a source or graph claim.']),
      bullets('if-pressed', 'If pressed', ['Offer to provide a sourced annex.', 'Do not overstate unresolved claims.']),
    ];
  }

  if (templateId === 'sit-rep') {
    return [
      ...common,
      paragraph('as-of', `As of ${new Date(caseModule.situation.updatedAt).toLocaleDateString()}, risk is ${Math.round(caseModule.situation.riskScore * 10)} with GLASL stage ${caseModule.situation.glaslStage ?? 'not set'}.`),
      bullets('watchpoints', 'Watchpoints', ['Source freshness', 'Contradictions in claims', 'Changes in leverage or commitments']),
    ];
  }

  return [
    ...common,
    paragraph('analysis', `This memo starts from ${caseModule.truthLayers.claim.nodeCount} claim nodes, ${caseModule.truthLayers.evidence.nodeCount} evidence nodes, and ${caseModule.truthLayers.verdict.nodeCount} verdict nodes.`),
    paragraph('recommendation', 'Draft recommendation: identify the decision, name the uncertainty, and preserve citation links before distribution.'),
  ];
}
