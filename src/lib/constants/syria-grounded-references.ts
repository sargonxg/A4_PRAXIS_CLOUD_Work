/**
 * Grounded reference layer for the Syria post-Assad case file.
 *
 * Public, citable, link-stable anchors organised by category. PRAXIS uses
 * these as the "evidence ledger" the analyst can open one click below the
 * tier-ranked source receipts. Each entry is a *reference anchor*, not the
 * primary feed: it lets a reader inspect the encyclopedic, treaty, or data
 * basis of a claim, then return to the tier-1 source.
 *
 * Categories:
 *  - encyclopedic     Wikipedia / Britannica context anchors
 *  - un_doc           UN Security Council resolutions, COI Syria, OCHA
 *  - rights_legal     OHCHR, ICRC, treaty bodies
 *  - academic_centre  Stanford, Harvard, RAND, USIP, MEI, Carnegie, etc.
 *  - data_portal      World Bank, ACAPS, HDX, UNHCR Data, GDELT
 *  - testimony        Civil society, diaspora, oral testimony archives
 */

export type SyriaReferenceCategory =
  | 'encyclopedic'
  | 'un_doc'
  | 'rights_legal'
  | 'academic_centre'
  | 'data_portal'
  | 'testimony';

export interface SyriaGroundedReference {
  id: string;
  title: string;
  publisher: string;
  category: SyriaReferenceCategory;
  url: string;
  graphUse: string;
  retrievedAt: string;
}

export const SYRIA_GROUNDED_REFERENCES: SyriaGroundedReference[] = [
  // ── Encyclopedic anchors ──────────────────────────────────────────────
  {
    id: 'sgr-wiki-syrian-civil-war',
    title: 'Syrian civil war',
    publisher: 'Wikipedia',
    category: 'encyclopedic',
    url: 'https://en.wikipedia.org/wiki/Syrian_civil_war',
    graphUse: 'Anchor for the 2011-2024 conflict arc that frames the post-Assad transition.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-wiki-fall-of-assad',
    title: 'Fall of the Assad regime (2024)',
    publisher: 'Wikipedia',
    category: 'encyclopedic',
    url: 'https://en.wikipedia.org/wiki/Fall_of_the_Assad_regime',
    graphUse: 'Reference for the 27 Nov - 8 Dec 2024 offensive that overthrew Bashar al-Assad.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-wiki-al-sharaa',
    title: 'Ahmad al-Sharaa',
    publisher: 'Wikipedia',
    category: 'encyclopedic',
    url: 'https://en.wikipedia.org/wiki/Ahmad_al-Sharaa',
    graphUse: 'Biographical anchor for the transitional president and HTS background.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-wiki-sdf',
    title: 'Syrian Democratic Forces',
    publisher: 'Wikipedia',
    category: 'encyclopedic',
    url: 'https://en.wikipedia.org/wiki/Syrian_Democratic_Forces',
    graphUse: 'Background on the SDF coalition relevant to the 30 Jan integration agreement.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-wiki-aanes',
    title: 'Autonomous Administration of North and East Syria',
    publisher: 'Wikipedia',
    category: 'encyclopedic',
    url: 'https://en.wikipedia.org/wiki/Autonomous_Administration_of_North_and_East_Syria',
    graphUse: 'Reference for AANES governance structure feeding the integration file.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-wiki-druze',
    title: 'Druze in Syria',
    publisher: 'Wikipedia',
    category: 'encyclopedic',
    url: 'https://en.wikipedia.org/wiki/Druze_in_Syria',
    graphUse: 'Demographic and political context for Sweida flashpoints.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-wiki-alawites',
    title: 'Alawites',
    publisher: 'Wikipedia',
    category: 'encyclopedic',
    url: 'https://en.wikipedia.org/wiki/Alawites',
    graphUse: 'Context for Latakia/Tartus minority protection file.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-wiki-hts',
    title: 'Hayat Tahrir al-Sham',
    publisher: 'Wikipedia',
    category: 'encyclopedic',
    url: 'https://en.wikipedia.org/wiki/Hayat_Tahrir_al-Sham',
    graphUse: 'Background on the dominant transitional faction and counter-terrorism designation history.',
    retrievedAt: '2026-05-04',
  },

  // ── UN documents ─────────────────────────────────────────────────────
  {
    id: 'sgr-un-res-2254',
    title: 'UN Security Council Resolution 2254 (2015)',
    publisher: 'UN Security Council',
    category: 'un_doc',
    url: 'https://www.securitycouncilreport.org/un-documents/document/s-res-2254.php',
    graphUse: 'Foundational UN framework for Syrian-led political transition; cited in al-Sharaa & UN Envoy briefings.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-un-res-2585',
    title: 'UN Security Council Resolution 2585 (2021) — cross-border aid',
    publisher: 'UN Security Council',
    category: 'un_doc',
    url: 'https://www.securitycouncilreport.org/un-documents/document/s-res-2585.php',
    graphUse: 'Cross-border humanitarian access framework cited in the Humanitarian Access Compact.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-un-coi-syria',
    title: 'Independent International Commission of Inquiry on the Syrian Arab Republic',
    publisher: 'UN Human Rights Council',
    category: 'un_doc',
    url: 'https://www.ohchr.org/en/hr-bodies/hrc/iici-syria/index',
    graphUse: 'Authoritative public record of violations and accountability findings; basis for coastal-violence references.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-un-envoy-briefings',
    title: 'UN Special Envoy for Syria — briefings to the Security Council',
    publisher: 'UN Geneva',
    category: 'un_doc',
    url: 'https://specialenvoysyria.unmissions.org/',
    graphUse: 'Live readouts of the political track, integration agreement, and minority files.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-ocha-syria-hub',
    title: 'OCHA Syrian Arab Republic page (Humanitarian Needs and Response Plan)',
    publisher: 'UN OCHA',
    category: 'un_doc',
    url: 'https://www.unocha.org/syrian-arab-republic',
    graphUse: 'HRP, FTS funding tracker, sitreps, cluster pages.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-undof-mandate',
    title: 'UNDOF — UN Disengagement Observer Force mandate',
    publisher: 'UN Department of Peace Operations',
    category: 'un_doc',
    url: 'https://undof.unmissions.org/mandate',
    graphUse: 'Governs the 1974 disengagement line referenced in southern de-escalation file.',
    retrievedAt: '2026-05-04',
  },

  // ── Rights / legal ────────────────────────────────────────────────────
  {
    id: 'sgr-ohchr-syria',
    title: 'OHCHR — Syria country page',
    publisher: 'UN Human Rights Office',
    category: 'rights_legal',
    url: 'https://www.ohchr.org/en/countries/syria',
    graphUse: 'Treaty body engagement, communications archive, Special Procedures referrals.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-icrc-ihl-syria',
    title: 'ICRC — IHL practice on Syria',
    publisher: 'International Committee of the Red Cross',
    category: 'rights_legal',
    url: 'https://www.icrc.org/en/where-we-work/middle-east/syria',
    graphUse: 'Detention visits and IHL outreach record cited in detention-facility analysis.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-iiim-syria',
    title: 'IIIM — Independent Mechanism for Syria',
    publisher: 'UN General Assembly',
    category: 'rights_legal',
    url: 'https://iiim.un.org/',
    graphUse: 'Evidence collection mandate; relevant to coastal-violence accountability commitment.',
    retrievedAt: '2026-05-04',
  },

  // ── Academic centres ──────────────────────────────────────────────────
  {
    id: 'sgr-stanford-cisac-syria',
    title: 'Stanford CISAC — Mapping Militant Organizations (Syria)',
    publisher: 'Stanford CISAC',
    category: 'academic_centre',
    url: 'https://cisac.fsi.stanford.edu/mappingmilitants',
    graphUse: 'Structured profiles of armed groups feeding the actor catalogue.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-belfer-mena',
    title: 'Harvard Belfer Center — Middle East Initiative',
    publisher: 'Harvard Kennedy School',
    category: 'academic_centre',
    url: 'https://www.belfercenter.org/project/middle-east-initiative',
    graphUse: 'Analytic memos on Levant security and reconstruction.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-rand-mena',
    title: 'RAND — Middle East / Syria research',
    publisher: 'RAND Corporation',
    category: 'academic_centre',
    url: 'https://www.rand.org/topics/syria.html',
    graphUse: 'Long-form policy research on stabilisation, force posture, and reconstruction.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-usip-syria',
    title: 'USIP — Syria program',
    publisher: 'United States Institute of Peace',
    category: 'academic_centre',
    url: 'https://www.usip.org/regions/middle-east-and-north-africa/syria',
    graphUse: 'Mediation tools, transitional-justice handbooks, legitimacy analysis.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-mei-syria',
    title: 'Middle East Institute — Syria program',
    publisher: 'MEI',
    category: 'academic_centre',
    url: 'https://www.mei.edu/programs/syria-program',
    graphUse: 'Practitioner-led analysis on factional dynamics and external balancing.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-carnegie-mec',
    title: 'Carnegie Middle East Center',
    publisher: 'Carnegie Endowment',
    category: 'academic_centre',
    url: 'https://carnegie-mec.org/',
    graphUse: 'Beirut-based analysis on inclusive governance, political economy, regional balance.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-chatham-syria',
    title: 'Chatham House — Syria',
    publisher: 'Chatham House',
    category: 'academic_centre',
    url: 'https://www.chathamhouse.org/topics/syria',
    graphUse: 'European policy framing of the transition, sanctions, and reconstruction tracks.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-ipi-global-observatory',
    title: 'IPI Global Observatory — Syria coverage',
    publisher: 'International Peace Institute',
    category: 'academic_centre',
    url: 'https://theglobalobservatory.org/?s=syria',
    graphUse: 'UN-system commentary on mediation, peacekeeping, and humanitarian access.',
    retrievedAt: '2026-05-04',
  },

  // ── Data portals ──────────────────────────────────────────────────────
  {
    id: 'sgr-worldbank-syria',
    title: 'World Bank — Syrian Arab Republic country page',
    publisher: 'World Bank',
    category: 'data_portal',
    url: 'https://www.worldbank.org/en/country/syria',
    graphUse: 'Macroeconomic indicators, poverty assessments, reconstruction-cost estimates.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-acaps-syria',
    title: 'ACAPS — Syria crisis page',
    publisher: 'ACAPS',
    category: 'data_portal',
    url: 'https://www.acaps.org/en/countries/syria',
    graphUse: 'Independent humanitarian risk and access analysis, scenario notes.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-hdx-syria',
    title: 'Humanitarian Data Exchange — Syria datasets',
    publisher: 'OCHA Centre for Humanitarian Data',
    category: 'data_portal',
    url: 'https://data.humdata.org/group/syr',
    graphUse: 'Open datasets on displacement, food security, and access incidents for graph evidence.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-unhcr-data-syria',
    title: 'UNHCR Operational Data Portal — Syrian situation',
    publisher: 'UNHCR',
    category: 'data_portal',
    url: 'https://data.unhcr.org/en/situations/syria',
    graphUse: 'Refugee, returnee, and IDP figures by host country and governorate.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-ucdp-syria',
    title: 'UCDP — Syria conflict dataset',
    publisher: 'Uppsala Conflict Data Program',
    category: 'data_portal',
    url: 'https://ucdp.uu.se/country/652',
    graphUse: 'Battle deaths, dyad-level conflict events feeding the timeline visualisation.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-gdelt-syria',
    title: 'GDELT — Syria events feed',
    publisher: 'GDELT Project',
    category: 'data_portal',
    url: 'https://www.gdeltproject.org/',
    graphUse: 'Tonal media monitoring used to triangulate narrative-volume signals.',
    retrievedAt: '2026-05-04',
  },

  // ── Testimony / civil-society archives ────────────────────────────────
  {
    id: 'sgr-syriauntold-archive',
    title: 'SyriaUntold — civil society and oral history archive',
    publisher: 'SyriaUntold',
    category: 'testimony',
    url: 'https://syriauntold.com/',
    graphUse: 'Civic storytelling and grassroots testimony for narrative-track grounding.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-snhr',
    title: 'Syrian Network for Human Rights — documentation',
    publisher: 'SNHR',
    category: 'testimony',
    url: 'https://snhr.org/',
    graphUse: 'Casualty and detention documentation cited by UN reports.',
    retrievedAt: '2026-05-04',
  },
  {
    id: 'sgr-vdc-syria',
    title: 'Violations Documentation Center in Syria',
    publisher: 'VDC',
    category: 'testimony',
    url: 'https://vdc-sy.net/en/',
    graphUse: 'Long-running incident database used as cross-check on rights claims.',
    retrievedAt: '2026-05-04',
  },
];

export const SYRIA_REFERENCE_CATEGORIES: { id: SyriaReferenceCategory; label: string; tone: string }[] = [
  { id: 'encyclopedic',    label: 'Encyclopedic',    tone: 'bg-slate-100 text-slate-700' },
  { id: 'un_doc',          label: 'UN documents',    tone: 'bg-blue-100 text-blue-800' },
  { id: 'rights_legal',    label: 'Rights & legal',  tone: 'bg-rose-100 text-rose-800' },
  { id: 'academic_centre', label: 'Academic centres',tone: 'bg-emerald-100 text-emerald-800' },
  { id: 'data_portal',     label: 'Data portals',    tone: 'bg-amber-100 text-amber-800' },
  { id: 'testimony',       label: 'Testimony',       tone: 'bg-purple-100 text-purple-800' },
];

export function syriaReferencesByCategory(): Record<SyriaReferenceCategory, SyriaGroundedReference[]> {
  const out: Record<SyriaReferenceCategory, SyriaGroundedReference[]> = {
    encyclopedic: [],
    un_doc: [],
    rights_legal: [],
    academic_centre: [],
    data_portal: [],
    testimony: [],
  };
  for (const ref of SYRIA_GROUNDED_REFERENCES) out[ref.category].push(ref);
  return out;
}
