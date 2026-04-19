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
  ],
  orgAutocomplete: [
    'UN DPPA', 'UN DPO', 'UN OCHA', 'UN OHCHR', 'UN DGC',
    'OSCE', 'EU EEAS', 'African Union', 'ASEAN', 'ICRC', 'MSF',
    'Crisis Group', 'Carnegie Endowment', 'Chatham House', 'Brookings', 'RAND',
    'Wilson Center', 'SIPRI', 'IISS', 'Geneva Academy', 'HRW', 'Amnesty International',
    'US State Department', 'UK FCDO', 'French MFA', 'German AA',
  ],
};

export function getMandateChips(role: AnalystRole): string[] {
  return FALLBACK_CHIPS.mandateChipsByRole[role] ?? FALLBACK_CHIPS.mandateChipsByRole.other;
}

export function getRedLineChips(): string[] {
  return FALLBACK_CHIPS.redLineChips;
}
