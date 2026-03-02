// ============================================================================
// UN Terminology Database
// Comprehensive list of terms with their preferred UN alternatives
// ============================================================================

export interface TerminologyEntry {
  /** The term to flag (case-insensitive matching) */
  term: string;
  /** UN-preferred replacement(s) */
  suggestion: string;
  /** Explanation of why this term should be avoided */
  reason: string;
  /** Severity: error = must change, warning = should change, info = consider changing */
  severity: 'error' | 'warning' | 'info';
  /** Category of the terminology rule */
  category: TerminologyCategory;
}

export type TerminologyCategory =
  | 'conflict'
  | 'actors'
  | 'humanitarian'
  | 'political'
  | 'human_rights'
  | 'geographic'
  | 'gender'
  | 'legal'
  | 'style';

export const UN_TERMINOLOGY: TerminologyEntry[] = [
  // ---- Conflict and Security ----
  {
    term: 'war',
    suggestion: 'armed conflict',
    reason:
      '"War" has a specific legal meaning under international law. "Armed conflict" is the preferred UN term for hostilities that do not constitute a formally declared war.',
    severity: 'error',
    category: 'conflict',
  },
  {
    term: 'civil war',
    suggestion: 'non-international armed conflict / internal armed conflict',
    reason:
      '"Civil war" is imprecise and can be politically charged. Use "non-international armed conflict" (NIAC) for IHL contexts or "internal armed conflict" for general use.',
    severity: 'warning',
    category: 'conflict',
  },
  {
    term: 'battle',
    suggestion: 'hostilities / armed engagement / fighting',
    reason:
      '"Battle" can imply a degree of organization and legitimacy. Use "hostilities," "armed engagement," or "fighting" for more neutral framing.',
    severity: 'info',
    category: 'conflict',
  },
  {
    term: 'clash',
    suggestion: 'armed confrontation / incident / exchange of fire',
    reason:
      '"Clash" can minimize serious incidents. Use more precise descriptions of the nature and scale of the incident.',
    severity: 'info',
    category: 'conflict',
  },
  {
    term: 'invasion',
    suggestion: 'military incursion / military operation across the border / use of force',
    reason:
      '"Invasion" is a politically loaded term. Use neutral descriptions of the military action while noting its cross-border nature.',
    severity: 'warning',
    category: 'conflict',
  },
  {
    term: 'attack',
    suggestion: 'military operation / offensive / strike / assault (be specific)',
    reason:
      '"Attack" can be ambiguous. Specify the type of military action: air strike, ground offensive, shelling, etc.',
    severity: 'info',
    category: 'conflict',
  },
  {
    term: 'cease-fire',
    suggestion: 'ceasefire',
    reason: 'UN style uses "ceasefire" as one word, not hyphenated.',
    severity: 'info',
    category: 'style',
  },
  {
    term: 'peace-keeping',
    suggestion: 'peacekeeping',
    reason: 'UN style uses "peacekeeping" as one word, not hyphenated.',
    severity: 'info',
    category: 'style',
  },
  {
    term: 'peace-building',
    suggestion: 'peacebuilding',
    reason: 'UN style uses "peacebuilding" as one word, not hyphenated.',
    severity: 'info',
    category: 'style',
  },
  {
    term: 'collateral damage',
    suggestion: 'civilian casualties / harm to civilians',
    reason:
      '"Collateral damage" is a euphemism that minimizes civilian suffering. Use direct language about civilian casualties or harm.',
    severity: 'warning',
    category: 'conflict',
  },
  {
    term: 'surgical strike',
    suggestion: 'targeted military operation / precision strike',
    reason:
      '"Surgical strike" implies a level of precision that may not be accurate. Use neutral descriptive language.',
    severity: 'warning',
    category: 'conflict',
  },

  // ---- Actors ----
  {
    term: 'regime',
    suggestion: 'Government / authorities / administration',
    reason:
      '"Regime" carries negative connotations implying illegitimacy. Use "Government," "authorities," or the specific name of the governing body.',
    severity: 'error',
    category: 'actors',
  },
  {
    term: 'rebel',
    suggestion: 'opposition armed group / non-State armed group',
    reason:
      '"Rebel" can imply illegitimacy. Use "opposition armed group" or "non-State armed group" for neutrality. Name specific groups where possible.',
    severity: 'error',
    category: 'actors',
  },
  {
    term: 'terrorist',
    suggestion: 'designated entity / non-State armed group (unless Security Council-designated)',
    reason:
      '"Terrorist" should only be used for entities designated as such by the Security Council. For others, use "non-State armed group" or specific designation.',
    severity: 'error',
    category: 'actors',
  },
  {
    term: 'insurgent',
    suggestion: 'non-State armed group / armed opposition',
    reason:
      '"Insurgent" implies a judgment about legitimacy. Use neutral terminology unless quoting a specific party.',
    severity: 'warning',
    category: 'actors',
  },
  {
    term: 'militia',
    suggestion: 'armed group / paramilitary group / community-based armed group',
    reason:
      '"Militia" can have varying meanings. Be more specific about the nature and affiliation of the group.',
    severity: 'info',
    category: 'actors',
  },
  {
    term: 'warlord',
    suggestion: 'armed group leader / local commander / faction leader',
    reason:
      '"Warlord" is a pejorative term. Use neutral descriptors of the individual\'s role and authority.',
    severity: 'warning',
    category: 'actors',
  },
  {
    term: 'strongman',
    suggestion: 'leader / head of state / political leader',
    reason:
      '"Strongman" is informal and judgmental. Use the proper title or a neutral descriptor.',
    severity: 'warning',
    category: 'actors',
  },
  {
    term: 'puppet state',
    suggestion: 'allied state / state under influence',
    reason:
      '"Puppet state" is a politically loaded characterization. Describe the relationship dynamics neutrally.',
    severity: 'error',
    category: 'actors',
  },
  {
    term: 'rogue state',
    suggestion: 'state of concern / state subject to sanctions',
    reason:
      '"Rogue state" is a politically loaded term with no legal meaning. Describe specific behaviors or designations.',
    severity: 'error',
    category: 'actors',
  },
  {
    term: 'failed state',
    suggestion: 'state facing governance challenges / fragile state / state with limited capacity',
    reason:
      '"Failed state" is a contested concept with stigmatizing connotations. Describe specific governance challenges instead.',
    severity: 'warning',
    category: 'actors',
  },

  // ---- Humanitarian ----
  {
    term: 'internal refugees',
    suggestion: 'internally displaced persons (IDPs)',
    reason:
      '"Refugees" has a specific legal definition (crossing an international border). People displaced within their own country are "internally displaced persons" (IDPs).',
    severity: 'error',
    category: 'humanitarian',
  },
  {
    term: 'victim',
    suggestion: 'affected person / survivor / person affected by the conflict',
    reason:
      '"Victim" can be disempowering. Use "affected person" or "survivor" except in legal/IHL contexts where "victim" has a specific meaning.',
    severity: 'info',
    category: 'humanitarian',
  },
  {
    term: 'famine',
    suggestion: 'severe food insecurity / acute food crisis (unless IPC Phase 5 declared)',
    reason:
      '"Famine" has a specific technical definition (IPC Phase 5). Use "severe food insecurity" or "acute food crisis" unless famine has been formally declared.',
    severity: 'warning',
    category: 'humanitarian',
  },
  {
    term: 'natural disaster',
    suggestion: 'disaster / natural hazard',
    reason:
      'Disasters are never fully "natural" as their impact depends on human vulnerability and preparedness. Use "disaster" or "natural hazard."',
    severity: 'info',
    category: 'humanitarian',
  },
  {
    term: 'illegal immigrant',
    suggestion: 'irregular migrant / undocumented migrant',
    reason:
      'No person is "illegal." Use "irregular migrant" or "undocumented migrant" to describe immigration status.',
    severity: 'error',
    category: 'humanitarian',
  },
  {
    term: 'alien',
    suggestion: 'non-citizen / foreign national',
    reason:
      '"Alien" is dehumanizing. Use "non-citizen" or "foreign national."',
    severity: 'warning',
    category: 'humanitarian',
  },
  {
    term: 'refugee camp',
    suggestion: 'refugee settlement / refugee site (check UNHCR preferred term for context)',
    reason:
      'UNHCR increasingly uses "settlement" to reflect the evolving nature of refugee hosting situations. Check context-specific preferred terms.',
    severity: 'info',
    category: 'humanitarian',
  },
  {
    term: 'aid',
    suggestion: 'humanitarian assistance / development cooperation',
    reason:
      '"Aid" can imply dependency. Use "humanitarian assistance" for emergency contexts and "development cooperation" for long-term programs.',
    severity: 'info',
    category: 'humanitarian',
  },

  // ---- Political ----
  {
    term: 'ethnic cleansing',
    suggestion:
      'use only when findings have been made by a competent body; otherwise describe specific acts',
    reason:
      '"Ethnic cleansing" is a serious accusation. It should only be used when a competent body (e.g., international commission of inquiry) has made such a finding.',
    severity: 'error',
    category: 'human_rights',
  },
  {
    term: 'genocide',
    suggestion:
      'use only when determined by a competent judicial body; otherwise describe the specific acts',
    reason:
      '"Genocide" has a specific legal definition under the Genocide Convention. It should only be used when a competent judicial body has made such a determination.',
    severity: 'error',
    category: 'human_rights',
  },
  {
    term: 'tribe',
    suggestion: 'ethnic group / community / people / nation',
    reason:
      '"Tribe" can be perceived as pejorative. Use "ethnic group," "community," "people," or the specific group name.',
    severity: 'warning',
    category: 'political',
  },
  {
    term: 'sect',
    suggestion: 'religious community / denomination / faith group',
    reason:
      '"Sect" carries negative connotations. Use "religious community," "denomination," or the specific group name.',
    severity: 'warning',
    category: 'political',
  },
  {
    term: 'third world',
    suggestion: 'developing country / low-income country / Global South',
    reason:
      '"Third World" is an outdated Cold War-era term. Use "developing country," "low-income country," or "Global South."',
    severity: 'warning',
    category: 'political',
  },
  {
    term: 'underdeveloped',
    suggestion: 'developing / least developed',
    reason:
      '"Underdeveloped" can be perceived as stigmatizing. Use "developing" or "least developed" (an official UN category).',
    severity: 'info',
    category: 'political',
  },

  // ---- Gender ----
  {
    term: 'chairman',
    suggestion: 'chairperson / chair',
    reason: 'Use gender-inclusive language. "Chairperson" or "Chair" is the UN standard.',
    severity: 'warning',
    category: 'gender',
  },
  {
    term: 'spokesman',
    suggestion: 'spokesperson',
    reason: 'Use gender-inclusive language. "Spokesperson" is the UN standard.',
    severity: 'warning',
    category: 'gender',
  },
  {
    term: 'mankind',
    suggestion: 'humankind / humanity',
    reason: 'Use gender-inclusive language. "Humankind" or "humanity" is preferred.',
    severity: 'warning',
    category: 'gender',
  },
  {
    term: 'manpower',
    suggestion: 'personnel / workforce / human resources',
    reason: 'Use gender-inclusive language. "Personnel," "workforce," or "human resources" is preferred.',
    severity: 'warning',
    category: 'gender',
  },
  {
    term: 'man-made',
    suggestion: 'human-caused / human-made / artificial',
    reason: 'Use gender-inclusive language.',
    severity: 'info',
    category: 'gender',
  },
  {
    term: 'policeman',
    suggestion: 'police officer',
    reason: 'Use gender-inclusive language.',
    severity: 'warning',
    category: 'gender',
  },
  {
    term: 'fireman',
    suggestion: 'firefighter',
    reason: 'Use gender-inclusive language.',
    severity: 'warning',
    category: 'gender',
  },

  // ---- Legal ----
  {
    term: 'laws of war',
    suggestion: 'international humanitarian law (IHL)',
    reason:
      '"International humanitarian law" (IHL) is the correct legal term. "Laws of war" is colloquial.',
    severity: 'warning',
    category: 'legal',
  },
  {
    term: 'war crime',
    suggestion: 'serious violation of international humanitarian law / war crime (only if adjudicated)',
    reason:
      '"War crime" should be used only when referring to adjudicated cases or quoting competent bodies. Otherwise use "serious violation of IHL" or "alleged war crime."',
    severity: 'warning',
    category: 'legal',
  },
  {
    term: 'crime against humanity',
    suggestion:
      'use only when findings made by a competent body; otherwise describe the specific acts or use "alleged"',
    reason:
      '"Crimes against humanity" has a specific legal definition. Use with care and appropriate qualification.',
    severity: 'warning',
    category: 'legal',
  },
  {
    term: 'illegal occupation',
    suggestion: 'occupation / military occupation (describe facts; legal characterization by competent bodies)',
    reason:
      'Legality of an occupation should be determined by competent legal bodies. Describe the factual situation and reference relevant legal opinions.',
    severity: 'warning',
    category: 'legal',
  },

  // ---- Style ----
  {
    term: 'about',
    suggestion: 'approximately (in formal text)',
    reason: '"Approximately" is preferred in formal UN documents over "about" or "around."',
    severity: 'info',
    category: 'style',
  },
  {
    term: 'around',
    suggestion: 'approximately (in formal text)',
    reason: '"Approximately" is preferred in formal UN documents over "about" or "around."',
    severity: 'info',
    category: 'style',
  },
  {
    term: 'percent',
    suggestion: 'per cent (two words in UN text; % in tables)',
    reason: 'UN style uses "per cent" (two words) in running text and "%" in tables and figures.',
    severity: 'info',
    category: 'style',
  },
  {
    term: 'talks',
    suggestion: 'dialogue / consultations / negotiations',
    reason:
      '"Talks" is informal. Use "dialogue," "consultations," or "negotiations" in formal documents.',
    severity: 'info',
    category: 'style',
  },
  {
    term: 'deal',
    suggestion: 'agreement / arrangement / understanding',
    reason: '"Deal" is informal. Use "agreement," "arrangement," or "understanding" in formal documents.',
    severity: 'info',
    category: 'style',
  },
];

// ============================================================================
// Terminology Lookup Utilities
// ============================================================================

/**
 * Create a case-insensitive lookup map for fast term matching.
 */
export const TERMINOLOGY_MAP = new Map<string, TerminologyEntry>(
  UN_TERMINOLOGY.map((entry) => [entry.term.toLowerCase(), entry])
);

/**
 * Get terminology entries filtered by category.
 */
export function getTermsByCategory(category: TerminologyCategory): TerminologyEntry[] {
  return UN_TERMINOLOGY.filter((entry) => entry.category === category);
}

/**
 * Get terminology entries filtered by severity.
 */
export function getTermsBySeverity(severity: 'error' | 'warning' | 'info'): TerminologyEntry[] {
  return UN_TERMINOLOGY.filter((entry) => entry.severity === severity);
}

/**
 * Check if a term is in the terminology database.
 */
export function lookupTerm(term: string): TerminologyEntry | undefined {
  return TERMINOLOGY_MAP.get(term.toLowerCase());
}
