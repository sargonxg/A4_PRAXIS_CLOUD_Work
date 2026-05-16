import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getDocumentById } from '@/lib/firebase/documents-service';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Document preview is not available in demo mode' }, { status: 403 });
  }

  const { id } = await context.params;
  const url = new URL(request.url);
  const situationId = url.searchParams.get('situationId');
  const includeText = url.searchParams.get('includeText') !== 'false';
  const maxChars = Math.min(Math.max(Number.parseInt(url.searchParams.get('maxChars') ?? '24000', 10) || 24000, 1000), 60000);

  if (!situationId) {
    return NextResponse.json({ error: 'situationId is required' }, { status: 400 });
  }

  const document = await getDocumentById(user.uid, situationId, id);
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  return NextResponse.json({
    document: {
      id: document.id,
      title: document.title,
      fileType: document.fileType,
      size: document.size,
      status: document.status,
      uploadedAt: document.uploadedAt,
      entityCount: document.entityCount,
      chunkCount: document.chunkCount ?? 0,
      bucketUri: document.bucketUri ?? null,
      sourceCore: document.sourceCore ?? null,
      structured: document.structured ?? null,
      previewText: includeText ? document.text.slice(0, maxChars) : '',
      truncated: includeText ? document.text.length > maxChars : false,
      contextMode: 'praxis_lite',
    },
  });
});
