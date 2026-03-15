/**
 * Conflict-specific curated media and research resources.
 * Real institutional URLs for professional research workflows.
 */

export interface ConflictMediaResource {
  name: string;
  url: string;
  type: 'wire' | 'outlet' | 'think_tank' | 'un_agency' | 'regional_org' | 'data' | 'ngo';
  description: string;
  region: string;
  biasNote?: string;
}

export interface ConflictResearchKit {
  conflictId: string;
  conflictName: string;
  primarySources: ConflictMediaResource[];
  analyticalSources: ConflictMediaResource[];
  institutionalSources: ConflictMediaResource[];
  dataSources: ConflictMediaResource[];
}

export const CONFLICT_RESEARCH_KITS: ConflictResearchKit[] = [
  {
    conflictId: 'ukraine-russia',
    conflictName: 'Ukraine-Russia Conflict',
    primarySources: [
      { name: 'Reuters Ukraine', url: 'https://www.reuters.com/world/europe/', type: 'wire', description: 'Wire service coverage of European affairs including Ukraine', region: 'Global' },
      { name: 'AP News Ukraine', url: 'https://apnews.com/hub/russia-ukraine', type: 'wire', description: 'Associated Press dedicated hub for conflict coverage', region: 'Global' },
      { name: 'Kyiv Independent', url: 'https://kyivindependent.com', type: 'outlet', description: 'English-language Ukrainian investigative outlet', region: 'Ukraine' },
      { name: 'Meduza', url: 'https://meduza.io/en', type: 'outlet', description: 'Independent Russian journalism in exile (Latvia)', region: 'Russia (exile)' },
      { name: 'Ukrinform', url: 'https://www.ukrinform.net', type: 'outlet', description: 'Official Ukrainian national news agency', region: 'Ukraine', biasNote: 'State-owned, government-aligned' },
    ],
    analyticalSources: [
      { name: 'ISW', url: 'https://www.understandingwar.org', type: 'think_tank', description: 'Daily campaign assessments and interactive maps', region: 'United States' },
      { name: 'RUSI', url: 'https://rusi.org/explore-our-research/publications', type: 'think_tank', description: 'Defence and security research institute', region: 'United Kingdom' },
      { name: 'ICG Ukraine', url: 'https://www.crisisgroup.org/europe-central-asia/eastern-europe/ukraine', type: 'think_tank', description: 'International Crisis Group policy analysis', region: 'Belgium' },
      { name: 'IISS', url: 'https://www.iiss.org', type: 'think_tank', description: 'Strategic studies and military balance assessments', region: 'United Kingdom' },
      { name: 'Carnegie Endowment', url: 'https://carnegieendowment.org/regions/europe', type: 'think_tank', description: 'Policy research on Russia-Europe relations', region: 'United States' },
    ],
    institutionalSources: [
      { name: 'UN OHCHR Ukraine', url: 'https://www.ohchr.org/en/countries/ukraine', type: 'un_agency', description: 'Civilian casualty figures and human rights monitoring', region: 'International' },
      { name: 'IAEA Ukraine', url: 'https://www.iaea.org/ukraine-conflict', type: 'un_agency', description: 'Nuclear facility monitoring and safety updates', region: 'International' },
      { name: 'ICC Situation Ukraine', url: 'https://www.icc-cpi.int/ukraine', type: 'un_agency', description: 'International Criminal Court proceedings', region: 'International' },
      { name: 'OSCE', url: 'https://www.osce.org', type: 'regional_org', description: 'Moscow Mechanism reports and election observation', region: 'Europe' },
    ],
    dataSources: [
      { name: 'ACLED Ukraine', url: 'https://acleddata.com', type: 'data', description: 'Conflict event data with geolocation', region: 'Global' },
      { name: 'UCDP', url: 'https://ucdp.uu.se', type: 'data', description: 'Uppsala Conflict Data Program — battle-related deaths', region: 'Global' },
      { name: 'IOM DTM', url: 'https://dtm.iom.int', type: 'data', description: 'Displacement tracking and mobility data', region: 'Global' },
      { name: 'UNHCR Data', url: 'https://data.unhcr.org/en/situations/ukraine', type: 'data', description: 'Refugee and displacement statistics', region: 'Global' },
    ],
  },
  {
    conflictId: 'sudan-crisis',
    conflictName: 'Sudan Armed Conflict',
    primarySources: [
      { name: 'Sudan Tribune', url: 'https://sudantribune.com', type: 'outlet', description: 'Independent Sudanese news from Paris', region: 'Sudan (exile)' },
      { name: 'Radio Dabanga', url: 'https://www.dabangasudan.org', type: 'outlet', description: 'Independent reporting focused on Darfur and marginalized areas', region: 'Sudan (exile)' },
      { name: 'Reuters Africa', url: 'https://www.reuters.com/world/africa/', type: 'wire', description: 'Wire service Africa desk', region: 'Global' },
      { name: 'AFP Africa', url: 'https://www.afp.com', type: 'wire', description: 'Agence France-Presse — strong francophone Africa coverage', region: 'Global' },
    ],
    analyticalSources: [
      { name: 'ICG Sudan', url: 'https://www.crisisgroup.org/africa/horn-africa/sudan', type: 'think_tank', description: 'In-depth Sudan conflict analysis and policy recommendations', region: 'Belgium' },
      { name: 'SIPRI', url: 'https://www.sipri.org', type: 'think_tank', description: 'Arms flows, military expenditure, and peace operations data', region: 'Sweden' },
      { name: 'Rift Valley Institute', url: 'https://riftvalley.net', type: 'think_tank', description: 'East Africa and Horn research institute', region: 'Kenya' },
      { name: 'Chatham House Africa', url: 'https://www.chathamhouse.org/regions/africa', type: 'think_tank', description: 'Policy research on African governance and security', region: 'United Kingdom' },
    ],
    institutionalSources: [
      { name: 'OCHA Sudan', url: 'https://www.unocha.org/sudan', type: 'un_agency', description: 'Humanitarian situation reports and flash updates', region: 'International' },
      { name: 'UNHCR Sudan', url: 'https://data.unhcr.org/en/situations/sudansituation', type: 'un_agency', description: 'Refugee data and cross-border displacement', region: 'International' },
      { name: 'AU Peace & Security', url: 'https://au.int/en/organs/psc', type: 'regional_org', description: 'African Union Peace and Security Council communiques', region: 'Africa' },
      { name: 'IGAD', url: 'https://igad.int', type: 'regional_org', description: 'Regional mediation and early warning', region: 'East Africa' },
    ],
    dataSources: [
      { name: 'ACLED Sudan', url: 'https://acleddata.com', type: 'data', description: 'Conflict event tracking across Sudan', region: 'Global' },
      { name: 'IPC Food Security', url: 'https://www.ipcinfo.org', type: 'data', description: 'Integrated Phase Classification — famine monitoring', region: 'Global' },
      { name: 'IOM DTM Sudan', url: 'https://dtm.iom.int/sudan', type: 'data', description: 'Internal displacement tracking', region: 'Global' },
      { name: 'ReliefWeb', url: 'https://reliefweb.int/country/sdn', type: 'data', description: 'Humanitarian information portal', region: 'Global' },
    ],
  },
  {
    conflictId: 'nordalia',
    conflictName: 'Nordalia Crisis (Demo)',
    primarySources: [
      { name: 'Reuters', url: 'https://www.reuters.com', type: 'wire', description: 'International wire service baseline reporting', region: 'Global' },
      { name: 'AP News', url: 'https://apnews.com', type: 'wire', description: 'Associated Press global coverage', region: 'Global' },
      { name: 'AFP', url: 'https://www.afp.com', type: 'wire', description: 'Agence France-Presse', region: 'Global' },
    ],
    analyticalSources: [
      { name: 'International Crisis Group', url: 'https://www.crisisgroup.org', type: 'think_tank', description: 'Conflict analysis and policy recommendations', region: 'Belgium' },
      { name: 'SIPRI', url: 'https://www.sipri.org', type: 'think_tank', description: 'Arms and conflict data', region: 'Sweden' },
    ],
    institutionalSources: [
      { name: 'UN Peacekeeping', url: 'https://peacekeeping.un.org', type: 'un_agency', description: 'UN peacekeeping operations data', region: 'International' },
      { name: 'ReliefWeb', url: 'https://reliefweb.int', type: 'un_agency', description: 'Humanitarian information service', region: 'International' },
    ],
    dataSources: [
      { name: 'ACLED', url: 'https://acleddata.com', type: 'data', description: 'Armed conflict event data', region: 'Global' },
      { name: 'UCDP', url: 'https://ucdp.uu.se', type: 'data', description: 'Uppsala Conflict Data Program', region: 'Global' },
    ],
  },
];

export function getResearchKit(conflictId: string): ConflictResearchKit | undefined {
  return CONFLICT_RESEARCH_KITS.find((k) => k.conflictId === conflictId);
}
