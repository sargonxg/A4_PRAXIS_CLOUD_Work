import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getGraphOpsSummary } from '@/lib/graph/graphops-service';

const QuerySchema = z.object({
  situationId: z.string().min(1).max(200),
});

export const GET = withAuth(async (request, user) => {
  try {
    const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const summary = await getGraphOpsSummary(user.uid, parsed.data.situationId);
    return NextResponse.json({ summary });
  } catch (err) {
    return handleRouteError(err, 'graph/ops/get');
  }
});
