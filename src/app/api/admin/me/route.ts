import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';

/**
 * Lightweight check for whether the current user is in the ADMIN_ALLOWLIST.
 * Used by admin pages to decide whether to render the editor vs. a 403 state.
 */
export const GET = withAuth(async (_req, user) => {
  return NextResponse.json({ admin: isAdminPrincipal(user), uid: user.uid, email: user.email });
});
