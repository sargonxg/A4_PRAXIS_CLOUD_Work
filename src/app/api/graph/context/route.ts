import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getGraphContextPack } from '@/lib/graph/graphops-service';

const QuerySchema = z.object({
  situationId: z.string().min(1).max(200),
  focusActorId: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const { situationId, focusActorId, limit } = parsed.data;
    const contextPack = await getGraphContextPack(user.uid, situationId, { focusActorId, limit });
    return NextResponse.json({ contextPack });
  } catch (err) {
    return handleRouteError(err, 'graph/context/get');
  }
});
