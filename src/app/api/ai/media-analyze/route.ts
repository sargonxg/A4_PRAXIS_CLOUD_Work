import { generateText, Output } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { executeWebResearch } from '@/lib/ai/web-research';
import { z } from 'zod';
import type { Situation } from '@/types/situation';
import { isServerDemoMode } from '@/lib/compat/sample-mode';

export const maxDuration = 60;

const DEMO_RESPONSE = { politicalOrientation: -0.1, reliability: 0.75, editorialIndependence: 0.8, ownershipType: 'public', country: 'United Kingdom', description: 'Demo: A leading international broadcaster known for balanced conflict coverage.', knownBiases: ['Western-centric framing', 'Emphasis on official state positions'], coverageStrengths: ['Breaking news', 'Field reporting', 'Expert analysis'], conflictCoverageNotes: 'Generally follows Geneva Conventions in conflict terminology. Cross-reference with local sources for ground-level dynamics.', recommendedCrossReferences: ['Al Jazeera English', 'Reuters', 'Local press'] };

const MediaAnalysisSchema = z.object({
  politicalOrientation: z.number().min(-1).max(1).describe('Political orientation from -1 (left) to +1 (right)'),
  reliability: z.number().min(0).max(1).describe('Overall reliability score 0-1'),
  editorialIndependence: z.number().min(0).max(1).describe('Editorial independence from government/owners 0-1'),
  ownershipType: z.enum(['state', 'public', 'private', 'wire', 'nonprofit']),
  country: z.string().describe('Country of origin'),
  description: z.string().describe('Brief professional description of the outlet'),
  knownBiases: z.array(z.string()).describe('Documented editorial biases or slants'),
  coverageStrengths: z.array(z.string()).describe('Areas where this source is particularly reliable'),
  conflictCoverageNotes: z.string().describe('Notes on conflict/peace reporting specifically'),
  recommendedCrossReferences: z.array(z.string()).describe('Sources to cross-reference with this outlet'),
});

export const POST = withCalibration('media_compass', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const src = typeof body.source === 'string' ? body.source : '';
    const topic = typeof body.topic === 'string' ? body.topic : '';
    return [src, topic].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const { source, topic, situation } = await request.json() as {
      source: string;
      topic?: string;
      situation?: Situation;
    };
    const situationId = situation?.id ?? '';

    if (isServerDemoMode()) {
      return Response.json({ source, topic, assessment: DEMO_RESPONSE });
    }

    // Credits + profile gate already handled by withCalibration above.

    const graphCtx = situationId
      ? await buildGraphContext(ctx.uid, situationId, 'media_analysis').catch(() => '')
      : '';
    const liveResults = await executeWebResearch(
      [source, topic, situation?.name].filter(Boolean).join(' '),
      situation?.name ?? source,
      ctx.uid,
      {
        toolId: 'media-analysis',
        actors: situation?.actors,
        description: situation?.description,
        maxResults: 6,
      },
    ).catch(() => []);
    const liveContext = liveResults.length
      ? liveResults
          .slice(0, 6)
          .map((r, i) => `[${i + 1}] ${r.title} — ${r.source}${r.publishedDate ? ` (${r.publishedDate})` : ''}\n${r.url}\n${(r.snippet ?? r.content).slice(0, 260)}`)
          .join('\n\n')
      : 'No live source results were retrieved. Flag this as an evidence gap if the outlet cannot be verified.';

    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const basePrompt = `Analyze the media source "${source}" for a conflict/peace professional.
${topic ? `Specific topic context: ${topic}` : ''}
Provide a professional assessment of political orientation (-1 left to +1 right), reliability (0-1), editorial independence (0-1), ownership type, country of origin, known biases, coverage strengths, and conflict coverage notes. Recommend cross-reference sources.`;

    const fullPrompt = `${graphCtx ? `${graphCtx}\n\n` : ''}LIVE SOURCE CONTEXT\n${liveContext}\n\n${basePrompt}`;

    const result = await generateText({
      model: getModel(),
      output: Output.object({ schema: MediaAnalysisSchema }),
      system: `You are a senior media analyst evaluating source credibility for conflict/peace professionals.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: fullPrompt,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'media_analysis', result.output as Record<string, unknown>).catch(() => {});
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'media_compass',
        profileVersion: provenance.profileVersion,
        output: { source, topic, assessment: result.output },
        metadata: { mode: 'single-source' },
      }).catch((err) => console.warn('[media_analyze] saveToolOutput failed:', err));
    }

    return Response.json({ source, topic, assessment: result.output });
  } catch (err) {
    console.error('Media analyze route error:', err);
    return Response.json({ error: 'Media analysis failed' }, { status: 500 });
  }
});
