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
];

export function getCaseById(id: string): DemoCase | undefined {
  return DEMO_CASES.find((c) => c.id === id);
}
