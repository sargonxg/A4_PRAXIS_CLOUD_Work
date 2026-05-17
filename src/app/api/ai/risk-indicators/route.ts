/**
 * /api/ai/risk-indicators
 *
 * Calibrated route that returns a structured set of risk indicators for the
 * active situation. Pulls from the AnalystProfile, the situation corpus
 * (SKC retrieval), uploaded documents, ARGUS alerts via the bound tool set,
 * and grounded Google Search. The indicator catalog is domain-specific —
 * see src/lib/constants/indicator-catalog.ts.
 *
 * Output is Zod-validated so other tools (briefing, dashboard) can consume
 * the same payload deterministically.
 */

import { z } from 'zod';
import { generateText, Output } from 'ai';
import { getProModel } from '@/lib/ai/providers';
import { withCalibration } from '@/lib/api/with-calibration';
import { handleRouteError } from '@/lib/api/standard-error';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { indicatorsForDomain } from '@/lib/constants/indicator-catalog';
import type { Situation } from '@/types/situation';

export const runtime = 'nodejs';
export const maxDuration = 60;

const IndicatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  framework: z.string(),
  value: z.string().describe('Best-effort value; "n/a" if unknown.'),
  unit: z.string().optional(),
  trend: z.enum(['up', 'down', 'flat', 'unknown']),
  severity: z.enum(['critical', 'high', 'elevated', 'moderate', 'low', 'unknown']),
  confidence: z.enum(['low', 'medium', 'high']),
  lastUpdated: z.string().describe('ISO date of the latest data point cited.'),
  sourceUrl: z.string().optional().describe('Direct URL when one citable source dominates.'),
  sourceLabel: z.string().optional().describe('Short feed/site label, e.g. "grounded search", "OCHA", "Reuters".'),
  rationale: z.string().describe('One-sentence justification grounded in the corpus or grounded search.'),
});

const ResponseSchema = z.object({
  situationId: z.string(),
  domain: z.string(),
  indicators: z.array(IndicatorSchema).min(4).max(20),
  summary: z.string().describe('One-paragraph synthesis of what these indicators say together.'),
  generatedAt: z.string(),
});

export type RiskIndicatorsResponse = z.infer<typeof ResponseSchema>;

export const POST = withCalibration('risk-indicators', 'ai_risk_assessment', {
  retrievalQuery: (_req, body) => {
    const sit = body?.situation as { name?: string; region?: string } | undefined;
    if (!sit?.name) return undefined;
    return `risk indicators ${sit.name} ${sit.region ?? ''}`.trim();
  },
})(async (request: Request, ctx) => {
  try {
    const body = (await request.json().catch(() => ({}))) as { situation?: Situation; situationId?: string };
    const situation = body.situation;
    const situationId = situation?.id ?? body.situationId;
    const domain = situation?.domain ?? 'generic';
    const catalog = indicatorsForDomain(domain);

    const catalogPrompt = catalog
      .map((i) => `- ${i.id} | ${i.name} | ${i.framework} | unit=${i.unit ?? 'n/a'} | ${i.rationale}`)
      .join('\n');

    const systemPrompt = `${ctx.calibration.systemPromptBlock}\n\nYou produce structured risk indicators for the active situation.\n\nCATALOG (use as scaffold — keep ids stable so the UI can match cards across runs):\n${catalogPrompt}\n\nFor every indicator: output value (best estimate, "n/a" if unknown), trend, severity, confidence, lastUpdated (ISO), and a one-sentence rationale. When you cite a specific source, include sourceUrl and sourceLabel.`;

    const userPrompt = `Situation: ${situation?.name ?? 'unknown'} (region=${situation?.region ?? 'unknown'}, domain=${domain}).\nDescription: ${(situation?.description ?? '').slice(0, 1200)}.\n\nReturn 8-14 indicators ordered by current severity. Lean on the user's situation corpus + ARGUS alerts where available. If the corpus has nothing on a metric, mark confidence=low and trend=unknown — do not invent values.`;

    const { output } = await generateText({
      model: getProModel(),
      system: systemPrompt,
      prompt: userPrompt,
      output: Output.object({ schema: ResponseSchema }),
    });

    const payload: RiskIndicatorsResponse = {
      ...output,
      situationId: situationId ?? '',
      domain,
      generatedAt: new Date().toISOString(),
    };

    if (ctx.uid && situationId) {
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'risk-indicators',
        profileVersion: ctx.calibration.provenance.profileVersion ?? 1,
        output: payload,
      }).catch(() => {});
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return handleRouteError(err, 'risk-indicators');
  }
});
