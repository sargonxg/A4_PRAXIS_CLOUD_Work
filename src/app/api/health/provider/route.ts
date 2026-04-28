import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAvailableProviders, MODEL_NAMES } from '@/lib/ai/providers';

/**
 * GET /api/health/provider
 * Returns AI provider configuration status.
 */
export const GET = withAuth(async () => {
  const providers = getAvailableProviders();

  return NextResponse.json({
    google:    providers.google.configured,
    vertex:    providers.vertex.configured,
    anthropic: providers.anthropic.configured,
    model:     MODEL_NAMES.flash,
    note:      providers.vertex.configured
      ? providers.vertex.note
      : providers.google.configured
        ? providers.google.note
        : 'Set GOOGLE_AI_API_KEY or GOOGLE_VERTEX_PROJECT to enable AI features',
    timestamp: new Date().toISOString(),
  });
});
