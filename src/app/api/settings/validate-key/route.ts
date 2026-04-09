import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';

export const maxDuration = 15;

/**
 * POST /api/settings/validate-key
 * Body: { provider: 'tavily' | 'firecrawl' | 'anthropic' | 'openai', apiKey: string }
 * Returns: { valid: boolean, error?: string }
 */
export const POST = withAuth(async (request) => {
  try {
    const { provider, apiKey } = await request.json() as {
      provider: 'tavily' | 'firecrawl' | 'anthropic' | 'openai';
      apiKey: string;
    };

    if (!apiKey?.trim()) {
      return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    switch (provider) {
      case 'tavily': {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: apiKey, query: 'test', max_results: 1 }),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({ valid: false, error: 'Invalid Tavily API key' });
        }
        return NextResponse.json({ valid: res.ok });
      }

      case 'firecrawl': {
        const res = await fetch('https://api.firecrawl.dev/v1/team', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({ valid: false, error: 'Invalid Firecrawl API key' });
        }
        return NextResponse.json({ valid: res.ok });
      }

      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({ valid: false, error: 'Invalid Anthropic API key' });
        }
        return NextResponse.json({ valid: res.ok });
      }

      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({ valid: false, error: 'Invalid OpenAI API key' });
        }
        return NextResponse.json({ valid: res.ok });
      }

      default:
        return NextResponse.json({ valid: false, error: 'Unknown provider' }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Validation failed';
    const isTimeout = msg.includes('timed out') || msg.includes('timeout');
    return NextResponse.json(
      { valid: false, error: isTimeout ? 'Request timed out — check your network' : msg },
      { status: 500 }
    );
  }
});
