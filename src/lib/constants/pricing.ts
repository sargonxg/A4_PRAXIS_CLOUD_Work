export interface PricingTier {
  id: 'free' | 'analyst' | 'team' | 'enterprise';
  name: string;
  price: number; // monthly USD, 0 = free
  credits: number; // monthly credits
  maxSituations: number;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Demo',
    price: 0,
    credits: 5000,
    maxSituations: 1,
    cta: 'Explore Demo',
    features: [
      'Pre-loaded Nordalia crisis scenario',
      'All 40+ PRAXIS tools unlocked',
      '1 active situation (Nordalia)',
      'AI Assistant (Gemini Flash)',
      'Full conflict graph & visualizations',
      'No account required',
    ],
  },
  {
    id: 'analyst',
    name: 'Analyst',
    price: 49,
    credits: 5000,
    maxSituations: 5,
    highlighted: true,
    cta: 'Start Analyst Plan',
    features: [
      '5 active situations',
      'All 40+ PRAXIS tools',
      'AI Assistant (Gemini Pro + Claude)',
      'Advanced reports & dossiers',
      'Unlimited document upload',
      'Deep research with web sources',
      'Media landscape analysis',
      'Scenario simulation & game theory',
      'Export (PDF, DOCX)',
      'Priority support',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 199,
    credits: 25000,
    maxSituations: 25,
    cta: 'Start Team Plan',
    features: [
      '25 active situations',
      'Everything in Analyst',
      'Team collaboration (up to 10 seats)',
      'Shared situation workspaces',
      'Custom AI instructions',
      'ARGUS knowledge graph queries',
      'CONCORDIA mediation tools',
      'API access',
      'Dedicated support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: -1, // custom
    credits: -1, // unlimited
    maxSituations: -1,
    cta: 'Contact Sales',
    features: [
      'Unlimited situations & seats',
      'Everything in Team',
      'Custom model deployment',
      'On-premise option',
      'SSO / SAML',
      'Audit logs',
      'SLA guarantee',
      'Dedicated account manager',
    ],
  },
];

export const CREDIT_COSTS: Record<string, { cost: number; label: string; category: string }> = {
  chat: { cost: 1, label: 'AI Chat Message', category: 'Chat' },
  terminology: { cost: 1, label: 'Terminology Check', category: 'Analysis' },
  extract: { cost: 3, label: 'Document Extraction', category: 'Documents' },
  scenario: { cost: 3, label: 'Scenario Analysis', category: 'Analysis' },
  research: { cost: 5, label: 'Deep Research', category: 'Research' },
  'deep-research': { cost: 5, label: 'Comprehensive Research', category: 'Research' },
  'grounded-search': { cost: 2, label: 'Web Search', category: 'Research' },
  'media-analyze': { cost: 2, label: 'Media Analysis', category: 'Analysis' },
  'media-scan': { cost: 2, label: 'Media Scan', category: 'Analysis' },
  'talking-points': { cost: 2, label: 'Talking Points', category: 'Drafting' },
  'advisor-chat': { cost: 2, label: 'Advisory Chat', category: 'Chat' },
  report: { cost: 5, label: 'Report Generation', category: 'Drafting' },
  dossier: { cost: 4, label: 'Actor Dossier', category: 'Drafting' },
  briefing: { cost: 3, label: 'Briefing Generation', category: 'Drafting' },
  'risk-assessment': { cost: 3, label: 'Risk Assessment', category: 'Analysis' },
  'escalation-scan': { cost: 2, label: 'Escalation Scan', category: 'Analysis' },
  'sanctions-scan': { cost: 2, label: 'Sanctions Scan', category: 'Analysis' },
  'treaty-analyze': { cost: 3, label: 'Treaty Analysis', category: 'Analysis' },
  mediation: { cost: 3, label: 'Mediation Planning', category: 'Analysis' },
  negotiation: { cost: 3, label: 'Negotiation Analysis', category: 'Analysis' },
  'actor-enrichment': { cost: 2, label: 'Actor Enrichment', category: 'Research' },
  'claude-analyze': { cost: 3, label: 'Claude Deep Analysis', category: 'Analysis' },
  'graph-ingest': { cost: 1, label: 'Graph Build', category: 'Data' },
  'graph-query': { cost: 1, label: 'Graph Query', category: 'Data' },
  'canonical-lookup': { cost: 1, label: 'Name Lookup', category: 'Research' },
  verify: { cost: 1, label: 'Fact Verification', category: 'Research' },
};
