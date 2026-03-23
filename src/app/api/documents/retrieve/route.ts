import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { retrieveRelevantChunks } from '@/lib/firebase/documents-service';

/**
 * RAG Retrieval Endpoint
 *
 * Given a query and situation, returns the most relevant document chunks.
 * Used by the chat route and other AI tools to ground responses in
 * the user's uploaded documents.
 */
export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ chunks: [] });
  }

  try {
    const { query, situationId, maxChunks } = await req.json();

    if (!query || !situationId) {
      return NextResponse.json({ error: 'query and situationId required' }, { status: 400 });
    }

    const chunks = await retrieveRelevantChunks(user.uid, situationId, query, {
      maxChunks: maxChunks ?? 5,
    });

    return NextResponse.json({
      chunks: chunks.map((c) => ({
        text: c.text,
        documentTitle: c.documentTitle,
        documentId: c.documentId,
        index: c.index,
      })),
      totalFound: chunks.length,
    });
  } catch (err) {
    console.error('[retrieve] Error:', err);
    return NextResponse.json({ error: 'Retrieval failed' }, { status: 500 });
  }
});
