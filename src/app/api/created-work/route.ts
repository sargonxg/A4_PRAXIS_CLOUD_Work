import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { listCreatedWork } from '@/lib/created-work/service';

export const dynamic = 'force-dynamic';

const CreatedWorkQuerySchema = z.object({
  capsuleId: z.string().trim().min(1).max(240).nullable().optional(),
  limit: z.coerce.number().int().positive().max(50).default(24),
});

export const GET = withAuth(async (request, user) => {
  try {
    const url = new URL(request.url);
    const parsed = CreatedWorkQuerySchema.safeParse({
      capsuleId: url.searchParams.get('capsuleId'),
      limit: url.searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid created work query', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await listCreatedWork(user.uid, {
      capsuleId: parsed.data.capsuleId,
      limit: parsed.data.limit,
      demo: user.isDemo,
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err, 'created-work/list');
  }
});
