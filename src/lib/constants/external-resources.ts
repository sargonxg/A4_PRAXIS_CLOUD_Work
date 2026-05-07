/**
 * Curated external resources for conflict intelligence research.
 * Real institutional URLs categorized by type and region.
 */

export interface ExternalResource {
  name: string;
  url: string;
  category: 'un_system' | 'regional_org' | 'think_tank' | 'data_platform' | 'legal' | 'humanitarian';
  description: string;
  tags: string[];
}

export const EXTERNAL_RESOURCES: ExternalResource[] = [
  // UN System
  { name: 'ReliefWeb', url: 'https://reliefweb.int', category: 'un_system', description: 'OCHA humanitarian information portal — situation reports, maps, and analysis from the global humanitarian community', tags: ['humanitarian', 'global', 'situation reports'] },
  { name: 'UN Documents', url: 'https://documents.un.org', category: 'un_system', description: 'Official UN document system — resolutions, reports, meeting records across all organs', tags: ['legal', 'resolutions', 'global'] },
  { name: 'UN Peacekeeping', url: 'https://peacekeeping.un.org', category: 'un_system', description: 'Current peacekeeping operations, mandate information, and troop data', tags: ['peacekeeping', 'military', 'global'] },
  { name: 'OHCHR', url: 'https://www.ohchr.org', category: 'un_system', description: 'Human rights monitoring, treaty bodies, special procedures, and country reports', tags: ['human rights', 'global', 'monitoring'] },
  { name: 'UN Security Council', url: 'https://www.un.org/securitycouncil/', category: 'un_system', description: 'UNSC resolutions, presidential statements, sanctions committees, and meeting records', tags: ['security', 'sanctions', 'resolutions'] },
  { name: 'UNHCR Data Portal', url: 'https://data.unhcr.org', category: 'un_system', description: 'Refugee and displacement statistics, situation pages, and operational data', tags: ['displacement', 'refugees', 'data'] },
  { name: 'IAEA', url: 'https://www.iaea.org', category: 'un_system', description: 'Nuclear safety monitoring, safeguards reports, and emergency updates', tags: ['nuclear', 'safety', 'monitoring'] },

  // Regional Organizations
  { name: 'African Union', url: 'https://au.int', category: 'regional_org', description: 'Continental organization — Peace and Security Council communiques, election observation', tags: ['Africa', 'peace', 'elections'] },
  { name: 'ECOWAS', url: 'https://ecowas.int', category: 'regional_org', description: 'West African regional body — mediation, sanctions, standby force', tags: ['West Africa', 'mediation', 'sanctions'] },
  { name: 'OSCE', url: 'https://www.osce.org', category: 'regional_org', description: 'European security organization — election observation, arms control, confidence-building', tags: ['Europe', 'security', 'elections'] },
  { name: 'IGAD', url: 'https://igad.int', category: 'regional_org', description: 'East African regional body — Horn of Africa mediation and early warning', tags: ['East Africa', 'Horn of Africa', 'early warning'] },
  { name: 'ASEAN', url: 'https://asean.org', category: 'regional_org', description: 'Southeast Asian regional body — consensus-based diplomacy', tags: ['Southeast Asia', 'diplomacy'] },

  // Think Tanks & Research
  { name: 'International Crisis Group', url: 'https://www.crisisgroup.org', category: 'think_tank', description: 'Leading conflict analysis organization — CrisisWatch bulletin, in-depth reports, policy briefs', tags: ['conflict analysis', 'global', 'policy'] },
  { name: 'SIPRI', url: 'https://www.sipri.org', category: 'think_tank', description: 'Stockholm International Peace Research Institute — arms data, military expenditure, peace operations', tags: ['arms', 'military', 'data'] },
  { name: 'IISS', url: 'https://www.iiss.org', category: 'think_tank', description: 'International Institute for Strategic Studies — Military Balance, strategic assessments', tags: ['strategy', 'military', 'global'] },
  { name: 'Brookings Institution', url: 'https://www.brookings.edu/topic/foreign-policy/', category: 'think_tank', description: 'US foreign policy and international affairs research', tags: ['US policy', 'global', 'governance'] },
  { name: 'Chatham House', url: 'https://www.chathamhouse.org', category: 'think_tank', description: 'Royal Institute of International Affairs — UK-based global policy research', tags: ['UK policy', 'global', 'governance'] },
  { name: 'Carnegie Endowment', url: 'https://carnegieendowment.org', category: 'think_tank', description: 'International affairs research with global network of centers', tags: ['global', 'policy', 'research'] },

  // Data Platforms
  { name: 'UCDP GED', url: 'https://ucdp.uu.se', category: 'data_platform', description: 'Uppsala Conflict Data Program georeferenced event data for conflict tracking', tags: ['conflict data', 'events', 'geospatial'] },
  { name: 'UCDP', url: 'https://ucdp.uu.se', category: 'data_platform', description: 'Uppsala Conflict Data Program — battle-related deaths, conflict onset, and peace agreements', tags: ['conflict data', 'fatalities', 'historical'] },
  { name: 'IOM DTM', url: 'https://dtm.iom.int', category: 'data_platform', description: 'Displacement Tracking Matrix — mobility tracking across 90+ countries', tags: ['displacement', 'migration', 'tracking'] },
  { name: 'IPC Info', url: 'https://www.ipcinfo.org', category: 'data_platform', description: 'Integrated Phase Classification — food security and famine monitoring', tags: ['food security', 'famine', 'humanitarian'] },
  { name: 'Global Terrorism Database', url: 'https://www.start.umd.edu/gtd/', category: 'data_platform', description: 'Comprehensive terrorism event database maintained by University of Maryland', tags: ['terrorism', 'events', 'historical'] },

  // Legal & Accountability
  { name: 'International Court of Justice', url: 'https://www.icj-cij.org', category: 'legal', description: 'Principal judicial organ of the UN — interstate disputes and advisory opinions', tags: ['law', 'disputes', 'advisory'] },
  { name: 'International Criminal Court', url: 'https://www.icc-cpi.int', category: 'legal', description: 'International criminal accountability — situations, cases, and warrants', tags: ['criminal law', 'accountability', 'warrants'] },
  { name: 'UN Treaty Collection', url: 'https://treaties.un.org', category: 'legal', description: 'Depositary for multilateral treaties — ratification status and reservations', tags: ['treaties', 'law', 'ratification'] },

  // Humanitarian
  { name: 'ICRC', url: 'https://www.icrc.org', category: 'humanitarian', description: 'International Committee of the Red Cross — IHL, protection, and operational updates', tags: ['IHL', 'protection', 'humanitarian'] },
  { name: 'MSF', url: 'https://www.msf.org', category: 'humanitarian', description: 'Medecins Sans Frontieres — operational updates and medical humanitarian reporting', tags: ['medical', 'humanitarian', 'field reports'] },
  { name: 'WFP', url: 'https://www.wfp.org', category: 'humanitarian', description: 'World Food Programme — food security operations, emergency response', tags: ['food', 'emergency', 'logistics'] },
];

export const RESOURCE_CATEGORIES = [
  { id: 'un_system', label: 'UN System', color: '#4A90A4' },
  { id: 'regional_org', label: 'Regional Organizations', color: '#3D5A80' },
  { id: 'think_tank', label: 'Think Tanks & Research', color: '#5B8C5A' },
  { id: 'data_platform', label: 'Data Platforms', color: '#E8B931' },
  { id: 'legal', label: 'Legal & Accountability', color: '#7B6D8D' },
  { id: 'humanitarian', label: 'Humanitarian', color: '#C75B39' },
] as const;
