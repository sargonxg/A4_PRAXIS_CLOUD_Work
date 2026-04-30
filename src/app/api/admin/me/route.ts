import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminGateStatus, getAdminPrincipalAccess } from '@/lib/auth/admin-gate';

/**
 * Lightweight check for whether the current user can access admin surfaces.
 * Supports explicit UID allowlist and verified email allowlist.
 */
export const GET = withAuth(async (_req, user) => {
  const access = getAdminPrincipalAccess(user);
  const gate = getAdminGateStatus();
  return NextResponse.json({
    admin: access.admin,
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified === true,
    access,
    gate: {
      configuredUidCount: gate.configuredUidCount,
      configuredEmailAllowlist: gate.configuredEmailAllowlist,
      usingDefaultEmailAllowlist: gate.usingDefaultEmailAllowlist,
    },
  });
});
