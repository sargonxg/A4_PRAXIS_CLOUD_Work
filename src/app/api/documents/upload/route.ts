import { NextRequest, NextResponse } from 'next/server';
import { addDocument, type DocumentRecord } from '@/lib/services/document-store';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';

    if (!ALLOWED_EXTENSIONS.includes(fileType)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${fileType}. Supported: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Extract text based on file type
    let text = '';

    if (fileType === 'txt' || fileType === 'md') {
      text = await file.text();
    } else if (fileType === 'pdf') {
      try {
        const pdfMod = await import('pdf-parse');
        const pdfParse = (pdfMod as any).default || pdfMod;
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await pdfParse(buffer);
        text = result.text;
      } catch {
        // pdf-parse not installed or extraction failed
        text = 'PDF text extraction requires the pdf-parse package. The file has been stored but text could not be extracted automatically.';
      }
    } else if (fileType === 'docx') {
      try {
        const mammoth = await import('mammoth');
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch {
        // mammoth not installed or extraction failed
        text = 'DOCX text extraction requires the mammoth package. The file has been stored but text could not be extracted automatically.';
      }
    }

    const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const document: DocumentRecord = {
      id: documentId,
      title: file.name,
      fileType,
      size: file.size,
      text,
      status: 'uploaded',
      uploadedAt: new Date().toISOString(),
      entityCount: 0,
    };

    addDocument(document);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        fileType: document.fileType,
        size: document.size,
        status: document.status,
        uploadedAt: document.uploadedAt,
        entityCount: document.entityCount,
      },
      message: 'Document uploaded successfully. Processing will begin shortly.',
    });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
