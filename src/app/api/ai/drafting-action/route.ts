import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { validateAiRequest } from '@/lib/api/validate-request';
import { applyDraftingAction } from '@/components/drafting/ai-actions';

export const maxDuration = 60;

const DraftingActionRequestSchema = z.object({
  action: z.enum(['redraft', 'expand', 'tighten', 'tone', 'fact-check']),
  text: z.string().min(1).max(20000),
  tone: z.string().max(120).optional(),
  sourceIds: z.array(z.string().min(1).max(180)).max(100).optional(),
  situationId: z.string().min(1).max(180).optional(),
  outputTarget: z.string().max(120).optional(),
});

export const POST = withCalibration('drafting_action', 'ai_light', {
  retrievalQuery: (_req, body) => typeof body.text === 'string' ? body.text.slice(0, 500) : undefined,
  situationId: (_req, body) => typeof body.situationId === 'string' ? body.situationId : undefined,
})(async (request, ctx) => {
  const body = await request.json();
  const validation = validateAiRequest(body, DraftingActionRequestSchema);
  if (!validation.success) return validation.response;

  const result = applyDraftingAction(validation.data);
  await saveToolOutput({
    uid: ctx.uid,
    situationId: validation.data.situationId,
    toolId: 'drafting-action',
    profileVersion: ctx.calibration.provenance.profileVersion,
    toolRunId: ctx.toolRunId,
    output: {
      ...result,
      outputTarget: validation.data.outputTarget ?? null,
      sourceIds: validation.data.sourceIds ?? [],
    },
    metadata: {
      action: validation.data.action,
      outputTarget: validation.data.outputTarget ?? null,
      noWebRetrieval: true,
    },
  }).catch((err) => console.warn('[drafting-action] saveToolOutput failed:', err));

  return NextResponse.json(result);
});
