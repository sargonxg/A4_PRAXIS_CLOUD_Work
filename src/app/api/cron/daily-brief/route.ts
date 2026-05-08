/**
 * GET /api/cron/daily-brief
 *
 * Cron-triggered. Cloud Scheduler hits this hourly; the route picks up
 * every active situation whose owner's local timezone is currently 06:00
 * (or 06:00 UTC fallback when no tz on profile) and writes a fresh Daily
 * Brief for them.
 *
 * Auth: cron-secret header (`CRON_SECRET` env var). Returns 401 if absent.
 *
 * Brick #49 in `docs/ROUND_5_PLAN_2026-04-26.md`.
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';
import { publishBacklogEntry } from '@/lib/dev-backlog/service';
import { requireCronSecret } from '@/lib/api/cron-auth';

export const maxDuration = 300; // up to 5 min — iterates many situations

const TARGET_HOUR = 6; // 06:00 local — analyst wakes up to a fresh brief

interface RunResult {
  uid: string;
  situationId: string;
  status: 'ok' | 'skipped' | 'failed';
  reason?: string;
}

function localHourFor(timezone: string | undefined): number {
  // Compute the local hour for the analyst's timezone. Falls back to UTC.
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

async function runDailyBriefForSituation(
  uid: string,
  situationId: string,
  origin: string
): Promise<RunResult> {
  try {
    const url = `${origin}/api/ai/auto-briefing`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET ?? '',
        'x-impersonate-uid': uid,
      },
      body: JSON.stringify({ situationId, source: 'cron.daily-brief' }),
    });
    if (!r.ok) {
      return { uid, situationId, status: 'failed', reason: `HTTP ${r.status}` };
    }
    return { uid, situationId, status: 'ok' };
  } catch (err) {
    return { uid, situationId, status: 'failed', reason: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  if (!adminDb) {
    return NextResponse.json({ error: 'Firestore Admin not initialized' }, { status: 503 });
  }

  try {
    const origin = new URL(request.url).origin;
    // Iterate active situations across users. Cardinality cap = 200 per
    // cron tick; future round migrates to Cloud Tasks fan-out (BIG #18 path).
    const snap = await adminDb.collectionGroup('situations').limit(200).get();
    const now = new Date();
    const results: RunResult[] = [];
    let processed = 0;

    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>;
      const status = typeof data.status === 'string' ? data.status : 'active';
      if (status === 'archived') continue;
      const owner = doc.ref.parent.parent;
      if (!owner) continue;
      const uid = owner.id;

      const tz = typeof data.timezone === 'string' ? data.timezone : 'UTC';
      const hour = localHourFor(tz);
      if (hour !== TARGET_HOUR) {
        results.push({ uid, situationId: doc.id, status: 'skipped', reason: `local hour ${hour}` });
        continue;
      }
      processed += 1;
      const r = await runDailyBriefForSituation(uid, doc.id, origin);
      results.push(r);
      if (r.status === 'failed') {
        await publishBacklogEntry({
          kind: 'error.route',
          source: 'auto',
          severity: 'medium',
          message: `Daily Brief cron failed for situation ${doc.id}`,
          situationId: doc.id,
          uid,
          route: '/api/cron/daily-brief',
          httpStatus: 500,
          detail: r.reason,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      ranAt: now.toISOString(),
      processed,
      total: snap.docs.length,
      summary: {
        ok: results.filter((r) => r.status === 'ok').length,
        failed: results.filter((r) => r.status === 'failed').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
      },
    });
  } catch (err) {
    return handleRouteError(err, 'cron/daily-brief');
  }
}
