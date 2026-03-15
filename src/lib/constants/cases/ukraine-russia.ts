/**
 * Ukraine-Russia Conflict Case Study
 *
 * DIPLOMATIC DISCLAIMER: This case study is based exclusively on publicly available
 * open-source reporting, official UN documentation, and published institutional
 * analyses. It reflects documented positions of parties as reported by established
 * media outlets and international organizations. Inclusion of any party's stated
 * position does not constitute endorsement. All data points are sourced from
 * publicly accessible records as of March 2026.
 */

import type { DemoCase } from '../demo-cases';

export const UKRAINE_RUSSIA_CASE: DemoCase = {
  id: 'ukraine-russia',
  name: 'Ukraine-Russia Conflict',
  region: 'Eastern Europe',
  status: 'active',
  startYear: 2022,
  description:
    'Full-scale international armed conflict following Russia\'s invasion of Ukraine in February 2022. The conflict has resulted in significant territorial changes, massive displacement, and a profound restructuring of European security architecture. Multiple international legal proceedings are underway, including at the ICJ and ICC.',
  riskLevel: 'critical',
  actorCount: 12,
  eventCount: 156,
  keyThemes: [
    'International armed conflict',
    'Nuclear deterrence',
    'Sanctions regime',
    'Humanitarian corridors',
    'War crimes accountability',
    'Energy security',
    'NATO expansion',
    'Grain corridor diplomacy',
  ],
  institutions: ['UNGA', 'UNSC', 'ICJ', 'ICC', 'OSCE', 'EU', 'NATO', 'IAEA'],
  primaryConflictType: 'Interstate armed conflict with global systemic implications',
  summaryPrompt:
    'Analyze the Ukraine-Russia conflict including the military situation, diplomatic efforts, sanctions regimes, humanitarian impact, and implications for the international order. Reference UNGA resolutions, ICJ proceedings, and ICC warrants.',
};

export const UKRAINE_RUSSIA_ACTORS = [
  {
    id: 'ukraine-gov',
    name: 'Government of Ukraine',
    type: 'state' as const,
    description:
      'Internationally recognized government led by President Volodymyr Zelenskyy. Defending territorial integrity against Russian military operations. Pursuing EU and NATO membership. Recipient of substantial Western military and financial assistance.',
    importance: 1.0,
  },
  {
    id: 'russia-gov',
    name: 'Russian Federation',
    type: 'state' as const,
    description:
      'Initiated full-scale military operations in February 2022. Claims security concerns regarding NATO expansion and protection of Russian-speaking populations. Subject to comprehensive international sanctions. Permanent member of the UN Security Council.',
    importance: 1.0,
  },
  {
    id: 'nato',
    name: 'NATO',
    type: 'international_org' as const,
    description:
      'North Atlantic Treaty Organization. Providing military assistance to Ukraine through bilateral channels. Enhanced eastern flank deployments. Finland and Sweden accession expanded the alliance.',
    importance: 0.85,
  },
  {
    id: 'eu',
    name: 'European Union',
    type: 'international_org' as const,
    description:
      'Imposed comprehensive sanctions packages against Russia. Granted Ukraine candidate status. Providing financial assistance and reconstruction support. Energy diversification from Russian supplies.',
    importance: 0.80,
  },
  {
    id: 'un-system',
    name: 'United Nations System',
    type: 'international_org' as const,
    description:
      'UNGA resolutions demanding withdrawal. Secretary-General mediation efforts including Black Sea Grain Initiative. OHCHR monitoring mission documenting civilian casualties. IAEA monitoring nuclear facilities.',
    importance: 0.75,
  },
  {
    id: 'china-prc',
    name: "People's Republic of China",
    type: 'state' as const,
    description:
      'Maintains strategic partnership with Russia while calling for dialogue. Published 12-point peace proposal. Has not provided direct military support but has increased economic ties with Russia. Significant diplomatic weight in potential negotiations.',
    importance: 0.70,
  },
  {
    id: 'osce',
    name: 'OSCE',
    type: 'international_org' as const,
    description:
      'Organization for Security and Co-operation in Europe. Special Monitoring Mission withdrew in 2022. Moscow Mechanism reports documenting human rights violations. Consensus-based decision-making paralyzed by Russian participation.',
    importance: 0.55,
  },
];

export const UKRAINE_RUSSIA_EVENTS = [
  { date: '2022-02-24', title: 'Full-scale Russian invasion begins', type: 'military' },
  { date: '2022-03-02', title: 'UNGA Resolution ES-11/1 demands Russian withdrawal', type: 'diplomatic' },
  { date: '2022-03-16', title: 'ICJ orders Russia to suspend military operations', type: 'legal' },
  { date: '2022-04-02', title: 'Russian withdrawal from Kyiv region; Bucha atrocities discovered', type: 'humanitarian' },
  { date: '2022-07-22', title: 'Black Sea Grain Initiative signed in Istanbul', type: 'diplomatic' },
  { date: '2022-09-21', title: 'Russian partial mobilization announced', type: 'military' },
  { date: '2022-09-30', title: 'Russia announces annexation of four Ukrainian regions', type: 'political' },
  { date: '2022-11-11', title: 'Ukrainian forces liberate Kherson', type: 'military' },
  { date: '2023-03-17', title: 'ICC issues arrest warrant for President Putin', type: 'legal' },
  { date: '2023-06-06', title: 'Kakhovka Dam destruction causes humanitarian crisis', type: 'humanitarian' },
  { date: '2023-07-17', title: 'Russia exits Black Sea Grain Initiative', type: 'diplomatic' },
  { date: '2024-06-15', title: 'Swiss-hosted Summit on Peace in Ukraine', type: 'diplomatic' },
];

export const UKRAINE_RUSSIA_GLASL_STAGE = 7;

export const UKRAINE_RUSSIA_DIMENSIONS = {
  political: 9.0,
  security: 9.5,
  humanitarian: 8.5,
  economic: 8.0,
  social: 7.5,
};

export const UKRAINE_MEDIA_LANDSCAPE = {
  disclaimer:
    'Media positioning assessments are based on published media bias analyses from academic and fact-checking institutions. Positions may evolve over time.',
  sources: [
    {
      name: 'Kyiv Independent',
      country: 'Ukraine',
      type: 'private' as const,
      orientation: -0.15,
      reliability: 0.78,
      notes: 'English-language Ukrainian outlet. Pro-Ukraine editorial stance. Good for Ukrainian perspective and frontline reporting.',
      website: 'https://kyivindependent.com',
    },
    {
      name: 'Ukrinform',
      country: 'Ukraine',
      type: 'state' as const,
      orientation: -0.2,
      reliability: 0.65,
      notes: 'Official Ukrainian news agency. Government-aligned. Useful for official Ukrainian positions.',
      website: 'https://www.ukrinform.net',
    },
    {
      name: 'TASS',
      country: 'Russia',
      type: 'state' as const,
      orientation: 0.4,
      reliability: 0.35,
      notes: 'Russian state news agency. Kremlin-aligned messaging. Important for understanding Russian official narrative.',
      website: 'https://tass.com',
    },
    {
      name: 'Meduza',
      country: 'Latvia (Russian exile)',
      type: 'private' as const,
      orientation: -0.1,
      reliability: 0.82,
      notes: 'Independent Russian-language outlet in exile. Critical of Kremlin. Designated "undesirable" organization by Russia.',
      website: 'https://meduza.io/en',
    },
    {
      name: 'ISW (Institute for the Study of War)',
      country: 'United States',
      type: 'think_tank' as const,
      orientation: 0.1,
      reliability: 0.88,
      notes: 'Leading source for daily military situation assessments. Open-source intelligence analysis. Widely cited by Western media.',
      website: 'https://www.understandingwar.org',
    },
    {
      name: 'RUSI',
      country: 'United Kingdom',
      type: 'think_tank' as const,
      orientation: 0.05,
      reliability: 0.90,
      notes: 'Royal United Services Institute. Defence and security analysis. Respected for technical military assessments.',
      website: 'https://rusi.org',
    },
  ],
};
