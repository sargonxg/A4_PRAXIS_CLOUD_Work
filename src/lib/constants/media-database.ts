/**
 * PRAXIS Media Source Database
 * 50+ real media outlets with editorial positioning, reliability, and analytical metadata.
 * Used by the analyzeMediaSource and compareMediaCoverage tools.
 */

export interface MediaOutlet {
  name: string;
  country: string;
  ownershipType: 'state' | 'private' | 'public' | 'wire_service' | 'ngo' | 'think_tank';
  politicalOrientation: number; // -1 (far left) to 1 (far right), 0 = center/neutral
  reliabilityScore: number; // 0–1
  editorialIndependence: number; // 0–1
  knownStrengths: string[];
  knownLimitations: string[];
  notableFor: string;
  website?: string;
}

export const MEDIA_DATABASE: MediaOutlet[] = [
  // ── Wire Services ────────────────────────────────────────────────────────────
  {
    name: 'Reuters',
    country: 'United Kingdom',
    ownershipType: 'wire_service',
    politicalOrientation: 0,
    reliabilityScore: 0.95,
    editorialIndependence: 0.95,
    knownStrengths: [
      'Breaking news speed', 'Global correspondent network', 'Financial and commodities reporting',
      'Fact-checking culture', 'Multiple-source verification standard',
    ],
    knownLimitations: [
      'Can be thin on context in early breaking news', 'Western anglophone editorial assumptions',
    ],
    notableFor: 'Gold standard for factual baseline in conflict reporting; relied upon by UN agencies',
  },
  {
    name: 'Associated Press (AP)',
    country: 'United States',
    ownershipType: 'wire_service',
    politicalOrientation: 0,
    reliabilityScore: 0.94,
    editorialIndependence: 0.95,
    knownStrengths: [
      'Extensive global bureau network', 'Rigorous editorial standards', 'Pulitzer-winning photography',
      'Factual objectivity', 'US and Americas depth',
    ],
    knownLimitations: [
      'US-centric framing on global stories', 'Speed sometimes prioritized over depth',
    ],
    notableFor: 'Most widely distributed wire service globally; widely used for factual verification',
  },
  {
    name: 'Agence France-Presse (AFP)',
    country: 'France',
    ownershipType: 'wire_service',
    politicalOrientation: 0,
    reliabilityScore: 0.93,
    editorialIndependence: 0.90,
    knownStrengths: [
      'Francophone Africa depth', 'Middle East correspondent network', 'Multilingual output',
      'Strong fact-checking unit', 'EU and francophone diplomacy',
    ],
    knownLimitations: [
      'French foreign policy perspectives occasionally evident', 'Partial state funding creates structural tension',
    ],
    notableFor: 'Essential for Francophone Africa, MENA, and EU coverage; strong on humanitarian crises',
  },

  // ── International Broadcasters ────────────────────────────────────────────
  {
    name: 'BBC World Service',
    country: 'United Kingdom',
    ownershipType: 'public',
    politicalOrientation: -0.1,
    reliabilityScore: 0.90,
    editorialIndependence: 0.88,
    knownStrengths: [
      'Language breadth (40+ services)', 'Africa and South Asia depth', 'Long-form investigative journalism',
      'Conflict zone access', 'Trusted by global audiences',
    ],
    knownLimitations: [
      'British foreign policy assumptions', 'UK government funding pressure on sensitive topics',
      'Post-imperial blind spots on Commonwealth coverage',
    ],
    notableFor: 'Exceptional reach in conflict zones; BBC Africa and BBC Arabic particularly respected',
  },
  {
    name: 'Al Jazeera English',
    country: 'Qatar',
    ownershipType: 'state',
    politicalOrientation: -0.2,
    reliabilityScore: 0.78,
    editorialIndependence: 0.60,
    knownStrengths: [
      'Arab world and Global South perspective', 'Gaza and Palestinian coverage depth',
      'Africa and Southeast Asia field journalism', 'Amplifies underreported stories',
    ],
    knownLimitations: [
      'Qatari state ownership creates conflicts on Gulf and Muslim Brotherhood topics',
      'Egypt, Saudi Arabia, UAE coverage skewed by regional politics',
      'Pro-Islamist framing on some stories',
    ],
    notableFor: 'Counter-narrative to Western media; essential for non-Western perspective on MENA conflicts',
  },
  {
    name: 'Al Arabiya',
    country: 'Saudi Arabia',
    ownershipType: 'state',
    politicalOrientation: 0.3,
    reliabilityScore: 0.62,
    editorialIndependence: 0.35,
    knownStrengths: [
      'Gulf states coverage', 'Arabic-language audience reach', 'Breaking news in Arab world',
    ],
    knownLimitations: [
      'Saudi state-aligned editorial line', 'Hostile coverage of Iran, Qatar, Muslim Brotherhood',
      'Significant bias on Yemen conflict (pro-Saudi coalition)',
    ],
    notableFor: 'Essential for understanding Saudi Arabian official positions and Gulf narrative framing',
  },
  {
    name: 'RT (Russia Today)',
    country: 'Russia',
    ownershipType: 'state',
    politicalOrientation: -0.8,
    reliabilityScore: 0.30,
    editorialIndependence: 0.10,
    knownStrengths: [
      'Russian government positions', 'Contrarian Western narratives',
      'Occasionally breaks stories mainstream media misses',
    ],
    knownLimitations: [
      'Kremlin propaganda instrument', 'Systematic disinformation on Ukraine and NATO',
      'Banned in EU; sanctioned by multiple governments', 'Sources frequently fabricated',
    ],
    notableFor: 'State mouthpiece; use only to understand Russian government narrative — verify all claims independently',
  },
  {
    name: 'CGTN (China Global Television Network)',
    country: 'China',
    ownershipType: 'state',
    politicalOrientation: -0.5,
    reliabilityScore: 0.45,
    editorialIndependence: 0.15,
    knownStrengths: [
      'China domestic and official positions', 'Belt and Road Initiative coverage',
      'Africa correspondent network (Growing)', 'Xi Jinping policy framing',
    ],
    knownLimitations: [
      'CCP state media; strict ideological constraints', 'Xinjiang, Taiwan, Tibet systematically distorted',
      'Registered as foreign agent in US and UK',
    ],
    notableFor: 'Essential for understanding Chinese government framing; cross-reference all claims',
  },
  {
    name: 'Xinhua News Agency',
    country: 'China',
    ownershipType: 'state',
    politicalOrientation: -0.5,
    reliabilityScore: 0.40,
    editorialIndependence: 0.10,
    knownStrengths: [
      'Official Chinese government communiqués', 'Chinese diplomatic activity', 'Extensive Africa bureau',
    ],
    knownLimitations: [
      'CCP official wire service', 'Routine distortion of human rights and governance stories',
    ],
    notableFor: 'Primary source for official Chinese positions; treat as state communiqué, not independent reporting',
  },
  {
    name: 'TASS',
    country: 'Russia',
    ownershipType: 'state',
    politicalOrientation: -0.8,
    reliabilityScore: 0.32,
    editorialIndependence: 0.10,
    knownStrengths: [
      'Official Russian government statements', 'Russian military and defense announcements',
    ],
    knownLimitations: [
      'Russian state wire service', 'Systematic distortion on Ukraine, Georgia, Belarus',
      'Treat only as source for Russian official positions',
    ],
    notableFor: 'Russian state wire; useful only for tracking official Kremlin messaging',
  },
  {
    name: 'France 24',
    country: 'France',
    ownershipType: 'public',
    politicalOrientation: -0.1,
    reliabilityScore: 0.82,
    editorialIndependence: 0.78,
    knownStrengths: [
      'Francophone Africa depth', 'French domestic and EU politics', 'Multilingual output (French/English/Arabic/Spanish)',
      'Sahel, DRC, West Africa expertise',
    ],
    knownLimitations: [
      'French foreign policy prism', 'Occasional Élysée alignment on sensitive bilateral topics',
    ],
    notableFor: 'Go-to for Francophone Africa coverage; strong on Sahel, Maghreb, and French-speaking crises',
  },
  {
    name: 'Deutsche Welle (DW)',
    country: 'Germany',
    ownershipType: 'public',
    politicalOrientation: -0.1,
    reliabilityScore: 0.85,
    editorialIndependence: 0.85,
    knownStrengths: [
      'Central/Eastern Europe depth', 'Germany and EU policy', 'Multi-language African service',
      'Strong fact-checking', 'Democracy and press freedom reporting',
    ],
    knownLimitations: [
      'German foreign policy lens', 'Less strong on Asia and Latin America',
    ],
    notableFor: 'Reliable European perspective; strong on Balkan, Eastern European, and African governance stories',
  },
  {
    name: 'NHK World',
    country: 'Japan',
    ownershipType: 'public',
    politicalOrientation: 0,
    reliabilityScore: 0.83,
    editorialIndependence: 0.82,
    knownStrengths: [
      'East Asia and Pacific depth', 'Japan foreign policy', 'Disaster and humanitarian coverage',
    ],
    knownLimitations: [
      'Less strong on Africa and Latin America', 'Japanese diplomatic sensitivities on China/Korea',
    ],
    notableFor: 'Essential for East Asia dynamics; reliable and measured reporting style',
  },
  {
    name: 'TRT World',
    country: 'Turkey',
    ownershipType: 'state',
    politicalOrientation: -0.2,
    reliabilityScore: 0.60,
    editorialIndependence: 0.45,
    knownStrengths: [
      'Muslim-majority world coverage', 'Balkans, Caucasus, Central Asia', 'Turkish official positions',
      'Palestinian and Rohingya coverage',
    ],
    knownLimitations: [
      'Turkish state broadcaster', 'Kurdish issues systematically distorted',
      'Greece, Armenia, Cyprus coverage skewed', 'AKP government alignment',
    ],
    notableFor: 'Alternative perspective on Muslim-world stories; required reading alongside Al Jazeera',
  },
  {
    name: 'Anadolu Agency',
    country: 'Turkey',
    ownershipType: 'state',
    politicalOrientation: -0.2,
    reliabilityScore: 0.58,
    editorialIndependence: 0.40,
    knownStrengths: [
      'Breaking news in Turkey and surroundings', 'Muslim world wire service', 'Africa correspondent network',
    ],
    knownLimitations: [
      'Turkish government wire', 'Pro-government on domestic politics', 'Kurdish coverage heavily biased',
    ],
    notableFor: 'Increasingly influential as a wire service for Muslim-majority countries and Global South',
  },

  // ── Quality Print / Digital ───────────────────────────────────────────────
  {
    name: 'The New York Times',
    country: 'United States',
    ownershipType: 'private',
    politicalOrientation: -0.3,
    reliabilityScore: 0.85,
    editorialIndependence: 0.82,
    knownStrengths: [
      'Investigative depth', 'Foreign affairs reporting', 'Wide correspondent network',
      'Pulitzer-winning investigative journalism', 'Visual journalism',
    ],
    knownLimitations: [
      'US-centric editorial assumptions', 'Liberal-leaning opinion section can bleed into news framing',
      'Historical blind spots on Iraq WMD (2003)',
    ],
    notableFor: 'Essential for depth on major global crises; strongest on US foreign policy and Middle East',
  },
  {
    name: 'The Washington Post',
    country: 'United States',
    ownershipType: 'private',
    politicalOrientation: -0.3,
    reliabilityScore: 0.84,
    editorialIndependence: 0.80,
    knownStrengths: [
      'National security and intelligence reporting', 'US foreign policy depth',
      'Democracy and authoritarian backsliding', 'Data journalism',
    ],
    knownLimitations: [
      'US national security establishment alignment on some stories',
      'Bezos ownership raises questions on Amazon/tech coverage',
    ],
    notableFor: 'Best on US national security, intelligence community, and Pentagon foreign policy decisions',
  },
  {
    name: 'The Guardian',
    country: 'United Kingdom',
    ownershipType: 'private',
    politicalOrientation: -0.4,
    reliabilityScore: 0.82,
    editorialIndependence: 0.85,
    knownStrengths: [
      'Climate, environment, and humanitarian issues', 'Investigative journalism (Panama Papers)',
      'Civil liberties and surveillance reporting', 'Strong Africa and Development coverage',
    ],
    knownLimitations: [
      'Left-liberal bias', 'UK-centric on Brexit and domestic politics',
    ],
    notableFor: 'Strong on humanitarian, climate, and civil society dimensions of conflicts; investigative depth',
  },
  {
    name: 'Financial Times',
    country: 'United Kingdom',
    ownershipType: 'private',
    politicalOrientation: 0.1,
    reliabilityScore: 0.88,
    editorialIndependence: 0.87,
    knownStrengths: [
      'Economic and financial dimensions of conflicts', 'Sanctions analysis', 'Energy geopolitics',
      'Corporate and commodity market impacts', 'Sober analytical tone',
    ],
    knownLimitations: [
      'Pro-market/elite bias', 'Less accessible to non-specialist readers',
    ],
    notableFor: 'Essential for economic drivers of conflict, sanctions regimes, and resource geopolitics',
  },
  {
    name: 'South China Morning Post (SCMP)',
    country: 'Hong Kong / China',
    ownershipType: 'private',
    politicalOrientation: 0.1,
    reliabilityScore: 0.72,
    editorialIndependence: 0.55,
    knownStrengths: [
      'China and Hong Kong coverage', 'Belt and Road reporting', 'Asia-Pacific dynamics',
    ],
    knownLimitations: [
      'Alibaba ownership (Jack Ma / CCP-connected) creates pressure', 'Self-censorship on sensitive China topics',
    ],
    notableFor: 'Best English-language source on China-adjacent stories; read with awareness of ownership',
  },
  {
    name: 'Times of India',
    country: 'India',
    ownershipType: 'private',
    politicalOrientation: 0.1,
    reliabilityScore: 0.68,
    editorialIndependence: 0.65,
    knownStrengths: [
      'South Asia breadth', 'India domestic politics', 'Largest English-language daily by circulation',
    ],
    knownLimitations: [
      'Commercialized content (paid news issues)', 'Nationalist framing on Pakistan/China stories',
    ],
    notableFor: 'Essential for India perspective; highest circulation gives public opinion insight',
  },
  {
    name: 'The Hindu',
    country: 'India',
    ownershipType: 'private',
    politicalOrientation: -0.2,
    reliabilityScore: 0.78,
    editorialIndependence: 0.78,
    knownStrengths: [
      'South Asia foreign policy depth', 'India-US and India-Russia relations',
      'Editorial independence stronger than peers', 'International affairs coverage quality',
    ],
    knownLimitations: [
      'Left-of-center editorial position', 'Less commercially influential than Times of India',
    ],
    notableFor: 'Best Indian newspaper for serious foreign policy and South Asian strategic analysis',
  },
  {
    name: "Haaretz",
    country: 'Israel',
    ownershipType: 'private',
    politicalOrientation: -0.4,
    reliabilityScore: 0.82,
    editorialIndependence: 0.85,
    knownStrengths: [
      'Critical Israeli domestic political coverage', 'Occupation and settlement reporting',
      'Security and military analysis', 'Palestinian perspective inclusion',
    ],
    knownLimitations: [
      'Left-liberal perspective that differs from Israeli mainstream', 'Paywalled limits access',
    ],
    notableFor: 'Indispensable for Israel-Palestine conflict; most critically independent Israeli newspaper',
  },
  {
    name: 'The Times of Israel',
    country: 'Israel',
    ownershipType: 'private',
    politicalOrientation: 0,
    reliabilityScore: 0.78,
    editorialIndependence: 0.78,
    knownStrengths: [
      'Breaking news from Israel', 'Regional political coverage', 'Jewish diaspora perspective',
    ],
    knownLimitations: [
      'Pro-Israel framing on existential security issues', 'Less critical of government than Haaretz',
    ],
    notableFor: 'Reliable factual source on Israeli political developments; more centrist than Haaretz',
  },
  {
    name: 'Daily Star (Lebanon)',
    country: 'Lebanon',
    ownershipType: 'private',
    politicalOrientation: 0,
    reliabilityScore: 0.70,
    editorialIndependence: 0.68,
    knownStrengths: [
      'Lebanon domestic politics', 'Levant and Eastern Mediterranean', 'Hezbollah and Lebanese political dynamics',
    ],
    knownLimitations: [
      'Commercial pressures', 'Advertisers and funders can influence coverage',
    ],
    notableFor: 'Key English-language source for Lebanese political dynamics and Levant region',
  },
  {
    name: 'CNN International',
    country: 'United States',
    ownershipType: 'private',
    politicalOrientation: -0.2,
    reliabilityScore: 0.75,
    editorialIndependence: 0.72,
    knownStrengths: [
      'Live conflict broadcasting', 'Global reach', 'Breaking news speed',
    ],
    knownLimitations: [
      'Prioritizes visual drama over analytical depth', 'US-centric framing', 'Variable quality by journalist',
    ],
    notableFor: 'Useful for live conflict coverage; global audience reach makes it a narrative-setter',
  },

  // ── Magazines / Policy Journals ───────────────────────────────────────────
  {
    name: 'The Economist',
    country: 'United Kingdom',
    ownershipType: 'private',
    politicalOrientation: 0.1,
    reliabilityScore: 0.88,
    editorialIndependence: 0.88,
    knownStrengths: [
      'Analytical depth on economics and geopolitics', 'Country risk assessments',
      'Global comparative perspective', 'Quality writing across regions',
    ],
    knownLimitations: [
      'Classical liberal / free-market ideological bias', 'Unsigned articles limit accountability',
    ],
    notableFor: 'Best weekly synthesis of geopolitics and economics; excellent country briefings',
  },
  {
    name: 'Foreign Affairs',
    country: 'United States',
    ownershipType: 'ngo',
    politicalOrientation: 0,
    reliabilityScore: 0.90,
    editorialIndependence: 0.90,
    knownStrengths: [
      'Senior policymaker and academic contributions', 'Long-form strategic analysis',
      'US foreign policy establishment thinking', 'Peer-reviewed quality',
    ],
    knownLimitations: [
      'Bimonthly rhythm — dated on fast-moving crises', 'US foreign policy consensus bias',
    ],
    notableFor: 'Essential for understanding US foreign policy establishment thinking on any major conflict',
  },
  {
    name: 'Foreign Policy',
    country: 'United States',
    ownershipType: 'private',
    politicalOrientation: -0.1,
    reliabilityScore: 0.85,
    editorialIndependence: 0.83,
    knownStrengths: [
      'Real-time analysis by practitioners', 'Conflict-specific deep dives',
      'Democracy and human rights framing', 'FP Analytics data journalism',
    ],
    knownLimitations: [
      'US liberal internationalist worldview', 'Paywall limits reach',
    ],
    notableFor: 'Best daily conflict analysis from a policy-practitioner perspective; high-quality columnists',
  },
  {
    name: 'War on the Rocks',
    country: 'United States',
    ownershipType: 'ngo',
    politicalOrientation: 0,
    reliabilityScore: 0.87,
    editorialIndependence: 0.90,
    knownStrengths: [
      'Military strategy and operational analysis', 'Defense technology and doctrine',
      'Practitioner contributors (former military/intel)', 'Nuclear and deterrence analysis',
    ],
    knownLimitations: [
      'US/NATO-centric security lens', 'Less strong on political economy and humanitarian dimensions',
    ],
    notableFor: 'Essential for military operational analysis, escalation dynamics, and deterrence theory',
  },
  {
    name: 'Lawfare',
    country: 'United States',
    ownershipType: 'ngo',
    politicalOrientation: -0.1,
    reliabilityScore: 0.90,
    editorialIndependence: 0.92,
    knownStrengths: [
      'International law and national security law', 'Sanctions legal analysis', 'IHL compliance tracking',
      'UNSC and ICJ proceedings analysis', 'US executive power and oversight',
    ],
    knownLimitations: [
      'Dense legal focus not accessible to general audiences', 'US legal framework centric',
    ],
    notableFor: 'Indispensable for legal dimensions of armed conflict, sanctions, and accountability',
  },
  {
    name: 'The Intercept',
    country: 'United States',
    ownershipType: 'ngo',
    politicalOrientation: -0.6,
    reliabilityScore: 0.72,
    editorialIndependence: 0.88,
    knownStrengths: [
      'National security and surveillance investigative journalism', 'Whistleblower document analysis',
      'US military and intelligence oversight', 'Corporate accountability',
    ],
    knownLimitations: [
      'Left-progressive editorial bias', 'Occasional editorial failures on verification',
    ],
    notableFor: 'Essential for intelligence community oversight, military contractors, and classified leaks',
  },

  // ── Conflict-Specific Research Outlets ───────────────────────────────────
  {
    name: 'Bellingcat',
    country: 'Netherlands',
    ownershipType: 'ngo',
    politicalOrientation: 0,
    reliabilityScore: 0.88,
    editorialIndependence: 0.93,
    knownStrengths: [
      'OSINT and geolocation verification', 'War crime documentation', 'MH17, Novichok investigations',
      'Syria and Ukraine battlefield verification', 'Disinformation debunking',
    ],
    knownLimitations: [
      'Resource-intensive methodology limits speed', 'Western-language OSINT stronger than non-Western',
    ],
    notableFor: 'Gold standard for OSINT verification; essential for assessing battlefield claims and war crime evidence',
  },
  {
    name: 'UCDP (Uppsala Conflict Data Program)',
    country: 'Sweden / Global',
    ownershipType: 'ngo',
    politicalOrientation: 0,
    reliabilityScore: 0.92,
    editorialIndependence: 0.95,
    knownStrengths: [
      'Quantitative conflict data', 'Event-level disaggregation', 'Real-time conflict tracking',
      'Africa, Middle East, Asia, Americas coverage', 'Freely accessible datasets',
    ],
    knownLimitations: [
      'Dependent on media reporting (coverage gaps in media-dark zones)',
      'Coding methodology debates among researchers',
    ],
    notableFor: 'Primary quantitative source for conflict events, fatalities, and actor activity; used by UN agencies',
  },
  {
    name: 'International Crisis Group',
    country: 'Belgium / Global',
    ownershipType: 'ngo',
    politicalOrientation: -0.1,
    reliabilityScore: 0.92,
    editorialIndependence: 0.92,
    knownStrengths: [
      'In-depth field research', 'Practitioner access (belligerents, governments)',
      'Conflict prevention recommendations', 'Analytical rigour', 'Regional specialist depth',
    ],
    knownLimitations: [
      'Western-funded; some governments view as biased', 'Publication rhythm (not real-time)',
    ],
    notableFor: 'Leading independent conflict analysis organization; reports are essential reading for mediators',
  },
  {
    name: 'Brookings Institution',
    country: 'United States',
    ownershipType: 'think_tank',
    politicalOrientation: -0.2,
    reliabilityScore: 0.85,
    editorialIndependence: 0.80,
    knownStrengths: [
      'US foreign policy analysis', 'Middle East and global governance', 'Economic policy depth',
    ],
    knownLimitations: [
      'Corporate and government donor influence', 'Washington establishment bias',
    ],
    notableFor: 'Influential US think tank; strong on US-Middle East policy and global governance reform',
  },
  {
    name: 'RAND Corporation',
    country: 'United States',
    ownershipType: 'think_tank',
    politicalOrientation: 0,
    reliabilityScore: 0.88,
    editorialIndependence: 0.82,
    knownStrengths: [
      'Defense and security quantitative research', 'Scenario planning methodology',
      'USAF and Pentagon contract research', 'Rigorous methodological standards',
    ],
    knownLimitations: [
      'US defense establishment client base', 'Classified research not publicly available',
    ],
    notableFor: 'Best for military strategy, defense technology, and security sector quantitative analysis',
  },
  {
    name: 'Chatham House (RIIA)',
    country: 'United Kingdom',
    ownershipType: 'think_tank',
    politicalOrientation: -0.1,
    reliabilityScore: 0.88,
    editorialIndependence: 0.85,
    knownStrengths: [
      'UK/Commonwealth foreign policy', 'Energy and resource geopolitics', 'Russia and post-Soviet space',
      'Africa and Middle East depth', 'Chatham House Rule conferences',
    ],
    knownLimitations: [
      'UK government and corporate funding', 'British foreign policy bias',
    ],
    notableFor: 'Leading UK foreign policy think tank; strong on energy security, Russia, and Commonwealth affairs',
  },
  {
    name: 'Carnegie Endowment for International Peace',
    country: 'United States / Global',
    ownershipType: 'think_tank',
    politicalOrientation: -0.1,
    reliabilityScore: 0.87,
    editorialIndependence: 0.87,
    knownStrengths: [
      'Nuclear policy', 'South Asia depth', 'Russia and Eurasia', 'Democracy and governance',
      'Technology and security',
    ],
    knownLimitations: [
      'US liberal internationalist worldview', 'Donor-influenced topic prioritization',
    ],
    notableFor: 'Best on nuclear non-proliferation, South Asia security, and Russia/Eurasia dynamics',
  },
  {
    name: 'Small Arms Survey',
    country: 'Switzerland',
    ownershipType: 'think_tank',
    politicalOrientation: 0,
    reliabilityScore: 0.90,
    editorialIndependence: 0.92,
    knownStrengths: [
      'Arms flows and proliferation data', 'Illicit weapons tracking', 'Armed group profiles',
      'Sanctions violations documentation', 'Sudan, DRC, Sahel expertise',
    ],
    knownLimitations: [
      'Niche focus limits breadth', 'Resource-intensive research pace',
    ],
    notableFor: 'Essential for arms embargo monitoring, weapons proliferation, and armed group capabilities',
  },
  {
    name: 'Stockholm International Peace Research Institute (SIPRI)',
    country: 'Sweden',
    ownershipType: 'think_tank',
    politicalOrientation: 0,
    reliabilityScore: 0.92,
    editorialIndependence: 0.93,
    knownStrengths: [
      'Military expenditure data', 'Arms transfers database', 'Nuclear weapons monitoring',
      'Peace operations data', 'Conflict statistics',
    ],
    knownLimitations: [
      'Data-focused; less narrative analysis', 'Annual publication cycle on some datasets',
    ],
    notableFor: 'Authoritative source for military spending, arms trade, and nuclear weapons statistics',
  },

  // ── Humanitarian / Development ────────────────────────────────────────────
  {
    name: 'ReliefWeb',
    country: 'United States (UN)',
    ownershipType: 'ngo',
    politicalOrientation: 0,
    reliabilityScore: 0.90,
    editorialIndependence: 0.90,
    knownStrengths: [
      'Humanitarian situation reports', 'UN agency and NGO documents',
      'Crisis maps and infographics', 'Aggregated humanitarian data',
    ],
    knownLimitations: [
      'Aggregator — quality varies by source', 'Limited editorial content of its own',
    ],
    notableFor: 'Essential humanitarian resource; aggregates OCHA, UNHCR, WFP, and NGO situation reports',
  },
  {
    name: 'UN News',
    country: 'United States (UN)',
    ownershipType: 'state',
    politicalOrientation: 0,
    reliabilityScore: 0.88,
    editorialIndependence: 0.75,
    knownStrengths: [
      'Official UN positions and statements', 'Security Council proceedings',
      'Secretary-General statements', 'UNHCR, WFP, UNICEF official figures',
    ],
    knownLimitations: [
      'Institutional bias toward UN positions', 'Diplomatically sanitized language',
      'Does not critically examine UN performance failures',
    ],
    notableFor: 'Authoritative source for official UN positions, resolutions, and interagency data',
  },
  {
    name: 'The New Humanitarian (formerly IRIN)',
    country: 'Switzerland',
    ownershipType: 'ngo',
    politicalOrientation: -0.2,
    reliabilityScore: 0.85,
    editorialIndependence: 0.90,
    knownStrengths: [
      'Humanitarian crisis reporting', 'Under-reported conflicts', 'Field journalism quality',
      'Aid system accountability', 'Diaspora and affected community voices',
    ],
    knownLimitations: [
      'Smaller resource base than major outlets', 'Funding from humanitarian donors creates soft bias toward sector',
    ],
    notableFor: 'Essential for humanitarian dimensions of conflicts; covers crises other media ignores',
  },
  {
    name: 'Devex',
    country: 'United States',
    ownershipType: 'private',
    politicalOrientation: 0,
    reliabilityScore: 0.80,
    editorialIndependence: 0.82,
    knownStrengths: [
      'International development sector news', 'NGO and USAID contracting', 'SDG implementation tracking',
      'Donor policy developments',
    ],
    knownLimitations: [
      'Development industry insider perspective', 'Paywall',
    ],
    notableFor: 'Best source for international aid, development contracting, and NGO sector dynamics',
  },
  {
    name: 'OCHA (UN Office for the Coordination of Humanitarian Affairs)',
    country: 'United States (UN)',
    ownershipType: 'state',
    politicalOrientation: 0,
    reliabilityScore: 0.90,
    editorialIndependence: 0.80,
    knownStrengths: [
      'Humanitarian needs assessments', 'Funding tracking (FTS)', 'Cluster system reporting',
      'Country situation reports (SitReps)', 'Flash appeals and response plans',
    ],
    knownLimitations: [
      'UN institutional constraints limit political criticism', 'Access-dependent reporting',
    ],
    notableFor: 'Primary source for humanitarian needs data, funding gaps, and cluster coordination',
  },

  // ── Regional / Specialist ─────────────────────────────────────────────────
  {
    name: 'Africa Confidential',
    country: 'United Kingdom',
    ownershipType: 'private',
    politicalOrientation: 0,
    reliabilityScore: 0.85,
    editorialIndependence: 0.88,
    knownStrengths: [
      'Elite-level African political intelligence', 'Presidential palace and security service sourcing',
      'Difficult-to-access stories', 'Decades of institutional knowledge',
    ],
    knownLimitations: [
      'Expensive subscription', 'Can be opaque on sourcing', 'Irregular publication',
    ],
    notableFor: 'Elite intelligence on African political dynamics not available elsewhere; highly trusted by diplomats',
  },
  {
    name: "The Africa Report",
    country: 'France',
    ownershipType: 'private',
    politicalOrientation: -0.1,
    reliabilityScore: 0.78,
    editorialIndependence: 0.75,
    knownStrengths: [
      'Pan-African political and business coverage', 'French-Africa (Françafrique) dynamics',
      'Economic development reporting',
    ],
    knownLimitations: [
      'Paris-based editorial perspective', 'Varies in quality by country desk',
    ],
    notableFor: 'Good for political-economic analysis of African states; strong on Francophone West Africa',
  },
  {
    name: 'Middle East Eye',
    country: 'United Kingdom',
    ownershipType: 'private',
    politicalOrientation: -0.3,
    reliabilityScore: 0.68,
    editorialIndependence: 0.62,
    knownStrengths: [
      'MENA depth and breadth', 'Muslim Brotherhood network connections',
      'Critical of Gulf state authoritarianism',
    ],
    knownLimitations: [
      'Alleged Qatari/Islamist sympathies', 'UAE and Saudi coverage systematically critical',
      'Source credibility varies',
    ],
    notableFor: 'Alternative MENA perspective; useful counterbalance to Gulf state-aligned media',
  },
  {
    name: 'Rudaw',
    country: 'Iraq / Kurdistan',
    ownershipType: 'private',
    politicalOrientation: -0.1,
    reliabilityScore: 0.70,
    editorialIndependence: 0.62,
    knownStrengths: [
      'Kurdish political dynamics', 'Iraq and Syria field reporting',
      'KRG official positions', 'Yazidi and minority coverage',
    ],
    knownLimitations: [
      'KDP-aligned ownership', 'PKK and PYD coverage reflects KRG political tensions',
    ],
    notableFor: 'Best English-language source for Kurdish region dynamics; essential for Iraq/Syria conflicts',
  },
  {
    name: 'Radio Free Europe / Radio Liberty (RFE/RL)',
    country: 'United States',
    ownershipType: 'state',
    politicalOrientation: -0.1,
    reliabilityScore: 0.78,
    editorialIndependence: 0.70,
    knownStrengths: [
      'Eastern Europe and post-Soviet states', 'Investigative journalism in closed societies',
      'Local language services', 'Circumventing state media in authoritarian states',
    ],
    knownLimitations: [
      'US government funded (USAGM)', 'Anti-Russia and anti-authoritarian editorial bias',
      'Not independent from US foreign policy framing',
    ],
    notableFor: 'Essential for post-Soviet space; provides local-language access in media-restricted environments',
  },
  {
    name: 'Voice of America (VOA)',
    country: 'United States',
    ownershipType: 'state',
    politicalOrientation: -0.1,
    reliabilityScore: 0.72,
    editorialIndependence: 0.65,
    knownStrengths: [
      'Broad global language coverage', 'Africa correspondent network', 'Reaches media-dark zones',
    ],
    knownLimitations: [
      'US government broadcaster', 'Anti-authoritarian editorial stance',
      'US foreign policy interests shape coverage priorities',
    ],
    notableFor: 'Wide geographic reach in Africa and Asia; useful for local-language verification',
  },

  // ── Digital / Investigative ───────────────────────────────────────────────
  {
    name: 'ProPublica',
    country: 'United States',
    ownershipType: 'ngo',
    politicalOrientation: -0.2,
    reliabilityScore: 0.90,
    editorialIndependence: 0.93,
    knownStrengths: [
      'Investigative journalism depth', 'Data journalism', 'US domestic accountability',
      'Military contractor and government oversight',
    ],
    knownLimitations: [
      'Primarily US-focused', 'International coverage less comprehensive',
    ],
    notableFor: 'Gold standard for investigative accountability journalism; Pulitzer-winning investigations',
  },
  {
    name: 'Global Witness',
    country: 'United Kingdom',
    ownershipType: 'ngo',
    politicalOrientation: -0.2,
    reliabilityScore: 0.85,
    editorialIndependence: 0.90,
    knownStrengths: [
      'Natural resource governance', 'Conflict minerals and blood diamonds',
      'Kleptocracy and money laundering', 'Corporate complicity in conflict',
    ],
    knownLimitations: [
      'Campaign-oriented — advocacy not pure journalism', 'Not a daily news source',
    ],
    notableFor: 'Essential for resource-conflict linkages, conflict minerals, and corporate accountability',
  },
  {
    name: 'Amnesty International',
    country: 'United Kingdom',
    ownershipType: 'ngo',
    politicalOrientation: -0.3,
    reliabilityScore: 0.82,
    editorialIndependence: 0.85,
    knownStrengths: [
      'Human rights documentation', 'War crimes evidence compilation',
      'Fact-finding missions', 'IHL violations reporting',
    ],
    knownLimitations: [
      'Human rights advocacy organization — not neutral journalism',
      'Perceived selective focus on Western states vs. others (contested)',
    ],
    notableFor: 'Essential for human rights violations documentation; admissible-quality evidence gathering',
  },
  {
    name: 'Human Rights Watch (HRW)',
    country: 'United States',
    ownershipType: 'ngo',
    politicalOrientation: -0.2,
    reliabilityScore: 0.85,
    editorialIndependence: 0.85,
    knownStrengths: [
      'Country-specific human rights reporting', 'Casualty documentation methodology',
      'Governments and armed groups accountability', 'IHL compliance monitoring',
    ],
    knownLimitations: [
      'US-headquartered raises questions on US-allied state coverage',
      'Advocacy mission shapes research agenda',
    ],
    notableFor: 'Most comprehensive human rights documentation globally; cited in UN reports and ICC proceedings',
  },
];

/**
 * Look up a media outlet by name (case-insensitive, partial match).
 */
export function findMediaOutlet(name: string): MediaOutlet | undefined {
  const lower = name.toLowerCase();
  return (
    MEDIA_DATABASE.find((o) => o.name.toLowerCase() === lower) ??
    MEDIA_DATABASE.find((o) => o.name.toLowerCase().includes(lower))
  );
}
