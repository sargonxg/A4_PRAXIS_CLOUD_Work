/**
 * Multi-dimensional risk scoring engine
 * Computes composite risk from ACLED, GDELT, HDX, World Bank data
 * Includes INFORM Risk Index geometric mean methodology and WGI integration
 */

import type { ACLEDEvent } from '@/lib/data-feeds/acled-client';

export interface RiskDimension {
  name: string;
  score: number; // 0-100
  evidence: string[];
  sources: string[];
  trend: 'improving' | 'stable' | 'worsening';
}

export interface RiskAssessment {
  composite: number;
  confidence: 'high' | 'medium' | 'low';
  dimensions: {
    security: RiskDimension;
    political: RiskDimension;
    humanitarian: RiskDimension;
    economic: RiskDimension;
    social: RiskDimension;
  };
  dataSources: string[];
  assessedAt: string;
  informComponents?: INFORMComponents;
}

// ---------------------------------------------------------------------------
// INFORM Risk Index
// ---------------------------------------------------------------------------

export interface INFORMComponents {
  hazard: number;        // 0-10 (physical + human hazard)
  vulnerability: number; // 0-10 (socio-economic + vulnerable groups + uprooted people)
  lackOfCoping: number;  // 0-10 (institutional + infrastructure + DRR)
  composite: number;     // (hazard × vulnerability × lackOfCoping)^(1/3), scaled 0-10
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute INFORM Risk Index components using the geometric mean methodology.
 * Reference: INFORM (2023). INFORM Global Risk Index. IASC Task Team.
 */
export function computeINFORM(params: {
  /** Raw ACLED event count for the context window */
  acledEventCount: number;
  /** Proportion of population facing IPC 3+ food insecurity (0-1) */
  foodInsecurityPct?: number;
  /** Number of displaced persons */
  displacementCount?: number;
  /** World Bank WGI Political Stability score (-2.5 to 2.5) */
  wgiPoliticalStability?: number;
  /** World Bank WGI Rule of Law score (-2.5 to 2.5) */
  wgiRuleOfLaw?: number;
  /** World Bank WGI Government Effectiveness score (-2.5 to 2.5) */
  wgiGovEffectiveness?: number;
}): INFORMComponents {
  // --- Hazard (0-10): normalise ACLED events; 0 events = 0, 100+ = 10
  const hazard = clamp((params.acledEventCount / 100) * 10, 0, 10);

  // --- Vulnerability (0-10): food insecurity + displacement pressure
  let vulnerability = 0;
  if (params.foodInsecurityPct !== undefined) {
    // Food insecurity pct (0-1) → 0-7 component
    vulnerability += clamp(params.foodInsecurityPct * 7, 0, 7);
  }
  if (params.displacementCount !== undefined) {
    // Each 100k displaced adds 1 point, capped at 3
    vulnerability += clamp(params.displacementCount / 100_000, 0, 3);
  }
  vulnerability = clamp(vulnerability, 0, 10);

  // --- Lack of Coping (0-10): invert WGI scores — bad governance = high lack of coping
  let lackOfCoping = 5; // neutral default when no WGI data
  const wgiScores: number[] = [];
  if (params.wgiPoliticalStability !== undefined) wgiScores.push(params.wgiPoliticalStability);
  if (params.wgiRuleOfLaw !== undefined) wgiScores.push(params.wgiRuleOfLaw);
  if (params.wgiGovEffectiveness !== undefined) wgiScores.push(params.wgiGovEffectiveness);
  if (wgiScores.length > 0) {
    const avgWgi = wgiScores.reduce((a, b) => a + b, 0) / wgiScores.length;
    // WGI range -2.5 to 2.5; invert so that -2.5 → 10 (worst coping), 2.5 → 0 (best coping)
    lackOfCoping = clamp((1 - (avgWgi + 2.5) / 5) * 10, 0, 10);
  }

  // --- Composite: geometric mean of the three pillars, scaled 0-10
  const composite = clamp(Math.pow(hazard * vulnerability * lackOfCoping, 1 / 3), 0, 10);

  return { hazard, vulnerability, lackOfCoping, composite };
}

// ---------------------------------------------------------------------------
// WGI conversion helper
// ---------------------------------------------------------------------------

/**
 * Convert a single WGI score (-2.5 to 2.5) to a 0-100 risk scale.
 * Higher WGI (better governance) → lower risk score.
 */
export function wgiToRiskScore(wgi: number): number {
  return clamp((1 - (wgi + 2.5) / 5) * 100, 0, 100);
}

// ---------------------------------------------------------------------------
// Stage transition probability helper
// ---------------------------------------------------------------------------

/**
 * Returns the 0-1 probability of advancing to the next Glasl stage within 30 days.
 * @param currentStage  Current Glasl stage (1-9)
 * @param recentEventRatio  Recent weekly events / historical baseline
 */
export function getStageTransitionRisk(currentStage: number, recentEventRatio: number): number {
  // Base probability increases at higher stages (harder to de-escalate)
  const stageBases: Record<number, number> = {
    1: 0.05, 2: 0.08, 3: 0.12, 4: 0.18,
    5: 0.25, 6: 0.30, 7: 0.40, 8: 0.50, 9: 0.0,
  };
  const base = stageBases[Math.min(Math.max(currentStage, 1), 9)] ?? 0.1;

  // Ratio modifier: ratio of 1.0 adds 0, ratio of 3.0+ adds 0.3
  const ratioModifier = clamp(((recentEventRatio - 1) / 2) * 0.3, 0, 0.3);

  return clamp(base + ratioModifier, 0, 0.95);
}

// ---------------------------------------------------------------------------
// Main risk score computation
// ---------------------------------------------------------------------------

export function computeRiskScore(params: {
  acledEvents?: ACLEDEvent[];
  stabilityScore?: number;
  stabilityTrend?: string;
  foodSecurityPct?: number;
  displacementCount?: number;
  fundingGapPct?: number;
  inflation?: number;
  gdpGrowth?: number;
  militarySpendingPct?: number;
  // WGI integration
  wgiPoliticalStability?: number;
  wgiRuleOfLaw?: number;
  wgiGovEffectiveness?: number;
  // Pre-computed INFORM components
  informComponents?: INFORMComponents;
}): RiskAssessment {
  const sources: string[] = [];

  // Security dimension (from ACLED)
  const security: RiskDimension = { name: 'Security', score: 20, evidence: [], sources: [], trend: 'stable' };
  if (params.acledEvents && params.acledEvents.length > 0) {
    sources.push('ACLED');
    security.sources.push('ACLED');
    const weekEvents = params.acledEvents.filter((e) => {
      const d = new Date(e.event_date).getTime();
      return d > Date.now() - 7 * 86400000;
    });
    const fatalities = weekEvents.reduce((s, e) => s + e.fatalities, 0);
    const battles = weekEvents.filter((e) => e.event_type === 'Battles').length;

    security.score = Math.min(100, weekEvents.length * 3 + fatalities * 2 + battles * 5);
    security.evidence.push(`${weekEvents.length} events this week, ${fatalities} fatalities`);
    if (battles > 0) security.evidence.push(`${battles} active battles`);
    security.trend = security.score > 60 ? 'worsening' : security.score > 30 ? 'stable' : 'improving';
  }

  // Political dimension (from GDELT stability + WGI when available)
  const political: RiskDimension = { name: 'Political', score: 30, evidence: [], sources: [], trend: 'stable' };

  const wgiScores: { label: string; value: number }[] = [];
  if (params.wgiPoliticalStability !== undefined) wgiScores.push({ label: 'Political Stability', value: params.wgiPoliticalStability });
  if (params.wgiRuleOfLaw !== undefined) wgiScores.push({ label: 'Rule of Law', value: params.wgiRuleOfLaw });
  if (params.wgiGovEffectiveness !== undefined) wgiScores.push({ label: 'Gov. Effectiveness', value: params.wgiGovEffectiveness });

  if (wgiScores.length > 0) {
    sources.push('World Bank WGI');
    political.sources.push('World Bank WGI');
    // Average risk across provided WGI dimensions
    const avgRisk = wgiScores.reduce((sum, s) => sum + wgiToRiskScore(s.value), 0) / wgiScores.length;
    political.score = Math.round(avgRisk);
    wgiScores.forEach(({ label, value }) => {
      political.evidence.push(`WGI ${label}: ${value.toFixed(2)} → ${wgiToRiskScore(value).toFixed(0)}/100 risk`);
    });
    political.trend = political.score > 60 ? 'worsening' : political.score > 30 ? 'stable' : 'improving';
  } else if (params.stabilityScore !== undefined) {
    sources.push('GDELT');
    political.sources.push('GDELT Stability');
    political.score = Math.min(100, Math.round(params.stabilityScore * 15));
    political.evidence.push(`GDELT instability index: ${params.stabilityScore.toFixed(1)}`);
    political.trend = params.stabilityTrend === 'worsening' ? 'worsening' : params.stabilityTrend === 'improving' ? 'improving' : 'stable';
  } else if (params.stabilityScore !== undefined) {
    // Fallback GDELT-only path (already handled above, kept for clarity)
  }

  // Humanitarian dimension (from HDX)
  const humanitarian: RiskDimension = { name: 'Humanitarian', score: 20, evidence: [], sources: [], trend: 'stable' };
  if (params.foodSecurityPct !== undefined) {
    sources.push('HDX');
    humanitarian.sources.push('HDX HAPI');
    humanitarian.score = Math.min(100, Math.round(params.foodSecurityPct * 200));
    humanitarian.evidence.push(`${(params.foodSecurityPct * 100).toFixed(0)}% food insecure (IPC 3+)`);
  }
  if (params.displacementCount !== undefined && params.displacementCount > 0) {
    humanitarian.score = Math.min(100, humanitarian.score + Math.round(params.displacementCount / 10000));
    humanitarian.evidence.push(`${(params.displacementCount / 1000).toFixed(0)}K displaced persons`);
  }
  if (params.fundingGapPct !== undefined) {
    const gap = 100 - params.fundingGapPct;
    humanitarian.score = Math.min(100, humanitarian.score + Math.round(gap * 0.3));
    humanitarian.evidence.push(`Humanitarian funding: ${params.fundingGapPct.toFixed(0)}% covered (${gap.toFixed(0)}% gap)`);
  }
  humanitarian.trend = humanitarian.score > 60 ? 'worsening' : 'stable';

  // Economic dimension (from World Bank)
  const economic: RiskDimension = { name: 'Economic', score: 25, evidence: [], sources: [], trend: 'stable' };
  if (params.inflation !== undefined) {
    if (!sources.includes('World Bank')) sources.push('World Bank');
    economic.sources.push('World Bank');
    economic.score = Math.min(100, Math.round(Math.abs(params.inflation) * 3));
    economic.evidence.push(`Inflation: ${params.inflation.toFixed(1)}%`);
  }
  if (params.gdpGrowth !== undefined) {
    const negGrowthRisk = params.gdpGrowth < 0 ? Math.abs(params.gdpGrowth) * 10 : 0;
    economic.score = Math.min(100, economic.score + negGrowthRisk);
    economic.evidence.push(`GDP growth: ${params.gdpGrowth.toFixed(1)}%`);
  }
  if (params.militarySpendingPct !== undefined) {
    economic.evidence.push(`Military spending: ${params.militarySpendingPct.toFixed(1)}% of GDP`);
  }
  economic.trend = economic.score > 50 ? 'worsening' : 'stable';

  // Social dimension (composite)
  const social: RiskDimension = { name: 'Social', score: 25, evidence: [], sources: ['Composite'], trend: 'stable' };
  if (params.acledEvents) {
    const protests = params.acledEvents.filter((e) => e.event_type === 'Protests' || e.event_type === 'Riots');
    if (protests.length > 0) {
      social.score = Math.min(100, protests.length * 5);
      social.evidence.push(`${protests.length} protests/riots in dataset`);
      social.trend = protests.length > 10 ? 'worsening' : 'stable';
    }
  }

  // If INFORM components are provided, use the composite to calibrate overall confidence
  let informComponents: INFORMComponents | undefined = params.informComponents;
  if (!informComponents && params.acledEvents !== undefined) {
    // Auto-compute INFORM when enough data is available
    const totalEvents = params.acledEvents.length;
    if (totalEvents > 0 || params.foodSecurityPct !== undefined || wgiScores.length > 0) {
      informComponents = computeINFORM({
        acledEventCount: totalEvents,
        foodInsecurityPct: params.foodSecurityPct,
        displacementCount: params.displacementCount,
        wgiPoliticalStability: params.wgiPoliticalStability,
        wgiRuleOfLaw: params.wgiRuleOfLaw,
        wgiGovEffectiveness: params.wgiGovEffectiveness,
      });
    }
  }

  // Composite score — weighted average of dimensions
  const weights = { security: 0.3, political: 0.2, humanitarian: 0.2, economic: 0.15, social: 0.15 };
  const composite = Math.round(
    security.score * weights.security +
    political.score * weights.political +
    humanitarian.score * weights.humanitarian +
    economic.score * weights.economic +
    social.score * weights.social
  );

  return {
    composite: Math.min(100, composite),
    confidence: sources.length >= 3 ? 'high' : sources.length >= 2 ? 'medium' : 'low',
    dimensions: { security, political, humanitarian, economic, social },
    dataSources: [...new Set(sources)],
    assessedAt: new Date().toISOString(),
    ...(informComponents ? { informComponents } : {}),
  };
}
