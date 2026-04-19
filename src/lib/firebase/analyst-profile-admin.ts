import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from './admin';
import { DEFAULT_ANALYST_PROFILE, type AnalystProfile } from '@/types/analyst-profile';

const USERS = 'users';
const PROFILE = 'profile';
const PROFILE_DOC = 'analyst';
const VERSIONS = 'profile_versions';

export async function getAnalystProfile(uid: string): Promise<AnalystProfile | null> {
  const db = getAdminDbOrThrow();
  const ref = db.collection(USERS).doc(uid).collection(PROFILE).doc(PROFILE_DOC);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap.data() as AnalystProfile;
}

/**
 * Upserts partial profile fields. Preserves other fields via merge.
 * Updates meta.lastEditedAt. Does NOT bump meta.version (that's completeAnalystProfile).
 */
export async function upsertAnalystProfile(
  uid: string,
  patch: Partial<AnalystProfile>,
): Promise<void> {
  const db = getAdminDbOrThrow();
  const ref = db.collection(USERS).doc(uid).collection(PROFILE).doc(PROFILE_DOC);
  const snap = await ref.get();
  if (!snap.exists) {
    // First write — seed with defaults
    await ref.set({
      ...DEFAULT_ANALYST_PROFILE,
      ...patch,
      meta: {
        ...DEFAULT_ANALYST_PROFILE.meta,
        createdAt: FieldValue.serverTimestamp(),
        lastEditedAt: FieldValue.serverTimestamp(),
      },
    });
    return;
  }
  await ref.set({
    ...patch,
    meta: { ...(patch.meta ?? {}), lastEditedAt: FieldValue.serverTimestamp() },
  }, { merge: true });
}

/**
 * Bumps meta.version, writes immutable snapshot to profile_versions/{versionId},
 * sets users/{uid}.onboardingCompletedAt. Returns versionId.
 */
export async function completeAnalystProfile(uid: string): Promise<{ versionId: string }> {
  const db = getAdminDbOrThrow();
  const userRef = db.collection(USERS).doc(uid);
  const profileRef = userRef.collection(PROFILE).doc(PROFILE_DOC);

  const snap = await profileRef.get();
  const current = (snap.exists ? snap.data() : DEFAULT_ANALYST_PROFILE) as AnalystProfile;
  const nextVersion = (current.meta?.version ?? 0) + 1;
  const versionId = `v${nextVersion}`;

  // write snapshot
  await userRef.collection(VERSIONS).doc(versionId).set({
    ...current,
    meta: { ...current.meta, version: nextVersion, completedAt: FieldValue.serverTimestamp() },
    _snapshotAt: FieldValue.serverTimestamp(),
  });

  // bump live profile
  await profileRef.set({
    meta: {
      version: nextVersion,
      completedAt: FieldValue.serverTimestamp(),
      lastEditedAt: FieldValue.serverTimestamp(),
    },
  }, { merge: true });

  // set root flag
  await userRef.update({
    onboardingCompletedAt: FieldValue.serverTimestamp(),
  });

  return { versionId };
}

export async function incrementOnboardingSkip(uid: string): Promise<void> {
  const db = getAdminDbOrThrow();
  await db.collection(USERS).doc(uid).update({
    onboardingSkipCount: FieldValue.increment(1),
  });
}
