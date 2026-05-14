import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { requireAdmin } from '@/lib/auth/admin-gate';
import { listPaths } from '@/lib/path/resolve';

export const GET = withAuth(async (_req, user) => {
  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;

  const paths = await listPaths();
  return NextResponse.json({ paths });
});
