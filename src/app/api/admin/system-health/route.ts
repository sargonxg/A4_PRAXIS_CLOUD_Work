import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminPrincipalAccess } from '@/lib/auth/admin-gate';
import { collectRuntimeHealth, sanitizeRuntimeHealth } from '@/lib/health/runtime-health';

export const runtime = 'nodejs';

export const GET = withAuth(async (_request, user) => {
  const access = getAdminPrincipalAccess(user);
  if (!access.admin) {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
  }

  const report = await collectRuntimeHealth();
  return NextResponse.json({
    ...sanitizeRuntimeHealth(report),
    admin: {
      checkedBy: user.email,
      accessReason: access.reason,
      checks: report.checks.map((check) => ({
        id: check.id,
        label: check.label,
        status: check.status,
        latencyMs: check.latencyMs,
        endpoint: check.endpoint,
        detail: check.detail,
        repairAction: check.repairAction,
      })),
    },
  });
});
