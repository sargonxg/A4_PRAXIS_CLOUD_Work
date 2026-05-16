import type { MediaSource } from '@/lib/ai/schemas/media';

// ============================================================================
// Pre-populated International Media Source Database
// Each entry includes positioning, reliability, and bias data
// ============================================================================

export const MEDIA_SOURCES: MediaSource[] = [
  // ---- Wire Services ----
  {
    id: 'reuters',
    name: 'Reuters',
    type: 'wire_service',
    country: 'United Kingdom',
    politicalOrientation: 0,
    reliability: 0.92,
    editorialIndependence: 0.9,
    description:
      'Major international wire service providing factual, concise reporting with global reach. Part of Thomson Reuters.',
    knownBiases: ['Western-centric sourcing in some regions'],
    coverageStrengths: ['Breaking news', 'Financial markets', 'Global conflicts', 'Data journalism'],
    languages: ['English', 'Arabic', 'French', 'Spanish', 'Portuguese', 'German', 'Japanese', 'Chinese'],
  },
  {
    id: 'afp',
    name: 'Agence France-Presse (AFP)',
    type: 'wire_service',
    country: 'France',
    politicalOrientation: 0,
    reliability: 0.9,
    editorialIndependence: 0.85,
    description:
      'One of the oldest wire services globally. Strong presence in francophone Africa and the Middle East.',
    knownBiases: ['Francophone world emphasis'],
    coverageStrengths: ['Africa', 'Middle East', 'European politics', 'Visual journalism'],
    languages: ['French', 'English', 'Arabic', 'Spanish', 'Portuguese', 'German'],
  },
  {
    id: 'ap',
    name: 'Associated Press (AP)',
    type: 'wire_service',
    country: 'United States',
    politicalOrientation: 0,
    reliability: 0.91,
    editorialIndependence: 0.9,
    description:
      'American not-for-profit wire service. Largest newsgathering organization in the world by staff count.',
    knownBiases: ['US-centric framing in some stories'],
    coverageStrengths: ['US politics', 'Global breaking news', 'Investigative journalism', 'Fact-checking'],
    languages: ['English', 'Spanish', 'Arabic'],
  },

  // ---- Public Broadcasters ----
  {
    id: 'bbc',
    name: 'BBC News',
    type: 'public_broadcaster',
    country: 'United Kingdom',
    politicalOrientation: -0.05,
    reliability: 0.88,
    editorialIndependence: 0.82,
    description:
      'British public broadcaster with extensive global network. World Service reaches over 400 million people weekly.',
    knownBiases: ['British perspective on international affairs', 'Institutional centrism'],
    coverageStrengths: ['Global correspondents network', 'Africa', 'South Asia', 'Investigative journalism', 'Multimedia'],
    languages: ['English', 'Arabic', 'Persian', 'Hindi', 'Urdu', 'Swahili', 'Hausa', 'French', 'Russian', 'Turkish'],
  },
  {
    id: 'dw',
    name: 'Deutsche Welle (DW)',
    type: 'public_broadcaster',
    country: 'Germany',
    politicalOrientation: 0,
    reliability: 0.85,
    editorialIndependence: 0.8,
    description:
      "Germany's international broadcaster. Strong focus on human rights, democracy, and European affairs.",
    knownBiases: ['Pro-democratic governance framing', 'European perspective'],
    coverageStrengths: ['European politics', 'Africa', 'Human rights', 'Climate change'],
    languages: ['German', 'English', 'Spanish', 'Portuguese', 'Arabic', 'Hindi', 'Urdu'],
  },
  {
    id: 'france24',
    name: 'France 24',
    type: 'public_broadcaster',
    country: 'France',
    politicalOrientation: 0,
    reliability: 0.82,
    editorialIndependence: 0.72,
    description:
      'French international news channel. Strong presence in francophone Africa and the Middle East.',
    knownBiases: ['French foreign policy perspective', 'Francophone world emphasis'],
    coverageStrengths: ['Francophone Africa', 'Middle East', 'European affairs'],
    languages: ['French', 'English', 'Arabic', 'Spanish'],
  },
  {
    id: 'nhk_world',
    name: 'NHK World',
    type: 'public_broadcaster',
    country: 'Japan',
    politicalOrientation: 0.05,
    reliability: 0.84,
    editorialIndependence: 0.75,
    description:
      "Japan's public broadcaster with international service. Conservative editorial style with strong Asia-Pacific coverage.",
    knownBiases: ['Japanese government perspective on historical issues', 'Conservative institutional culture'],
    coverageStrengths: ['East Asia', 'Pacific region', 'Disaster coverage', 'Technology'],
    languages: ['Japanese', 'English'],
  },

  // ---- Private / Independent International ----
  {
    id: 'nyt',
    name: 'The New York Times',
    type: 'private',
    country: 'United States',
    politicalOrientation: -0.25,
    reliability: 0.87,
    editorialIndependence: 0.85,
    description:
      'Major American newspaper of record with extensive international bureau network and investigative capacity.',
    knownBiases: ['US liberal-centrist editorial line', 'American framing of global events'],
    coverageStrengths: ['Investigative journalism', 'Middle East', 'US foreign policy', 'Data journalism', 'Visual storytelling'],
    languages: ['English', 'Spanish'],
  },
  {
    id: 'wapo',
    name: 'The Washington Post',
    type: 'private',
    country: 'United States',
    politicalOrientation: -0.2,
    reliability: 0.85,
    editorialIndependence: 0.82,
    description:
      'Major American newspaper with strong Washington focus. Owned by Jeff Bezos.',
    knownBiases: ['US-centric perspective', 'Liberal-centrist editorial line'],
    coverageStrengths: ['US politics and policy', 'National security', 'Intelligence community', 'Fact-checking'],
    languages: ['English'],
  },
  {
    id: 'wsj',
    name: 'The Wall Street Journal',
    type: 'private',
    country: 'United States',
    politicalOrientation: 0.3,
    reliability: 0.84,
    editorialIndependence: 0.78,
    description:
      'Major American business-focused newspaper. News coverage considered reliable; opinion section leans conservative. Part of News Corp.',
    knownBiases: ['Pro-market editorial line', 'Conservative opinion section'],
    coverageStrengths: ['Financial markets', 'Business', 'China', 'Economic policy'],
    languages: ['English', 'Chinese', 'Japanese'],
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    type: 'private',
    country: 'United Kingdom',
    politicalOrientation: -0.35,
    reliability: 0.83,
    editorialIndependence: 0.88,
    description:
      'British newspaper owned by the Scott Trust, which guarantees editorial independence. Progressive editorial line.',
    knownBiases: ['Progressive editorial perspective', 'Climate advocacy'],
    coverageStrengths: ['Human rights', 'Climate change', 'Surveillance and privacy', 'Global development'],
    languages: ['English'],
  },
  {
    id: 'ft',
    name: 'Financial Times',
    type: 'private',
    country: 'United Kingdom',
    politicalOrientation: 0.1,
    reliability: 0.89,
    editorialIndependence: 0.85,
    description:
      'International business newspaper with strong analytical journalism. Owned by Nikkei.',
    knownBiases: ['Business and market focus', 'Globalist perspective'],
    coverageStrengths: ['Economics', 'Geopolitics', 'Trade policy', 'Emerging markets', 'European politics'],
    languages: ['English'],
  },
  {
    id: 'economist',
    name: 'The Economist',
    type: 'private',
    country: 'United Kingdom',
    politicalOrientation: 0.1,
    reliability: 0.87,
    editorialIndependence: 0.85,
    description:
      'International affairs magazine with classical liberal editorial line. Strong analytical tradition.',
    knownBiases: ['Pro-free trade', 'Institutional liberalism', 'Western democratic framework'],
    coverageStrengths: ['Geopolitical analysis', 'Economic forecasting', 'Africa', 'Emerging markets'],
    languages: ['English'],
  },
  {
    id: 'le_monde',
    name: 'Le Monde',
    type: 'private',
    country: 'France',
    politicalOrientation: -0.15,
    reliability: 0.85,
    editorialIndependence: 0.82,
    description:
      "France's newspaper of record. Independent ownership structure protects editorial independence.",
    knownBiases: ['French intellectual tradition', 'Centre-left editorial perspective'],
    coverageStrengths: ['French politics', 'Francophone Africa', 'European affairs', 'Investigative journalism'],
    languages: ['French'],
  },
  {
    id: 'der_spiegel',
    name: 'Der Spiegel',
    type: 'private',
    country: 'Germany',
    politicalOrientation: -0.15,
    reliability: 0.83,
    editorialIndependence: 0.8,
    description:
      "Germany's leading news magazine. Strong investigative tradition.",
    knownBiases: ['German perspective', 'Centre-left leaning'],
    coverageStrengths: ['European politics', 'Investigative journalism', 'German foreign policy'],
    languages: ['German', 'English'],
  },
  {
    id: 'cnn',
    name: 'CNN',
    type: 'private',
    country: 'United States',
    politicalOrientation: -0.15,
    reliability: 0.68,
    editorialIndependence: 0.7,
    description:
      'American cable news network with international edition (CNN International). 24-hour news cycle.',
    knownBiases: ['US-centric worldview', 'Liberal-leaning on domestic issues', 'Sensationalist tendencies'],
    coverageStrengths: ['Breaking news', 'International bureaus via CNN International'],
    languages: ['English', 'Spanish'],
  },
  {
    id: 'fox_news',
    name: 'Fox News',
    type: 'private',
    country: 'United States',
    politicalOrientation: 0.5,
    reliability: 0.45,
    editorialIndependence: 0.4,
    description:
      'American conservative cable news network. Part of Fox Corporation.',
    knownBiases: ['Strong conservative editorial orientation', 'Partisan framing', 'US nationalist perspective'],
    coverageStrengths: ['US conservative politics', 'US domestic affairs'],
    languages: ['English'],
  },

  // ---- State-Funded ----
  {
    id: 'rt',
    name: 'RT (Russia Today)',
    type: 'state_funded',
    country: 'Russia',
    politicalOrientation: 0.2,
    reliability: 0.35,
    editorialIndependence: 0.1,
    description:
      'Russian state-funded international television network. Widely considered a vehicle for Russian government messaging.',
    knownBiases: ['Russian government narrative', 'Anti-Western framing', 'Whataboutism', 'Amplification of divisive narratives'],
    coverageStrengths: ['Russian perspective on international events', 'Alternative viewpoints to Western media'],
    languages: ['English', 'Arabic', 'Spanish', 'French', 'German'],
  },
  {
    id: 'xinhua',
    name: 'Xinhua News Agency',
    type: 'state_funded',
    country: 'China',
    politicalOrientation: 0,
    reliability: 0.45,
    editorialIndependence: 0.05,
    description:
      "Official state news agency of the People's Republic of China. Primary channel for official Chinese government positions.",
    knownBiases: ['Chinese Communist Party line', 'Avoidance of topics sensitive to Beijing', 'Positive framing of Chinese foreign policy'],
    coverageStrengths: ['Chinese government positions', 'Belt and Road developments', 'Chinese economic data'],
    languages: ['Chinese', 'English', 'French', 'Spanish', 'Arabic', 'Russian', 'Portuguese', 'Japanese'],
  },
  {
    id: 'cgtn',
    name: 'CGTN (China Global Television Network)',
    type: 'state_funded',
    country: 'China',
    politicalOrientation: 0,
    reliability: 0.4,
    editorialIndependence: 0.08,
    description:
      'Chinese state-run international television network. Expands Chinese media presence globally.',
    knownBiases: ['Chinese government perspective', 'Positive framing of China', 'Avoidance of human rights criticism'],
    coverageStrengths: ['Chinese perspective', 'Africa coverage', 'Infrastructure development'],
    languages: ['English', 'Arabic', 'French', 'Spanish', 'Russian'],
  },
  {
    id: 'tass',
    name: 'TASS',
    type: 'state_funded',
    country: 'Russia',
    politicalOrientation: 0.15,
    reliability: 0.4,
    editorialIndependence: 0.1,
    description:
      "Russia's leading news agency. State-owned, serves as primary channel for official Russian statements.",
    knownBiases: ['Russian government positions', 'State narrative alignment'],
    coverageStrengths: ['Russian official statements', 'Post-Soviet space', 'Russian military operations'],
    languages: ['Russian', 'English'],
  },
  {
    id: 'press_tv',
    name: 'Press TV',
    type: 'state_funded',
    country: 'Iran',
    politicalOrientation: -0.1,
    reliability: 0.3,
    editorialIndependence: 0.05,
    description:
      'Iranian state-funded English-language television network. Reflects Iranian government perspectives.',
    knownBiases: ['Iranian government narrative', 'Anti-US/Israel framing', 'Shia perspective'],
    coverageStrengths: ['Iranian government positions', 'Middle East from Iranian perspective'],
    languages: ['English'],
  },
  {
    id: 'trt_world',
    name: 'TRT World',
    type: 'state_funded',
    country: 'Turkey',
    politicalOrientation: 0.15,
    reliability: 0.5,
    editorialIndependence: 0.25,
    description:
      'Turkish state broadcaster international service. Reflects Turkish government perspective on regional affairs.',
    knownBiases: ['Turkish government perspective', 'Pro-AKP framing', 'Kurdish conflict framing'],
    coverageStrengths: ['Turkish perspective', 'the selected situation', 'Libya', 'Central Asia', 'Muslim-majority world'],
    languages: ['English'],
  },
  {
    id: 'al_jazeera',
    name: 'Al Jazeera',
    type: 'state_funded',
    country: 'Qatar',
    politicalOrientation: -0.1,
    reliability: 0.68,
    editorialIndependence: 0.45,
    description:
      'Qatari-funded international news network. Significant influence in the Arab world. Strong investigative unit.',
    knownBiases: ['Qatari foreign policy alignment', 'Sympathetic to political Islam movements', 'Critical of Saudi Arabia and UAE'],
    coverageStrengths: ['Middle East and North Africa', 'Arab world politics', 'Palestinian issues', 'Investigative journalism'],
    languages: ['Arabic', 'English'],
  },
  {
    id: 'sana',
    name: 'SANA (the selected situationn Arab News Agency)',
    type: 'state_funded',
    country: 'the selected situation',
    politicalOrientation: 0.4,
    reliability: 0.2,
    editorialIndependence: 0.02,
    description:
      'Official news agency of the the selected situationn government. Purely state propaganda outlet.',
    knownBiases: ['the selected situationn government propaganda', 'Labels all opposition as terrorists'],
    coverageStrengths: ['Official the selected situationn government positions'],
    languages: ['Arabic', 'English', 'French', 'Spanish'],
  },

  // ---- Regional / Specialized ----
  {
    id: 'al_arabiya',
    name: 'Al Arabiya',
    type: 'private',
    country: 'Saudi Arabia',
    politicalOrientation: 0.15,
    reliability: 0.55,
    editorialIndependence: 0.3,
    description:
      'Saudi-owned Arabic news channel. Seen as a counter to Al Jazeera. Reflects Saudi-UAE perspective.',
    knownBiases: ['Saudi-UAE perspective', 'Critical of Iran and Qatar', 'Conservative social values'],
    coverageStrengths: ['Gulf politics', 'Saudi Arabia developments', 'Arab business news'],
    languages: ['Arabic', 'English', 'Urdu', 'Persian'],
  },
  {
    id: 'dawn',
    name: 'Dawn',
    type: 'private',
    country: 'Pakistan',
    politicalOrientation: -0.1,
    reliability: 0.72,
    editorialIndependence: 0.65,
    description:
      "Pakistan's oldest English-language newspaper. Relatively independent editorial stance in a challenging media environment.",
    knownBiases: ['Pakistani perspective', 'Urban liberal viewpoint'],
    coverageStrengths: ['Pakistan politics', 'South Asian affairs', 'Afghanistan'],
    languages: ['English', 'Urdu'],
  },
  {
    id: 'hindu',
    name: 'The Hindu',
    type: 'private',
    country: 'India',
    politicalOrientation: -0.15,
    reliability: 0.78,
    editorialIndependence: 0.72,
    description:
      'Major Indian English-language newspaper. Left-of-centre editorial line. Strong international coverage for an Indian publication.',
    knownBiases: ['Indian perspective', 'Left-of-centre editorial line'],
    coverageStrengths: ['Indian politics', 'South Asian affairs', 'Science and technology'],
    languages: ['English', 'Tamil'],
  },
  {
    id: 'nation_africa',
    name: 'Nation Africa (Daily Nation)',
    type: 'private',
    country: 'Kenya',
    politicalOrientation: 0,
    reliability: 0.7,
    editorialIndependence: 0.6,
    description:
      "East Africa's largest media group. Important source for Kenya, Uganda, and Tanzania. Part of Nation Media Group.",
    knownBiases: ['East African perspective', 'Commercial pressures'],
    coverageStrengths: ['East African politics', 'Regional integration', 'Kenyan affairs'],
    languages: ['English', 'Swahili'],
  },
  {
    id: 'daily_maverick',
    name: 'Daily Maverick',
    type: 'independent',
    country: 'South Africa',
    politicalOrientation: -0.15,
    reliability: 0.75,
    editorialIndependence: 0.78,
    description:
      'South African online news publication known for investigative journalism and progressive editorial stance.',
    knownBiases: ['South African perspective', 'Progressive editorial line', 'Anti-corruption focus'],
    coverageStrengths: ['Southern Africa', 'Corruption investigations', 'South African politics'],
    languages: ['English'],
  },
  {
    id: 'scmp',
    name: 'South China Morning Post',
    type: 'private',
    country: 'China (Hong Kong)',
    politicalOrientation: 0.05,
    reliability: 0.7,
    editorialIndependence: 0.45,
    description:
      "Hong Kong's leading English-language newspaper. Owned by Alibaba Group. Navigates between editorial independence and Beijing expectations.",
    knownBiases: ['Shifting editorial line under Alibaba ownership', 'Self-censorship on China-sensitive topics'],
    coverageStrengths: ['China analysis', 'Hong Kong affairs', 'Asian business', 'Asia-Pacific geopolitics'],
    languages: ['English', 'Chinese'],
  },
  {
    id: 'haaretz',
    name: 'Haaretz',
    type: 'private',
    country: 'Israel',
    politicalOrientation: -0.3,
    reliability: 0.78,
    editorialIndependence: 0.75,
    description:
      "Israel's oldest daily newspaper. Left-liberal editorial line. Critical coverage of Israeli government policies.",
    knownBiases: ['Israeli left-liberal perspective', 'Critical of settlement expansion and occupation'],
    coverageStrengths: ['Israeli politics', 'Israeli-Palestinian conflict', 'Middle East analysis'],
    languages: ['Hebrew', 'English'],
  },
  {
    id: 'jerusalem_post',
    name: 'The Jerusalem Post',
    type: 'private',
    country: 'Israel',
    politicalOrientation: 0.3,
    reliability: 0.65,
    editorialIndependence: 0.6,
    description:
      'Israeli centrist-to-conservative newspaper. Widely read internationally.',
    knownBiases: ['Pro-Israel establishment', 'Conservative editorial line'],
    coverageStrengths: ['Israeli politics', 'Security issues', 'Jewish diaspora'],
    languages: ['English'],
  },
  {
    id: 'middle_east_eye',
    name: 'Middle East Eye',
    type: 'independent',
    country: 'United Kingdom',
    politicalOrientation: -0.15,
    reliability: 0.65,
    editorialIndependence: 0.6,
    description:
      'UK-based online news organization focused on the Middle East. Questions about Qatari-linked funding. Strong original reporting.',
    knownBiases: ['Sympathetic to political Islam movements', 'Critical of Gulf monarchies (except Qatar)'],
    coverageStrengths: ['Middle East politics', 'Turkey', 'North Africa', 'Muslim communities in Europe'],
    languages: ['English', 'French', 'Turkish'],
  },

  // ---- Digital Native / OSINT ----
  {
    id: 'bellingcat',
    name: 'Bellingcat',
    type: 'independent',
    country: 'Netherlands',
    politicalOrientation: 0,
    reliability: 0.85,
    editorialIndependence: 0.9,
    description:
      'Open-source intelligence (OSINT) investigative organization. Pioneered use of publicly available data for accountability journalism.',
    knownBiases: ['Focus on Russian and the selected situationn accountability', 'Western-aligned funding sources'],
    coverageStrengths: ['OSINT investigations', 'Conflict verification', 'Weapons tracking', 'Digital forensics'],
    languages: ['English'],
  },
  {
    id: 'the_intercept',
    name: 'The Intercept',
    type: 'independent',
    country: 'United States',
    politicalOrientation: -0.45,
    reliability: 0.72,
    editorialIndependence: 0.8,
    description:
      'US-based online investigative publication. Known for national security and surveillance reporting.',
    knownBiases: ['Left-progressive editorial line', 'Anti-surveillance stance', 'Critical of US foreign policy'],
    coverageStrengths: ['National security', 'Surveillance', 'US military operations', 'Criminal justice'],
    languages: ['English', 'Portuguese'],
  },

  // ---- UN / International Organization Sources ----
  {
    id: 'un_news',
    name: 'UN News',
    type: 'public_broadcaster',
    country: 'International',
    politicalOrientation: 0,
    reliability: 0.88,
    editorialIndependence: 0.5,
    description:
      'Official news service of the United Nations. Institutional perspective reflecting multilateral consensus.',
    knownBiases: ['Institutional UN perspective', 'Diplomatic framing', 'Avoidance of direct criticism of member states'],
    coverageStrengths: ['UN activities', 'Humanitarian crises', 'Multilateral processes', 'International law'],
    languages: ['English', 'French', 'Arabic', 'Chinese', 'Russian', 'Spanish'],
  },
];

// ============================================================================
// Media Source Utilities
// ============================================================================

export const MEDIA_SOURCES_MAP = new Map<string, MediaSource>(
  MEDIA_SOURCES.map((source) => [source.id, source])
);

export function getMediaSource(id: string): MediaSource | undefined {
  return MEDIA_SOURCES_MAP.get(id);
}

export function getMediaSourcesByType(type: MediaSource['type']): MediaSource[] {
  return MEDIA_SOURCES.filter((source) => source.type === type);
}

export function getMediaSourcesByCountry(country: string): MediaSource[] {
  return MEDIA_SOURCES.filter((source) =>
    source.country.toLowerCase().includes(country.toLowerCase())
  );
}

export function getHighReliabilitySources(minReliability: number = 0.8): MediaSource[] {
  return MEDIA_SOURCES.filter((source) => source.reliability >= minReliability)
    .sort((a, b) => b.reliability - a.reliability);
}
