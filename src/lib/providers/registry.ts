export type ProviderId = 'google_ai';
export type ProviderCategory = 'ai';
export type ProviderTier = 'free';

export interface ProviderField {
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  secret: boolean;
}

export interface ProviderSpec {
  id: ProviderId;
  label: string;
  tagline: string;
  category: ProviderCategory;
  tier: ProviderTier;
  fields: ProviderField[];
  signupUrl: string;
  docsUrl: string;
  costHint: string;
  unlocks: string[];
  validator?: ProviderId;
  platformFallbackEnvVars: string[];
}

export const PROVIDER_REGISTRY: Readonly<Record<ProviderId, ProviderSpec>> = Object.freeze({
  google_ai: {
    id: 'google_ai',
    label: 'Google AI (Gemini)',
    tagline: 'Generative AI for every PRAXIS tool. Cloud Run uses Vertex ADC by default; local development can use a Google AI key.',
    category: 'ai',
    tier: 'free',
    fields: [{ name: 'key', label: 'API Key', placeholder: 'AIzaSy...', required: true, secret: true }],
    signupUrl: 'https://aistudio.google.com/apikey',
    docsUrl: 'https://ai.google.dev/',
    costHint: 'Use project budgets and Vertex quotas for production control.',
    unlocks: ['AI tools', 'Grounded Google Search research', 'Embeddings'],
    validator: 'google_ai',
    platformFallbackEnvVars: ['GOOGLE_AI_API_KEY'],
  },
});

export const PROVIDER_IDS = Object.keys(PROVIDER_REGISTRY) as ProviderId[];

export function toProviderId(raw: unknown): ProviderId | null {
  if (typeof raw !== 'string') return null;
  return (raw in PROVIDER_REGISTRY) ? (raw as ProviderId) : null;
}

export function providersByCategory(): Record<ProviderCategory, ProviderSpec[]> {
  const out: Record<ProviderCategory, ProviderSpec[]> = { ai: [] };
  for (const id of PROVIDER_IDS) out[PROVIDER_REGISTRY[id].category].push(PROVIDER_REGISTRY[id]);
  return out;
}
