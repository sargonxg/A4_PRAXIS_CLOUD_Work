/**
 * Multi-dimensional risk scoring engine
 * Computes composite risk from ACLED, GDELT, HDX, World Bank data
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
}

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

  // Political dimension (from GDELT stability)
  const political: RiskDimension = { name: 'Political', score: 30, evidence: [], sources: [], trend: 'stable' };
  if (params.stabilityScore !== undefined) {
    sources.push('GDELT');
    political.sources.push('GDELT Stability');
    political.score = Math.min(100, Math.round(params.stabilityScore * 15));
    political.evidence.push(`GDELT instability index: ${params.stabilityScore.toFixed(1)}`);
    political.trend = params.stabilityTrend === 'worsening' ? 'worsening' : params.stabilityTrend === 'improving' ? 'improving' : 'stable';
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
    sources.push('World Bank');
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

  // Composite
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
  };
}
