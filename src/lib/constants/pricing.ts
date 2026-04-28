export interface PricingTier {
  id: 'free' | 'analyst' | 'team' | 'enterprise';
  name: string;
  price: number; // monthly USD, 0 = free
  usage: string;
  maxSituations: number;
  features: string[];
  highlighted?: boolean;
  cta: string;
  audience: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Demo',
    price: 0,
    usage: 'Read-only product walkthrough',
    maxSituations: 1,
    cta: 'Try the Demo',
    audience: 'Anyone evaluating PRAXIS for the first time',
    features: [
      'Pre-loaded Nordalia sample crisis',
      'Browse conflict graph, dashboard, and reports',
      'Synthetic data only — no live situations',
      'No credit card, no commitment',
    ],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    price: 99,
    usage: 'Single licence · 14-day free trial',
    maxSituations: 5,
    highlighted: true,
    cta: 'Start Analyst Plan',
    audience: 'Individual analysts, policy officers, and researchers',
    features: [
      '5 active live situations',
      'Full PRAXIS toolset — every analytical tool',
      'Situation-aware AI tools and reports',
      'Grounded Google Search research',
      'Canonical actor and entity checks',
      'Document upload and graph extraction',
      'Policy memos, briefings, and dossiers',
      'PDF and DOCX export',
      'Email support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 499,
    usage: 'Shared workspace · 14-day free trial · up to 10 seats',
    maxSituations: 25,
    cta: 'Start Team Plan',
    audience: 'Mediation teams, policy units, and research desks',
    features: [
      'Everything in Analyst',
      '25 active live situations',
      'Up to 10 seats included',
      'Shared situation workspaces and roles',
      'Advisor Council and premium workflows',
      'Source monitoring and alerting',
      'Graph backend configuration',
      'Team-ready export workflows',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Institution',
    price: -1, // custom
    usage: 'Custom institutional deployment',
    maxSituations: -1,
    cta: 'Contact TACITUS',
    audience: 'Institutions requiring governance, scale, and custom controls',
    features: [
      'Custom situation, seat, and usage limits',
      'Everything in Team',
      'SSO / SAML and audit controls',
      'Custom model and data residency options',
      'Dedicated graph/database architecture',
      'Private GCP deployment support',
      'Security review and procurement support',
      'Dedicated account team',
    ],
  },
];

export const PLAN_USAGE_BUCKETS = [
  {
    name: 'Core Intelligence',
    description: 'Dashboards, actor profiles, risk assessments, timelines, and situation-aware assistant work.',
  },
  {
    name: 'Grounded Research',
    description: 'Google Search grounding, source discovery, canonical entity checks, media review, and deep research.',
  },
  {
    name: 'Graph Intelligence',
    description: 'ACO extraction, graph rebuilds, graph queries, entity resolution, and graph-backed context retrieval.',
  },
  {
    name: 'Drafting & Export',
    description: 'Briefs, policy memos, reports, talking points, dossiers, and DOCX/PDF export workflows.',
  },
  {
    name: 'Institutional Controls',
    description: 'Optional graph database, SSO, audit, data residency, and private deployment integrations when configured.',
  },
];

/**
 * Server-side credit metering still exists for abuse control and internal cost
 * tracking, but public pricing should not expose a per-tool tariff table.
 * Keep operation-level costs in `src/lib/api/with-credits.ts`.
 */
export const INTERNAL_COST_DISCLOSURE_NOTICE =
  'PRAXIS plans are sold as monthly workspaces. Internal metering is used for reliability, abuse prevention, and fair-use controls.';
