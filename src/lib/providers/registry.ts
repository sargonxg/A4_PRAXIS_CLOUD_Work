/**
 * Canonical provider registry for user-supplied API keys.
 *
 * One source of truth that powers:
 *  - Settings UI (cards with tier, cost, signup, validation, delete)
 *  - Capability resolver (which feeds are available for a given user)
 *  - Server-side user-key service (getUserApiKey / setUserApiKey)
 *
 * When you add a new provider: append here, add a validator branch if
 * applicable in src/app/api/settings/api-keys/validate/route.ts, and wire a
 * capability entry in src/lib/data-feeds/capabilities.ts.
 */

export type ProviderId =
  | 'google_ai'
  | 'anthropic'
  | 'openai'
  | 'firecrawl'
  | 'tavily'
  | 'parallel'
  | 'ucdp';

export type ProviderCategory = 'ai' | 'research' | 'scraping' | 'feed';
export type ProviderTier = 'free' | 'freemium' | 'premium';

export interface ProviderField {
  /** Key in the stored plaintext blob (e.g. 'key', 'email'). */
  name: string;
  /** Human-visible label in the settings form. */
  label: string;
  /** Placeholder hint for the input. */
  placeholder: string;
  /** Whether this field is required for the provider to be considered configured. */
  required: boolean;
  /** If true, masks the value in the UI (password-style). */
  secret: boolean;
}

export interface ProviderSpec {
  id: ProviderId;
  label: string;
  /** Short tagline shown under the provider name. */
  tagline: string;
  category: ProviderCategory;
  tier: ProviderTier;
  fields: ProviderField[];
  /** Where to sign up / generate a key. */
  signupUrl: string;
  /** Docs root. */
  docsUrl: string;
  /** One-line cost hint (e.g. "Free tier: 1,000 queries/month"). */
  costHint: string;
  /** What new capabilities the user gains after adding this key. */
  unlocks: string[];
  /** Which validator branch to call when the user clicks Validate. */
  validator?: 'google_ai' | 'anthropic' | 'openai' | 'firecrawl' | 'tavily' | 'parallel' | 'ucdp';
  /** Whether the platform has a tenant-wide fallback (ENV var on the server). */
  platformFallbackEnvVars: string[];
}

export const PROVIDER_REGISTRY: Readonly<Record<ProviderId, ProviderSpec>> = Object.freeze({
  google_ai: {
    id: 'google_ai',
    label: 'Google AI (Gemini)',
    tagline: 'Generative AI for every PRAXIS tool. Runs via Vertex ADC on Cloud Run by default — add a key here to override with your own.',
    category: 'ai',
    tier: 'free',
    fields: [{ name: 'key', label: 'API Key', placeholder: 'AIzaSy…', required: true, secret: true }],
    signupUrl: 'https://aistudio.google.com/apikey',
    docsUrl: 'https://ai.google.dev/',
    costHint: 'Free tier includes generous daily quotas for Gemini models',
    unlocks: ['All AI tools', 'Grounded Google Search research', 'Embeddings for Situation Knowledge Core'],
    validator: 'google_ai',
    platformFallbackEnvVars: ['GOOGLE_AI_API_KEY'],
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    tagline: 'Claude Sonnet for deep conflict analysis and diplomatic drafting, with a precise and cautious voice.',
    category: 'ai',
    tier: 'premium',
    fields: [{ name: 'key', label: 'API Key', placeholder: 'sk-ant-…', required: true, secret: true }],
    signupUrl: 'https://console.anthropic.com/',
    docsUrl: 'https://docs.anthropic.com/',
    costHint: 'Pay per token — budget via console caps',
    unlocks: ['Deep analysis model for 1-click reasoning', 'Alternative voice on Report Studio', 'Second-opinion routing in the Advisor Council'],
    validator: 'anthropic',
    platformFallbackEnvVars: ['ANTHROPIC_API_KEY'],
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    tagline: 'Optional OpenAI models for comparative experimentation.',
    category: 'ai',
    tier: 'premium',
    fields: [{ name: 'key', label: 'API Key', placeholder: 'sk-…', required: true, secret: true }],
    signupUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/docs',
    costHint: 'Pay per token',
    unlocks: ['Optional GPT model routing'],
    validator: 'openai',
    platformFallbackEnvVars: [],
  },
  tavily: {
    id: 'tavily',
    label: 'Tavily',
    tagline: 'AI-optimised web search that parallels grounded Google Search with a second lens.',
    category: 'research',
    tier: 'freemium',
    fields: [{ name: 'key', label: 'API Key', placeholder: 'tvly-…', required: true, secret: true }],
    signupUrl: 'https://app.tavily.com/',
    docsUrl: 'https://docs.tavily.com/',
    costHint: 'Free: 1,000 credits/month',
    unlocks: ['Deeper web research on every tool', 'Redundant grounding for fact-checking'],
    validator: 'tavily',
    platformFallbackEnvVars: ['TAVILY_API_KEY'],
  },
  parallel: {
    id: 'parallel',
    label: 'Parallel.ai',
    tagline: 'LLM-optimized web search and research tasks for entity enrichment, monitoring, and dossier drafting.',
    category: 'research',
    tier: 'premium',
    fields: [{ name: 'key', label: 'API Key', placeholder: 'par-…', required: true, secret: true }],
    signupUrl: 'https://platform.parallel.ai/',
    docsUrl: 'https://docs.parallel.ai/',
    costHint: 'Usage-based. Search is synchronous and low latency; Task runs are heavier and should be reserved for paid/trial workflows.',
    unlocks: [
      'Second-lens source discovery for contested claims',
      'Longer LLM-ready excerpts for briefings and dossiers',
      'Entity enrichment and source monitoring',
      'MCP-backed agent search for research workflows',
    ],
    validator: 'parallel',
    platformFallbackEnvVars: ['PARALLEL_API_KEY'],
  },
  firecrawl: {
    id: 'firecrawl',
    label: 'Firecrawl',
    tagline: 'Premium web intelligence for search, scrape, crawl, map, and structured extraction from hard-to-parse sites.',
    category: 'scraping',
    tier: 'freemium',
    fields: [{ name: 'key', label: 'API Key', placeholder: 'fc-…', required: true, secret: true }],
    signupUrl: 'https://firecrawl.dev/',
    docsUrl: 'https://docs.firecrawl.dev/',
    costHint: 'Credit-based. Search is metered by result bands; basic scrape is typically one credit per page. Keep heavy crawls behind support approval.',
    unlocks: [
      'Full-page markdown search for live research',
      'JS-rendered page scraping and PDF parsing',
      'Source monitoring with crawl/map discovery',
      'Structured extraction for policy knowledge bases',
    ],
    validator: 'firecrawl',
    platformFallbackEnvVars: ['FIRECRAWL_API_KEY'],
  },
  ucdp: {
    id: 'ucdp',
    label: 'UCDP',
    tagline: 'Uppsala Conflict Data Program API for structured conflict records, GED events, and battle-deaths history.',
    category: 'feed',
    tier: 'free',
    fields: [{ name: 'token', label: 'API Token', placeholder: 'UCDP access token', required: true, secret: true }],
    signupUrl: 'https://ucdp.uu.se/apidocs/',
    docsUrl: 'https://ucdp.uu.se/apidocs/',
    costHint: 'Authenticated access is limited by UCDP daily request quota',
    unlocks: [
      'UCDP conflict records in live intelligence feeds',
      'Historical battle-deaths trends for risk context',
      'Structured corroboration for conflict timelines and geospatial analysis',
    ],
    validator: 'ucdp',
    platformFallbackEnvVars: ['UCDP_API_TOKEN'],
  },
});

export const PROVIDER_IDS = Object.keys(PROVIDER_REGISTRY) as ProviderId[];

/** Narrow a string to ProviderId or return null. */
export function toProviderId(raw: unknown): ProviderId | null {
  if (typeof raw !== 'string') return null;
  return (raw in PROVIDER_REGISTRY) ? (raw as ProviderId) : null;
}

/** Providers grouped by category for the settings UI. */
export function providersByCategory(): Record<ProviderCategory, ProviderSpec[]> {
  const out: Record<ProviderCategory, ProviderSpec[]> = { ai: [], research: [], scraping: [], feed: [] };
  for (const id of PROVIDER_IDS) {
    out[PROVIDER_REGISTRY[id].category].push(PROVIDER_REGISTRY[id]);
  }
  return out;
}
