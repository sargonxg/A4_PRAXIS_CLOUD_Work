import { adminDb } from '@/lib/firebase/admin';
import { DEFAULT_USER_PREFERENCES, UserPreferencesSchema, type UserPreferences } from '@/types/preferences';
import { FieldValue } from 'firebase-admin/firestore';

const PATH = (uid: string) => `users/${uid}/preferences/default`;

export async function getPreferences(uid: string): Promise<UserPreferences> {
  const snap = await adminDb.doc(PATH(uid)).get();
  if (!snap.exists) return DEFAULT_USER_PREFERENCES;
  const parsed = UserPreferencesSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : DEFAULT_USER_PREFERENCES;
}

export async function savePreferences(uid: string, patch: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = await getPreferences(uid);
  const next = UserPreferencesSchema.parse({
    ...current,
    ...patch,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await adminDb.doc(PATH(uid)).set(next, { merge: true });
  return next;
}
