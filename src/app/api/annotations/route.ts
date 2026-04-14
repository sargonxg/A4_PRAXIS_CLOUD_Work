import { NextResponse } from 'next/server';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Annotation, AnnotationType } from '@/types/provenance';

// ---------------------------------------------------------------------------
// GET — list annotations for a tool output
// ---------------------------------------------------------------------------

export const GET = withAuth(async (request, user) => {
  try {
    const url = new URL(request.url);
    const situationId = url.searchParams.get('situationId');
    const toolId = url.searchParams.get('toolId');

    if (!situationId || !toolId) {
      return NextResponse.json({ error: 'situationId and toolId required' }, { status: 400 });
    }

    const db = getAdminDbOrThrow();
    const snap = await db
      .collection('users').doc(user.uid)
      .collection('situations').doc(situationId)
      .collection('tools').doc(toolId)
      .collection('annotations')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const annotations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ annotations });
  } catch (err) {
    return handleRouteError(err, 'annotations/get');
  }
});

// ---------------------------------------------------------------------------
// POST — create, update, or delete an annotation
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json() as {
      action: 'create' | 'delete';
      situationId: string;
      toolId: string;
      // create
      type?: AnnotationType;
      note?: string;
      correction?: string;
      targetPath?: string;
      targetText?: string;
      // delete
      annotationId?: string;
    };

    const { action, situationId, toolId } = body;
    if (!situationId || !toolId) {
      return NextResponse.json({ error: 'situationId and toolId required' }, { status: 400 });
    }

    const db = getAdminDbOrThrow();
    const annotationsRef = db
      .collection('users').doc(user.uid)
      .collection('situations').doc(situationId)
      .collection('tools').doc(toolId)
      .collection('annotations');

    if (action === 'create') {
      const { type, note, correction, targetPath, targetText } = body;
      if (!type || !note) {
        return NextResponse.json({ error: 'type and note required' }, { status: 400 });
      }

      const annotation: Omit<Annotation, 'id'> = {
        toolId,
        situationId,
        type,
        note,
        ...(correction ? { correction } : {}),
        ...(targetPath ? { targetPath } : {}),
        ...(targetText ? { targetText } : {}),
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
      };

      const doc = await annotationsRef.add(annotation);
      return NextResponse.json({ id: doc.id, ...annotation });
    }

    if (action === 'delete') {
      const { annotationId } = body;
      if (!annotationId) return NextResponse.json({ error: 'annotationId required' }, { status: 400 });
      await annotationsRef.doc(annotationId).delete();
      return NextResponse.json({ deleted: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return handleRouteError(err, 'annotations/post');
  }
});
