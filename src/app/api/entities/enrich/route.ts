import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { enrichEntity } from '@/lib/services/entity-enrichment';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/entities/enrich
 *
 * Body: { query: string, useAiSummary?: boolean }
 *
 * Returns a best-effort structured enrichment for any entity name:
 * Wikipedia summary + GDELT mention volume + tone + top covering domains,
 * with an optional grounded-AI summary when Wikipedia is thin.
 *
 * Used by actor profiles, graph-node inspectors, and the advisor council
 * for quick context drop-in.
 */
export const POST = withAuth(async (req) => {
  try {
    const body = (await req.json().catch(() => ({}))) as { query?: string; useAiSummary?: boolean };
    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json({ error: 'query required' }, { status: 400 });
    }
    const result = await enrichEntity(body.query.trim(), { useAiSummary: body.useAiSummary });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Enrichment failed';
    console.error('[api/entities/enrich]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
