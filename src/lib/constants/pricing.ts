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
    name: 'Free',
    price: 0,
    usage: 'Starter ContextCapsule workspace',
    maxSituations: 1,
    cta: 'Start Free',
    audience: 'Solo researchers and policy workers evaluating PRAXIS',
    features: [
      '1 active ContextCapsule',
      'Ask PRAXIS with active-capsule grounding visible',
      'Guide assistant for product and capsule-use questions',
      'Starter sourceability and memo workflow',
      'Context Core Lite creation',
      'No credit card, no commitment',
    ],
  },
  {
    id: 'analyst',
    name: 'Practitioner',
    price: 49,
    usage: 'Individual policy workspace',
    maxSituations: 10,
    highlighted: true,
    cta: 'Upgrade',
    audience: 'Individual analysts, policy officers, and researchers',
    features: [
      'Unlimited draft capsules, 10 active capsules',
      'User Core and Situation Core management',
      'Capsule-bound Ask PRAXIS, sourceability, grounded research, and memo drafting',
      'Capsule fork, lock, lineage, and handover',
      'Memo Studio exports with provenance',
      'Email support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 199,
    usage: 'Shared capsule library · per seat',
    maxSituations: 25,
    cta: 'Start Team',
    audience: 'Mediation teams, policy units, and research desks',
    features: [
      'Everything in Practitioner',
      'Shared ContextCapsule library',
      'Shared situation workspaces and roles',
      'Review gates, sourceability status, and audit receipts',
      'Scheduled brief and watchlist preparation when configured',
      'Team-ready handover workflows',
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
      'Private GCP, graph, and database architecture when configured',
      'Private GCP deployment support',
      'Security review and procurement support',
      'Dedicated account team',
    ],
  },
];

export const PLAN_USAGE_BUCKETS = [
  {
    name: 'Capsule Work',
    description: 'ContextCapsule creation, User and Situation cores, active stacks, Guide help, and capsule handover.',
  },
  {
    name: 'Sourceability',
    description: 'Source discovery, attached receipts, weak-claim checks, citation repair, and document review.',
  },
  {
    name: 'Analysis Tools',
    description: 'Timeline, graph/power map, ACH, scenario review, red-team review, and capsule-aware research agents.',
  },
  {
    name: 'Memo Studio',
    description: 'Briefs, policy memos, talking points, board notes, handover packets, and export workflows.',
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
