/**
 * DELETE /api/account
 *
 * Permanently deletes the authenticated user's account (GDPR Article 17 — Right to Erasure).
 * Removes:
 *  - All situations and their subcollections (cascade)
 *  - Credit transaction history
 *  - User Firestore document
 *  - Firebase Auth user record
 *  - Session cookie
 */

import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';

const SITUATION_SUBCOLLECTIONS = [
  'graph', 'documents', 'reports', 'scenarios', 'chats',
  'tool-data', 'briefings', 'dossiers', 'talking-points',
  'risk-assessments', 'conflict-grammar',
];

async function purgeCollection(
  colRef: FirebaseFirestore.CollectionReference,
  db: FirebaseFirestore.Firestore,
): Promise<void> {
  let snap = await colRef.limit(200).get();
  while (!snap.empty) {
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < 200) break;
    snap = await colRef.limit(200).get();
  }
}

export const DELETE = withAuth(async (_request: Request, user) => {
  try {
    // Demo users cannot delete real accounts
    if (user.isDemo) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete a demo account.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const uid = user.uid;
    const db = getAdminDbOrThrow();

    // 1. Cascade-delete all situations and their subcollections
    const situationsSnap = await db.collection('users').doc(uid).collection('situations').get();
    for (const sitDoc of situationsSnap.docs) {
      for (const name of SITUATION_SUBCOLLECTIONS) {
        await purgeCollection(sitDoc.ref.collection(name), db);
      }
      await sitDoc.ref.delete();
    }

    // 2. Delete credit transaction history
    const txSnap = await db.collection('credit_transactions')
      .where('userId', '==', uid)
      .limit(500)
      .get();
    if (!txSnap.empty) {
      const batch = db.batch();
      txSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 3. Delete user Firestore document
    await db.collection('users').doc(uid).delete();

    // 4. Delete Firebase Auth user record
    await getAuth().deleteUser(uid);

    // 5. Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete('tacitus-auth-session');

    return new Response(
      JSON.stringify({ success: true, message: 'Account permanently deleted.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return handleRouteError(err, 'account-delete');
  }
});
