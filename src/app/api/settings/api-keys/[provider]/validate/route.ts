import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getUserApiKey, markValidation } from '@/lib/providers/user-keys';
import { toProviderId } from '@/lib/providers/registry';

export const runtime = 'nodejs';
export const maxDuration = 20;

type RouteContext = { params: Promise<{ provider: string }> };

interface ValidateResult {
  ok: boolean;
  error?: string;
}

async function runValidator(providerId: string, payload: Record<string, string>): Promise<ValidateResult> {
  switch (providerId) {
    case 'google_ai': {
      const key = payload.key;
      if (!key) return { ok: false, error: 'Missing key' };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'Invalid Google AI key' };
      return { ok: res.ok, error: res.ok ? undefined : `Google AI responded ${res.status}` };
    }
    case 'anthropic': {
      const key = payload.key;
      if (!key) return { ok: false, error: 'Missing key' };
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'Invalid Anthropic key' };
      return { ok: res.ok, error: res.ok ? undefined : `Anthropic responded ${res.status}` };
    }
    case 'openai': {
      const key = payload.key;
      if (!key) return { ok: false, error: 'Missing key' };
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'Invalid OpenAI key' };
      return { ok: res.ok, error: res.ok ? undefined : `OpenAI responded ${res.status}` };
    }
    case 'tavily': {
      const key = payload.key;
      if (!key) return { ok: false, error: 'Missing key' };
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key, query: 'test', max_results: 1 }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'Invalid Tavily key' };
      return { ok: res.ok, error: res.ok ? undefined : `Tavily responded ${res.status}` };
    }
    case 'parallel': {
      const key = payload.key;
      if (!key) return { ok: false, error: 'Missing key' };
      const res = await fetch('https://api.parallel.ai/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({
          objective: 'Validate Parallel API access. Return one official source about the United Nations.',
          search_queries: ['United Nations official website'],
          mode: 'basic',
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'Invalid Parallel key' };
      return { ok: res.ok, error: res.ok ? undefined : `Parallel responded ${res.status}` };
    }
    case 'firecrawl': {
      const key = payload.key;
      if (!key) return { ok: false, error: 'Missing key' };
      const res = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
        body: JSON.stringify({ query: 'Firecrawl validation', limit: 1, sources: ['web'] }),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'Invalid Firecrawl key' };
      return { ok: res.ok, error: res.ok ? undefined : `Firecrawl responded ${res.status}` };
    }
    case 'ucdp': {
      const token = payload.token;
      if (!token) return { ok: false, error: 'Missing token' };
      const res = await fetch('https://ucdpapi.pcr.uu.se/api/gedevents/25.1?pagesize=1', {
        headers: { Accept: 'application/json', 'x-ucdp-access-token': token },
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 401 || res.status === 403) return { ok: false, error: 'Invalid UCDP token' };
      return { ok: res.ok, error: res.ok ? undefined : `UCDP responded ${res.status}` };
    }
    default:
      return { ok: false, error: `No validator registered for ${providerId}` };
  }
}

/**
 * POST /api/settings/api-keys/:provider/validate
 *
 * Body (optional): { payload?: { [fieldName]: string } }
 *
 * If a payload is supplied, validate those credentials without persisting.
 * If none is supplied, decrypt the stored credentials and validate them,
 * marking the stored record with the result.
 */
export const POST = withAuth<RouteContext>(async (req, user, ctx) => {
  try {
    const { provider: raw } = await ctx.params;
    const provider = toProviderId(raw);
    if (!provider) return NextResponse.json({ ok: false, error: 'Unknown provider' }, { status: 400 });

    const body = (await req.json().catch(() => ({}))) as { payload?: Record<string, string> };
    let payload: Record<string, string> | null = null;
    let persist = false;
    if (body.payload && typeof body.payload === 'object') {
      payload = body.payload;
    } else {
      const stored = await getUserApiKey(user.uid, provider);
      if (!stored) return NextResponse.json({ ok: false, error: 'No stored credentials to validate' }, { status: 404 });
      payload = stored;
      persist = true;
    }

    const result = await runValidator(provider, payload);
    if (persist) {
      await markValidation(user.uid, provider, result.ok ? { ok: true } : { ok: false, error: result.error ?? 'unknown' });
    }
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Validation failed';
    const isTimeout = msg.includes('timed out') || msg.includes('timeout');
    console.error('[api-keys validate]', msg);
    return NextResponse.json(
      { ok: false, error: isTimeout ? 'Request timed out — check your network' : msg },
      { status: 500 },
    );
  }
});
