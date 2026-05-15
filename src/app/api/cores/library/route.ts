import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { composeCoreLibrary } from '@/lib/cores/core-library';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  kind: z.enum(['all', 'user', 'situation', 'path', 'source', 'document', 'graph', 'time', 'output', 'tool', 'objective', 'product', 'memory']).default('all'),
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().positive().max(160).optional(),
  ownerScope: z.enum(['all', 'platform', 'user', 'team', 'situation', 'artifact']).default('all'),
  status: z.enum(['all', 'ready', 'thin', 'queued', 'failed', 'needs_review']).default('all'),
  attached: z.enum(['all', 'attached', 'unattached']).default('all'),
  situationId: z.string().min(1).max(240).optional(),
  provenance: z.string().min(1).max(80).optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      kind: url.searchParams.get('kind') ?? 'all',
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      ownerScope: url.searchParams.get('ownerScope') ?? 'all',
      status: url.searchParams.get('status') ?? 'all',
      attached: url.searchParams.get('attached') ?? 'all',
      situationId: url.searchParams.get('situationId') ?? undefined,
      provenance: url.searchParams.get('provenance') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid core library query', details: parsed.error.flatten() }, { status: 400 });
    }
    return NextResponse.json({
      cores: await composeCoreLibrary(user.uid, parsed.data),
      persisted: true,
      source: 'context-core-library',
      filters: parsed.data,
    });
  } catch (err) {
    return handleRouteError(err, 'cores/library');
  }
});
