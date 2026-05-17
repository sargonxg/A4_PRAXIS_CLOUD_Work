import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { conversationDocumentPackToMemoBlocks, type ConversationDocumentPack } from '@/lib/ai/ask-answer-envelope';
import { saveMemoDraft } from '@/lib/firebase/memo-service';

const SourceCardSchema = z.object({
  id: z.string().min(1).max(240),
  title: z.string().min(1).max(500),
  label: z.string().min(1).max(120),
  sourceType: z.string().min(1).max(80),
  url: z.string().url().optional(),
  quotePreview: z.string().max(800),
  documentId: z.string().max(240).optional(),
  chunkId: z.string().max(240).optional(),
  sourceReceiptId: z.string().max(240).optional(),
  pageRef: z.string().max(80).optional(),
  paragraphRef: z.string().max(80).optional(),
  citationLabel: z.string().max(80).optional(),
  confidence: z.number().min(0).max(1),
});

const PackSchema = z.object({
  title: z.string().min(1).max(300),
  prompt: z.string().max(4000),
  answer: z.string().min(1).max(60000),
  sourceCards: z.array(SourceCardSchema).max(24),
  gaps: z.array(z.string().max(500)).max(24).default([]),
  provenance: z.object({
    capsuleId: z.string().nullable().optional(),
    capsuleVersion: z.number().nullable().optional(),
    threadId: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    provider: z.string().nullable().optional(),
    contextPackageId: z.string().nullable().optional(),
    generatedAt: z.string().optional(),
  }).default({}),
});

const RequestSchema = z.object({
  pack: PackSchema,
  situationId: z.string().min(1).max(200),
  askTurnId: z.string().max(240).optional(),
});

export const POST = withAuth(async (request, user) => {
  try {
    const parsed = RequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid Ask document pack', details: parsed.error.flatten() }, { status: 400 });
    }

    const blocks = conversationDocumentPackToMemoBlocks(parsed.data.pack as ConversationDocumentPack);
    if (user.isDemo) {
      return NextResponse.json({
        success: true,
        mode: 'demo-local',
        memo: null,
        blocks,
      });
    }

    const record = await saveMemoDraft(user.uid, {
      caseId: parsed.data.situationId,
      templateId: 'policy-memo',
      title: parsed.data.pack.title,
      graphSnapshotId: `${parsed.data.situationId}:ask-pack:${parsed.data.askTurnId ?? 'turn'}`,
      blocks,
      status: 'draft',
      changeNote: 'Created from Ask PRAXIS document pack.',
    });

    return NextResponse.json({ success: true, ...record });
  } catch (err) {
    return handleRouteError(err, 'memos/from-ask-pack');
  }
});
