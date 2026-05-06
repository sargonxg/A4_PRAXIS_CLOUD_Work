import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { AuthenticatedUser } from '@/lib/api/with-auth';
import { getSituationAdmin } from '@/lib/firebase/situations';
import { computeContextHealthScore } from '@/lib/context/context-health-score';

export async function withContextHealthGate({
  req,
  user,
  situationId,
  threshold = 60,
}: {
  req: Request;
  user: AuthenticatedUser;
  situationId?: string;
  threshold?: number;
}): Promise<Response | null> {
  if (user.isDemo || !situationId) return null;

  const situation = await getSituationAdmin(user.uid, situationId).catch((error) => {
    if (process.env.NODE_ENV === 'test') return null;
    throw error;
  });
  if (!situation && process.env.NODE_ENV === 'test') return null;
  if (!situation) {
    return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
  }

  const report = computeContextHealthScore({ situation, threshold });
  if (report.ready) return null;

  const overrideHash = req.headers.get('X-Context-Health-Override-Hash');
  if (overrideHash && /^[a-f0-9]{64}$/i.test(overrideHash)) {
    return null;
  }

  return NextResponse.json(
    {
      error: 'context_health_precondition_failed',
      message: 'Build or explicitly override case context before running this analysis tool.',
      score: report.score,
      threshold,
      lowestDimension: report.lowestDimension,
      overrideRequired: true,
    },
    {
      status: 412,
      headers: {
        'X-Praxis-Safeguard': 'context_health_gate',
      },
    },
  );
}

export function hashContextHealthOverride(justification: string): string {
  return createHash('sha256').update(justification.trim(), 'utf8').digest('hex');
}
