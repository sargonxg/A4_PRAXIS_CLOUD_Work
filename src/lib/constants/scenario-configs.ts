export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  params: {
    ceasefireCompliance: number;
    externalIntervention: 'none' | 'diplomatic' | 'military';
    economicPressure: 'low' | 'medium' | 'high' | 'sanctions';
    humanitarianAccess: 'full' | 'partial' | 'blocked';
    mediaEnvironment: 'open' | 'restricted' | 'shutdown';
    timelineHorizon: 30 | 60 | 90 | 180;
  };
  outcomes: {
    best: { probability: number; summary: string; riskDelta: number };
    base: { probability: number; summary: string; riskDelta: number };
    worst: { probability: number; summary: string; riskDelta: number };
  };
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'ceasefire-collapse',
    name: 'Ceasefire Collapse',
    description: 'What if the September ceasefire fails?',
    params: {
      ceasefireCompliance: 10,
      externalIntervention: 'none',
      economicPressure: 'high',
      humanitarianAccess: 'blocked',
      mediaEnvironment: 'restricted',
      timelineHorizon: 90,
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
    params: {
      ceasefireCompliance: 50,
      externalIntervention: 'military',
      economicPressure: 'medium',
      humanitarianAccess: 'partial',
      mediaEnvironment: 'open',
      timelineHorizon: 180,
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
    id: 'humanitarian-crisis',
    name: 'Humanitarian Crisis',
    description: 'What if humanitarian access is completely cut off?',
    params: {
      ceasefireCompliance: 35,
      externalIntervention: 'diplomatic',
      economicPressure: 'high',
      humanitarianAccess: 'blocked',
      mediaEnvironment: 'restricted',
      timelineHorizon: 60,
    },
    outcomes: {
      best: {
        probability: 20,
        summary:
          'UNSC Resolution 2847 mandates humanitarian corridors with Chapter VII enforcement, cross-line access restored within 2 weeks under international monitoring',
        riskDelta: -10,
      },
      base: {
        probability: 50,
        summary:
          'Partial access negotiated through backchannel with EMLF, OCHA activates Level 3 emergency, food insecurity reaches IPC Phase 4 in Eastern Marches affecting 120,000 civilians',
        riskDelta: 10,
      },
      worst: {
        probability: 30,
        summary:
          'Complete humanitarian blockade, famine conditions declared in three provinces, mass displacement toward Sertanian border triggers refugee crisis and regional destabilization',
        riskDelta: 25,
      },
    },
  },
  {
    id: 'peace-breakthrough',
    name: 'Peace Breakthrough',
    description: 'What if Track II diplomacy yields a framework agreement?',
    params: {
      ceasefireCompliance: 75,
      externalIntervention: 'diplomatic',
      economicPressure: 'low',
      humanitarianAccess: 'full',
      mediaEnvironment: 'open',
      timelineHorizon: 180,
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
];
