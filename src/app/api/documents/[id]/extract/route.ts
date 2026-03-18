import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { z } from 'zod';
import { getDocument, updateDocumentEntities } from '@/lib/services/document-store';

export const maxDuration = 120;

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const document = getDocument(id);

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  if (!document.text || document.text.trim().length === 0) {
    return NextResponse.json(
      { error: 'Document has no text content to extract from' },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' },
      { status: 503 }
    );
  }

  try {
    // Mark as processing
    document.status = 'processing';

    const { object } = await generateObject({
      model: getModel(),
      schema: ExtractedEntitySchema,
      prompt: `You are a conflict analysis expert. Extract structured conflict intelligence entities from the following document using the Conflict Grammar framework (ACO primitives).

Extract all 8 entity types: actors, claims, interests, constraints, leverage, commitments, events, narratives.

For each entity, provide:
- A unique ID (use format: type-n, e.g. actor-1, claim-2)
- A confidence score (0-1) based on how clearly the entity is evidenced in the text
- Appropriate classification fields

Document title: ${document.title}
Document text:
---
${document.text}
---

If a category has no clear entities in the text, return an empty array for that category. Be precise and grounded in the text.`,
    });

    const entityCount = Object.values(object).reduce(
      (sum, arr) => sum + (arr as unknown[]).length,
      0
    );

    updateDocumentEntities(id, object, entityCount);

    return NextResponse.json({
      success: true,
      documentId: id,
      entityCount,
      entities: object,
    });
  } catch (err) {
    console.error('Document extraction error:', err);
    document.status = 'error';
    return NextResponse.json({ error: 'Entity extraction failed' }, { status: 500 });
  }
}
