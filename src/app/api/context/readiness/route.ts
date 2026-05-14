import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getCapsule, getOrMigrateDefaultCapsule, listCapsules, type PraxisCapsule } from '@/lib/context/capsule-service';
import { computeContextReadiness } from '@/lib/context/readiness';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { getSituationAdmin } from '@/lib/firebase/situations';
import { resolvePath } from '@/lib/path/resolve';
import type { ContextCoreId } from '@/lib/path/types';

export const dynamic = 'force-dynamic';

type RadarAxis = 'user' | 'situation' | 'path' | 'source' | 'graph' | 'time' | 'output';

const AXES: RadarAxis[] = ['user', 'situation', 'path', 'source', 'graph', 'time', 'output'];

export function GET(req: NextRequest) {
  return withAuth(async (request, user) => {
    const url = new URL(request.url);
    const capsuleId = cleanParam(url.searchParams.get('capsuleId'));
    const requestedSituationId = cleanParam(url.searchParams.get('situationId'));

    const capsule = await resolveCapsule(user.uid, capsuleId, requestedSituationId);
    if (!capsule) {
      return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    }

    const situationId = requestedSituationId ?? capsule.coreRefs.situationCoreId ?? capsule.activeForSituationIds[0] ?? null;
    const [profile, situation] = await Promise.all([
      getAnalystProfile(user.uid).catch(() => null),
      situationId ? getSituationAdmin(user.uid, situationId).catch(() => null) : Promise.resolve(null),
    ]);
    const path = await resolvePath(
      capsule.coreRefs.pathCoreId ?? situation?.pathId ?? situation?.workflowPath ?? null,
      situation?.domain,
    );
    const sourceChunkCount = capsule.coreRefs.sourceCoreIds.length + capsule.coreRefs.documentCoreIds.length;
    const readiness = computeContextReadiness({
      profile,
      situation,
      path,
      retrievedChunks: Array.from({ length: sourceChunkCount }, (_, index) => ({
        id: `capsule-source-${index + 1}`,
        source: capsule.coreRefs.sourceCoreIds[index] ?? capsule.coreRefs.documentCoreIds[index] ?? 'capsule-source',
        text: 'Attached capsule source/document reference.',
        score: 1,
      })),
      episodes: situation?.keyDates?.map((date, index) => ({
        id: `key-date-${index + 1}`,
        title: date.label,
        date: date.date,
        dateConfidence: 'exact',
        description: date.significance,
        sources: [],
        actors: [],
        tags: [],
        importance: date.significance === 'critical' ? 5 : date.significance === 'high' ? 4 : 3,
        extractedBy: 'user',
        extractedAt: null,
        profileVersion: 0,
        domainVersion: 0,
        deletedAt: null,
      })) ?? [],
    });
    const axes = axesFromReadiness(readiness.coreCompleteness);
    const target = targetAxes(path?.contextRecipe ?? []);

    return NextResponse.json({
      ...readiness,
      axes,
      target,
      overall: readiness.score >= 75 ? 'ready' : readiness.score >= 45 ? 'thin' : 'broken',
      capsule: {
        capsuleId: capsule.capsuleId,
        version: capsule.version,
        healthScore: capsule.health.score,
        lockedCoreKinds: capsule.lockedCoreKinds,
      },
      path: path ? {
        id: path.id,
        name: path.name,
        contextRecipe: path.contextRecipe,
      } : null,
      situation: situation ? {
        id: situation.id,
        name: situation.name,
      } : null,
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=240',
      },
    });
  })(req);
}

async function resolveCapsule(uid: string, capsuleId?: string, situationId?: string): Promise<PraxisCapsule | null> {
  if (capsuleId) return getCapsule(uid, capsuleId);
  if (situationId) {
    const capsules = await listCapsules(uid, { situationId });
    return capsules.find((capsule) => capsule.activeForSituationIds.includes(situationId)) ?? capsules[0] ?? null;
  }
  return (await getOrMigrateDefaultCapsule(uid)).capsule;
}

function axesFromReadiness(coreCompleteness: Record<RadarAxis, number>): Record<RadarAxis, number> {
  return Object.fromEntries(AXES.map((axis) => [axis, clamp01((coreCompleteness[axis] ?? 0) / 100)])) as Record<RadarAxis, number>;
}

function targetAxes(recipe: readonly ContextCoreId[]): Record<RadarAxis, number> {
  const required = new Set(recipe);
  return Object.fromEntries(AXES.map((axis) => [axis, required.size === 0 || required.has(axis) ? 1 : 0.6])) as Record<RadarAxis, number>;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function cleanParam(value: string | null): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}
