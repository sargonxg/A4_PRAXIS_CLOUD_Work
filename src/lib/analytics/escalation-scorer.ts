/**
 * Data-driven escalation scoring using Glasl's 9-stage model
 * Computes stage from ACLED events + GDELT stability data
 * Includes weighted event scoring, actor fragmentation, and geographic spread
 */

import type { ACLEDEvent } from '@/lib/data-feeds/acled-client';

export interface EscalationAssessment {
  glaslStage: number;
  stageName: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
  weeklyEventCount: number;
  weeklyBaseline: number;
  fatalityTrend: 'increasing' | 'stable' | 'decreasing';
  eventTypeShift: string | null;
  probability30d: number;
  keyDrivers: string[];
  // v2 additions
  actorFragmentation: number;       // 0-1
  geographicSpread: number;         // 0-100
  weightedIntensity: number;        // weighted event score
  stageTransitionProbability: number; // 0-1
}

const GLASL_STAGES = [
  '', 'Hardening', 'Debate & Polemic', 'Actions Not Words',
  'Images & Coalitions', 'Loss of Face', 'Strategies of Threats',
  'Limited Destructive Blows', 'Fragmentation', 'Together into the Abyss',
];

// ---------------------------------------------------------------------------
// Event type weights (ACLED taxonomy → conflict severity weight)
// ---------------------------------------------------------------------------

const EVENT_TYPE_WEIGHTS: Record<string, number> = {
  'Battles': 4,
  'Explosions/Remote violence': 3,
  'Violence against civilians': 3,
  'Riots': 2,
  'Protests': 1,
  'Strategic developments': 1,
};

function getEventWeight(eventType: string): number {
  return EVENT_TYPE_WEIGHTS[eventType] ?? 1;
}

/**
 * Compute the weighted intensity score for a set of events.
 * Returns the sum of per-event weights.
 */
function computeWeightedIntensity(events: ACLEDEvent[]): number {
  return events.reduce((sum, e) => sum + getEventWeight(e.event_type), 0);
}

// ---------------------------------------------------------------------------
// Actor fragmentation
// ---------------------------------------------------------------------------

/**
 * Fragmentation = (unique actors) / (total events), clamped 0-1.
 * High fragmentation indicates a complex multi-actor conflict.
 */
function computeActorFragmentation(events: ACLEDEvent[]): number {
  if (events.length === 0) return 0;

  const actorCounts = new Map<string, number>();
  for (const e of events) {
    if (e.actor1) actorCounts.set(e.actor1, (actorCounts.get(e.actor1) ?? 0) + 1);
    if (e.actor2) actorCounts.set(e.actor2, (actorCounts.get(e.actor2) ?? 0) + 1);
  }

  const uniqueActors = actorCounts.size;
  const fragmentation = uniqueActors / events.length;
  return Math.min(1, fragmentation);
}

// ---------------------------------------------------------------------------
// Geographic spread
// ---------------------------------------------------------------------------

/**
 * Geographic spread index based on unique admin1 regions.
 * Each unique admin1 region adds 10 points, max 100.
 */
function computeGeographicSpread(events: ACLEDEvent[]): number {
  const admin1Regions = new Set<string>();
  for (const e of events) {
    if (e.admin1) admin1Regions.add(e.admin1);
  }
  return Math.min(admin1Regions.size * 10, 100);
}

// ---------------------------------------------------------------------------
// Stage transition probability
// ---------------------------------------------------------------------------

/**
 * Returns 0-1 probability of escalation to the next Glasl stage within 30 days.
 *
 * @param currentStage      Current Glasl stage (1-9)
 * @param recentRatio       Recent weekly events / historical baseline
 * @param fatalityTrend     Fatality trend direction
 * @param actorFragmentation Actor fragmentation score (0-1)
 */
export function getStageTransitionProbability(
  currentStage: number,
  recentRatio: number,
  fatalityTrend: 'increasing' | 'stable' | 'decreasing',
  actorFragmentation: number,
): number {
  const stage = Math.min(Math.max(currentStage, 1), 9);

  // Base probability increases at higher stages
  const stageBases: Record<number, number> = {
    1: 0.05, 2: 0.08, 3: 0.12, 4: 0.18,
    5: 0.25, 6: 0.30, 7: 0.40, 8: 0.50, 9: 0.0,
  };
  const base = stageBases[stage] ?? 0.1;

  // Ratio modifier: each unit above 1.0 adds proportional risk (capped at +0.3)
  const ratioModifier = Math.min(Math.max((recentRatio - 1) / 2, 0) * 0.3, 0.3);

  // Fatality trend modifier
  const fatalityModifier = fatalityTrend === 'increasing' ? 0.15 : fatalityTrend === 'decreasing' ? -0.05 : 0;

  // Actor fragmentation: more fragments → harder to contain escalation (+0-0.1)
  const fragmentationModifier = actorFragmentation * 0.1;

  const probability = base + ratioModifier + fatalityModifier + fragmentationModifier;
  return Math.round(Math.min(Math.max(probability, 0), 0.95) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Main escalation computation
// ---------------------------------------------------------------------------

export function computeEscalation(events: ACLEDEvent[], stabilityScore?: number): EscalationAssessment {
  if (events.length === 0) {
    return {
      glaslStage: 1, stageName: GLASL_STAGES[1], confidence: 'low',
      evidence: ['No ACLED event data available'], weeklyEventCount: 0,
      weeklyBaseline: 0, fatalityTrend: 'stable', eventTypeShift: null,
      probability30d: 0.1, keyDrivers: ['Insufficient data'],
      actorFragmentation: 0, geographicSpread: 0, weightedIntensity: 0,
      stageTransitionProbability: 0.05,
    };
  }

  // Sort by date
  const sorted = [...events].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;
  const quarterAgo = now - 90 * 86400000;

  const recentWeek = sorted.filter((e) => new Date(e.event_date).getTime() > weekAgo);
  const lastMonth = sorted.filter((e) => new Date(e.event_date).getTime() > monthAgo);
  const lastQuarter = sorted.filter((e) => new Date(e.event_date).getTime() > quarterAgo);

  const weeklyCount = recentWeek.length;
  const monthlyAvgWeekly = lastMonth.length / 4;
  const quarterlyAvgWeekly = lastQuarter.length / 13;
  const baseline = quarterlyAvgWeekly || monthlyAvgWeekly || 1;
  const ratio = weeklyCount / baseline;

  // Fatality analysis
  const recentFatalities = recentWeek.reduce((s, e) => s + e.fatalities, 0);
  const monthlyFatalities = lastMonth.reduce((s, e) => s + e.fatalities, 0) / 4;
  const fatalityTrend: 'increasing' | 'stable' | 'decreasing' =
    recentFatalities > monthlyFatalities * 1.3 ? 'increasing' :
    recentFatalities < monthlyFatalities * 0.7 ? 'decreasing' : 'stable';

  // Event type analysis
  const recentTypes = recentWeek.map((e) => e.event_type);
  const hasBattles = recentTypes.includes('Battles');
  const hasProtests = recentTypes.includes('Protests');
  const hasVAC = recentTypes.includes('Violence against civilians');
  const hasExplosions = recentTypes.includes('Explosions/Remote violence');

  let eventTypeShift: string | null = null;
  const monthTypes = lastMonth.map((e) => e.event_type);
  const monthHasBattles = monthTypes.includes('Battles');
  if (hasBattles && !monthHasBattles) eventTypeShift = 'Protests/Strategic → Battles (escalation)';
  if (hasVAC && !monthTypes.includes('Violence against civilians')) eventTypeShift = 'New: Violence against civilians detected';

  // Weighted intensity metrics
  const weeklyWeightedIntensity = computeWeightedIntensity(recentWeek);
  const monthlyAvgWeightedIntensity = computeWeightedIntensity(lastMonth) / 4;
  const baselineWeightedIntensity = monthlyAvgWeightedIntensity || 1;
  const weightedRatio = weeklyWeightedIntensity / baselineWeightedIntensity;

  // Actor fragmentation and geographic spread (full dataset for richer signal)
  const actorFragmentation = computeActorFragmentation(events);
  const geographicSpread = computeGeographicSpread(events);

  // Compute Glasl stage using weighted scoring (primary signal)
  let stage = 1;
  const evidence: string[] = [];
  const drivers: string[] = [];

  // Use weighted ratio as the primary escalation signal
  if (weightedRatio >= 3.0 || (hasBattles && hasVAC && hasExplosions)) {
    stage = 7 + Math.min(Math.floor((weightedRatio - 3) / 2), 2);
    evidence.push(`Weighted intensity ${weightedRatio.toFixed(1)}x baseline — extreme violence`);
    drivers.push('Extreme violence intensity');
  } else if (weightedRatio >= 2.0 || (hasBattles && hasVAC)) {
    stage = 5 + Math.min(Math.floor(weightedRatio - 2), 1);
    evidence.push(`Weighted intensity ${weightedRatio.toFixed(1)}x baseline — high-level violence`);
    drivers.push('Sustained high-intensity conflict');
  } else if (weightedRatio >= 1.5 || hasBattles) {
    stage = 4;
    evidence.push(`Weighted intensity ${weightedRatio.toFixed(1)}x baseline — armed confrontation`);
    drivers.push('Active armed confrontation');
  } else if (weightedRatio >= 1.0 || hasProtests) {
    stage = 3;
    evidence.push(`Weighted intensity at baseline — actions/protests dominating`);
    drivers.push('Protest activity and political actions');
  } else {
    stage = ratio >= 0.5 ? 2 : 1;
    evidence.push(`Weighted intensity ${weightedRatio.toFixed(1)}x baseline — low/moderate`);
    drivers.push('Moderate tension level');
  }

  // High actor fragmentation can push stage up by 1 (complex multi-actor dynamics)
  if (actorFragmentation > 0.7 && stage < 9) {
    stage = Math.min(stage + 1, 9);
    evidence.push(`High actor fragmentation (${(actorFragmentation * 100).toFixed(0)}%) — complex conflict landscape`);
    drivers.push('Multi-actor fragmentation');
  }

  // Wide geographic spread raises intensity signal
  if (geographicSpread >= 50 && stage < 9) {
    stage = Math.min(stage + 1, 9);
    evidence.push(`Geographic spread across ${Math.round(geographicSpread / 10)} admin1 regions`);
    drivers.push('Widespread territorial reach');
  }

  // GDELT stability modifier
  if (stabilityScore !== undefined) {
    if (stabilityScore > 5) {
      stage = Math.min(stage + 1, 9);
      evidence.push(`GDELT instability score: ${stabilityScore.toFixed(1)} (elevated)`);
      drivers.push('Elevated media instability signals');
    }
  }

  stage = Math.max(1, Math.min(9, stage));
  evidence.push(`${weeklyCount} events this week vs ${baseline.toFixed(0)} weekly average`);
  evidence.push(`Weighted intensity: ${weeklyWeightedIntensity} (baseline: ${baselineWeightedIntensity.toFixed(0)})`);
  evidence.push(`${recentFatalities} fatalities this week (trend: ${fatalityTrend})`);
  if (eventTypeShift) evidence.push(eventTypeShift);

  // Escalation probability (legacy field — kept for backward compatibility)
  const probability30d = Math.min(0.95, (ratio * 0.2) + (fatalityTrend === 'increasing' ? 0.2 : 0) + (eventTypeShift ? 0.15 : 0));

  // Stage transition probability (new — uses richer signal set)
  const stageTransitionProbability = getStageTransitionProbability(stage, weightedRatio, fatalityTrend, actorFragmentation);

  return {
    glaslStage: stage,
    stageName: GLASL_STAGES[stage],
    confidence: events.length > 50 ? 'high' : events.length > 20 ? 'medium' : 'low',
    evidence,
    weeklyEventCount: weeklyCount,
    weeklyBaseline: Math.round(baseline),
    fatalityTrend,
    eventTypeShift,
    probability30d: Math.round(probability30d * 100) / 100,
    keyDrivers: drivers,
    actorFragmentation: Math.round(actorFragmentation * 100) / 100,
    geographicSpread,
    weightedIntensity: weeklyWeightedIntensity,
    stageTransitionProbability,
  };
}
