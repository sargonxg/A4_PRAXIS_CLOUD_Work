/**
 * Data-driven escalation scoring using Glasl's 9-stage model
 * Computes stage from ACLED events + GDELT stability data
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
}

const GLASL_STAGES = [
  '', 'Hardening', 'Debate & Polemic', 'Actions Not Words',
  'Images & Coalitions', 'Loss of Face', 'Strategies of Threats',
  'Limited Destructive Blows', 'Fragmentation', 'Together into the Abyss',
];

export function computeEscalation(events: ACLEDEvent[], stabilityScore?: number): EscalationAssessment {
  if (events.length === 0) {
    return {
      glaslStage: 1, stageName: GLASL_STAGES[1], confidence: 'low',
      evidence: ['No ACLED event data available'], weeklyEventCount: 0,
      weeklyBaseline: 0, fatalityTrend: 'stable', eventTypeShift: null,
      probability30d: 0.1, keyDrivers: ['Insufficient data'],
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
  const fatalityTrend = recentFatalities > monthlyFatalities * 1.3 ? 'increasing' :
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

  // Compute Glasl stage from data
  let stage = 1;
  const evidence: string[] = [];
  const drivers: string[] = [];

  if (ratio >= 3.0 || (hasBattles && hasVAC && hasExplosions)) {
    stage = 7 + Math.min(Math.floor((ratio - 3) / 2), 2);
    evidence.push(`Event intensity ${ratio.toFixed(1)}x baseline — extreme violence`);
    drivers.push('Extreme violence intensity');
  } else if (ratio >= 2.0 || (hasBattles && hasVAC)) {
    stage = 5 + Math.min(Math.floor((ratio - 2)), 1);
    evidence.push(`Event intensity ${ratio.toFixed(1)}x baseline — high-level violence`);
    drivers.push('Sustained high-intensity conflict');
  } else if (ratio >= 1.5 || hasBattles) {
    stage = 4;
    evidence.push(`Event intensity ${ratio.toFixed(1)}x baseline — armed confrontation`);
    drivers.push('Active armed confrontation');
  } else if (ratio >= 1.0 || hasProtests) {
    stage = 3;
    evidence.push(`Event intensity at baseline — actions/protests dominating`);
    drivers.push('Protest activity and political actions');
  } else {
    stage = ratio >= 0.5 ? 2 : 1;
    evidence.push(`Event intensity ${ratio.toFixed(1)}x baseline — low/moderate`);
    drivers.push('Moderate tension level');
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
  evidence.push(`${recentFatalities} fatalities this week (trend: ${fatalityTrend})`);
  if (eventTypeShift) evidence.push(eventTypeShift);

  // Escalation probability
  const probability30d = Math.min(0.95, (ratio * 0.2) + (fatalityTrend === 'increasing' ? 0.2 : 0) + (eventTypeShift ? 0.15 : 0));

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
  };
}
