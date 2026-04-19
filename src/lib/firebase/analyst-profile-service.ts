'use client';

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { DEFAULT_ANALYST_PROFILE, type AnalystProfile } from '@/types/analyst-profile';

const PROFILE_PATH = (uid: string) => doc(db, 'users', uid, 'profile', 'analyst');

export async function loadAnalystProfile(uid: string): Promise<AnalystProfile | null> {
  const snap = await getDoc(PROFILE_PATH(uid));
  if (!snap.exists()) return null;
  return snap.data() as AnalystProfile;
}

/** Client-side merge-save for onboarding wizard. */
export async function saveProfilePatch(uid: string, patch: Partial<AnalystProfile>): Promise<void> {
  await setDoc(PROFILE_PATH(uid), {
    ...patch,
    meta: { ...(patch.meta ?? {}), lastEditedAt: serverTimestamp() },
  }, { merge: true });
}

/**
 * Initializes the profile with defaults on first use (e.g., first onboarding screen).
 * Subsequent saves go through saveProfilePatch.
 */
export async function initAnalystProfileIfMissing(uid: string): Promise<AnalystProfile> {
  const existing = await loadAnalystProfile(uid);
  if (existing) return existing;
  const seeded = {
    ...DEFAULT_ANALYST_PROFILE,
    meta: { ...DEFAULT_ANALYST_PROFILE.meta, createdAt: serverTimestamp(), lastEditedAt: serverTimestamp() },
  };
  await setDoc(PROFILE_PATH(uid), seeded);
  return seeded as AnalystProfile;
}
