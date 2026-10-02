import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withAuth } from '@/lib/api/with-auth';
import {
  buildShareableWorkProductLink,
  exportGoogleDocDisabledResponse,
  exportWorkProductDocx,
  exportWorkProductPdf,
  normalizeWorkProductExportInput,
  WorkProductPdfTextError,
} from '@/lib/drafting/export';

const WorkProductExportSchema = z.object({
  title: z.string().min(1).max(240),
  format: z.enum(['docx', 'pdf', 'google-doc', 'share-link']),
  outputTarget: z.enum(['brief', 'memo', 'sitrep', 'talking-points', 'decision-memo']),
  sections: z.array(z.object({
    heading: z.string().min(1).max(160),
    body: z.string().max(60000),
  })).min(1).max(40),
  sourceCards: z.array(z.object({
    id: z.string().min(1).max(180),
    title: z.string().min(1).max(240),
    url: z.string().url().optional(),
  })).max(200).optional(),
  memoId: z.string().min(1).max(180).optional(),
});

export const POST = withAuth(async (request, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Export requires a PRAXIS account' }, { status: 403 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = WorkProductExportSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid export request', issues: parsed.error.issues }, { status: 400 });
  }

  const input = normalizeWorkProductExportInput(parsed.data);
  if (input.format === 'share-link') {
    const href = buildShareableWorkProductLink({ memoId: input.memoId });
    if (!href) return NextResponse.json({ error: 'memoId is required for share-link export' }, { status: 400 });
    return NextResponse.json({ href });
  }

  if (input.format === 'google-doc') {
    return NextResponse.json(exportGoogleDocDisabledResponse(), { status: 501 });
  }

  let buffer: Buffer;
  try {
    buffer = input.format === 'docx' ? await exportWorkProductDocx(input) : exportWorkProductPdf(input);
  } catch (error) {
    if (error instanceof WorkProductPdfTextError) return NextResponse.json({ error: error.message, code: 'pdf_text_unsupported' }, { status: 422 });
    return NextResponse.json({ error: 'Export could not be created. Your saved work is unchanged; retry or choose another format.', code: 'export_failed' }, { status: 503 });
  }
  const extension = input.format === 'docx' ? 'docx' : 'pdf';
  const contentType = input.format === 'docx'
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/pdf';

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${input.filename}.${extension}"`,
      'Content-Length': String(buffer.length),
    },
  });
});
