import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import {
  getKnowledgeRepository,
  upsertKnowledgeDocument,
} from '@/lib/knowledge/library-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ repositoryId: string }> };

const AttachDocumentSchema = z.object({
  documentId: z.string().min(1).max(160),
  situationId: z.string().min(1).max(160),
  capsuleIds: z.array(z.string().max(160)).max(20).optional(),
  categoryId: z.string().max(80).optional(),
  policyDomain: z.string().max(80).optional(),
  tags: z.array(z.string().max(48)).max(40).optional(),
  sourceType: z.string().max(80).optional(),
  sourceNote: z.string().max(1200).optional(),
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot mutate private knowledge repositories' }, { status: 403 });
    }
    const { repositoryId } = await context.params;
    const repository = await getKnowledgeRepository(user.uid, repositoryId);
    if (!repository) return NextResponse.json({ error: 'Knowledge repository not found' }, { status: 404 });
    const parsed = AttachDocumentSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid repository document attachment', details: parsed.error.flatten() }, { status: 400 });
    }
    const document = await upsertKnowledgeDocument(user.uid, {
      ...parsed.data,
      repositoryIds: [repository.id],
      categoryId: parsed.data.categoryId ?? repository.categoryId,
      policyDomain: parsed.data.policyDomain ?? repository.policyDomain,
    });
    return NextResponse.json({ repositoryId: repository.id, document }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'knowledge/repositories/attach');
  }
});
