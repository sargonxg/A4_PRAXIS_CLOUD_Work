import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';

const encoder = new TextEncoder();

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const question = String(body.question ?? '').trim();
  const contextId = String(body.contextId ?? '').trim();
  const userModelId = String(body.userModelId ?? '').trim();
  if (!question || !contextId || !userModelId) {
    return NextResponse.json({ error: 'question, contextId, and userModelId are required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const subQuestions = [
        question,
        `Which authoritative sources address ${question}?`,
        `What gaps or contradictions matter for ${question}?`,
      ];
      for (const subQuestion of subQuestions) {
        controller.enqueue(sse('subQuestionGenerated', { question: subQuestion }));
      }
      controller.enqueue(sse('sourceFound', {
        title: 'Wikidata grounding',
        tier: 'T2',
        url: 'https://www.wikidata.org/',
        crossVerified: false,
      }));
      controller.enqueue(sse('sourceFound', {
        title: 'Google Grounded Search',
        tier: 'T5',
        url: '',
        crossVerified: false,
        note: 'Production route uses Vertex grounding when credentials are available.',
      }));
      controller.enqueue(sse('extractionCandidate', {
        primitive: 'Claim',
        text: question,
        confidence: 0.62,
        ownerUid: user.uid,
        contextId,
      }));
      controller.enqueue(sse('finalReport', {
        executiveSummary: `Research scaffold prepared for ${question}.`,
        keyFindings: [],
        sourceMatrix: [],
        gaps: ['Live grounded search was not invoked by this local fallback.'],
        contradictions: [],
        followUps: subQuestions,
        userModelId,
        ownerUid: user.uid,
      }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      'X-Praxis-Owner': user.uid,
    },
  });
});

function sse(event: string, payload: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}
