import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/services/document-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const document = getDocument(id);

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const textPreview = document.text ? document.text.slice(0, 500) : '';

  return NextResponse.json({
    id: document.id,
    title: document.title,
    fileType: document.fileType,
    size: document.size,
    status: document.status,
    uploadedAt: document.uploadedAt,
    entityCount: document.entityCount,
    preview: textPreview,
    entities: document.entities ?? null,
  });
}
