/**
 * GET /api/cron/daily-brief
 *
 * Cron-triggered. Cloud Scheduler hits this hourly; the route enqueues a
 * durable Daily Brief agent run for opted-in users whose local hour is 05:00.
 * Output remains a review-gated memo draft; the worker never auto-publishes.
 */

import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';
import { requireCronSecret } from '@/lib/api/cron-auth';
import { createAgentRun } from '@/lib/agent-runtime/postgres';
import { enqueueAgentRunDispatch } from '@/lib/agent-runtime/cloud-tasks';
import { getCapsule, getOrMigrateDefaultCapsule } from '@/lib/context/capsule-service';
import { normalizePointer } from '@/lib/agent-runtime/state';

export const maxDuration = 300;

const TARGET_HOUR = 5;

interface RunResult {
  uid: string;
  capsuleId: string | null;
  runId?: string;
  status: 'queued' | 'skipped' | 'failed';
  reason?: string;
}

function localHourFor(timezone: string | undefined): number {
  const tz = timezone || 'UTC';
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const hourPart = parts.find((p) => p.type === 'hour');
    if (!hourPart) return new Date().getUTCHours();
    return parseInt(hourPart.value, 10);
  } catch {
    return new Date().getUTCHours();
  }
}

export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  if (!adminDb) {
    return NextResponse.json({ error: 'Firestore Admin not initialized' }, { status: 503 });
  }

  try {
    const snap = await adminDb
      .collectionGroup('preferences')
      .where('dailyBrief.enabled', '==', true)
      .limit(200)
      .get();
    const now = new Date();
    const results: RunResult[] = [];

    for (const doc of snap.docs) {
      const ownerRef = doc.ref.parent.parent;
      if (!ownerRef) continue;
      const uid = ownerRef.id;
      const pref = doc.data() as Record<string, unknown>;
      const dailyBrief = isRecord(pref.dailyBrief) ? pref.dailyBrief : {};
      const requestedCapsuleId = typeof dailyBrief.capsuleId === 'string' && dailyBrief.capsuleId.trim()
        ? dailyBrief.capsuleId.trim()
        : null;
      const ownerSnap = await ownerRef.get().catch(() => null);
      const ownerData = ownerSnap?.data() as Record<string, unknown> | undefined;
      const timezone = typeof ownerData?.timezone === 'string'
        ? ownerData.timezone
        : typeof ownerData?.timeZone === 'string'
          ? ownerData.timeZone
          : 'UTC';
      const hour = localHourFor(timezone);
      if (hour !== TARGET_HOUR) {
        results.push({ uid, capsuleId: requestedCapsuleId, status: 'skipped', reason: `local hour ${hour}` });
        continue;
      }

      const result = await enqueueDailyBriefRun(uid, requestedCapsuleId, now);
      results.push(result);
    }

    return NextResponse.json({
      ranAt: now.toISOString(),
      processed: results.filter((result) => result.status === 'queued').length,
      total: snap.docs.length,
      summary: {
        queued: results.filter((result) => result.status === 'queued').length,
        failed: results.filter((result) => result.status === 'failed').length,
        skipped: results.filter((result) => result.status === 'skipped').length,
      },
      results,
    });
  } catch (err) {
    return handleRouteError(err, 'cron/daily-brief');
  }
}

async function enqueueDailyBriefRun(uid: string, requestedCapsuleId: string | null, now: Date): Promise<RunResult> {
  try {
    const capsule = requestedCapsuleId
      ? await getCapsule(uid, normalizePointer(requestedCapsuleId, 'default'))
      : (await getOrMigrateDefaultCapsule(uid)).capsule;
    if (!capsule || capsule.archivedAt) {
      return { uid, capsuleId: requestedCapsuleId, status: 'skipped', reason: 'capsule not found' };
    }

    const day = now.toISOString().slice(0, 10);
    const objective = `Prepare the ${day} Daily Brief for capsule ${capsule.capsuleId}. Pull fresh grounded search, capsule deltas, open gaps, and write a review-gated memo draft only.`;
    const run = await createAgentRun({
      ownerUid: uid,
      capsuleId: capsule.capsuleId,
      contextStackId: capsule.capsuleId,
      contextPackageId: null,
      selectedCoreIds: {
        userCoreId: capsule.coreRefs.userCoreId,
        teamCoreId: capsule.coreRefs.teamCoreId,
        situationCoreId: capsule.coreRefs.situationCoreId,
        pathCoreId: capsule.coreRefs.pathCoreId ?? null,
        sourceCoreIds: capsule.coreRefs.sourceCoreIds,
        documentCoreIds: capsule.coreRefs.documentCoreIds,
        graphCoreId: capsule.coreRefs.graphCoreId,
        timeCoreId: capsule.coreRefs.timeCoreId ?? null,
        outputCoreIds: capsule.coreRefs.outputCoreIds,
        toolCoreIds: capsule.coreRefs.toolCoreIds ?? [],
        objectiveCoreIds: capsule.coreRefs.objectiveCoreIds ?? [],
        productCoreIds: capsule.coreRefs.productCoreIds ?? [],
        memoryCoreId: capsule.coreRefs.memoryCoreId ?? null,
      },
      agentSpecId: null,
      triggerType: 'schedule',
      objective,
      traceId: `daily-brief-${day}-${randomUUID()}`,
      parentRunId: null,
      idempotencyKey: `daily-brief:${uid}:${capsule.capsuleId}:${day}`,
      maxStep: 18,
      maxSessionMinutes: 20,
      internalEstimatedCostCents: null,
      metadata: {
        policyAgentId: 'daily-brief',
        outputDestination: 'memo_studio',
        selectedToolIds: ['context-resolve', 'capsule-evidence-pack', 'grounded-search', 'daily-brief', 'policy-memo'],
        searchPlan: {
          queries: [
            `${capsule.label ?? capsule.capsuleId} latest policy developments`,
            `${capsule.label ?? capsule.capsuleId} official update today`,
          ],
          sourceClasses: ['public_web', 'official_sources', 'attached_sources'],
          freshnessNeed: 'latest',
          timeframe: '24h',
        },
        scheduledFor: now.toISOString(),
        reviewOnly: true,
        cronSource: 'cron.daily-brief',
      },
    });
    await enqueueAgentRunDispatch({ ownerUid: uid, runId: run.id });
    return { uid, capsuleId: capsule.capsuleId, runId: run.id, status: 'queued' };
  } catch (err) {
    return {
      uid,
      capsuleId: requestedCapsuleId,
      status: 'failed',
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
