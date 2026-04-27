import type { AnalystRole } from '@/types/analyst-profile';

export interface ChipLibrary {
  mandateChipsByRole: Record<AnalystRole, string[]>;
  lensDescriptors: string[];    // descriptor one-liners, not the 9-lens list
  redLineChips: string[];
  orgAutocomplete: string[];
}

export const FALLBACK_CHIPS: ChipLibrary = {
  mandateChipsByRole: {
    un_official: [
      'I brief senior UN leadership on prevention and response.',
      'I support peace operations with political analysis.',
      'I draft Security Council products.',
      'I staff the Secretary-General on country files.',
      'I monitor ceasefire compliance on the ground.',
      'I coordinate regional mediation support teams.',
      'I write for the Executive Office of the Secretary-General.',
      'I oversee humanitarian response operations.',
    ],
    diplomat: [
      'I produce cables and positions for my ministry.',
      'I negotiate on behalf of my country at the UN.',
      'I coordinate with allied missions on conflict files.',
      'I advise the foreign minister on a regional dossier.',
      'I lead a country desk.',
    ],
    mediator: [
      'I prepare for mediation sessions with multi-party frameworks.',
      'I track party positions, interests, and ZOPA before each round.',
      'I design confidence-building measures and process architecture.',
      'I run shuttle diplomacy and track each party privately.',
      'I support a special envoy with options analysis and red-line maps.',
      'I draft mediation strategy notes for senior leadership.',
    ],
    think_tank: [
      'I publish policy briefs for a generalist policymaker audience.',
      'I produce scenario analyses on conflict trajectories.',
      'I write long-form reports for expert readership.',
      'I contribute to a flagship annual conflict report.',
    ],
    ngo: [
      'I document human rights violations.',
      'I advocate with donors on humanitarian response.',
      'I produce evidence briefs for litigation or accountability.',
      'I support local peacebuilding programs with analysis.',
    ],
    researcher: [
      'I produce peer-reviewed conflict research.',
      'I maintain a conflict dataset.',
      'I advise graduate students on conflict fieldwork.',
    ],
    journalist: [
      'I report on armed conflict and diplomacy.',
      'I produce longform investigations into war crimes.',
      'I cover sanctions, treaties, and UN bodies.',
    ],
    private_sector: [
      'I advise corporate clients on geopolitical risk.',
      'I produce due-diligence reports on conflict-affected markets.',
      'I assess supply-chain exposure to conflict.',
    ],
    other: [
      'I monitor conflict developments for my organization.',
      'I produce briefings for decision-makers.',
      'I research conflict dynamics.',
    ],
  },
  lensDescriptors: [],
  redLineChips: [
    'Never use "terrorism" absent legal designation — prefer "armed group".',
    'Always cite sources with URL or official document reference.',
    'Avoid regime-change framing.',
    'Stay neutral on party blame in ongoing mediations.',
    'Prefer "armed group" over "militant" absent confirmed designation.',
    'Use gender-inclusive language throughout.',
    'Avoid securitizing humanitarian framing.',
    'Cite UN resolutions by number (e.g., S/RES/2286).',
    'Never reveal one party’s BATNA or red lines to another.',
    'Distinguish stated positions from revealed interests in every memo.',
    'Always cite methodology limitations alongside findings.',
  ],
  orgAutocomplete: [
    // Core UN HQ
    'UN DPPA', 'UN DPO', 'UN OCHA', 'UN OHCHR', 'UN DGC', 'UN DESA',
    'UN Mediation Support Unit', 'UN Peacebuilding Support Office',
    'UN Counter-Terrorism Office', 'UN Office of the Special Envoy for Yemen',
    // UN regional offices
    'UNOCA (UN Regional Office for Central Africa)',
    'UNOWAS (UN Office for West Africa and the Sahel)',
    'UNAMI (UN Assistance Mission for Iraq)',
    'UNAMA (UN Assistance Mission in Afghanistan)',
    'UNSMIL (UN Support Mission in Libya)',
    'UNMHA (UN Mission in Hudaydah)',
    'UNRCCA (UN Regional Centre for Preventive Diplomacy for Central Asia)',
    // UN funds, programmes, agencies
    'UNDP', 'UNHCR', 'UNICEF', 'WFP', 'UNFPA', 'WHO', 'IOM', 'UN Women',
    'UNESCO', 'UNEP', 'UNODC', 'UNIDIR',
    // Regional intergovernmental
    'OSCE', 'EU EEAS', 'EU Commission DG NEAR', 'EU Commission DG INTPA',
    'African Union', 'AU Peace and Security Council', 'ECOWAS', 'IGAD',
    'ASEAN', 'OAS', 'League of Arab States', 'GCC',
    'Council of Europe', 'NATO', 'NATO PA',
    // ICRC / Movement / IOs
    'ICRC', 'IFRC', 'MSF', 'Norwegian Refugee Council', 'Save the Children',
    'Oxfam', 'Mercy Corps', 'Refugees International',
    // Conflict-prevention / mediation NGOs
    'Crisis Group', 'Centre for Humanitarian Dialogue', 'Berghof Foundation',
    'Conciliation Resources', 'Inter-Mediate', 'Carter Center',
    'Community of Sant’Egidio', 'Crisis Action',
    // Think tanks (global)
    'Carnegie Endowment', 'Chatham House', 'Brookings', 'RAND',
    'Wilson Center', 'SIPRI', 'IISS', 'Geneva Academy', 'CSIS',
    'Atlantic Council', 'Council on Foreign Relations', 'USIP',
    'European Council on Foreign Relations', 'IFRI', 'IPI',
    'ODI', 'Clingendael', 'PRIO', 'GIGA Hamburg', 'IISS Manama',
    'Asia Society', 'Stimson Center', 'Quincy Institute',
    // Human rights / accountability
    'HRW', 'Amnesty International', 'FIDH', 'CIVICUS', 'Front Line Defenders',
    'Privacy International', 'Article 19', 'Reporters Without Borders',
    // National foreign-policy ministries
    'US State Department', 'US AID', 'US INR', 'UK FCDO', 'UK MoD',
    'French MFA', 'French AFD', 'German AA', 'German GIZ',
    'Swiss FDFA', 'Norwegian MFA', 'Swedish MFA', 'Dutch BZ',
    'Canadian GAC', 'Australian DFAT', 'Japanese MoFA', 'Korean MOFA',
    'Brazilian Itamaraty', 'Indian MEA', 'South African DIRCO',
    // Permanent missions to the UN (frequent picks)
    'Permanent Mission of France to the UN',
    'Permanent Mission of the United Kingdom to the UN',
    'Permanent Mission of Switzerland to the UN',
    'Permanent Mission of Norway to the UN',
    // Universities (research)
    'Harvard Kennedy School', 'Princeton SPIA', 'Tufts Fletcher School',
    'Georgetown Walsh', 'SOAS University of London', 'King’s College War Studies',
    'Sciences Po', 'Hertie School', 'Graduate Institute Geneva',
    // Private-sector adjacent
    'Control Risks', 'Eurasia Group', 'Risk Advisory', 'Verisk Maplecroft',
    'S-RM', 'Teneo', 'Dragonfly Intelligence',
  ],
};

export function getMandateChips(role: AnalystRole): string[] {
  return FALLBACK_CHIPS.mandateChipsByRole[role] ?? FALLBACK_CHIPS.mandateChipsByRole.other;
}

export function getRedLineChips(): string[] {
  return FALLBACK_CHIPS.redLineChips;
}
