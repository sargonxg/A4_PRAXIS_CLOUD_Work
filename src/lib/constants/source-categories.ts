/**
 * SOURCE_CATEGORIES — single source of truth for research source category metadata.
 *
 * This module is the ONLY place where category definitions live. Both the
 * situation-creation wizard (`src/app/app/situations/new/page.tsx`) and the
 * per-situation settings page (`src/app/app/situations/[id]/settings/page.tsx`)
 * import from here via the shared <SourcePicker> component. Adding, renaming
 * or re-colouring a category only requires editing this file — no other
 * component owns a parallel list.
 *
 * IDs are stable: never rename an existing `id` without a migration of the
 * `situation.sourceCategoriesEnabled` Firestore field, because enabled flags
 * are keyed by id.
 *
 * Shape:
 *   - id              stable string key (Firestore key; never rename)
 *   - label           short human name shown on the card
 *   - description     one-line summary for the card header
 *   - longDescription 2-3 sentence "what this really is" shown in Details
 *   - sources         named feeds/outlets inside this category (badges)
 *   - icon            lucide icon name (resolved by the consumer)
 *   - color           hex accent colour applied sparingly (icon tint, ring)
 *   - defaultEnabled  initial toggle state for a fresh situation
 *   - premium         paywall flag (defaults to false)
 *   - alwaysOn        cannot be toggled off (e.g. Foundational)
 */

import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Shield,
  Heart,
  Building2,
  Newspaper,
  Brain,
  Sword,
  DollarSign,
} from 'lucide-react';

export type SourceCategoryId =
  | 'foundational'
  | 'conflict-security'
  | 'humanitarian'
  | 'diplomatic-official'
  | 'news-media'
  | 'think-tanks'
  | 'military-intelligence'
  | 'economic-development';

export interface SourceCategory {
  /** Stable Firestore key. Never rename without a data migration. */
  id: SourceCategoryId;
  /** Short human name shown on the card. */
  label: string;
  /** One-line summary used in the card header. */
  description: string;
  /** 2-3 sentence "what this really is" shown in the Details disclosure. */
  longDescription: string;
  /** Named feeds/outlets inside this category, rendered as badges. */
  sources: string[];
  /** Search terms used when the category feeds a web-research run. */
  searchTerms?: string[];
  /** Lucide icon component reference. */
  icon: LucideIcon;
  /** Hex accent colour — applied to the icon tint and focus ring. */
  color: string;
  /** Initial toggle state for a new situation. */
  defaultEnabled: boolean;
  /** Paywall flag. `false` means included in every plan. */
  premium: boolean;
  /** If true the toggle is fixed ON and cannot be disabled by the user. */
  alwaysOn?: boolean;
  /** If true the category triggers a Google-grounded web-search run. */
  useGroundedSearch?: boolean;
}

/**
 * The eight canonical source categories PRAXIS ships with. Order is the
 * default display order — users can re-order locally via <SourcePicker>, and
 * that ordering is persisted separately as `sourceCategoryOrder: string[]`.
 */
export const SOURCE_CATEGORIES: SourceCategory[] = [
  {
    id: 'foundational',
    label: 'Foundational',
    description: 'Wikipedia, encyclopedic context, geo & demographic data',
    longDescription:
      'Always-on backbone for every situation. PRAXIS pulls canonical background, geography, demographics and historical framing before any other research runs, so downstream tools start from a shared factual baseline.',
    sources: ['Wikipedia', 'CIA World Factbook', 'CFR Country Profiles'],
    searchTerms: ['history background', 'geography demographics', 'overview'],
    icon: BookOpen,
    color: '#10B981',
    defaultEnabled: true,
    alwaysOn: true,
    premium: false,
  },
  {
    id: 'conflict-security',
    label: 'Conflict & Security',
    description: 'Armed groups, violence data, conflict dynamics',
    longDescription:
      'Structured conflict datasets and security-focused monitors. Combines event-level violence data with analytical weekly briefings so you can trace both what happened and how specialists read it.',
    sources: ['ICG CrisisWatch', 'UCDP', 'SIPRI', 'IISS', 'Geneva Academy', 'UCDP'],
    searchTerms: ['armed conflict violence escalation', 'security forces ceasefire'],
    icon: Shield,
    color: '#E15759',
    defaultEnabled: true,
    premium: false,
    useGroundedSearch: true,
  },
  {
    id: 'humanitarian',
    label: 'Humanitarian',
    description: 'Displacement, protection, aid operations, civilian impact',
    longDescription:
      'Humanitarian agencies and rights monitors covering displacement, protection and aid access. Primary signal for civilian-impact tools, IPC food security readings and OCHA-style situation reports.',
    sources: [
      'ReliefWeb',
      'UNHCR',
      'OCHA',
      'Human Rights Watch',
      'Amnesty International',
      'ICRC',
      'MSF',
    ],
    searchTerms: ['humanitarian crisis displacement refugees civilians'],
    icon: Heart,
    color: '#F28E2B',
    defaultEnabled: true,
    premium: false,
    useGroundedSearch: true,
  },
  {
    id: 'diplomatic-official',
    label: 'Diplomatic & Official',
    description: 'UN bodies, foreign ministry statements, official positions',
    longDescription:
      'Primary documents from multilateral bodies and foreign ministries. Feeds treaty tracking, Security Council monitoring and any tool that needs to cite what states or institutions formally said.',
    sources: [
      'UN News',
      'UNSC Resolutions',
      "What's In Blue",
      'US State Dept',
      'EU EEAS',
      'African Union',
      'OSCE',
    ],
    searchTerms: [
      'diplomatic negotiations peace talks UN Security Council resolution',
    ],
    icon: Building2,
    color: '#1B3A5C',
    defaultEnabled: true,
    premium: false,
    useGroundedSearch: true,
  },
  {
    id: 'news-media',
    label: 'News & Media',
    description: 'Breaking news, frontline reporting, regional press',
    longDescription:
      'Wire services and international broadcasters for up-to-the-hour developments. Useful for event detection and for surfacing how different editorial stances frame the same incident.',
    sources: ['Reuters', 'Associated Press', 'BBC', 'Al Jazeera', 'AFP', 'Financial Times'],
    searchTerms: ['latest news developments today situation update'],
    icon: Newspaper,
    color: '#4E79A7',
    defaultEnabled: true,
    premium: false,
    useGroundedSearch: true,
  },
  {
    id: 'think-tanks',
    label: 'Think Tanks & Policy',
    description: 'Expert analysis, policy briefs, scenario reports',
    longDescription:
      'Policy institutes and research foundations. The right category when you need structured argument, scenarios or recommendation-grade analysis — the kind of writing a briefing memo would cite.',
    sources: [
      'RAND',
      'Carnegie Endowment',
      'Chatham House',
      'Brookings',
      'Wilson Center',
      'CSIS',
    ],
    searchTerms: ['analysis policy brief expert assessment scenario'],
    icon: Brain,
    color: '#B07AA1',
    defaultEnabled: false,
    premium: false,
    useGroundedSearch: true,
  },
  {
    id: 'military-intelligence',
    label: 'Military & Intelligence',
    description: 'Armed forces, weapons, open-source intelligence',
    longDescription:
      'Defence trackers and OSINT collectives. Drives order-of-battle assessments, weapons attribution and geolocation verification in tools that need to describe military capability and movement.',
    sources: [
      "Jane's Defence",
      'IISS Military Balance',
      'Bellingcat',
      'Institute for the Study of War (ISW)',
      'Oryx',
    ],
    searchTerms: ['military forces weapons capabilities troop movements'],
    icon: Sword,
    color: '#9C755F',
    defaultEnabled: false,
    premium: true,
    useGroundedSearch: true,
  },
  {
    id: 'economic-development',
    label: 'Economic & Development',
    description: 'Economic drivers, sanctions, development indicators',
    longDescription:
      'Macroeconomic, sanctions and development datasets. Essential whenever a situation turns on economic leverage — debt distress, sanctions design, trade dependencies or humanitarian financing gaps.',
    sources: [
      'World Bank',
      'IMF',
      'UNDP',
      'Oxford Analytica',
      "Fitch/Moody's",
      'OFAC Sanctions List',
    ],
    searchTerms: ['economic sanctions poverty development GDP trade'],
    icon: DollarSign,
    color: '#EDC948',
    defaultEnabled: false,
    premium: false,
    useGroundedSearch: true,
  },
];

/** O(1) lookup by id. */
export const SOURCE_CATEGORY_BY_ID: Record<string, SourceCategory> =
  SOURCE_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    },
    {} as Record<string, SourceCategory>,
  );

/**
 * Build the default `enabled` record for a fresh situation. Always honours
 * `alwaysOn` regardless of `defaultEnabled`.
 */
export function defaultEnabledMap(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const cat of SOURCE_CATEGORIES) {
    out[cat.id] = cat.alwaysOn ? true : cat.defaultEnabled;
  }
  return out;
}

/** Convert a Record<id,bool> into the string[] shape used by older APIs. */
export function enabledMapToIdArray(
  enabled: Record<string, boolean>,
): string[] {
  return SOURCE_CATEGORIES.filter((c) => enabled[c.id]).map((c) => c.id);
}

/** Convert a string[] of enabled ids back into a Record<id,bool>. */
export function idArrayToEnabledMap(ids: string[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const cat of SOURCE_CATEGORIES) {
    out[cat.id] = cat.alwaysOn ? true : ids.includes(cat.id);
  }
  return out;
}

/** User-defined extra source attached to a category. */
export interface CustomSource {
  id: string;
  url: string;
  name?: string;
  categoryId: SourceCategoryId | string;
}
