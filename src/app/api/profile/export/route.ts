import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import { getPreferences } from '@/lib/firebase/preferences-service';

/**
 * GET /api/profile/export
 *
 * Returns a self-contained JSON bundle of everything personal about the user:
 * profile, all profile_versions snapshots, preferences, and situations
 * metadata. Intended for GDPR portability and pre-delete backup.
 *
 * Downloads as an attachment.
 */
export const GET = withAuth(async (_req, user) => {
  const uid = user.uid;
  try {
    const [profileSnap, versionsSnap, situationsSnap] = await Promise.all([
      adminDb.doc(`users/${uid}/profile/analyst`).get(),
      adminDb.collection(`users/${uid}/profile_versions`).orderBy('meta.version').get(),
      adminDb.collection(`users/${uid}/situations`).get(),
    ]);
    const preferences = await getPreferences(uid).catch(() => null);

    const bundle = {
      exportedAt: new Date().toISOString(),
      uid,
      profile: profileSnap.exists ? profileSnap.data() : null,
      profile_versions: versionsSnap.docs.map((d) => d.data()),
      preferences,
      situations_metadata: situationsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };

    const dateSlug = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `praxis-profile-${uid}-${dateSlug}.json`;
    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[profile/export] failed:', err);
    return NextResponse.json({ error: 'export failed' }, { status: 500 });
  }
});
