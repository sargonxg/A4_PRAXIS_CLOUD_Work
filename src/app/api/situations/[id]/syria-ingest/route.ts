import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { saveDocument } from '@/lib/firebase/documents-service';
import { collectSyriaIngestDocuments } from '@/lib/syria/ingest';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  const { id: situationId } = await context.params;
  const body = await request.json().catch(() => ({})) as { live?: boolean; limit?: number; persist?: boolean };
  const live = body.live === true && process.env.SYRIA_LIVE_INGEST_ENABLED === 'true';
  const docs = await collectSyriaIngestDocuments({ live, limit: body.limit });
  const persist = body.persist !== false;
  const stored = [];

  if (persist) {
    for (const doc of docs) {
      const saved = await saveDocument(user.uid, situationId, {
        title: doc.title,
        fileType: 'osint-source',
        size: doc.text.length,
        text: doc.text,
        status: 'extracted',
        uploadedAt: doc.retrievedAt,
        entityCount: 0,
        entities: {
          provenance: doc.provenance,
          sourceId: doc.sourceId,
          sourceName: doc.sourceName,
          sourceUrl: doc.url,
          tier: doc.tier,
          cachedFallback: !doc.provenance.live,
        },
      });
      stored.push(saved.id);
    }
  }

  return NextResponse.json({
    ok: true,
    live,
    cachedFallback: docs.some((doc) => !doc.provenance.live),
    documents: docs,
    storedDocumentIds: stored,
  });
});
