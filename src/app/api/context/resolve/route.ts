import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { localKnowledgeAdapter } from '@/lib/knowledge/context-engine';

const RequestSchema = z.object({
  contextPackageId: z.string().optional(),
  situationId: z.string().min(1),
  query: z.string().max(2000).optional(),
  coreRefs: z.object({
    userCoreId: z.string().optional(),
    teamCoreId: z.string().optional(),
    situationCoreId: z.string().optional(),
    sourceCoreIds: z.array(z.string()).optional(),
    documentCoreIds: z.array(z.string()).optional(),
    graphCoreId: z.string().optional(),
    outputCoreIds: z.array(z.string()).optional(),
  }).optional(),
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Demo mode cannot resolve private context packages' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const context = await localKnowledgeAdapter.buildContextPack({
      uid: user.uid,
      contextPackageId: parsed.data.contextPackageId,
      situationId: parsed.data.situationId,
      query: parsed.data.query,
      coreRefs: parsed.data.coreRefs,
    });
    return NextResponse.json(context);
  } catch (err) {
    return handleRouteError(err, 'context/resolve');
  }
});
