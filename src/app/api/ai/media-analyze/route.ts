import { generateObject } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { withAuth } from '@/lib/api/with-auth';
import { z } from 'zod';

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

export const POST = withAuth(async (request: Request) => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in Vercel environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { source, topic } = await request.json();

    const creditCheck = await checkAndDeductCredits('ai_media', 'Media analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    const { object } = await generateObject({
      model: getModel(),
      schema: MediaAnalysisSchema,
      prompt: `Analyze the media source "${source}" for a conflict/peace professional.
${topic ? `Specific topic context: ${topic}` : ''}
Provide a professional assessment of political orientation (-1 left to +1 right), reliability (0-1), editorial independence (0-1), ownership type, country of origin, known biases, coverage strengths, and conflict coverage notes. Recommend cross-reference sources.`,
    });

    return Response.json({ source, topic, assessment: object });
  } catch (err) {
    console.error('Media analyze route error:', err);
    return Response.json({ error: 'Media analysis failed' }, { status: 500 });
  }
});
