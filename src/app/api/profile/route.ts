import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import { scrubProfilePII } from '@/lib/services/pii-scrub';
import type { AnalystProfile } from '@/types/analyst-profile';

/**
 * DELETE /api/profile
 *
 * Soft-deletes the authenticated user's analyst profile. The profile document
 * is overwritten with a scrubbed copy — PII fields emptied, embedding removed,
 * `meta.deletedAt` set. Situations, tool outputs, and profile_versions remain
 * untouched so the user can still access their history and re-onboard later.
 */
export const DELETE = withAuth(async (_req, user) => {
  const ref = adminDb.doc(`users/${user.uid}/profile/analyst`);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ ok: true, alreadyEmpty: true });
  }
  const scrubbed = scrubProfilePII(snap.data() as AnalystProfile);
  await ref.set(scrubbed);

  // Audit trail for GDPR compliance — best-effort; non-fatal if it fails.
  try {
    await adminDb
      .collection(`users/${user.uid}/audit`)
      .add({
        action: 'profile.delete',
        at: new Date().toISOString(),
        uid: user.uid,
      });
  } catch (err) {
    console.warn('[profile/DELETE] audit write failed:', err);
  }

  return NextResponse.json({ ok: true });
});
