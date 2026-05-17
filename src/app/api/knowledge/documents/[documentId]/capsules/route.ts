import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { attachKnowledgeDocumentToCapsules } from '@/lib/knowledge/library-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ documentId: string }> };

const CapsuleAssociationSchema = z.object({
  capsuleIds: z.array(z.string().min(1).max(160)).min(1).max(20),
  action: z.enum(['attach', 'detach', 'replace']).optional(),
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot mutate private knowledge documents' }, { status: 403 });
    }
    const { documentId } = await context.params;
    const parsed = CapsuleAssociationSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule association', details: parsed.error.flatten() }, { status: 400 });
    }
    const document = await attachKnowledgeDocumentToCapsules(user.uid, documentId, parsed.data);
    if (!document) return NextResponse.json({ error: 'Knowledge document not found' }, { status: 404 });
    return NextResponse.json({ document });
  } catch (err) {
    return handleRouteError(err, 'knowledge/documents/capsules');
  }
});
