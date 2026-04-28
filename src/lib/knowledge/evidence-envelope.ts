import type { CorpusConfidence, CorpusItem } from '@/types/corpus';

export interface ToolEvidenceInput {
  uid: string;
  situationId: string;
  toolId: string;
  docData: Record<string, unknown>;
  sourceCollection: 'tool-data' | 'tools';
  queryTerms?: string[];
}

export interface EvidenceEnvelope {
  envelopeVersion: 1;
  sourceType: 'tool-output';
  sourceId: string;
  title: string;
  excerpt: string;
  citation: string;
  confidence: CorpusConfidence;
  freshness: string;
  reason: string;
  score: number;
  toolId: string;
  canonicalToolId: string;
  sourceCollection: 'tool-data' | 'tools';
  version?: number;
  profileVersion?: number;
  metadata?: Record<string, unknown>;
}

const TOOL_ID_ALIASES: Record<string, string> = {
  actor_enrichment: 'actor-profiles',
  actor_profiles: 'actor-profiles',
  auto_briefing: 'daily-brief',
  briefing_room: 'briefing',
  commitment_scan: 'commitments',
  conflict_graph: 'conflict-graph',
  daily_brief: 'daily-brief',
  deep_research: 'deep-research',
  discover_sources: 'sources-library',
  economic_impact: 'economic-impact',
  electoral_risk: 'electoral-risk',
  escalation_scan: 'early-warning',
  external_actors: 'external-actors',
  game_theory: 'game-theory',
  geospatial_monitor: 'geospatial-monitor',
  human_rights: 'human-rights',
  info_environment: 'info-environment',
  legal_tracker: 'legal-tracker',
  media_analysis: 'media-compass',
  media_compass: 'media-compass',
  media_roundup: 'media-roundup',
  mediation_design: 'mediation-design',
  negotiation_prep: 'negotiation-prep',
  peacebuilding_index: 'peacebuilding-index',
  policy_memo: 'policy-memo',
  power_map: 'power-map',
  risk_assessment: 'risk-monitor',
  sanctions_scan: 'sanctions',
  scenario_analysis: 'scenarios',
  source_scout: 'source-scout',
  stakeholder_map: 'stakeholder-map',
  talking_points: 'talking-points',
  treaty_analysis: 'treaty-analyzer',
  un_toolkit: 'un-toolkit',
};

export function canonicalToolId(toolId: string): string {
  const trimmed = String(toolId || '').trim();
  if (!trimmed) return 'unknown-tool';
  return TOOL_ID_ALIASES[trimmed] ?? trimmed.replace(/_/g, '-');
}

export function toolOutputToEvidenceEnvelope(input: ToolEvidenceInput): EvidenceEnvelope | null {
  const canonical = canonicalToolId(input.toolId);
  const output = pickOutputPayload(input.docData);
  const excerpt = summarizeToolOutput(output);
  if (!excerpt) return null;

  const version = pickNumber(input.docData.version);
  const profileVersion = pickNumber(input.docData.profileVersion);
  const metadata = asRecord(input.docData.metadata);
  const freshness = coerceIsoTimestamp(input.docData.generatedAt) ?? '';
  const score = scoreText(`${input.toolId} ${canonical} ${excerpt}`, input.queryTerms ?? []);
  const versionLabel = version ? ` v${version}` : '';
  const profileLabel = profileVersion ? ` profile v${profileVersion}` : '';

  return {
    envelopeVersion: 1,
    sourceType: 'tool-output',
    sourceId: `tool-output#${canonical}`,
    title: `${canonical}${versionLabel}${profileLabel}`.trim(),
    excerpt,
    citation: `users/${input.uid}/situations/${input.situationId}/${input.sourceCollection}/${input.toolId}`,
    confidence: confidenceFromMetadata(metadata),
    freshness,
    reason: input.queryTerms?.length
      ? `Matches output of ${canonical}`
      : `Recent output of ${canonical}`,
    score,
    toolId: input.toolId,
    canonicalToolId: canonical,
    sourceCollection: input.sourceCollection,
    version,
    profileVersion,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

export function evidenceEnvelopeToCorpusItem(envelope: EvidenceEnvelope): CorpusItem {
  return {
    sourceType: 'tool-output',
    sourceId: envelope.sourceId,
    title: envelope.title,
    excerpt: envelope.excerpt,
    citation: envelope.citation,
    confidence: envelope.confidence,
    freshness: envelope.freshness,
    reason: envelope.reason,
    score: envelope.score,
  };
}

export function summarizeToolOutput(data: unknown): string {
  if (data == null) return '';
  if (typeof data === 'string') return data.slice(0, 600);
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    const head = data.slice(0, 3).map(x => summarizeToolOutput(x)).filter(Boolean);
    return head.join(' | ').slice(0, 600);
  }

  const rec = asRecord(data);
  const synthesis = asRecord(rec.synthesis);
  if (typeof synthesis.bluf === 'string' && synthesis.bluf.length > 0) {
    const parts = [`BLUF: ${synthesis.bluf}`];
    if (Array.isArray(synthesis.optionsForDecision) && synthesis.optionsForDecision.length > 0) {
      const options = synthesis.optionsForDecision
        .slice(0, 3)
        .map((x) => {
          const opt = asRecord(x);
          return [opt.label, opt.tradeoffs]
            .filter((v): v is string => typeof v === 'string' && v.length > 0)
            .join(': ');
        })
        .filter(Boolean);
      if (options.length) parts.push(`Options: ${options.join(' | ')}`);
    }
    if (Array.isArray(synthesis.openQuestions) && synthesis.openQuestions.length > 0) {
      parts.push(`Open questions: ${synthesis.openQuestions.slice(0, 3).join(' | ')}`);
    }
    if (Array.isArray(synthesis.nextActions) && synthesis.nextActions.length > 0) {
      const actions = synthesis.nextActions
        .slice(0, 3)
        .map((x) => {
          const action = asRecord(x);
          return typeof action.action === 'string' ? action.action : null;
        })
        .filter(Boolean);
      if (actions.length) parts.push(`Next actions: ${actions.join(' | ')}`);
    }
    return parts.join(' ').slice(0, 600);
  }

  const keys = [
    'headline',
    'summary',
    'executiveSummary',
    'bluf',
    'overview',
    'description',
    'recommendation',
    'recommendations',
    'finding',
    'findings',
    'title',
  ];
  for (const key of keys) {
    const value = rec[key];
    if (typeof value === 'string' && value.length > 0) return value.slice(0, 600);
    if (Array.isArray(value) && value.length > 0) {
      const joined = value
        .slice(0, 3)
        .map(x => (typeof x === 'string' ? x : summarizeToolOutput(x)))
        .filter(Boolean)
        .join(' | ');
      if (joined) return joined.slice(0, 600);
    }
  }

  const shallow = Object.fromEntries(
    Object.entries(rec).slice(0, 6).map(([key, value]) => [
      key,
      value && typeof value === 'object' ? '[object]' : value,
    ]),
  );
  return JSON.stringify(shallow).slice(0, 600);
}

export function scoreText(text: string, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0;
  const lower = (text || '').toLowerCase();
  let score = 0;
  for (const term of queryTerms) {
    if (!term) continue;
    const occurrences = lower.split(term).length - 1;
    if (occurrences > 0) score += occurrences;
  }
  return score;
}

function pickOutputPayload(docData: Record<string, unknown>): unknown {
  if ('data' in docData) return docData.data;
  if ('output' in docData) return docData.output;
  return docData;
}

function confidenceFromMetadata(metadata: Record<string, unknown>): CorpusConfidence {
  const raw = metadata.confidence ?? metadata.confidenceBand ?? metadata.semaphore;
  if (typeof raw === 'number') {
    if (raw >= 0.75) return 'high';
    if (raw >= 0.45) return 'medium';
    return 'low';
  }
  if (typeof raw === 'string') {
    const value = raw.toLowerCase();
    if (value === 'green' || value === 'high') return 'high';
    if (value === 'yellow' || value === 'medium') return 'medium';
    if (value === 'red' || value === 'low') return 'low';
  }
  return 'medium';
}

export function coerceIsoTimestamp(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      const date = maybeTimestamp.toDate();
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
    const seconds = maybeTimestamp.seconds ?? maybeTimestamp._seconds;
    if (typeof seconds === 'number') return new Date(seconds * 1000).toISOString();
  }
  return null;
}

function pickNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export const __test__ = {
  canonicalToolId,
  coerceIsoTimestamp,
  confidenceFromMetadata,
  scoreText,
  summarizeToolOutput,
};
