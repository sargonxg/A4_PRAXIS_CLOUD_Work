import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { deleteUserApiKey, setUserApiKey } from '@/lib/providers/user-keys';
import { toProviderId } from '@/lib/providers/registry';

export const runtime = 'nodejs';
export const maxDuration = 15;

type RouteContext = { params: Promise<{ provider: string }> };

/**
 * PUT /api/settings/api-keys/:provider
 *
 * Body: { payload: { [fieldName]: string }, validate?: boolean }
 *
 * Upserts the encrypted record for `:provider`. When `validate` is true the
 * validation is run against the saved credentials and the result is persisted
 * on the same doc. Never echoes plaintext back to the client.
 */
export const PUT = withAuth<RouteContext>(async (req, user, ctx) => {
  try {
    const { provider: raw } = await ctx.params;
    const provider = toProviderId(raw);
    if (!provider) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });

    const body = (await req.json().catch(() => ({}))) as { payload?: Record<string, string> };
    if (!body.payload || typeof body.payload !== 'object') {
      return NextResponse.json({ error: 'Missing or invalid payload' }, { status: 400 });
    }

    const status = await setUserApiKey(user.uid, provider, body.payload);
    return NextResponse.json({ status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to save API key';
    console.error('[api-keys PUT]', msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
});

/**
 * DELETE /api/settings/api-keys/:provider
 *
 * Removes the user's stored credentials for this provider. Platform-level
 * fallback (if configured in ENV vars) continues to apply.
 */
export const DELETE = withAuth<RouteContext>(async (_req, user, ctx) => {
  try {
    const { provider: raw } = await ctx.params;
    const provider = toProviderId(raw);
    if (!provider) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });

    await deleteUserApiKey(user.uid, provider);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete API key';
    console.error('[api-keys DELETE]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
