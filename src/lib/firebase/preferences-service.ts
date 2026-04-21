import { adminDb } from '@/lib/firebase/admin';
import { DEFAULT_USER_PREFERENCES, UserPreferencesSchema, type UserPreferences } from '@/types/preferences';
import { FieldValue } from 'firebase-admin/firestore';

const PATH = (uid: string) => `users/${uid}/preferences/default`;
const PatchSchema = UserPreferencesSchema.partial().omit({ updatedAt: true });

export async function getPreferences(uid: string): Promise<UserPreferences> {
  const snap = await adminDb.doc(PATH(uid)).get();
  if (!snap.exists) return DEFAULT_USER_PREFERENCES;
  const parsed = UserPreferencesSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : DEFAULT_USER_PREFERENCES;
}

/**
 * Merge-write preferences. Uses Firestore `update` for partial-field writes so
 * concurrent saves of different fields don't clobber each other. Missing docs
 * are upserted via `set({...defaults, ...patch}, {merge: true})` first.
 */
export async function savePreferences(uid: string, patch: Partial<UserPreferences>): Promise<UserPreferences> {
  const validated = PatchSchema.parse(patch);
  const ref = adminDb.doc(PATH(uid));
  const snap = await ref.get();

  if (!snap.exists) {
    // Upsert with defaults then patched fields
    const seed = { ...DEFAULT_USER_PREFERENCES, ...validated, updatedAt: FieldValue.serverTimestamp() };
    await ref.set(seed);
  } else {
    await ref.update({ ...validated, updatedAt: FieldValue.serverTimestamp() });
  }

  const current = await getPreferences(uid);
  return { ...current, ...validated, updatedAt: new Date().toISOString() };
}
