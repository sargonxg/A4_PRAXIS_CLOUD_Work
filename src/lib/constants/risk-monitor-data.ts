// ─────────────────────────────────────────────────────────────────────────────
// Risk Monitor Data — PRAXIS Conflict Intelligence Platform
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = 'critical' | 'high' | 'elevated' | 'moderate' | 'low';
export type EscalationTrend = 'escalating' | 'stable' | 'de-escalating';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface MonitoredRegion {
  id: string;
  name: string;
  riskScore: number;
  riskLevel: RiskLevel;
  glaslStage: number;
  escalationTrend: EscalationTrend;
  subScores: {
    political: number;
    armed: number;
    humanitarian: number;
    economic: number;
    displacement: number;
  };
  keyIndicators: {
    label: string;
    value: string;
    trend: TrendDirection;
  }[];
  forecast30Day: string;
  coordinates: { x: number; y: number };
}

export interface RiskTimelinePoint {
  day: number;
  actual?: number;
  forecast?: number;
  confidenceLow?: number;
  confidenceHigh?: number;
  event?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Monitored Regions
// ─────────────────────────────────────────────────────────────────────────────

export const MONITORED_REGIONS: MonitoredRegion[] = [
  {
    id: 'nordalia',
    name: 'Nordalia',
    riskScore: 87,
    riskLevel: 'critical',
    glaslStage: 6,
    escalationTrend: 'escalating',
    subScores: {
      political: 91,
      armed: 84,
      humanitarian: 88,
      economic: 79,
      displacement: 85,
    },
    keyIndicators: [
      { label: 'Ceasefire violations (7d)', value: '47', trend: 'up' },
      { label: 'IDP movements', value: '124,000', trend: 'up' },
      { label: 'Diplomatic channels active', value: '2 of 5', trend: 'down' },
      { label: 'Cross-border shelling', value: '18 incidents', trend: 'up' },
      { label: 'Humanitarian access', value: '31% denied', trend: 'up' },
    ],
    forecast30Day:
      'High probability of further escalation as threat strategies intensify. UNSC emergency session likely within 10 days if current trajectory holds; humanitarian corridor negotiations remain the most viable de-escalation pathway.',
    coordinates: { x: 0, y: 0 },
  },
  {
    id: 'sahel-corridor',
    name: 'Sahel Corridor',
    riskScore: 76,
    riskLevel: 'high',
    glaslStage: 5,
    escalationTrend: 'escalating',
    subScores: {
      political: 72,
      armed: 81,
      humanitarian: 79,
      economic: 68,
      displacement: 77,
    },
    keyIndicators: [
      { label: 'Armed group attacks (30d)', value: '63', trend: 'up' },
      { label: 'Food insecurity (IPC 3+)', value: '8.2M people', trend: 'up' },
      { label: 'Foreign military presence', value: 'Declining', trend: 'down' },
      { label: 'Inter-communal clashes', value: '14 incidents', trend: 'stable' },
    ],
    forecast30Day:
      'Governance vacuums following military withdrawals continue to empower non-state armed groups. Rainy season may temporarily reduce movement but deepen food insecurity across the tri-border area.',
    coordinates: { x: 1, y: 0 },
  },
  {
    id: 'horn-of-africa',
    name: 'Horn of Africa',
    riskScore: 72,
    riskLevel: 'high',
    glaslStage: 4,
    escalationTrend: 'stable',
    subScores: {
      political: 75,
      armed: 68,
      humanitarian: 82,
      economic: 61,
      displacement: 74,
    },
    keyIndicators: [
      { label: 'Peace agreement compliance', value: '58%', trend: 'stable' },
      { label: 'Refugee flows', value: '2.1M', trend: 'stable' },
      { label: 'Drought severity index', value: 'Severe', trend: 'up' },
      { label: 'Political detentions', value: '340+', trend: 'down' },
    ],
    forecast30Day:
      'Fragile stabilization holding but drought conditions threaten to reignite resource competition. Coalition-building among opposition factions introduces new unpredictability to the political landscape.',
    coordinates: { x: 2, y: 0 },
  },
  {
    id: 'myanmar',
    name: 'Myanmar',
    riskScore: 82,
    riskLevel: 'critical',
    glaslStage: 7,
    escalationTrend: 'escalating',
    subScores: {
      political: 88,
      armed: 91,
      humanitarian: 85,
      economic: 72,
      displacement: 80,
    },
    keyIndicators: [
      { label: 'Resistance offensives', value: '12 active fronts', trend: 'up' },
      { label: 'Civilian casualties (30d)', value: '480+', trend: 'up' },
      { label: 'IDPs since coup', value: '2.6M', trend: 'up' },
      { label: 'Territory under junta control', value: '~45%', trend: 'down' },
      { label: 'Cross-border refugee flows', value: '78,000/month', trend: 'up' },
    ],
    forecast30Day:
      'Junta losing territorial control at accelerating rate; limited destructive blow strategies including airstrikes on civilian areas intensifying. International mediation remains blocked by ASEAN internal divisions.',
    coordinates: { x: 3, y: 0 },
  },
  {
    id: 'eastern-europe',
    name: 'Eastern Europe',
    riskScore: 58,
    riskLevel: 'elevated',
    glaslStage: 3,
    escalationTrend: 'stable',
    subScores: {
      political: 65,
      armed: 42,
      humanitarian: 48,
      economic: 71,
      displacement: 52,
    },
    keyIndicators: [
      { label: 'Border provocations (30d)', value: '8', trend: 'stable' },
      { label: 'Disinformation campaigns', value: 'High volume', trend: 'up' },
      { label: 'NATO readiness level', value: 'Enhanced', trend: 'stable' },
      { label: 'Economic sanctions impact', value: 'Moderate', trend: 'stable' },
    ],
    forecast30Day:
      'Frozen conflict dynamics persist with periodic provocations below escalation thresholds. Diplomatic back-channels active but no breakthrough expected; economic pressure remains primary Western leverage tool.',
    coordinates: { x: 0, y: 1 },
  },
  {
    id: 'south-china-sea',
    name: 'South China Sea',
    riskScore: 52,
    riskLevel: 'elevated',
    glaslStage: 2,
    escalationTrend: 'stable',
    subScores: {
      political: 61,
      armed: 48,
      humanitarian: 22,
      economic: 67,
      displacement: 18,
    },
    keyIndicators: [
      { label: 'Maritime incidents (30d)', value: '6', trend: 'stable' },
      { label: 'Military exercises', value: '3 concurrent', trend: 'up' },
      { label: 'UNCLOS arbitration filings', value: '2 pending', trend: 'stable' },
      { label: 'Freedom of navigation ops', value: '4 this quarter', trend: 'stable' },
    ],
    forecast30Day:
      'Tensions remain in debate-and-polemic phase with periodic maritime confrontations. Upcoming ASEAN summit may produce new code-of-conduct framework, though enforcement mechanisms remain elusive.',
    coordinates: { x: 1, y: 1 },
  },
  {
    id: 'central-america',
    name: 'Central America',
    riskScore: 45,
    riskLevel: 'moderate',
    glaslStage: 3,
    escalationTrend: 'de-escalating',
    subScores: {
      political: 48,
      armed: 38,
      humanitarian: 52,
      economic: 55,
      displacement: 41,
    },
    keyIndicators: [
      { label: 'Organized crime homicides', value: '-12% QoQ', trend: 'down' },
      { label: 'Migration flows (northbound)', value: '45,000/month', trend: 'down' },
      { label: 'Governance index', value: '42/100', trend: 'up' },
      { label: 'Anti-corruption convictions', value: '23 this quarter', trend: 'up' },
    ],
    forecast30Day:
      'Continued de-escalation trend driven by bilateral security cooperation and reduced cartel territorial disputes. Economic development programs showing early impact on root causes of instability.',
    coordinates: { x: 2, y: 1 },
  },
  {
    id: 'middle-east',
    name: 'Middle East',
    riskScore: 69,
    riskLevel: 'high',
    glaslStage: 5,
    escalationTrend: 'escalating',
    subScores: {
      political: 74,
      armed: 72,
      humanitarian: 78,
      economic: 58,
      displacement: 63,
    },
    keyIndicators: [
      { label: 'Proxy engagements (30d)', value: '28', trend: 'up' },
      { label: 'Civilian casualties', value: '1,200+', trend: 'up' },
      { label: 'Humanitarian aid blocked', value: '41%', trend: 'up' },
      { label: 'Diplomatic normalization', value: 'Stalled', trend: 'down' },
    ],
    forecast30Day:
      'Multi-front escalation risk rising as proxy warfare intensifies and normalization diplomacy stalls. Loss-of-face dynamics hardening positions; UN envoy shuttle diplomacy offers narrow window for de-escalation.',
    coordinates: { x: 3, y: 1 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Risk Timeline Data (120 days: 90 historical + 30 forecast)
// ─────────────────────────────────────────────────────────────────────────────

const TIMELINE_EVENTS: Record<number, string> = {
  15: 'Border incident',
  42: 'Ceasefire signed',
  68: 'Humanitarian corridor opened',
  85: 'Escalation spike',
};

function generateRiskTimeline(): RiskTimelinePoint[] {
  const points: RiskTimelinePoint[] = [];

  // Seed-based deterministic pseudo-random for reproducibility
  const noise = (day: number, offset: number = 0): number => {
    const x = Math.sin((day + offset) * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  // Historical data: days 1-90
  const baseRisk = 55;
  for (let day = 1; day <= 90; day++) {
    // General upward trend with event-driven variation
    const trendComponent = (day / 90) * 28; // 55 → ~83 base trend
    const variation = (noise(day) - 0.5) * 8; // ±4 noise

    // Event-driven adjustments
    let eventAdjust = 0;
    if (day >= 42 && day < 55) {
      eventAdjust = -8 + (day - 42) * 0.6; // Ceasefire dip then recovery
    }
    if (day >= 85) {
      eventAdjust += (day - 84) * 1.5; // Escalation spike
    }
    if (day >= 15 && day < 25) {
      eventAdjust += 4 - (day - 15) * 0.4; // Border incident bump
    }
    if (day >= 68 && day < 78) {
      eventAdjust -= 3 - (day - 68) * 0.3; // Corridor slight relief
    }

    const score = Math.min(100, Math.max(0, Math.round(baseRisk + trendComponent + variation + eventAdjust)));

    const point: RiskTimelinePoint = {
      day,
      actual: score,
    };

    if (TIMELINE_EVENTS[day]) {
      point.event = TIMELINE_EVENTS[day];
    }

    points.push(point);
  }

  // Forecast data: days 91-120
  const lastActual = points[points.length - 1].actual ?? 83;
  for (let day = 91; day <= 120; day++) {
    const daysOut = day - 90;
    const trendContinuation = lastActual + (daysOut / 30) * 4; // Slight continued rise
    const forecastVariation = (noise(day, 100) - 0.5) * 6;
    const forecastScore = Math.min(100, Math.max(0, Math.round(trendContinuation + forecastVariation)));

    // Confidence band widens with distance
    const bandWidth = 8 + (daysOut / 30) * 4; // 8 → 12

    points.push({
      day,
      forecast: forecastScore,
      confidenceLow: Math.max(0, Math.round(forecastScore - bandWidth)),
      confidenceHigh: Math.min(100, Math.round(forecastScore + bandWidth)),
    });
  }

  return points;
}

export const RISK_TIMELINE_DATA: RiskTimelinePoint[] = generateRiskTimeline();
