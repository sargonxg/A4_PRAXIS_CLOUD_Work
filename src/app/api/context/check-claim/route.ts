import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { localKnowledgeAdapter } from '@/lib/knowledge/context-engine';

const RequestSchema = z.object({
  contextPackageId: z.string().optional(),
  situationId: z.string().min(1),
  claim: z.string().min(3).max(4000),
  checkFreshness: z.boolean().optional(),
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Demo mode cannot check private claims' }, { status: 403 });
    }
    const raw = await request.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }
    const result = await localKnowledgeAdapter.checkClaim({
      uid: user.uid,
      contextPackageId: parsed.data.contextPackageId,
      situationId: parsed.data.situationId,
      claim: parsed.data.claim,
      checkFreshness: parsed.data.checkFreshness,
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err, 'context/check-claim');
  }
});
