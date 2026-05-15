import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withCalibration } from '@/lib/api/with-calibration';
import { sourceabilityFlow } from '@/lib/genkit/flows/sourceability';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SourceSnippetSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(300),
  url: z.string().max(1000).optional(),
  date: z.string().max(80).optional(),
  span: z.string().min(1).max(4000),
});

const RequestSchema = z.object({
  claimText: z.string().min(3).max(4000),
  memoParagraph: z.string().max(6000).optional(),
  sourceSnippets: z.array(SourceSnippetSchema).max(20).default([]),
  capsuleId: z.string().max(160).optional(),
  situationId: z.string().max(160).optional(),
});

export const POST = withCalibration('sourceability', 'ai_sourceability', {
  retrievalQuery: (_req, body) => {
    const claim = typeof body.claimText === 'string' ? body.claimText.trim() : '';
    return claim || undefined;
  },
})(async (request) => {
  const raw = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid sourceability request', issues: parsed.error.issues }, { status: 400 });
  }

  const result = await sourceabilityFlow(parsed.data);
  return NextResponse.json(result);
});
