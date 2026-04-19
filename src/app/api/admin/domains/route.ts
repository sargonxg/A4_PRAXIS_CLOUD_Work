/**
 * GET /api/admin/domains — list all domains (merged with generic) for the admin UI.
 *
 * Gate: requires caller's uid to be in ADMIN_ALLOWLIST env var.
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { requireAdmin } from '@/lib/auth/admin-gate';
import { listDomains } from '@/lib/domain/resolve';

export const GET = withAuth(async (_req, user) => {
  const forbidden = requireAdmin(user.uid);
  if (forbidden) return forbidden;

  const domains = await listDomains();
  return NextResponse.json({ domains });
});
