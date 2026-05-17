import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  getKnowledgeRepository,
  updateKnowledgeRepository,
} from '@/lib/knowledge/library-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ repositoryId: string }> };

const UpdateRepositorySchema = z.object({
  name: z.string().min(1).max(160).optional(),
  description: z.string().max(1200).optional(),
  categoryId: z.string().max(80).optional(),
  policyDomain: z.string().max(80).optional(),
  tags: z.array(z.string().max(48)).max(30).optional(),
  defaultCapsuleIds: z.array(z.string().max(160)).max(20).optional(),
  visibility: z.enum(['private', 'team-ready']).optional(),
  archived: z.boolean().optional(),
});

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ repository: null, persisted: false });
    const { repositoryId } = await context.params;
    const repository = await getKnowledgeRepository(user.uid, repositoryId);
    if (!repository) return NextResponse.json({ error: 'Knowledge repository not found' }, { status: 404 });
    return NextResponse.json({ repository, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'knowledge/repositories/get');
  }
});

export const PATCH = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot mutate private knowledge repositories' }, { status: 403 });
    }
    const { repositoryId } = await context.params;
    const parsed = UpdateRepositorySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid knowledge repository update', details: parsed.error.flatten() }, { status: 400 });
    }
    const repository = await updateKnowledgeRepository(user.uid, repositoryId, parsed.data);
    if (!repository) return NextResponse.json({ error: 'Knowledge repository not found' }, { status: 404 });
    return NextResponse.json({ repository });
  } catch (err) {
    return handleRouteError(err, 'knowledge/repositories/update');
  }
});

export const DELETE = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot archive private knowledge repositories' }, { status: 403 });
    }
    const { repositoryId } = await context.params;
    const repository = await updateKnowledgeRepository(user.uid, repositoryId, { archived: true });
    if (!repository) return NextResponse.json({ error: 'Knowledge repository not found' }, { status: 404 });
    return NextResponse.json({ archived: true, repository });
  } catch (err) {
    return handleRouteError(err, 'knowledge/repositories/archive');
  }
});
