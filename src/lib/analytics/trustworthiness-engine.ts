/**
 * Data Trustworthiness Engine
 *
 * Assigns confidence weights to information based on:
 * 1. Source reliability (UN agencies > think tanks > media > social media)
 * 2. Triangulation (same fact from 3+ independent sources = high confidence)
 * 3. Recency (more recent = higher weight)
 * 4. Consistency (does it align with other verified data?)
 *
 * Used by: feed-aggregator, tool generation, risk-engine
 */

export type TrustLevel = 'verified' | 'high' | 'medium' | 'low' | 'unverified';

export interface TrustworthinessScore {
  level: TrustLevel;
  score: number; // 0-100
  sources: number; // how many independent sources confirm this
  reasoning: string;
  triangulated: boolean; // 3+ independent sources
}

/**
 * Source reliability tiers (0-100).
 *
 * Tier 1 (85-100): Official/institutional sources — UN agencies, verified datasets
 * Tier 2 (70-84):  Expert/analytical — think tanks, HRW, specialized research
 * Tier 3 (60-74):  Major media — wire services, established outlets
 * Tier 4 (50-64):  Aggregated data — GDELT, Wikipedia
 * Tier 5 (30-49):  User-provided/unverified — uploaded docs, web scrapes
 */
const SOURCE_RELIABILITY: Record<string, number> = {
  // Tier 1: Official / institutional
  'ACLED': 95,
  'UNHCR': 95,
  'OCHA': 95,
  'World Bank': 90,
  'HDX HAPI': 90,
  'UCDP': 90,
  'SIPRI': 88,
  'ReliefWeb': 85,
  'UN News': 85,
  'ICRC': 90,
  'WHO': 90,
  'UNICEF': 88,

  // Tier 2: Expert / analytical
  'Crisis Group': 82,
  'Chatham House': 80,
  'RAND': 80,
  'Carnegie': 78,
  'Brookings': 78,
  'ISW': 75,
  'Bellingcat': 75,
  'Human Rights Watch': 80,
  'Amnesty International': 80,
  'Wilson Center': 76,
  'Oxford Analytica': 76,
  'ICG CrisisWatch': 82,

  // Tier 3: Major media
  'Reuters': 72,
  'AP': 72,
  'BBC': 70,
  'Al Jazeera': 68,
  'AFP': 70,
  'Financial Times': 70,

  // Tier 4: Aggregated / encyclopedic
  'GDELT': 55,
  'wikipedia': 60,

  // Tier 5: User-provided / unverified
  'user-document': 40,
  'firecrawl': 45,
  'unknown': 30,
};

/**
 * Get reliability score for a source.
 * Returns 35 (low-unverified) for unknown sources.
 */
export function getSourceReliability(source: string): number {
  // Try exact match first, then case-insensitive
  if (SOURCE_RELIABILITY[source] !== undefined) return SOURCE_RELIABILITY[source];

  const lower = source.toLowerCase();
  for (const [key, val] of Object.entries(SOURCE_RELIABILITY)) {
    if (key.toLowerCase() === lower) return val;
  }

  return 35;
}

/**
 * Compute trustworthiness score for a piece of information.
 */
export function computeTrustworthiness(params: {
  sources: string[];
  recencyDays: number;
  consistencyWithBaseline?: boolean;
}): TrustworthinessScore {
  const { sources, recencyDays, consistencyWithBaseline } = params;

  // Source reliability: average across all confirming sources
  const avgReliability =
    sources.length > 0
      ? sources.reduce((sum, s) => sum + getSourceReliability(s), 0) / sources.length
      : 30;

  // Triangulation bonus: multi-source confirmation increases trust
  const triangulationBonus = sources.length >= 3 ? 15 : sources.length >= 2 ? 5 : 0;
  const triangulated = sources.length >= 3;

  // Recency factor: fresher data = higher confidence
  const recencyFactor =
    recencyDays <= 7 ? 1.0 :
    recencyDays <= 30 ? 0.85 :
    recencyDays <= 90 ? 0.7 :
    0.5;

  // Consistency with known baseline
  const consistencyBonus =
    consistencyWithBaseline === true ? 10 :
    consistencyWithBaseline === false ? -10 :
    0;

  const rawScore = (avgReliability + triangulationBonus + consistencyBonus) * recencyFactor;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const level: TrustLevel =
    score >= 85 ? 'verified' :
    score >= 70 ? 'high' :
    score >= 50 ? 'medium' :
    score >= 30 ? 'low' :
    'unverified';

  return {
    level,
    score,
    sources: sources.length,
    triangulated,
    reasoning: `${sources.length} source(s), avg reliability ${avgReliability.toFixed(0)}, ${recencyDays}d old${triangulated ? ', triangulated' : ''}`,
  };
}

/**
 * Get a CSS-friendly color for a trust level.
 */
export function getTrustLevelColor(level: TrustLevel): string {
  switch (level) {
    case 'verified': return '#10B981';   // emerald
    case 'high': return '#34D399';       // emerald-400
    case 'medium': return '#FBBF24';     // amber
    case 'low': return '#F97316';        // orange
    case 'unverified': return '#EF4444'; // red
  }
}

/**
 * Get a human-readable label for a trust level.
 */
export function getTrustLevelLabel(level: TrustLevel): string {
  switch (level) {
    case 'verified': return 'Verified (multi-source)';
    case 'high': return 'High confidence';
    case 'medium': return 'Moderate confidence';
    case 'low': return 'Low confidence';
    case 'unverified': return 'Unverified';
  }
}
