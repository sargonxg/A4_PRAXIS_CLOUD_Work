import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  createKnowledgeRepository,
  listKnowledgeRepositories,
} from '@/lib/knowledge/library-service';

export const dynamic = 'force-dynamic';

const CreateRepositorySchema = z.object({
  id: z.string().min(1).max(160).optional(),
  name: z.string().min(1).max(160),
  description: z.string().max(1200).optional(),
  categoryId: z.string().max(80).optional(),
  policyDomain: z.string().max(80).optional(),
  tags: z.array(z.string().max(48)).max(30).optional(),
  defaultCapsuleIds: z.array(z.string().max(160)).max(20).optional(),
  visibility: z.enum(['private', 'team-ready']).optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ repositories: [], persisted: false });
    const url = new URL(request.url);
    const repositories = await listKnowledgeRepositories(user.uid, {
      includeArchived: url.searchParams.get('includeArchived') === 'true',
    });
    return NextResponse.json({ repositories, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'knowledge/repositories/list');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot create private knowledge repositories' }, { status: 403 });
    }
    const parsed = CreateRepositorySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid knowledge repository', details: parsed.error.flatten() }, { status: 400 });
    }
    const repository = await createKnowledgeRepository(user.uid, parsed.data);
    return NextResponse.json({ repository }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'knowledge/repositories/create');
  }
});
