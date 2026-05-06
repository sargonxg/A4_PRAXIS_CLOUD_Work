import { NextResponse } from 'next/server';
import { withCalibration } from '@/lib/api/with-calibration';
import { callBackend } from '@/lib/api/praxis-backend-server';
import type { RecipeId } from '@/lib/dialectica/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

const RECIPES = new Set<RecipeId>([
  'leverage-trace',
  'commitment-check',
  'interest-vs-position',
  'counter-narrative',
  'path-search',
]);

function isRecipeId(value: unknown): value is RecipeId {
  return typeof value === 'string' && RECIPES.has(value as RecipeId);
}

export const POST = withCalibration('conflict_graph', 'ai_analysis', {
  variant: 'agent',
  situationId: (_req, body) => typeof body.situationId === 'string' ? body.situationId : undefined,
  retrievalQuery: (_req, body) => {
    if (typeof body.query === 'string') return body.query;
    if (body.params && typeof body.params === 'object') return JSON.stringify(body.params);
    return undefined;
  },
})(
  async (request, ctx) => {
    if (!process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL) {
      return NextResponse.json({ error: 'PRAXIS backend is not configured' }, { status: 503 });
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || !isRecipeId(body.recipe)) {
      return NextResponse.json({
        error: 'Invalid DIALECTICA request',
        message: 'Provide a valid recipe and params.',
        recipes: Array.from(RECIPES),
      }, { status: 400 });
    }

    const backendBody = {
      situationId: body.situationId,
      graph: body.graph,
      params: body.params ?? {},
    };
    const backendRes = await callBackend(`/api/v1/reason/${body.recipe}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PRAXIS-UID': ctx.uid,
      },
      body: JSON.stringify(backendBody),
    });

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: {
        'content-type': backendRes.headers.get('content-type') ?? 'application/json',
      },
    });
  },
);

