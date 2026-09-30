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
      'Ask questions and return to saved conversations',
      'Build private context from notes and documents',
      'Attach saved context and inspect its sources',
      'Review claims and revise saved drafts',
    ],
  },
  {
    id: 'analyst',
    name: 'Practitioner',
    price: 49,
    usage: '250,000 PRAXIS credits per billing period',
    maxSituations: 10,
    highlighted: true,
    cta: 'Discuss a proposal',
    audience: 'Individual analysts, policy officers, and researchers',
    availability: 'Proposed paid plan',
    features: [
      'Individual workspace for policy research and writing',
      'Private context from notes, TXT, PDF and DOCX files',
      'Saved conversations with source information',
      'Reviewed drafts with Markdown and DOCX downloads',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 199,
    usage: 'Shared context library · per seat',
    maxSituations: 25,
    cta: 'Discuss a proposal',
    audience: 'Mediation teams, policy units, and research desks',
    availability: 'Proposed paid plan',
    features: [
      'Shared context, seats and permissions need separate implementation and verification.',
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
      'Agree on data handling, governance and deployment requirements before an evaluation.',
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
  'Experimental workspace limits apply. Review generated work against its sources before sharing.';
