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

const DEMO_ARTIFACTS: ArtifactEntry[] = [
  {
    id: 'syria-policy-memo-seed',
    title: 'Syria Transition — Principal Policy Memo (DRAFT)',
    toolId: 'editor',
    bucketUri: 'demo://praxis-artifacts/syria-policy-memo-seed.html',
    size: 32_400,
    contentType: 'text/html; charset=utf-8',
    createdAt: '2026-05-02T09:10:00.000Z',
    updatedAt: '2026-05-02T09:10:00.000Z',
  },
  {
    id: 'syria-morning-brief',
    title: 'Syria — Morning Decision Brief (7 slides)',
    toolId: 'briefing',
    bucketUri: 'demo://praxis-artifacts/syria-morning-brief.html',
    size: 24_800,
    contentType: 'text/html; charset=utf-8',
    createdAt: '2026-05-02T09:12:00.000Z',
    updatedAt: '2026-05-02T09:12:00.000Z',
  },
  {
    id: 'syria-source-pack',
    title: 'Syria Source Pack — UN, OCHA, UNFPA, UNHCR, CCA',
    toolId: 'source-scout',
    bucketUri: 'demo://praxis-artifacts/syria-source-pack.html',
    size: 18_600,
    contentType: 'text/html; charset=utf-8',
    createdAt: '2026-05-02T09:00:00.000Z',
    updatedAt: '2026-05-02T09:00:00.000Z',
  },
  {
    id: 'syria-stakeholder-export',
    title: 'Syria Stakeholder Map — MAW salience export',
    toolId: 'stakeholder-map',
    bucketUri: 'demo://praxis-artifacts/syria-stakeholder-export.html',
    size: 9_200,
    contentType: 'text/html; charset=utf-8',
    createdAt: '2026-05-02T09:14:00.000Z',
    updatedAt: '2026-05-02T09:14:00.000Z',
  },
  {
    id: 'syria-commitments-snapshot',
    title: 'Syria Commitments — compliance snapshot',
    toolId: 'commitments',
    bucketUri: 'demo://praxis-artifacts/syria-commitments-snapshot.html',
    size: 11_400,
    contentType: 'text/html; charset=utf-8',
    createdAt: '2026-05-02T09:16:00.000Z',
    updatedAt: '2026-05-02T09:16:00.000Z',
  },
  {
    id: 'syria-humanitarian-readout',
    title: 'Syria Humanitarian Readout — clusters and hotspots',
    toolId: 'humanitarian',
    bucketUri: 'demo://praxis-artifacts/syria-humanitarian-readout.html',
    size: 12_800,
    contentType: 'text/html; charset=utf-8',
    createdAt: '2026-05-02T09:18:00.000Z',
    updatedAt: '2026-05-02T09:18:00.000Z',
  },
];

export const GET = withAuth(async (request, user) => {
  const url = new URL(request.url);
  const situationId = url.searchParams.get('situationId') || undefined;

  if (user.isDemo) {
    return NextResponse.json({
      mode: 'demo',
      artifacts: DEMO_ARTIFACTS,
      bucket: 'demo://praxis-artifacts',
    });
  }

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
