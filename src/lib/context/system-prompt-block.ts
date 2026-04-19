import type { AnalystProfile, Audience, Language, AnalyticalStyle } from '@/types/analyst-profile';
import type { Situation } from '@/types/situation';
import type { MergedDomainConfig } from '@/types/domain';
import type { Episode } from '@/types/episode';

export interface RetrievedChunk {
  id: string;
  text: string;
  source: string;
  score?: number;
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
  toolId?: string;
  episodes?: Episode[];
}): string {
  const parts: string[] = [];

  parts.push(renderProfileBlock(opts.profile));
  parts.push(renderSituationBlock(opts.situation));
  if (opts.domain && opts.domain.id !== 'generic') {
    parts.push(renderDomainBlock(opts.domain, opts.toolId));
  }
  const episodesBlock = renderEpisodesBlock(opts.episodes);
  if (episodesBlock) parts.push(episodesBlock);
  if (opts.retrievedChunks.length > 0) {
    parts.push(renderKnowledgeBlock(opts.retrievedChunks));
  }
  parts.push(renderConstraintsBlock(opts.profile));

  return parts.join('\n\n');
}

function renderProfileBlock(p: AnalystProfile | null): string {
  if (!p) {
    return [
      '<analyst-profile version="0">',
      '  No profile set — respond in neutral analytical register, English.',
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
    `  Red lines:`,
    ...(p.workingStyle.redLines.length
      ? p.workingStyle.redLines.map(r => `    - ${escapeTag(r)}`)
      : ['    (none specified)']),
    `</analyst-profile>`,
  ].join('\n');
}

function renderSituationBlock(s: Situation | null): string {
  if (!s) return ['<situation-frame>', '  No active situation.', '</situation-frame>'].join('\n');
  return [
    '<situation-frame>',
    `  Name: ${escapeTag(s.name)}`,
    `  Type: ${s.type}`,
    `  Region: ${escapeTag(s.region || '—')}`,
    `  Key actors: ${(s.actors ?? []).map(escapeTag).join(', ') || '—'}`,
    `  Risk: ${s.riskScore ?? '—'}/10 · Glasl ${s.glaslStage ?? '—'} · ${escapeTag(s.escalationTrend ?? '—')}`,
    '</situation-frame>',
  ].join('\n');
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
