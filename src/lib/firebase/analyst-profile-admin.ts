import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getAdminDbOrThrow } from './admin';
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
 * Atomically bumps meta.version, writes immutable snapshot to
 * profile_versions/{versionId}, and sets users/{uid}.onboardingCompletedAt.
 *
 * All three writes happen inside a single Firestore transaction — if any one
 * fails, none persist, preventing inconsistent state where a snapshot exists
 * without a corresponding live-profile bump (or vice-versa).
 */
export async function completeAnalystProfile(uid: string): Promise<{ versionId: string }> {
  const userRef = adminDb.collection(USERS).doc(uid);
  const profileRef = userRef.collection(PROFILE).doc(PROFILE_DOC);

  const versionId = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(profileRef);
    const current = (snap.exists ? snap.data() : DEFAULT_ANALYST_PROFILE) as AnalystProfile;
    const nextVersion = (current.meta?.version ?? 0) + 1;
    const vId = `v${nextVersion}`;
    const versionRef = userRef.collection(VERSIONS).doc(vId);

    tx.set(versionRef, {
      ...current,
      meta: { ...current.meta, version: nextVersion, completedAt: FieldValue.serverTimestamp() },
      _snapshotAt: FieldValue.serverTimestamp(),
    });

    tx.set(
      profileRef,
      {
        meta: {
          version: nextVersion,
          completedAt: FieldValue.serverTimestamp(),
          lastEditedAt: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );

    tx.update(userRef, {
      onboardingCompletedAt: FieldValue.serverTimestamp(),
    });

    return vId;
  });

  return { versionId };
}

export async function incrementOnboardingSkip(uid: string): Promise<void> {
  const db = getAdminDbOrThrow();
  await db.collection(USERS).doc(uid).update({
    onboardingSkipCount: FieldValue.increment(1),
  });
}
