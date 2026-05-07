export interface ScenarioParams {
  ceasefireCompliance: number;        // 0=total collapse, 100=full compliance
  externalIntervention: number;       // 0=none, 100=full-scale military
  economicPressure: number;           // 0=none, 100=comprehensive sanctions
  humanitarianAccess: number;         // 0=blocked, 100=full access
  mediaEnvironment: number;           // 0=shutdown, 100=fully open
  domesticPoliticalStability: number; // 0=regime collapse, 100=stable
  regionalContagionRisk: number;      // 0=isolated, 100=spillover
  diplomaticEngagement: number;       // 0=disengaged, 100=intensive
}

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  riskDirection: 'up' | 'down' | 'neutral';
  probability: number; // 0-100 estimate
  params: ScenarioParams;
  outcomes: {
    best: { probability: number; summary: string; riskDelta: number };
    base: { probability: number; summary: string; riskDelta: number };
    worst: { probability: number; summary: string; riskDelta: number };
  };
}

export const DEFAULT_PARAMS: ScenarioParams = {
  ceasefireCompliance: 50,
  externalIntervention: 0,
  economicPressure: 25,
  humanitarianAccess: 75,
  mediaEnvironment: 65,
  domesticPoliticalStability: 60,
  regionalContagionRisk: 30,
  diplomaticEngagement: 50,
};

export const PARAM_METADATA: Record<
  keyof ScenarioParams,
  { label: string; tooltip: string; lowLabel: string; highLabel: string }
> = {
  ceasefireCompliance: {
    label: 'Ceasefire Compliance',
    tooltip:
      'Degree to which parties are adhering to existing ceasefire arrangements. Based on UCDP-coded ceasefire violation events and monitoring mission reports.',
    lowLabel: 'Total collapse',
    highLabel: 'Full compliance',
  },
  externalIntervention: {
    label: 'External Military Intervention',
    tooltip:
      'Scale of foreign military involvement by third parties. Ranges from diplomatic support to full-scale military deployment.',
    lowLabel: 'None',
    highLabel: 'Full-scale',
  },
  economicPressure: {
    label: 'Economic Pressure / Sanctions',
    tooltip:
      'Intensity of economic measures including sanctions regimes, trade restrictions, and aid conditionality.',
    lowLabel: 'None',
    highLabel: 'Comprehensive',
  },
  humanitarianAccess: {
    label: 'Humanitarian Access',
    tooltip:
      'Degree to which humanitarian actors can reach affected populations. Draws on OCHA and ReliefWeb access reports.',
    lowLabel: 'Blocked',
    highLabel: 'Full access',
  },
  mediaEnvironment: {
    label: 'Media Environment',
    tooltip:
      'Openness of the information environment for journalists and civil society. Affects accountability and narrative dynamics.',
    lowLabel: 'Shutdown',
    highLabel: 'Fully open',
  },
  domesticPoliticalStability: {
    label: 'Domestic Political Stability',
    tooltip:
      'Internal political cohesion of the primary government. Draws on WGI Political Stability indicator.',
    lowLabel: 'Regime collapse',
    highLabel: 'Stable',
  },
  regionalContagionRisk: {
    label: 'Regional Contagion Risk',
    tooltip:
      'Likelihood of conflict spreading to neighboring states. Based on border incidents, refugee flows, and proxy network activity.',
    lowLabel: 'Isolated',
    highLabel: 'Full spillover',
  },
  diplomaticEngagement: {
    label: 'International Diplomatic Engagement',
    tooltip:
      'Intensity of international diplomatic activity. Includes UN Security Council attention, special envoy deployment, and peace process momentum.',
    lowLabel: 'Disengaged',
    highLabel: 'Intensive',
  },
};

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  // ─── Original 5 (migrated to numeric params) ──────────────────────────────
  {
    id: 'ceasefire-collapse',
    name: 'Ceasefire Collapse',
    description: 'What if the September ceasefire fails?',
    riskDirection: 'up',
    probability: 35,
    params: {
      ceasefireCompliance: 10,
      externalIntervention: 20,
      economicPressure: 70,
      humanitarianAccess: 10,
      mediaEnvironment: 30,
      domesticPoliticalStability: 25,
      regionalContagionRisk: 40,
      diplomaticEngagement: 20,
    },
    outcomes: {
      best: {
        probability: 15,
        summary:
          'Emergency mediation session reconvenes within 48 hours, new ceasefire negotiated with strengthened verification mechanisms under AUNM oversight',
        riskDelta: -5,
      },
      base: {
        probability: 45,
        summary:
          'Localized escalation in Eastern Marches, humanitarian crisis deepens with 40,000 additional displaced, international pressure mounts for UNSC emergency session',
        riskDelta: 15,
      },
      worst: {
        probability: 40,
        summary:
          'Full-scale resumption of hostilities, regional proxy intervention by Karovia, displacement doubles to 280,000, humanitarian corridors collapse entirely',
        riskDelta: 30,
      },
    },
  },
  {
    id: 'external-intervention',
    name: 'External Intervention',
    description: 'What if Karovia escalates military support to the EMLF?',
    riskDirection: 'up',
    probability: 25,
    params: {
      ceasefireCompliance: 50,
      externalIntervention: 90,
      economicPressure: 50,
      humanitarianAccess: 40,
      mediaEnvironment: 60,
      domesticPoliticalStability: 40,
      regionalContagionRisk: 70,
      diplomaticEngagement: 30,
    },
    outcomes: {
      best: {
        probability: 30,
        summary:
          'International coalition imposes targeted sanctions on Karovia, diplomatic isolation forces withdrawal of military advisors, EMLF returns to negotiations',
        riskDelta: -15,
      },
      base: {
        probability: 45,
        summary:
          'Proxy conflict intensifies but remains contained, AUNM mandate expanded with additional peacekeepers, parallel diplomatic track through regional forum yields partial ceasefire',
        riskDelta: 5,
      },
      worst: {
        probability: 25,
        summary:
          'Arms transfers escalate conflict to new phase, cross-border incidents trigger regional security crisis, AUNM personnel casualties force mandate review',
        riskDelta: 20,
      },
    },
  },
  {
    id: 'peace-process-acceleration',
    name: 'Peace Process Acceleration',
    description: 'What if Track II diplomacy yields a framework agreement?',
    riskDirection: 'down',
    probability: 20,
    params: {
      ceasefireCompliance: 80,
      externalIntervention: 10,
      economicPressure: 30,
      humanitarianAccess: 85,
      mediaEnvironment: 75,
      domesticPoliticalStability: 65,
      regionalContagionRisk: 20,
      diplomaticEngagement: 85,
    },
    outcomes: {
      best: {
        probability: 40,
        summary:
          'Comprehensive peace agreement signed within 6 months, power-sharing government formed, DDR program initiated with international support and mining revenue transparency mechanism',
        riskDelta: -20,
      },
      base: {
        probability: 40,
        summary:
          'Framework agreement holds but implementation stalls on DDR timeline and resource-sharing provisions, ceasefire maintained, confidence-building measures yield modest progress',
        riskDelta: 0,
      },
      worst: {
        probability: 20,
        summary:
          'Hardliners on both sides reject framework, spoiler violence undermines public confidence, Track II gains lost as political space narrows ahead of elections',
        riskDelta: 10,
      },
    },
  },
  {
    id: 'elite-fragmentation',
    name: 'Elite Fragmentation',
    description: 'What if ruling coalition fractures over resource sharing?',
    riskDirection: 'up',
    probability: 18,
    params: {
      ceasefireCompliance: 40,
      externalIntervention: 25,
      economicPressure: 55,
      humanitarianAccess: 45,
      mediaEnvironment: 35,
      domesticPoliticalStability: 15,
      regionalContagionRisk: 45,
      diplomaticEngagement: 30,
    },
    outcomes: {
      best: {
        probability: 25,
        summary:
          'Senior officials defect to opposition, triggering negotiated power-sharing arrangement that opens new diplomatic space and accelerates peace talks',
        riskDelta: -8,
      },
      base: {
        probability: 45,
        summary:
          'Government paralysis reduces coherent response capacity, military factions operate with greater autonomy, aid diversion increases, UNSC attention intensifies',
        riskDelta: 18,
      },
      worst: {
        probability: 30,
        summary:
          'Violent intra-elite struggle, parallel command structures trigger breakdown of existing ceasefire commitments, rapid escalation to full hostilities',
        riskDelta: 32,
      },
    },
  },
  {
    id: 'sanctions-escalation',
    name: 'Sanctions Escalation',
    description: 'What if the EU and US impose comprehensive sectoral sanctions?',
    riskDirection: 'neutral',
    probability: 22,
    params: {
      ceasefireCompliance: 45,
      externalIntervention: 15,
      economicPressure: 90,
      humanitarianAccess: 55,
      mediaEnvironment: 50,
      domesticPoliticalStability: 35,
      regionalContagionRisk: 35,
      diplomaticEngagement: 55,
    },
    outcomes: {
      best: {
        probability: 30,
        summary:
          'Sanctions create sufficient economic pain to compel regime to serious negotiations; humanitarian carve-outs preserve aid flows; agreement reached within 4 months',
        riskDelta: -10,
      },
      base: {
        probability: 45,
        summary:
          'Regime adapts through sanctions evasion networks, economic pain displaces to civilian population, opposition gains but no decisive shift in conflict dynamics',
        riskDelta: 8,
      },
      worst: {
        probability: 25,
        summary:
          'Sanctions accelerate economic collapse, civilian suffering spikes, regime doubles down on military solution, regional partners exploit sanctions to increase influence',
        riskDelta: 22,
      },
    },
  },

  // ─── 5 New Presets ────────────────────────────────────────────────────────
  {
    id: 'diplomatic-breakthrough',
    name: 'Diplomatic Breakthrough',
    description:
      'Rapid peace process acceleration — major power broker intervenes with credible guarantees',
    riskDirection: 'down',
    probability: 12,
    params: {
      ceasefireCompliance: 85,
      externalIntervention: 15,
      economicPressure: 20,
      humanitarianAccess: 90,
      mediaEnvironment: 80,
      domesticPoliticalStability: 70,
      regionalContagionRisk: 15,
      diplomaticEngagement: 95,
    },
    outcomes: {
      best: {
        probability: 40,
        summary:
          'Full ceasefire agreement signed within 30 days, international guarantors deploy verification mission',
        riskDelta: -25,
      },
      base: {
        probability: 45,
        summary:
          'Framework agreement on core principles, timeline for substantive talks, partial humanitarian openings',
        riskDelta: -10,
      },
      worst: {
        probability: 15,
        summary:
          'Diplomatic process fails, spoilers exploit momentum window, resumption of hostilities',
        riskDelta: 15,
      },
    },
  },
  {
    id: 'humanitarian-catastrophe',
    name: 'Humanitarian Catastrophe',
    description: 'Aid system collapse — access corridors severed, displacement doubles',
    riskDirection: 'up',
    probability: 18,
    params: {
      ceasefireCompliance: 20,
      externalIntervention: 30,
      economicPressure: 80,
      humanitarianAccess: 5,
      mediaEnvironment: 20,
      domesticPoliticalStability: 15,
      regionalContagionRisk: 60,
      diplomaticEngagement: 10,
    },
    outcomes: {
      best: {
        probability: 20,
        summary:
          'Emergency UNSC session authorizes humanitarian corridors under peacekeeping protection',
        riskDelta: -5,
      },
      base: {
        probability: 50,
        summary:
          'Famine conditions in besieged areas, regional displacement crisis, donor emergency appeal',
        riskDelta: 20,
      },
      worst: {
        probability: 30,
        summary:
          'Mass atrocity documentation, ICRC access suspended, regional refugee crisis triggers neighboring state instability',
        riskDelta: 40,
      },
    },
  },
  {
    id: 'power-transition',
    name: 'Power Transition',
    description:
      'Regime change scenario — incumbent government loses control of key institutions',
    riskDirection: 'up',
    probability: 10,
    params: {
      ceasefireCompliance: 30,
      externalIntervention: 40,
      economicPressure: 70,
      humanitarianAccess: 50,
      mediaEnvironment: 40,
      domesticPoliticalStability: 5,
      regionalContagionRisk: 55,
      diplomaticEngagement: 35,
    },
    outcomes: {
      best: {
        probability: 25,
        summary:
          'Negotiated transition with constitutional framework, inclusive transitional government, new elections within 18 months',
        riskDelta: -10,
      },
      base: {
        probability: 40,
        summary:
          'Contested succession, parallel governance structures, extended instability period, donor uncertainty',
        riskDelta: 15,
      },
      worst: {
        probability: 35,
        summary:
          'Military coup or factional civil war, complete state collapse, humanitarian emergency',
        riskDelta: 35,
      },
    },
  },
  {
    id: 'regional-contagion',
    name: 'Regional Contagion',
    description:
      'Conflict spreads to neighboring states — proxy networks activated, border incidents escalate',
    riskDirection: 'up',
    probability: 22,
    params: {
      ceasefireCompliance: 25,
      externalIntervention: 65,
      economicPressure: 50,
      humanitarianAccess: 35,
      mediaEnvironment: 45,
      domesticPoliticalStability: 30,
      regionalContagionRisk: 95,
      diplomaticEngagement: 25,
    },
    outcomes: {
      best: {
        probability: 20,
        summary:
          'Regional security framework mobilizes, collective response prevents further spread, joint ceasefire monitoring',
        riskDelta: 0,
      },
      base: {
        probability: 45,
        summary:
          'Cross-border shelling incidents, refugee flows destabilize two neighboring states, regional economic disruption',
        riskDelta: 20,
      },
      worst: {
        probability: 35,
        summary:
          'Full inter-state military confrontation, regional war, international peacekeeping force deployed',
        riskDelta: 45,
      },
    },
  },
  {
    id: 'frozen-conflict',
    name: 'Frozen Conflict',
    description:
      'Conflict becomes protracted stalemate — neither side can win, neither agrees to peace',
    riskDirection: 'neutral',
    probability: 28,
    params: {
      ceasefireCompliance: 55,
      externalIntervention: 30,
      economicPressure: 50,
      humanitarianAccess: 55,
      mediaEnvironment: 60,
      domesticPoliticalStability: 45,
      regionalContagionRisk: 30,
      diplomaticEngagement: 40,
    },
    outcomes: {
      best: {
        probability: 30,
        summary:
          'Low-intensity stalemate enables confidence-building, new mediation window opens in 12–18 months',
        riskDelta: -5,
      },
      base: {
        probability: 50,
        summary:
          'Protracted conflict continues 2–5 years, chronic humanitarian crisis, economic degradation, brain drain',
        riskDelta: 5,
      },
      worst: {
        probability: 20,
        summary:
          'Frozen conflict becomes permanent division, eventual resumption of full hostilities after resource depletion',
        riskDelta: 10,
      },
    },
  },
];
