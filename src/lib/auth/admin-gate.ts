/**
 * Admin-only route gate.
 *
 * Environment-variable driven — no client-side claims, no Firestore roles.
 * ADMIN_ALLOWLIST is a comma-separated list of uid values that are allowed
 * to hit admin endpoints. Kept minimal so the gate is auditable at a glance.
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

/** Fast helper for API routes — returns 403 NextResponse if not allowed. */
export function requireAdmin(uid: string | null | undefined) {
  if (!isAdmin(uid)) {
    return new Response(JSON.stringify({ error: 'Forbidden — admin only' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }
  return null;
}
