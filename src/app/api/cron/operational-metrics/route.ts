import { NextResponse } from 'next/server';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { collectOperationalMetrics, writeOperationalMetricsSnapshot } from '@/lib/admin/operational-metrics';
import { handleRouteError } from '@/lib/api/standard-error';

export const runtime = 'nodejs';
export const maxDuration = 120;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET ?? '';
  if (!secret) return false;
  const got = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace(/^bearer\s+/i, '') ?? '';
  return got === secret;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDbOrThrow();
    const snapshot = await collectOperationalMetrics(db);
    await writeOperationalMetricsSnapshot(db, snapshot);
    return NextResponse.json({
      ok: true,
      computedAt: snapshot.computedAt,
      panels: snapshot.panels.map((panel) => ({ id: panel.id, status: panel.status, metric: panel.metric })),
      queryErrors: snapshot.queryErrors,
    });
  } catch (err) {
    return handleRouteError(err, 'cron/operational-metrics');
  }
}
