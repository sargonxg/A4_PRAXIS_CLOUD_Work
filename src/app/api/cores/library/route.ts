import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { listCoreLibrary } from '@/lib/cores/core-library';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  kind: z.enum(['all', 'user', 'situation', 'path', 'source', 'graph', 'time', 'output', 'tool', 'objective', 'product', 'memory']).default('all'),
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().positive().max(160).optional(),
});

export const GET = withAuth(async (request) => {
  try {
    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      kind: url.searchParams.get('kind') ?? 'all',
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid core library query', details: parsed.error.flatten() }, { status: 400 });
    }
    return NextResponse.json({
      cores: listCoreLibrary(parsed.data),
      persisted: true,
      source: 'canonical-core-library',
    });
  } catch (err) {
    return handleRouteError(err, 'cores/library');
  }
});
