import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { getProModel } from '@/lib/ai/providers';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { getDocumentById, updateDocumentStatus } from '@/lib/firebase/documents-service';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

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

type ExtractedEntities = z.infer<typeof ExtractedEntitySchema>;

export const POST = withAuth(async (request, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Not available for this session' }, { status: 403 });
  }

  // Extract doc id from URL pathname: /api/documents/{id}/extract-stored
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const docsIndex = pathParts.indexOf('documents');
  const docId = docsIndex !== -1 ? pathParts[docsIndex + 1] : null;

  if (!docId) {
    return NextResponse.json({ error: 'Document ID missing from URL' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({})) as { situationId?: string };
  const { situationId } = body;

  if (!situationId) {
    return NextResponse.json({ error: 'situationId is required' }, { status: 400 });
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json(
      { error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' },
      { status: 503 }
    );
  }

  const document = await getDocumentById(user.uid, situationId, docId);

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  if (!document.text || document.text.trim().length === 0) {
    return NextResponse.json(
      { error: 'Document has no text content to extract from' },
      { status: 400 }
    );
  }

  try {
    // Mark as processing in Firestore
    await updateDocumentStatus(user.uid, situationId, docId, 'processing');

    const { output } = await generateText({
      model: getProModel(),
      output: Output.object({ schema: ExtractedEntitySchema }),
      prompt: `You are a conflict analysis expert. Extract structured conflict intelligence entities from the following document using the Conflict Grammar framework (ACO primitives).

Extract all 8 entity types: actors, claims, interests, constraints, leverage, commitments, events, narratives.

For each entity, provide:
- A unique ID (use format: type-n, e.g. actor-1, claim-2)
- A confidence score (0-1) based on how clearly the entity is evidenced in the text
- Appropriate classification fields

Document title: ${document.title}
Document text:
---
${document.text.slice(0, 20000)}
---

If a category has no clear entities in the text, return an empty array for that category. Be precise and grounded in the text.`,
    });

    const entities = output as ExtractedEntities;

    const entityCount = Object.values(entities).reduce(
      (sum, arr) => sum + (arr as unknown[]).length,
      0
    );

    // Persist entities back to Firestore
    const db = getAdminDbOrThrow();
    await db
      .collection('users')
      .doc(user.uid)
      .collection('situations')
      .doc(situationId)
      .collection('documents')
      .doc(docId)
      .update({
        status: 'extracted',
        entities,
        entityCount,
      });

    return NextResponse.json({
      success: true,
      documentId: docId,
      entityCount,
      entities,
    });
  } catch (err) {
    console.error('[extract-stored] Entity extraction error:', err);
    await updateDocumentStatus(user.uid, situationId, docId, 'error').catch(() => {});
    return NextResponse.json({ error: 'Entity extraction failed' }, { status: 500 });
  }
});
