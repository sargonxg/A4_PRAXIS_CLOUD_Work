import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // In demo mode, simulate file upload processing
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate a mock document ID
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const document = {
      id: documentId,
      title: file.name,
      fileType: file.name.split('.').pop() || 'unknown',
      size: file.size,
      status: 'processing',
      uploadedAt: new Date().toISOString(),
      entityCount: 0,
    };

    return NextResponse.json({
      success: true,
      document,
      message: 'Document uploaded successfully. Processing will begin shortly.',
    });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
