/**
 * Admin-only route gate.
 *
 * Environment-variable driven — no client-side claims, no Firestore roles.
 * ADMIN_ALLOWLIST is a comma-separated list of Firebase uid values.
 * ADMIN_EMAIL_ALLOWLIST is a comma-separated list of verified email addresses.
 * Kept minimal so the gate is auditable at a glance.
 */

const DEFAULT_ADMIN_EMAILS = ['giulio@tacitus.me', 'giuliocatanzariti@gmail.com'];

function parseCsv(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function getAdminUidAllowlist(): string[] {
  const raw = process.env.ADMIN_ALLOWLIST ?? '';
  return parseCsv(raw);
}

export function getAdminEmailAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST ?? DEFAULT_ADMIN_EMAILS.join(',');
  return parseCsv(raw).map((email) => email.toLowerCase());
}

export function isAdmin(uid: string | null | undefined): boolean {
  if (!uid) return false;
  return getAdminUidAllowlist().includes(uid);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAdminEmailAllowlist().includes(normalized);
}

export function getAdminGateStatus() {
  return {
    defaultAdminEmails: DEFAULT_ADMIN_EMAILS,
    configuredEmailAllowlist: getAdminEmailAllowlist(),
    configuredUidCount: getAdminUidAllowlist().length,
    usingDefaultEmailAllowlist: !process.env.ADMIN_EMAIL_ALLOWLIST,
  };
}

export function getAdminPrincipalAccess(user: {
  uid?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
} | null | undefined) {
  const uidAllowed = isAdmin(user?.uid);
  const emailAllowed = isAdminEmail(user?.email);
  const emailVerified = user?.emailVerified === true;
  const admin = uidAllowed || (emailVerified && emailAllowed);
  return {
    admin,
    uidAllowed,
    emailAllowed,
    emailVerified,
    reason: admin
      ? uidAllowed
        ? 'uid-allowlist'
        : 'verified-email-allowlist'
      : emailAllowed && !emailVerified
        ? 'email-not-verified'
        : 'not-allowlisted',
  };
}

export function isAdminPrincipal(user: {
  uid?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
} | null | undefined): boolean {
  return getAdminPrincipalAccess(user).admin;
}

/** Fast helper for API routes — returns 403 NextResponse if not allowed. */
export function requireAdmin(user: string | { uid?: string | null; email?: string | null; emailVerified?: boolean | null } | null | undefined) {
  const allowed = typeof user === 'string'
    ? isAdmin(user)
    : isAdminPrincipal(user);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }
  return null;
}
