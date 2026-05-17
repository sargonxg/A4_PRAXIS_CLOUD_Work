/**
 * Google-grounded intelligence aggregator.
 *
 * PRAXIS no longer maintains structured third-party feed clients. Live
 * external awareness is routed through Google Search grounding, while durable
 * evidence comes from user-uploaded sources and source receipts.
 */

import { getGroundedSearchEvents, type FeedEvent as GroundedFeedEvent } from './grounded-search-client';

export interface TrustworthinessScore {
  score: number;
  level: 'high' | 'medium' | 'low' | 'unknown';
  reasons?: string[];
}

export interface IntelligenceItem {
  id: string;
  source: 'grounded_search';
  type: 'event' | 'article' | 'report' | 'statement';
  title: string;
  description: string;
  date: string;
  url?: string;
  actors: string[];
  location?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metadata: Record<string, unknown>;
  trustScore?: TrustworthinessScore;
}

export interface HumanitarianSnapshot {
  displacement?: { idps: number; refugees: number };
  foodSecurity?: { phase: string; population: number; pct: number }[];
  funding?: { required: number; funded: number; pct: number };
}

export interface StabilitySnapshot {
  score: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface SituationIntelligence {
  events: IntelligenceItem[];
  totalCount: number;
  sources: { grounded_search: number };
  humanitarian?: HumanitarianSnapshot;
  stability?: StabilitySnapshot;
  fallbackUsed?: boolean;
  fetchedAt: string;
}

export interface SourceHealth {
  name: string;
  available: boolean;
  latencyMs: number;
  recordCount: number;
  lastSuccess: string | null;
  error?: string;
}

export interface DataQuality {
  overallScore: number;
  sourcesAvailable: number;
  sourcesTotal: number;
  coverageGaps: string[];
  freshness: 'live' | 'recent' | 'stale';
  lastUpdated: string;
}

export interface GovernanceSnapshot {
  ruleOfLaw: number | null;
  governmentEffectiveness: number | null;
  politicalStability: number | null;
  controlOfCorruption: number | null;
  source: 'grounded_search';
  year: number | null;
}

export interface ArmsFlowSnapshot {
  totalValue?: number;
  topSuppliers?: string[];
  topRecipients?: string[];
  source: 'grounded_search';
  year?: number;
}

export interface PopulationSnapshot {
  refugees?: number;
  idps?: number;
  returnees?: number;
  asylumSeekers?: number;
  source: 'grounded_search';
  year?: number;
}

export interface ConflictProfile {
  intelligence: SituationIntelligence;
  riskAssessment: {
    composite: number;
    confidence: 'high' | 'medium' | 'low';
    sources: string[];
  };
  escalation: {
    glaslStage: number;
    stageName: string;
    trend: string;
  };
  humanitarian: HumanitarianSnapshot;
  governance: GovernanceSnapshot;
  armsFlows: ArmsFlowSnapshot;
  populationStats: PopulationSnapshot;
  ucdpConflicts: [];
  crisisWatchStatus?: string;
  sourceHealth: SourceHealth[];
  dataQuality: DataQuality;
  fetchedAt: string;
}

function trustForGroundedEvent(date: string): TrustworthinessScore {
  const days = date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)) : 30;
  const recencyScore = days <= 7 ? 0.9 : days <= 30 ? 0.75 : 0.55;
  return {
    score: recencyScore,
    level: recencyScore >= 0.8 ? 'high' : recencyScore >= 0.6 ? 'medium' : 'low',
    reasons: ['Google Search grounding', `recency ${days} day(s)`],
  };
}

export function groundedToIntel(ev: GroundedFeedEvent): IntelligenceItem {
  return {
    id: ev.id,
    source: 'grounded_search',
    type: ev.type,
    title: ev.title,
    description: ev.description,
    date: ev.date,
    url: ev.url,
    actors: ev.actors,
    location: ev.location,
    severity: ev.severity,
    metadata: { retrievalMethod: 'google_search_grounding' },
    trustScore: trustForGroundedEvent(ev.date),
  };
}

async function timed<T>(name: string, fn: () => Promise<T>): Promise<{ result: T | null; health: SourceHealth }> {
  const start = Date.now();
  try {
    const result = await fn();
    const count = Array.isArray(result) ? result.length : result !== null ? 1 : 0;
    return {
      result,
      health: {
        name,
        available: result !== null,
        latencyMs: Date.now() - start,
        recordCount: count,
        lastSuccess: result !== null ? new Date().toISOString() : null,
      },
    };
  } catch (err) {
    return {
      result: null,
      health: {
        name,
        available: false,
        latencyMs: Date.now() - start,
        recordCount: 0,
        lastSuccess: null,
        error: err instanceof Error ? err.message : String(err),
      },
    };
  }
}

function sortItems(items: IntelligenceItem[]): IntelligenceItem[] {
  const severityOrder: Record<IntelligenceItem['severity'], number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return items.sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

export async function getSituationIntelligence(options: {
  country: string;
  query?: string;
  dateStart?: string;
  limit?: number;
}): Promise<SituationIntelligence> {
  const events = await getGroundedSearchEvents({
    query: options.query ?? options.country,
    country: options.country,
    limit: Math.min(options.limit ?? 12, 20),
  });
  const items = sortItems(events.map(groundedToIntel));
  return {
    events: items,
    totalCount: items.length,
    sources: { grounded_search: items.length },
    fallbackUsed: items.length > 0,
    fetchedAt: new Date().toISOString(),
  };
}

const GLASL_STAGES: { stage: number; name: string; minRatio: number }[] = [
  { stage: 9, name: 'Together into the Abyss', minRatio: 0.9 },
  { stage: 8, name: 'Fragmentation of the Enemy', minRatio: 0.75 },
  { stage: 7, name: 'Limited Annihilation Blows', minRatio: 0.6 },
  { stage: 6, name: 'Face-Threatening Strategies', minRatio: 0.45 },
  { stage: 5, name: 'Loss of Face', minRatio: 0.35 },
  { stage: 4, name: 'Images and Coalitions', minRatio: 0.25 },
  { stage: 3, name: 'Actions Not Words', minRatio: 0.15 },
  { stage: 2, name: 'Debate and Polemics', minRatio: 0.07 },
  { stage: 1, name: 'Hardening', minRatio: 0 },
];

function glaslFromRatio(eventRatio: number): { glaslStage: number; stageName: string } {
  const clamped = Math.max(0, Math.min(1, eventRatio));
  for (const entry of GLASL_STAGES) {
    if (clamped >= entry.minRatio) return { glaslStage: entry.stage, stageName: entry.name };
  }
  return { glaslStage: 1, stageName: 'Hardening' };
}

export async function getConflictProfile(options: {
  country: string;
  query?: string;
  dateStart?: string;
  limit?: number;
  situation?: { actors: string[]; region: string };
}): Promise<ConflictProfile> {
  const grounded = await timed('Google Search grounding', () =>
    getGroundedSearchEvents({
      query: options.query ?? options.country,
      country: options.country,
      limit: Math.min(options.limit ?? 12, 20),
    }),
  );
  const events = ((grounded.result ?? []) as GroundedFeedEvent[]).map(groundedToIntel);
  const intelligence: SituationIntelligence = {
    events: sortItems(events),
    totalCount: events.length,
    sources: { grounded_search: events.length },
    fallbackUsed: events.length > 0,
    fetchedAt: new Date().toISOString(),
  };

  const highSeverity = events.filter((event) => event.severity === 'critical' || event.severity === 'high').length;
  const compositeRaw = events.length ? Math.min(1, (highSeverity * 0.2 + events.length * 0.05)) : 0;
  const composite = Math.round(compositeRaw * 100);
  const { glaslStage, stageName } = glaslFromRatio(compositeRaw);
  const sourceHealth = [grounded.health];
  const sourcesAvailable = sourceHealth.filter((source) => source.available).length;

  return {
    intelligence,
    riskAssessment: {
      composite,
      confidence: events.length >= 6 ? 'high' : events.length >= 2 ? 'medium' : 'low',
      sources: events.length ? ['Google Search grounding'] : [],
    },
    escalation: {
      glaslStage,
      stageName,
      trend: highSeverity > 0 ? 'worsening' : events.length > 0 ? 'stable' : 'unknown',
    },
    humanitarian: {},
    governance: {
      ruleOfLaw: null,
      governmentEffectiveness: null,
      politicalStability: null,
      controlOfCorruption: null,
      source: 'grounded_search',
      year: null,
    },
    armsFlows: { source: 'grounded_search' },
    populationStats: { source: 'grounded_search' },
    ucdpConflicts: [],
    sourceHealth,
    dataQuality: {
      overallScore: Math.round((sourcesAvailable / sourceHealth.length) * 100),
      sourcesAvailable,
      sourcesTotal: sourceHealth.length,
      coverageGaps: sourceHealth.filter((source) => !source.available).map((source) => source.name),
      freshness: grounded.health.latencyMs < 5000 ? 'live' : grounded.health.latencyMs < 15000 ? 'recent' : 'stale',
      lastUpdated: new Date().toISOString(),
    },
    fetchedAt: new Date().toISOString(),
  };
}
