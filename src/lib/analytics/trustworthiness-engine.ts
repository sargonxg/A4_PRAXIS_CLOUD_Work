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
  'UCDP': 95,
  'UNHCR': 95,
  'OCHA': 95,
  'World Bank': 90,
  'HDX HAPI': 90,
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
  'Grounded Search': 45,
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

// ---------------------------------------------------------------------------
// Cross-Source Corroboration Engine
// ---------------------------------------------------------------------------

/**
 * A raw fact reported by a single source, before corroboration.
 */
export interface RawFact {
  claim: string;
  source: string;
  reportedAt: string;           // ISO date
  location?: string;
  actors?: string[];
  category?: CorroboratedFact['category'];
  dataPoints?: Record<string, string | number>;
  url?: string;
  excerpt?: string;
}

/**
 * A single source that reported a corroborated fact.
 */
export interface FactSource {
  name: string;
  reliability: number;
  reportedAt: string;
  url?: string;
  excerpt?: string;
  dataPoint?: string | number;
}

/**
 * A contradiction between two sources reporting on the same fact.
 */
export interface Contradiction {
  field: string;
  sourceA: { name: string; value: string };
  sourceB: { name: string; value: string };
  severity: 'critical' | 'moderate' | 'minor';
  resolution?: string;
}

/**
 * A fact that has been cross-referenced across multiple sources,
 * with confidence scoring, contradiction detection, and graph readiness.
 */
export interface CorroboratedFact {
  id: string;
  claim: string;
  category: 'event' | 'casualty' | 'displacement' | 'political' | 'military' | 'economic' | 'humanitarian';
  sources: FactSource[];
  confidence: number;           // 0-100 composite score
  triangulated: boolean;        // 3+ independent sources
  contradictions: Contradiction[];
  firstReported: string;        // ISO date
  lastUpdated: string;          // ISO date
  graphReady: boolean;          // can be stored as graph node
  location?: string;
  actors?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** English stop words excluded from claim normalization. */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'not', 'no', 'as', 'if', 'so', 'than',
  'about', 'into', 'over', 'after', 'before', 'between', 'under', 'above',
]);

/**
 * Compute word-level Jaccard similarity between two strings.
 * Returns a value between 0 (no overlap) and 1 (identical word sets).
 */
export function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Generate a stable, deterministic ID from a claim string.
 * Lowercases, removes stop words, sorts remaining words, joins with '-',
 * and truncates to 64 characters.
 */
export function normalizeClaimId(claim: string): string {
  const words = claim
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0 && !STOP_WORDS.has(w))
    .sort();
  return words.join('-').slice(0, 64);
}

/**
 * Compute composite confidence score for a fact based on its sources and recency.
 *
 * Weighted average of source reliability with bonuses:
 * - 3+ sources: +15
 * - Multiple source tiers (institutional + media, etc.): +10
 * - Recency multiplier: <=7d x1.0, <=30d x0.85, <=90d x0.7, >90d x0.5
 */
export function computeFactConfidence(sources: FactSource[], recencyDays: number): number {
  if (sources.length === 0) return 0;

  // Weighted average reliability
  const avgReliability =
    sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length;

  // Multi-source bonus
  const multiSourceBonus = sources.length >= 3 ? 15 : sources.length >= 2 ? 5 : 0;

  // Source tier diversity bonus: check if sources span different reliability tiers
  const tiers = new Set(sources.map(s => {
    if (s.reliability >= 85) return 'institutional';
    if (s.reliability >= 70) return 'expert';
    if (s.reliability >= 60) return 'media';
    if (s.reliability >= 50) return 'aggregated';
    return 'unverified';
  }));
  const tierDiversityBonus = tiers.size >= 2 ? 10 : 0;

  // Recency multiplier
  const recencyFactor =
    recencyDays <= 7 ? 1.0 :
    recencyDays <= 30 ? 0.85 :
    recencyDays <= 90 ? 0.7 :
    0.5;

  const raw = (avgReliability + multiSourceBonus + tierDiversityBonus) * recencyFactor;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Detect contradictions among a group of facts reporting on the same event.
 * Compares `dataPoints` across facts — numeric values differing by >20% or
 * substantially different string values are flagged.
 */
function detectContradictions(facts: RawFact[]): Contradiction[] {
  const contradictions: Contradiction[] = [];
  if (facts.length < 2) return contradictions;

  // Collect all data-point keys across the group
  const allKeys = new Set<string>();
  for (const f of facts) {
    if (f.dataPoints) {
      for (const k of Object.keys(f.dataPoints)) allKeys.add(k);
    }
  }

  for (const key of allKeys) {
    // Gather (source, value) pairs for this key
    const entries: { source: string; value: string | number }[] = [];
    for (const f of facts) {
      if (f.dataPoints && f.dataPoints[key] !== undefined) {
        entries.push({ source: f.source, value: f.dataPoints[key] });
      }
    }
    if (entries.length < 2) continue;

    // Compare each pair
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        const valA = a.value;
        const valB = b.value;

        let isMismatch = false;
        let severity: Contradiction['severity'] = 'minor';

        if (typeof valA === 'number' && typeof valB === 'number') {
          const avg = (Math.abs(valA) + Math.abs(valB)) / 2;
          if (avg > 0) {
            const pctDiff = Math.abs(valA - valB) / avg;
            if (pctDiff > 0.5) {
              isMismatch = true;
              severity = 'critical';
            } else if (pctDiff > 0.2) {
              isMismatch = true;
              severity = 'moderate';
            }
          }
        } else {
          const strA = String(valA).toLowerCase().trim();
          const strB = String(valB).toLowerCase().trim();
          if (strA !== strB) {
            const sim = jaccardSimilarity(strA, strB);
            if (sim < 0.3) {
              isMismatch = true;
              severity = 'critical';
            } else if (sim < 0.6) {
              isMismatch = true;
              severity = 'moderate';
            }
          }
        }

        if (isMismatch) {
          const reliA = getSourceReliability(a.source);
          const reliB = getSourceReliability(b.source);
          const higherSource = reliA >= reliB ? a.source : b.source;

          contradictions.push({
            field: key,
            sourceA: { name: a.source, value: String(valA) },
            sourceB: { name: b.source, value: String(valB) },
            severity,
            resolution: `Use value from higher-reliability source (${higherSource})`,
          });
        }
      }
    }
  }

  return contradictions;
}

// ---------------------------------------------------------------------------
// Grouping helpers
// ---------------------------------------------------------------------------

/** Parse an ISO date string to epoch ms, returning 0 on failure. */
function toEpoch(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

const MS_48H = 48 * 60 * 60 * 1000;

/**
 * Determine whether two raw facts are likely about the same event/claim.
 * Criteria: Jaccard similarity >= 0.35 on claim text, temporal proximity
 * within 48 hours, and (if both provide a location) matching location.
 */
function areSameFact(a: RawFact, b: RawFact): boolean {
  // Claim text similarity
  if (jaccardSimilarity(a.claim, b.claim) < 0.35) return false;

  // Temporal proximity
  const tA = toEpoch(a.reportedAt);
  const tB = toEpoch(b.reportedAt);
  if (tA > 0 && tB > 0 && Math.abs(tA - tB) > MS_48H) return false;

  // Location match (if both provided)
  if (a.location && b.location) {
    const locSim = jaccardSimilarity(a.location, b.location);
    if (locSim < 0.4) return false;
  }

  return true;
}

/**
 * Group raw facts by semantic similarity, temporal proximity, and location.
 * Uses simple single-linkage clustering: each fact joins the first group
 * where it matches any existing member.
 */
function groupFacts(facts: RawFact[]): RawFact[][] {
  const groups: RawFact[][] = [];

  for (const fact of facts) {
    let placed = false;
    for (const group of groups) {
      if (group.some(member => areSameFact(member, fact))) {
        group.push(fact);
        placed = true;
        break;
      }
    }
    if (!placed) {
      groups.push([fact]);
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Main corroboration function
// ---------------------------------------------------------------------------

/**
 * Cross-source corroboration engine.
 *
 * Takes raw facts from multiple sources and:
 * 1. Groups facts by semantic similarity (same event within 48h, same location/actors)
 * 2. Computes a composite confidence score weighted by source reliability
 * 3. Detects contradictions (different casualty counts, dates, actors)
 * 4. Marks as triangulated if 3+ independent source tiers confirm
 * 5. Generates a stable ID from normalized claim text
 * 6. Sets graphReady=true if confidence >= 70
 */
export function crossSourceCorroborate(facts: RawFact[]): CorroboratedFact[] {
  if (facts.length === 0) return [];

  const groups = groupFacts(facts);
  const results: CorroboratedFact[] = [];

  for (const group of groups) {
    // Pick the longest claim as the representative
    const representativeClaim = group.reduce(
      (best, f) => (f.claim.length > best.length ? f.claim : best),
      group[0].claim,
    );

    const id = normalizeClaimId(representativeClaim);

    // Determine category (most common in the group, default 'event')
    const categoryCounts: Record<string, number> = {};
    for (const f of group) {
      const cat = f.category || 'event';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
    const category = (Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      'event') as CorroboratedFact['category'];

    // Build FactSource array
    const sources: FactSource[] = group.map(f => ({
      name: f.source,
      reliability: getSourceReliability(f.source),
      reportedAt: f.reportedAt,
      url: f.url,
      excerpt: f.excerpt,
      dataPoint: f.dataPoints ? Object.values(f.dataPoints)[0] : undefined,
    }));

    // Timestamps
    const timestamps = group.map(f => toEpoch(f.reportedAt)).filter(t => t > 0);
    const firstReported = timestamps.length > 0
      ? new Date(Math.min(...timestamps)).toISOString()
      : group[0].reportedAt;
    const lastUpdated = timestamps.length > 0
      ? new Date(Math.max(...timestamps)).toISOString()
      : group[group.length - 1].reportedAt;

    // Recency in days from now
    const latestMs = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
    const recencyDays = Math.max(0, Math.round((Date.now() - latestMs) / (1000 * 60 * 60 * 24)));

    // Detect contradictions
    const contradictions = detectContradictions(group);

    // Confidence score
    const confidence = computeFactConfidence(sources, recencyDays);

    // Triangulation: 3+ independent source names
    const uniqueSources = new Set(sources.map(s => s.name));
    const triangulated = uniqueSources.size >= 3;

    // Merge actors from all facts in the group
    const actorsSet = new Set<string>();
    for (const f of group) {
      if (f.actors) f.actors.forEach(a => actorsSet.add(a));
    }

    // Merge location (pick most common)
    const locationCounts: Record<string, number> = {};
    for (const f of group) {
      if (f.location) {
        locationCounts[f.location] = (locationCounts[f.location] || 0) + 1;
      }
    }
    const location = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    results.push({
      id,
      claim: representativeClaim,
      category,
      sources,
      confidence,
      triangulated,
      contradictions,
      firstReported,
      lastUpdated,
      graphReady: confidence >= 70,
      ...(location ? { location } : {}),
      ...(actorsSet.size > 0 ? { actors: Array.from(actorsSet) } : {}),
    });
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);

  return results;
}
