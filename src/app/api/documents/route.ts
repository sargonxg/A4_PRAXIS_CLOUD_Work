import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { listDocuments } from '@/lib/firebase/documents-service';

/**
 * GET /api/documents?situationId={id}
 * Lists all documents for the authenticated user's situation from Firestore.
 */
export const GET = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ documents: [] });
  }

  const url = new URL(req.url);
  const situationId = url.searchParams.get('situationId');

  if (!situationId) {
    return NextResponse.json({ error: 'situationId is required' }, { status: 400 });
  }

  try {
    const docs = await listDocuments(user.uid, situationId);

    return NextResponse.json({
      documents: docs.map((d) => ({
        id: d.id,
        title: d.title,
        fileType: d.fileType,
        size: d.size,
        status: d.status,
        uploadedAt: d.uploadedAt,
        entityCount: d.entityCount,
        chunkCount: d.chunkCount ?? 0,
        entities: d.entities ?? null,
      })),
    });
  } catch (err) {
    console.error('[documents/list] Error:', err);
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 });
  }
});
