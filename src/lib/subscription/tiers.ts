/**
 * PRAXIS Subscription Tiers
 *
 * Free — showcase tier, limited but impressive
 * Pro ($29/mo) — full AI access for individual analysts
 * Enterprise ($99/mo) — team features, priority support, custom integrations
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  price: number;           // USD per month (0 = free)
  yearlyPrice: number;     // USD per year
  credits: number;         // Monthly credits (0 = unlimited)
  description: string;
  badge: string;
  features: string[];
  limits: {
    monthlyCredits: number;
    maxCases: number;
    maxReports: number;
    maxTeamMembers: number;
    researchDepth: ('quick' | 'standard' | 'comprehensive')[];
    aiModels: string[];
    researchProviders: string[];
    maxDocumentUploads: number;
    exportFormats: string[];
    calendarIntegrations: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
  };
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Analyst',
    price: 0,
    yearlyPrice: 0,
    credits: 25,
    description: 'Essential conflict intelligence for independent researchers',
    badge: 'Free',
    features: [
      '25 TACITUS Credits/month',
      'AI Assistant (chat with 18 tools)',
      '1 active case',
      'Google Search research',
      'Gemini Flash model',
      'Demo data access (Nordalia Crisis)',
      'Basic report export (Markdown)',
      'Conflict Grammar analysis',
      'Community support',
    ],
    limits: {
      monthlyCredits: 25,
      maxCases: 1,
      maxReports: 5,
      maxTeamMembers: 1,
      researchDepth: ['quick', 'standard'],
      aiModels: ['gemini-2.5-flash'],
      researchProviders: ['google-search'],
      maxDocumentUploads: 10,
      exportFormats: ['markdown', 'json'],
      calendarIntegrations: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Diplomat',
    price: 29,
    yearlyPrice: 290,
    credits: 500,
    description: 'Full-spectrum intelligence for professional analysts and diplomats',
    badge: 'Pro',
    features: [
      '500 TACITUS Credits/month',
      'All AI tools + Firecrawl web intelligence',
      'Up to 10 active cases',
      'Firecrawl + Google Deep Research + Parallel.ai',
      'Gemini Flash + Pro + Claude Sonnet models',
      'Dossier generation, briefing builder, mediation AI',
      'Risk monitor + treaty analyzer + negotiation prep',
      'Full export (PDF, DOCX, Markdown, JSON)',
      'Calendar integrations (iCal, Google, Outlook)',
      'AI customization (model, temperature, instructions)',
      'Email support (48h response)',
    ],
    limits: {
      monthlyCredits: 500,
      maxCases: 10,
      maxReports: 100,
      maxTeamMembers: 1,
      researchDepth: ['quick', 'standard', 'comprehensive'],
      aiModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'claude-sonnet-4'],
      researchProviders: ['google-search', 'firecrawl', 'google-deep-research', 'parallel-ai'],
      maxDocumentUploads: 100,
      exportFormats: ['markdown', 'json', 'pdf', 'docx'],
      calendarIntegrations: true,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Ambassador',
    price: 99,
    yearlyPrice: 990,
    credits: 0, // unlimited
    description: 'Mission-critical intelligence for teams and organizations',
    badge: 'Enterprise',
    features: [
      'Unlimited TACITUS Credits',
      'Everything in Pro',
      'Unlimited cases + reports',
      'Up to 25 team members',
      'ARGUS + CONCORDIA live connections',
      'Vertex AI (enterprise SLA, data residency)',
      'API access for automation',
      'Custom calendar integrations (UN, AU, EU feeds)',
      'Custom branding + white-label',
      'Dedicated account manager',
      'Priority support (4h response)',
      'SSO/SAML authentication',
    ],
    limits: {
      monthlyCredits: 0, // unlimited
      maxCases: 999,
      maxReports: 999,
      maxTeamMembers: 25,
      researchDepth: ['quick', 'standard', 'comprehensive'],
      aiModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'claude-sonnet-4', 'vertex-ai'],
      researchProviders: ['google-search', 'firecrawl', 'google-deep-research', 'parallel-ai', 'custom-feeds'],
      maxDocumentUploads: 999,
      exportFormats: ['markdown', 'json', 'pdf', 'docx', 'pptx'],
      calendarIntegrations: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
};

/**
 * Research providers available in the platform.
 * Users select which ones to use based on their tier.
 */
export interface ResearchProvider {
  id: string;
  name: string;
  description: string;
  costPerQuery: number;     // Credits per query
  capabilities: string[];
  envVar?: string;          // Required env var
  tier: SubscriptionTier;   // Minimum tier required
  status: 'available' | 'coming-soon' | 'beta';
}

export const RESEARCH_PROVIDERS: ResearchProvider[] = [
  {
    id: 'google-search',
    name: 'Google Search Grounding',
    description: 'Real-time web search via Gemini Search Grounding. Returns search snippets with source citations.',
    costPerQuery: 2,
    capabilities: ['Live search', 'Source citation', 'Multi-step research', 'Google News'],
    envVar: 'GOOGLE_AI_API_KEY',
    tier: 'free',
    status: 'available',
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl Web Intelligence',
    description: 'Deep web crawling with full-page content extraction. Returns clean markdown from any URL, handles JS rendering.',
    costPerQuery: 3,
    capabilities: ['Full-page scraping', 'JS rendering', 'Structured extraction', 'Batch crawling', 'Site mapping'],
    envVar: 'FIRECRAWL_API_KEY',
    tier: 'pro',
    status: 'available',
  },
  {
    id: 'google-deep-research',
    name: 'Google Deep Research',
    description: 'Multi-step autonomous research using Gemini with comprehensive web analysis. Produces detailed research reports.',
    costPerQuery: 5,
    capabilities: ['Autonomous multi-step', 'Cross-reference verification', 'Report generation', 'Source reliability scoring'],
    envVar: 'GOOGLE_AI_API_KEY',
    tier: 'pro',
    status: 'available',
  },
  {
    id: 'parallel-ai',
    name: 'Parallel.ai Research',
    description: 'AI-powered parallel web research. Runs multiple search agents simultaneously for comprehensive coverage.',
    costPerQuery: 4,
    capabilities: ['Parallel search agents', 'Real-time monitoring', 'Trend detection', 'Automated reporting'],
    envVar: 'PARALLEL_AI_API_KEY',
    tier: 'pro',
    status: 'coming-soon',
  },
  {
    id: 'custom-feeds',
    name: 'Custom Intelligence Feeds',
    description: 'Connect to organization-specific intelligence feeds, RSS sources, and private databases.',
    costPerQuery: 1,
    capabilities: ['RSS/Atom feeds', 'Private databases', 'OSINT feeds', 'Custom API connectors'],
    tier: 'enterprise',
    status: 'coming-soon',
  },
];

/**
 * Calendar integration sources that can be connected.
 */
export interface CalendarSource {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  status: 'available' | 'coming-soon';
  setupGuide: string;
}

export const CALENDAR_SOURCES: CalendarSource[] = [
  {
    id: 'manual',
    name: 'Manual Events',
    description: 'Add diplomatic events manually to your PRAXIS calendar.',
    tier: 'free',
    status: 'available',
    setupGuide: 'Available by default. Add events from the Calendar page.',
  },
  {
    id: 'ical',
    name: 'iCal / ICS Feed',
    description: 'Subscribe to any iCal/ICS feed URL. Works with Google Calendar, Outlook, Apple Calendar.',
    tier: 'pro',
    status: 'coming-soon',
    setupGuide: 'Paste an iCal URL (https://..../calendar.ics) to auto-import events.',
  },
  {
    id: 'un-calendar',
    name: 'UN Official Calendar',
    description: 'Auto-import UNSC, UNGA, UNHRC, and committee meetings from the UN Journal.',
    tier: 'pro',
    status: 'coming-soon',
    setupGuide: 'Connects to journal.un.org for official meeting schedules.',
  },
  {
    id: 'au-calendar',
    name: 'African Union Calendar',
    description: 'AU Peace and Security Council sessions, summits, and committee meetings.',
    tier: 'pro',
    status: 'coming-soon',
    setupGuide: 'Connects to au.int for PSC meeting schedules.',
  },
  {
    id: 'eu-calendar',
    name: 'EU External Action Calendar',
    description: 'EEAS Foreign Affairs Council, PSC, and working group meetings.',
    tier: 'pro',
    status: 'coming-soon',
    setupGuide: 'Connects to eeas.europa.eu for FAC/PSC schedules.',
  },
  {
    id: 'osce-calendar',
    name: 'OSCE Calendar',
    description: 'OSCE Permanent Council, Forum for Security Co-operation, and field mission events.',
    tier: 'enterprise',
    status: 'coming-soon',
    setupGuide: 'Connects to osce.org for official meeting schedules.',
  },
  {
    id: 'custom-api',
    name: 'Custom Calendar API',
    description: 'Connect to your organization\'s internal calendar system via REST API.',
    tier: 'enterprise',
    status: 'coming-soon',
    setupGuide: 'Provide your API endpoint and authentication details.',
  },
];

/**
 * Get tier configuration for a user.
 */
export function getTierForUser(tier?: SubscriptionTier): TierConfig {
  return TIERS[tier || 'free'];
}

/**
 * Check if a feature is available for a given tier.
 */
export function isFeatureAvailable(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'pro', 'enterprise'];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
}

/**
 * Get available research providers for a tier.
 */
export function getAvailableProviders(tier: SubscriptionTier): ResearchProvider[] {
  return RESEARCH_PROVIDERS.filter((p) => isFeatureAvailable(tier, p.tier));
}

/**
 * Get available calendar sources for a tier.
 */
export function getAvailableCalendarSources(tier: SubscriptionTier): CalendarSource[] {
  return CALENDAR_SOURCES.filter((s) => isFeatureAvailable(tier, s.tier));
}
