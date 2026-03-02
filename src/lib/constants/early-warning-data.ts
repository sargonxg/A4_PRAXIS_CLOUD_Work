export interface MonitoredSituation {
  id: string;
  name: string;
  region: string;
  riskScore: number;
  trend: "escalating" | "stable" | "de-escalating";
  factors: {
    political: number;
    armed: number;
    humanitarian: number;
    economic: number;
    social: number;
  };
  recentTrigger: string;
  triggerDate: string;
  triggerSeverity: "critical" | "high" | "medium" | "low";
  riskHistory: number[];
}

export const monitoredSituations: MonitoredSituation[] = [
  {
    id: "sit-001",
    name: "Nordalia Crisis",
    region: "Eastern Europe",
    riskScore: 8.2,
    trend: "escalating",
    factors: { political: 8, armed: 9, humanitarian: 7, economic: 6, social: 5 },
    recentTrigger: "DRM forces seize Belara Province mining complex; government declares state of emergency",
    triggerDate: "Feb 28, 2026",
    triggerSeverity: "critical",
    riskHistory: [5.1, 5.4, 5.8, 6.2, 6.5, 6.9, 7.1, 7.5, 7.8, 8.0, 8.2],
  },
  {
    id: "sit-002",
    name: "Sudan Armed Conflict",
    region: "East Africa",
    riskScore: 9.1,
    trend: "escalating",
    factors: { political: 9, armed: 10, humanitarian: 9, economic: 8, social: 7 },
    recentTrigger: "RSF advance on El-Fasher; 200,000+ new displacements reported by OCHA",
    triggerDate: "Mar 1, 2026",
    triggerSeverity: "critical",
    riskHistory: [7.8, 8.0, 8.2, 8.5, 8.7, 8.8, 8.9, 9.0, 9.0, 9.1, 9.1],
  },
  {
    id: "sit-003",
    name: "Eastern DRC / M23",
    region: "Central Africa",
    riskScore: 7.8,
    trend: "escalating",
    factors: { political: 7, armed: 8, humanitarian: 8, economic: 5, social: 6 },
    recentTrigger: "M23 captures Sake; MONUSCO force commander calls for urgent reinforcement",
    triggerDate: "Feb 27, 2026",
    triggerSeverity: "high",
    riskHistory: [6.2, 6.4, 6.5, 6.8, 7.0, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8],
  },
  {
    id: "sit-004",
    name: "Sahel Security Deterioration",
    region: "West Africa",
    riskScore: 7.5,
    trend: "stable",
    factors: { political: 7, armed: 7, humanitarian: 6, economic: 8, social: 7 },
    recentTrigger: "Junta announces extended military rule; ECOWAS suspends deadline",
    triggerDate: "Feb 25, 2026",
    triggerSeverity: "medium",
    riskHistory: [7.2, 7.3, 7.4, 7.4, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5],
  },
  {
    id: "sit-005",
    name: "Yemen Conflict",
    region: "Middle East",
    riskScore: 6.8,
    trend: "de-escalating",
    factors: { political: 6, armed: 6, humanitarian: 8, economic: 7, social: 5 },
    recentTrigger: "Saudi-Houthi backchannel produces draft framework for prisoner exchange",
    triggerDate: "Feb 26, 2026",
    triggerSeverity: "low",
    riskHistory: [7.8, 7.6, 7.5, 7.4, 7.2, 7.1, 7.0, 6.9, 6.9, 6.8, 6.8],
  },
  {
    id: "sit-006",
    name: "Myanmar Civil War",
    region: "Southeast Asia",
    riskScore: 8.5,
    trend: "escalating",
    factors: { political: 9, armed: 9, humanitarian: 7, economic: 7, social: 8 },
    recentTrigger: "Resistance forces capture three townships in Shan State; junta deploys air strikes",
    triggerDate: "Mar 1, 2026",
    triggerSeverity: "high",
    riskHistory: [7.5, 7.6, 7.8, 7.9, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.5],
  },
  {
    id: "sit-007",
    name: "Haiti Gang Violence",
    region: "Caribbean",
    riskScore: 7.2,
    trend: "stable",
    factors: { political: 8, armed: 7, humanitarian: 7, economic: 8, social: 6 },
    recentTrigger: "MSS deployment delayed by 3 months; gang coalition expands territorial control",
    triggerDate: "Feb 24, 2026",
    triggerSeverity: "medium",
    riskHistory: [7.0, 7.1, 7.1, 7.2, 7.2, 7.2, 7.2, 7.2, 7.2, 7.2, 7.2],
  },
  {
    id: "sit-008",
    name: "Ethiopia-Eritrea Tensions",
    region: "Horn of Africa",
    riskScore: 5.8,
    trend: "de-escalating",
    factors: { political: 6, armed: 5, humanitarian: 5, economic: 4, social: 5 },
    recentTrigger: "Ethiopian PM visits Asmara; joint communiqué on border normalization",
    triggerDate: "Feb 28, 2026",
    triggerSeverity: "low",
    riskHistory: [7.2, 7.0, 6.8, 6.5, 6.3, 6.2, 6.1, 6.0, 5.9, 5.8, 5.8],
  },
];
