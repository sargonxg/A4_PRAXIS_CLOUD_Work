import { NextResponse } from 'next/server';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { collectOperationalMetrics, writeOperationalMetricsSnapshot } from '@/lib/admin/operational-metrics';
import { handleRouteError } from '@/lib/api/standard-error';
import { requireCronSecret } from '@/lib/api/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET(req: Request) {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

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
