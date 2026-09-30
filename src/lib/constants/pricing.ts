import { PRAXIS_ASK_CREDIT_COST, PRAXIS_STARTER_TOKEN_ALLOWANCE } from '@/lib/billing/usage-policy';

const starterAskAllowance = Math.floor(PRAXIS_STARTER_TOKEN_ALLOWANCE / PRAXIS_ASK_CREDIT_COST);

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
  availability: 'Current free beta' | 'Proposed paid plan' | 'By agreement';
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    usage: `One-time starter allowance: up to ${starterAskAllowance} Ask turns`,
    maxSituations: 1,
    cta: 'Start Free',
    audience: 'Solo researchers and policy workers evaluating PRAXIS',
    availability: 'Current free beta',
    features: [
      'Direct questions and saved conversations',
      'Other metered work shares the allowance; see your account remaining',
      'Attach saved context and inspect source information',
      'Build private context from notes and documents',
      'Review proposed claims and revise saved drafts',
      'Guide help for product and context-use questions',
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
    availability: 'Proposed paid plan',
    features: [
      'Proposed expanded individual workspace allowance',
      'Reusable context, research and writing workflows',
      'Source and review information retained with work',
      'Export formats and limits subject to activation checks',
      'Support terms confirmed before subscription',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 199,
    usage: 'Shared context library · per seat',
    maxSituations: 25,
    cta: 'Start Team',
    audience: 'Mediation teams, policy units, and research desks',
    availability: 'Proposed paid plan',
    features: [
      'Proposed shared context and team workspace workflows',
      'Permissions and reviewer roles require separate acceptance',
      'Shared evidence and review records',
      'Schedules require configured and tested execution',
      'Seat, usage and support terms confirmed before activation',
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
    availability: 'By agreement',
    features: [
      'Scope, usage and governance agreed for the engagement',
      'SSO / SAML subject to implementation and verification',
      'Residency and private deployment require written agreement',
      'Model access depends on provider and deployment availability',
      'Security and procurement requirements assessed before onboarding',
    ],
  },
];

export const PLAN_USAGE_BUCKETS = [
  {
    name: 'Saved Context',
    description: 'Build reusable sources, assumptions and preferences; attach them to a question.',
  },
  {
    name: 'Evidence Review',
    description: 'Inspect sources, supporting passages, conflicting claims and unresolved gaps.',
  },
  {
    name: 'Policy Analysis',
    description: 'Ask for options, tradeoffs, stakeholder views and comparisons; review their evidence.',
  },
  {
    name: 'Writing',
    description: 'Draft, correct and save briefs and memos. Downloads do not constitute publication approval.',
  },
  {
    name: 'Institutional Controls',
    description: 'Sharing, SSO, residency and private deployment are separately scoped capabilities, not current beta guarantees.',
  },
];

/**
 * Server-side credit metering still exists for abuse control and internal cost
 * tracking, but public pricing should not expose a per-tool tariff table.
 * Keep operation-level costs in `src/lib/api/with-credits.ts`.
 */
export const INTERNAL_COST_DISCLOSURE_NOTICE =
  'Workspace and research limits apply. Proposed plan prices and features are not active entitlements; confirmed terms are shown before any supported purchase.';
