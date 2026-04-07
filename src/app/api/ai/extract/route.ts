import { generateObject } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { withAuth } from '@/lib/api/with-auth';
import { z } from 'zod';

const ExtractedEntitySchema = z.object({
  actors: z.array(z.object({
    id: z.string(),
    name: z.string(),
    actorType: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  claims: z.array(z.object({
    id: z.string(),
    actorId: z.string(),
    title: z.string(),
    description: z.string(),
    claimType: z.string(),
    status: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  interests: z.array(z.object({
    id: z.string(),
    actorId: z.string(),
    title: z.string(),
    description: z.string(),
    interestType: z.string(),
    priority: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  constraints: z.array(z.object({
    id: z.string(),
    actorId: z.string(),
    title: z.string(),
    description: z.string(),
    constraintType: z.string(),
    severity: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  leverage: z.array(z.object({
    id: z.string(),
    actorId: z.string(),
    targetActorId: z.string(),
    title: z.string(),
    description: z.string(),
    leverageType: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  commitments: z.array(z.object({
    id: z.string(),
    actorId: z.string(),
    title: z.string(),
    description: z.string(),
    commitmentType: z.string(),
    status: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  events: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    eventType: z.string(),
    date: z.string().optional(),
    impact: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  narratives: z.array(z.object({
    id: z.string(),
    actorId: z.string(),
    title: z.string(),
    description: z.string(),
    narrativeType: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

export const POST = withAuth(async (request, _user) => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { text, extractionTargets } = await request.json();

    const creditCheck = await checkAndDeductCredits('ai_extract', 'Entity extraction');
    if (!creditCheck.allowed) return creditCheck.response;

    if (!text) {
      return Response.json({ error: 'No text provided for extraction' }, { status: 400 });
    }

    const targets = extractionTargets?.length
      ? extractionTargets.join(', ')
      : 'actors, claims, interests, constraints, leverage, commitments, events, narratives';

    const { object } = await generateObject({
      model: getModel(),
      schema: ExtractedEntitySchema,
      prompt: `You are a conflict analysis expert. Extract structured conflict intelligence entities from the following text using the Conflict Grammar framework.

Extract the following entity types: ${targets}

For each entity, provide:
- A unique ID (use format: type-n, e.g. actor-1, claim-2)
- A confidence score (0-1) based on how clearly the entity is evidenced in the text
- Appropriate classification fields

Text to analyze:
---
${text}
---

If a category has no clear entities in the text, return an empty array for that category. Be precise and grounded in the text.`,
    });

    const entityCount = Object.values(object).reduce((sum, arr) => sum + (arr as unknown[]).length, 0);

    return Response.json({ entityCount, entities: object });
  } catch (err) {
    console.error('Extract route error:', err);
    return Response.json({ error: 'Extraction failed' }, { status: 500 });
  }
});
