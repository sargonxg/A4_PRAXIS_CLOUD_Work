import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withCalibration } from '@/lib/api/with-calibration';
import { handleRouteError } from '@/lib/api/standard-error';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { delegateToAskPraxis } from '@/lib/ai/ask-praxis';
import {
  buildMemoClaimCheckQuestion,
  buildMemoClaimCheckResult,
  checkMemoLanguageConstraints,
} from '@/lib/memo/memo-checks';
import type { Situation } from '@/types/situation';

const WriterAskSchema = z.object({
  situationId: z.string().min(1).max(200).optional(),
  capsuleId: z.string().max(200).optional(),
  situation: z.any().optional(),
  selectionText: z.string().max(20_000).default(''),
  prompt: z.string().min(1).max(4_000),
  mode: z.enum(['ask', 'tighten', 'soften', 'steelman', 'claim-check', 'language-check']).default('ask'),
});

function modeInstruction(mode: z.infer<typeof WriterAskSchema>['mode']) {
  if (mode === 'claim-check') return 'Verify the selected claim against the active capsule sources.';
  if (mode === 'language-check') return 'Check the selected memo text against the analyst output constraints.';
  if (mode === 'tighten') return 'Rewrite the selected text in fewer words. Preserve all claims, caveats, and citations.';
  if (mode === 'soften') return 'Rewrite the selected text in a diplomatic register. Preserve factual claims and source posture.';
  if (mode === 'steelman') return 'Write the strongest opposing view of the selected text, clearly separating evidence from inference.';
  return 'Draft a concise, evidence-grounded passage for the current PRAXIS document.';
}

const ClaimCheckOutputSchema = z.object({
  verdict: z.enum(['supported', 'weak', 'contradicted', 'unsupported']),
  rationale: z.string().max(1200),
  quote: z.string().max(1200).optional(),
  sourceId: z.string().max(240).optional(),
  sourceTitle: z.string().max(300).optional(),
});

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

    const profileVersion = ctx.calibration.provenance.profileVersion;
    const situationId = parsed.data.situationId ?? situationIdFrom(parsed.data.situation);
    const selectionText = parsed.data.selectionText.trim();

    if (parsed.data.mode === 'claim-check') {
      const claim = selectionText || parsed.data.prompt.trim();
      if (!claim) {
        return NextResponse.json({ error: 'Select a claim before running the claim check.' }, { status: 400 });
      }
      const result = await delegateToAskPraxis({
        uid: ctx.uid,
        isDemo: ctx.isDemo,
        situation: parsed.data.situation as Situation | undefined,
        question: buildMemoClaimCheckQuestion({
          claim,
          capsuleId: parsed.data.capsuleId,
        }),
        outputSchema: ClaimCheckOutputSchema,
        systemPromptBlock: ctx.calibration.systemPromptBlock,
        role: 'PRAXIS sourceability reviewer for policy memo claims.',
        corpusLimit: 8,
      });
      const claimCheck = buildMemoClaimCheckResult({
        claim,
        delegateResult: result,
        profileVersion,
        toolRunId: ctx.toolRunId,
      });
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'policy-memo:claim-check',
        profileVersion,
        toolRunId: ctx.toolRunId,
        output: claimCheck,
        metadata: {
          capsuleId: parsed.data.capsuleId ?? null,
          sourceReceipts: claimCheck.receipt ? [claimCheck.receipt] : [],
          action: 'claim-check',
        },
      });
      return NextResponse.json({
        action: 'claim-check',
        claimCheck,
        toolRunId: ctx.toolRunId,
      });
    }

    if (parsed.data.mode === 'language-check') {
      const checkedText = selectionText || parsed.data.prompt.trim();
      if (!checkedText) {
        return NextResponse.json({ error: 'Select text or draft memo text before running the language check.' }, { status: 400 });
      }
      const languageCheck = checkMemoLanguageConstraints(checkedText, ctx.calibration.outputConstraints, {
        profileVersion,
        toolRunId: ctx.toolRunId,
      });
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'policy-memo:language-check',
        profileVersion,
        toolRunId: ctx.toolRunId,
        output: languageCheck,
        metadata: {
          capsuleId: parsed.data.capsuleId ?? null,
          action: 'language-check',
          outputConstraints: ctx.calibration.outputConstraints,
        },
      });
      return NextResponse.json({
        action: 'language-check',
        languageCheck,
        toolRunId: ctx.toolRunId,
      });
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

function situationIdFrom(situation: unknown): string | undefined {
  if (!situation || typeof situation !== 'object') return undefined;
  const id = (situation as { id?: unknown }).id;
  return typeof id === 'string' && id.trim() ? id : undefined;
}
