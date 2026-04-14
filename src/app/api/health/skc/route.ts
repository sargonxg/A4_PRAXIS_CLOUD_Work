import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import { SituationKnowledgeCore } from '@/lib/knowledge';

export const GET = withAuth(async (req: Request, user: AuthenticatedUser) => {
  const { uid } = user;
  const { searchParams } = new URL(req.url);
  const situationId = searchParams.get('situationId') ?? 'health-check';

  try {
    const skc = new SituationKnowledgeCore(uid, situationId);
    const health = await skc.getHealth();
    return NextResponse.json({
      status: 'ok',
      uid,
      situationId,
      layers: health,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      error: String(err),
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});
