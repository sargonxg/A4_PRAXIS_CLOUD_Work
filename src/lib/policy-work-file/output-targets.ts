export const POLICY_OUTPUT_TARGETS = [
  {
    id: 'policy-memo',
    label: 'Policy memo',
    description: 'A decision-ready policy memo with source posture, options, recommendation, and review gates.',
    outputCapsuleTemplateId: 'principals-decision-memo',
    memoTemplateId: 'policy-memo',
    sourcePosture: 'Cited claims, visible gaps, and sourceability before export-ready use.',
    reviewGate: 'Sourceability required before export-ready state.',
    requiresSourceabilityBeforeExport: true,
    headings: ['Bottom line', 'Decision context', 'Evidence and sourceability', 'Options', 'Recommendation'],
  },
  {
    id: 'briefing-note',
    label: 'Briefing note',
    description: 'A concise briefing note for what changed, why it matters, and what to watch next.',
    outputCapsuleTemplateId: 'country-one-pager',
    memoTemplateId: 'sit-rep',
    sourcePosture: 'Dated source posture, caveats, and next collection needs.',
    reviewGate: 'Freshness and unsupported-claim review before external circulation.',
    requiresSourceabilityBeforeExport: false,
    headings: ['Key points', 'Situation', 'What changed', 'Implications', 'Next actions'],
  },
  {
    id: 'options-memo',
    label: 'Options memo',
    description: 'A structured options memo with tradeoffs, risks, and recommendation posture.',
    outputCapsuleTemplateId: 'options-memo',
    memoTemplateId: 'policy-memo',
    sourcePosture: 'Each option should carry source support, assumptions, and risk caveats.',
    reviewGate: 'Weak evidence and tradeoff claims require review before recommendation.',
    requiresSourceabilityBeforeExport: false,
    headings: ['Decision question', 'Options', 'Tradeoffs', 'Risks', 'Recommendation'],
  },
  {
    id: 'compliance-note',
    label: 'Legal/policy compliance note',
    description: 'A mandate, legal, policy, or compliance note with controlling authority and caveats.',
    outputCapsuleTemplateId: 'legal-mandate-compliance-note',
    memoTemplateId: 'mandate-brief',
    sourcePosture: 'Primary authority, dated posture, and explicit expert-review caveats.',
    reviewGate: 'Sourceability and human review required before compliance findings ship.',
    requiresSourceabilityBeforeExport: true,
    headings: ['Question', 'Controlling authority', 'Compliance posture', 'Caveats and review gates', 'Evidence gaps'],
  },
  {
    id: 'stakeholder-map-brief',
    label: 'Stakeholder or actor map with narrative brief',
    description: 'An actor map plus narrative brief covering incentives, constraints, risks, and options.',
    outputCapsuleTemplateId: 'actor-dossier',
    memoTemplateId: 'frame-analysis',
    sourcePosture: 'Actor claims, relationship assertions, and leverage judgments stay review-gated.',
    reviewGate: 'Inferred actor relationships remain proposals until reviewed.',
    requiresSourceabilityBeforeExport: false,
    headings: ['Actor map', 'Interests and leverage', 'Institutions and rules', 'Risks and tradeoffs', 'Engagement options'],
  },
] as const;

export type PolicyOutputTargetId = (typeof POLICY_OUTPUT_TARGETS)[number]['id'];

export const POLICY_OUTPUT_TARGET_IDS = POLICY_OUTPUT_TARGETS.map((target) => target.id) as [
  PolicyOutputTargetId,
  ...PolicyOutputTargetId[],
];

export const ASK_DOCUMENT_PACK_OUTPUT_TARGET_IDS = [
  'source-note',
  'docx-pdf',
  'handover',
  ...POLICY_OUTPUT_TARGET_IDS,
] as const;

export const PACK_PROVENANCE_OUTPUT_TARGET_IDS = [
  'ask-response',
  ...ASK_DOCUMENT_PACK_OUTPUT_TARGET_IDS,
] as const;

export type AskPersistedDocumentPackOutputTarget = (typeof ASK_DOCUMENT_PACK_OUTPUT_TARGET_IDS)[number];
export type AskPackProvenanceOutputTarget = (typeof PACK_PROVENANCE_OUTPUT_TARGET_IDS)[number];

const LEGACY_OUTPUT_TARGET_ALIASES: Record<string, PolicyOutputTargetId> = {
  memo: 'policy-memo',
  brief: 'briefing-note',
  'ask-response': 'policy-memo',
  'docx-pdf': 'policy-memo',
  handover: 'briefing-note',
  'source-note': 'briefing-note',
  'legal-policy-compliance-note': 'compliance-note',
  'legal-policy-compliance': 'compliance-note',
  'stakeholder-map': 'stakeholder-map-brief',
  'actor-map': 'stakeholder-map-brief',
};

export function policyOutputTargetDefinition(value: string | null | undefined = 'policy-memo') {
  const normalized = normalizePolicyOutputTarget(value);
  return POLICY_OUTPUT_TARGETS.find((target) => target.id === normalized) ?? POLICY_OUTPUT_TARGETS[0]!;
}

export function normalizePolicyOutputTarget(value: string | null | undefined): PolicyOutputTargetId {
  const key = (value ?? '').trim().toLowerCase();
  if (POLICY_OUTPUT_TARGET_IDS.includes(key as PolicyOutputTargetId)) return key as PolicyOutputTargetId;
  return LEGACY_OUTPUT_TARGET_ALIASES[key] ?? 'policy-memo';
}

export function outputTargetLabel(value: string | null | undefined): string {
  return policyOutputTargetDefinition(value).label;
}

export function outputTargetStarterHeadings(value: string | null | undefined): string[] {
  return [...policyOutputTargetDefinition(value).headings];
}

export function outputCapsuleTemplateIdForTarget(value: string | null | undefined): string {
  return policyOutputTargetDefinition(value).outputCapsuleTemplateId;
}

export function outputTargetRequiresSourceability(value: string | null | undefined): boolean {
  return policyOutputTargetDefinition(value).requiresSourceabilityBeforeExport;
}

export function outputTargetReviewGate(value: string | null | undefined) {
  const target = policyOutputTargetDefinition(value);
  return {
    outputTarget: target.id,
    label: target.label,
    reviewGate: target.reviewGate,
    sourcePosture: target.sourcePosture,
    requiresSourceabilityBeforeExport: target.requiresSourceabilityBeforeExport,
    statusLabel: target.requiresSourceabilityBeforeExport ? 'Sourceability required' : 'Review gate ready',
  };
}

export function inferPolicyOutputTargetFromText(text: string): PolicyOutputTargetId {
  const lower = text.toLowerCase();
  if (/\b(option|options|tradeoff|trade-off|recommendation)\b/.test(lower)) return 'options-memo';
  if (/\b(stakeholder|actor map|actor-map|coalition|leverage|incentive)\b/.test(lower)) return 'stakeholder-map-brief';
  if (/\b(compliance|legal|mandate|authority|regulation|statute|policy requirement)\b/.test(lower)) return 'compliance-note';
  if (/\b(briefing|brief|sitrep|sit-rep|what changed|key points)\b/.test(lower)) return 'briefing-note';
  return 'policy-memo';
}

export function starterMarkdownForOutputTarget(value: string | null | undefined, title = 'Untitled policy memo'): string {
  const target = policyOutputTargetDefinition(value);
  return [
    `# ${title || target.label}`,
    '',
    ...target.headings.flatMap((heading, index) => [
      `## ${heading}`,
      index === 0
        ? `Draft the ${heading.toLowerCase()} for this ${target.label.toLowerCase()}. Keep confidence, caveats, and source gaps visible.`
        : 'Add reviewed, source-aware content here.',
      '',
    ]),
  ].join('\n').trim();
}

export function starterHtmlForOutputTarget(value: string | null | undefined, title = 'Untitled policy memo'): string {
  const target = policyOutputTargetDefinition(value);
  const sections = target.headings.map((heading, index) => [
    `<h2>${escapeHtml(heading)}</h2>`,
    `<p>${escapeHtml(index === 0
      ? `Draft the ${heading.toLowerCase()} for this ${target.label.toLowerCase()}. Keep confidence, caveats, and source gaps visible.`
      : 'Add reviewed, source-aware content here.')}</p>`,
  ].join('\n')).join('\n');
  return `<h1>${escapeHtml(title || target.label)}</h1>\n${sections}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) =>
    ch === '&' ? '&amp;'
    : ch === '<' ? '&lt;'
    : ch === '>' ? '&gt;'
    : ch === '"' ? '&quot;'
    : '&#39;');
}
