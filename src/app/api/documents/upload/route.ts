import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  saveDocument,
  chunkAndSaveDocument,
} from '@/lib/firebase/documents-service';

export const maxDuration = 300;

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

export const POST = withAuth(async (request, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Document upload is not available in demo mode' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const situationId = formData.get('situationId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!situationId) {
      return NextResponse.json({ error: 'situationId is required' }, { status: 400 });
    }

    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';

    if (!ALLOWED_EXTENSIONS.includes(fileType)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${fileType}. Supported: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    let text = '';
    if (fileType === 'txt' || fileType === 'md') {
      text = await file.text();
    } else if (fileType === 'pdf') {
      try {
        const pdfMod = await import('pdf-parse');
        const pdfParse = (pdfMod as unknown as { default: (...args: unknown[]) => unknown }).default || pdfMod;
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await pdfParse(buffer) as { text: string };
        text = result.text;
      } catch {
        text = '[PDF text extraction failed — file stored but text could not be extracted automatically]';
      }
    } else if (fileType === 'docx') {
      try {
        const mammoth = await import('mammoth');
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        text = '[DOCX text extraction failed — file stored but text could not be extracted automatically]';
      }
    }

    const stored = await saveDocument(user.uid, situationId, {
      title: file.name,
      fileType,
      size: file.size,
      text,
      status: text.startsWith('[') ? 'error' : 'uploaded',
      uploadedAt: new Date().toISOString(),
      entityCount: 0,
    });

    if (text.length > 0 && !text.startsWith('[')) {
      chunkAndSaveDocument(user.uid, situationId, stored.id, file.name, text)
        .then((count) => console.log(`[documents] Chunked ${file.name}: ${count} chunks`))
        .catch((err) => console.error('[documents] Chunking failed:', err));
    }

    return NextResponse.json({
      success: true,
      document: {
        id: stored.id,
        title: stored.title,
        fileType: stored.fileType,
        size: stored.size,
        status: stored.status,
        uploadedAt: stored.uploadedAt,
        entityCount: 0,
      },
      message: 'Document uploaded and saved to your situation. Chunking for AI retrieval in progress.',
    });
  } catch (err) {
    console.error('[documents/upload] failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
