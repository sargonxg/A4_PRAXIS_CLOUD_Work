import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, getAdminDbOrThrow } from './admin';
import { DEFAULT_ANALYST_PROFILE, isProfileComplete, type AnalystProfile } from '@/types/analyst-profile';
import { isOnboardingComplete } from '@/lib/auth/onboarding-status';

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
 * profile_versions/{versionId}, and marks the analyst profile as completed.
 *
 * Single source of truth: users/{uid}/profile/analyst.meta.completedAt.
 * The legacy users/{uid}.onboardingCompletedAt mirror has been removed —
 * session/middleware/skip flows all read from profile.meta.completedAt now.
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

    return vId;
  });

  return { versionId };
}

/**
 * Increments analyst-profile skip counter (single source of truth).
 * Replaces the previous dual-write to users/{uid}.onboardingSkipCount.
 */
export async function incrementOnboardingSkip(uid: string): Promise<void> {
  const db = getAdminDbOrThrow();
  const ref = db.collection(USERS).doc(uid).collection(PROFILE).doc(PROFILE_DOC);
  await ref.set(
    {
      meta: {
        skipCount: FieldValue.increment(1),
        lastEditedAt: FieldValue.serverTimestamp(),
      },
    },
    { merge: true },
  );
}

export async function hasUserSkippedOnboarding(uid: string): Promise<boolean> {
  const db = getAdminDbOrThrow();
  const ref = db.collection(USERS).doc(uid).collection(PROFILE).doc(PROFILE_DOC);
  const snap = await ref.get();
  if (!snap.exists) return false;
  const meta = (snap.data() as AnalystProfile | undefined)?.meta;
  return typeof meta?.skipCount === 'number' && meta.skipCount > 0;
}

/**
 * Returns true if the user has completed onboarding.
 * Reads profile/analyst.meta.completedAt as canonical source.
 * Falls back to legacy users/{uid}.onboardingCompletedAt for migration —
 * if found, lazily mirrors it onto the analyst profile and returns true.
 */
export async function isUserOnboarded(uid: string): Promise<boolean> {
  const db = getAdminDbOrThrow();
  const profileRef = db.collection(USERS).doc(uid).collection(PROFILE).doc(PROFILE_DOC);
  const profileSnap = await profileRef.get();
  if (profileSnap.exists && isOnboardingComplete(profileSnap.data() as AnalystProfile)) return true;
  if (profileSnap.exists && isLegacyCompleteProfile(profileSnap.data())) {
    await profileRef.set(
      { meta: { completedAt: FieldValue.serverTimestamp(), lastEditedAt: FieldValue.serverTimestamp() } },
      { merge: true },
    );
    return true;
  }

  // Legacy fallback: pre-merge users have completion only on root doc.
  // Lazily mirror onto profile/analyst then drop the legacy field.
  try {
    const userRef = db.collection(USERS).doc(uid);
    const userSnap = await userRef.get();
    const legacyCompleted = userSnap.data()?.onboardingCompletedAt;
    if (legacyCompleted) {
      const legacyProfile = legacyOnboardingProfile(profileSnap.exists ? profileSnap.data() : null, legacyCompleted);
      await profileRef.set(
        legacyProfile,
        { merge: true },
      );
      const migratedSnap = await profileRef.get();
      if (!migratedSnap.exists || !isOnboardingComplete(migratedSnap.data() as AnalystProfile)) {
        return false;
      }
      await userRef.update({
        onboardingCompletedAt: FieldValue.delete(),
        onboardingSkipCount: FieldValue.delete(),
      }).catch(() => { /* non-fatal */ });
      return true;
    }
  } catch (err) {
    console.warn('[analyst-profile-admin] legacy onboarding fallback failed:', err);
  }
  return false;
}

function isLegacyCompleteProfile(profile: unknown): profile is AnalystProfile {
  try {
    return Boolean(profile) && isProfileComplete(profile as AnalystProfile);
  } catch {
    return false;
  }
}

function legacyOnboardingProfile(profile: unknown, completedAt: unknown): AnalystProfile {
  const existing = isRecord(profile) ? profile : {};
  const identity = isRecord(existing.identity) ? existing.identity : {};
  const perspective = isRecord(existing.perspective) ? existing.perspective : {};
  const workingStyle = isRecord(existing.workingStyle) ? existing.workingStyle : {};
  const meta = isRecord(existing.meta) ? existing.meta : {};
  return {
    ...DEFAULT_ANALYST_PROFILE,
    ...(existing as Partial<AnalystProfile>),
    identity: {
      ...DEFAULT_ANALYST_PROFILE.identity,
      ...identity,
      role: typeof identity.role === 'string' && identity.role ? identity.role as AnalystProfile['identity']['role'] : 'researcher',
      seniority: typeof identity.seniority === 'string' && identity.seniority ? identity.seniority as AnalystProfile['identity']['seniority'] : 'mid',
    },
    perspective: {
      ...DEFAULT_ANALYST_PROFILE.perspective,
      ...perspective,
      mandate: typeof perspective.mandate === 'string' && perspective.mandate.trim().length >= 30
        ? perspective.mandate
        : 'Legacy profile migrated with default policy analysis calibration.',
      regions: Array.isArray(perspective.regions) && perspective.regions.length > 0
        ? perspective.regions as string[]
        : ['global'],
    },
    workingStyle: {
      ...DEFAULT_ANALYST_PROFILE.workingStyle,
      ...workingStyle,
      language: typeof workingStyle.language === 'string' && workingStyle.language ? workingStyle.language as AnalystProfile['workingStyle']['language'] : 'en',
      analyticalStyle: typeof workingStyle.analyticalStyle === 'string' && workingStyle.analyticalStyle ? workingStyle.analyticalStyle as AnalystProfile['workingStyle']['analyticalStyle'] : 'rapid_brief',
    },
    meta: {
      ...DEFAULT_ANALYST_PROFILE.meta,
      ...meta,
      completedAt,
      lastEditedAt: FieldValue.serverTimestamp(),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
