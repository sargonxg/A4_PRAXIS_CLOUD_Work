/**
 * NYC-perspective stakeholder map for the Syria case file.
 *
 * Lists UN Security Council members, UN agencies in NYC, permanent missions of
 * states with material stake in the Syria transition, think tanks engaged on
 * the file, civil-society networks, and academic centres. Each entry carries
 * a contact-anchor URL, a relationship label, and a short note on what the
 * analyst should ask for from this counterpart.
 *
 * Treat addresses + contact lines as public-record references — they should
 * never be displayed as if PRAXIS holds private contact info; they are the
 * publicly listed mission/agency contact pages.
 */

export type StakeholderLayer =
  | 'sc_p5'
  | 'sc_e10'
  | 'un_agency'
  | 'perm_mission'
  | 'think_tank'
  | 'ngo'
  | 'academic'
  | 'press';

export type StakeholderTone = 'aligned' | 'mixed' | 'opposed' | 'neutral';

export interface NYCStakeholder {
  id: string;
  name: string;
  layer: StakeholderLayer;
  tone: StakeholderTone;
  city: string;
  contactUrl: string;
  relationshipNote: string;
  askForNote: string;
  recentDoc?: { title: string; date: string };
}

export const STAKEHOLDER_LAYER_LABELS: Record<StakeholderLayer, string> = {
  sc_p5:        'Security Council P5',
  sc_e10:       'Security Council E10',
  un_agency:    'UN agency',
  perm_mission: 'Permanent mission',
  think_tank:   'Think tank',
  ngo:          'NGO / civil society',
  academic:     'Academic centre',
  press:        'Press / wire',
};

export const STAKEHOLDER_TONE_BADGE: Record<StakeholderTone, string> = {
  aligned: 'bg-emerald-100 text-emerald-800',
  mixed:   'bg-amber-100 text-amber-800',
  opposed: 'bg-rose-100 text-rose-800',
  neutral: 'bg-slate-100 text-slate-700',
};

export const SYRIA_NYC_STAKEHOLDERS: NYCStakeholder[] = [
  // ── Security Council P5 ───────────────────────────────────────────────
  {
    id: 'usun',
    name: 'United States Mission to the UN (USUN)',
    layer: 'sc_p5',
    tone: 'mixed',
    city: 'New York',
    contactUrl: 'https://usun.usmission.gov/',
    relationshipNote: 'P5 · Counter-ISIL detention file lead · sanctions architecture',
    askForNote: 'Position on conditional sanctions delisting and SDF integration sequencing.',
    recentDoc: { title: 'USUN Syria explanation of vote', date: '2026-04-22' },
  },
  {
    id: 'uk-mission',
    name: 'UK Mission to the United Nations',
    layer: 'sc_p5',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.gov.uk/world/organisations/uk-mission-to-the-united-nations-new-york',
    relationshipNote: 'P5 · pen-holder coordination on Syria humanitarian dossier',
    askForNote: 'Penholder draft language on minority protection and accountability.',
    recentDoc: { title: 'UK statement at Security Council Syria briefing', date: '2026-04-22' },
  },
  {
    id: 'france-mission',
    name: 'Permanent Mission of France to the UN',
    layer: 'sc_p5',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://onu.delegfrance.org/',
    relationshipNote: 'P5 · framework convention on cross-border aid · IIIM support',
    askForNote: 'IIIM evidence-collection coordination and HRC referral mechanics.',
    recentDoc: { title: 'France-UK joint statement on coastal accountability', date: '2026-04-15' },
  },
  {
    id: 'russia-mission',
    name: 'Permanent Mission of the Russian Federation to the UN',
    layer: 'sc_p5',
    tone: 'opposed',
    city: 'New York',
    contactUrl: 'https://russiaun.ru/en',
    relationshipNote: 'P5 · post-Assad transactional posture · Tartus / Hmeimim residual',
    askForNote: 'Tartus base future and procedural blocking patterns on Syria resolutions.',
  },
  {
    id: 'china-mission',
    name: 'Permanent Mission of the People\'s Republic of China to the UN',
    layer: 'sc_p5',
    tone: 'mixed',
    city: 'New York',
    contactUrl: 'https://www.fmprc.gov.cn/ce/ceun/eng/',
    relationshipNote: 'P5 · sovereignty framing · Belt and Road reconstruction interest',
    askForNote: 'Reconstruction-finance interest and procedural posture on sanctions.',
  },

  // ── Security Council E10 ──────────────────────────────────────────────
  {
    id: 'algeria-mission',
    name: 'Permanent Mission of Algeria to the UN',
    layer: 'sc_e10',
    tone: 'mixed',
    city: 'New York',
    contactUrl: 'https://www.un.int/algeria/',
    relationshipNote: 'E10 · Arab Group coordination on Syria language',
    askForNote: 'Arab Group line on transitional government recognition.',
  },
  {
    id: 'guyana-mission',
    name: 'Permanent Mission of Guyana to the UN',
    layer: 'sc_e10',
    tone: 'neutral',
    city: 'New York',
    contactUrl: 'https://www.minfor.gov.gy/permanent-mission/',
    relationshipNote: 'E10 · Caricom voice on minority protection language',
    askForNote: 'Read on returnee protection and humanitarian access language.',
  },
  {
    id: 'switzerland-mission',
    name: 'Permanent Mission of Switzerland to the UN',
    layer: 'sc_e10',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.eda.admin.ch/missions/mission-un-newyork',
    relationshipNote: 'E10 · IHL leadership · good-offices discretion',
    askForNote: 'Geneva-track integration with NYC dossier.',
  },
  {
    id: 'sierra-leone-mission',
    name: 'Permanent Mission of Sierra Leone to the UN',
    layer: 'sc_e10',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.un.int/sierra-leone/',
    relationshipNote: 'E10 · post-conflict transition expertise',
    askForNote: 'Transition lessons and reintegration sequencing references.',
  },
  {
    id: 'south-korea-mission',
    name: 'Permanent Mission of the Republic of Korea to the UN',
    layer: 'sc_e10',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://overseas.mofa.go.kr/un-en/index.do',
    relationshipNote: 'E10 · sanctions implementation rigour · counter-proliferation',
    askForNote: 'Sanctions-monitoring practice and implementation track record.',
  },

  // ── UN agencies (NYC HQ) ──────────────────────────────────────────────
  {
    id: 'dppa',
    name: 'UN Department of Political and Peacebuilding Affairs (DPPA)',
    layer: 'un_agency',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://dppa.un.org/en',
    relationshipNote: 'Special Envoy support · mediation backbone · briefing prep',
    askForNote: 'Envoy schedule and good-offices logs.',
    recentDoc: { title: 'DPPA Briefing Note: Syria Constitutional Process', date: '2026-04-02' },
  },
  {
    id: 'ocha-nyc',
    name: 'OCHA NY Coordination and Response Division',
    layer: 'un_agency',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.unocha.org/',
    relationshipNote: 'Cluster coordination · HRP launch · FTS publication',
    askForNote: 'Funding gaps and access incidents at sector level.',
    recentDoc: { title: '2026 Syria Humanitarian Needs and Response Plan', date: '2026-02-15' },
  },
  {
    id: 'undp-bureau',
    name: 'UNDP Regional Bureau for Arab States',
    layer: 'un_agency',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.undp.org/arab-states',
    relationshipNote: 'Early recovery · livelihoods · governance support',
    askForNote: 'Rubble removal capacity and civil-documentation pipeline.',
  },
  {
    id: 'unwomen-hq',
    name: 'UN Women HQ',
    layer: 'un_agency',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.unwomen.org/en',
    relationshipNote: 'Women, peace and security · constitutional drafting participation',
    askForNote: 'Gender benchmarks for the drafting consultative round.',
  },
  {
    id: 'unicef-hq',
    name: 'UNICEF HQ',
    layer: 'un_agency',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.unicef.org/',
    relationshipNote: 'WASH · education · child protection · cholera response',
    askForNote: 'School rehab pipeline and cholera response status.',
  },
  {
    id: 'pbc',
    name: 'UN Peacebuilding Commission',
    layer: 'un_agency',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.un.org/peacebuilding/',
    relationshipNote: 'Configuration-style coordination space if Syria is added',
    askForNote: 'PBC configuration scoping and entry conditions for Syria.',
  },
  {
    id: 'ohchr-ny',
    name: 'OHCHR NY Office',
    layer: 'un_agency',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.ohchr.org/en/about-us/where-we-work/north-america',
    relationshipNote: 'Treaty body engagement · COI coordination · NYC-Geneva bridge',
    askForNote: 'COI Syria findings and IIIM coordination updates.',
  },

  // ── Think tanks (mostly DC + NY axis) ─────────────────────────────────
  {
    id: 'ipi',
    name: 'International Peace Institute (IPI)',
    layer: 'think_tank',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.ipinst.org/',
    relationshipNote: 'On-the-ground UN-system commentary · Global Observatory',
    askForNote: 'Global Observatory roundtable schedule on Syria transition.',
    recentDoc: { title: 'Global Observatory: A New Syria, A Fragile Transition', date: '2026-03-12' },
  },
  {
    id: 'crisis-group-ny',
    name: 'International Crisis Group — UN Advocacy',
    layer: 'think_tank',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.crisisgroup.org/un-advocacy',
    relationshipNote: 'Briefing access · field-driven analysis · UN coordination',
    askForNote: 'Field memo on integration implementation gaps.',
  },
  {
    id: 'cfr',
    name: 'Council on Foreign Relations',
    layer: 'think_tank',
    tone: 'mixed',
    city: 'New York',
    contactUrl: 'https://www.cfr.org/',
    relationshipNote: 'High-level convening · op-ed cadence',
    askForNote: 'Member-roundtable readouts on US-EU sanctions coordination.',
  },
  {
    id: 'stimson',
    name: 'Stimson Center — Syria',
    layer: 'think_tank',
    tone: 'aligned',
    city: 'Washington (NYC liaison)',
    contactUrl: 'https://www.stimson.org/program/syria/',
    relationshipNote: 'Policy roundtables · transition tracking',
    askForNote: 'Transition tracker briefing dates.',
  },
  {
    id: 'mei',
    name: 'Middle East Institute (MEI)',
    layer: 'think_tank',
    tone: 'aligned',
    city: 'Washington',
    contactUrl: 'https://www.mei.edu/',
    relationshipNote: 'Practitioner-led MENA analysis · field network',
    askForNote: 'Charles Lister network access for armed-group dynamics.',
  },

  // ── NGOs / civil society ─────────────────────────────────────────────
  {
    id: 'ngo-wgs',
    name: 'NGO Working Group on the Security Council',
    layer: 'ngo',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://ngowgsc.org/',
    relationshipNote: 'Brings civil-society voices into UNSC engagement',
    askForNote: 'Slot for Syrian civil-society Arria-formula meeting.',
  },
  {
    id: 'wilpf',
    name: 'WILPF',
    layer: 'ngo',
    tone: 'aligned',
    city: 'Geneva / NY',
    contactUrl: 'https://www.wilpf.org/',
    relationshipNote: 'WPS analysis · Syrian women\'s political participation tracking',
    askForNote: 'Updates on women\'s rights tracker for Syria drafting.',
  },
  {
    id: 'snhr',
    name: 'Syrian Network for Human Rights',
    layer: 'ngo',
    tone: 'aligned',
    city: 'Doha · Qatar',
    contactUrl: 'https://snhr.org/',
    relationshipNote: 'Field-level documentation · cited by UN COI',
    askForNote: 'Latest casualty + detention dataset.',
  },
  {
    id: 'syrians-for-truth',
    name: 'Syrians for Truth and Justice',
    layer: 'ngo',
    tone: 'aligned',
    city: 'The Hague',
    contactUrl: 'https://stj-sy.org/en/',
    relationshipNote: 'Coastal-violence accountability tracking · IIIM partner',
    askForNote: 'Coastal investigation findings and IIIM coordination.',
  },
  {
    id: 'whitehelmets',
    name: 'Syria Civil Defence — White Helmets',
    layer: 'ngo',
    tone: 'aligned',
    city: 'Northwest Syria',
    contactUrl: 'https://www.whitehelmets.org/',
    relationshipNote: 'Search-and-rescue · field documentation',
    askForNote: 'Daily incident logs across northwest belt.',
  },

  // ── Academic centres ──────────────────────────────────────────────────
  {
    id: 'columbia-saltzman',
    name: 'Columbia — Saltzman Institute of War and Peace Studies',
    layer: 'academic',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://siwps.weatherhead.columbia.edu/',
    relationshipNote: 'Conflict scholarship · transition convenings',
    askForNote: 'Transition-tracking working group schedule.',
  },
  {
    id: 'nyu-cic',
    name: 'NYU Center on International Cooperation',
    layer: 'academic',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://cic.nyu.edu/',
    relationshipNote: 'Conflict prevention · UN reform · transition strategy',
    askForNote: 'Pathways for Peace follow-on memo on Syria.',
  },
  {
    id: 'sipa-isps',
    name: 'Columbia SIPA — Institute for the Study of Human Rights',
    layer: 'academic',
    tone: 'aligned',
    city: 'New York',
    contactUrl: 'https://www.humanrightscolumbia.org/',
    relationshipNote: 'Transitional justice expertise · accountability seminars',
    askForNote: 'Transitional justice case-study cycle on Syria.',
  },

  // ── Press / wire ──────────────────────────────────────────────────────
  {
    id: 'nyt-un',
    name: 'New York Times — UN bureau',
    layer: 'press',
    tone: 'neutral',
    city: 'New York',
    contactUrl: 'https://www.nytimes.com/section/world',
    relationshipNote: 'Tier-1 framing · Council pen-holder coverage',
    askForNote: 'Council reporters covering Syria pen-holder dynamics.',
  },
  {
    id: 'reuters-un',
    name: 'Reuters — UN bureau',
    layer: 'press',
    tone: 'neutral',
    city: 'New York',
    contactUrl: 'https://www.reuters.com/world/middle-east/syria/',
    relationshipNote: 'Wire of record · daily SC coverage',
    askForNote: 'Wire reporters on integration agreement implementation.',
  },
  {
    id: 'pbs-newshour',
    name: 'PBS NewsHour foreign desk',
    layer: 'press',
    tone: 'neutral',
    city: 'Washington / NY',
    contactUrl: 'https://www.pbs.org/newshour/world',
    relationshipNote: 'Long-form transition explainers',
    askForNote: 'Booking interest for Syrian civil-society voices.',
  },
];

export function syriaNYCStakeholdersByLayer(): Record<StakeholderLayer, NYCStakeholder[]> {
  const out: Record<StakeholderLayer, NYCStakeholder[]> = {
    sc_p5: [],
    sc_e10: [],
    un_agency: [],
    perm_mission: [],
    think_tank: [],
    ngo: [],
    academic: [],
    press: [],
  };
  for (const s of SYRIA_NYC_STAKEHOLDERS) out[s.layer].push(s);
  return out;
}
