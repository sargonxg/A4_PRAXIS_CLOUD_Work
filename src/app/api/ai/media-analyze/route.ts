import { generateText, Output } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { withAuth } from '@/lib/api/with-auth';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { z } from 'zod';
import type { Situation } from '@/types/situation';
import { isServerDemoMode } from '@/lib/demo/demo-mode';

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

export const POST = withAuth(async (request: Request, user) => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { source, topic, situation } = await request.json() as {
      source: string;
      topic?: string;
      situation?: Situation;
    };
    const situationId = situation?.id ?? '';

    const creditCheck = await checkAndDeductCredits('ai_media', 'Media analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    if (isServerDemoMode()) {
      return Response.json({ source, topic, assessment: DEMO_RESPONSE });
    }

    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'media_analysis').catch(() => '')
      : '';

    const basePrompt = `Analyze the media source "${source}" for a conflict/peace professional.
${topic ? `Specific topic context: ${topic}` : ''}
Provide a professional assessment of political orientation (-1 left to +1 right), reliability (0-1), editorial independence (0-1), ownership type, country of origin, known biases, coverage strengths, and conflict coverage notes. Recommend cross-reference sources.`;

    const fullPrompt = graphCtx ? `${graphCtx}\n\n${basePrompt}` : basePrompt;

    const result = await generateText({
      model: getModel(),
      output: Output.object({ schema: MediaAnalysisSchema }),
      prompt: fullPrompt,
    });

    if (situationId) {
      await writeToolDataServer(user.uid, situationId, 'media_analysis', result.output as Record<string, unknown>).catch(() => {});
    }

    return Response.json({ source, topic, assessment: result.output });
  } catch (err) {
    console.error('Media analyze route error:', err);
    return Response.json({ error: 'Media analysis failed' }, { status: 500 });
  }
});
