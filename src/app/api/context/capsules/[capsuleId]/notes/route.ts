import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { createCapsuleNote, listCapsuleNotes } from '@/lib/context/capsule-details-service';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ capsuleId: string }> };

const LinksSchema = z.object({
  runId: z.string().max(160).nullable().optional(),
  outputCapsuleId: z.string().max(160).nullable().optional(),
  sourceIds: z.array(z.string().max(160)).max(20).optional(),
  documentIds: z.array(z.string().max(160)).max(20).optional(),
}).optional();

const CreateNoteSchema = z.object({
  id: z.string().min(1).max(160).optional(),
  type: z.enum(['analyst_note', 'decision', 'gap', 'handover', 'source_note']).optional(),
  title: z.string().max(160).optional(),
  body: z.string().min(1).max(8000),
  tags: z.array(z.string().max(48)).max(20).optional(),
  starred: z.boolean().optional(),
  pinned: z.boolean().optional(),
  links: LinksSchema,
});

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) return NextResponse.json({ notes: [], persisted: false });
    const notes = await listCapsuleNotes(user.uid, capsuleId);
    return NextResponse.json({ notes, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/notes/list');
  }
});

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { capsuleId } = await context.params;
    if (user.isDemo) {
      return NextResponse.json({ error: 'Sample mode cannot mutate private capsule notes' }, { status: 403 });
    }
    const parsed = CreateNoteSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule note', details: parsed.error.flatten() }, { status: 400 });
    }
    const note = await createCapsuleNote(user.uid, capsuleId, parsed.data);
    if (!note) return NextResponse.json({ error: 'Capsule not found or note is empty' }, { status: 404 });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'context/capsules/notes/create');
  }
});
