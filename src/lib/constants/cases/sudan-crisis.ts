/**
 * Sudan Crisis Case Study
 *
 * DIPLOMATIC DISCLAIMER: This case study is based exclusively on publicly available
 * open-source reporting, UN OCHA situation reports, and published analyses from
 * established international organizations. It reflects documented positions of parties
 * as reported by recognized media outlets and humanitarian agencies. Inclusion of any
 * party's stated position does not constitute endorsement. Data reflects the situation
 * as documented in open sources through March 2026.
 */

import type { DemoCase } from '../demo-cases';

export const SUDAN_CRISIS_CASE: DemoCase = {
  id: 'sudan-crisis',
  name: 'Sudan Armed Conflict',
  region: 'East Africa / Horn of Africa',
  status: 'escalating',
  startYear: 2023,
  description:
    'Armed conflict between the Sudanese Armed Forces (SAF) and the Rapid Support Forces (RSF) that erupted on 15 April 2023 in Khartoum. The conflict has since spread across the country, causing one of the world\'s largest displacement crises. Multiple mediation efforts including Jeddah talks have failed to secure a lasting ceasefire. The conflict has severe regional implications affecting Chad, South Sudan, Egypt, and the broader Horn of Africa.',
  riskLevel: 'critical',
  actorCount: 10,
  eventCount: 89,
  keyThemes: [
    'Internal armed conflict',
    'Mass displacement',
    'Humanitarian catastrophe',
    'Famine risk',
    'Regional destabilization',
    'Civilian protection',
    'Mediation failure',
    'Arms proliferation',
  ],
  institutions: ['UNSC', 'AU', 'IGAD', 'League of Arab States', 'UNITAMS'],
  primaryConflictType: 'Internal armed conflict with regional spillover',
  summaryPrompt:
    'Analyze the Sudan crisis including SAF-RSF military dynamics, humanitarian impact, displacement figures, mediation efforts (Jeddah process, IGAD, AU), regional implications, and accountability mechanisms. Reference OCHA situation reports and UNSC discussions.',
};

export const SUDAN_ACTORS = [
  {
    id: 'saf',
    name: 'Sudanese Armed Forces (SAF)',
    type: 'state' as const,
    description:
      'National military led by General Abdel Fattah al-Burhan, who serves as head of the Transitional Sovereignty Council. Controls Port Sudan as de facto capital after losing much of Khartoum. Supported by remnants of the former regime and elements of the former ruling National Congress Party.',
    importance: 1.0,
  },
  {
    id: 'rsf',
    name: 'Rapid Support Forces (RSF)',
    type: 'armed_group' as const,
    description:
      'Paramilitary force led by General Mohamed Hamdan Dagalo (Hemedti). Originally evolved from Janjaweed militias. Controls significant territory including parts of Khartoum, Darfur, and Kordofan. Accused of systematic atrocities in Darfur, including in El Geneina.',
    importance: 1.0,
  },
  {
    id: 'civilian-coalition',
    name: 'Forces of Freedom and Change (FFC)',
    type: 'civil_society' as const,
    description:
      'Civilian political coalition that led the 2019 revolution. Sidelined by the October 2021 military coup. Seeking restoration of civilian-led transition. Fragmented between factions aligned with SAF and those maintaining independence.',
    importance: 0.60,
  },
  {
    id: 'au-mediation',
    name: 'African Union',
    type: 'international_org' as const,
    description:
      'Primary continental body for conflict resolution. AU Peace and Security Council engaged. Coordination with IGAD on mediation framework. Suspended Sudan membership after 2021 coup.',
    importance: 0.70,
  },
  {
    id: 'igad',
    name: 'IGAD',
    type: 'international_org' as const,
    description:
      'Intergovernmental Authority on Development. Regional mediation efforts alongside AU. Key member states (Ethiopia, Kenya, Djibouti) have competing interests. South Sudan and Eritrea border states directly affected.',
    importance: 0.65,
  },
  {
    id: 'un-unitams',
    name: 'UN (UNITAMS)',
    type: 'international_org' as const,
    description:
      'UN Integrated Transition Assistance Mission in Sudan. Political mission mandate for transition support. OCHA coordinating massive humanitarian response. UNHCR managing cross-border displacement.',
    importance: 0.70,
  },
  {
    id: 'egypt',
    name: 'Arab Republic of Egypt',
    type: 'state' as const,
    description:
      'Northern neighbor with strategic interests in Nile water politics and border security. Generally supportive of SAF/military establishment. Hosting significant Sudanese refugee population. Concerned about regional stability.',
    importance: 0.60,
  },
  {
    id: 'uae',
    name: 'United Arab Emirates',
    type: 'state' as const,
    description:
      'Reported external support to RSF, including through supply chains via Chad and Libya. Strategic economic interests in Sudan\'s gold sector and Red Sea access. Involvement documented by UN Panel of Experts.',
    importance: 0.55,
  },
  {
    id: 'saudi-arabia',
    name: 'Kingdom of Saudi Arabia',
    type: 'state' as const,
    description:
      'Co-host of Jeddah peace talks alongside United States. Strategic interest in Red Sea security. Hosting Sudanese diaspora. Previously supported transitional process.',
    importance: 0.55,
  },
];

export const SUDAN_EVENTS = [
  { date: '2023-04-15', title: 'Armed conflict erupts between SAF and RSF in Khartoum', type: 'military' },
  { date: '2023-04-22', title: 'First evacuation of foreign nationals from Khartoum', type: 'humanitarian' },
  { date: '2023-05-20', title: 'Jeddah talks begin (Saudi-US mediated)', type: 'diplomatic' },
  { date: '2023-06-15', title: 'Ethnic violence in El Geneina, West Darfur', type: 'humanitarian' },
  { date: '2023-09-12', title: 'UNSC extends UNITAMS mandate', type: 'diplomatic' },
  { date: '2023-11-01', title: 'RSF captures Nyala, capital of South Darfur', type: 'military' },
  { date: '2024-01-15', title: 'IPC Phase 5 (Famine) conditions reported in parts of Darfur', type: 'humanitarian' },
  { date: '2024-03-15', title: 'UNSC adopts resolution demanding ceasefire during Ramadan', type: 'diplomatic' },
  { date: '2024-06-01', title: 'RSF advances in Sennar and Gezira states', type: 'military' },
  { date: '2024-10-01', title: 'Over 10 million internally displaced persons reported', type: 'humanitarian' },
  { date: '2025-01-15', title: 'SAF recaptures parts of Khartoum', type: 'military' },
  { date: '2025-06-01', title: 'UN Fact-Finding Mission reports systematic violations', type: 'legal' },
];

export const SUDAN_GLASL_STAGE = 8;

export const SUDAN_DIMENSIONS = {
  political: 8.0,
  security: 9.0,
  humanitarian: 9.5,
  economic: 8.5,
  social: 8.0,
};

export const SUDAN_MEDIA_LANDSCAPE = {
  disclaimer:
    'Media positioning assessments are based on published analyses. Access to independent journalism within Sudan is severely restricted due to the conflict. Many sources operate from exile or rely on citizen journalism.',
  sources: [
    {
      name: 'Sudan Tribune',
      country: 'France (Sudanese exile)',
      type: 'private' as const,
      orientation: -0.1,
      reliability: 0.72,
      notes: 'Independent Sudanese news outlet operating from Paris. Covers all parties. Good for political analysis and breaking news.',
      website: 'https://sudantribune.com',
    },
    {
      name: 'Radio Dabanga',
      country: 'Netherlands (Sudanese exile)',
      type: 'private' as const,
      orientation: -0.15,
      reliability: 0.75,
      notes: 'Independent radio and news service focused on Darfur and marginalized areas. Citizen journalist network. Critical of both SAF and RSF atrocities.',
      website: 'https://www.dabangasudan.org',
    },
    {
      name: 'OCHA Sudan',
      country: 'International',
      type: 'international_org' as const,
      orientation: 0.0,
      reliability: 0.92,
      notes: 'UN Office for the Coordination of Humanitarian Affairs. Official humanitarian data, flash updates, and situation reports. Authoritative for displacement and needs figures.',
      website: 'https://www.unocha.org/sudan',
    },
    {
      name: 'UCDP',
      country: 'Sweden',
      type: 'think_tank' as const,
      orientation: 0.0,
      reliability: 0.90,
      notes: 'Uppsala Conflict Data Program. Systematic conflict event tracking. Used by humanitarian agencies for operational planning.',
      website: 'https://ucdp.uu.se',
    },
    {
      name: 'International Crisis Group',
      country: 'Belgium',
      type: 'think_tank' as const,
      orientation: -0.05,
      reliability: 0.88,
      notes: 'Conflict analysis and policy recommendations. In-depth reporting on mediation efforts and political dynamics. Regular Sudan/Sahel briefings.',
      website: 'https://www.crisisgroup.org',
    },
    {
      name: 'Al Jazeera Arabic',
      country: 'Qatar',
      type: 'state' as const,
      orientation: -0.1,
      reliability: 0.70,
      notes: 'Extensive Arabic-language coverage of Sudan. Qatari editorial influence. Important for regional perspective and Arabic-speaking audience reach.',
      website: 'https://www.aljazeera.net',
    },
  ],
};
