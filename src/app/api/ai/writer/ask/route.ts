import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withCalibration } from '@/lib/api/with-calibration';
import { handleRouteError } from '@/lib/api/standard-error';
import { delegateToAskPraxis } from '@/lib/ai/ask-praxis';
import type { Situation } from '@/types/situation';

const WriterAskSchema = z.object({
  situationId: z.string().min(1).max(200).optional(),
  situation: z.any().optional(),
  selectionText: z.string().max(20_000).default(''),
  prompt: z.string().min(1).max(4_000),
  mode: z.enum(['ask', 'tighten', 'soften', 'steelman']).default('ask'),
});

function modeInstruction(mode: z.infer<typeof WriterAskSchema>['mode']) {
  if (mode === 'tighten') return 'Rewrite the selected text in fewer words. Preserve all claims, caveats, and citations.';
  if (mode === 'soften') return 'Rewrite the selected text in a diplomatic register. Preserve factual claims and source posture.';
  if (mode === 'steelman') return 'Write the strongest opposing view of the selected text, clearly separating evidence from inference.';
  return 'Draft a concise, evidence-grounded passage for the current PRAXIS document.';
}

export const POST = withCalibration('policy-memo', 'ai_chat', {
  variant: 'oneshot',
  situationId: (_req, body) => typeof body.situationId === 'string' ? body.situationId : undefined,
  retrievalQuery: (_req, body) => [body.prompt, body.selectionText].filter((item) => typeof item === 'string').join('\n\n'),
})(async (request, ctx) => {
  try {
    const body = await request.json();
    const parsed = WriterAskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid writer request', details: parsed.error.flatten() }, { status: 400 });
    }

    const question = [
      modeInstruction(parsed.data.mode),
      parsed.data.prompt,
      parsed.data.selectionText ? `\nSelected text:\n${parsed.data.selectionText}` : '',
      '\nReturn text that can be inserted directly into a memo. Use inline [#N] citations where available.',
    ].filter(Boolean).join('\n\n');

    const result = await delegateToAskPraxis({
      uid: ctx.uid,
      isDemo: ctx.isDemo,
      situation: parsed.data.situation as Situation | undefined,
      question,
      systemPromptBlock: ctx.calibration.systemPromptBlock,
      role: 'PRAXIS writing copilot for policy, diplomacy, and political work products.',
      corpusLimit: 6,
    });

    return NextResponse.json({
      text: result.text,
      citations: result.citations.map((citation) => ({
        id: `ask-${citation.index}-${citation.layer}-${citation.title}`.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 120),
        ...citation,
      })),
      toolRunId: ctx.toolRunId,
    });
  } catch (err) {
    return handleRouteError(err, 'ai/writer/ask');
  }
});

export const maxDuration = 60;
