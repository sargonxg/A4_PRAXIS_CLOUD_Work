export interface DemoCase {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'frozen' | 'resolved' | 'escalating';
  startYear: number;
  endYear?: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  actorCount: number;
  eventCount: number;
  keyThemes: string[];
  institutions: string[];
  primaryConflictType: string;
  summaryPrompt: string;
}

export const DEMO_CASES: DemoCase[] = [
  {
    id: 'nordalia',
    name: 'Nordalia Crisis',
    region: 'East Africa',
    status: 'active',
    startYear: 2021,
    description:
      'Armed conflict between the Government of Nordalia and the Democratic Reform Movement (DRM) over eastern provincial autonomy and resource control. UN peacekeeping mission (UNMN) deployed.',
    riskLevel: 'high',
    actorCount: 7,
    eventCount: 24,
    keyThemes: ['Resource conflict', 'Autonomy dispute', 'Peacekeeping', 'Regional proxy dynamics'],
    institutions: ['UNSC', 'AU PSC', 'IGAD'],
    primaryConflictType: 'Internal armed conflict with regional dimensions',
    summaryPrompt: 'Analyze the Nordalia Crisis including the Government-DRM armed conflict, UNMN peacekeeping mission, Karovian proxy involvement, and current ceasefire status.',
  },
  {
    id: 'sahel',
    name: 'Sahel Security Complex',
    region: 'West Africa / Sahel',
    status: 'escalating',
    startYear: 2012,
    description:
      'Multi-state security crisis across Mali, Burkina Faso, Niger, and Chad involving jihadist insurgencies, military coups, MINUSMA withdrawal, and governance collapse.',
    riskLevel: 'critical',
    actorCount: 14,
    eventCount: 87,
    keyThemes: ['Counter-terrorism', 'Governance failure', 'Coup dynamics', 'Jihadist expansion'],
    institutions: ['ECOWAS', 'AU PSC', 'UN DPO', 'G5 Sahel'],
    primaryConflictType: 'Regional insurgency and state fragility',
    summaryPrompt: 'Analyze the Sahel Security Complex including jihadist expansion post-MINUSMA withdrawal, military coups in Mali/Burkina Faso/Niger, and ECOWAS response.',
  },
  {
    id: 'scs',
    name: 'South China Sea Disputes',
    region: 'Indo-Pacific',
    status: 'frozen',
    startYear: 2009,
    description:
      'Overlapping maritime territorial claims between China, Vietnam, Philippines, Malaysia, Brunei, and Taiwan. Militarization of artificial islands, UNCLOS arbitration, and ASEAN deadlock.',
    riskLevel: 'high',
    actorCount: 8,
    eventCount: 41,
    keyThemes: ['Maritime law', 'UNCLOS', 'Territorial claims', 'Great power competition'],
    institutions: ['ASEAN', 'UNCLOS Tribunal', 'QUAD'],
    primaryConflictType: 'Interstate maritime territorial dispute',
    summaryPrompt: 'Analyze the South China Sea territorial disputes including Chinese artificial island construction, PCA ruling, UNCLOS claims, and ASEAN diplomatic dynamics.',
  },
  {
    id: 'colombia',
    name: 'Colombia Peace Process',
    region: 'Latin America',
    status: 'active',
    startYear: 2016,
    description:
      'Implementation of the 2016 Havana Peace Agreement between the Colombian government and FARC-EP. Challenges include dissident factions (FARC dissidents, ELN), land reform, and transitional justice.',
    riskLevel: 'medium',
    actorCount: 9,
    eventCount: 53,
    keyThemes: ['DDR', 'Transitional justice', 'Land reform', 'Coca economy', 'Dissidents'],
    institutions: ['UN Verification Mission', 'JEP', 'FARC', 'OAS'],
    primaryConflictType: 'Peace process implementation',
    summaryPrompt: 'Analyze the Colombia peace process implementation including FARC reintegration, dissident faction dynamics, JEP transitional justice, and ELN negotiations.',
  },
  {
    id: 'cyprus',
    name: 'Cyprus Reunification',
    region: 'Eastern Mediterranean',
    status: 'frozen',
    startYear: 1974,
    description:
      'Divided island following 1974 Turkish military intervention. UN buffer zone (UNFICYP), bi-communal talks, EU membership complications, hydrocarbon disputes.',
    riskLevel: 'medium',
    actorCount: 6,
    eventCount: 19,
    keyThemes: ['Frozen conflict', 'EU integration', 'UN good offices', 'Hydrocarbon rights', 'Reunification'],
    institutions: ['UN SRSG', 'UNFICYP', 'EU', 'Conference on Cyprus'],
    primaryConflictType: 'Frozen territorial division',
    summaryPrompt: 'Analyze the Cyprus reunification impasse including UN good offices process, bi-communal tensions, Turkish Cypriot positions, and Eastern Mediterranean hydrocarbon disputes.',
  },
  {
    id: 'kolari-borders',
    name: 'Kolari-Barantum Border Dispute',
    region: 'Central Africa',
    status: 'frozen',
    startYear: 2018,
    description:
      'Frozen territorial conflict over mineral-rich border region between Kolari and Barantum. ICJ proceedings ongoing since 2022. Low-level incidents continue despite formal ceasefire established under AU mediation.',
    riskLevel: 'low',
    actorCount: 4,
    eventCount: 12,
    keyThemes: ['Border Dispute', 'Natural Resources', 'Frozen Conflict', 'ICJ Proceedings', 'AU Mediation'],
    institutions: ['AU', 'ICJ'],
    primaryConflictType: 'Interstate border and resource dispute',
    summaryPrompt: 'Analyze the Kolari-Barantum border dispute including the origins of the territorial conflict, mineral resource dimensions, AU mediation efforts, ICJ proceedings, and current ceasefire status.',
  },
  {
    id: 'meldova-1991',
    name: 'Meldova Civil War (Historical)',
    region: 'Eastern Europe',
    status: 'resolved',
    startYear: 1992,
    endYear: 1997,
    description:
      'Historical case study: civil war resolved through comprehensive peace agreement brokered by OSCE. Post-conflict reconstruction involved EU stabilization funds and UN transitional justice mechanisms. Widely studied as a successful negotiated settlement.',
    riskLevel: 'low',
    actorCount: 5,
    eventCount: 89,
    keyThemes: ['Civil War', 'Peace Agreement', 'Post-Conflict Reconstruction', 'OSCE Mediation', 'Transitional Justice'],
    institutions: ['OSCE', 'UN', 'EU'],
    primaryConflictType: 'Internal armed conflict — resolved',
    summaryPrompt: 'Analyze the Meldova Civil War (1992–1997) as a historical case study in negotiated peace: the conflict origins, warring factions, OSCE mediation process, final peace agreement, and post-conflict reconstruction outcomes.',
  },
];

export function getCaseById(id: string): DemoCase | undefined {
  return DEMO_CASES.find((c) => c.id === id);
}
