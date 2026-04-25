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
    usage: 'Pre-loaded workspace',
    maxSituations: 1,
    cta: 'Explore Demo',
    audience: 'Prospects, reviewers, and first-time practitioners',
    features: [
      'Pre-loaded Nordalia crisis scenario',
      'Guided access to core PRAXIS workflows',
      'Conflict graph, dashboard, reports, and assistant',
      'No account required for demo exploration',
      'Safe synthetic data only',
      'Designed for product evaluation',
      'Upgrade when you need live situations',
    ],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    price: 49,
    usage: 'Monthly live analysis bundle',
    maxSituations: 5,
    highlighted: true,
    cta: 'Start Analyst Plan',
    audience: 'Individual analysts, policy officers, and researchers',
    features: [
      '5 active live situations',
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
    price: 199,
    usage: 'Shared monthly team workspace',
    maxSituations: 25,
    cta: 'Start Team Plan',
    audience: 'Mediation teams, policy units, and research desks',
    features: [
      '25 active live situations',
      'Up to 10 seats',
      'Shared situation workspaces',
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
    name: 'Premium Connectors',
    description: 'Optional ACLED, Firecrawl, Anthropic, graph database, and institutional integrations when configured.',
  },
];

/**
 * Server-side credit metering still exists for abuse control and internal cost
 * tracking, but public pricing should not expose a per-tool tariff table.
 * Keep operation-level costs in `src/lib/api/with-credits.ts`.
 */
export const INTERNAL_COST_DISCLOSURE_NOTICE =
  'PRAXIS plans are sold as monthly workspaces. Internal metering is used for reliability, abuse prevention, and fair-use controls.';
