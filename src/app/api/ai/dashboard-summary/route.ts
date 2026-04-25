import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Output, generateText } from 'ai';
import { withCalibration } from '@/lib/api/with-calibration';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { audienceTonePreset, audienceTuningEnabled } from '@/lib/ai/audience-presets';
import type { Situation } from '@/types/situation';

const DailyReadSchema = z.object({
  headline: z.string().max(120),
  body: z.string().min(80).max(800),
  suggestedTools: z.array(z.string()).max(4),
});

export const POST = withCalibration('dashboard', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    return s?.name ? `${s.name} ${s.region ?? ''} overview`.trim() : undefined;
  },
})(async (req, ctx) => {
  const body = (await req.json().catch(() => ({}))) as { situation?: Situation };
  const situation = body.situation ?? null;

  const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
  const sitCtx = situation ? buildToolContext(situation) : 'No active situation.';
  const audienceDirective = audienceTuningEnabled()
    ? `\n\n${audienceTonePreset(outputConstraints.audienceTone)}`
    : '';

  const result = await generateText({
    model: getProModel(),
    experimental_output: Output.object({ schema: DailyReadSchema }),
    system: `${systemPromptBlock}\n\nYou produce the "Daily read" — a 2-4 sentence situational summary written for the analyst whose profile appears above. Suggest up to 4 PRAXIS tool ids to open next (from this set: risk-monitor, early-warning, stakeholder-map, timeline, info-environment, geospatial, actor-profiles, dossier, talking-points).${audienceDirective}`,
    prompt: `Situation context:\n${sitCtx}\n\nWrite the Daily read now.`,
  });

  const output = (result as { experimental_output?: z.infer<typeof DailyReadSchema> }).experimental_output;
  if (!output) {
    return NextResponse.json({ error: 'generation failed' }, { status: 502 });
  }

  if (situation?.id && ctx.uid) {
    void saveToolOutput({
      uid: ctx.uid,
      situationId: situation.id,
      toolId: 'dashboard',
      profileVersion: provenance.profileVersion,
      output,
      metadata: { kind: 'daily-read' },
    }).catch((err) => console.warn('[dashboard-summary] save failed:', err));
  }

  return NextResponse.json(output);
});
