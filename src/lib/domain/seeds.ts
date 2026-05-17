/**
 * Initial domain seeds — imported by scripts/seed-domains.ts AND by the
 * resolver fallback path when Firestore is unreachable in local dev.
 *
 * Every domain here extends `generic` via the resolver's deep-merge;
 * unspecified fields inherit from generic.
 */

import type { DomainConfig, DomainId } from '@/types/domain';
import { DOMAIN_SCHEMA_VERSION } from '@/types/domain';

type Seed = Omit<DomainConfig, 'version' | 'schemaVersion' | 'updatedAt' | 'updatedBy'>;

const s = (seed: Seed): Seed => seed;

// ---------------------------------------------------------------------------
// Framework id constants (must match src/lib/constants/frameworks.ts ids)
// ---------------------------------------------------------------------------

const FW = {
  GLASL: 'glasl_escalation',
  FISHER_URY: 'fisher_ury',
  INFORM: 'inform_risk',
  BARNETT_DUVALL: 'barnett_duvall_power',
  ZARTMAN: 'zartman_ripeness',
  STEDMAN: 'stedman_spoilers',
  MITCHELL: 'mitchell_agle_wood',
  OCHA: 'ocha_humanitarian',
  IPC: 'ipc_food_security',
  LEDERACH: 'lederach_pyramid',
  GALTUNG: 'galtung_triangle',
  UN_DPPA: 'un_dppa_brief',
  BERGHOF: 'berghof_mediation',
  PUTNAM: 'putnam_two_level',
  FEARON: 'fearon_rationalist',
} as const;

// ---------------------------------------------------------------------------
// Source id constants for supported grounded research and user-owned evidence.
// ---------------------------------------------------------------------------

const FEED = {
  GROUNDED_SEARCH: 'grounded_search',
  DOCUMENTS: 'documents',
  OHCHR: 'ohchr',
  AMNESTY: 'amnesty',
  HRW: 'hrw',
  UNEP: 'unep',
  UNDP: 'undp',
  OCHA_FEED: 'ocha',
  OFAC: 'ofac',
  UNODC: 'unodc',
  INTERPOL: 'interpol',
  EU_DISINFO: 'eu_disinfo',
} as const;

// ---------------------------------------------------------------------------
// Seeds — §5 of the 2026-04-19 spec
// ---------------------------------------------------------------------------

export const DOMAIN_SEEDS: Record<DomainId, Seed> = {
  // The baseline — every other domain inherits from this.
  generic: s({
    id: 'generic',
    name: 'Generic Intelligence Workspace',
    description:
      'The universal PRAXIS baseline. No domain specialisation. All lenses weighted equally, all feeds eligible, all 15 frameworks available.',
    parentId: null,
    lensWeights: {
      diplomatic: 1.0,
      security: 1.0,
      humanitarian: 1.0,
      economic: 1.0,
      legal_ihl: 1.0,
      human_rights: 1.0,
      development: 1.0,
      mediation: 1.0,
      climate_security: 1.0,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS],
    frameworks: [
      FW.GLASL,
      FW.FISHER_URY,
      FW.INFORM,
      FW.BARNETT_DUVALL,
      FW.ZARTMAN,
      FW.STEDMAN,
      FW.MITCHELL,
      FW.OCHA,
      FW.IPC,
      FW.LEDERACH,
      FW.GALTUNG,
      FW.UN_DPPA,
      FW.BERGHOF,
      FW.PUTNAM,
      FW.FEARON,
    ],
    promptOverrides: {},
    defaultAudience: 'myself',
    colorHex: '#0F172A',
    icon: 'Compass',
  }),

  'armed-conflict-security': s({
    id: 'armed-conflict-security',
    name: 'Armed Conflict & Security',
    description:
      'Wars, ceasefires, insurgencies, armed groups, military operations, and state-on-state security dynamics.',
    parentId: 'generic',
    lensWeights: {
      security: 1.8,
      diplomatic: 1.3,
      humanitarian: 1.2,
      mediation: 1.3,
      legal_ihl: 1.3,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS],
    frameworks: [FW.GLASL, FW.STEDMAN, FW.FEARON, FW.ZARTMAN, FW.MITCHELL, FW.INFORM],
    promptOverrides: {},
    defaultAudience: 'senior_leadership',
    colorHex: '#A63D40',
    icon: 'Shield',
  }),

  'diplomacy-negotiation': s({
    id: 'diplomacy-negotiation',
    name: 'Diplomacy & Negotiation',
    description:
      'Bilateral and multilateral diplomacy, peace processes, mediation, treaty drafting, and negotiation tradecraft.',
    parentId: 'generic',
    lensWeights: {
      diplomatic: 2.0,
      mediation: 1.8,
      legal_ihl: 1.3,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS],
    frameworks: [FW.FISHER_URY, FW.ZARTMAN, FW.BERGHOF, FW.PUTNAM, FW.LEDERACH, FW.UN_DPPA],
    promptOverrides: {},
    defaultAudience: 'senior_leadership',
    colorHex: '#1B3A5C',
    icon: 'Users',
  }),

  humanitarian: s({
    id: 'humanitarian',
    name: 'Humanitarian',
    description:
      'Displacement, protection, humanitarian access, IHL compliance, aid coordination, and crisis response.',
    parentId: 'generic',
    lensWeights: {
      humanitarian: 2.0,
      development: 1.3,
      human_rights: 1.3,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS],
    frameworks: [FW.OCHA, FW.IPC, FW.GALTUNG, FW.INFORM, FW.LEDERACH],
    promptOverrides: {},
    defaultAudience: 'external_partners',
    colorHex: '#E8B931',
    icon: 'HeartHandshake',
  }),

  'human-rights': s({
    id: 'human-rights',
    name: 'Human Rights',
    description:
      'Civil and political rights, accountability, transitional justice, documentation, and protection of rights defenders.',
    parentId: 'generic',
    lensWeights: {
      human_rights: 2.0,
      legal_ihl: 1.6,
      humanitarian: 1.3,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS, FEED.OHCHR, FEED.AMNESTY, FEED.HRW],
    frameworks: [FW.GALTUNG, FW.LEDERACH, FW.MITCHELL, FW.UN_DPPA],
    promptOverrides: {},
    defaultAudience: 'external_partners',
    colorHex: '#F72585',
    icon: 'Scale',
  }),

  'governance-rule-of-law': s({
    id: 'governance-rule-of-law',
    name: 'Governance & Rule of Law',
    description:
      'Elections, institutional integrity, anti-corruption, constitutional processes, judicial independence, and public administration.',
    parentId: 'generic',
    lensWeights: {
      diplomatic: 1.3,
      legal_ihl: 1.5,
      development: 1.3,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS],
    frameworks: [FW.PUTNAM, FW.MITCHELL, FW.LEDERACH, FW.UN_DPPA],
    promptOverrides: {},
    defaultAudience: 'senior_leadership',
    colorHex: '#4CC9F0',
    icon: 'Landmark',
  }),

  'economic-sanctions': s({
    id: 'economic-sanctions',
    name: 'Economic & Sanctions',
    description:
      'Sanctions regimes, trade controls, financial flows, economic statecraft, and development finance.',
    parentId: 'generic',
    lensWeights: {
      economic: 2.0,
      diplomatic: 1.5,
      security: 1.2,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS, FEED.OFAC],
    frameworks: [FW.BARNETT_DUVALL, FW.FEARON, FW.PUTNAM, FW.MITCHELL],
    promptOverrides: {},
    defaultAudience: 'senior_leadership',
    colorHex: '#59A14F',
    icon: 'TrendingUp',
  }),

  'development-stabilization': s({
    id: 'development-stabilization',
    name: 'Development & Stabilization',
    description:
      'Peacebuilding, reconstruction, SDG programming, stabilisation, and long-horizon development interventions.',
    parentId: 'generic',
    lensWeights: {
      development: 2.0,
      humanitarian: 1.4,
      economic: 1.3,
      mediation: 1.2,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS, FEED.UNDP],
    frameworks: [FW.LEDERACH, FW.GALTUNG, FW.BERGHOF, FW.MITCHELL],
    promptOverrides: {},
    defaultAudience: 'external_partners',
    colorHex: '#86BCB6',
    icon: 'Sprout',
  }),

  'climate-environmental-security': s({
    id: 'climate-environmental-security',
    name: 'Climate & Environmental Security',
    description:
      'Climate-driven displacement, water and food security, resource conflict, and environmental peacebuilding.',
    parentId: 'generic',
    lensWeights: {
      climate_security: 2.0,
      security: 1.3,
      humanitarian: 1.3,
      development: 1.2,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS, FEED.UNEP],
    frameworks: [FW.GALTUNG, FW.INFORM, FW.LEDERACH, FW.IPC],
    promptOverrides: {},
    defaultAudience: 'external_partners',
    colorHex: '#4A90A4',
    icon: 'Wind',
  }),

  'information-cyber': s({
    id: 'information-cyber',
    name: 'Information & Cyber',
    description:
      'Disinformation, media integrity, narrative conflict, cyber operations, and information environment analysis.',
    parentId: 'generic',
    lensWeights: {
      security: 1.5,
      diplomatic: 1.3,
      human_rights: 1.3,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS, FEED.EU_DISINFO],
    frameworks: [FW.BARNETT_DUVALL, FW.FEARON, FW.GALTUNG, FW.MITCHELL],
    promptOverrides: {},
    defaultAudience: 'senior_leadership',
    colorHex: '#9C755F',
    icon: 'Network',
  }),

  'transnational-threats': s({
    id: 'transnational-threats',
    name: 'Transnational Threats',
    description:
      'Terrorism, organised crime, trafficking, WMD proliferation, and cross-border illicit flows.',
    parentId: 'generic',
    lensWeights: {
      security: 1.8,
      legal_ihl: 1.5,
      diplomatic: 1.3,
    },
    preferredFeeds: [FEED.GROUNDED_SEARCH, FEED.DOCUMENTS, FEED.UNODC, FEED.INTERPOL],
    frameworks: [FW.STEDMAN, FW.MITCHELL, FW.FEARON, FW.BARNETT_DUVALL],
    promptOverrides: {},
    defaultAudience: 'senior_leadership',
    colorHex: '#FF6B6B',
    icon: 'AlertTriangle',
  }),
};

/** The version this seed file represents. Bumped when the seeds change. */
export const SEED_VERSION = 1;
export const SEED_SCHEMA_VERSION = DOMAIN_SCHEMA_VERSION;
