import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  getKnowledgeRepository,
  listKnowledgeDocuments,
} from '@/lib/knowledge/library-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ repositoryId: string }> };

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) return NextResponse.json({ documents: [], persisted: false });
    const { repositoryId } = await context.params;
    const repository = await getKnowledgeRepository(user.uid, repositoryId);
    if (!repository) return NextResponse.json({ error: 'Knowledge repository not found' }, { status: 404 });
    const url = new URL(request.url);
    const documents = await listKnowledgeDocuments(user.uid, {
      repositoryId,
      capsuleId: url.searchParams.get('capsuleId'),
      situationId: url.searchParams.get('situationId'),
      categoryId: url.searchParams.get('categoryId'),
      tag: url.searchParams.get('tag'),
    });
    return NextResponse.json({ repository, documents, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'knowledge/repositories/documents');
  }
});
