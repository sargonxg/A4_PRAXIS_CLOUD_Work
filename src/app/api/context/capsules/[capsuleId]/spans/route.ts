import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { bumpCapsuleVersion, getCapsule } from '@/lib/context/capsule-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const SpanTargetSchema = z.enum([
  'sourceability',
  'temporality',
  'causality',
  'human-friction',
  'rules',
  'open-question',
]);

const CreateSpanSchema = z.object({
  text: z.string().min(3).max(4000),
  targetCore: SpanTargetSchema,
  sourceType: z.enum(['assistant-message', 'document-selection', 'manual-note']).default('manual-note'),
  documentId: z.string().min(1).max(240).optional(),
  messageId: z.string().min(1).max(240).optional(),
  startOffset: z.number().int().nonnegative().optional(),
  endOffset: z.number().int().nonnegative().optional(),
  note: z.string().max(1000).optional(),
});

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) return NextResponse.json({ spans: [] });
    const capsule = await getCapsule(user.uid, capsuleId);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });
    const snap = await getAdminDbOrThrow()
      .collection('users')
      .doc(user.uid)
      .collection('capsules')
      .doc(capsule.capsuleId)
      .collection('spans')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    return NextResponse.json({ spans: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/spans/list');
  }
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot mutate private capsules' }, { status: 403 });
    }
    const { capsuleId } = await context.params;
    const capsule = await getCapsule(user.uid, capsuleId);
    if (!capsule) return NextResponse.json({ error: 'Capsule not found' }, { status: 404 });

    const parsed = CreateSpanSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule span', details: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date().toISOString();
    const db = getAdminDbOrThrow();
    const spanRef = db
      .collection('users')
      .doc(user.uid)
      .collection('capsules')
      .doc(capsule.capsuleId)
      .collection('spans')
      .doc();
    const span = {
      id: spanRef.id,
      capsuleId: capsule.capsuleId,
      capsuleVersion: capsule.version,
      text: parsed.data.text.trim(),
      targetCore: parsed.data.targetCore,
      sourceType: parsed.data.sourceType,
      documentId: parsed.data.documentId ?? null,
      messageId: parsed.data.messageId ?? null,
      startOffset: parsed.data.startOffset ?? null,
      endOffset: parsed.data.endOffset ?? null,
      note: parsed.data.note?.trim() || null,
      createdAt: now,
      createdBy: user.uid,
    };
    await spanRef.set(span);

    const existingTags = capsule.community.tags ?? [];
    const tags = Array.from(new Set([...existingTags, `span:${parsed.data.targetCore}`])).slice(0, 20);
    const updated = await bumpCapsuleVersion(user.uid, capsule.capsuleId, { community: { tags } });
    return NextResponse.json({ span, capsule: updated }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/spans/create');
  }
});
