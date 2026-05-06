import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';

export const maxDuration = 15;

export const POST = withAuth(async (request) => {
  try {
    const { provider, apiKey } = await request.json() as {
      provider: 'google_ai' | 'ucdp';
      apiKey: string;
    };

    if (!apiKey?.trim()) {
      return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    if (provider === 'google_ai') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {
        signal: AbortSignal.timeout(10_000),
      });
      return NextResponse.json({ valid: res.ok });
    }

    if (provider === 'ucdp') {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false, error: 'Unknown provider' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Validation failed';
    const isTimeout = msg.includes('timed out') || msg.includes('timeout');
    return NextResponse.json(
      { valid: false, error: isTimeout ? 'Request timed out; check your network' : msg },
      { status: 500 },
    );
  }
});
