import type { AnalystProfile, Audience, Language, AnalyticalStyle } from '@/types/analyst-profile';
import type { Situation } from '@/types/situation';
import type { DomainId, MergedDomainConfig } from '@/types/domain';
import type { MergedPathConfig } from '@/lib/path/types';
import type { Episode } from '@/types/episode';
import type { UserPreferences } from '@/types/preferences';
import type { InteractionFrame } from '@/types/interaction';
import type { AdvisorFrame } from '@/types/advisor';

export interface RetrievedChunk {
  id: string;
  text: string;
  source: string;
  score?: number;
}

export interface CapsuleFrameSourceReceipt {
  sourceId: string;
  label: string;
  url?: string | null;
  date?: string | null;
  reliabilityTier?: number | null;
}

export interface CapsuleFrameClaim {
  claimId: string;
  text: string;
  support: string;
  receipts: CapsuleFrameSourceReceipt[];
}

export interface CapsuleFrameOntologyBinding {
  domainId: string;
  taxonomyPath: string[];
  ontologyIds: string[];
  acoPrimitives: string[];
  bindingRationale?: string | null;
}

export interface CapsuleFrameValidityWindow {
  asOf?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface CapsuleFrameAgentOperatingContract {
  allowedActions: string[];
  forbiddenActions: string[];
  sourceRequirements: string[];
  reviewCheckpoints: string[];
  toolRecommendations: string[];
  bestNextAction?: string | null;
  handoffInstructions: string[];
  stopConditions: string[];
}

export interface CapsulePromptFrame {
  capsuleId: string;
  label: string;
  role: 'primary' | 'reference' | 'comparison';
  version: number | null;
  order: number;
  ontologyBinding: CapsuleFrameOntologyBinding | null;
  validityWindow: CapsuleFrameValidityWindow | null;
  claims: CapsuleFrameClaim[];
  agentOperatingContract: CapsuleFrameAgentOperatingContract | null;
}

function escapeTag(str: string): string {
  return String(str ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface OutputConstraints {
  language: Language;
  audienceTone: Audience;
  redLineClauses: string[];
  styleHint: AnalyticalStyle;
}

export function renderOutputConstraints(profile: AnalystProfile): OutputConstraints {
  return {
    language: profile.workingStyle.language,
    audienceTone: profile.perspective.audience,
    redLineClauses: profile.workingStyle.redLines.filter(Boolean),
    styleHint: profile.workingStyle.analyticalStyle,
  };
}

export function renderSystemPromptBlock(opts: {
  profile: AnalystProfile | null;
  situation: Situation | null;
  retrievedChunks: RetrievedChunk[];
  domain?: MergedDomainConfig | null;
  path?: MergedPathConfig | null;
  domainPosture?: DomainId[];
  toolId?: string;
  episodes?: Episode[];
  preferences?: UserPreferences;
  interaction?: InteractionFrame | null;
  advisor?: AdvisorFrame | null;
  capsuleFrames?: CapsulePromptFrame[];
}): string {
  const parts: string[] = [];

  parts.push(renderProfileBlock(opts.profile, domainPostureFor(opts.domainPosture, opts.domain)));
  parts.push(renderSituationBlock(opts.situation));
  const capsuleFrameBlock = renderCapsuleFrameBlock(opts.capsuleFrames);
  if (capsuleFrameBlock) parts.push(capsuleFrameBlock);
  if (opts.domain && opts.domain.id !== 'generic') {
    parts.push(renderDomainBlock(opts.domain, opts.toolId));
  }
  if (opts.path) {
    parts.push(renderPathBlock(opts.path, opts.toolId));
  }
  const episodesBlock = renderEpisodesBlock(opts.episodes);
  if (episodesBlock) parts.push(episodesBlock);
  const interactionBlock = renderInteractionBlock(opts.interaction);
  if (interactionBlock) parts.push(interactionBlock);
  const advisorBlock = renderAdvisorBlock(opts.advisor);
  if (advisorBlock) parts.push(advisorBlock);
  if (opts.retrievedChunks.length > 0) {
    parts.push(renderKnowledgeBlock(opts.retrievedChunks));
  }
  parts.push(renderConstraintsBlock(opts.profile));
  if (opts.preferences) {
    parts.push(renderPreferencesBlock(opts.preferences));
  }

  return parts.join('\n\n');
}

function renderCapsuleFrameBlock(frames: CapsulePromptFrame[] | undefined): string {
  const activeFrames = (frames ?? []).slice(0, 6);
  if (!activeFrames.length) return '';
  return [
    `<capsule-frame count="${activeFrames.length}" merge="primary-first">`,
    '  merge_precedence: primary capsule governs; reference capsules fill gaps in explicit order; comparison capsules remain labeled context; duplicate capsule ids use the first occurrence.',
    ...activeFrames.flatMap(renderSingleCapsuleFrame),
    '</capsule-frame>',
  ].join('\n');
}

function renderSingleCapsuleFrame(frame: CapsulePromptFrame): string[] {
  const ontology = frame.ontologyBinding;
  const validity = frame.validityWindow;
  const contract = frame.agentOperatingContract;
  const claims = frame.claims.slice(0, 8);
  return [
    `  <capsule id="${escapeTag(frame.capsuleId)}" role="${frame.role}" version="${frame.version ?? 'unknown'}" order="${frame.order}" label="${escapeTag(frame.label)}">`,
    ontology
      ? `    ontology: domain=${escapeTag(ontology.domainId)}; taxonomy=${escapeTag(ontology.taxonomyPath.join(' > ') || 'none')}; ontology_ids=${escapeTag(ontology.ontologyIds.join(', ') || 'none')}; aco=${escapeTag(ontology.acoPrimitives.join(', ') || 'none')}`
      : '    ontology: none declared',
    ontology?.bindingRationale ? `    ontology_rationale: ${escapeTag(ontology.bindingRationale)}` : '',
    `    validity: asOf=${escapeTag(validity?.asOf ?? 'unknown')}; validFrom=${escapeTag(validity?.validFrom ?? 'open')}; validUntil=${escapeTag(validity?.validUntil ?? 'open')}`,
    '    top_claims:',
    ...(claims.length
      ? claims.flatMap(renderCapsuleClaim)
      : ['      - none declared']),
    '    agent_contract:',
    contract ? `      allowed_actions: ${formatList(contract.allowedActions)}` : '      allowed_actions: none',
    contract ? `      forbidden_actions: ${formatList(contract.forbiddenActions)}` : '      forbidden_actions: none',
    contract ? `      source_requirements: ${formatList(contract.sourceRequirements)}` : '      source_requirements: none',
    contract ? `      review_checkpoints: ${formatList(contract.reviewCheckpoints)}` : '      review_checkpoints: none',
    contract ? `      tool_recommendations: ${formatList(contract.toolRecommendations)}` : '      tool_recommendations: none',
    contract?.bestNextAction ? `      best_next_action: ${escapeTag(contract.bestNextAction)}` : '',
    contract ? `      handoff: ${formatList(contract.handoffInstructions)}` : '      handoff: none',
    contract ? `      stop_conditions: ${formatList(contract.stopConditions)}` : '      stop_conditions: none',
    '  </capsule>',
  ].filter((line) => line.length > 0);
}

function renderCapsuleClaim(claim: CapsuleFrameClaim): string[] {
  const receipts = claim.receipts.slice(0, 4).map((receipt) => {
    const parts = [
      receipt.sourceId,
      receipt.label,
      receipt.url ?? '',
      receipt.date ? `date=${receipt.date}` : '',
      typeof receipt.reliabilityTier === 'number' ? `tier=${receipt.reliabilityTier}` : '',
    ].filter(Boolean);
    return parts.map(escapeTag).join(' ');
  });
  return [
    `      - [${escapeTag(claim.claimId)}] ${escapeTag(claim.support)}: ${escapeTag(claim.text)}`,
    `        receipts: ${receipts.length ? receipts.join('; ') : 'none'}`,
  ];
}

function formatList(values: string[]): string {
  return values.length ? values.map(escapeTag).join(', ') : 'none';
}

function renderProfileBlock(p: AnalystProfile | null, domainPosture: DomainId[]): string {
  if (!p) {
    return [
      '<analyst-profile version="0">',
      '  No profile set — respond in neutral analytical register, English.',
      `  domainPosture: ${domainPosture.join(', ') || 'generic'}`,
      '  redLines: []',
      '</analyst-profile>',
    ].join('\n');
  }
  const v = p.meta?.version ?? 0;
  const lensLine = p.perspective.lenses.length > 1
    ? `Primary lens: ${p.perspective.lenses[0]}. Secondary: ${p.perspective.lenses.slice(1).join(', ')}.`
    : `Primary lens: ${p.perspective.lenses[0] ?? 'diplomatic'}.`;
  return [
    `<analyst-profile version="${v}">`,
    `  Role: ${p.identity.seniority} ${p.identity.role} at ${escapeTag(p.identity.org || '—')} · ${escapeTag(p.identity.team || '—')}`,
    `  Mandate: ${escapeTag(p.perspective.mandate || '—')}`,
    `  ${lensLine}`,
    `  Regions of focus: ${p.perspective.regions.map(escapeTag).join(', ') || '—'}`,
    `  Audience: ${p.perspective.audience}`,
    `  Output language: ${p.workingStyle.language}`,
    `  Preferred style: ${p.workingStyle.analyticalStyle}`,
    `  domainPosture: ${domainPosture.join(', ') || 'generic'}`,
    `  redLines: ${JSON.stringify(p.workingStyle.redLines.filter(Boolean))}`,
    `  Red lines:`,
    ...(p.workingStyle.redLines.length
      ? p.workingStyle.redLines.map(r => `    - ${escapeTag(r)}`)
      : ['    (none specified)']),
    `</analyst-profile>`,
  ].join('\n');
}

function domainPostureFor(input: DomainId[] | undefined, domain?: MergedDomainConfig | null): DomainId[] {
  const values: DomainId[] = input?.length ? input : domain?.id ? [domain.id] : ['generic'];
  return Array.from(new Set(values));
}

function renderSituationBlock(s: Situation | null): string {
  if (!s) return ['<situation-frame>', '  No active situation.', '</situation-frame>'].join('\n');
  const sourceUrls = (s.sourceUrls ?? []).filter(Boolean).slice(0, 8);
  const customSources = (s.customSources ?? []).filter((source) => source.url).slice(0, 8);
  const notes = s.contextNotes?.trim();
  const description = s.description?.trim();
  return [
    '<situation-frame>',
    `  Id: ${escapeTag(s.id)}`,
    `  Name: ${escapeTag(s.name)}`,
    `  Type: ${s.type}`,
    `  Status: ${s.status}`,
    `  Region: ${escapeTag(s.region || '—')}`,
    `  Key actors: ${(s.actors ?? []).map(escapeTag).join(', ') || '—'}`,
    `  Risk: ${s.riskScore ?? '—'}/10 · Glasl ${s.glaslStage ?? '—'} · ${escapeTag(s.escalationTrend ?? '—')}`,
    `  Domain: ${escapeTag(s.domain ?? 'generic')} (${typeof s.domainConfidence === 'number' ? Math.round(s.domainConfidence * 100) + '%' : 'unknown confidence'})`,
    `  Workflow path: ${escapeTag(s.workflowPathLabel ?? s.workflowPath ?? 'not selected')}`,
    `  Context inventory: ${s.actorCount ?? s.actors?.length ?? 0} actors · ${s.graphEntities ?? 0} graph entities · ${s.documentCount ?? 0} documents · ${sourceUrls.length + customSources.length} source URLs`,
    description ? `  Description: ${escapeTag(description.slice(0, 1400))}` : '  Description: —',
    notes ? `  Analyst context notes: ${escapeTag(notes.slice(0, 1600))}` : '',
    sourceUrls.length ? '  Analyst-provided source URLs:' : '',
    ...sourceUrls.map((url, index) => `    [${index + 1}] ${escapeTag(url)}`),
    customSources.length ? '  Custom sources:' : '',
    ...customSources.map((source, index) => `    [${index + 1}] ${escapeTag(source.name || source.url)} — ${escapeTag(source.url)}`),
    s.dateRangeFrom || s.dateRangeTo
      ? `  Situation time window: ${escapeTag(s.dateRangeFrom ?? 'open')} to ${escapeTag(s.dateRangeTo ?? 'open')}`
      : '',
    s.languageOverride ? `  Situation language override: ${escapeTag(s.languageOverride)}` : '',
    '</situation-frame>',
  ].filter((line) => line.length > 0).join('\n');
}

function renderDomainBlock(domain: MergedDomainConfig, toolId?: string): string {
  const topFrameworks = domain.frameworks.slice(0, 3);
  const overridePrompt = toolId ? domain.promptOverrides?.[toolId] : undefined;
  return [
    `<domain-frame id="${escapeTag(domain.id)}" version="${domain.version}">`,
    `  Domain: ${escapeTag(domain.name)}`,
    `  ${escapeTag(domain.description)}`,
    topFrameworks.length > 0
      ? `  Preferred frameworks for this domain: ${topFrameworks.map(escapeTag).join(', ')}`
      : '  Preferred frameworks: analyst choice.',
    overridePrompt ? `  Domain-specific guidance:\n    ${escapeTag(overridePrompt)}` : '',
    '</domain-frame>',
  ]
    .filter((l) => l.length > 0)
    .join('\n');
}

function renderPathBlock(path: MergedPathConfig, toolId?: string): string {
  const overridePrompt = toolId ? path.promptOverrides?.[toolId] : undefined;
  return [
    `<path-frame id="${escapeTag(path.id)}" domain="${escapeTag(path.domainId)}" version="${path.version}">`,
    `  Path: ${escapeTag(path.name)}`,
    `  Time horizon: ${escapeTag(path.timeHorizonDefault)}`,
    `  Tool bundle: ${path.toolBundle.map(escapeTag).join(', ')}`,
    `  Lens top 3: ${path.lensTop3.map(escapeTag).join(', ')}`,
    `  Framework path: ${path.frameworkPath.map(escapeTag).join(' -> ')}`,
    `  Audience default: ${escapeTag(path.audienceDefault)}`,
    `  Source mix: ${path.sourceMix.map((item) => `${escapeTag(item.feed)}:${item.weight}`).join(', ')}`,
    `  Prompt voice: tone=${escapeTag(path.promptVoice.tone)}; hedging=${escapeTag(path.promptVoice.hedging)}; citations=${escapeTag(path.promptVoice.citationStyle)}; jargon=${escapeTag(path.promptVoice.jargonLevel)}`,
    `  Output defaults: format=${escapeTag(path.outputDefaults.format)}; length=${escapeTag(path.outputDefaults.length)}; footnotes=${escapeTag(path.outputDefaults.footnoteStyle)}`,
    `  Mandatory context cores: ${path.contextRecipe.map(escapeTag).join(', ')}`,
    overridePrompt ? `  Path-specific guidance:\n    ${escapeTag(overridePrompt)}` : '',
    '</path-frame>',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Renders the <situation-episodes> section for injection into the system
 * prompt. Returns an empty string if there are no non-deleted episodes.
 *
 * Rules (spec §6):
 *  - Only consider episodes with deletedAt === null.
 *  - Cap to the top 8 by importance (desc), tie-break by date (asc).
 *  - Each episode rendered on a single line: `[N] YYYY-MM "title" — actors: a,b. Importance X/5. Description (≤160 chars).`
 */
function renderEpisodesBlock(episodes: Episode[] | undefined): string {
  if (!episodes || episodes.length === 0) return '';
  const live = episodes.filter((e) => !e.deletedAt);
  if (live.length === 0) return '';

  const top = [...live]
    .sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    })
    .slice(0, 8);

  const lines = top.map((e, idx) => {
    const n = idx + 1;
    const dateShort = e.date ? e.date.slice(0, 7) : '—';
    const actorList = e.actors.length > 0 ? e.actors.map(escapeTag).join(',') : '—';
    const desc = e.description.length > 160
      ? `${e.description.slice(0, 157)}...`
      : e.description;
    return `  [${n}] ${escapeTag(dateShort)} "${escapeTag(e.title)}" — actors: ${actorList}. Importance ${e.importance}/5. ${escapeTag(desc)}`;
  });

  return [
    `<situation-episodes count="${live.length}">`,
    ...lines,
    '</situation-episodes>',
  ].join('\n');
}

function renderKnowledgeBlock(chunks: RetrievedChunk[]): string {
  return [
    '<retrieved-knowledge>',
    ...chunks.map(c => `  [${escapeTag(c.id)}] ${escapeTag(c.text.slice(0, 500))} — ${escapeTag(c.source)}`),
    '</retrieved-knowledge>',
  ].join('\n');
}

function renderInteractionBlock(frame: InteractionFrame | null | undefined): string {
  if (!frame) return '';
  const recent = frame.recentTools.slice(0, 6);
  const lines = recent.length
    ? recent.map((tool) => (
        `  - ${escapeTag(tool.toolId)} at ${escapeTag(tool.ranAt)}: ${escapeTag(tool.summary.slice(0, 180))}`
      ))
    : ['  - No recent tool runs in this situation.'];
  return [
    '<interaction-frame>',
    `  Active draft situations: ${frame.activeSituationDrafts}`,
    '  Recent tools:',
    ...lines,
    '</interaction-frame>',
  ].join('\n');
}

function renderAdvisorBlock(frame: AdvisorFrame | null | undefined): string {
  if (!frame) return '';
  return [
    `<advisor-frame id="${escapeTag(frame.advisorId)}">`,
    `  Last turn: ${escapeTag(frame.lastTurnAt)}`,
    `  Rolling summary: ${escapeTag(frame.rollingSummary.slice(0, 1000) || 'No prior turns.')}`,
    '</advisor-frame>',
  ].join('\n');
}

function renderConstraintsBlock(p: AnalystProfile | null): string {
  const lang = p?.workingStyle.language ?? 'en';
  const tone = p?.perspective.audience ?? 'myself';
  const style = p?.workingStyle.analyticalStyle ?? 'rapid_brief';
  const redLines = p?.workingStyle.redLines ?? [];
  return [
    '<output-constraints>',
    `  - Respond in ${lang}.`,
    `  - Tone: ${tone} register.`,
    ...redLines.map(r => `  - Constraint: ${escapeTag(r)}`),
    `  - ${style === 'deep_dive' ? 'Favor depth, caveats, and citations.' : 'Favor brevity and actionable bullets.'}`,
    '</output-constraints>',
  ].join('\n');
}

function renderPreferencesBlock(p: UserPreferences): string {
  return [
    '<preferences>',
    `  <citations>${escapeTag(p.citationStyle)}</citations>`,
    `  <length>${escapeTag(p.defaultReportLength)}</length>`,
    `  <language>${escapeTag(p.defaultLanguage)}</language>`,
    `  <confidence>${escapeTag(p.confidenceLabelling)}</confidence>`,
    `  <time-horizon>${escapeTag(p.defaultTimeHorizon)}</time-horizon>`,
    '</preferences>',
  ].join('\n');
}
