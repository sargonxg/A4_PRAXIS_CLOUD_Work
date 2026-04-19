import type { AnalystProfile, Audience, Language, AnalyticalStyle } from '@/types/analyst-profile';
import type { Situation } from '@/types/situation';

export interface RetrievedChunk {
  id: string;
  text: string;
  source: string;
  score?: number;
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
}): string {
  const parts: string[] = [];

  parts.push(renderProfileBlock(opts.profile));
  parts.push(renderSituationBlock(opts.situation));
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
    `  Role: ${p.identity.seniority} ${p.identity.role} at ${p.identity.org || '—'} · ${p.identity.team || '—'}`,
    `  Mandate: ${p.perspective.mandate || '—'}`,
    `  ${lensLine}`,
    `  Regions of focus: ${p.perspective.regions.join(', ') || '—'}`,
    `  Audience: ${p.perspective.audience}`,
    `  Output language: ${p.workingStyle.language}`,
    `  Preferred style: ${p.workingStyle.analyticalStyle}`,
    `  Red lines:`,
    ...(p.workingStyle.redLines.length
      ? p.workingStyle.redLines.map(r => `    - ${r}`)
      : ['    (none specified)']),
    `</analyst-profile>`,
  ].join('\n');
}

function renderSituationBlock(s: Situation | null): string {
  if (!s) return ['<situation-frame>', '  No active situation.', '</situation-frame>'].join('\n');
  return [
    '<situation-frame>',
    `  Name: ${s.name}`,
    `  Type: ${s.type}`,
    `  Region: ${s.region || '—'}`,
    `  Key actors: ${(s.actors ?? []).join(', ') || '—'}`,
    `  Risk: ${s.riskScore ?? '—'}/10 · Glasl ${s.glaslStage ?? '—'} · ${s.escalationTrend ?? '—'}`,
    '</situation-frame>',
  ].join('\n');
}

function renderKnowledgeBlock(chunks: RetrievedChunk[]): string {
  return [
    '<retrieved-knowledge>',
    ...chunks.map(c => `  [${c.id}] ${c.text.slice(0, 500)} — ${c.source}`),
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
    ...redLines.map(r => `  - Constraint: ${r}`),
    `  - ${style === 'deep_dive' ? 'Favor depth, caveats, and citations.' : 'Favor brevity and actionable bullets.'}`,
    '</output-constraints>',
  ].join('\n');
}
