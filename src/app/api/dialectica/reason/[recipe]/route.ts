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

export const POST = withCalibration('conflict_graph', 'ai_analysis', {
  situationId: (_req, body) => typeof body.situationId === 'string' ? body.situationId : undefined,
})(
  async (request, ctx) => {
    const recipe = new URL(request.url).pathname.split('/').pop() as RecipeId | undefined;
    if (!recipe || !RECIPES.has(recipe)) {
      return NextResponse.json({ error: 'Unknown DIALECTICA recipe' }, { status: 404 });
    }
    if (!process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL) {
      return NextResponse.json({ error: 'PRAXIS backend is not configured' }, { status: 503 });
    }
    const body = await request.text();
    const backendRes = await callBackend(`/api/v1/reason/${recipe}`, {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') ?? 'application/json',
        'X-PRAXIS-UID': ctx.uid,
      },
      body,
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
