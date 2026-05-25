import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { loadMemoDraft, saveMemoDraft } from '@/lib/firebase/memo-service';
import { MemoBlockSchema, MemoTemplateIdSchema, MemoStatusSchema } from '@/types/memo';

const MemoQuerySchema = z.object({
  caseId: z.string().min(1).max(200),
  templateId: MemoTemplateIdSchema,
});

const SaveMemoSchema = MemoQuerySchema.extend({
  title: z.string().min(1).max(300),
  blocks: z.array(MemoBlockSchema).min(1).max(80),
  graphSnapshotId: z.string().min(1).max(300),
  status: MemoStatusSchema.optional(),
  changeNote: z.string().max(400).optional(),
  capsuleId: z.string().max(240).nullable().optional(),
  capsuleVersion: z.number().int().positive().nullable().optional(),
  conversationId: z.string().max(240).nullable().optional(),
  runId: z.string().max(240).nullable().optional(),
  outputTarget: z.string().max(80).nullable().optional(),
  sourceReceiptIds: z.array(z.string().max(240)).max(100).optional(),
  sourceReceipts: z.array(z.unknown()).max(100).optional(),
  unsupportedClaims: z.array(z.string().max(1000)).max(100).optional(),
  claimChecks: z.array(z.unknown()).max(100).optional(),
  outputCapsuleId: z.string().max(240).nullable().optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    const parsed = MemoQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid memo query', details: parsed.error.flatten() }, { status: 400 });
    }
    if (user.isDemo) return NextResponse.json({ memo: null, versions: [] });
    const record = await loadMemoDraft(user.uid, parsed.data.caseId, parsed.data.templateId);
    return NextResponse.json(record ?? { memo: null, versions: [] });
  } catch (err) {
    return handleRouteError(err, 'memos/get');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const parsed = SaveMemoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid memo draft', details: parsed.error.flatten() }, { status: 400 });
    }
    if (user.isDemo) {
      return NextResponse.json({ success: true, memo: null, versions: [], mode: 'demo-local' });
    }
    const record = await saveMemoDraft(user.uid, parsed.data);
    return NextResponse.json({ success: true, ...record });
  } catch (err) {
    return handleRouteError(err, 'memos/post');
  }
});
