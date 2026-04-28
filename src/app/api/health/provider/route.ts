import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAvailableProviders, MODEL_NAMES } from '@/lib/ai/providers';

const POLAR_REQUIRED_ENV = [
  'POLAR_ACCESS_TOKEN',
  'POLAR_WEBHOOK_SECRET',
  'POLAR_PRODUCT_ANALYST',
  'POLAR_PRODUCT_TEAM',
] as const;

export interface ProviderIntegrationStatus {
  firecrawl: boolean;
  parallel: boolean;
  vertexAdk: boolean;
  polar: boolean;
  polarMissing: string[];
}

export function getProviderIntegrationStatus(
  env: Record<string, string | undefined> = process.env,
): ProviderIntegrationStatus {
  const polarMissing = POLAR_REQUIRED_ENV.filter((name) => !env[name]);

  return {
    firecrawl: Boolean(env.FIRECRAWL_API_KEY),
    parallel: Boolean(env.PARALLEL_API_KEY),
    vertexAdk: Boolean(env.VERTEX_AGENT_ENGINE_ID),
    polar: polarMissing.length === 0,
    polarMissing,
  };
}

/**
 * GET /api/health/provider
 * Returns AI provider configuration status.
 */
export const GET = withAuth(async () => {
  const providers = getAvailableProviders();
  const integrations = getProviderIntegrationStatus();

  return NextResponse.json({
    google:    providers.google.configured,
    vertex:    providers.vertex.configured,
    anthropic: providers.anthropic.configured,
    providerMode: providers.vertex.configured ? 'vertex' : providers.google.configured ? 'google' : 'offline',
    model:     MODEL_NAMES.flash,
    note:      providers.vertex.configured
      ? providers.vertex.note
      : providers.google.configured
        ? providers.google.note
        : 'Set GOOGLE_AI_API_KEY or GOOGLE_VERTEX_PROJECT to enable AI features',
    ...integrations,
    timestamp: new Date().toISOString(),
  });
});
