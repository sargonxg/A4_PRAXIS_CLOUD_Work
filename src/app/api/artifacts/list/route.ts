import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

interface ArtifactEntry {
  id: string;
  title: string;
  toolId: string;
  bucketUri?: string;
  objectPath?: string;
  size?: number;
  contentType?: string;
  updatedAt?: string;
  createdAt?: string;
}

export const GET = withAuth(async (request, user) => {
  const url = new URL(request.url);
  const situationId = url.searchParams.get('situationId') || undefined;

  try {
    const db = getAdminDbOrThrow();
    let artifacts: ArtifactEntry[] = [];

    if (situationId) {
      const snap = await db
        .collection('users')
        .doc(user.uid)
        .collection('situations')
        .doc(situationId)
        .collection('artifacts')
        .orderBy('updatedAt', 'desc')
        .limit(200)
        .get();
      artifacts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ArtifactEntry, 'id'>) }));
    } else {
      // Fan out across the user's situations (capped to a manageable number).
      const sits = await db
        .collection('users')
        .doc(user.uid)
        .collection('situations')
        .limit(20)
        .get();
      for (const sit of sits.docs) {
        const snap = await sit.ref.collection('artifacts').orderBy('updatedAt', 'desc').limit(40).get();
        for (const d of snap.docs) {
          artifacts.push({ id: d.id, ...(d.data() as Omit<ArtifactEntry, 'id'>) });
        }
      }
      artifacts.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    }

    return NextResponse.json({
      mode: 'live',
      artifacts,
      bucket: process.env.FIREBASE_STORAGE_BUCKET || 'praxisbytacitus.appspot.com',
    });
  } catch (err) {
    console.error('[artifacts/list] failed:', err);
    return NextResponse.json(
      {
        mode: 'fallback',
        artifacts: [],
        error: err instanceof Error ? err.message : 'Failed to list artifacts',
      },
      { status: 200 },
    );
  }
});
