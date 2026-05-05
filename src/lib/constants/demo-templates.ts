/**
 * PRAXIS Demo Templates Registry
 *
 * Single source of truth for the three first-class demo templates that
 * showcase PRAXIS for prospects and walkthrough recordings.
 *
 * Each template:
 * - Has a stable case id used by every tool (`?case=<id>` query param).
 * - Maps to a canonical Situation record (Syria has a full Situation; the
 *   other two are domain-shaped templates resolved per-tool from seed data).
 * - Carries a domain + lens label so the cockpit and selectors can group them
 *   by the kind of analyst work they fit (international / domestic / risk).
 * - Lists the surfaces (tool ids) where the template has populated content.
 */

export type DemoTemplateLens =
  | 'international-conflict'
  | 'political-risk'
  | 'domestic-policy';

export interface DemoTemplate {
  /** Stable id used by `?case=<id>` everywhere. */
  id: string;
  /** Short label for selectors and pills. */
  shortName: string;
  /** Full display name. */
  name: string;
  /** One-liner for cards. */
  tagline: string;
  /** Region or jurisdiction. */
  region: string;
  /** Flag or icon emoji shown in selector. */
  flag: string;
  /** Lens / category for grouping. */
  lens: DemoTemplateLens;
  /** Audience persona this template suits. */
  persona: string;
  /** Default landing page when the template is opened. */
  defaultRoute: string;
  /** Tool ids that have seeded content for this template. */
  populatedTools: string[];
  /** Aliases the URL parameter may take (back-compat). */
  aliases?: string[];
  /** Meta numbers shown on the cockpit card. */
  meta: {
    actorCount: number;
    documentCount: number;
    sourceCount: number;
    riskScore: number;
  };
  /** Optional badge tone. */
  badge?: { label: string; tone: 'navy' | 'rose' | 'emerald' | 'amber' };
}

export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: 'syria',
    shortName: 'Syria',
    name: 'Syria · post-Assad transition',
    tagline:
      'Northeast integration, humanitarian access, regional spillover, and the January 2026 Damascus-SDF agreement.',
    region: 'Syrian Arab Republic',
    flag: '🇸🇾',
    lens: 'international-conflict',
    persona: 'UN-NY desk · peace and security analyst',
    defaultRoute: '/cockpit?case=syria',
    populatedTools: [
      'dashboard',
      'context-builder',
      'situation-intelligence',
      'stakeholder-map',
      'conflict-graph',
      'graphops',
      'timeline',
      'humanitarian',
      'media-compass',
      'media-roundup',
      'briefing',
      'editor',
      'source-scout',
      'deep-search-agent',
      'syria-case',
    ],
    aliases: ['syria-transition-2026'],
    meta: { actorCount: 14, documentCount: 5, sourceCount: 12, riskScore: 78 },
    badge: { label: 'Conflict + diplomacy', tone: 'rose' },
  },
  {
    id: 'pakistan-political-risk',
    shortName: 'Pakistan',
    name: 'Pakistan · political risk',
    tagline:
      'Civil-military balance, IMF programme conditionality, KP militancy, and the next provincial election cycle.',
    region: 'Islamic Republic of Pakistan',
    flag: '🇵🇰',
    lens: 'political-risk',
    persona: 'Sovereign / political risk analyst',
    defaultRoute: '/desks/political-risk?case=pakistan-political-risk',
    populatedTools: [
      'dashboard',
      'desks',
      'stakeholder-map',
      'media-compass',
      'timeline',
      'risk-monitor',
      'editor',
      'briefing',
    ],
    aliases: ['pakistan'],
    meta: { actorCount: 11, documentCount: 5, sourceCount: 12, riskScore: 74 },
    badge: { label: 'Sovereign + militancy', tone: 'navy' },
  },
  {
    id: 'us-housing',
    shortName: 'US Housing',
    name: 'US housing · domestic policy',
    tagline:
      'Zoning reform, ADU legalisation, rent-stabilisation, LIHTC pipelines, NIMBY litigation across 24 active states.',
    region: 'United States · multi-state',
    flag: '🇺🇸',
    lens: 'domestic-policy',
    persona: 'Domestic policy analyst · housing portfolio',
    defaultRoute: '/desks/us-housing?case=us-housing',
    populatedTools: [
      'dashboard',
      'desks',
      'stakeholder-map',
      'media-compass',
      'timeline',
      'editor',
      'briefing',
      'legal-tracker',
    ],
    meta: { actorCount: 12, documentCount: 5, sourceCount: 12, riskScore: 56 },
    badge: { label: 'Domestic policy', tone: 'emerald' },
  },
];

export const DEMO_TEMPLATE_IDS = DEMO_TEMPLATES.map((t) => t.id);

/** Resolve a template by id or alias (case-insensitive). Returns null if unknown. */
export function getDemoTemplate(idOrAlias: string | null | undefined): DemoTemplate | null {
  if (!idOrAlias) return null;
  const needle = idOrAlias.toLowerCase();
  return (
    DEMO_TEMPLATES.find(
      (t) =>
        t.id.toLowerCase() === needle ||
        (t.aliases ?? []).some((a) => a.toLowerCase() === needle),
    ) ?? null
  );
}

/** True if the case query param matches any registered demo template. */
export function isDemoTemplateCase(caseParam: string | null | undefined): boolean {
  return getDemoTemplate(caseParam) != null;
}

/** Group templates by lens for cockpit display. */
export function groupTemplatesByLens(): Record<DemoTemplateLens, DemoTemplate[]> {
  const groups: Record<DemoTemplateLens, DemoTemplate[]> = {
    'international-conflict': [],
    'political-risk': [],
    'domestic-policy': [],
  };
  for (const t of DEMO_TEMPLATES) groups[t.lens].push(t);
  return groups;
}
