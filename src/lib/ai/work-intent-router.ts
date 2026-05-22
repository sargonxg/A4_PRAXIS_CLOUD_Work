import type { AskContextReceipt } from '@/lib/ai/ask-conversation';

export type WorkIntentMode =
  | 'policy_memo'
  | 'pdf_report'
  | 'research_brief'
  | 'legal_policy_context'
  | 'stakeholder_map'
  | 'source_pack'
  | 'intellectual_tool'
  | 'expert_capsule'
  | 'general_answer';

export type WorkOutputTarget =
  | 'ask_answer'
  | 'memo_studio'
  | 'pdf_report'
  | 'source_pack'
  | 'capsule_studio'
  | 'canvas';

export type PolicyContextPresetId =
  | 'us_federal'
  | 'us_state'
  | 'eu'
  | 'un_multilateral'
  | 'sector_specific'
  | 'organization_specific'
  | 'custom';

export type UsFederalPolicySubPresetId =
  | 'executive_policy'
  | 'agency_guidance'
  | 'congressional_materials'
  | 'federal_register'
  | 'court_legal_context'
  | 'procurement'
  | 'national_security'
  | 'civil_rights'
  | 'data_privacy'
  | 'ai_governance';

export type PolicySubPresetId = UsFederalPolicySubPresetId | 'ai_governance' | 'sanctions' | 'humanitarian_access';

export interface PolicyContextPreset {
  id: PolicyContextPresetId;
  label: string;
  jurisdiction: string;
  level: 'federal' | 'state' | 'regional' | 'multilateral' | 'sector' | 'organization' | 'custom';
  sourceExpectations: string[];
  defaultReviewGate: string;
  recommendedCapsuleTags: string[];
  recommendedToolTags: string[];
  suggestedNextActions: string[];
  subPresets?: Partial<Record<PolicySubPresetId, PolicyContextSubPreset>>;
}

export interface PolicyContextSubPreset {
  id: PolicySubPresetId;
  label: string;
  sourceExpectations: string[];
  defaultReviewGate: string;
  recommendedCapsuleTags: string[];
  recommendedToolTags: string[];
  suggestedNextActions: string[];
}

export interface PolicyContextResolution {
  presetId: PolicyContextPresetId;
  presetLabel: string;
  jurisdiction: string;
  level: PolicyContextPreset['level'];
  subPresetId: PolicySubPresetId | null;
  subPresetLabel: string | null;
  sourceExpectations: string[];
  defaultReviewGate: string;
  recommendedCapsuleTags: string[];
  recommendedToolTags: string[];
  suggestedNextActions: string[];
  confidence: number;
  matchedSignals: string[];
}

export interface WorkIntentPlan {
  version: 1;
  intent: WorkIntentMode;
  confidence: number;
  outputTarget: WorkOutputTarget;
  activeCapsuleIds: string[];
  recommendedCapsuleIds: string[];
  recommendedTools: string[];
  recommendedMethods: string[];
  humanReviewPosture: {
    required: boolean;
    gate: string;
    reason: string;
  };
  suggestedNextActions: string[];
  policyContext: PolicyContextResolution | null;
  reasons: string[];
}

export interface WorkIntentPlanInput {
  prompt: string;
  activeCapsules?: WorkIntentCapsuleInput[];
  selectedSourceIds?: string[];
  attachedSourceCount?: number;
  explicitMode?: WorkIntentMode | null;
  contextHealth?: AskContextReceipt['health'] | null;
}

export interface WorkIntentCapsuleInput {
  capsuleId: string;
  label?: string | null;
  tags?: string[] | null;
  domain?: string | null;
}

export const POLICY_CONTEXT_PRESETS: PolicyContextPreset[] = [
  {
    id: 'us_federal',
    label: 'U.S. federal',
    jurisdiction: 'United States',
    level: 'federal',
    sourceExpectations: ['Official federal source', 'Agency guidance or rule text', 'Review date and jurisdiction caveat'],
    defaultReviewGate: 'Human policy review required before external use of U.S. federal conclusions.',
    recommendedCapsuleTags: ['us-federal', 'official-source', 'agency-guidance'],
    recommendedToolTags: ['sourceability', 'legal-policy-context', 'memo-drafter'],
    suggestedNextActions: [
      'Attach controlling federal sources before drafting.',
      'Separate legal authority, policy guidance, and implementation judgment.',
      'Run sourceability review before exporting.',
    ],
    subPresets: {
      executive_policy: federalSubPreset('executive_policy', 'Executive policy', ['Executive order, Presidential memorandum, or OMB implementation guidance']),
      agency_guidance: federalSubPreset('agency_guidance', 'Agency guidance', ['Agency guidance, circular, handbook, FAQ, or enforcement statement']),
      congressional_materials: federalSubPreset('congressional_materials', 'Congressional materials', ['Bill text, hearing record, testimony, CRS/committee material, and member statements when relevant']),
      federal_register: federalSubPreset('federal_register', 'Federal Register', ['Federal Register notice, proposed rule, final rule, docket, and comment deadline']),
      court_legal_context: federalSubPreset('court_legal_context', 'Court/legal context', ['Controlling statute, regulation, opinion, injunction posture, and counsel review caveat']),
      procurement: federalSubPreset('procurement', 'Procurement', ['FAR/agency acquisition source, solicitation language, vendor evidence, and evaluation criteria']),
      national_security: federalSubPreset('national_security', 'National security', ['Public national-security source, classification caveat, and operational sensitivity review']),
      civil_rights: federalSubPreset('civil_rights', 'Civil rights', ['Civil-rights statute, agency guidance, affected-group analysis, and enforcement posture']),
      data_privacy: federalSubPreset('data_privacy', 'Data/privacy', ['Privacy Act, agency privacy guidance, data inventory, and disclosure constraints']),
      ai_governance: {
        id: 'ai_governance',
        label: 'AI governance',
        sourceExpectations: [
          'NIST AI RMF or technical-risk source',
          'OMB or agency AI governance guidance',
          'Federal Register, executive policy, procurement, or oversight source when applicable',
        ],
        defaultReviewGate: 'Human AI governance review required before compliance, safety, procurement, or assurance claims.',
        recommendedCapsuleTags: ['us-federal', 'ai-governance', 'nist-ai-rmf', 'omb-ai-guidance', 'federal-register'],
        recommendedToolTags: ['sourceability', 'policy-memo', 'contradiction-finder'],
        suggestedNextActions: [
          'Attach NIST, OMB, agency, or Federal Register source receipts.',
          'Map each AI governance claim to authority, control owner, and unresolved evidence.',
          'Draft with explicit non-certification caveats and review gates.',
        ],
      },
    },
  },
  {
    id: 'us_state',
    label: 'U.S. state',
    jurisdiction: 'United States state or local',
    level: 'state',
    sourceExpectations: ['State statute or rule', 'State agency guidance', 'Local implementation context'],
    defaultReviewGate: 'Human state-policy review required before jurisdiction-specific conclusions.',
    recommendedCapsuleTags: ['us-state', 'state-law', 'agency-guidance'],
    recommendedToolTags: ['sourceability', 'legal-policy-context'],
    suggestedNextActions: ['Name the state and agency.', 'Attach controlling state source text.', 'Flag federal-state conflicts.'],
  },
  {
    id: 'eu',
    label: 'EU',
    jurisdiction: 'European Union',
    level: 'regional',
    sourceExpectations: ['EU regulation or directive', 'Commission guidance', 'Member-state implementation caveat'],
    defaultReviewGate: 'Human EU policy review required before legal or compliance conclusions.',
    recommendedCapsuleTags: ['eu', 'regulation', 'commission-guidance'],
    recommendedToolTags: ['sourceability', 'legal-policy-context', 'policy-memo'],
    suggestedNextActions: ['Attach EU primary text.', 'Separate EU rule from member-state implementation.', 'Run citation repair before export.'],
    subPresets: {
      ai_governance: {
        id: 'ai_governance',
        label: 'AI governance',
        sourceExpectations: ['EU AI Act source', 'Commission implementation guidance', 'Risk-category and enforcement caveats'],
        defaultReviewGate: 'Human EU AI governance review required before compliance or safety claims.',
        recommendedCapsuleTags: ['eu', 'ai-governance', 'ai-act'],
        recommendedToolTags: ['sourceability', 'policy-memo'],
        suggestedNextActions: ['Attach EU AI Act source text.', 'Map risk category and obligations.', 'Flag member-state implementation gaps.'],
      },
    },
  },
  {
    id: 'un_multilateral',
    label: 'UN / multilateral',
    jurisdiction: 'Multilateral',
    level: 'multilateral',
    sourceExpectations: ['UN or multilateral official source', 'Mandate or resolution text', 'Operational caveats'],
    defaultReviewGate: 'Human multilateral policy review required before mandate, sanctions, or humanitarian conclusions.',
    recommendedCapsuleTags: ['un', 'multilateral', 'mandate'],
    recommendedToolTags: ['sourceability', 'mandate-traceback', 'policy-memo'],
    suggestedNextActions: ['Attach resolution, mandate, or official guidance.', 'Separate legal basis from operational judgment.', 'Preserve caveats for external use.'],
    subPresets: {
      sanctions: {
        id: 'sanctions',
        label: 'Sanctions',
        sourceExpectations: ['UN sanctions committee source', 'Security Council resolution or listing source', 'Implementation caveat'],
        defaultReviewGate: 'Human sanctions review required before exposure, listing, or legal-effect claims.',
        recommendedCapsuleTags: ['un-sanctions', 'security-council', 'legal-review'],
        recommendedToolTags: ['sourceability', 'sanctions-check', 'legal-policy-context'],
        suggestedNextActions: ['Attach UN sanctions source receipts.', 'Map entity, regime, listing basis, and implementation caveat.', 'Do not present sanctions conclusions as legal advice.'],
      },
      humanitarian_access: {
        id: 'humanitarian_access',
        label: 'Humanitarian access',
        sourceExpectations: ['OCHA or cluster guidance', 'Operational access source', 'Protection/accountability caveat'],
        defaultReviewGate: 'Human humanitarian review required before operational or legal/accountability conclusions.',
        recommendedCapsuleTags: ['humanitarian-access', 'ocha', 'protection'],
        recommendedToolTags: ['sourceability', 'stakeholder-map', 'policy-memo'],
        suggestedNextActions: ['Attach OCHA and operational access sources.', 'Separate access constraint from rights/accountability claim.', 'Flag data gaps before memo export.'],
      },
    },
  },
  {
    id: 'sector_specific',
    label: 'Sector-specific',
    jurisdiction: 'Sector-specific',
    level: 'sector',
    sourceExpectations: ['Sector regulator or standard', 'Domain data source', 'Applicability caveat'],
    defaultReviewGate: 'Human domain review required before sector-specific conclusions.',
    recommendedCapsuleTags: ['sector-specific', 'standard', 'regulator'],
    recommendedToolTags: ['sourceability', 'domain-review'],
    suggestedNextActions: ['Name the sector and regulator.', 'Attach controlling standard.', 'State applicability limits.'],
  },
  {
    id: 'organization_specific',
    label: 'Organization-specific',
    jurisdiction: 'Organization-specific',
    level: 'organization',
    sourceExpectations: ['Internal policy or authority', 'Approval owner', 'Rollout and affected-group context'],
    defaultReviewGate: 'Human owner approval required before treating organization policy as canonical.',
    recommendedCapsuleTags: ['organization-policy', 'internal-review'],
    recommendedToolTags: ['sourceability', 'stakeholder-map', 'memo-drafter'],
    suggestedNextActions: ['Attach internal policy text.', 'Name approval owner.', 'Identify affected users or teams.'],
  },
  {
    id: 'custom',
    label: 'Custom',
    jurisdiction: 'Custom',
    level: 'custom',
    sourceExpectations: ['User-provided controlling sources', 'Scope and assumptions', 'Review owner'],
    defaultReviewGate: 'Human review required until the custom context has accepted source receipts.',
    recommendedCapsuleTags: ['custom-context', 'review-required'],
    recommendedToolTags: ['sourceability', 'capsule-factory'],
    suggestedNextActions: ['Define the jurisdiction and scope.', 'Attach source receipts.', 'Save as a review-gated custom capsule.'],
  },
];

export function buildWorkIntentPlan(input: WorkIntentPlanInput): WorkIntentPlan {
  const policyContext = resolvePolicyContextPreset({
    prompt: input.prompt,
    capsuleMetadata: input.activeCapsules,
  });
  const intent = selectWorkIntent(input, policyContext);
  const outputTarget = outputTargetFor(intent);
  const sourceCount = (input.selectedSourceIds?.length ?? 0) + (input.attachedSourceCount ?? 0);
  const recommendedCapsuleIds = capsuleRecommendationsFor(intent, policyContext, input.activeCapsules);
  const recommendedTools = toolRecommendationsFor(intent, policyContext);
  const recommendedMethods = methodRecommendationsFor(intent, policyContext);
  const humanReviewPosture = humanReviewFor(intent, policyContext, input.contextHealth ?? null, sourceCount);
  const suggestedNextActions = capThree([
    ...(policyContext?.suggestedNextActions ?? []),
    ...nextActionsFor(intent, sourceCount, input.contextHealth ?? null),
  ]);
  const confidence = confidenceFor(intent, policyContext, input, sourceCount);

  return {
    version: 1,
    intent,
    confidence,
    outputTarget,
    activeCapsuleIds: uniqueStrings((input.activeCapsules ?? []).map((capsule) => capsule.capsuleId)).slice(0, 8),
    recommendedCapsuleIds,
    recommendedTools,
    recommendedMethods,
    humanReviewPosture,
    suggestedNextActions,
    policyContext,
    reasons: compact([
      `intent:${intent}`,
      `output:${outputTarget}`,
      policyContext ? `policy:${policyContext.presetId}${policyContext.subPresetId ? `:${policyContext.subPresetId}` : ''}` : null,
      input.contextHealth ? `context:${input.contextHealth}` : null,
      sourceCount ? `sources:${sourceCount}` : null,
    ]),
  };
}

export function resolvePolicyContextPreset(input: {
  prompt: string;
  capsuleMetadata?: WorkIntentCapsuleInput[];
}): PolicyContextResolution | null {
  const prompt = input.prompt.toLowerCase();
  const capsuleText = (input.capsuleMetadata ?? [])
    .flatMap((capsule) => [capsule.capsuleId, capsule.label ?? '', capsule.domain ?? '', ...(capsule.tags ?? [])])
    .join(' ')
    .toLowerCase();
  const text = `${prompt} ${capsuleText}`;
  const matchedSignals: string[] = [];

  let preset: PolicyContextPreset | null = null;
  if (/\b(u\.s\.|us federal|united states|federal|omb|nist|federal register|congress|agency guidance|executive order|far\b)\b/.test(text)) {
    preset = getPolicyContextPreset('us_federal');
    matchedSignals.push('us-federal');
  } else if (/\b(eu|european union|commission|ai act|gdpr|brussels)\b/.test(text)) {
    preset = getPolicyContextPreset('eu');
    matchedSignals.push('eu');
  } else if (/\b(un|united nations|security council|multilateral|ocha|ohchr|sanctions committee)\b/.test(text)) {
    preset = getPolicyContextPreset('un_multilateral');
    matchedSignals.push('un-multilateral');
  } else if (/\b(state law|state agency|governor|county|municipal)\b/.test(text)) {
    preset = getPolicyContextPreset('us_state');
    matchedSignals.push('us-state');
  } else if (/\b(internal policy|organization|company|workspace|employee handbook)\b/.test(text)) {
    preset = getPolicyContextPreset('organization_specific');
    matchedSignals.push('organization');
  } else if (/\b(sector|industry|regulator|standard)\b/.test(text)) {
    preset = getPolicyContextPreset('sector_specific');
    matchedSignals.push('sector');
  }
  if (!preset) return null;

  const subPresetId = selectSubPresetId(text, preset);
  if (subPresetId) matchedSignals.push(subPresetId);
  const subPreset = subPresetId ? preset.subPresets?.[subPresetId] ?? null : null;

  return {
    presetId: preset.id,
    presetLabel: preset.label,
    jurisdiction: preset.jurisdiction,
    level: preset.level,
    subPresetId: subPreset?.id ?? null,
    subPresetLabel: subPreset?.label ?? null,
    sourceExpectations: [...preset.sourceExpectations, ...(subPreset?.sourceExpectations ?? [])],
    defaultReviewGate: subPreset?.defaultReviewGate ?? preset.defaultReviewGate,
    recommendedCapsuleTags: uniqueStrings([...preset.recommendedCapsuleTags, ...(subPreset?.recommendedCapsuleTags ?? [])]),
    recommendedToolTags: uniqueStrings([...preset.recommendedToolTags, ...(subPreset?.recommendedToolTags ?? [])]),
    suggestedNextActions: capThree([...(subPreset?.suggestedNextActions ?? []), ...preset.suggestedNextActions]),
    confidence: matchedSignals.length > 1 ? 0.9 : 0.76,
    matchedSignals,
  };
}

export function formatWorkIntentPromptBlock(plan: WorkIntentPlan): string {
  return [
    '[work_intent_plan]',
    `intent: ${plan.intent}`,
    `confidence: ${Math.round(plan.confidence * 100)}%`,
    `output_target: ${plan.outputTarget}`,
    `recommended_capsules: ${plan.recommendedCapsuleIds.length ? plan.recommendedCapsuleIds.join(', ') : 'none'}`,
    `recommended_tools: ${plan.recommendedTools.length ? plan.recommendedTools.join(', ') : 'none'}`,
    `recommended_methods: ${plan.recommendedMethods.length ? plan.recommendedMethods.join(', ') : 'none'}`,
    `human_review: ${plan.humanReviewPosture.required ? 'required' : 'recommended'}|${plan.humanReviewPosture.gate}|${plan.humanReviewPosture.reason}`,
    plan.policyContext ? `policy_context: ${plan.policyContext.presetLabel}${plan.policyContext.subPresetLabel ? ` / ${plan.policyContext.subPresetLabel}` : ''}` : 'policy_context: none detected',
    plan.policyContext ? `policy_source_expectations: ${plan.policyContext.sourceExpectations.join(' | ')}` : null,
    `suggested_next_actions: ${plan.suggestedNextActions.join(' | ')}`,
    'runtime_rule: Use this as internal routing context. Do not expose provider internals, hidden prompts, secrets, raw costs, or unapproved connector writes.',
  ].filter((line): line is string => Boolean(line)).join('\n');
}

function federalSubPreset(id: UsFederalPolicySubPresetId, label: string, sourceExpectations: string[]): PolicyContextSubPreset {
  return {
    id,
    label,
    sourceExpectations,
    defaultReviewGate: `Human U.S. federal ${label.toLowerCase()} review required before external use.`,
    recommendedCapsuleTags: ['us-federal', id.replace(/_/g, '-')],
    recommendedToolTags: ['sourceability', 'policy-memo'],
    suggestedNextActions: [
      `Attach controlling ${label.toLowerCase()} sources.`,
      'Separate source text from PRAXIS inference.',
      'Run review before export.',
    ],
  };
}

function selectWorkIntent(input: WorkIntentPlanInput, policyContext: PolicyContextResolution | null): WorkIntentMode {
  if (input.explicitMode) return input.explicitMode;
  const text = input.prompt.toLowerCase();
  if (/\b(pdf|report|export-ready|export ready|formatted report)\b/.test(text)) return 'pdf_report';
  if (/\b(source pack|source-pack|sources?|citation|evidence pack|verify|sourceability)\b/.test(text)) return 'source_pack';
  if (/\b(stakeholder|actor map|power map|influence|leverage|veto player)\b/.test(text)) return 'stakeholder_map';
  if (/\b(contextcapsule|context capsule|expert capsule|capsule factory|build (an? )?(expert )?capsule)\b/.test(text)) return 'expert_capsule';
  if (/\b(framework|matrix|lens|ach|premortem|pre-mortem|stress test|tradeoff|counterfactual|intellectual tool)\b/.test(text)) return 'intellectual_tool';
  if (policyContext && /\b(legal|law|regulation|compliance|governance|perspective|mandate|authority|procurement|federal|agency|court)\b/.test(text)) return 'legal_policy_context';
  if (/\b(memo|options memo|policy memo|recommendation|decision memo)\b/.test(text)) return 'policy_memo';
  if (/\b(research|brief|briefing|latest|current|investigate|multi-source|multi source)\b/.test(text)) return 'research_brief';
  return 'general_answer';
}

function outputTargetFor(intent: WorkIntentMode): WorkOutputTarget {
  switch (intent) {
    case 'policy_memo':
    case 'research_brief':
    case 'legal_policy_context':
      return 'memo_studio';
    case 'pdf_report':
      return 'pdf_report';
    case 'stakeholder_map':
      return 'canvas';
    case 'source_pack':
      return 'source_pack';
    case 'expert_capsule':
      return 'capsule_studio';
    case 'intellectual_tool':
    case 'general_answer':
    default:
      return 'ask_answer';
  }
}

function capsuleRecommendationsFor(
  intent: WorkIntentMode,
  policyContext: PolicyContextResolution | null,
  activeCapsules: WorkIntentCapsuleInput[] = [],
): string[] {
  const ids = activeCapsules.map((capsule) => capsule.capsuleId);
  if (policyContext?.presetId === 'us_federal' && policyContext.subPresetId === 'ai_governance') {
    ids.push('starter-situation-us-federal-ai-governance-baseline', 'starter-tool-sourceability-audit-reviewer', 'starter-output-ai-governance-risk-brief');
  }
  if (policyContext?.presetId === 'un_multilateral' && policyContext.subPresetId === 'sanctions') {
    ids.push('starter-situation-un-sanctions-context', 'starter-tool-legal-mandate-compliance-lens');
  }
  if (policyContext?.subPresetId === 'humanitarian_access') {
    ids.push('starter-situation-humanitarian-access-analysis', 'starter-output-humanitarian-access-brief');
  }
  switch (intent) {
    case 'pdf_report':
      ids.push('starter-output-pdf-policy-memo-style', 'starter-output-evidence-sourceability-annex');
      break;
    case 'policy_memo':
    case 'legal_policy_context':
      ids.push('starter-output-principals-decision-memo', 'starter-tool-legal-mandate-compliance-lens');
      break;
    case 'source_pack':
      ids.push('starter-tool-source-pack-builder', 'starter-output-evidence-sourceability-annex');
      break;
    case 'stakeholder_map':
      ids.push('starter-tool-actor-leverage-veto-map', 'starter-tool-stakeholder-incentive-map');
      break;
    case 'intellectual_tool':
      ids.push('starter-tool-assumption-stress-test', 'starter-tool-policy-tradeoff-ledger');
      break;
    case 'expert_capsule':
      ids.push('starter-tool-source-pack-builder');
      break;
  }
  return uniqueStrings(ids).slice(0, 6);
}

function toolRecommendationsFor(intent: WorkIntentMode, policyContext: PolicyContextResolution | null): string[] {
  const tools = ['context-resolve', 'capsule-evidence-pack'];
  if (policyContext) tools.push('sourceability-reviewer');
  switch (intent) {
    case 'policy_memo':
    case 'research_brief':
    case 'legal_policy_context':
      tools.push('policy-memo', 'grounded-search');
      break;
    case 'pdf_report':
      tools.push('memo-formatter', 'sourceability-reviewer');
      break;
    case 'source_pack':
      tools.push('grounded-search', 'sourceability-reviewer');
      break;
    case 'stakeholder_map':
      tools.push('stakeholder-map', 'graph-proposal');
      break;
    case 'intellectual_tool':
      tools.push('contradiction-finder', 'ach');
      break;
    case 'expert_capsule':
      tools.push('capsule-repository-read', 'capsule-factory');
      break;
  }
  return uniqueStrings(tools).slice(0, 6);
}

function methodRecommendationsFor(intent: WorkIntentMode, policyContext: PolicyContextResolution | null): string[] {
  const methods = policyContext ? ['policy context pass', 'sourceability review'] : ['capsule read'];
  switch (intent) {
    case 'stakeholder_map':
      methods.push('stakeholder power-interest map');
      break;
    case 'intellectual_tool':
      methods.push('assumption stress test');
      break;
    case 'source_pack':
      methods.push('claim-source matrix');
      break;
    case 'pdf_report':
      methods.push('export readiness check');
      break;
    case 'legal_policy_context':
      methods.push('authority and jurisdiction separation');
      break;
    default:
      methods.push('answer with next action');
  }
  return uniqueStrings(methods).slice(0, 4);
}

function humanReviewFor(
  intent: WorkIntentMode,
  policyContext: PolicyContextResolution | null,
  contextHealth: AskContextReceipt['health'] | null,
  sourceCount: number,
): WorkIntentPlan['humanReviewPosture'] {
  const required = Boolean(policyContext)
    || intent !== 'general_answer'
    || contextHealth !== 'ready'
    || sourceCount === 0;
  const gate = intent === 'pdf_report'
    ? 'PDF/export sourceability and human approval gate'
    : policyContext?.defaultReviewGate
      ?? 'Human review recommended before relying on unsupported or externally used claims.';
  const reason = policyContext
    ? `${policyContext.presetLabel}${policyContext.subPresetLabel ? ` ${policyContext.subPresetLabel}` : ''} context can affect legal, policy, or compliance interpretation.`
    : contextHealth !== 'ready'
      ? 'Active capsule context is thin or missing.'
      : sourceCount === 0
        ? 'No source previews are attached.'
        : 'Standard Ask answer review posture.';
  return { required, gate, reason };
}

function nextActionsFor(intent: WorkIntentMode, sourceCount: number, contextHealth: AskContextReceipt['health'] | null): string[] {
  const sourceAction = sourceCount > 0 ? 'Review source previews and mark unsupported claims.' : 'Attach source receipts before hardening factual claims.';
  const contextAction = contextHealth === 'ready' ? 'Use the active capsule as the operating context.' : 'Repair the capsule context before export.';
  switch (intent) {
    case 'policy_memo':
      return ['Draft the memo with evidence gaps visible.', sourceAction, 'Run human review before export.'];
    case 'pdf_report':
      return ['Format as a PDF-ready memo only after citation review.', sourceAction, 'Create an evidence annex before export.'];
    case 'research_brief':
      return ['Run current research and save source receipts.', sourceAction, 'Turn findings into a brief with caveats.'];
    case 'legal_policy_context':
      return ['Separate authority, guidance, facts, and PRAXIS inference.', sourceAction, 'Route conclusions through human review.'];
    case 'stakeholder_map':
      return ['Map actors, incentives, blockers, and veto points.', sourceAction, 'Save graph changes as review proposals only.'];
    case 'source_pack':
      return ['Build a source pack with tiers and dates.', 'Mark gaps before drafting.', 'Promote source additions only after review.'];
    case 'intellectual_tool':
      return ['Run the selected thinking device explicitly.', sourceAction, 'Record assumptions and failure modes.'];
    case 'expert_capsule':
      return ['Create a reviewable capsule improvement proposal.', contextAction, 'Do not promote AI-generated context without acceptance.'];
    case 'general_answer':
    default:
      return [contextAction, sourceAction, 'Suggest the next useful PRAXIS action.'];
  }
}

function confidenceFor(
  intent: WorkIntentMode,
  policyContext: PolicyContextResolution | null,
  input: WorkIntentPlanInput,
  sourceCount: number,
): number {
  if (intent === 'general_answer') return input.contextHealth === 'ready' ? 0.66 : 0.54;
  let confidence = 0.72;
  if (policyContext) confidence += 0.12;
  if (sourceCount > 0) confidence += 0.05;
  if (input.explicitMode) confidence += 0.08;
  if (input.contextHealth === 'missing') confidence -= 0.12;
  if (input.contextHealth === 'thin') confidence -= 0.05;
  return Math.max(0.35, Math.min(0.95, Number(confidence.toFixed(2))));
}

function selectSubPresetId(text: string, preset: PolicyContextPreset): PolicySubPresetId | null {
  if (/\b(ai governance|artificial intelligence|ai act|model risk|nist ai|ai rmf|algorithm|automated decision|omb.*ai|federal.*ai)\b/.test(text)) {
    return preset.subPresets?.ai_governance ? 'ai_governance' : null;
  }
  if (preset.id === 'us_federal') {
    if (/\b(executive order|white house|presidential|omb)\b/.test(text)) return 'executive_policy';
    if (/\b(agency|guidance|circular|faq)\b/.test(text)) return 'agency_guidance';
    if (/\b(congress|hearing|testimony|committee|bill)\b/.test(text)) return 'congressional_materials';
    if (/\b(federal register|notice|proposed rule|final rule|docket)\b/.test(text)) return 'federal_register';
    if (/\b(court|legal|statute|injunction|case law)\b/.test(text)) return 'court_legal_context';
    if (/\b(procurement|acquisition|far|vendor|solicitation)\b/.test(text)) return 'procurement';
    if (/\b(national security|classified|defense|intelligence)\b/.test(text)) return 'national_security';
    if (/\b(civil rights|discrimination|equity|eeoc)\b/.test(text)) return 'civil_rights';
    if (/\b(data privacy|privacy act|personal data|pii)\b/.test(text)) return 'data_privacy';
  }
  if (preset.id === 'un_multilateral') {
    if (/\b(sanctions|security council|committee|listing)\b/.test(text)) return 'sanctions';
    if (/\b(humanitarian access|ocha|relief access|protection)\b/.test(text)) return 'humanitarian_access';
  }
  return null;
}

function getPolicyContextPreset(id: PolicyContextPresetId): PolicyContextPreset {
  const preset = POLICY_CONTEXT_PRESETS.find((item) => item.id === id);
  if (!preset) throw new Error(`Missing policy context preset ${id}`);
  return preset;
}

function capThree(values: string[]): string[] {
  return uniqueStrings(values.filter((value) => value.trim().length > 0)).slice(0, 3);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function compact(values: Array<string | null | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value));
}
