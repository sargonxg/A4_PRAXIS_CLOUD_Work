/**
 * /api/ai/timeline-events
 *
 * Calibrated route that aggregates timeline events for the active situation
 * from situation events + ARGUS alerts + extracted document events + grounded
 * Google Search. Returns a Zod-validated payload the timeline UI consumes
 * directly. ML-readable: every event carries source citations and severity
 * metadata so downstream agents (briefing, risk-monitor) can reuse it.
 */

import { z } from 'zod';
import { generateText, Output } from 'ai';
import { getProModel } from '@/lib/ai/providers';
import { withCalibration } from '@/lib/api/with-calibration';
import { handleRouteError } from '@/lib/api/standard-error';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import type { Situation } from '@/types/situation';

export const runtime = 'nodejs';
export const maxDuration = 60;

const EventSchema = z.object({
  id: z.string(),
  ts: z.string().describe('ISO timestamp (date-only OK when full time unknown).'),
  title: z.string(),
  summary: z.string(),
  type: z.enum(['military', 'diplomatic', 'humanitarian', 'political', 'protest', 'election', 'legal', 'economic', 'information', 'other']),
  severity: z.enum(['critical', 'high', 'elevated', 'moderate', 'low', 'unknown']),
  actors: z.array(z.string()).default([]),
  location: z.string().optional(),
  sources: z.array(z.object({
    label: z.string(),
    url: z.string().optional(),
    type: z.enum(['document', 'argus', 'feed', 'web', 'corpus']).default('web'),
  })).default([]),
  details: z.string().optional().describe('Long-form expandable detail, 2-3 sentences max.'),
  related: z.array(z.string()).default([]).describe('Optional related event ids.'),
  confidence: z.enum(['low', 'medium', 'high']),
});

export type TimelineEvent = z.infer<typeof EventSchema>;

const ResponseSchema = z.object({
  situationId: z.string(),
  events: z.array(EventSchema).min(0).max(60),
  rangeStart: z.string(),
  rangeEnd: z.string(),
  generatedAt: z.string(),
  notes: z.string().optional(),
});

export type TimelineEventsResponse = z.infer<typeof ResponseSchema>;

export const POST = withCalibration('timeline-events', 'ai_argus', {
  retrievalQuery: (_req, body) => {
    const sit = body?.situation as { name?: string; region?: string } | undefined;
    if (!sit?.name) return undefined;
    return `timeline events ${sit.name} ${sit.region ?? ''}`.trim();
  },
})(async (request: Request, ctx) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      situation?: Situation;
      situationId?: string;
      windowDays?: number;
    };
    const situation = body.situation;
    const situationId = situation?.id ?? body.situationId;
    const windowDays = typeof body.windowDays === 'number' && body.windowDays > 0 ? Math.min(body.windowDays, 365) : 90;

    const rangeEnd = new Date();
    const rangeStart = new Date(rangeEnd.getTime() - windowDays * 86_400_000);

    const systemPrompt = `${ctx.calibration.systemPromptBlock}\n\nYou produce a structured event timeline for the active situation. Source priority: (1) the user's situation corpus (uploaded docs + ARGUS), (2) GDELT / news from grounded search, (3) public records. NEVER fabricate events. When a date is uncertain, say so in the details and lower confidence to 'low'.`;

    const userPrompt = `Situation: ${situation?.name ?? 'unknown'} (region=${situation?.region ?? 'unknown'}).\nDescription: ${(situation?.description ?? '').slice(0, 1200)}.\nWindow: last ${windowDays} days, from ${rangeStart.toISOString().slice(0, 10)} to ${rangeEnd.toISOString().slice(0, 10)}.\n\nReturn 12-30 distinct events ordered by ts ascending. Cluster related items by linking related[] to other event ids. Mark severity per event. Each event must carry at least one source — corpus citations for items already in the user's docs, web URLs for grounded search results.`;

    const { output } = await generateText({
      model: getProModel(),
      system: systemPrompt,
      prompt: userPrompt,
      output: Output.object({ schema: ResponseSchema }),
    });

    const payload: TimelineEventsResponse = {
      ...output,
      situationId: situationId ?? '',
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      generatedAt: new Date().toISOString(),
    };

    if (ctx.uid && situationId) {
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'timeline-events',
        profileVersion: ctx.calibration.provenance.profileVersion ?? 1,
        output: payload,
      }).catch(() => {});
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return handleRouteError(err, 'timeline-events');
  }
});
