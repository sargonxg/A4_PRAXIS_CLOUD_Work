import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getCapsule, getOrMigrateDefaultCapsule, listCapsules } from '@/lib/context/capsule-service';
import { computeTrustPosture } from '@/lib/context/trust-posture';
import { getSituationAdmin } from '@/lib/firebase/situations';
import { getSourceFreshnessGate } from '@/lib/sources/freshness-gate';

export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  return withAuth(async (request, user) => {
    const url = new URL(request.url);
    const situationId = cleanParam(url.searchParams.get('situationId'));
    const capsuleId = cleanParam(url.searchParams.get('capsuleId'));
    const [capsule, situation, sourceFreshness] = await Promise.all([
      resolveCapsule(user.uid, capsuleId, situationId),
      situationId ? getSituationAdmin(user.uid, situationId) : Promise.resolve(null),
      getSourceFreshnessGate().catch(() => []),
    ]);

    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    }
    if (situationId && !situation) {
      return NextResponse.json({ error: 'Situation not found' }, { status: 404 });
    }

    const trustPosture = computeTrustPosture(capsule, situation, { sourceFreshness });
    return NextResponse.json({
      trustPosture,
      sourceFreshness,
      capsule: {
        capsuleId: capsule.capsuleId,
        version: capsule.version,
        healthScore: capsule.health.score,
      },
      situation: situation ? {
        id: situation.id,
        name: situation.name,
      } : null,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  })(req);
}

async function resolveCapsule(uid: string, capsuleId?: string, situationId?: string) {
  if (capsuleId) return getCapsule(uid, capsuleId);
  if (situationId) {
    const capsules = await listCapsules(uid, { situationId });
    const active = capsules.find((capsule) => capsule.activeForSituationIds.includes(situationId));
    if (active) return active;
    if (capsules[0]) return capsules[0];
  }
  return (await getOrMigrateDefaultCapsule(uid)).capsule;
}

function cleanParam(value: string | null): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}
