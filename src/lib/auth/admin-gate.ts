/**
 * Admin-only route gate.
 *
 * Environment-variable driven — no client-side claims, no Firestore roles.
 * ADMIN_ALLOWLIST is a comma-separated list of Firebase uid values.
 * ADMIN_EMAIL_ALLOWLIST is a comma-separated list of verified email addresses.
 * Kept minimal so the gate is auditable at a glance.
 */

export function isAdmin(uid: string | null | undefined): boolean {
  if (!uid) return false;
  const raw = process.env.ADMIN_ALLOWLIST ?? '';
  const allowed = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return allowed.includes(uid);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST ?? 'giulio@tacitus.me';
  const allowed = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  return allowed.includes(normalized);
}

export function isAdminPrincipal(user: {
  uid?: string | null;
  email?: string | null;
} | null | undefined): boolean {
  return isAdmin(user?.uid) || isAdminEmail(user?.email);
}

/** Fast helper for API routes — returns 403 NextResponse if not allowed. */
export function requireAdmin(user: string | { uid?: string | null; email?: string | null } | null | undefined) {
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
